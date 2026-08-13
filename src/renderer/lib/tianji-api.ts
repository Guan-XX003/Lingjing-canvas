/**
 * 即梦天玑（Seedance）视频生成 API 客户端模块。
 *
 * 职责：
 * - 维护即梦天玑接口的默认配置，并对用户配置做归一化。
 * - 封装对天玑后端的 HTTP 请求（支持桌面端 proxyFetch 代理与普通 fetch 两条通道）。
 * - 提供在任意深度 JSON 结构中按候选 key 查找视频地址 / 缩略图 / 任务 id / 状态 / 进度 / 错误信息的工具。
 * - 编排「文生视频 / 首帧 / 首尾帧 / 参考素材」四种生成模式的提交与轮询全过程，
 *   并把进度、结果、错误回写到画布节点、全局任务列表与持久化状态。
 *
 * 纯逻辑模块，不含 React / JSX 依赖。行为与原始 bundle 完全一致，仅做可读化重命名。
 */

// normalizeVideoAspectRatioValue 是 bundle 内的通用视频比例归一化工具（原 bundle line 3522），
// 非本组函数，从兄弟模块引入。
import { normalizeVideoAspectRatioValue, snapVideoAspectRatioToSupported } from "./video-aspect-ratio";
import {
  WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS,
  WANJUAN_JIXIN_BUILTIN_SEEDANCE_DURATIONS,
  WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS,
  WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS,
  WANJUAN_JIXIN_DEFAULT_API_URL,
  wanjuanMergeModelText,
} from "./jixin-catalog";
import { WanJuanSameModelId } from "./model-id";
import { WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE } from "./upload-defaults";
import { wanjuanClearProjectAssetBindingsFromData } from "./resource";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

declare global {
  interface Window {
    /** 万卷桌面端注入的桥接对象（proxyFetch / uploadPublicMedia 等能力）。 */
    wanjuanDesktop?: any;
  }
}

/** App 新安装和未配置状态始终请求极鑫中转站。 */
export const WANJUAN_TIANJI_DEFAULT_BASE_URL = WANJUAN_JIXIN_DEFAULT_API_URL;
export const WANJUAN_TIANJI_SYNC_SOURCE_JIXIN = `jixin-default`;
export const WANJUAN_TIANJI_SYNC_SOURCE_MANUAL = `manual`;
/** 天玑配置在 localStorage 的镜像 key（chrome.storage 不可用或 token 缺失时兜底）。 */
export const WANJUAN_TIANJI_CONFIG_MIRROR_KEY = `wanjuan.tianjiSeedanceConfig.v1`;
/** 极心默认 API 配置在 apiConfigs 列表中的固定 id。 */
const WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID = `jixin-default`;

/** 即梦天玑配置结构（字段较动态，使用宽松类型）。 */
export interface TianjiSeedanceConfig {
  baseUrl: string;
  token: string;
  sassId: string;
  platform: string;
  models: string;
  durations: string;
  resolutions: string;
  ratios: string;
  generateAudio: boolean;
  watermark: boolean;
  [key: string]: any;
}

/** wanjuanTianjiRequest 的可选项。 */
interface TianjiRequestOptions {
  method?: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  signal?: AbortSignal;
  encoding?: `json` | `form`;
}

/** wanjuanRunTianjiSeedanceVideo 的运行入参（来自调用方编辑器上下文）。 */
interface RunTianjiSeedanceVideoOptions {
  sourceNode?: { data?: Record<string, any> };
  prompt?: string;
  extraPrompts?: string[];
  selectedDuration?: string | number;
  selectedSize?: string;
  imageRefs?: any[];
  videoRefs?: any[];
  audioRefs?: any[];
  nodeId: string;
  projectIdAtStart?: string;
  dailyKey: string;
  dailyCount: number;
  pollingInterval: number;
  maxPollingDuration?: number;
  abortControllers: { current: Map<string, AbortController> };
  showToast: (message: string) => void;
  setDailyCount: (count: number) => void;
  updateNodes: (updater: (nodes: any[]) => any[]) => void;
  updateEdges: (updater: (edges: any[]) => any[]) => void;
  updateGlobalTasks?: (updater: (tasks: any[]) => any[]) => void;
  addTransitResource?: (url: string, kind: string, origin: string) => void;
  persistVideoNodeState: (
    style: Record<string, any>,
    data: Record<string, any>,
    options?: { clearProjectAssetBindings?: string[] },
  ) => Promise<any>;
}

export type TianjiSeedanceGenerationMode = `text-to-video` | `first-frame` | `first-last` | `reference-media`;
export const WANJUAN_TIANJI_GENERATION_MODES: TianjiSeedanceGenerationMode[] = [`text-to-video`, `first-frame`, `first-last`, `reference-media`];
export const wanjuanNormalizeTianjiGenerationMode = (value: any): TianjiSeedanceGenerationMode =>
  (WANJUAN_TIANJI_GENERATION_MODES.includes(String(value || ``) as TianjiSeedanceGenerationMode)
    ? String(value) as TianjiSeedanceGenerationMode
    : `text-to-video`);

/** 按官方协议校验参考素材数量及可选的时长/大小元数据。 */
export const wanjuanValidateTianjiReferenceMedia = (refs: any[] = [], kind: `image` | `video` | `audio`): void => {
  const limits = { image: 9, video: 3, audio: 3 };
  if (refs.length > limits[kind]) throw Error(`天玑${kind === `image` ? `图片` : kind === `video` ? `视频` : `音频`}参考素材最多 ${limits[kind]} 个`);
  if (kind === `video` || kind === `audio`) {
    const maxSingle = kind === `video` ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    const maxDuration = 15;
    let totalDuration = 0;
    refs.forEach((ref: any) => {
      const size = Number(ref?.size || ref?.fileSize || ref?.bytes || 0);
      if (size > maxSingle) throw Error(`天玑参考${kind === `video` ? `视频` : `音频`}单个文件超过官方大小限制`);
      const duration = Number(ref?.duration || ref?.durationSeconds || ref?.seconds || 0);
      if (duration > 0 && (duration < 2 || duration > maxDuration)) throw Error(`天玑参考${kind === `video` ? `视频` : `音频`}单个时长必须在 2–15 秒`);
      totalDuration += duration;
    });
    if (totalDuration > maxDuration) throw Error(`天玑参考${kind === `video` ? `视频` : `音频`}总时长不能超过 15 秒`);
  }
};

export const wanjuanBuildTianjiGenerationRequest = ({
  mode,
  common,
  imageUrls = [],
  videoUrls = [],
  audioUrls = [],
}: {
  mode: any;
  common: Record<string, any>;
  imageUrls?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
}): { endpoint: string; payload: Record<string, any>; generationMode: TianjiSeedanceGenerationMode; encoding: `form` } => {
  const generationMode = wanjuanNormalizeTianjiGenerationMode(mode);
  const payload = { ...common };
  let endpoint = `/api/cut/model/coze-seedance-text-special`;
  if (generationMode === `first-frame`) {
    if (!imageUrls[0]) throw Error(`天玑首帧生视频需要连接至少一张图片`);
    endpoint = `/api/cut/model/coze-seedance-image-first-special`;
    payload.first_frame = imageUrls[0];
  } else if (generationMode === `first-last`) {
    if (!imageUrls[0] || !imageUrls[1]) throw Error(`天玑首尾帧生视频需要连接至少两张图片`);
    endpoint = `/api/cut/model/coze-seedance-image-first-last-special`;
    payload.first_frame = imageUrls[0];
    payload.last_frame = imageUrls[1];
  } else if (generationMode === `reference-media`) {
    if (imageUrls.length === 0 && videoUrls.length === 0 && audioUrls.length === 0)
      throw Error(`天玑参考素材生视频需要连接至少一项图片、视频或音频参考素材`);
    endpoint = `/api/cut/model/coze-seedance-video-special`;
    if (imageUrls.length) payload[`images[]`] = imageUrls;
    if (videoUrls.length) payload[`videos[]`] = videoUrls;
    if (audioUrls.length) payload[`audios[]`] = audioUrls;
  }
  return { endpoint, payload, generationMode, encoding: `form` };
};

export const WANJUAN_TIANJI_TASK_HISTORY_ENDPOINT = `/api/cut/model/coze-run-seedance-special-history`;

/** 官网 v2 的视频任务查询改为 POST JSON；同时发送两个 id 字段兼容代理与上游。 */
export const wanjuanBuildTianjiTaskQuery = (taskId: any) => {
  const id = String(taskId || ``).trim();
  if (!id) throw Error(`天玑任务 ID 不能为空`);
  return {
    endpoint: WANJUAN_TIANJI_TASK_HISTORY_ENDPOINT,
    method: `POST`,
    params: { task_id: id, execute_id: id },
  };
};

/** 兼容官网旧返回 msg.points、代理归一 data.points 及历史顶层 points。 */
export const wanjuanTianjiBalancePoints = (result: any): number | string | null => {
  const candidates = [
    result?.data?.points,
    result?.msg?.points,
    result?.message?.points,
    result?.points,
  ];
  const value = candidates.find((item) => item !== void 0 && item !== null && String(item).trim() !== ``);
  return value === void 0 ? null : value;
};

/** 规范化天玑鉴权头：用户可填写带/不带 Bearer，X-API-Key 始终使用原始 token。 */
export const wanjuanTianjiAuthHeaders = (token: any, sassId = `1`, platform = `web`): Record<string, string> => {
  const rawToken = String(token || ``).trim().replace(/^Bearer\s+/i, ``).trim();
  if (!rawToken) throw Error(`请先在设置里的“即梦天玑”填写 Authorization Token`);
  return {
    "X-API-Key": rawToken,
    Authorization: `Bearer ${rawToken}`,
    "Xx-Sass-Id": String(sassId || `1`).trim() || `1`,
    "Xx-Platform": String(platform || `web`).trim() || `web`,
  };
};

export const WANJUAN_TIANJI_PORTRAIT_ENDPOINTS = {
  createReal: `/api/cut/model/real_authentication`,
  queryRealResult: `/api/cut/model/get-visual-date-result`,
  queryTask: `/api/cut/model/get-task-info`,
  createVirtual: `/api/cut/model/virtal_authentication`,
  syncAssetId: `/api/cut/model/sync-get-asset-id`,
} as const;

/** 人像创建接口可能先返回异步任务；仅从明确任务字段提取，不把 group id 当任务 id。 */
export const wanjuanTianjiFindPortraitTaskId = (result: any): string =>
  wanjuanTianjiFindDeep(result, [`task_id`, `taskId`, `execute_id`, `executeId`]);

export const wanjuanBuildTianjiPortraitTaskParams = (taskId: any): Record<string, string> => {
  const id = String(taskId || ``).trim();
  if (!id) throw Error(`人像任务 ID 不能为空`);
  return { task_id: id, execute_id: id };
};

/** 创建人像组的可见默认名称，避免上游因空名称拒绝请求。 */
export const wanjuanTianjiDefaultPortraitGroupName = (now = Date.now()): string =>
  (() => { const date = new Date(now); const pad = (value: number) => String(value).padStart(2, `0`); return `万卷灵境-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`; })();

/** 即梦天玑默认配置（base 地址、可选模型 / 时长 / 分辨率 / 画幅比例等）。 */
export const wanjuanTianjiSeedanceDefaults: TianjiSeedanceConfig = {
  baseUrl: WANJUAN_TIANJI_DEFAULT_BASE_URL,
  token: ``,
  syncSource: WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
  sassId: `1`,
  platform: `web`,
  models: wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS),
  durations: WANJUAN_JIXIN_BUILTIN_SEEDANCE_DURATIONS,
  resolutions: WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS,
  ratios: WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS,
  generateAudio: true,
  watermark: false,
};

/**
 * 从 chrome 扩展本地存储读取指定 key。
 * 若读取的 tianjiSeedanceConfig 缺 token，或 chrome.storage 不可用，
 * 回退到 localStorage 镜像（WANJUAN_TIANJI_CONFIG_MIRROR_KEY）。
 */
export const wanjuanTianjiStorageGet = (keys: string[] | string): Promise<Record<string, any>> =>
  new Promise((resolve) => {
    const resolveFromMirror = () => {
      let result: Record<string, any> = {};
      try {
        let keyList = Array.isArray(keys) ? keys : [keys],
          mirrored = JSON.parse(window.localStorage?.getItem(WANJUAN_TIANJI_CONFIG_MIRROR_KEY) || `null`);
        if (keyList.includes(`tianjiSeedanceConfig`) && mirrored && typeof mirrored == `object`)
          result.tianjiSeedanceConfig = mirrored;
      } catch {}
      resolve(result);
    };
    try {
      typeof chrome < `u` && chrome.storage?.local
        ? chrome.storage.local.get(keys, (items: any) => {
            let result = items || {};
            let keyList = Array.isArray(keys) ? keys : [keys];
            if (keyList.includes(`tianjiSeedanceConfig`) && !String(result.tianjiSeedanceConfig?.token || ``).trim()) {
              try {
                let mirrored = JSON.parse(window.localStorage?.getItem(WANJUAN_TIANJI_CONFIG_MIRROR_KEY) || `null`);
                if (mirrored && typeof mirrored == `object` && String(mirrored.token || ``).trim()) {
                  result.tianjiSeedanceConfig = {
                    ...(result.tianjiSeedanceConfig && typeof result.tianjiSeedanceConfig == `object`
                      ? result.tianjiSeedanceConfig
                      : {}),
                    ...mirrored,
                  };
                }
              } catch {}
            }
            resolve(result);
          })
        : resolveFromMirror();
    } catch {
      resolveFromMirror();
    }
  });

/**
 * 写入 chrome 扩展本地存储；tianjiSeedanceConfig 同时镜像到 localStorage。
 * chrome.storage 不可用时返回 false。
 */
export const wanjuanTianjiStorageSet = (items: Record<string, any>): Promise<boolean> =>
  new Promise((resolve) => {
    try {
      if (items?.tianjiSeedanceConfig) {
        try {
          window.localStorage?.setItem(
            WANJUAN_TIANJI_CONFIG_MIRROR_KEY,
            JSON.stringify(wanjuanNormalizeTianjiSeedanceConfig(items.tianjiSeedanceConfig)),
          );
        } catch {}
      }
      typeof chrome < `u` && chrome.storage?.local
        ? chrome.storage.local.set(items || {}, () => resolve(true))
        : resolve(false);
    } catch {
      resolve(false);
    }
  });

/** 归一化用户传入的天玑配置：合并默认值并清洗 baseUrl / token / sassId 等字段。 */
export const wanjuanNormalizeTianjiSeedanceConfig = (config: any = {}): TianjiSeedanceConfig => {
  let baseUrl = String(Object.prototype.hasOwnProperty.call(config || {}, `baseUrl`) ? config?.baseUrl : WANJUAN_TIANJI_DEFAULT_BASE_URL)
    .replace(/\s+/g, ``)
    .replace(/\/+$/, ``);
  // 历史版本曾允许保存服务器内部上游地址；客户端统一回落到极鑫中转，不再直连上游。
  if (/^https?:\/\/(?:ai\.)?kulunli\.cn(?::\d+)?$/i.test(baseUrl) || /^https?:\/\/aiuse\.phad\.cn(?::\d+)?$/i.test(baseUrl))
    baseUrl = WANJUAN_TIANJI_DEFAULT_BASE_URL;
  return {
  ...wanjuanTianjiSeedanceDefaults,
  ...(config && typeof config == `object` ? config : {}),
  baseUrl,
  token: String(config?.token || ``).trim(),
  syncSource:
    config?.syncSource === WANJUAN_TIANJI_SYNC_SOURCE_MANUAL
      ? WANJUAN_TIANJI_SYNC_SOURCE_MANUAL
      : WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
  sassId: String(config?.sassId || `1`).trim() || `1`,
  platform: String(config?.platform || `web`).trim() || `web`,
  models: String(config?.models || ``).trim() || wanjuanTianjiSeedanceDefaults.models,
  durations: String(config?.durations || ``).trim() || wanjuanTianjiSeedanceDefaults.durations,
  resolutions: String(config?.resolutions || ``).trim() || wanjuanTianjiSeedanceDefaults.resolutions,
  ratios: String(config?.ratios || ``).trim() || wanjuanTianjiSeedanceDefaults.ratios,
  generateAudio: config?.generateAudio !== false,
  watermark: config?.watermark === true,
  };
};

export const wanjuanNormalizeTianjiApiBaseUrl = (value: any): string =>
  String(value || ``)
    .replace(/\s+/g, ``)
    .replace(/\/+$/, ``);

export const wanjuanBuildSyncedTianjiConfigFromJixin = (
  currentConfig: any = {},
  jixinConfig: any = null,
  { force = false }: { force?: boolean } = {},
): TianjiSeedanceConfig => {
  let jixinBaseUrl = wanjuanNormalizeTianjiApiBaseUrl(jixinConfig?.url || WANJUAN_JIXIN_DEFAULT_API_URL) || WANJUAN_JIXIN_DEFAULT_API_URL,
    rawCurrentBaseUrl = wanjuanNormalizeTianjiApiBaseUrl(currentConfig?.baseUrl || ``),
    hasExplicitSyncSource = Object.prototype.hasOwnProperty.call(currentConfig || {}, `syncSource`);
  if (!force && !hasExplicitSyncSource && rawCurrentBaseUrl && rawCurrentBaseUrl !== WANJUAN_TIANJI_DEFAULT_BASE_URL && rawCurrentBaseUrl !== jixinBaseUrl) {
    return wanjuanMarkTianjiConfigManual(currentConfig);
  }
  let current = wanjuanNormalizeTianjiSeedanceConfig(currentConfig || {});
  if (!force && current.syncSource === WANJUAN_TIANJI_SYNC_SOURCE_MANUAL) return current;
  return wanjuanNormalizeTianjiSeedanceConfig({
    ...current,
    baseUrl: jixinBaseUrl,
    token: String(jixinConfig?.key || ``).trim(),
    syncSource: WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
  });
};

export const wanjuanMarkTianjiConfigManual = (config: any = {}): TianjiSeedanceConfig =>
  wanjuanNormalizeTianjiSeedanceConfig({
    ...(config && typeof config === `object` ? config : {}),
    syncSource: WANJUAN_TIANJI_SYNC_SOURCE_MANUAL,
  });

/** 判断某个 API 配置是否是极心默认配置（按固定 id 或 base 地址）。 */
export const wanjuanIsJixinApiConfig = (config: any): boolean =>
  config?.id === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID ||
  wanjuanNormalizeTianjiApiBaseUrl(config?.url) === wanjuanNormalizeTianjiApiBaseUrl(WANJUAN_JIXIN_DEFAULT_API_URL);

// wanjuanFindLegacyJixinApiKey 移至 jixin-catalog（避免与其形成循环导入），此处转发导出。
import { wanjuanFindLegacyJixinApiKey } from "./jixin-catalog";
export { wanjuanFindLegacyJixinApiKey };

/**
 * 解析出用于天玑同步的极心 API 配置。
 * 优先用传入的候选配置，其次是 apiConfigs 里的极心配置；
 * key 缺失时回退到旧版散落的 apiKey 字段；两者皆无时返回 null。
 */
export const wanjuanResolveJixinApiConfigForTianji = (candidateConfig: any = null, stored: any = {}): any => {
  let storedApiConfigs = Array.isArray(stored.apiConfigs) ? stored.apiConfigs : [],
    storedJixinConfig = storedApiConfigs.find(wanjuanIsJixinApiConfig) || null,
    sourceConfig = candidateConfig || storedJixinConfig;
  if (!sourceConfig && !wanjuanFindLegacyJixinApiKey(stored)) return null;
  let sourceBaseUrl =
      wanjuanNormalizeTianjiApiBaseUrl(sourceConfig?.url || storedJixinConfig?.url || WANJUAN_JIXIN_DEFAULT_API_URL) ||
      WANJUAN_JIXIN_DEFAULT_API_URL,
    sourceKey =
      String(sourceConfig?.key || ``).trim() ||
      String(storedJixinConfig?.key || ``).trim() ||
      wanjuanFindLegacyJixinApiKey(stored);
  return {
    ...(storedJixinConfig && typeof storedJixinConfig == `object` ? storedJixinConfig : {}),
    ...(sourceConfig && typeof sourceConfig == `object` ? sourceConfig : {}),
    id: sourceConfig?.id || storedJixinConfig?.id || WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
    name: sourceConfig?.name || storedJixinConfig?.name || `极鑫`,
    url: sourceBaseUrl,
    key: sourceKey,
  };
};

/**
 * 读取并返回与极心同步后的天玑配置。
 * 无极心配置时返回当前配置；同步结果有变化时回写存储。
 */
export const wanjuanGetSyncedTianjiSeedanceConfig = async (
  options: { force?: boolean } = {},
): Promise<TianjiSeedanceConfig> => {
  let stored = await wanjuanTianjiStorageGet([
      `tianjiSeedanceConfig`,
      `apiConfigs`,
      `advancedSettingsUnlocked`,
      `apiKey`,
      `textApiKey`,
      `imageApiKey`,
      `videoApiKey`,
      `audioApiKey`,
    ]),
    currentConfig = wanjuanNormalizeTianjiSeedanceConfig(stored.tianjiSeedanceConfig || {}),
    jixinConfig = wanjuanResolveJixinApiConfigForTianji(
      (Array.isArray(stored.apiConfigs) ? stored.apiConfigs : []).find(wanjuanIsJixinApiConfig),
      stored,
    );
  if (!jixinConfig) return currentConfig;
  let nextConfig = wanjuanBuildSyncedTianjiConfigFromJixin(currentConfig, jixinConfig, {
    ...options,
    force: options.force === true,
  });
  JSON.stringify(currentConfig) !== JSON.stringify(nextConfig) &&
    (await wanjuanTianjiStorageSet({
      tianjiSeedanceConfig: nextConfig,
    }));
  return nextConfig;
};

/** 把以空白 / 逗号 / 顿号分隔的字符串拆为列表，返回首个非空项，无则返回 fallback。 */
export const wanjuanTianjiFirstListValue = (list: any, fallback = ``): string =>
  String(list || ``)
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)[0] || fallback;

/** 将字符串按 UTF-8 编码后做 base64，分块处理以避免超大字符串触发栈溢出。 */
export const wanjuanTianjiBase64Encode = (input: any): string => {
  let bytes = new TextEncoder().encode(String(input || ``)),
    binary = ``;
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    let chunk = bytes.slice(offset, offset + 8192);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

/** base64 解码回 UTF-8 字符串。 */
export const wanjuanTianjiBase64Decode = (input: any): string => {
  let binary = atob(String(input || ``)),
    bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

/**
 * 向即梦天玑后端发起请求。
 *
 * 非 GET 请求默认以 application/json 提交；生成接口显式选择 form 时按官网契约编码。
 * 优先走桌面端 proxyFetch 代理，
 * 否则回退到浏览器 fetch。统一解析返回 JSON 并对 HTTP / 业务错误码抛出异常。
 */
export const wanjuanTianjiRequest = async (
  rawConfig: any,
  path: string,
  { method = `POST`, params = {}, query = {}, signal, encoding = `json` }: TianjiRequestOptions = {},
): Promise<any> => {
  let config = wanjuanNormalizeTianjiSeedanceConfig(rawConfig);
  if (!config.token) throw Error(`请先在设置里的“即梦天玑”填写 Authorization Token`);
  let url = new URL(`${config.baseUrl}${path.startsWith(`/`) ? path : `/${path}`}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    value !== void 0 && value !== null && String(value) !== `` && url.searchParams.set(key, String(value));
  });
    let headers: Record<string, string> = wanjuanTianjiAuthHeaders(config.token, config.sassId, config.platform),
    body = ``;
  if (method !== `GET`) {
    if (encoding === `form`) {
      let form = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value === void 0 || value === null) return;
        if (Array.isArray(value)) value.forEach((item) => item !== void 0 && item !== null && form.append(key, String(item)));
        else form.append(key, String(value));
      });
      body = form.toString();
      headers[`Content-Type`] = `application/x-www-form-urlencoded`;
    } else {
      body = JSON.stringify(params || {});
      headers[`Content-Type`] = `application/json`;
    }
  }
  let response: { ok: boolean; status: number; statusText: string; text: () => Promise<string> };
  if (window.wanjuanDesktop?.proxyFetch) {
    // 取消机制：AbortSignal 无法跨 contextBridge 传递，改用 requestId + abortProxyFetch。
    let proxyRequestId = `tianji-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      abortProxyRequest = () => window.wanjuanDesktop?.abortProxyFetch?.(proxyRequestId);
    if (signal?.aborted) throw Error(`生成已取消`);
    signal?.addEventListener(`abort`, abortProxyRequest, { once: true });
    let proxyResult;
    try {
      proxyResult = await window.wanjuanDesktop.proxyFetch({
        requestId: proxyRequestId,
        url: url.toString(),
        method,
        headers,
        bodyBase64: body ? wanjuanTianjiBase64Encode(body) : ``,
        requestTimeout: 18e4,
      });
    } finally {
      signal?.removeEventListener(`abort`, abortProxyRequest);
    }
    if (signal?.aborted) throw Error(`生成已取消`);
    if (!proxyResult?.ok) throw Error(`天玑网络请求失败：${proxyResult?.error || `桌面代理不可用`}`);
    response = {
      ok: proxyResult.status >= 200 && proxyResult.status < 300,
      status: proxyResult.status,
      statusText: proxyResult.statusText || ``,
      text: async () => wanjuanTianjiBase64Decode(proxyResult.bodyBase64),
    };
  } else
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body || void 0,
      signal,
    });
  let text = await response.text(),
    json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    const detail = json?.message || json?.msg || json?.error?.message || json?.error?.msg || ``;
    if (response.status === 401 || response.status === 403) throw Error(`天玑鉴权失败：${detail || `请检查极鑫用户 Token`}`);
    throw Error(`天玑上游请求失败：${detail || `${response.status} ${response.statusText}`}`);
  }
  // code 为 0 等 falsy 值也必须视为错误，不能被 && 短路吞掉。
  if (json?.code !== undefined && Number(json.code) !== 200) {
    const detail = json.message || json.msg || json?.error?.message || json?.error?.msg || ``;
    if ([401, 403].includes(Number(json.code))) throw Error(`天玑鉴权失败：${detail || `请检查极鑫用户 Token`}`);
    throw Error(`天玑业务失败：${detail || `接口返回错误码 ${json.code}`}`);
  }
  return json;
};

/**
 * 在任意深度的对象 / 数组中递归查找首个命中候选 key（大小写不敏感）的非空字符串值。
 * 使用 seen 集合防止循环引用导致的无限递归。
 */
export const wanjuanTianjiFindDeep = (root: any, keys: string[]): string => {
  let keySet = new Set(keys.map((key) => String(key).toLowerCase())),
    search = (value: any, seen: Set<any> = new Set()): string => {
      if (value === null || value === void 0 || seen.has(value)) return ``;
      if (typeof value == `string` || typeof value == `number`) return ``;
      if (Array.isArray(value)) {
        seen.add(value);
        for (let item of value) {
          let found = search(item, seen);
          if (found) return found;
        }
        return ``;
      }
      if (typeof value == `object`) {
        seen.add(value);
        for (let [key, val] of Object.entries(value)) {
          if (keySet.has(String(key).toLowerCase()) && val !== null && val !== void 0 && String(val).trim())
            return String(val).trim();
        }
        for (let val of Object.values(value)) {
          let found = search(val, seen);
          if (found) return found;
        }
      }
      return ``;
    };
  return search(root);
};

/** 从返回结构中查找视频地址，仅接受 http(s) 或 blob 协议，并剔除反引号 / 空白。 */
export const wanjuanTianjiFindVideoUrl = (data: any): string => {
  let url = wanjuanTianjiFindDeep(data, [
    `video_url`,
    `videoUrl`,
    `result_url`,
    `resultUrl`,
    `output_url`,
    `outputUrl`,
    `download_url`,
    `downloadUrl`,
    `url`,
  ]);
  return /^https?:\/\//i.test(url) || /^blob:/i.test(url) ? url.replace(/[`\s]/g, ``) : ``;
};

/** 从返回结构中查找任务 id（execute_id / task_id / id 等）。 */
export const wanjuanTianjiFindTaskId = (data: any): string =>
  wanjuanTianjiFindDeep(data, [`execute_id`, `executeId`, `task_id`, `taskId`, `id`]);

const wanjuanTianjiRawStatus = (data: any): string =>
  String(
    data?.status ??
      data?.data?.status ??
      data?.data?.state ??
      data?.data?.task_status ??
      data?.data?.taskStatus ??
      data?.data?.status_text ??
      data?.data?.statusText ??
      data?.result?.status ??
      data?.result?.state ??
      data?.result?.task_status ??
      data?.output?.status ??
      data?.output?.state ??
      data?.task?.status ??
      data?.task?.state ??
      data?.task?.task_status ??
      wanjuanTianjiFindDeep(data, [
        `status`,
        `state`,
        `task_status`,
        `taskStatus`,
        `status_text`,
        `statusText`,
        `status_msg`,
        `statusMsg`,
      ]) ??
      ``,
  ).trim();

/** 从返回结构中查找缩略图 / 封面 / 末帧地址，仅接受 http(s)。 */
export const wanjuanTianjiFindThumbUrl = (data: any): string => {
  let url = wanjuanTianjiFindDeep(data, [
    `thumbnail_url`,
    `thumbnailUrl`,
    `cover_url`,
    `coverUrl`,
    `last_frame_url`,
    `lastFrameUrl`,
  ]);
  return /^https?:\/\//i.test(url) ? url.replace(/[`\s]/g, ``) : ``;
};

/** 提取任务状态字符串，并兼容中转站中文 / 数字状态。 */
export const wanjuanTianjiStatus = (data: any): string => {
  let rawStatus = wanjuanTianjiRawStatus(data),
    normalized = rawStatus.toLowerCase().replace(/[\s_-]+/g, ``),
    serialized = JSON.stringify(data || {}).toLowerCase();
  if (!normalized && /失败|退款|退费|已退|拒绝|驳回|取消|终止|过期|异常|错误/.test(serialized)) return `failed`;
  if (/失败|退款|退费|已退|拒绝|驳回|取消|终止|过期|异常|错误/.test(rawStatus)) return `failed`;
  if (/成功|完成|已完成/.test(rawStatus)) return `succeeded`;
  if (/排队|等待|提交/.test(rawStatus)) return `pending`;
  if (/生成|运行|处理中|执行中/.test(rawStatus)) return `running`;
  if ([`3`, `4`, `-1`, `-2`].includes(normalized)) return `failed`;
  if ([`2`, `200`].includes(normalized)) return `succeeded`;
  if ([`0`].includes(normalized)) return `pending`;
  if ([`1`].includes(normalized)) return `running`;
  if ([`failure`, `failed`, `fail`, `error`, `expired`, `canceled`, `cancelled`, `rejected`, `refunded`, `refund`, `terminated`, `aborted`, `denied`].includes(normalized)) return `failed`;
  if ([`succeeded`, `completed`, `complete`, `success`, `done`, `finished`].includes(normalized)) return `succeeded`;
  if ([`queued`, `queue`, `pending`, `waiting`, `created`, `submitted`].includes(normalized)) return `pending`;
  if ([`running`, `processing`, `generating`, `inprogress`, `progress`, `executing`].includes(normalized)) return `running`;
  return rawStatus.toLowerCase();
};

/** 提取进度百分比：0~1 的小数会被放大到百分制，结果限制在 0~99 之间。 */
export const wanjuanTianjiFindProgress = (data: any): number => {
  let progress = Number(
    wanjuanTianjiFindDeep(data, [`progress`, `percent`, `percentage`, `rate`, `Progress`, `Percent`]),
  );
  if (isNaN(progress)) return NaN;
  if (progress > 0 && progress <= 1) progress *= 100;
  return Math.min(99, Math.max(0, Math.round(progress)));
};

const wanjuanTianjiPortraitAssetId = (media: any): string =>
  String(
    media?.tianjiPortraitAssetId ||
      media?.portraitAssetId ||
      media?.portrait_asset_id ||
      media?.assetId ||
      media?.asset_id ||
      ``,
  ).trim().replace(/^asset:\/\//i, ``);

const wanjuanIsTianjiPortrait = (media: any): boolean =>
  Boolean(
    media &&
      typeof media == `object` &&
      (media.isTianjiPortrait === true ||
        media.source === `tianji-portrait` ||
        media.sourceOrigin === `tianji-portrait` ||
        media.mediaSourceOrigin === `tianji-portrait` ||
        media.type === `image/tianji-portrait`),
  );

/** 把原始状态码映射为中文进度文案（排队中 / 生成中）。 */
export const wanjuanTianjiStatusLabel = (status: any): string => {
  let normalized = String(status || ``).toLowerCase();
  if ([`queued`, `queue`, `pending`, `waiting`, `created`, `submitted`].includes(normalized)) return `排队中`;
  if ([`running`, `processing`, `generating`, `in_progress`, `progress`].includes(normalized)) return `生成中`;
  return normalized ? `生成中` : `生成中`;
};

/**
 * 从失败返回结构中提取人类可读的错误信息。
 * 优先取常见嵌套字段，再深度查找；过滤掉无意义的 "[object Object]" / "异步查询成功"，
 * 最终回退到错误码或通用兜底文案。
 */
export const wanjuanTianjiErrorMessage = (data: any): string => {
  let message =
    data?.data?.message ||
    data?.data?.msg ||
    data?.data?.error_message ||
    data?.data?.errorMessage ||
    data?.data?.fail_reason ||
    data?.data?.failReason ||
    data?.data?.reason ||
    data?.data?.detail ||
    data?.result?.message ||
    data?.result?.msg ||
    data?.output?.message ||
    data?.output?.msg ||
    data?.task?.message ||
    data?.task?.msg ||
    wanjuanTianjiFindDeep(data, [
      `message`,
      `msg`,
      `error_message`,
      `errorMessage`,
      `fail_reason`,
      `failReason`,
      `reason`,
      `detail`,
      `error`,
    ]);
  if (message && !/^\[object Object\]$/i.test(String(message)) && !/^异步查询成功$/.test(String(message)))
    return /退款|退费|已退/i.test(String(message)) ? `任务失败（积分已退款）：${String(message)}` : String(message);
  if (/退款|退费|已退/.test(JSON.stringify(data || {}))) return `即梦天玑任务失败，接口返回显示积分已退款`;
  let code = wanjuanTianjiFindDeep(data, [`code`]);
  return code && String(code) !== `200`
    ? `接口返回错误码：${code}`
    : `即梦天玑任务返回失败状态，但接口没有提供具体错误信息`;
};

/**
 * 把参考素材（图片 / 视频 / 音频）解析为公网 URL。
 * 已是 http(s) 直接返回；否则通过桌面端 uploadPublicMedia 上传后取回公网地址。
 * 本地未回传的天玑人像会直接抛错提示刷新。
 */
export const wanjuanTianjiMediaUrl = async (media: any, kind = `image`, uploadOptions: any = {}): Promise<string> => {
  if (media && typeof media == `object` && media.localUploaded === true)
    throw Error(`这张天玑人像还没有从素材库返回，请先刷新天玑素材列表后再生成`);
  let isTianjiPortrait = wanjuanIsTianjiPortrait(media),
    portraitBindingStatus = String(media?.tianjiPortraitBindingStatus || ``).trim().toLowerCase(),
    portraitAssetId = wanjuanTianjiPortraitAssetId(media),
    portraitPreviewUrl = String(media?.tianjiPortraitPreviewUrl || ``).trim();
  if (isTianjiPortrait) {
    if (portraitBindingStatus !== `ready` || !portraitAssetId)
      throw Error(media.tianjiPortraitBindingMessage || (portraitBindingStatus ? `这张天玑人像尚未完成审核和素材绑定` : `这张天玑人像缺少 Active 状态证明，请刷新人像库后重新选择`));
    if (!/^https?:\/\//i.test(portraitPreviewUrl))
      throw Error(`这张已审核天玑人像缺少可提交的 HTTPS 素材地址，请刷新人像库后重新选择`);
    return portraitPreviewUrl;
  }
  let raw =
    media && typeof media == `object`
      ? String(media.url || media.localPath || media.path || media.imageUrl || media.thumbnailUrl || ``).trim()
      : String(media || ``).trim();
  if (!raw) return ``;
  if (/^asset:\/\//i.test(raw))
    throw Error(`即梦天玑参考素材只接受 HTTP(S) 地址，当前素材属于其他兼容模式，不能直接用于天玑生成`);
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!window.wanjuanDesktop?.uploadPublicMedia && !window.wanjuanDesktop?.uploadTosMedia && !window.wanjuanDesktop?.uploadCustomPublicMedia && !window.wanjuanDesktop?.uploadQiniuMedia)
    throw Error(`天玑模式参考${kind === `video` ? `视频` : kind === `audio` ? `音频` : `图片`}必须是公网 URL`);
  let uploadMode = String(uploadOptions.uploadMode || uploadOptions.seedanceUploadMode || WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE).trim(),
    filename = `tianji-seedance-${kind}-${Date.now()}`;
  let uploadResult =
    uploadMode === `tos` && typeof window.wanjuanDesktop?.uploadTosMedia == `function`
      ? await window.wanjuanDesktop.uploadTosMedia({
          url: raw,
          kind,
          filename,
          tos: uploadOptions.tosConfig || {},
        })
      : uploadMode === `custom` && typeof window.wanjuanDesktop?.uploadCustomPublicMedia == `function`
        ? await window.wanjuanDesktop.uploadCustomPublicMedia({
            url: raw,
            kind,
            filename,
            customUpload: uploadOptions.customPublicUploadConfig || {},
          })
        : uploadMode === `qiniu` && typeof window.wanjuanDesktop?.uploadQiniuMedia == `function`
          ? await window.wanjuanDesktop.uploadQiniuMedia({
              url: raw,
              kind,
              filename,
              qiniu: uploadOptions.qiniuConfig || {},
            })
          : await window.wanjuanDesktop.uploadPublicMedia({
              url: raw,
              kind,
              filename,
            });
  if (!uploadResult?.ok || !uploadResult.url)
    throw Error(uploadResult?.error || `天玑模式参考${kind === `video` ? `视频` : kind === `audio` ? `音频` : `图片`}上传失败`);
  return uploadResult.url;
};

/**
 * 即梦天玑 Seedance 视频生成主流程。
 *
 * 步骤：读取并归一化配置 → 组装提示词 / 模型 / 分辨率 / 时长 / 画幅 → 解析参考素材 →
 * 按生成模式（文生视频 / 首帧 / 首尾帧 / 参考素材）选择接口并补充入参 → 提交任务并写入全局任务列表与节点状态 →
 * 按 pollingInterval 轮询历史接口，处理成功 / 失败 / 进行中三种状态，超时或取消时抛错。
 */
export async function wanjuanRunTianjiSeedanceVideo(options: RunTianjiSeedanceVideoOptions): Promise<void> {
  let config = await wanjuanGetSyncedTianjiSeedanceConfig(),
    nodeData = options.sourceNode?.data || {},
    tianjiModelText = nodeData.tianjiSeedanceModel || config.models,
    tianjiModelCandidates = String(tianjiModelText || ``)
      .split(/[\s,，、]+/)
      .map((part) => part.trim())
      .filter(Boolean),
    explicitTianjiModel = String(nodeData.tianjiSelectedModel || nodeData.selectedModel || ``).trim(),
    prompt = (
      Array.isArray(options.extraPrompts) && options.extraPrompts.length > 0
        ? `${options.extraPrompts.join(`\n`)}\n${options.prompt || ``}`
        : options.prompt || ``
    ).trim(),
    model =
      explicitTianjiModel &&
      tianjiModelCandidates.some((candidate) => WanJuanSameModelId(candidate, explicitTianjiModel))
        ? explicitTianjiModel
        : wanjuanTianjiFirstListValue(tianjiModelText || nodeData.videoModel || config.models),
    resolution = String(
      nodeData.selectedResolution ||
        wanjuanTianjiFirstListValue(nodeData.seedanceResolutions || config.resolutions, `720p`),
    ).trim(),
    duration = String(
      nodeData.selectedSeconds ||
        options.selectedDuration ||
        wanjuanTianjiFirstListValue(nodeData.videoDurations || config.durations, `5`),
    ).trim(),
    ratio = String(
      nodeData.size ||
        options.selectedSize ||
        wanjuanTianjiFirstListValue(nodeData.seedanceRatios || nodeData.videoResolutions || config.ratios, `16:9`),
    ).trim();
  if (!ratio.includes(`:`)) ratio = normalizeVideoAspectRatioValue(ratio, `1280x720`);
  // 上游只接受固定几个画幅，浮点比例（如 2.35:1）就近吸附到配置的候选列表。
  {
    let supportedRatios = String(nodeData.seedanceRatios || nodeData.videoResolutions || config.ratios || ``)
      .split(/[\s,，、]+/)
      .map((item: string) => item.trim())
      .filter((item: string) => item.includes(`:`));
    ratio = snapVideoAspectRatioToSupported(ratio, supportedRatios.length ? supportedRatios : void 0);
  }
  if (!model) throw Error(`请先在设置中配置天玑 Seedance 模型`);
  let generationMode = wanjuanNormalizeTianjiGenerationMode(nodeData.tianjiSeedanceGenerationMode),
    commonPayload: any = {
      duration,
      ratio,
      prompt,
      watermark: nodeData.watermark === void 0 ? config.watermark : nodeData.watermark === true,
      model_name: model,
      resolution,
      generate_audio: nodeData.generateAudio === void 0 ? config.generateAudio : nodeData.generateAudio !== false,
    },
    abortControllers = options.abortControllers,
    abortController = new AbortController();
  abortControllers.current.set(options.nodeId, abortController);
  let resolveMediaUrls = async (refs: any[], kind: `image` | `video` | `audio`) => {
      wanjuanValidateTianjiReferenceMedia(refs, kind);
      let urls: string[] = [];
      for (let ref of refs) {
        let mediaUrl = await wanjuanTianjiMediaUrl(ref, kind, {
          uploadMode: nodeData.seedanceUploadMode,
          tosConfig: nodeData.tosConfig,
          customPublicUploadConfig: nodeData.customPublicUploadConfig,
          qiniuConfig: nodeData.qiniuConfig,
        });
        mediaUrl && urls.push(mediaUrl);
      }
      return urls;
    },
    imageUrls = generationMode === `text-to-video` ? [] : await resolveMediaUrls(options.imageRefs || [], `image`),
    videoUrls = generationMode === `reference-media` ? await resolveMediaUrls(options.videoRefs || [], `video`) : [],
    audioUrls = generationMode === `reference-media` ? await resolveMediaUrls(options.audioRefs || [], `audio`) : [];
  if (!prompt) throw Error(`请输入天玑提示词`);
  const generationRequest = wanjuanBuildTianjiGenerationRequest({
    mode: generationMode,
    common: commonPayload,
    imageUrls,
    videoUrls,
    audioUrls,
  });
  const { endpoint, payload, encoding } = generationRequest;
  generationMode = generationRequest.generationMode;
  let requestSummary = {
    endpoint,
    generationMode,
    promptPreview: prompt.slice(0, 160),
    imageCount: imageUrls.length,
    videoCount: videoUrls.length,
    audioCount: audioUrls.length,
    imageRefs: imageUrls.map((url) =>
      String(url || ``).slice(0, 120),
    ),
    hasTianjiAssetReference: false,
  };
  options.showToast(`即梦天玑任务提交中...`);
  let submitResponse = await wanjuanTianjiRequest(config, endpoint, {
      params: payload,
      encoding,
      signal: abortController.signal,
    }),
    taskId = wanjuanTianjiFindTaskId(submitResponse);
  if (!taskId) throw Error(`即梦天玑提交成功但未返回 execute_id`);
  (options.updateGlobalTasks &&
    options.updateGlobalTasks((tasks) => [
      ...tasks,
      {
        id: taskId,
        type: `video`,
        provider: `tianji-seedance`,
        apiBaseUrl: config.baseUrl,
        modelName: model,
        projectId: options.projectIdAtStart,
        nodeId: options.nodeId,
        status: `pending`,
        progress: 0,
        createdAt: Date.now(),
        prompt: options.prompt,
        requestProfile: requestSummary,
      },
    ]),
    options.updateNodes((nodes) =>
      nodes.map((node) =>
        node.id === options.nodeId
          ? {
              ...node,
              data: {
                ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
                seedanceTaskId: taskId,
                tianjiExecuteId: taskId,
                videoUrl: void 0,
                thumbnailUrl: void 0,
                resultData: void 0,
                loading: true,
                progress: 1,
                errorMessage: void 0,
                loadingText: `任务已提交，等待查询...`,
              },
            }
          : node,
      ),
    ),
    await options.persistVideoNodeState(
      {},
      {
        seedanceTaskId: taskId,
        tianjiExecuteId: taskId,
        videoUrl: void 0,
        thumbnailUrl: void 0,
        resultData: void 0,
        loading: true,
        progress: 1,
        errorMessage: void 0,
        loadingText: `任务已提交，等待查询...`,
      },
      {
        clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`],
      },
    ),
    localStorage.setItem(options.dailyKey, (options.dailyCount + 1).toString()),
    options.setDailyCount(options.dailyCount + 1),
    options.showToast(`即梦天玑任务提交成功，正在生成中...`));
  let done = false,
    pollCount = 0,
    consecutiveErrors = 0,
    maxPollingMs = Math.max(5e3, (Number(options.maxPollingDuration) || 600) * 1e3),
    startTime = Date.now();
  for (; !done; ) {
    if (abortController.signal.aborted) throw Error(`生成已取消`);
    if (Date.now() - startTime >= maxPollingMs)
      throw Error(`即梦天玑视频生成超时，请在设置中增大全局异步轮询最大时长后重试`);
    await new Promise((resolve) => setTimeout(resolve, options.pollingInterval));
    pollCount++;
    try {
      const taskQuery = wanjuanBuildTianjiTaskQuery(taskId);
      let statusResponse = await wanjuanTianjiRequest(config, taskQuery.endpoint, {
          method: taskQuery.method,
          params: taskQuery.params,
          signal: abortController.signal,
        }),
        status = wanjuanTianjiStatus(statusResponse),
        videoUrl = wanjuanTianjiFindVideoUrl(statusResponse),
        thumbUrl = wanjuanTianjiFindThumbUrl(statusResponse),
        statusLabel = wanjuanTianjiStatusLabel(status);
      consecutiveErrors = 0;
      // 只按 status 判定完成；不再用 videoUrl 兜底，避免预览片段被当成最终结果。
      if ([`succeeded`, `completed`, `complete`, `success`, `done`].includes(status)) {
        if (!videoUrl) throw Error(`即梦天玑任务已完成，但未返回视频地址`);
        let displayWidth = 320,
          displayHeight = 320,
          aspectRatioCss: string | null = null,
          ratioMatch = String(ratio || `16:9`).match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
        if (ratioMatch) {
          let ratioW = Number(ratioMatch[1]),
            ratioH = Number(ratioMatch[2]);
          if (!isNaN(ratioW) && !isNaN(ratioH) && ratioH > 0) {
            let aspectRatio = ratioW / ratioH;
            (aspectRatioCss = `${ratioW} / ${ratioH}`),
              aspectRatio > 1
                ? ((displayWidth = Math.min(600, Math.max(320, 360 * aspectRatio))),
                  (displayHeight = displayWidth / aspectRatio))
                : aspectRatio < 1
                ? ((displayHeight = 420), (displayWidth = displayHeight * aspectRatio))
                : ((displayHeight = 320), (displayWidth = displayHeight));
          }
        }
        (options.updateGlobalTasks &&
          options.updateGlobalTasks((tasks) =>
            tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: `completed`,
                    progress: 100,
                    resultUrl: videoUrl,
                    thumbnailUrl: thumbUrl,
                  }
                : task,
            ),
          ),
          options.updateNodes((nodes) =>
            nodes.map((node) =>
              node.id === options.nodeId &&
              (node.data?.seedanceTaskId === taskId ||
                node.data?.taskId === taskId ||
                node.data?.tianjiExecuteId === taskId)
                ? {
                    ...node,
                    style: {
                      ...node.style,
                      width: displayWidth,
                      height: displayHeight + 24,
                    },
                    data: {
                      ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
                      taskId: void 0,
                      seedanceTaskId: taskId,
                      tianjiExecuteId: taskId,
                      videoUrl,
                      thumbnailUrl: thumbUrl,
                      videoAspectRatio: aspectRatioCss,
                      loading: false,
                      progress: 100,
                      errorMessage: void 0,
                      loadingText: void 0,
                    },
                  }
                : node,
            ),
          ),
          await options.persistVideoNodeState(
            {
              width: displayWidth,
              height: displayHeight + 24,
            },
            {
              taskId: void 0,
              seedanceTaskId: taskId,
              tianjiExecuteId: taskId,
              videoUrl,
              thumbnailUrl: thumbUrl,
              videoAspectRatio: aspectRatioCss,
              loading: false,
              progress: 100,
              errorMessage: void 0,
              loadingText: void 0,
            },
            {
              clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`],
            },
          ),
          options.updateEdges((edges) =>
            edges.map((edge) => (edge.target === options.nodeId ? { ...edge, animated: false } : edge)),
          ),
          options.addTransitResource && options.addTransitResource(videoUrl, `video`, `generated`),
          options.showToast(`即梦天玑视频生成成功！`));
        done = true;
      } else if (status === `failed`) {
        let failureMessage = wanjuanTianjiErrorMessage(statusResponse);
        (options.updateGlobalTasks &&
          options.updateGlobalTasks((tasks) =>
            tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: `failed`,
                    errorMsg: failureMessage,
                  }
                : task,
            ),
          ),
          options.updateNodes((nodes) =>
            nodes.map((node) =>
              node.id === options.nodeId &&
              (node.data?.seedanceTaskId === taskId ||
                node.data?.taskId === taskId ||
                node.data?.tianjiExecuteId === taskId)
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      loading: false,
                      progress: 0,
                      errorMessage: failureMessage,
                      loadingText: void 0,
                    },
                  }
                : node,
            ),
          ),
          await options.persistVideoNodeState(
            {},
            {
              loading: false,
              progress: 0,
              errorMessage: failureMessage,
              loadingText: void 0,
            },
          ),
          options.updateEdges((edges) =>
            edges.map((edge) => (edge.target === options.nodeId ? { ...edge, animated: false } : edge)),
          ));
        let failureError: any = Error(failureMessage);
        failureError.terminal = true;
        throw failureError;
      } else {
        let progress = wanjuanTianjiFindProgress(statusResponse),
          hasRealProgress = !isNaN(progress);
        progress = hasRealProgress ? Math.min(99, Math.max(1, progress)) : NaN;
        (options.updateNodes((nodes) =>
          nodes.map((node) =>
            node.id === options.nodeId &&
            (node.data?.seedanceTaskId === taskId ||
              node.data?.taskId === taskId ||
              node.data?.tianjiExecuteId === taskId)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    loading: true,
                    progress: hasRealProgress ? progress : node.data?.progress ?? 1,
                    errorMessage: void 0,
                    loadingText: hasRealProgress ? `${statusLabel}... ${progress}%` : `${statusLabel}...`,
                  },
                }
              : node,
          ),
        ),
          options.updateGlobalTasks &&
            options.updateGlobalTasks((tasks) =>
              tasks.map((task) =>
                task.id === taskId
                  ? task.status === `completed` || task.resultUrl
                    ? task
                    : {
                      ...task,
                      status: `running`,
                      ...(hasRealProgress ? { progress } : {}),
                    }
                  : task,
              ),
            ));
      }
    } catch (error: any) {
      // 终止条件：显式 terminal 标志（业务失败）、用户取消、明确的终止关键词。
      // 不再匹配裸 `error` / `失败`，避免 `network error`、`请求失败` 等瞬时错误被误杀（应进入重试）。
      if (
        error?.terminal === true ||
        error?.name === `AbortError` ||
        (error?.message && /生成已取消|expired|canceled|cancelled|rejected/i.test(error.message))
      ) {
        throw error;
      }
      console.warn(`Tianji Seedance polling error:`, error);
      consecutiveErrors++;
      if (consecutiveErrors === 5) {
        options.showToast(`即梦天玑状态查询暂时失败，仍会继续重试...`);
      }
    }
  }
}
