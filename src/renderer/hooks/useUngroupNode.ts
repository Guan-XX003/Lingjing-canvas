/**
 * ungroupNode。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetAny, Toast } from "../lib/app-types";

interface UseUngroupNodeDeps {
  setNodes: SetAny;
  showToast: Toast;
}

export function useUngroupNode(deps: UseUngroupNodeDeps) {
  const {
    setNodes,
    showToast,
  } = deps;
  const ungroupNode = useCallback(
      (groupId) => {
        (setNodes((nodes2) => {
            let groupNode = nodes2.find((node) => node.id === groupId);
            return groupNode ?
              nodes2
              .filter((node) => node.id !== groupId)
              .map((node) =>
                node.parentId === groupId ?
                {
                  ...node,
                  parentId: undefined,
                  extent: undefined,
                  position: {
                    x: node.position.x + groupNode.position.x,
                    y: node.position.y + groupNode.position.y,
                  },
                } :
                node,
              ) :
              nodes2;
          }),
          showToast(`已取消编组`));
      },
	      [setNodes, showToast],
	    );
  return { ungroupNode };
}
