/**
 * useSafeEffect12（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetAny } from "../lib/app-types";

interface UseSafeEffect12Deps {
  edges: any[];
  setNodes: SetAny;
  shouldFitView: any;
  wanjuanPrevEdgesRef: Ref;
}

export function useSafeEffect12(deps: UseSafeEffect12Deps) {
  const {
    edges,
    setNodes,
    shouldFitView,
    wanjuanPrevEdgesRef,
  } = deps;
  useEffect(() => {
	      let prevEdges = wanjuanPrevEdgesRef.current || [],
	        currentEdgeKeys = new Set(
	          edges.map(
	            (edge) =>
	            `${edge.id || ``}|${edge.source || ``}|${edge.sourceHandle || ``}|${edge.target || ``}|${edge.targetHandle || ``}`,
	          ),
	        ),
	        removedTargetIds = new Set();
	      prevEdges.forEach((edge) => {
	        let edgeKey = `${edge.id || ``}|${edge.source || ``}|${edge.sourceHandle || ``}|${edge.target || ``}|${edge.targetHandle || ``}`;
	        edge?.target && !currentEdgeKeys.has(edgeKey) && removedTargetIds.add(edge.target);
	      });
	      wanjuanPrevEdgesRef.current = edges;
	      if (!shouldFitView || removedTargetIds.size === 0) return;
	      setNodes((nodes2) => {
	        let changed = false,
	          updatedNodes = nodes2.map((node) =>
	            removedTargetIds.has(node.id) &&
	            Array.isArray(node.data?.selectedContextResources) &&
	            node.data.selectedContextResources.length > 0 ?
	            ((changed = true), {
	              ...node,
	              data: {
	                ...node.data,
	                selectedContextResources: []
	              },
	            }) :
	            node,
	          );
	        return changed ? updatedNodes : nodes2;
	      });
	    }, [edges, shouldFitView, setNodes]);
}
