// @ts-nocheck
/**
 * copySelectedNodes。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { wanjuanCloneNodeDataForClipboard } from "../lib/video-task";

export function use_copySelectedNodes(deps: any) {
  const {
    edgesRef,
    menuPosition,
    nodesRef,
    projectIdRef,
    setMenuPosition,
  } = deps;
  const copySelectedNodes = async () => {
          let selectedNodes = nodesRef.current.filter((node) => node.selected),
            nodesToCopy = selectedNodes;
          if (menuPosition?.nodeId && !selectedNodes.find((node) => node.id === menuPosition.nodeId)) {
            let targetNode = nodesRef.current.find((node) => node.id === menuPosition.nodeId);
            targetNode && (nodesToCopy = [targetNode]);
          }
          if (nodesToCopy.length > 0) {
            let internalEdges = edgesRef.current.filter(
                (edge) =>
                nodesToCopy.some((node) => node.id === edge.source) &&
                nodesToCopy.some((node) => node.id === edge.target),
              ),
	              nodeIds = new Set(nodesToCopy.map((node) => node.id)),
	              incomingEdges =
	              nodesToCopy.length === 1 ?
	              edgesRef.current.filter(
	                (edge) => edge.target === nodesToCopy[0].id && !nodeIds.has(edge.source),
	              ) :
	              [],
	              clipboardData = {
	                type: `canvas-clipboard-nodes`,
	                sourceProjectId: projectIdRef.current,
	                nodes: nodesToCopy.map((node) => ({
	                  ...node,
	                  data: wanjuanCloneNodeDataForClipboard(node.data)
	                })),
	                edges: internalEdges,
	                referenceEdges: incomingEdges,
	              };
            try {
              (await navigator.clipboard.writeText(JSON.stringify(clipboardData)),
                showToast(`已复制 ${nodesToCopy.length} 个节点`));
            } catch (error) {
              (console.error(`Copy failed`, error), showToast(`复制失败，请检查浏览器权限`));
            }
          }
          setMenuPosition(null);
        };
  return { copySelectedNodes };
}
