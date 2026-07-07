// @ts-nocheck
/**
 * buildProjectLocalforagePayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";

export function use_buildProjectLocalforagePayload(deps: any) {
  const {
    extractProjectAssetRefs,
    getProjectCanvasStorageKey,
  } = deps;
  const buildProjectLocalforagePayload = (projectState, projectIds = []) => {
                    let canvasStates = {},
                      assetRefs = new Set(),
                      source = projectState || {};
                    for (let projectId of projectIds) {
                      if (!projectId) continue;
                      let storageKey = getProjectCanvasStorageKey(projectId);
                      if (!Object.prototype.hasOwnProperty.call(source, storageKey)) continue;
                      let canvasState = cloneBackupValue(source[storageKey]);
                      ((canvasStates[projectId] = canvasState), extractProjectAssetRefs(canvasState).forEach((assetRef) => assetRefs.add(assetRef)));
                    }
                    let assets = {};
                    for (let assetRef of assetRefs)
                      Object.prototype.hasOwnProperty.call(source, assetRef) &&
                      (assets[assetRef] = cloneBackupValue(source[assetRef]));
                    return {
                      canvasStates: canvasStates,
                      assets: assets
                    };
                  };
  return { buildProjectLocalforagePayload };
}
