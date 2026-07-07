// @ts-nocheck
/**
 * resolveJixinApiConfigForTianjiSettings。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { isJixinDefaultApiConfig } from "../lib/model-list-utils";
import { wanjuanFindLegacyJixinApiKey } from "../lib/jixin-catalog";

export function use_resolveJixinApiConfigForTianjiSettings(deps: any) {
  const {
    WANJUAN_JIXIN_API_URL,
    apiConfigs,
  } = deps;
  const resolveJixinApiConfigForTianjiSettings = (candidateConfig = null, stored = {}) => {
      let storedApiConfigs = Array.isArray(stored.apiConfigs) ? stored.apiConfigs : [],
        storedJixinConfig = storedApiConfigs.find(isJixinDefaultApiConfig) || null,
        sourceConfig = candidateConfig || storedJixinConfig;
      if (!sourceConfig && !wanjuanFindLegacyJixinApiKey(stored)) return null;
      let sourceBaseUrl =
          String(sourceConfig?.url || storedJixinConfig?.url || WANJUAN_JIXIN_API_URL)
          .replace(/\s+/g, ``)
          .replace(/\/+$/, ``) || WANJUAN_JIXIN_API_URL,
        sourceKey =
          String(sourceConfig?.key || ``).trim() ||
          String(storedJixinConfig?.key || ``).trim() ||
          wanjuanFindLegacyJixinApiKey(stored);
      return {
        ...(storedJixinConfig && typeof storedJixinConfig == `object` ? storedJixinConfig : {}),
        ...(sourceConfig && typeof sourceConfig == `object` ? sourceConfig : {}),
        id: sourceConfig?.id || storedJixinConfig?.id || `jixin-default`,
        name: sourceConfig?.name || storedJixinConfig?.name || `极鑫`,
        url: sourceBaseUrl,
        key: sourceKey,
      };
    };
  return { resolveJixinApiConfigForTianjiSettings };
}
