// @ts-nocheck
/**
 * persistProjectsWithStorageState。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_persistProjectsWithStorageState(deps: any) {
  const {
    isPluginEnv,
    projects,
    setProjects,
  } = deps;
  const persistProjectsWithStorageState = (projectId, storageStatus, storageDetail = ``) => {
          let updatedProjects = projects.map((project) => project.id === projectId ? {
            ...project,
            storageStatus: storageStatus,
            storageDetail: storageDetail,
            storageUpdatedAt: Date.now(),
          } : project);
          (setProjects(updatedProjects),
            isPluginEnv && chrome.storage.local.set({
              projects: updatedProjects
            }));
          return updatedProjects;
        };
  return { persistProjectsWithStorageState };
}
