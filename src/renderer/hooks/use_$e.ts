// @ts-nocheck
/**
 * $e。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_$e(deps: any) {
  const {
    historyIndex,
    historyIndexRef,
    isRestoringRef,
    setEdges,
    setHistoryIndex,
    setNodes,
  } = deps;
  const $e = useCallback(() => {
      if (historyIndex > 0) {
        isRestoringRef.current = true;
        let previousSnapshot = history[historyIndex - 1];
        (setNodes(previousSnapshot.nodes),
          setEdges(previousSnapshot.edges),
          setHistoryIndex(historyIndex - 1),
          (historyIndexRef.current = historyIndex - 1),
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 600));
      }
    }, [history, historyIndex, setNodes, setEdges]);
  return { $e };
}
