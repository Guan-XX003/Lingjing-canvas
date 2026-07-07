// @ts-nocheck
/**
 * persistProjectGroups。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeProjectGroups } from "../lib/project-normalize";
declare const chrome: any;

export function use_persistProjectGroups(deps: any) {
  const {
    isPluginEnv,
    projects,
    setProjectGroups,
    projectGroups,
  } = deps;
  const persistProjectGroups = (groups, projects2 = projects) => {
          let normalizedGroups = normalizeProjectGroups(groups);
          (setProjectGroups(normalizedGroups),
            isPluginEnv && chrome.storage.local.set({
              projects: projects2,
              projectGroups: normalizedGroups
            }));
          return normalizedGroups;
        };
  return { persistProjectGroups };
}
