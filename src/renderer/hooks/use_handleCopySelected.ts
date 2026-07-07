// @ts-nocheck
/**
 * handleCopySelected。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { wanjuanCloneNodeDataForClipboard } from "../lib/video-task";

export function use_handleCopySelected(deps: any) {
  const {
    edgesRef,
    nodesRef,
    projectIdRef,
    setMenuPosition,
  } = deps;
  const handleCopySelected = async () => {
        let nodes2 = nodesRef.current,
          edges2 = edgesRef.current;
        if (nodes2.length > 0) {
          let clipboardData = {
            type: `canvas-clipboard-nodes`,
            sourceProjectId: projectIdRef.current,
            nodes: nodes2.map((node) => ({
              ...node,
              data: wanjuanCloneNodeDataForClipboard(node.data)
            })),
            edges: edges2,
          };
          try {
            (await navigator.clipboard.writeText(JSON.stringify(clipboardData)),
              showToast(`已复制画布中所有 ${nodes2.length} 个节点`));
          } catch (error) {
            (console.error(`Copy failed`, error), showToast(`复制失败，请检查浏览器权限`));
          }
        } else showToast(`画布为空`);
        setMenuPosition(null);
      };
  return { handleCopySelected };
}
