/**
 * 万卷灵境渲染层核心领域类型。
 * 字段基于代码实际使用推导；每个接口带索引签名 `[key: string]: any`，
 * 以在补充已知字段类型的同时保持对未列出字段的兼容（避免破坏行为）。
 */

/** 画布节点（@xyflow/react 节点 + 业务 data） */
export interface CanvasNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: Record<string, any>;
  selected?: boolean;
  [key: string]: any;
}

/** 画布连线 */
export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  [key: string]: any;
}

/** 全局任务（任务清单条目） */
export interface GlobalTask {
  id: string;
  status?: string;
  type?: string;
  customOutputType?: string;
  nodeId?: string;
  projectId?: string;
  prompt?: string;
  resultUrl?: string;
  errorMsg?: string;
  stoppedByUser?: boolean;
  createdAt?: number;
  updatedAt?: number;
  taskId?: string;
  apiConfig?: ApiConfig;
  [key: string]: any;
}

/** API 配置（模型服务端点） */
export interface ApiConfig {
  id: string;
  name?: string;
  url?: string;
  key?: string;
  apiUrl?: string;
  apiKey?: string;
  models?: any[];
  apiConfigName?: string;
  apiDocUrl?: string;
  configButlerDocUrl?: string;
  [key: string]: any;
}

/** 配置管家协议配置 / 模型协议绑定 */
export interface ProtocolConfig {
  category?: string;
  submitPath?: string;
  submitUrl?: string;
  statusPath?: string;
  responseMapping?: Record<string, any>;
  protocolFormat?: string;
  [key: string]: any;
}

/** 智能体 */
export interface Agent {
  id: string;
  name?: string;
  icon?: string;
  theme?: string;
  messages?: any[];
  attachments?: any[];
  [key: string]: any;
}

/** 中转/项目资源（媒体） */
export interface ResourceItem {
  id: string;
  type?: string;
  mediaKind?: string;
  localPath?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  projectAssetBinding?: Record<string, any>;
  [key: string]: any;
}

/** 项目 */
export interface Project {
  id: string;
  name?: string;
  storageStatus?: string;
  groupId?: string;
  [key: string]: any;
}
