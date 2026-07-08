// @ts-nocheck
/**
 * handleDeleteSelected。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Ref, SetAny, SetState, WjEdge, WjNode } from "../lib/app-types";

interface UseHandleDeleteSelectedDeps {
  menuPosition: any;
  nodesRef: Ref<WjNode[]>;
  setEdges: SetState<WjEdge[]>;
  setMenuPosition: SetAny;
  setNodes: SetState<WjNode[]>;
  stopGeneration: any;
}

export function use_handleDeleteSelected(deps: UseHandleDeleteSelectedDeps) {
  const {
    menuPosition,
    nodesRef,
    setEdges,
    setMenuPosition,
    setNodes,
    stopGeneration,
  } = deps;
  const handleDeleteSelected = () => {
      let item =
        nodesRef.current.filter((node) => node.selected).length > 0 ?
        nodesRef.current.filter((node) => node.selected).map((node) => node.id) :
        menuPosition?.nodeId ?
        [menuPosition.nodeId] :
        [];
      (item.forEach((selectedNodeId) => stopGeneration(selectedNodeId, {
          silent: true
        })),
        item.length > 0 &&
        (setNodes((prevNodes) => prevNodes.filter((node) => !item.includes(node.id))),
          setEdges((prevEdges) =>
            prevEdges.filter((edge) => !item.includes(edge.source) && !item.includes(edge.target)),
          )),
        setMenuPosition(null));
    };
  return { handleDeleteSelected };
}
