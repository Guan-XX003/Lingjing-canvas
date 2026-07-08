/**
 * 万卷灵境 — 抽出的 hook / 组件所用的公共 & 领域依赖类型。
 *
 * 目的：给自动抽取的 hook 的 `deps` 提供可读、可检查的类型（替代 `any`）。
 * 领域对象（节点 data、任务、API 配置、协议、资源）的字段是从代码实际用法
 * 反推的（见各类型注释）。因源码是逐字反混淆产物、字段访问较松散，
 * 每个领域对象都带 `[k: string]: any` 索引签名兜底：已知字段有精确类型（可读 + 自动补全 + 检查），
 * 未列出的松散访问不报错，不破坏构建。
 */
import type { Dispatch, SetStateAction, MutableRefObject } from "react";

/* ────────────── 通用结构类型 ────────────── */

/** React 状态 setter（接受新值或更新函数）。 */
export type SetState<T> = Dispatch<SetStateAction<T>>;
/** 值类型未细化时的通用 setter。 */
export type SetAny = Dispatch<SetStateAction<any>>;
/** toast 提示函数。 */
export type Toast = (message: string) => void;
/** useRef 引用。 */
export type Ref<T = any> = MutableRefObject<T>;
/** 通用「模型名 → 配置」映射表。 */
export type Bindings = Record<string, any>;

/* ────────────── 画布节点 ────────────── */

/** 画布节点的 type 取值（见 components/canvas-node-registry.tsx 的 nodeTypes）。 */
export type WjNodeType =
  | "imageNode" | "promptNode" | "textNode" | "cropNode" | "gridSplitNode"
  | "gridMergeNode" | "videoNode" | "seedanceNode" | "tongyiWanxiangNode"
  | "audioNode" | "musicNode" | "ttsMusicNode" | "customNode" | "videoExtractNode"
  | "textConcatNode" | "urlToImageNode" | "fileToLinkNode" | "videoFaceBlurNode"
  | "qwenTtsCloneNode" | "realEsrganVideoNode";

/**
 * 画布节点的 data 对象。字段随节点类型不同而不同，几乎全部可选（代码里大量 `?.`）。
 * 下列为高频/跨类型的公共字段（从用法反推）；类型专属字段通过索引签名兜底。
 */
export interface WjNodeData {
  // 展示 / 状态
  label?: string;
  loading?: boolean;
  progress?: number;
  status?: string;
  error?: boolean | string;
  errorMessage?: string;
  errorMsg?: string;
  message?: string;
  // 媒体 / 输出（同时保留 snake_case 的 API 直传变体）
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  text?: string;
  resultData?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  resultUrl?: string;
  url?: string;
  video_url?: string;
  audio_url?: string;
  thumbnail_url?: string;
  extractedImages?: string[];
  allExtractedImages?: string[];
  // 任务 / ID 追踪
  taskId?: string;
  task_id?: string;
  id?: string;
  seedanceTaskId?: string;
  remoteTaskId?: string;
  file_id?: string;
  clipId?: string;
  // 生成参数 / 模型选择
  prompt?: string;
  selectedModel?: string;
  selectedSeconds?: number;
  selectedResolution?: string;
  selectedAspectRatio?: string;
  aspectRatio?: string;
  size?: string;
  mediaKind?: "image" | "video" | "audio" | "text" | string;
  mode?: string;
  nodeKind?: string;
  customOutputType?: "image" | "video" | "audio" | "text" | string;
  generateAudio?: boolean;
  watermark?: boolean;
  // 导出 / 资产绑定（key 对应 imageUrl/videoUrl/audioUrl/text/resultData）
  projectAssetBindings?: Record<string, any>;
  localPath?: string;
  filePath?: string;
  // 松散访问兜底
  [k: string]: any;
}

/** 画布节点（React Flow 节点）。 */
export interface WjNode {
  id: string;
  type?: WjNodeType | string;
  position?: { x: number; y: number };
  data?: WjNodeData;
  selected?: boolean;
  [k: string]: any;
}

/** 画布连线。 */
export interface WjEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  [k: string]: any;
}

/* ────────────── 全局生成任务 ────────────── */

/** 任务状态（远端原始状态经 use_refreshGlobalTask 归一化为这 4 个）。 */
export type TaskStatus = "pending" | "running" | "completed" | "failed";
/** 任务类型。 */
export type TaskType = "image" | "video" | "audio" | "text" | "custom";

/**
 * GlobalTasks 数组元素（生成任务）。
 * status/type 归一化后为上述联合，但为兼容历史宽松写法用 `| string`。
 */
export interface GlobalTask {
  id: string;
  type?: TaskType | string;
  status?: TaskStatus | string;
  nodeId?: string;
  modelName?: string;
  apiBaseUrl?: string;
  apiConfigId?: string;
  apiConfig?: ApiConfig;
  progress?: number;
  createdAt?: number;
  updatedAt?: number;
  prompt?: string;
  customOutputType?: "image" | "video" | "audio" | "text" | string;
  provider?: string;
  projectId?: string;
  requestProfile?: Record<string, any>;
  // 结果 / 错误
  resultUrl?: string;
  customResultData?: string;
  thumbnailUrl?: string;
  errorMsg?: string;
  stoppedByUser?: boolean;
  // 远端/异步追踪
  taskId?: string;
  remoteTaskId?: string;
  seedanceTaskId?: string;
  clipId?: string;
  audioName?: string;
  title?: string;
  [k: string]: any;
}

/* ────────────── API 配置 & 模型协议 ────────────── */

/**
 * 一条统一 API 配置（apiConfigs 数组元素）。
 * 主字段：端点 `url` + 令牌 `key`（不是 apiKey/apiUrl —— 那些是全局配置顶层字段，
 * 这里作为历史兼容字段保留）。url/key 设为可选以兼容历史读取写法。
 */
export interface ApiConfig {
  id: string;
  name?: string;
  url?: string;
  key?: string;
  protocolFormat?: "auto" | string;
  models?: any[];
  /** 历史兼容字段（部分旧代码用这些名字，实际应读 url/key）。 */
  apiUrl?: string;
  apiKey?: string;
  apiConfigName?: string;
  apiDocUrl?: string;
  configButlerDocUrl?: string;
  [k: string]: any;
}

/** 请求协议归一化类型。 */
export type RequestType =
  | "openai-chat" | "openai-responses" | "openai-images" | "openai-video"
  | "openai-audio-transcription" | "openai-audio-speech" | "gemini-generate-content"
  | "claude-messages" | "multipart-video" | "json-video" | "suno-music" | "custom";

/** 一个协议定义（modelProtocolRegistry 的 value）。 */
export interface ProtocolConfig {
  category?: "text" | "image" | "video" | "audio" | "music" | string;
  requestType?: RequestType | string;
  submitPath?: string;
  submitUrl?: string;
  pollPath?: string;
  statusPath?: string;
  contentPath?: string;
  resultPath?: string;
  taskIdPath?: string;
  fieldMapping?: Record<string, string>;
  fieldValueTypes?: Record<string, string>;
  responseMapping?: Record<string, string[]>;
  parameterAdapter?: Record<string, any>;
  extraBody?: Record<string, any>;
  omitDuration?: boolean;
  requiresReferenceImage?: boolean;
  executionMode?: "sync" | "async" | string;
  pollingMethod?: "GET" | string;
  contentType?: string;
  validationNotes?: string[];
  protocolFormat?: string;
  [k: string]: any;
}

/** 协议注册表：协议名（可中文）→ 协议定义。 */
export type ProtocolRegistry = Record<string, ProtocolConfig>;
/** 模型 → apiConfig.id 的绑定表。 */
export type ApiBindings = Record<string, string>;
/** 模型 → 协议名 的绑定表。 */
export type ProtocolBindings = Record<string, string>;

/* ────────────── 云端配置备份 ────────────── */

/** 一份全局配置快照（storedGlobalConfig.config，captureCurrentGlobalConfig 的产物）。 */
export interface GlobalConfigSnapshot {
  apiConfigs?: ApiConfig[];
  textModel?: string;
  drawingModel?: string;
  videoModel?: string;
  audioModel?: string;
  ttsMusicModel?: string;
  modelProtocolRegistry?: ProtocolRegistry;
  configButlerDocUrl?: string;
  [k: string]: any;
}

/** storedGlobalConfigs 数组元素（一份具名的云端配置备份）。 */
export interface StoredGlobalConfig {
  id: string;
  name: string;
  description?: string;
  source?: string;
  apiDocUrl?: string;
  updatedAt?: number;
  config: GlobalConfigSnapshot;
  [k: string]: any;
}

/* ────────────── 中转资源 ────────────── */

/** 中转资源来源。 */
export type ResourceSource =
  | "generated" | "external-upload" | "tianji-portrait" | "seedance-virtual-portrait"
  | "relinked" | "video-editor" | "wanjuan-agent" | "pasted" | "startup";

/** transitResources 数组元素（中转/收藏资源）。 */
export interface TransitResource {
  id: string;
  url: string;
  type: string;
  timestamp?: number;
  pageUrl?: string;
  pageTitle?: string;
  source?: ResourceSource | string;
  sourceOrigin?: ResourceSource | string;
  originalName?: string;
  originalUrl?: string;
  isFavorite?: boolean;
  localPath?: string;
  projectAssetBinding?: Record<string, any>;
  [k: string]: any;
}
