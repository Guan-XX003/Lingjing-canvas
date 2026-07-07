// @ts-nocheck
/**
 * collectSelectedLocalforageBackup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { extractProjectPortableDataRefs } from "../lib/backup";
import { normalizeModuleSelection } from "../lib/project-normalize";

export function use_collectSelectedLocalforageBackup(deps: any) {
  const {
    extractProjectAssetRefs,
    getDesktopProjectMirrorStorageKey,
    getProjectCanvasStorageKey,
    projects,
  } = deps;
  const collectSelectedLocalforageBackup = async (moduleSelection, options = {}, backupOptions = {}) => {
                      let canvasStates = {};
                      if (!localforageModule.default) return canvasStates;
                      if (!normalizeModuleSelection(moduleSelection, [`settings`, `projects`, `agents`]).includes(`projects`))
                        return canvasStates;
                      let projectIds = Array.isArray(options.projectIds) && options.projectIds.length ?
                          options.projectIds.filter(Boolean) :
                          Array.isArray(backupOptions.projects) ?
                          backupOptions.projects.map((project) => project.id).filter(Boolean) :
                          [],
                        assetRefs = new Set(),
                        collectedModules = [];
                      let mirrorSource = backupOptions || {};
                      for (let projectId of projectIds) {
                        let storageKey = getProjectCanvasStorageKey(projectId),
                          canvasState = null;
                        try {
                          canvasState = await localforageModule.default.getItem(storageKey);
                        } catch {}
                        if (!canvasState && Object.prototype.hasOwnProperty.call(mirrorSource, getDesktopProjectMirrorStorageKey(projectId))) {
                          canvasState = mirrorSource[getDesktopProjectMirrorStorageKey(projectId)];
                        }
                        if (!canvasState) continue;
                        (canvasStates[storageKey] = canvasState,
                          extractProjectAssetRefs(canvasState).forEach((assetRef) => assetRefs.add(assetRef)),
                          extractProjectPortableDataRefs(canvasState).forEach((portableDataRef) => assetRefs.add(portableDataRef)));
                      }
                      for (let storageKey of assetRefs)
                        try {
                          let storedValue = await localforageModule.default.getItem(storageKey);
                          storedValue !== undefined && (canvasStates[storageKey] = storedValue);
                        } catch {}
                      return canvasStates;
                    };
  return { collectSelectedLocalforageBackup };
}
