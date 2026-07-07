// @ts-nocheck
/**
 * saveApiModelCloudSettings。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS, wanjuanMergeModelText } from "../lib/jixin-catalog";
declare const chrome: any;

export function use_saveApiModelCloudSettings(deps: any) {
  const {
    activeStoredGlobalConfigId,
    apiConfigs,
    apiModelCloudSettingsSaveTimerRef,
    audioApiConfigId,
    audioApiKey,
    audioApiUrl,
    audioModelApiBindings,
    audioModelProtocolBindings,
    audioModels,
    configButlerApiKey,
    configButlerApiUrl,
    configButlerDocUrl,
    configButlerMode,
    configButlerModel,
    configButlerProtocol,
    configButlerTargetApiConfigId,
    configButlerTargetCategory,
    customPublicUploadConfig,
    imageApiConfigId,
    imageApiKey,
    imageApiUrl,
    imageCompatResolutions,
    imageModelApiBindings,
    imageModelProtocolBindings,
    imageModels,
    modelProtocolRegistry,
    qiniuConfig,
    seedanceDurations,
    seedanceEnableWebSearch,
    seedanceGenerateAudio,
    seedanceModel,
    seedanceRatios,
    seedanceResolutions,
    seedanceUploadMode,
    seedanceVirtualPortraits,
    seedanceWatermark,
    settingsHydratedRef,
    storedGlobalConfigs,
    syncTianjiConfigFromJixinApi,
    textApiConfigId,
    textApiKey,
    textApiUrl,
    textModelApiBindings,
    textModelProtocolBindings,
    textModels,
    tianjiSeedanceModel,
    tianjiSeedanceSettingsMode,
    tongyiWanxiangDurations,
    tongyiWanxiangEditModels,
    tongyiWanxiangImageModels,
    tongyiWanxiangRatios,
    tongyiWanxiangReferenceImageModels,
    tongyiWanxiangResolutions,
    tongyiWanxiangTextModels,
    tosConfig,
    ttsMusicModel,
    videoApiConfigId,
    videoApiKey,
    videoApiUrl,
    videoAspectRatios,
    videoDurations,
    videoModelApiBindings,
    videoModelProtocolBindings,
    videoModelRequestProfilesText,
    videoModels,
    videoResolutions,
  } = deps;
  const saveApiModelCloudSettings = () => {
      if (
        !settingsHydratedRef.current ||
        typeof chrome > `u` ||
        !chrome.storage ||
        !chrome.storage.local
      )
        return;
      apiModelCloudSettingsSaveTimerRef.current &&
        clearTimeout(apiModelCloudSettingsSaveTimerRef.current),
        (apiModelCloudSettingsSaveTimerRef.current = setTimeout(async () => {
          let settingsPatch = {
            textApiUrl: textApiUrl,
            textApiKey: textApiKey,
            imageApiUrl: imageApiUrl,
            imageApiKey: imageApiKey,
            videoApiUrl: videoApiUrl,
            videoApiKey: videoApiKey,
            audioApiUrl: audioApiUrl,
            audioApiKey: audioApiKey,
            textModel: textModels,
            drawingModel: imageModels,
            imageCompatResolutions: imageCompatResolutions,
            videoModel: videoModels,
            videoDurations: videoDurations,
            videoResolutions: videoResolutions,
            videoAspectRatios: videoAspectRatios,
            seedanceModel: seedanceModel,
            tianjiSeedanceModel: tianjiSeedanceModel,
            seedanceDurations: seedanceDurations,
            seedanceResolutions: seedanceResolutions,
            seedanceRatios: seedanceRatios,
            seedanceGenerateAudio: seedanceGenerateAudio,
            seedanceWatermark: seedanceWatermark,
            seedanceEnableWebSearch: seedanceEnableWebSearch,
            seedanceVirtualPortraits: seedanceVirtualPortraits,
	            tianjiSeedanceSettingsMode: tianjiSeedanceSettingsMode,
            tongyiWanxiangTextModels: tongyiWanxiangTextModels,
            tongyiWanxiangReferenceImageModels: tongyiWanxiangReferenceImageModels,
            tongyiWanxiangImageModels: tongyiWanxiangImageModels,
            tongyiWanxiangEditModels: tongyiWanxiangEditModels,
            tongyiWanxiangDurations: tongyiWanxiangDurations,
            tongyiWanxiangResolutions: tongyiWanxiangResolutions,
            tongyiWanxiangRatios: tongyiWanxiangRatios,
            seedanceUploadMode: seedanceUploadMode,
            tosConfig: tosConfig,
            customPublicUploadConfig: customPublicUploadConfig,
            qiniuConfig: qiniuConfig,
            audioModel: audioModels,
            ttsMusicModel: ttsMusicModel,
            modelProtocolRegistry: modelProtocolRegistry,
            configButlerApiUrl: configButlerApiUrl,
            configButlerApiKey: configButlerApiKey,
            configButlerProtocol: configButlerProtocol,
            configButlerModel: configButlerModel,
            configButlerDocUrl: configButlerDocUrl,
            configButlerMode: configButlerMode,
            configButlerTargetCategory: configButlerTargetCategory,
            configButlerTargetApiConfigId: configButlerTargetApiConfigId,
            storedGlobalConfigs: storedGlobalConfigs,
            activeStoredGlobalConfigId: activeStoredGlobalConfigId,
            apiConfigs: apiConfigs,
            textModelApiBindings: textModelApiBindings,
            textModelProtocolBindings: textModelProtocolBindings,
            imageModelApiBindings: imageModelApiBindings,
            imageModelProtocolBindings: imageModelProtocolBindings,
            videoModelProtocolBindings: videoModelProtocolBindings,
            textApiConfigId: textApiConfigId,
            imageApiConfigId: imageApiConfigId,
            videoApiConfigId: videoApiConfigId,
            audioApiConfigId: audioApiConfigId,
            videoModelApiBindings: videoModelApiBindings,
            audioModelProtocolBindings: audioModelProtocolBindings,
            audioModelApiBindings: audioModelApiBindings,
          };
          try {
            videoModelRequestProfilesText.trim() &&
              JSON.parse(videoModelRequestProfilesText);
            settingsPatch.videoModelRequestProfiles = videoModelRequestProfilesText;
          } catch (error) {
            console.warn(`Skip autosaving invalid video model request profiles`, error);
          }
          try {
            let syncedTianjiSeedanceConfig = await syncTianjiConfigFromJixinApi(apiConfigs);
            syncedTianjiSeedanceConfig &&
              (settingsPatch.tianjiSeedanceConfig = {
                ...syncedTianjiSeedanceConfig,
                models: String(tianjiSeedanceModel || ``).trim() || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS),
              });
          } catch (error) {
            console.warn(`Auto sync Tianji config from Jixin API failed`, error);
          }
          chrome.storage.local.set(settingsPatch);
        }, 250));
    };
  return { saveApiModelCloudSettings };
}
