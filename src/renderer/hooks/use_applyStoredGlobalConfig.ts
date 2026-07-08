/**
 * applyStoredGlobalConfig。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig, Bindings, SetAny, Toast } from "../lib/app-types";
import { cloneBackupValue } from "../lib/backup";
import { wanjuanNormalizeSeedanceVirtualPortraits } from "../lib/seedance";
declare const chrome: any;

interface UseApplyStoredGlobalConfigDeps {
  _e: any;
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
  storedGlobalConfigs: any;
  activeStoredGlobalConfigId: any;
  apiConfigs: ApiConfig[];
  audioApiConfigId: any;
  audioApiKey: any;
  audioApiUrl: any;
  audioModelApiBindings: Bindings;
  audioModelProtocolBindings: Bindings;
  configButlerDocUrl: any;
  configButlerMode: any;
  configButlerTargetApiConfigId: any;
  configButlerTargetCategory: any;
  imageApiConfigId: any;
  imageApiKey: any;
  imageApiUrl: any;
  imageCompatResolutions: any;
  imageModelApiBindings: Bindings;
  imageModelProtocolBindings: Bindings;
  modelProtocolRegistry: Bindings;
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
  textModelApiBindings: Bindings;
  textModelProtocolBindings: Bindings;
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
  videoModelApiBindings: Bindings;
  videoModelProtocolBindings: Bindings;
  videoResolutions: any;
}

export function use_applyStoredGlobalConfig(deps: UseApplyStoredGlobalConfigDeps) {
  const {
    _e,
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
	      let repairedConfig = normalizeStoredGlobalConfigBackup(storedConfig.config || {}),
	        mergedApiConfigs = mergeStoredGlobalApiConfigs(repairedConfig.apiConfigs);
      (Array.isArray(repairedConfig.apiConfigs) && setApiConfigs(mergedApiConfigs),
        repairedConfig.textApiConfigId && setTextApiConfigId(repairedConfig.textApiConfigId),
        repairedConfig.imageApiConfigId && setImageApiConfigId(repairedConfig.imageApiConfigId),
        repairedConfig.videoApiConfigId && setVideoApiConfigId(repairedConfig.videoApiConfigId),
        repairedConfig.audioApiConfigId && setAudioApiConfigId(repairedConfig.audioApiConfigId),
        repairedConfig.textApiUrl && setTextApiUrl(repairedConfig.textApiUrl),
        repairedConfig.textApiKey !== undefined && setTextApiKey(repairedConfig.textApiKey),
        repairedConfig.imageApiUrl && setImageApiUrl(repairedConfig.imageApiUrl),
        repairedConfig.imageApiKey !== undefined && setImageApiKey(repairedConfig.imageApiKey),
        repairedConfig.videoApiUrl && setVideoApiUrl(repairedConfig.videoApiUrl),
        repairedConfig.videoApiKey !== undefined && setVideoApiKey(repairedConfig.videoApiKey),
        repairedConfig.audioApiUrl && setAudioApiUrl(repairedConfig.audioApiUrl),
        repairedConfig.audioApiKey !== undefined && setAudioApiKey(repairedConfig.audioApiKey),
	        repairedConfig.textModel && _e(repairedConfig.textModel),
	        repairedConfig.drawingModel && setImageModels(repairedConfig.drawingModel),
	        repairedConfig.imageCompatResolutions && setImageCompatResolutions(repairedConfig.imageCompatResolutions),
	        repairedConfig.videoModel && setVideoModels(repairedConfig.videoModel),
        repairedConfig.audioModel && setAudioModels(repairedConfig.audioModel),
        repairedConfig.ttsMusicModel && setTtsMusicModel(repairedConfig.ttsMusicModel),
        repairedConfig.videoDurations && setVideoDurations(repairedConfig.videoDurations),
        repairedConfig.videoResolutions && setVideoResolutions(repairedConfig.videoResolutions),
        repairedConfig.videoAspectRatios && setVideoAspectRatios(repairedConfig.videoAspectRatios),
        repairedConfig.videoModelRequestProfiles && setVideoModelRequestProfilesText(typeof repairedConfig.videoModelRequestProfiles == `string` ? repairedConfig.videoModelRequestProfiles : JSON.stringify(repairedConfig.videoModelRequestProfiles, null, 2)),
        repairedConfig.seedanceModel && setSeedanceModel(repairedConfig.seedanceModel),
        repairedConfig.tianjiSeedanceModel && setTianjiSeedanceModel(repairedConfig.tianjiSeedanceModel),
        repairedConfig.seedanceDurations && setSeedanceDurations(repairedConfig.seedanceDurations),
        repairedConfig.seedanceResolutions && setSeedanceResolutions(repairedConfig.seedanceResolutions),
        repairedConfig.seedanceRatios && setSeedanceRatios(repairedConfig.seedanceRatios),
        repairedConfig.seedanceGenerateAudio !== undefined && setSeedanceGenerateAudio(repairedConfig.seedanceGenerateAudio),
        repairedConfig.seedanceWatermark !== undefined && setSeedanceWatermark(repairedConfig.seedanceWatermark),
        repairedConfig.seedanceEnableWebSearch !== undefined && setSeedanceEnableWebSearch(repairedConfig.seedanceEnableWebSearch),
        Array.isArray(repairedConfig.seedanceVirtualPortraits) && setSeedanceVirtualPortraits(wanjuanNormalizeSeedanceVirtualPortraits(repairedConfig.seedanceVirtualPortraits)),
        repairedConfig.tongyiWanxiangTextModels && setTongyiWanxiangTextModels(repairedConfig.tongyiWanxiangTextModels),
        repairedConfig.tongyiWanxiangReferenceImageModels && setTongyiWanxiangReferenceImageModels(repairedConfig.tongyiWanxiangReferenceImageModels),
        repairedConfig.tongyiWanxiangImageModels && setTongyiWanxiangImageModels(repairedConfig.tongyiWanxiangImageModels),
        repairedConfig.tongyiWanxiangEditModels && setTongyiWanxiangEditModels(repairedConfig.tongyiWanxiangEditModels),
        repairedConfig.tongyiWanxiangDurations && setTongyiWanxiangDurations(repairedConfig.tongyiWanxiangDurations),
        repairedConfig.tongyiWanxiangResolutions && setTongyiWanxiangResolutions(repairedConfig.tongyiWanxiangResolutions),
        repairedConfig.tongyiWanxiangRatios && setTongyiWanxiangRatios(repairedConfig.tongyiWanxiangRatios),
        repairedConfig.modelProtocolRegistry && typeof repairedConfig.modelProtocolRegistry == `object` && setModelProtocolRegistry(cloneBackupValue(repairedConfig.modelProtocolRegistry)),
        repairedConfig.configButlerDocUrl !== undefined && setConfigButlerDocUrl(repairedConfig.configButlerDocUrl),
        repairedConfig.configButlerMode && setConfigButlerMode(repairedConfig.configButlerMode === `batch` ? `batch` : `single`),
        repairedConfig.configButlerTargetCategory && setConfigButlerTargetCategory(repairedConfig.configButlerTargetCategory),
        repairedConfig.configButlerTargetApiConfigId && setConfigButlerTargetApiConfigId(repairedConfig.configButlerTargetApiConfigId),
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
