// @ts-nocheck
/**
 * handleCreateProject。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeProjectGroups } from "../lib/project-normalize";
declare const chrome: any;

export function use_handleCreateProject(deps: any) {
  const {
    isPluginEnv,
    newProjectGroupId,
    newProjectName,
    projectGroups,
    projects,
    setActiveProjectId,
    setNewProjectGroupId,
    setNewProjectIds,
    setNewProjectName,
    setProjectMenuOpen,
    setProjects,
  } = deps;
  const handleCreateProject = () => {
          if (!newProjectName.trim()) return;
          let normalizedGroupsForNewProject = normalizeProjectGroups(projectGroups),
            validNewProjectGroupIds = new Set(normalizedGroupsForNewProject.map((group) => group.id)),
            selectedNewProjectGroupId = validNewProjectGroupIds.has(newProjectGroupId) ? newProjectGroupId : ``,
            newProject = {
              id: `proj-${Date.now()}`,
              name: newProjectName,
              groupId: selectedNewProjectGroupId
            },
            updatedProjects = [...projects, newProject];
	          (setProjects(updatedProjects),
	            setNewProjectIds((prevProjectIds) => (prevProjectIds.includes(newProject.id) ? prevProjectIds : [...prevProjectIds, newProject.id])),
	            setActiveProjectId(newProject.id),
            setNewProjectName(``),
            setNewProjectGroupId(selectedNewProjectGroupId),
            setProjectMenuOpen(false),
            isPluginEnv && chrome.storage.local.set({
              projects: updatedProjects,
              projectGroups: normalizedGroupsForNewProject
            }));
        };
  return { handleCreateProject };
}
