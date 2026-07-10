/**
 * stopGeneration。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Ref, SetState, Toast, WjEdge, WjNode } from "../lib/app-types";

interface UseStopGenerationDeps {
  abortControllersRef: Ref;
  nodesRef: Ref<WjNode[]>;
  setEdges: SetState<WjEdge[]>;
  setNodes: SetState<WjNode[]>;
  showToast: Toast;
  updateTaskList: any;
}

export function useStopGeneration(deps: UseStopGenerationDeps) {
  const {
    abortControllersRef,
    nodesRef,
    setEdges,
    setNodes,
    showToast,
    updateTaskList,
  } = deps;
  const stopGeneration = useCallback(
      (nodeId: string, options: { silent?: boolean } = {}) => {
        let {
          silent: silent = false
        } = options,
        abortController = abortControllersRef.current.get(nodeId);
        updateTaskList &&
          updateTaskList((tasks) =>
            tasks.map((taskRecord) => {
              let node = nodesRef.current.find((task2) => task2.id === nodeId),
                taskId = node?.data?.seedanceTaskId || node?.data?.taskId || node?.data?.tianjiExecuteId,
                isActiveTask = taskRecord?.status === `running` || taskRecord?.status === `pending`,
                matchesCurrentTaskId = !!taskId && taskRecord.id === taskId,
                matchesActiveNodeTask = isActiveTask && taskRecord.nodeId === nodeId;
              return matchesCurrentTaskId || matchesActiveNodeTask ?
                {
                  ...taskRecord,
                  status: `failed`,
                  errorMsg: `已手动停止`,
                  stoppedByUser: true,
                  updatedAt: Date.now(),
                } :
                taskRecord;
            }),
          );
        (abortController && abortController.abort(),
          abortControllersRef.current.delete(nodeId),
          silent || showToast(abortController ? `已取消生成` : `已停止生成`),
          setNodes((nodes2) =>
            nodes2.map((node) =>
	                        node.id === nodeId ?
              {
                ...node,
                data: {
                  ...node.data,
                  loading: false,
                  progress: 0,
                  manuallyStopped: true,
                  errorMessage: `已手动停止`,
                  videoUrl: undefined,
                  thumbnailUrl: undefined,
                  resultData: undefined,
                },
              } :
              node,
            ),
          ),
          setEdges((edges2) =>
            edges2.map((edge) => (edge.target === nodeId ? {
              ...edge,
              animated: false
            } : edge)),
          ));
      },
      [setNodes, setEdges, showToast, updateTaskList],
    );
  return { stopGeneration };
}
