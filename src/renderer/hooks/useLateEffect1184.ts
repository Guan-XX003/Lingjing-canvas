// @ts-nocheck
/**
 * useLateEffect1184（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useLateEffect1184(deps: any) {
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
