// @ts-nocheck
/**
 * splitChromeStorageModules。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_splitChromeStorageModules(deps: any) {
  const {
    AGENT_STORAGE_KEYS,
    DESKTOP_PROJECT_MIRROR_STORAGE_PREFIX,
    PROJECT_ASSET_STORAGE_PREFIX,
    PROJECT_CANVAS_STORAGE_PREFIX,
    PROJECT_STORAGE_KEYS,
    TRANSIT_RESOURCES_STORAGE_KEY,
    projects,
  } = deps;
  const splitChromeStorageModules = (storageData) => {
      let settings = {},
        projects2 = {},
        agents = {};
      for (let [key, value] of Object.entries(storageData || {}))
        PROJECT_STORAGE_KEYS.has(key) ?
        (projects2[key] = value) :
        AGENT_STORAGE_KEYS.has(key) ?
        (agents[key] = value) :
        key === TRANSIT_RESOURCES_STORAGE_KEY ||
        key.startsWith(PROJECT_CANVAS_STORAGE_PREFIX) ||
        key.startsWith(DESKTOP_PROJECT_MIRROR_STORAGE_PREFIX) ||
        key.startsWith(PROJECT_ASSET_STORAGE_PREFIX) ?
        undefined :
        (settings[key] = value);
      return {
        settings: settings,
        projects: projects2,
        agents: agents
      };
    };
  return { splitChromeStorageModules };
}
