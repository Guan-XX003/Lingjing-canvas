// @ts-nocheck
/**
 * addGridSplitNode。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { wanjuanCollectNodeReferenceMedia } from "../lib/reference-media";

export function use_addGridSplitNode(deps: any) {
  const {
    handleSplit,
    handleSplitOne,
    menuPosition,
    nodes,
    setEdges,
    setMenuPosition,
    setNodes,
  } = deps;
  const addGridSplitNode = () => {
            if (menuPosition?.nodeId) {
              let targetNode = nodes.find((node) => node.id === menuPosition.nodeId),
                imageUrl = targetNode ? wanjuanCollectNodeReferenceMedia(targetNode).images[0] : ``;
              if (targetNode && (targetNode.type === `imageNode` || targetNode.type === `promptNode` || imageUrl)) {
                let gridSplitNodeId = `gridSplitNode-${Date.now()}`,
                  newNode = {
                    id: gridSplitNodeId,
                    type: `gridSplitNode`,
                    position: {
                      x: targetNode.position.x + (targetNode.measured?.width || 300) + 50,
                      y: targetNode.position.y,
                    },
                    data: {
                      onSplit: handleSplit,
                      onSplitOne: handleSplitOne
                    },
                  };
                setNodes((nodes2) => nodes2.concat(newNode));
                let newEdge = {
                  id: `e-${targetNode.id}-${gridSplitNodeId}`,
                  source: targetNode.id,
                  target: gridSplitNodeId
                };
                setEdges((edges2) => edges2.concat(newEdge));
              } else showToast(`该节点不支持九宫格切分`);
            }
            setMenuPosition(null);
          };
  return { addGridSplitNode };
}
