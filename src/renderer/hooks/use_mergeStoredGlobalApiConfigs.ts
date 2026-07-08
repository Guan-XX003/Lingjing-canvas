// @ts-nocheck
/**
 * mergeStoredGlobalApiConfigs。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig } from "../lib/app-types";
import { cloneBackupValue } from "../lib/backup";
import { normalizeUnifiedApiConfigs } from "../lib/unified-api-config";

interface UseMergeStoredGlobalApiConfigsDeps {
  apiConfigs: ApiConfig[];
}

export function use_mergeStoredGlobalApiConfigs(deps: UseMergeStoredGlobalApiConfigsDeps) {
  const {
    apiConfigs,
  } = deps;
  const mergeStoredGlobalApiConfigs = (value) => {
      let backupList = Array.isArray(value) ? cloneBackupValue(normalizeUnifiedApiConfigs(value)) : [],
        firstBackup = backupList[0],
        allBackups = Array.isArray(apiConfigs) ? cloneBackupValue(normalizeUnifiedApiConfigs(apiConfigs)) : [];
      if (!firstBackup) return allBackups;
      return [
        firstBackup,
        ...allBackups.slice(1).filter((backup) => backup && backup.id !== firstBackup.id),
      ];
    };
  return { mergeStoredGlobalApiConfigs };
}
