// @ts-nocheck
/**
 * createProjectGroup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeProjectGroups } from "../lib/project-normalize";

export function use_createProjectGroup(deps: any) {
  const {
    persistProjectGroups,
    projectGroupDraft,
    projectGroups,
    setProjectGroupDraft,
    showToast2,
  } = deps;
  const createProjectGroup = () => {
          let groupName = String(projectGroupDraft || ``).trim();
          if (!groupName) {
            showToast2(`分组名称不能为空`);
            return;
          }
          let existingGroups = normalizeProjectGroups(projectGroups);
          if (existingGroups.some((group) => group.name === groupName)) {
            showToast2(`已存在同名分组`);
            return;
          }
          let updatedGroups = [...existingGroups, {
            id: `group-${Date.now()}`,
            name: groupName,
            collapsed: false,
            order: existingGroups.length
          }];
          (persistProjectGroups(updatedGroups), setProjectGroupDraft(``), showToast2(`分组已创建`));
        };
  return { createProjectGroup };
}
