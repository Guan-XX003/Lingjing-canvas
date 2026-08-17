/**
 * deleteProjectGroup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { normalizeProjectGroups } from "../lib/project-normalize";

interface UseDeleteProjectGroupDeps {
  persistProjectGroups: any;
  projectGroups: any;
  projects: any;
  setProjects: SetAny;
  showToast2: Toast;
}

export function use_deleteProjectGroup(deps: UseDeleteProjectGroupDeps) {
  const {
    persistProjectGroups,
    projectGroups,
    projects,
    setProjects,
    showToast2,
  } = deps;
  const projectGroupT = (text: string) => (globalThis as any).wanjuanI18nRuntime?.t?.(text) || text;
  const projectGroupTf = (text: string, values: Record<string, unknown>) =>
    (globalThis as any).wanjuanI18nRuntime?.format?.(text, values) ||
    text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => values[key] == null ? match : String(values[key]));
  const deleteProjectGroup = (groupId) => {
          let normalizedGroups = normalizeProjectGroups(projectGroups),
            targetGroup = normalizedGroups.find((group) => group.id === groupId);
          if (!targetGroup) return;
          if (!confirm(
            `${projectGroupTf(`删除分组“{name}”？`, { name: targetGroup.name })}${projectGroupT(`分组内项目会移动到未分组。`)}`
          )) return;
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
            showToast2(projectGroupT(`分组已删除`)));
        };
  return { deleteProjectGroup };
}
