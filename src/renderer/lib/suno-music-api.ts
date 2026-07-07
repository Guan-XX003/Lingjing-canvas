/**
 * sunoapi.org 音乐生成 API 接口层（供独立音乐节点使用）。
 *
 * 端点（base 默认 https://api.sunoapi.org）：
 *  - 生成            POST /api/v1/generate
 *  - 续写/扩展       POST /api/v1/generate/extend
 *  - 轮询任务详情    GET  /api/v1/generate/record-info?taskId=
 * 鉴权：Authorization: Bearer <apiKey>
 *
 * 桌面端收不到 callBackUrl 回调，故：提交时传占位 callBackUrl，之后用 record-info 轮询取结果。
 *
 * 本文件分两类：
 *  1) 纯函数（body 构造 / 结果提取 / 状态判定 / 参数校验）——可单测，不碰网络。
 *  2) 网络函数（submit/poll）——接受可注入的 fetch（默认 globalThis.fetch），便于测试。
 */

/** sunoapi.org 支持的模型版本（新→旧） */
export const SUNO_MODELS = ["V5_5", "V5", "V4_5PLUS", "V4_5ALL", "V4_5", "V4"] as const;
export type SunoModel = (typeof SUNO_MODELS)[number];
export const SUNO_DEFAULT_MODEL: SunoModel = "V4_5PLUS";

export const SUNO_ENDPOINTS = {
  generate: "/api/v1/generate",
  extend: "/api/v1/generate/extend",
  recordInfo: "/api/v1/generate/record-info",
} as const;

/** 桌面端占位回调（不可达，仅为满足必填；结果走轮询） */
export const SUNO_PLACEHOLDER_CALLBACK = "https://wanjuan.invalid/suno/callback";

/** 各模型的字段长度上限（用于前端校验/截断） */
export function sunoCharLimits(model: string): { prompt: number; style: number; title: number } {
  const isV4 = String(model || "").toUpperCase() === "V4";
  const isV45All = String(model || "").toUpperCase() === "V4_5ALL";
  return {
    prompt: isV4 ? 3000 : 5000,
    style: isV4 ? 200 : 1000,
    title: isV4 || isV45All ? 80 : 100,
  };
}

/** 音乐生成 UI 参数（节点侧收集，传给 buildSunoGenerateBody） */
export interface SunoGenerateParams {
  /** 自定义模式：true=提供歌词(prompt)+风格(style)+标题(title)；false=灵感模式，prompt 为整体描述 */
  customMode: boolean;
  /** 纯伴奏（无人声） */
  instrumental: boolean;
  model: SunoModel | string;
  /** 自定义模式=歌词；灵感模式=描述。纯伴奏+自定义模式时可为空 */
  prompt?: string;
  /** 风格/曲风（自定义模式必填） */
  style?: string;
  /** 标题（自定义模式必填） */
  title?: string;
  /** 要排除的风格 */
  negativeTags?: string;
  /** 人声性别 m/f */
  vocalGender?: "m" | "f" | "";
  styleWeight?: number | null;
  weirdnessConstraint?: number | null;
  audioWeight?: number | null;
  personaId?: string;
  personaModel?: "style_persona" | "voice_persona" | "";
}

/** 续写参数 */
export interface SunoExtendParams {
  /** 源音轨 id（从已有生成结果的 track.id 取） */
  audioId: string;
  /** true=自定义扩展参数（需 prompt/style/title/continueAt）；false=沿用原曲参数 */
  defaultParamFlag: boolean;
  model: SunoModel | string;
  prompt?: string;
  style?: string;
  title?: string;
  /** 从第几秒开始续写（0 < continueAt < 总时长） */
  continueAt?: number | null;
  negativeTags?: string;
  vocalGender?: "m" | "f" | "";
  styleWeight?: number | null;
  weirdnessConstraint?: number | null;
  audioWeight?: number | null;
  personaId?: string;
  personaModel?: "style_persona" | "voice_persona" | "";
}

/** 把 0–1 的可选权重规整为数字或省略（超范围裁剪） */
function clampWeight(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === ("" as any)) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(1, Math.max(0, n));
}

/** 仅保留有意义的可选字段（去掉空串/undefined），避免给 API 传空值 */
function withOptional(base: Record<string, any>, optional: Record<string, any>): Record<string, any> {
  const out = { ...base };
  for (const [k, v] of Object.entries(optional)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

/** 构造 /api/v1/generate 请求体 */
export function buildSunoGenerateBody(params: SunoGenerateParams, callBackUrl: string = SUNO_PLACEHOLDER_CALLBACK): Record<string, any> {
  const base: Record<string, any> = {
    customMode: !!params.customMode,
    instrumental: !!params.instrumental,
    model: params.model || SUNO_DEFAULT_MODEL,
    callBackUrl: callBackUrl || SUNO_PLACEHOLDER_CALLBACK,
  };
  // prompt：纯伴奏+自定义模式时允许省略
  if (!(params.instrumental && params.customMode) && params.prompt) base.prompt = params.prompt;
  else if (params.prompt) base.prompt = params.prompt;
  return withOptional(base, {
    style: params.customMode ? params.style : undefined,
    title: params.customMode ? params.title : undefined,
    negativeTags: params.negativeTags,
    vocalGender: params.vocalGender,
    styleWeight: clampWeight(params.styleWeight),
    weirdnessConstraint: clampWeight(params.weirdnessConstraint),
    audioWeight: clampWeight(params.audioWeight),
    personaId: params.personaId,
    personaModel: params.personaModel,
  });
}

/** 构造 /api/v1/generate/extend 请求体 */
export function buildSunoExtendBody(params: SunoExtendParams, callBackUrl: string = SUNO_PLACEHOLDER_CALLBACK): Record<string, any> {
  const base: Record<string, any> = {
    defaultParamFlag: !!params.defaultParamFlag,
    audioId: params.audioId,
    model: params.model || SUNO_DEFAULT_MODEL,
    callBackUrl: callBackUrl || SUNO_PLACEHOLDER_CALLBACK,
  };
  return withOptional(base, {
    prompt: params.defaultParamFlag ? params.prompt : undefined,
    style: params.defaultParamFlag ? params.style : undefined,
    title: params.defaultParamFlag ? params.title : undefined,
    continueAt: params.defaultParamFlag && params.continueAt != null ? Number(params.continueAt) : undefined,
    negativeTags: params.negativeTags,
    vocalGender: params.vocalGender,
    styleWeight: clampWeight(params.styleWeight),
    weirdnessConstraint: clampWeight(params.weirdnessConstraint),
    audioWeight: clampWeight(params.audioWeight),
    personaId: params.personaId,
    personaModel: params.personaModel,
  });
}

/** 前端校验：自定义模式必填 style/title；非纯伴奏必填 prompt。返回错误信息或 null */
export function validateSunoGenerateParams(params: SunoGenerateParams): string | null {
  if (params.customMode) {
    if (!params.style || !String(params.style).trim()) return "自定义模式需填写风格(style)";
    if (!params.title || !String(params.title).trim()) return "自定义模式需填写标题(title)";
    if (!params.instrumental && (!params.prompt || !String(params.prompt).trim())) return "自定义模式需填写歌词(prompt)";
  } else if (!params.prompt || !String(params.prompt).trim()) {
    return "灵感模式需填写歌曲描述(prompt)";
  }
  return null;
}

/** 一条生成音轨 */
export interface SunoTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  title?: string;
  tags?: string;
  duration?: number;
  prompt?: string;
  modelName?: string;
  createTime?: string;
}

const SUNO_TERMINAL_SUCCESS = new Set(["SUCCESS"]);
const SUNO_TERMINAL_FAILURE = new Set([
  "CREATE_TASK_FAILED",
  "GENERATE_AUDIO_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
]);

export function sunoStatusIsSuccess(status: string): boolean {
  return SUNO_TERMINAL_SUCCESS.has(String(status || "").toUpperCase());
}
export function sunoStatusIsFailure(status: string): boolean {
  return SUNO_TERMINAL_FAILURE.has(String(status || "").toUpperCase());
}
export function sunoStatusIsTerminal(status: string): boolean {
  return sunoStatusIsSuccess(status) || sunoStatusIsFailure(status);
}

/** 从 record-info 响应里提取音轨数组（data.response.sunoData[]） */
export function extractSunoTracks(recordInfo: any): SunoTrack[] {
  const list =
    recordInfo?.data?.response?.sunoData ||
    recordInfo?.data?.response?.data ||
    recordInfo?.response?.sunoData ||
    [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item: any) => ({
      id: String(item?.id ?? item?.audioId ?? ""),
      audioUrl: String(item?.audioUrl ?? item?.audio_url ?? item?.sourceAudioUrl ?? ""),
      streamAudioUrl: item?.streamAudioUrl ?? item?.stream_audio_url ?? undefined,
      imageUrl: item?.imageUrl ?? item?.image_url ?? undefined,
      title: item?.title ?? undefined,
      tags: item?.tags ?? undefined,
      duration: item?.duration != null ? Number(item.duration) : undefined,
      prompt: item?.prompt ?? undefined,
      modelName: item?.modelName ?? item?.model_name ?? undefined,
      createTime: item?.createTime ?? item?.create_time ?? undefined,
    }))
    .filter((t: SunoTrack) => t.id || t.audioUrl);
}

/** 从 record-info 响应取任务状态 */
export function extractSunoStatus(recordInfo: any): string {
  return String(recordInfo?.data?.status ?? recordInfo?.status ?? "").toUpperCase();
}

/** 拼接完整 URL（base 去尾斜杠 + path） */
export function sunoUrl(baseUrl: string, path: string): string {
  const b = String(baseUrl || "").replace(/\/+$/, "");
  return `${b}${path}`;
}

type FetchLike = (url: string, init?: any) => Promise<any>;

function sunoHeaders(apiKey: string, json = true): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

/** 提交任务，返回 taskId。任一错误抛异常（含 API 的 msg）。 */
export async function submitSunoTask(
  baseUrl: string,
  apiKey: string,
  path: string,
  body: Record<string, any>,
  fetchImpl: FetchLike = (globalThis as any).fetch,
): Promise<string> {
  const resp = await fetchImpl(sunoUrl(baseUrl, path), {
    method: "POST",
    headers: sunoHeaders(apiKey, true),
    body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || (json?.code != null && json.code !== 200)) {
    throw new Error(`Suno 提交失败: ${json?.msg || resp.status}`);
  }
  const taskId = json?.data?.taskId || json?.data?.task_id || json?.taskId;
  if (!taskId) throw new Error(`Suno 提交未返回 taskId: ${json?.msg || "unknown"}`);
  return String(taskId);
}

/** 轮询 record-info 直到成功/失败/超时。onTick 每次拿到状态时回调。 */
export async function pollSunoTask(
  baseUrl: string,
  apiKey: string,
  taskId: string,
  opts: {
    fetchImpl?: FetchLike;
    intervalMs?: number;
    timeoutMs?: number;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    onTick?: (status: string, recordInfo: any) => void;
    signal?: { aborted: boolean };
  } = {},
): Promise<{ status: string; tracks: SunoTrack[]; recordInfo: any }> {
  const fetchImpl = opts.fetchImpl || (globalThis as any).fetch;
  const intervalMs = opts.intervalMs ?? 5000;
  const timeoutMs = opts.timeoutMs ?? 300000;
  const now = opts.now || (() => Date.now());
  const sleep = opts.sleep || ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const start = now();
  for (;;) {
    if (opts.signal?.aborted) throw new Error("Suno 轮询已取消");
    const url = `${sunoUrl(baseUrl, SUNO_ENDPOINTS.recordInfo)}?taskId=${encodeURIComponent(taskId)}`;
    const resp = await fetchImpl(url, { method: "GET", headers: sunoHeaders(apiKey, false) });
    const json = await resp.json().catch(() => ({}));
    const status = extractSunoStatus(json);
    opts.onTick?.(status, json);
    if (sunoStatusIsSuccess(status)) return { status, tracks: extractSunoTracks(json), recordInfo: json };
    if (sunoStatusIsFailure(status)) throw new Error(`Suno 生成失败: ${status}`);
    if (now() - start > timeoutMs) throw new Error(`Suno 生成超时，请稍后用任务ID查询：${taskId}`);
    await sleep(intervalMs);
  }
}
