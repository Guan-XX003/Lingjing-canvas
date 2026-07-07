// @ts-nocheck
/**
 * getBackupChromeStorageKeys。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { BACKUP_SETTINGS_SECTION_KEYS } from "../lib/app-root-helpers";
import { normalizeModuleSelection } from "../lib/project-normalize";

export function use_getBackupChromeStorageKeys(deps: any) {
  const {
    AGENT_STORAGE_KEYS,
    PROJECT_STORAGE_KEYS,
    getDesktopProjectMirrorStorageKey,
  } = deps;
  const getBackupChromeStorageKeys = (moduleSelection, options = {}) => {
                      let selectedModules = normalizeModuleSelection(moduleSelection, [`settings`, `projects`, `agents`]),
                        storageKeys = new Set();
                      if (selectedModules.includes(`settings`))
                        for (let sectionKeys of Object.values(BACKUP_SETTINGS_SECTION_KEYS))
                          for (let storageKey of sectionKeys) storageKeys.add(storageKey);
                      if (selectedModules.includes(`projects`)) {
                        PROJECT_STORAGE_KEYS.forEach((storageKey) => storageKeys.add(storageKey));
                        for (let projectId of Array.isArray(options.projectIds) ? options.projectIds : [])
                          projectId && storageKeys.add(getDesktopProjectMirrorStorageKey(projectId));
                      }
                      selectedModules.includes(`agents`) && AGENT_STORAGE_KEYS.forEach((storageKey) => storageKeys.add(storageKey));
                      return [...storageKeys];
                    };
  return { getBackupChromeStorageKeys };
}
