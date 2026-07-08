/**
 * persistProjectsWithStorageState。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
declare const chrome: any;

interface UsePersistProjectsWithStorageStateDeps {
  isPluginEnv: boolean;
  projects: any;
  setProjects: SetAny;
}

export function use_persistProjectsWithStorageState(deps: UsePersistProjectsWithStorageStateDeps) {
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
