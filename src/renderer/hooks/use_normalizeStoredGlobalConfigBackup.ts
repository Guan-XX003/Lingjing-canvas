// @ts-nocheck
/**
 * normalizeStoredGlobalConfigBackup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";
import { normalizeUnifiedApiConfigs } from "../lib/unified-api-config";

export function use_normalizeStoredGlobalConfigBackup(deps: any) {
  const {
    repairXSeeVeoReferenceVideoBindings,
    apiConfigs,
    videoApiUrl,
  } = deps;
  const normalizeStoredGlobalConfigBackup = (backup = {}) => {
      let config = backup && typeof backup == `object` ? cloneBackupValue(backup) : {};
      Array.isArray(config.apiConfigs) && (config.apiConfigs = normalizeUnifiedApiConfigs(config.apiConfigs));
      let configApiUrl = config.videoApiUrl || config.apiConfigs?.find((apiConfig) => apiConfig?.url)?.url || ``;
      return repairXSeeVeoReferenceVideoBindings(config, configApiUrl);
    };
  return { normalizeStoredGlobalConfigBackup };
}
