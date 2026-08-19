/**
 * useSafeEffect12（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetState, WjEdge, WjNode } from "../lib/app-types";
import { wanjuanHasTianjiPortraitClaim } from "../lib/tianji-portrait";
import { wanjuanRemoveTianjiPortraitContextsForSources } from "../lib/tianji-manual-reference";

interface UseSafeEffect12Deps {
  edges: WjEdge[];
  nodes: WjNode[];
  setNodes: SetState<WjNode[]>;
  shouldFitView: any;
  wanjuanPrevEdgesRef: Ref;
}

export function useSafeEffect12(deps: UseSafeEffect12Deps) {
  const {
    edges,
    nodes,
    setNodes,
    shouldFitView,
    wanjuanPrevEdgesRef,
  } = deps;
  const previousNodesRef = useRef<WjNode[]>([]);
  useEffect(() => {
	      let prevEdges = wanjuanPrevEdgesRef.current || [],
	        previousNodes = previousNodesRef.current || [],
	        currentEdgeKeys = new Set(
	          edges.map(
	            (edge) =>
	            `${edge.id || ``}|${edge.source || ``}|${edge.sourceHandle || ``}|${edge.target || ``}|${edge.targetHandle || ``}`,
	          ),
	        ),
	        removedSourcesByTarget = new Map<string, WjNode[]>();
	      prevEdges.forEach((edge) => {
	        let edgeKey = `${edge.id || ``}|${edge.source || ``}|${edge.sourceHandle || ``}|${edge.target || ``}|${edge.targetHandle || ``}`;
	        if (!edge?.target || currentEdgeKeys.has(edgeKey)) return;
	        const sourceNode = previousNodes.find((node) => node.id === edge.source) || nodes.find((node) => node.id === edge.source);
	        if (!sourceNode || !wanjuanHasTianjiPortraitClaim(sourceNode.data)) return;
	        const sources = removedSourcesByTarget.get(edge.target) || [];
	        sources.push(sourceNode);
	        removedSourcesByTarget.set(edge.target, sources);
	      });
	      const changedPortraitSources = previousNodes.filter((previousNode) => {
	        if (!wanjuanHasTianjiPortraitClaim(previousNode?.data)) return false;
	        const currentNode = nodes.find((node) => node.id === previousNode.id);
	        if (!currentNode) return true;
	        const previousAssetId = String(previousNode.data?.tianjiPortraitAssetId || ``).trim();
	        const currentAssetId = String(currentNode.data?.tianjiPortraitAssetId || ``).trim();
	        const previousImage = String(previousNode.data?.imageUrl || ``).trim();
	        const currentImage = String(currentNode.data?.imageUrl || ``).trim();
	        return previousAssetId !== currentAssetId || previousImage !== currentImage || !wanjuanHasTianjiPortraitClaim(currentNode.data);
	      });
	      wanjuanPrevEdgesRef.current = edges;
	      previousNodesRef.current = nodes;
	      if (!shouldFitView || (removedSourcesByTarget.size === 0 && changedPortraitSources.length === 0)) return;
	      setNodes((nodes2) => {
	        let changed = false,
	          updatedNodes = nodes2.map((node) => {
	            const resources = node.data?.selectedContextResources;
	            if (!Array.isArray(resources) || resources.length === 0) return node;
	            const sourceNodes = [
	              ...(removedSourcesByTarget.get(node.id) || []),
	              ...changedPortraitSources,
	            ];
	            const cleaned = wanjuanRemoveTianjiPortraitContextsForSources(resources, sourceNodes);
	            if (!cleaned.removedCount) return node;
	            changed = true;
	            return {
	              ...node,
	              data: {
	                ...node.data,
	                selectedContextResources: cleaned.resources,
	              },
	            };
	          });
	        return changed ? updatedNodes : nodes2;
	      });
	    }, [edges, nodes, shouldFitView, setNodes]);
}
