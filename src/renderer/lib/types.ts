/**
 * StarCanvas渲染层核心领域类型（历史入口）。
 *
 * 共享数据类型（ApiConfig / GlobalTask / ProtocolConfig / 节点 / 连线 / 资源等）已统一到
 * `./app-types.ts` 作为单一源头，这里重新导出；CanvasNode / CanvasEdge / ResourceItem
 * 为历史命名别名（分别等于 WjNode / WjEdge / TransitResource）。本文件只保留 app-types
 * 中没有的独有类型（Agent / Project）。
 */
export type {
  ApiConfig,
  GlobalTask,
  ProtocolConfig,
  WjNode,
  WjEdge,
  WjNodeData,
  TaskStatus,
  TaskType,
  ProtocolRegistry,
  ApiBindings,
  ProtocolBindings,
  StoredGlobalConfig,
  GlobalConfigSnapshot,
  TransitResource,
} from "./app-types";

import type { WjNode, WjEdge, TransitResource } from "./app-types";

/** 画布节点（历史命名，等于 WjNode）。 */
export type CanvasNode = WjNode;
/** 画布连线（历史命名，等于 WjEdge）。 */
export type CanvasEdge = WjEdge;
/** 中转 / 项目资源（历史命名，等于 TransitResource）。 */
export type ResourceItem = TransitResource;

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

/** 项目 */
export interface Project {
  id: string;
  name?: string;
  storageStatus?: string;
  groupId?: string;
  [key: string]: any;
}
