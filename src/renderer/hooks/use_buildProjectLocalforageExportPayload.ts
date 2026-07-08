// @ts-nocheck
/**
 * buildProjectLocalforageExportPayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";

interface UseBuildProjectLocalforageExportPayloadDeps {
  externalizeProjectCanvasState: any;
  extractProjectAssetRefs: any;
  getProjectCanvasStorageKey: any;
  sanitizeProjectCanvasStateForExport: any;
  prepareProjectMediaStateForPersistence: any;
}

export function use_buildProjectLocalforageExportPayload(deps: UseBuildProjectLocalforageExportPayloadDeps) {
  const {
    externalizeProjectCanvasState,
    extractProjectAssetRefs,
    getProjectCanvasStorageKey,
    sanitizeProjectCanvasStateForExport,
    prepareProjectMediaStateForPersistence,
  } = deps;
  const buildProjectLocalforageExportPayload = async (projectState, projectIds = [], exportOptions = {}) => {
                      let canvasStates = {},
                        assetRefs = new Set(),
                        assetMap = {},
                        sourceState = projectState || {};
                      for (let projectId of projectIds) {
                        if (!projectId) continue;
                        let projectState =
                          projectId === exportOptions.currentProjectId && exportOptions.currentProjectState ?
                          sanitizeProjectCanvasStateForExport(exportOptions.currentProjectState) :
                          Object.prototype.hasOwnProperty.call(sourceState, getProjectCanvasStorageKey(projectId)) ?
                          sanitizeProjectCanvasStateForExport(sourceState[getProjectCanvasStorageKey(projectId)]) :
                          null;
                        if (!projectState) continue;
                        projectState = await globalThis.prepareProjectMediaStateForPersistence(projectState, projectId, ``);
                        let externalizedState = await externalizeProjectCanvasState(projectState, projectId, {
                          assetMap: assetMap,
                          persist: false,
                        });
                        ((canvasStates[projectId] = externalizedState), extractProjectAssetRefs(externalizedState).forEach((assetRef) => assetRefs.add(assetRef)));
                      }
                      for (let key of assetRefs)
                        Object.prototype.hasOwnProperty.call(sourceState, key) &&
                        !Object.prototype.hasOwnProperty.call(assetMap, key) &&
                        (assetMap[key] = cloneBackupValue(sourceState[key]));
                      return {
                        canvasStates: canvasStates,
                        assets: assetMap
                      };
                    };
  return { buildProjectLocalforageExportPayload };
}
