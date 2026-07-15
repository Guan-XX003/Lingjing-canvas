/**
 * buildJixinDefaultResetPatch。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig, StoredGlobalConfig } from "../lib/app-types";
import { WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION, WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID, WANJUAN_JIXIN_DEFAULT_API_URL, wanjuanBuildJixinBuiltinBasePatch, wanjuanBuildJixinBuiltinStoredGlobalConfig } from "../lib/jixin-catalog";
import { wanjuanTianjiSeedanceDefaults } from "../lib/tianji-api";
import { WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG } from "../lib/ark-trusted-assets";

interface UseBuildJixinDefaultResetPatchDeps {
  WANJUAN_JIXIN_DOC_URL: any;
  activeStoredGlobalConfigId: any;
  apiConfigs: ApiConfig[];
  audioApiKey: any;
  configButlerApiKey: any;
  configButlerApiUrl: any;
  configButlerDocUrl: any;
  configButlerMode: any;
  configButlerModel: any;
  configButlerProtocol: any;
  configButlerRepairHistory: any;
  configButlerTargetApiConfigId: any;
  configButlerTargetCategory: any;
  imageApiKey: any;
  storedGlobalConfigs: StoredGlobalConfig[];
  textApiKey: any;
  tianjiSeedanceSettingsMode: any;
  videoApiKey: any;
}

export function use_buildJixinDefaultResetPatch(deps: UseBuildJixinDefaultResetPatchDeps) {
  const {
    WANJUAN_JIXIN_DOC_URL,
    activeStoredGlobalConfigId,
    apiConfigs,
    audioApiKey,
    configButlerApiKey,
    configButlerApiUrl,
    configButlerDocUrl,
    configButlerMode,
    configButlerModel,
    configButlerProtocol,
    configButlerRepairHistory,
    configButlerTargetApiConfigId,
    configButlerTargetCategory,
    imageApiKey,
    storedGlobalConfigs,
    textApiKey,
    tianjiSeedanceSettingsMode,
    videoApiKey,
  } = deps;
  const buildJixinDefaultResetPatch = () => {
      let baseConfig = wanjuanBuildJixinBuiltinBasePatch({
          apiConfigs: [{
            id: WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
            name: `极鑫`,
            url: WANJUAN_JIXIN_DEFAULT_API_URL,
            key: ``,
            protocolFormat: `auto`,
          }],
        }),
        builtinStoredConfig = wanjuanBuildJixinBuiltinStoredGlobalConfig(baseConfig),
        foundBuiltinConfig = false,
        nextStoredGlobalConfigs = (storedGlobalConfigs || []).map((config) => {
          if (config?.id !== builtinStoredConfig.id) return config;
          foundBuiltinConfig = true;
          return builtinStoredConfig;
        });
      if (!foundBuiltinConfig) nextStoredGlobalConfigs.unshift(builtinStoredConfig);
      return {
        ...baseConfig,
        apiKey: ``,
        apiUrl: WANJUAN_JIXIN_DEFAULT_API_URL,
        textApiKey: ``,
        imageApiKey: ``,
        videoApiKey: ``,
        audioApiKey: ``,
        configButlerApiUrl: ``,
        configButlerApiKey: ``,
        configButlerProtocol: `openai`,
        configButlerModel: ``,
        configButlerDocUrl: WANJUAN_JIXIN_DOC_URL,
        configButlerMode: `batch`,
        configButlerTargetCategory: `text`,
        configButlerTargetApiConfigId: WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
        configButlerRepairHistory: [],
        storedGlobalConfigs: nextStoredGlobalConfigs,
        activeStoredGlobalConfigId: builtinStoredConfig.id,
        arkTrustedAssetConfig: { ...WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG },
        tianjiSeedanceConfig: wanjuanTianjiSeedanceDefaults,
        tianjiSeedanceSettingsMode: `official`,
        jixinBuiltinBaseConfigVersion: WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION,
        jixinGatewayModelScanSnapshot: null,
        jixinGatewayModelScanLastAt: 0,
      };
    };
  return { buildJixinDefaultResetPatch };
}
