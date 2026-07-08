// @ts-nocheck
/**
 * handleConnect。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetState, WjEdge, WjNode } from "../lib/app-types";

interface UseHandleConnectDeps {
  addEdge: any;
  getNodes: () => WjNode[];
  setEdges: SetState<WjEdge[]>;
}

export function useHandleConnect(deps: UseHandleConnectDeps) {
  const {
    addEdge,
    getNodes,
    setEdges,
  } = deps;
  const handleConnect = useCallback(
      (connection) => {
        let nodes2 = getNodes();
        if (nodes2.find((node) => node.id === connection.source)?.selected) {
          let selectedNodes = nodes2.filter((node) => node.selected);
          if (selectedNodes.length > 1) {
            setEdges((prevEdges) => {
              let updatedEdges = [...prevEdges];
              return (
                selectedNodes.forEach((selectedNode) => {
                  selectedNode.id !== connection.target &&
	                    (updatedEdges = addEdge({
	                      ...connection,
	                      source: selectedNode.id,
	                      type: `custom`
	                    }, updatedEdges));
                }),
                updatedEdges
              );
            });
            return;
          }
        }
        let newEdge = {
          ...connection,
          type: `custom`
        };
        setEdges((prevEdges) => addEdge(newEdge, prevEdges));
      },
      [setEdges, getNodes],
    );
  return { handleConnect };
}
