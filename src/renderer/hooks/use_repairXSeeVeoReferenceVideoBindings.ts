// @ts-nocheck
/**
 * repairXSeeVeoReferenceVideoBindings。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildXSeeVeoReferenceVideoProtocol } from "../lib/config-butler";
import { cloneBackupValue } from "../lib/backup";
import { isXSeeVeoReferenceVideoModel } from "../lib/model-list-utils";

export function use_repairXSeeVeoReferenceVideoBindings(deps: any) {
  const {
    modelProtocolRegistry,
    videoApiUrl,
    videoModelProtocolBindings,
  } = deps;
  const repairXSeeVeoReferenceVideoBindings = (backup = {}, apiUrl = ``) => {
      let config = backup && typeof backup == `object` ? cloneBackupValue(backup) : {},
        protocolRegistry = {
          ...(config.modelProtocolRegistry && typeof config.modelProtocolRegistry == `object` ? config.modelProtocolRegistry : {}),
        },
        videoProtocolBindings = {
          ...(config.videoModelProtocolBindings && typeof config.videoModelProtocolBindings == `object` ? config.videoModelProtocolBindings : {}),
        },
        videoApiUrl2 = String(apiUrl || config.videoApiUrl || ``),
        protocolName = `X-See Veo 帧转视频兼容`;
      if (!/aigc\.x-see\.cn|x-see\.cn/i.test(videoApiUrl2)) return config;
      let videoModels2 = new Set(
        [
          config.videoModel,
          ...(typeof config.videoModel == `string` ? config.videoModel.split(/[\n,，、\s]+/) : []),
          ...Object.keys(videoProtocolBindings || {}),
        ]
        .map((value) => String(value || ``).trim())
        .filter(Boolean),
      );
      if (![...videoModels2].some((model) => isXSeeVeoReferenceVideoModel(model, videoApiUrl2))) return config;
      protocolRegistry[protocolName] = buildXSeeVeoReferenceVideoProtocol();
      videoModels2.forEach((model) => {
        isXSeeVeoReferenceVideoModel(model, videoApiUrl2) && (videoProtocolBindings[model] = protocolName);
      });
      return {
        ...config,
        modelProtocolRegistry: protocolRegistry,
        videoModelProtocolBindings: videoProtocolBindings,
      };
    };
  return { repairXSeeVeoReferenceVideoBindings };
}
