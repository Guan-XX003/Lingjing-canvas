/**
 * useSafeEffect11（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetAny } from "../lib/app-types";

interface UseSafeEffect11Deps {
  nodes: any[];
  setEdges: SetAny;
  shouldFitView: any;
}

export function useSafeEffect11(deps: UseSafeEffect11Deps) {
  const {
    nodes,
    setEdges,
    shouldFitView,
  } = deps;
  useEffect(() => {
	      if (!shouldFitView) return;
	      let loadingMap = new Map(nodes.map((node) => [node.id, !!node.data?.loading]));
	      setEdges((edges2) => {
	        let changed = false,
	          updatedEdges = edges2.map((edge) => {
	            let shouldAnimate = !!loadingMap.get(edge.target);
	            return edge.animated === shouldAnimate ? edge : ((changed = true), {
	              ...edge,
	              animated: shouldAnimate
	            });
	          });
	        return changed ? updatedEdges : edges2;
	      });
	    }, [shouldFitView, nodes, setEdges]);
}
