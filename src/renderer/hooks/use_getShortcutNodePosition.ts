// @ts-nocheck
/**
 * getShortcutNodePosition。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Ref } from "../lib/app-types";

interface UseGetShortcutNodePositionDeps {
  lastCanvasMenuPositionRef: Ref;
  menuPosition: any;
  screenToFlowPosition: any;
  wrapperRef: Ref;
}

export function use_getShortcutNodePosition(deps: UseGetShortcutNodePositionDeps) {
  const {
    lastCanvasMenuPositionRef,
    menuPosition,
    screenToFlowPosition,
    wrapperRef,
  } = deps;
  const getShortcutNodePosition = () => {
		      let rect = wrapperRef.current?.getBoundingClientRect(),
		        activeMenu =
		        menuPosition &&
		        (menuPosition.type === `canvas` || menuPosition.type === `connection`) ?
		        menuPosition :
		        null,
		        anchor = activeMenu || lastCanvasMenuPositionRef.current;
		      return rect && anchor ?
		        screenToFlowPosition({
		          x: rect.left + anchor.x,
		          y: rect.top + anchor.y,
		        }) :
		        rect ?
		        screenToFlowPosition({
		          x: rect.left + rect.width / 2,
		          y: rect.top + rect.height / 2,
		        }) :
		        {
		          x: 0,
		          y: 0
		        };
		    };
  return { getShortcutNodePosition };
}
