/**
 * createProjectGroup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { normalizeProjectGroups } from "../lib/project-normalize";

interface UseCreateProjectGroupDeps {
  persistProjectGroups: any;
  projectGroupDraft: any;
  projectGroups: any;
  setProjectGroupDraft: SetAny;
  showToast2: Toast;
}

export function use_createProjectGroup(deps: UseCreateProjectGroupDeps) {
  const {
    persistProjectGroups,
    projectGroupDraft,
    projectGroups,
    setProjectGroupDraft,
    showToast2,
  } = deps;
  const projectGroupT = (text: string) => (globalThis as any).wanjuanI18nRuntime?.t?.(text) || text;
  const createProjectGroup = () => {
          let groupName = String(projectGroupDraft || ``).trim();
          if (!groupName) {
            showToast2(projectGroupT(`分组名称不能为空`));
            return;
          }
          let existingGroups = normalizeProjectGroups(projectGroups);
          if (existingGroups.some((group) => group.name === groupName)) {
            showToast2(projectGroupT(`已存在同名分组`));
            return;
          }
          let updatedGroups = [...existingGroups, {
            id: `group-${Date.now()}`,
            name: groupName,
            collapsed: false,
            order: existingGroups.length
          }];
          (persistProjectGroups(updatedGroups), setProjectGroupDraft(``), showToast2(projectGroupT(`分组已创建`)));
        };
  return { createProjectGroup };
}
