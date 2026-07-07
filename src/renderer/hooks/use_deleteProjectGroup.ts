// @ts-nocheck
/**
 * deleteProjectGroup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeProjectGroups } from "../lib/project-normalize";

export function use_deleteProjectGroup(deps: any) {
  const {
    persistProjectGroups,
    projectGroups,
    projects,
    setProjects,
    showToast2,
  } = deps;
  const deleteProjectGroup = (groupId) => {
          let normalizedGroups = normalizeProjectGroups(projectGroups),
            targetGroup = normalizedGroups.find((group) => group.id === groupId);
          if (!targetGroup) return;
          if (!confirm(`删除分组“${targetGroup.name}”？分组内项目会移动到未分组。`)) return;
          let updatedProjects = projects.map((project) => project.groupId === groupId ? {
            ...project,
            groupId: ``
          } : project),
            updatedGroups = normalizedGroups.filter((group) => group.id !== groupId).map((group, index) => ({
              ...group,
              order: index
            }));
          (setProjects(updatedProjects),
            persistProjectGroups(updatedGroups, updatedProjects),
            showToast2(`分组已删除`));
        };
  return { deleteProjectGroup };
}
