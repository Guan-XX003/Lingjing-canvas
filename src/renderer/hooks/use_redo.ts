/**
 * redo。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Ref, SetAny, SetState, WjEdge, WjNode } from "../lib/app-types";

interface UseRedoDeps {
  historyIndex: any;
  historyIndexRef: Ref;
  isRestoringRef: Ref;
  setEdges: SetState<WjEdge[]>;
  setHistoryIndex: SetAny;
  setNodes: SetState<WjNode[]>;
  edges: WjEdge[];
  history: any;
  nodes: WjNode[];
}

export function use_redo(deps: UseRedoDeps) {
  const {
    historyIndex,
    historyIndexRef,
    isRestoringRef,
    setEdges,
    setHistoryIndex,
    setNodes,
    edges,
    history,
    nodes,
  } = deps;
  const redo = useCallback(() => {
      if (historyIndex < history.length - 1) {
        isRestoringRef.current = true;
        let nextSnapshot = history[historyIndex + 1];
        (setNodes(nextSnapshot.nodes),
          setEdges(nextSnapshot.edges),
          setHistoryIndex(historyIndex + 1),
          (historyIndexRef.current = historyIndex + 1),
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 600));
      }
    }, [history, historyIndex, setNodes, setEdges]);
  return { redo };
}
