// @ts-nocheck
/**
 * confirmProjectGroupRename。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeProjectGroups } from "../lib/project-normalize";

export function use_confirmProjectGroupRename(deps: any) {
  const {
    editingProjectGroupId,
    editingProjectGroupName,
    persistProjectGroups,
    projectGroups,
    setEditingProjectGroupId,
    setEditingProjectGroupName,
    showToast2,
  } = deps;
  const confirmProjectGroupRename = () => {
          if (!editingProjectGroupId) return;
          let normalizedGroups = normalizeProjectGroups(projectGroups),
            trimmedGroupName = String(editingProjectGroupName || ``).trim();
          if (!trimmedGroupName) {
            showToast2(`分组名称不能为空`);
            return;
          }
          (persistProjectGroups(normalizedGroups.map((group) => group.id === editingProjectGroupId ? {
            ...group,
            name: trimmedGroupName
          } : group)),
            setEditingProjectGroupId(null),
            setEditingProjectGroupName(``),
            showToast2(`分组已重命名`));
        };
  return { confirmProjectGroupRename };
}
