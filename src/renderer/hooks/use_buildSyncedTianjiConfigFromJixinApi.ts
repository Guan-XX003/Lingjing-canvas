// @ts-nocheck
/**
 * buildSyncedTianjiConfigFromJixinApi。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_buildSyncedTianjiConfigFromJixinApi(deps: any) {
  const {
    WANJUAN_JIXIN_API_URL,
    WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_JIXIN,
    WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL,
    normalizeTianjiSettingsSyncSource,
  } = deps;
  const buildSyncedTianjiConfigFromJixinApi = (currentConfig = {}, jixinConfig = null, options = {}) => {
      let current = currentConfig && typeof currentConfig == `object` ? currentConfig : {},
        currentSource = normalizeTianjiSettingsSyncSource(current.syncSource),
        jixinBaseUrl = String(jixinConfig?.url || WANJUAN_JIXIN_API_URL).replace(/\s+/g, ``).replace(/\/+$/, ``) || WANJUAN_JIXIN_API_URL,
        jixinToken = String(jixinConfig?.key || ``).trim(),
        currentBaseUrl = String(current.baseUrl || ``).replace(/\s+/g, ``).replace(/\/+$/, ``),
        hasExplicitSyncSource = Object.prototype.hasOwnProperty.call(current, `syncSource`);
      if (!options.force && !hasExplicitSyncSource && currentBaseUrl && currentBaseUrl !== WANJUAN_JIXIN_API_URL && currentBaseUrl !== jixinBaseUrl) return {
        ...current,
        syncSource: WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL,
      };
      if (!options.force && currentSource === WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL) return {
        ...current,
        syncSource: WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL,
      };
      return {
        ...current,
        baseUrl: jixinBaseUrl,
        token: jixinToken,
        syncSource: WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_JIXIN,
      };
    };
  return { buildSyncedTianjiConfigFromJixinApi };
}
