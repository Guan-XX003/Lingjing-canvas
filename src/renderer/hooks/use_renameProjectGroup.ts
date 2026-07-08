/**
 * renameProjectGroup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
import { normalizeProjectGroups } from "../lib/project-normalize";

interface UseRenameProjectGroupDeps {
  projectGroups: any;
  setEditingProjectGroupId: SetAny;
  setEditingProjectGroupName: SetAny;
}

export function use_renameProjectGroup(deps: UseRenameProjectGroupDeps) {
  const {
    projectGroups,
    setEditingProjectGroupId,
    setEditingProjectGroupName,
  } = deps;
  const renameProjectGroup = (groupId) => {
          let normalizedGroups = normalizeProjectGroups(projectGroups),
            targetGroup = normalizedGroups.find((group) => group.id === groupId);
          if (!targetGroup) return;
          (setEditingProjectGroupId(groupId), setEditingProjectGroupName(targetGroup.name || ``));
        };
  return { renameProjectGroup };
}
