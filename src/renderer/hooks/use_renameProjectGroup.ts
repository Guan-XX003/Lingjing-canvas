// @ts-nocheck
/**
 * renameProjectGroup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeProjectGroups } from "../lib/project-normalize";

export function use_renameProjectGroup(deps: any) {
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
