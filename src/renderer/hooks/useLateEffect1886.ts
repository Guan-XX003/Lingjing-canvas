// @ts-nocheck
/**
 * useLateEffect1886（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetState, WjEdge, WjNode } from "../lib/app-types";

interface UseLateEffect1886Deps {
  menuPosition: any;
  setEdges: SetState<WjEdge[]>;
  setNodes: SetState<WjNode[]>;
}

export function useLateEffect1886(deps: UseLateEffect1886Deps) {
  const {
    menuPosition,
    setEdges,
    setNodes,
  } = deps;
  useEffect(() => {
    (!menuPosition || menuPosition.type !== `connection`) &&
    (setNodes((nodes2) => nodes2.filter((node) => node.id !== `ghost-target`)),
      setEdges((edges2) => edges2.filter((edge) => edge.id !== `ghost-edge`)));
  }, [menuPosition, setNodes, setEdges]);
}
