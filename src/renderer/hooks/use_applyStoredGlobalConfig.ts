/**
 * applyStoredGlobalConfig。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiBindings, ApiConfig, ProtocolBindings, ProtocolRegistry, SetAny, StoredGlobalConfig, Toast } from "../lib/app-types";
import { cloneBackupValue } from "../lib/backup";
import { wanjuanNormalizeSeedanceVirtualPortraits } from "../lib/seedance";
declare const chrome: any;

interface UseApplyStoredGlobalConfigDeps {
  _e: any;
  apiModelCloudSettingsSaveTimerRef: any;
  configButlerApiKey: any;
  configButlerApiUrl: any;
  configButlerModel: any;
  configButlerProtocol: any;
  mergeStoredGlobalApiConfigs: any;
  normalizeStoredGlobalConfigBackup: any;
  setActiveStoredGlobalConfigId: SetAny;
  setApiConfigs: SetAny;
  setAudioApiConfigId: SetAny;
  setAudioApiKey: SetAny;
  setAudioApiUrl: SetAny;
  setAudioModelApiBindings: SetAny;
  setAudioModelProtocolBindings: SetAny;
  setAudioModels: SetAny;
  setConfigButlerDocUrl: SetAny;
  setConfigButlerMode: SetAny;
  setConfigButlerTargetApiConfigId: SetAny;
  setConfigButlerTargetCategory: SetAny;
  setImageApiConfigId: SetAny;
  setImageApiKey: SetAny;
  setImageApiUrl: SetAny;
  setImageCompatResolutions: SetAny;
  setImageModelApiBindings: SetAny;
  setImageModelProtocolBindings: SetAny;
  setImageModels: SetAny;
  setModelProtocolRegistry: SetAny;
  setSeedanceDurations: SetAny;
  setSeedanceEnableWebSearch: SetAny;
  setSeedanceGenerateAudio: SetAny;
  setSeedanceModel: SetAny;
  setSeedanceRatios: SetAny;
  setSeedanceResolutions: SetAny;
  setSeedanceVirtualPortraits: SetAny;
  setSeedanceWatermark: SetAny;
  setTextApiConfigId: SetAny;
  setTextApiKey: SetAny;
  setTextApiUrl: SetAny;
  setTextModelApiBindings: SetAny;
  setTextModelProtocolBindings: SetAny;
  setTianjiSeedanceModel: SetAny;
  setTongyiWanxiangDurations: SetAny;
  setTongyiWanxiangEditModels: SetAny;
  setTongyiWanxiangImageModels: SetAny;
  setTongyiWanxiangRatios: SetAny;
  setTongyiWanxiangReferenceImageModels: SetAny;
  setTongyiWanxiangResolutions: SetAny;
  setTongyiWanxiangTextModels: SetAny;
  setTtsMusicModel: SetAny;
  setVideoApiConfigId: SetAny;
  setVideoApiKey: SetAny;
  setVideoApiUrl: SetAny;
  setVideoAspectRatios: SetAny;
  setVideoDurations: SetAny;
  setVideoModelApiBindings: SetAny;
  setVideoModelProtocolBindings: SetAny;
  setVideoModelRequestProfilesText: SetAny;
  setVideoModels: SetAny;
  setVideoResolutions: SetAny;
  showToast2: Toast;
  storedGlobalConfigs: StoredGlobalConfig[];
  activeStoredGlobalConfigId: any;
  apiConfigs: ApiConfig[];
  audioApiConfigId: any;
  audioApiKey: any;
  audioApiUrl: any;
  audioModelApiBindings: ApiBindings;
  audioModelProtocolBindings: ProtocolBindings;
  configButlerDocUrl: any;
  configButlerMode: any;
  configButlerTargetApiConfigId: any;
  configButlerTargetCategory: any;
  imageApiConfigId: any;
  imageApiKey: any;
  imageApiUrl: any;
  imageCompatResolutions: any;
  imageModelApiBindings: ApiBindings;
  imageModelProtocolBindings: ProtocolBindings;
  modelProtocolRegistry: ProtocolRegistry;
  seedanceDurations: any;
  seedanceEnableWebSearch: any;
  seedanceGenerateAudio: any;
  seedanceModel: any;
  seedanceRatios: any;
  seedanceResolutions: any;
  seedanceVirtualPortraits: any;
  seedanceWatermark: any;
  textApiConfigId: any;
  textApiKey: any;
  textApiUrl: any;
  textModelApiBindings: ApiBindings;
  textModelProtocolBindings: ProtocolBindings;
  tianjiSeedanceModel: any;
  tongyiWanxiangDurations: any;
  tongyiWanxiangEditModels: any;
  tongyiWanxiangImageModels: any;
  tongyiWanxiangRatios: any;
  tongyiWanxiangReferenceImageModels: any;
  tongyiWanxiangResolutions: any;
  tongyiWanxiangTextModels: any;
  ttsMusicModel: any;
  videoApiConfigId: any;
  videoApiKey: any;
  videoApiUrl: any;
  videoAspectRatios: any;
  videoDurations: any;
  videoModelApiBindings: ApiBindings;
  videoModelProtocolBindings: ProtocolBindings;
  videoResolutions: any;
}

export function use_applyStoredGlobalConfig(deps: UseApplyStoredGlobalConfigDeps) {
  const {
    _e,
    apiModelCloudSettingsSaveTimerRef,
    configButlerApiKey,
    configButlerApiUrl,
    configButlerModel,
    configButlerProtocol,
    mergeStoredGlobalApiConfigs,
    normalizeStoredGlobalConfigBackup,
    setActiveStoredGlobalConfigId,
    setApiConfigs,
    setAudioApiConfigId,
    setAudioApiKey,
    setAudioApiUrl,
    setAudioModelApiBindings,
    setAudioModelProtocolBindings,
    setAudioModels,
    setConfigButlerDocUrl,
    setConfigButlerMode,
    setConfigButlerTargetApiConfigId,
    setConfigButlerTargetCategory,
    setImageApiConfigId,
    setImageApiKey,
    setImageApiUrl,
    setImageCompatResolutions,
    setImageModelApiBindings,
    setImageModelProtocolBindings,
    setImageModels,
    setModelProtocolRegistry,
    setSeedanceDurations,
    setSeedanceEnableWebSearch,
    setSeedanceGenerateAudio,
    setSeedanceModel,
    setSeedanceRatios,
    setSeedanceResolutions,
    setSeedanceVirtualPortraits,
    setSeedanceWatermark,
    setTextApiConfigId,
    setTextApiKey,
    setTextApiUrl,
    setTextModelApiBindings,
    setTextModelProtocolBindings,
    setTianjiSeedanceModel,
    setTongyiWanxiangDurations,
    setTongyiWanxiangEditModels,
    setTongyiWanxiangImageModels,
    setTongyiWanxiangRatios,
    setTongyiWanxiangReferenceImageModels,
    setTongyiWanxiangResolutions,
    setTongyiWanxiangTextModels,
    setTtsMusicModel,
    setVideoApiConfigId,
    setVideoApiKey,
    setVideoApiUrl,
    setVideoAspectRatios,
    setVideoDurations,
    setVideoModelApiBindings,
    setVideoModelProtocolBindings,
    setVideoModelRequestProfilesText,
    setVideoModels,
    setVideoResolutions,
    showToast2,
    storedGlobalConfigs,
    activeStoredGlobalConfigId,
    apiConfigs,
    audioApiConfigId,
    audioApiKey,
    audioApiUrl,
    audioModelApiBindings,
    audioModelProtocolBindings,
    configButlerDocUrl,
    configButlerMode,
    configButlerTargetApiConfigId,
    configButlerTargetCategory,
    imageApiConfigId,
    imageApiKey,
    imageApiUrl,
    imageCompatResolutions,
    imageModelApiBindings,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    seedanceDurations,
    seedanceEnableWebSearch,
    seedanceGenerateAudio,
    seedanceModel,
    seedanceRatios,
    seedanceResolutions,
    seedanceVirtualPortraits,
    seedanceWatermark,
    textApiConfigId,
    textApiKey,
    textApiUrl,
    textModelApiBindings,
    textModelProtocolBindings,
    tianjiSeedanceModel,
    tongyiWanxiangDurations,
    tongyiWanxiangEditModels,
    tongyiWanxiangImageModels,
    tongyiWanxiangRatios,
    tongyiWanxiangReferenceImageModels,
    tongyiWanxiangResolutions,
    tongyiWanxiangTextModels,
    ttsMusicModel,
    videoApiConfigId,
    videoApiKey,
    videoApiUrl,
    videoAspectRatios,
    videoDurations,
    videoModelApiBindings,
    videoModelProtocolBindings,
    videoResolutions,
  } = deps;
  const applyStoredGlobalConfig = (configId) => {
      let storedConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
      if (!storedConfig?.config) {
        showToast2(`请选择一个已存储配置`);
        return;
      }
	      if (apiModelCloudSettingsSaveTimerRef?.current) {
	        clearTimeout(apiModelCloudSettingsSaveTimerRef.current);
	        apiModelCloudSettingsSaveTimerRef.current = 0;
	      }
	      let repairedConfig = normalizeStoredGlobalConfigBackup(storedConfig.config || {}),
	        mergedApiConfigs = mergeStoredGlobalApiConfigs(repairedConfig.apiConfigs),
	        hasConfigValue = (key) => Object.prototype.hasOwnProperty.call(repairedConfig, key);
      (Array.isArray(repairedConfig.apiConfigs) && setApiConfigs(mergedApiConfigs),
        hasConfigValue(`textApiConfigId`) && setTextApiConfigId(repairedConfig.textApiConfigId || ``),
        hasConfigValue(`imageApiConfigId`) && setImageApiConfigId(repairedConfig.imageApiConfigId || ``),
        hasConfigValue(`videoApiConfigId`) && setVideoApiConfigId(repairedConfig.videoApiConfigId || ``),
        hasConfigValue(`audioApiConfigId`) && setAudioApiConfigId(repairedConfig.audioApiConfigId || ``),
        hasConfigValue(`textApiUrl`) && setTextApiUrl(repairedConfig.textApiUrl || ``),
        hasConfigValue(`textApiKey`) && setTextApiKey(repairedConfig.textApiKey || ``),
        hasConfigValue(`imageApiUrl`) && setImageApiUrl(repairedConfig.imageApiUrl || ``),
        hasConfigValue(`imageApiKey`) && setImageApiKey(repairedConfig.imageApiKey || ``),
        hasConfigValue(`videoApiUrl`) && setVideoApiUrl(repairedConfig.videoApiUrl || ``),
        hasConfigValue(`videoApiKey`) && setVideoApiKey(repairedConfig.videoApiKey || ``),
        hasConfigValue(`audioApiUrl`) && setAudioApiUrl(repairedConfig.audioApiUrl || ``),
        hasConfigValue(`audioApiKey`) && setAudioApiKey(repairedConfig.audioApiKey || ``),
	        hasConfigValue(`textModel`) && _e(repairedConfig.textModel || ``),
	        hasConfigValue(`drawingModel`) && setImageModels(repairedConfig.drawingModel || ``),
	        hasConfigValue(`imageCompatResolutions`) && setImageCompatResolutions(repairedConfig.imageCompatResolutions || ``),
	        hasConfigValue(`videoModel`) && setVideoModels(repairedConfig.videoModel || ``),
        hasConfigValue(`audioModel`) && setAudioModels(repairedConfig.audioModel || ``),
        hasConfigValue(`ttsMusicModel`) && setTtsMusicModel(repairedConfig.ttsMusicModel || ``),
        hasConfigValue(`videoDurations`) && setVideoDurations(repairedConfig.videoDurations || ``),
        hasConfigValue(`videoResolutions`) && setVideoResolutions(repairedConfig.videoResolutions || ``),
        hasConfigValue(`videoAspectRatios`) && setVideoAspectRatios(repairedConfig.videoAspectRatios || ``),
        hasConfigValue(`videoModelRequestProfiles`) && setVideoModelRequestProfilesText(typeof repairedConfig.videoModelRequestProfiles == `string` ? repairedConfig.videoModelRequestProfiles : JSON.stringify(repairedConfig.videoModelRequestProfiles || {}, null, 2)),
        hasConfigValue(`seedanceModel`) && setSeedanceModel(repairedConfig.seedanceModel || ``),
        hasConfigValue(`tianjiSeedanceModel`) && setTianjiSeedanceModel(repairedConfig.tianjiSeedanceModel || ``),
        hasConfigValue(`seedanceDurations`) && setSeedanceDurations(repairedConfig.seedanceDurations || ``),
        hasConfigValue(`seedanceResolutions`) && setSeedanceResolutions(repairedConfig.seedanceResolutions || ``),
        hasConfigValue(`seedanceRatios`) && setSeedanceRatios(repairedConfig.seedanceRatios || ``),
        repairedConfig.seedanceGenerateAudio !== undefined && setSeedanceGenerateAudio(repairedConfig.seedanceGenerateAudio),
        repairedConfig.seedanceWatermark !== undefined && setSeedanceWatermark(repairedConfig.seedanceWatermark),
        repairedConfig.seedanceEnableWebSearch !== undefined && setSeedanceEnableWebSearch(repairedConfig.seedanceEnableWebSearch),
        Array.isArray(repairedConfig.seedanceVirtualPortraits) && setSeedanceVirtualPortraits(wanjuanNormalizeSeedanceVirtualPortraits(repairedConfig.seedanceVirtualPortraits)),
        hasConfigValue(`tongyiWanxiangTextModels`) && setTongyiWanxiangTextModels(repairedConfig.tongyiWanxiangTextModels || ``),
        hasConfigValue(`tongyiWanxiangReferenceImageModels`) && setTongyiWanxiangReferenceImageModels(repairedConfig.tongyiWanxiangReferenceImageModels || ``),
        hasConfigValue(`tongyiWanxiangImageModels`) && setTongyiWanxiangImageModels(repairedConfig.tongyiWanxiangImageModels || ``),
        hasConfigValue(`tongyiWanxiangEditModels`) && setTongyiWanxiangEditModels(repairedConfig.tongyiWanxiangEditModels || ``),
        hasConfigValue(`tongyiWanxiangDurations`) && setTongyiWanxiangDurations(repairedConfig.tongyiWanxiangDurations || ``),
        hasConfigValue(`tongyiWanxiangResolutions`) && setTongyiWanxiangResolutions(repairedConfig.tongyiWanxiangResolutions || ``),
        hasConfigValue(`tongyiWanxiangRatios`) && setTongyiWanxiangRatios(repairedConfig.tongyiWanxiangRatios || ``),
        repairedConfig.modelProtocolRegistry && typeof repairedConfig.modelProtocolRegistry == `object` && setModelProtocolRegistry(cloneBackupValue(repairedConfig.modelProtocolRegistry)),
        hasConfigValue(`configButlerDocUrl`) && setConfigButlerDocUrl(repairedConfig.configButlerDocUrl || ``),
        hasConfigValue(`configButlerMode`) && setConfigButlerMode(repairedConfig.configButlerMode === `batch` ? `batch` : `single`),
        hasConfigValue(`configButlerTargetCategory`) && setConfigButlerTargetCategory(repairedConfig.configButlerTargetCategory || `text`),
        hasConfigValue(`configButlerTargetApiConfigId`) && setConfigButlerTargetApiConfigId(repairedConfig.configButlerTargetApiConfigId || ``),
        repairedConfig.textModelApiBindings && setTextModelApiBindings(cloneBackupValue(repairedConfig.textModelApiBindings)),
        repairedConfig.textModelProtocolBindings && setTextModelProtocolBindings(cloneBackupValue(repairedConfig.textModelProtocolBindings)),
        repairedConfig.imageModelApiBindings && setImageModelApiBindings(cloneBackupValue(repairedConfig.imageModelApiBindings)),
        repairedConfig.imageModelProtocolBindings && setImageModelProtocolBindings(cloneBackupValue(repairedConfig.imageModelProtocolBindings)),
        repairedConfig.videoModelApiBindings && setVideoModelApiBindings(cloneBackupValue(repairedConfig.videoModelApiBindings)),
        repairedConfig.videoModelProtocolBindings && setVideoModelProtocolBindings(cloneBackupValue(repairedConfig.videoModelProtocolBindings)),
        repairedConfig.audioModelApiBindings && setAudioModelApiBindings(cloneBackupValue(repairedConfig.audioModelApiBindings)),
        repairedConfig.audioModelProtocolBindings && setAudioModelProtocolBindings(cloneBackupValue(repairedConfig.audioModelProtocolBindings)),
        setActiveStoredGlobalConfigId(storedConfig.id),
        typeof chrome < `u` && chrome.storage?.local?.set({
          ...repairedConfig,
          configButlerApiUrl: configButlerApiUrl,
          configButlerApiKey: configButlerApiKey,
          configButlerProtocol: configButlerProtocol,
          configButlerModel: configButlerModel,
          apiConfigs: mergedApiConfigs,
          activeStoredGlobalConfigId: storedConfig.id,
        }),
        showToast2(`已切换到 ${storedConfig.name}`));
    };
  return { applyStoredGlobalConfig };
}
