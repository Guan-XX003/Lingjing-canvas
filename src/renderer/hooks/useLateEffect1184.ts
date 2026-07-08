/**
 * useLateEffect1184（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

interface UseLateEffect1184Deps {
  edges: any[];
  nodes: any[];
  saveCanvasState: any;
  shouldFitView: any;
}

export function useLateEffect1184(deps: UseLateEffect1184Deps) {
  const {
    edges,
    nodes,
    saveCanvasState,
    shouldFitView,
  } = deps;
  useEffect(() => {
		      if (!shouldFitView) return;
		      let timeoutId = setTimeout(saveCanvasState, 2800);
		      return () => clearTimeout(timeoutId);
		    }, [nodes, edges, shouldFitView, saveCanvasState]);
}
