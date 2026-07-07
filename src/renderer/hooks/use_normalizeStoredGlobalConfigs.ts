// @ts-nocheck
/**
 * normalizeStoredGlobalConfigs。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_normalizeStoredGlobalConfigs(deps: any) {
  const {
    normalizeStoredGlobalConfigBackup,
  } = deps;
  const normalizeStoredGlobalConfigs = (items) =>
    Array.isArray(items) ?
    items
    .filter((item) => item && typeof item == `object` && item.id && item.name && item.config && typeof item.config == `object`)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      description: String(item.description || ``),
      source: String(item.source || ``),
      apiDocUrl: String(item.apiDocUrl || item.config?.apiDocUrl || item.config?.configButlerDocUrl || ``),
      updatedAt: item.updatedAt || 0,
      config: normalizeStoredGlobalConfigBackup(item.config),
    })) :
    [];
  return { normalizeStoredGlobalConfigs };
}
