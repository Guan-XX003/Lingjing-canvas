/**
 * addKeyboardNode。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseAddKeyboardNodeDeps {
  createNodeAt: any;
  getShortcutNodePosition: any;
  menuPosition: any;
}

export function use_addKeyboardNode(deps: UseAddKeyboardNodeDeps) {
  const {
    createNodeAt,
    getShortcutNodePosition,
    menuPosition,
  } = deps;
  const addKeyboardNode = (nodeType, nodeData = {}) => {
		      let activeMenu =
		        menuPosition &&
		        (menuPosition.type === `canvas` || menuPosition.type === `connection`) ?
		        menuPosition :
		        null;
		      createNodeAt(nodeType, getShortcutNodePosition(), nodeData, activeMenu?.connection);
		    };
  return { addKeyboardNode };
}
