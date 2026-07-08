/**
 * onConnectEnd。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Ref, SetAny } from "../lib/app-types";

interface UseOnConnectEndDeps {
  screenToFlowPosition: any;
  setEdges: SetAny;
  setMenuPosition: SetAny;
  setNodes: SetAny;
  setResourceSubmenuOpen: SetAny;
  setResourceSubmenuOpenAlt: SetAny;
  wrapperRef: Ref;
}

export function useOnConnectEnd(deps: UseOnConnectEndDeps) {
  const {
    screenToFlowPosition,
    setEdges,
    setMenuPosition,
    setNodes,
    setResourceSubmenuOpen,
    setResourceSubmenuOpenAlt,
    wrapperRef,
  } = deps;
  const onConnectEnd = useCallback(
            (event, connectionState) => {
              if (!connectionState.isValid && connectionState.fromNode && connectionState.fromHandle) {
                let {
                  clientX: clientX,
                  clientY: clientY
                } =
                `changedTouches` in event ? event.changedTouches[0] : event,
                  rect = wrapperRef.current?.getBoundingClientRect();
                rect &&
                  setTimeout(() => {
                    let position = screenToFlowPosition({
                      x: clientX,
                      y: clientY
                    });
                    (setNodes((nodes2) =>
                        nodes2
                        .filter((node) => node.id !== `ghost-target`)
                        .concat({
                          id: `ghost-target`,
                          type: `default`,
                          position: position,
                          style: {
                            opacity: 0,
                            pointerEvents: `none`,
                            width: 1,
                            height: 1,
                          },
                          data: {
                            label: ``
                          },
                        }),
                      ),
                      setEdges((edges2) =>
                        edges2
                        .filter((edge) => edge.id !== `ghost-edge`)
                        .concat({
                          id: `ghost-edge`,
                          source: connectionState.fromNode.id,
                          sourceHandle: connectionState.fromHandle.id || null,
                          target: `ghost-target`,
                          style: {
                            strokeDasharray: `5 5`,
                            stroke: `#ff0072`,
                            strokeWidth: 2,
                          },
                          animated: true,
                        }),
                      ),
                      setMenuPosition({
                        x: clientX - rect.left,
                        y: clientY - rect.top,
                        type: `connection`,
                        connection: {
                          source: connectionState.fromNode.id,
                          sourceHandle: connectionState.fromHandle.id || null,
                          dropPosition: position,
                        },
                      }),
                      setResourceSubmenuOpen(false), setResourceSubmenuOpenAlt(false));
                  }, 50);
              }
            },
            [setMenuPosition],
          );
  return { onConnectEnd };
}
