/**
 * confirmProjectGroupRename。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { normalizeProjectGroups } from "../lib/project-normalize";

interface UseConfirmProjectGroupRenameDeps {
  editingProjectGroupId: any;
  editingProjectGroupName: any;
  persistProjectGroups: any;
  projectGroups: any;
  setEditingProjectGroupId: SetAny;
  setEditingProjectGroupName: SetAny;
  showToast2: Toast;
}

export function use_confirmProjectGroupRename(deps: UseConfirmProjectGroupRenameDeps) {
  const {
    editingProjectGroupId,
    editingProjectGroupName,
    persistProjectGroups,
    projectGroups,
    setEditingProjectGroupId,
    setEditingProjectGroupName,
    showToast2,
  } = deps;
  const projectGroupT = (text: string) => (globalThis as any).wanjuanI18nRuntime?.t?.(text) || text;
  const confirmProjectGroupRename = () => {
          if (!editingProjectGroupId) return;
          let normalizedGroups = normalizeProjectGroups(projectGroups),
            trimmedGroupName = String(editingProjectGroupName || ``).trim();
          if (!trimmedGroupName) {
            showToast2(projectGroupT(`分组名称不能为空`));
            return;
          }
          (persistProjectGroups(normalizedGroups.map((group) => group.id === editingProjectGroupId ? {
            ...group,
            name: trimmedGroupName
          } : group)),
            setEditingProjectGroupId(null),
            setEditingProjectGroupName(``),
            showToast2(projectGroupT(`分组已重命名`)));
        };
  return { confirmProjectGroupRename };
}
