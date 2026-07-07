// @ts-nocheck
/**
 * stopGeneration。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";

export function useStopGeneration(deps: any) {
  const {
    abortControllersRef,
    nodesRef,
    setEdges,
    setNodes,
    showToast,
    updateTaskList,
  } = deps;
  const stopGeneration = useCallback(
      (nodeId, options = {}) => {
        let {
          silent: silent = false
        } = options,
        abortController = abortControllersRef.current.get(nodeId);
        updateTaskList &&
          updateTaskList((nodes2) =>
            nodes2.map((node) => {
              let task = nodesRef.current.find((task2) => task2.id === nodeId),
                taskId = task?.data?.seedanceTaskId || task?.data?.taskId;
              return taskId && node.id === taskId ?
                {
                  ...node,
                  status: `failed`,
                  errorMsg: `已手动停止`,
                  stoppedByUser: true,
                } :
                node;
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
