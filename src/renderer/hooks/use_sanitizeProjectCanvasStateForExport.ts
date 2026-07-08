// @ts-nocheck
/**
 * sanitizeProjectCanvasStateForExport。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";

interface UseSanitizeProjectCanvasStateForExportDeps {
  sanitizeProjectNodeDataForExport: any;
}

export function use_sanitizeProjectCanvasStateForExport(deps: UseSanitizeProjectCanvasStateForExportDeps) {
  const {
    sanitizeProjectNodeDataForExport,
  } = deps;
  const sanitizeProjectCanvasStateForExport = (exportCanvasState) => {
                    let canvasState = cloneBackupValue(exportCanvasState || {});
                    return (
                      Array.isArray(canvasState.nodes) &&
                      (canvasState.nodes = canvasState.nodes.map((node) =>
                        node && typeof node == `object` ?
                        node.data && typeof node.data == `object` ?
                        {
                          ...node,
                          data: sanitizeProjectNodeDataForExport(node.data)
                        } :
                        node :
                        node,
                      )),
                      canvasState
                    );
                  };
  return { sanitizeProjectCanvasStateForExport };
}
