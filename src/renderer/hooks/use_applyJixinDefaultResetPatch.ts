/**
 * applyJixinDefaultResetPatch。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiBindings, ApiConfig, ProtocolBindings, ProtocolRegistry, SetAny, SetState, StoredGlobalConfig } from "../lib/app-types";
import { WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS, WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID, wanjuanMergeModelText } from "../lib/jixin-catalog";
import { cloneBackupValue } from "../lib/backup";
import { normalizeUnifiedApiConfigs } from "../lib/unified-api-config";

interface UseApplyJixinDefaultResetPatchDeps {
  WANJUAN_JIXIN_DOC_URL: any;
  _e: any;
  setActiveProtocolConfigText: SetAny;
  setActiveProtocolName: SetAny;
  setActiveStoredGlobalConfigId: SetAny;
  setApiConfigs: SetAny;
  setAudioApiConfigId: SetAny;
  setAudioApiKey: SetAny;
  setAudioApiUrl: SetAny;
  setAudioModelApiBindings: SetAny;
  setAudioModelProtocolBindings: SetAny;
  setAudioModels: SetAny;
  setConfigButlerApiKey: SetAny;
  setConfigButlerApiUrl: SetAny;
  setConfigButlerBatchItems: SetAny;
  setConfigButlerDocUrl: SetAny;
  setConfigButlerMode: SetAny;
  setConfigButlerModel: SetAny;
  setConfigButlerProtocol: SetAny;
  setConfigButlerRepairHistory: SetAny;
  setConfigButlerResultText: SetAny;
  setConfigButlerTargetApiConfigId: SetAny;
  setConfigButlerTargetCategory: SetAny;
  setImageApiConfigId: SetAny;
  setImageApiKey: SetAny;
  setImageApiUrl: SetAny;
  setImageCompatResolutions: SetAny;
  setImageModelApiBindings: SetAny;
  setImageModelProtocolBindings: SetAny;
  setImageModels: SetAny;
  setJixinModelScanNotice: SetAny;
  setModelProtocolRegistry: SetAny;
  setProtocolNamesText: SetAny;
  setSeedanceDurations: SetAny;
  setSeedanceEnableWebSearch: SetAny;
  setSeedanceGenerateAudio: SetAny;
  setSeedanceModel: SetAny;
  setSeedanceRatios: SetAny;
  setSeedanceResolutions: SetAny;
  setSeedanceWatermark: SetAny;
  setStoredGlobalConfigs: SetState<StoredGlobalConfig[]>;
  setTextApiConfigId: SetAny;
  setTextApiKey: SetAny;
  setTextApiUrl: SetAny;
  setTextModelApiBindings: SetAny;
  setTextModelProtocolBindings: SetAny;
  setTianjiSeedanceModel: SetAny;
  setTianjiSeedanceSettingsMode: SetAny;
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
  activeStoredGlobalConfigId: any;
  apiConfigs: ApiConfig[];
  audioApiConfigId: any;
  audioApiUrl: any;
  audioModelApiBindings: ApiBindings;
  audioModelProtocolBindings: ProtocolBindings;
  imageApiConfigId: any;
  imageApiUrl: any;
  imageCompatResolutions: any;
  imageModelApiBindings: ApiBindings;
  imageModelProtocolBindings: ProtocolBindings;
  modelProtocolRegistry: ProtocolRegistry;
  seedanceDurations: any;
  seedanceModel: any;
  seedanceRatios: any;
  seedanceResolutions: any;
  storedGlobalConfigs: StoredGlobalConfig[];
  textApiConfigId: any;
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
  videoApiUrl: any;
  videoAspectRatios: any;
  videoDurations: any;
  videoModelApiBindings: ApiBindings;
  videoModelProtocolBindings: ProtocolBindings;
  videoResolutions: any;
}

export function use_applyJixinDefaultResetPatch(deps: UseApplyJixinDefaultResetPatchDeps) {
  const {
    WANJUAN_JIXIN_DOC_URL,
    _e,
    setActiveProtocolConfigText,
    setActiveProtocolName,
    setActiveStoredGlobalConfigId,
    setApiConfigs,
    setAudioApiConfigId,
    setAudioApiKey,
    setAudioApiUrl,
    setAudioModelApiBindings,
    setAudioModelProtocolBindings,
    setAudioModels,
    setConfigButlerApiKey,
    setConfigButlerApiUrl,
    setConfigButlerBatchItems,
    setConfigButlerDocUrl,
    setConfigButlerMode,
    setConfigButlerModel,
    setConfigButlerProtocol,
    setConfigButlerRepairHistory,
    setConfigButlerResultText,
    setConfigButlerTargetApiConfigId,
    setConfigButlerTargetCategory,
    setImageApiConfigId,
    setImageApiKey,
    setImageApiUrl,
    setImageCompatResolutions,
    setImageModelApiBindings,
    setImageModelProtocolBindings,
    setImageModels,
    setJixinModelScanNotice,
    setModelProtocolRegistry,
    setProtocolNamesText,
    setSeedanceDurations,
    setSeedanceEnableWebSearch,
    setSeedanceGenerateAudio,
    setSeedanceModel,
    setSeedanceRatios,
    setSeedanceResolutions,
    setSeedanceWatermark,
    setStoredGlobalConfigs,
    setTextApiConfigId,
    setTextApiKey,
    setTextApiUrl,
    setTextModelApiBindings,
    setTextModelProtocolBindings,
    setTianjiSeedanceModel,
    setTianjiSeedanceSettingsMode,
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
    activeStoredGlobalConfigId,
    apiConfigs,
    audioApiConfigId,
    audioApiUrl,
    audioModelApiBindings,
    audioModelProtocolBindings,
    imageApiConfigId,
    imageApiUrl,
    imageCompatResolutions,
    imageModelApiBindings,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    seedanceDurations,
    seedanceModel,
    seedanceRatios,
    seedanceResolutions,
    storedGlobalConfigs,
    textApiConfigId,
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
    videoApiUrl,
    videoAspectRatios,
    videoDurations,
    videoModelApiBindings,
    videoModelProtocolBindings,
    videoResolutions,
  } = deps;
  const applyJixinDefaultResetPatch = (patch) => {
      let normalizedApiConfigs = normalizeUnifiedApiConfigs(patch.apiConfigs);
      (setApiConfigs(normalizedApiConfigs),
        setTextApiConfigId(patch.textApiConfigId),
        setImageApiConfigId(patch.imageApiConfigId),
        setVideoApiConfigId(patch.videoApiConfigId),
        setAudioApiConfigId(patch.audioApiConfigId),
        setTextApiUrl(patch.textApiUrl),
        setTextApiKey(``),
        setImageApiUrl(patch.imageApiUrl),
        setImageApiKey(``),
        setVideoApiUrl(patch.videoApiUrl),
        setVideoApiKey(``),
        setAudioApiUrl(patch.audioApiUrl),
        setAudioApiKey(``),
        _e(patch.textModel),
        setImageModels(patch.drawingModel),
        setImageCompatResolutions(patch.imageCompatResolutions),
        setVideoModels(patch.videoModel),
        setAudioModels(patch.audioModel),
        setTtsMusicModel(patch.ttsMusicModel),
        setVideoDurations(patch.videoDurations),
        setVideoResolutions(patch.videoResolutions),
        setVideoAspectRatios(patch.videoAspectRatios),
        setVideoModelRequestProfilesText(`{}`),
        setSeedanceModel(patch.seedanceModel),
        setTianjiSeedanceModel(patch.tianjiSeedanceModel || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS)),
        setSeedanceDurations(patch.seedanceDurations),
        setSeedanceResolutions(patch.seedanceResolutions),
        setSeedanceRatios(patch.seedanceRatios),
        setSeedanceGenerateAudio(true),
        setSeedanceWatermark(false),
        setSeedanceEnableWebSearch(false),
        setTongyiWanxiangTextModels(patch.tongyiWanxiangTextModels),
        setTongyiWanxiangReferenceImageModels(patch.tongyiWanxiangReferenceImageModels),
        setTongyiWanxiangImageModels(patch.tongyiWanxiangImageModels),
        setTongyiWanxiangEditModels(patch.tongyiWanxiangEditModels),
        setTongyiWanxiangDurations(patch.tongyiWanxiangDurations),
        setTongyiWanxiangResolutions(patch.tongyiWanxiangResolutions),
        setTongyiWanxiangRatios(patch.tongyiWanxiangRatios),
        setModelProtocolRegistry(cloneBackupValue(patch.modelProtocolRegistry)),
        setTextModelApiBindings(cloneBackupValue(patch.textModelApiBindings)),
        setTextModelProtocolBindings(cloneBackupValue(patch.textModelProtocolBindings)),
        setImageModelApiBindings(cloneBackupValue(patch.imageModelApiBindings)),
        setImageModelProtocolBindings(cloneBackupValue(patch.imageModelProtocolBindings)),
        setVideoModelApiBindings(cloneBackupValue(patch.videoModelApiBindings)),
        setVideoModelProtocolBindings(cloneBackupValue(patch.videoModelProtocolBindings)),
        setAudioModelApiBindings(cloneBackupValue(patch.audioModelApiBindings)),
        setAudioModelProtocolBindings(cloneBackupValue(patch.audioModelProtocolBindings)),
        setConfigButlerApiUrl(``),
        setConfigButlerApiKey(``),
        setConfigButlerProtocol(`openai`),
        setConfigButlerModel(``),
        setConfigButlerDocUrl(WANJUAN_JIXIN_DOC_URL),
        setConfigButlerMode(`batch`),
        setConfigButlerTargetCategory(`text`),
        setConfigButlerTargetApiConfigId(WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID),
        setConfigButlerRepairHistory([]),
        setConfigButlerBatchItems([]),
        setConfigButlerResultText(``),
        setJixinModelScanNotice(null),
        setStoredGlobalConfigs(patch.storedGlobalConfigs),
        setActiveStoredGlobalConfigId(patch.activeStoredGlobalConfigId),
        setProtocolNamesText(Object.keys(patch.modelProtocolRegistry || {}).join(`
`)),
        setActiveProtocolName(Object.keys(patch.modelProtocolRegistry || {})[0] || ``),
        setActiveProtocolConfigText(JSON.stringify(Object.values(patch.modelProtocolRegistry || {})[0] || {}, null, 2)),
        setTianjiSeedanceSettingsMode(`official`));
    };
  return { applyJixinDefaultResetPatch };
}
