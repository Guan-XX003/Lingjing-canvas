// @ts-nocheck
/**
 * ConfirmRenameProject。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
declare const chrome: any;

interface UseConfirmRenameProjectDeps {
  isPluginEnv: boolean;
  projects: any;
  renameProjectId: any;
  renameProjectName: any;
  setProjects: SetAny;
  setRenameProjectId: SetAny;
  setRenameProjectName: SetAny;
  showToast2: Toast;
}

export function use_ConfirmRenameProject(deps: UseConfirmRenameProjectDeps) {
  const {
    isPluginEnv,
    projects,
    renameProjectId,
    renameProjectName,
    setProjects,
    setRenameProjectId,
    setRenameProjectName,
    showToast2,
  } = deps;
  const ConfirmRenameProject = () => {
          if (!renameProjectId) return;
          let trimmedName = renameProjectName.trim();
          if (!trimmedName) {
            showToast2(`项目名称不能为空`);
            return;
          }
          let updatedProjects = projects.map((project) =>
            project.id === renameProjectId ? {
              ...project,
              name: trimmedName
            } : project,
          );
          (setProjects(updatedProjects),
            isPluginEnv && chrome.storage.local.set({
              projects: updatedProjects
            }),
            setRenameProjectId(null),
            setRenameProjectName(``),
            showToast2(`项目名称已更新`));
        };
  return { ConfirmRenameProject };
}
