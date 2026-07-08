// @ts-nocheck
/**
 * wanjuanHandleEdgeClick。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetAny, SetState, WjEdge, WjNode } from "../lib/app-types";

interface UseHandleEdgeClickDeps {
  setEdges: SetState<WjEdge[]>;
  setMenuPosition: SetAny;
  setNodes: SetState<WjNode[]>;
}

export function useHandleEdgeClick(deps: UseHandleEdgeClickDeps) {
  const {
    setEdges,
    setMenuPosition,
    setNodes,
  } = deps;
  const wanjuanHandleEdgeClick = useCallback(
	      (event, node) => {
	        (event.stopPropagation(),
	          setMenuPosition(null),
	          setNodes((nodes2) =>
	            nodes2.map((node2) =>
	              node2.selected ? {
	                ...node2,
	                selected: false
	              } : node2,
	            ),
	          ),
	          setEdges((nodes2) =>
	            nodes2.map((node2) => {
	              let isSelected = node2.id === node.id;
	              return node2.selected === isSelected ? node2 : {
	                ...node2,
	                selected: isSelected
	              };
	            }),
	          ));
	      },
	      [setMenuPosition, setNodes, setEdges],
	  );
  return { wanjuanHandleEdgeClick };
}
