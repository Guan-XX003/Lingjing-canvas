// @ts-nocheck
/**
 * 画布右键菜单定位 handler（画布/节点/选区/延迟选区菜单）。
 * 自 bundle(WanJuanAppCanvas) 抽出的自定义 hook，行为保持一致；菜单状态仍在组件内，此处只产出定位 handler。
 */
import { useCallback } from "react";

export function useCanvasContextMenu({
  wrapperRef,
  lastCanvasMenuPositionRef,
  nodesRef,
  setMenuPosition,
  setResourceSubmenuOpen,
  setResourceSubmenuOpenAlt,
}: any) {
  const handleContextMenu = useCallback((event: any) => {
    event.preventDefault();
    const containerRect = wrapperRef.current?.getBoundingClientRect();
    if (containerRect) {
      const clientX = event.clientX, clientY = event.clientY;
      lastCanvasMenuPositionRef.current = { x: clientX - containerRect.left, y: clientY - containerRect.top };
      setMenuPosition({
        x: clientX - containerRect.left,
        y: clientY - containerRect.top,
        menuOrigin: clientY - containerRect.top > containerRect.height / 2 ? "bottom" : "top",
        menuBottom: containerRect.height - (clientY - containerRect.top),
        type: "canvas",
      });
      setResourceSubmenuOpen(false);
      setResourceSubmenuOpenAlt(false);
    }
  }, [setMenuPosition]);

  const handleNodeContextMenu = useCallback((event: any, contextNode: any) => {
    event.preventDefault();
    const containerRect = wrapperRef.current?.getBoundingClientRect();
    if (containerRect) {
      setMenuPosition({
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
        menuOrigin: event.clientY - containerRect.top > containerRect.height / 2 ? "bottom" : "top",
        menuBottom: containerRect.height - (event.clientY - containerRect.top),
        type: "node",
        nodeId: contextNode.id,
      });
      setResourceSubmenuOpen(false);
      setResourceSubmenuOpenAlt(false);
    }
  }, [setMenuPosition]);

  const handleSelectionContextMenu = useCallback((event: any, _contextSelectionNode: any) => {
    event.preventDefault();
    const containerRect = wrapperRef.current?.getBoundingClientRect();
    if (containerRect) {
      setMenuPosition({
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
        menuOrigin: event.clientY - containerRect.top > containerRect.height / 2 ? "bottom" : "top",
        menuBottom: containerRect.height - (event.clientY - containerRect.top),
        type: "selection",
      });
      setResourceSubmenuOpen(false);
      setResourceSubmenuOpenAlt(false);
    }
  }, [setMenuPosition]);

  const handleDelayedSelectionMenu = useCallback((event: any) => {
    setTimeout(() => {
      if (nodesRef.current.filter((node: any) => node.selected).length > 1) {
        const containerRect = wrapperRef.current?.getBoundingClientRect();
        if (containerRect) {
          setMenuPosition({
            x: event.clientX - containerRect.left,
            y: event.clientY - containerRect.top,
            menuOrigin: event.clientY - containerRect.top > containerRect.height / 2 ? "bottom" : "top",
            menuBottom: containerRect.height - (event.clientY - containerRect.top),
            type: "selection",
          });
          setResourceSubmenuOpen(false);
          setResourceSubmenuOpenAlt(false);
        }
      }
    }, 50);
  }, [setMenuPosition]);

  return { handleContextMenu, handleNodeContextMenu, handleSelectionContextMenu, handleDelayedSelectionMenu };
}
