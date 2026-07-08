/**
 * handleMultiConnectToTarget。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetAny, SetState, Toast, WjEdge } from "../lib/app-types";

interface UseMultiConnectDeps {
  addEdge: any;
  multiConnectIds: any;
  setEdges: SetState<WjEdge[]>;
  setMultiConnectIds: SetAny;
  showToast: Toast;
}

export function useMultiConnect(deps: UseMultiConnectDeps) {
  const {
    addEdge,
    multiConnectIds,
    setEdges,
    setMultiConnectIds,
    showToast,
  } = deps;
  const handleMultiConnectToTarget = useCallback(
      (event, targetNode) => {
        multiConnectIds &&
          multiConnectIds.length > 0 &&
          (event.preventDefault(),
            setEdges((prevEdges) => {
              let updatedEdges = [...prevEdges];
              return (
                multiConnectIds.forEach((sourceId) => {
                  sourceId !== targetNode.id &&
                    (updatedEdges = addEdge({
                        source: sourceId,
                        target: targetNode.id,
                        type: `default`,
                        id: `e-${sourceId}-${targetNode.id}-${Date.now()}`,
                      },
                      updatedEdges,
                    ));
                }),
                updatedEdges
              );
            }),
            setMultiConnectIds(null),
            showToast(`连接成功`));
      },
      [multiConnectIds, setEdges, showToast],
    );
  return { handleMultiConnectToTarget };
}
