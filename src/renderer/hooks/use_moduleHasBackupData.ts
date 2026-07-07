// @ts-nocheck
/**
 * moduleHasBackupData。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_moduleHasBackupData(deps: any) {
  const {
    TRANSIT_RESOURCES_STORAGE_KEY,
    projects,
  } = deps;
  const moduleHasBackupData = (moduleName, moduleData) =>
                        moduleName === `resources` ?
                        Array.isArray(moduleData?.localforage?.[TRANSIT_RESOURCES_STORAGE_KEY]) ?
                        moduleData.localforage[TRANSIT_RESOURCES_STORAGE_KEY].length > 0 :
                        !!(moduleData?.localforage && Object.keys(moduleData.localforage).length > 0) :
                        moduleName === `projects` ?
                        !!(
                          (Array.isArray(moduleData?.chromeStorage?.projects) &&
                            moduleData.chromeStorage.projects.length > 0) ||
                          (moduleData?.localforage?.canvasStates &&
                            Object.keys(moduleData.localforage.canvasStates).length > 0)
                        ) :
                        moduleName === `agents` ?
                        !!(
                          Array.isArray(moduleData?.chromeStorage?.agents) &&
                          moduleData.chromeStorage.agents.length > 0
                        ) :
                        !!(moduleData?.chromeStorage && Object.keys(moduleData.chromeStorage).length > 0);
  return { moduleHasBackupData };
}
