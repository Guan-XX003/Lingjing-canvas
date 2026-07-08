/**
 * captureCurrentGlobalConfig。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiBindings, ApiConfig, ProtocolBindings, ProtocolRegistry } from "../lib/app-types";
import { cloneBackupValue } from "../lib/backup";
import { normalizeUnifiedApiConfigs } from "../lib/unified-api-config";

interface UseCaptureCurrentGlobalConfigDeps {
  apiConfigs: ApiConfig[];
  audioApiConfigId: any;
  audioApiKey: any;
  audioApiUrl: any;
  audioModelApiBindings: ApiBindings;
  audioModelProtocolBindings: ProtocolBindings;
  audioModels: any;
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
  imageModels: any;
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
  textModels: any;
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
  videoModelRequestProfilesText: any;
  videoModels: any;
  videoResolutions: any;
}

export function use_captureCurrentGlobalConfig(deps: UseCaptureCurrentGlobalConfigDeps) {
  const {
    apiConfigs,
    audioApiConfigId,
    audioApiKey,
    audioApiUrl,
    audioModelApiBindings,
    audioModelProtocolBindings,
    audioModels,
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
    imageModels,
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
    textModels,
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
    videoModelRequestProfilesText,
    videoModels,
    videoResolutions,
  } = deps;
  const captureCurrentGlobalConfig = () => ({
      apiConfigs: cloneBackupValue(normalizeUnifiedApiConfigs(apiConfigs)),
      textApiConfigId: textApiConfigId,
      imageApiConfigId: imageApiConfigId,
      videoApiConfigId: videoApiConfigId,
      audioApiConfigId: audioApiConfigId,
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
      audioModel: audioModels,
      ttsMusicModel: ttsMusicModel,
      videoDurations: videoDurations,
      videoResolutions: videoResolutions,
      videoAspectRatios: videoAspectRatios,
      videoModelRequestProfiles: videoModelRequestProfilesText,
      seedanceModel: seedanceModel,
      tianjiSeedanceModel: tianjiSeedanceModel,
      seedanceDurations: seedanceDurations,
      seedanceResolutions: seedanceResolutions,
      seedanceRatios: seedanceRatios,
      seedanceGenerateAudio: seedanceGenerateAudio,
      seedanceWatermark: seedanceWatermark,
      seedanceEnableWebSearch: seedanceEnableWebSearch,
      seedanceVirtualPortraits: cloneBackupValue(seedanceVirtualPortraits),
      tongyiWanxiangTextModels: tongyiWanxiangTextModels,
      tongyiWanxiangReferenceImageModels: tongyiWanxiangReferenceImageModels,
      tongyiWanxiangImageModels: tongyiWanxiangImageModels,
      tongyiWanxiangEditModels: tongyiWanxiangEditModels,
      tongyiWanxiangDurations: tongyiWanxiangDurations,
      tongyiWanxiangResolutions: tongyiWanxiangResolutions,
      tongyiWanxiangRatios: tongyiWanxiangRatios,
      modelProtocolRegistry: cloneBackupValue(modelProtocolRegistry),
      configButlerDocUrl: configButlerDocUrl,
      configButlerMode: configButlerMode,
      configButlerTargetCategory: configButlerTargetCategory,
      configButlerTargetApiConfigId: configButlerTargetApiConfigId,
      textModelApiBindings: cloneBackupValue(textModelApiBindings),
      textModelProtocolBindings: cloneBackupValue(textModelProtocolBindings),
      imageModelApiBindings: cloneBackupValue(imageModelApiBindings),
      imageModelProtocolBindings: cloneBackupValue(imageModelProtocolBindings),
      videoModelApiBindings: cloneBackupValue(videoModelApiBindings),
      videoModelProtocolBindings: cloneBackupValue(videoModelProtocolBindings),
      audioModelApiBindings: cloneBackupValue(audioModelApiBindings),
      audioModelProtocolBindings: cloneBackupValue(audioModelProtocolBindings),
    });
  return { captureCurrentGlobalConfig };
}
