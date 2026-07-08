// @ts-nocheck
/**
 * getBackupSettingsSectionMap。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";

interface UseGetBackupSettingsSectionMapDeps {
  BACKUP_SETTINGS_SECTION_ORDER: any;
  getBackupSettingSectionForKey: any;
}

export function use_getBackupSettingsSectionMap(deps: UseGetBackupSettingsSectionMapDeps) {
  const {
    BACKUP_SETTINGS_SECTION_ORDER,
    getBackupSettingSectionForKey,
  } = deps;
  const getBackupSettingsSectionMap = (settings) => {
      let sections = BACKUP_SETTINGS_SECTION_ORDER.reduce(
        (acc, section) => ({
          ...acc,
          [section]: {}
        }), {},
      );
      for (let [key, value] of Object.entries(settings || {}))
        sections[getBackupSettingSectionForKey(key)][key] = cloneBackupValue(value);
      return {
        sections: sections,
        availableSections: BACKUP_SETTINGS_SECTION_ORDER.filter(
          (section) => Object.keys(sections[section] || {}).length > 0,
        ),
      };
    };
  return { getBackupSettingsSectionMap };
}
