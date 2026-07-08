// @ts-nocheck
/**
 * wanjuanSelectedReferenceSourcesByTarget。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";

interface UseSelectedRefSourcesDeps {
  edges: any[];
  nodes: any[];
  useMemo: any;
}

export function useSelectedRefSources(deps: UseSelectedRefSourcesDeps) {
  const {
    edges,
    nodes,
    useMemo,
  } = deps;
  const wanjuanSelectedReferenceSourcesByTarget = useMemo(() => {
	      let edgesByTarget = new Map();
	      let nodeById = new Map(nodes.map((node) => [node.id, node]));
	      return (
	        edges.forEach((edge) => {
	          if (
	            !edge?.selected ||
	            edge.animated ||
	            !edge.target ||
	            !edge.source ||
	            nodeById.get(edge.target)?.data?.loading
	          )
	            return;
	          let sources = edgesByTarget.get(edge.target) || [];
	          sources.includes(edge.source) || sources.push(edge.source);
	          edgesByTarget.set(edge.target, sources);
	        }),
	        edgesByTarget
	      );
	    }, [edges, nodes]);
  return { wanjuanSelectedReferenceSourcesByTarget };
}
