/**
 * 万卷灵境 — 抽出的 hook / 组件所用的公共依赖类型。
 * 目的：给自动抽取的 hook 的 `deps` 提供可读、可检查的类型（替代 `any`），
 * 恢复 tsc 对依赖接线的静态检查。结构型依赖（setter/getter/数组/ref/字符串）
 * 给出真实类型；复杂领域对象（节点 data、任务、配置备份等）暂用宽松类型。
 */
import type { Dispatch, SetStateAction, MutableRefObject } from "react";

/** 画布节点（React Flow 节点，data 结构复杂，暂宽松）。 */
export type WjNode = {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: any;
  [k: string]: any;
};

/** 画布连线。 */
export type WjEdge = {
  id: string;
  source: string;
  target: string;
  [k: string]: any;
};

/** 一条 API 配置（网关地址 + 令牌 + 名称）。 */
export type ApiConfig = {
  id: string;
  name?: string;
  url: string;
  apiKey?: string;
  [k: string]: any;
};

/** React 状态 setter（接受新值或更新函数）。 */
export type SetState<T> = Dispatch<SetStateAction<T>>;

/** 通用状态 setter（值类型未细化时）。 */
export type SetAny = Dispatch<SetStateAction<any>>;

/** toast 提示函数。 */
export type Toast = (message: string) => void;

/** useRef 引用。 */
export type Ref<T = any> = MutableRefObject<T>;

/** 模型协议/绑定表：模型名 → 配置。 */
export type Bindings = Record<string, any>;
