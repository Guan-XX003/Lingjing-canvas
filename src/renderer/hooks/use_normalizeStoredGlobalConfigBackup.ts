/**
 * normalizeStoredGlobalConfigBackup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig, Bindings } from "../lib/app-types";
import { cloneBackupValue } from "../lib/backup";
import { normalizeUnifiedApiConfigs } from "../lib/unified-api-config";

interface UseNormalizeStoredGlobalConfigBackupDeps {
  repairXSeeVeoReferenceVideoBindings: any;
  apiConfigs: ApiConfig[];
  videoApiUrl: any;
}

export function use_normalizeStoredGlobalConfigBackup(deps: UseNormalizeStoredGlobalConfigBackupDeps) {
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
