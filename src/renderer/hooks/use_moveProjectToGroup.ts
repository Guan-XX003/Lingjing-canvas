// @ts-nocheck
/**
 * moveProjectToGroup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeProjectGroups } from "../lib/project-normalize";
declare const chrome: any;

export function use_moveProjectToGroup(deps: any) {
  const {
    isPluginEnv,
    projectGroups,
    projects,
    setProjects,
  } = deps;
  const moveProjectToGroup = (projectId, groupId) => {
          let updatedProjects = projects.map((project) => project.id === projectId ? {
            ...project,
            groupId: groupId || ``
          } : project);
          (setProjects(updatedProjects),
            isPluginEnv && chrome.storage.local.set({
              projects: updatedProjects,
              projectGroups: normalizeProjectGroups(projectGroups)
            }));
        };
  return { moveProjectToGroup };
}
