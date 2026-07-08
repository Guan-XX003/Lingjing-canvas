/**
 * getConfigButlerRepairContext。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ProtocolBindings, ProtocolRegistry } from "../lib/app-types";
import { inferButlerCategoryFromModelName, normalizeModelCategory } from "../lib/config-butler";

interface UseGetConfigButlerRepairContextDeps {
  audioModelProtocolBindings: ProtocolBindings;
  configButlerErrorAssistant: any;
  imageModelProtocolBindings: ProtocolBindings;
  modelProtocolRegistry: ProtocolRegistry;
  textModelProtocolBindings: ProtocolBindings;
  videoModelProtocolBindings: ProtocolBindings;
}

export function use_getConfigButlerRepairContext(deps: UseGetConfigButlerRepairContextDeps) {
  const {
    audioModelProtocolBindings,
    configButlerErrorAssistant,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    textModelProtocolBindings,
    videoModelProtocolBindings,
  } = deps;
  const getConfigButlerRepairContext = (diagnosisTask = null) => {
		              let task = diagnosisTask || configButlerErrorAssistant?.task || {},
		                category = normalizeModelCategory(task.type || task.customOutputType) || inferButlerCategoryFromModelName(task.modelName || ``),
		                protocolKey =
		                category === `text` ?
		                textModelProtocolBindings?.[task.modelName] :
		                category === `image` ?
		                imageModelProtocolBindings?.[task.modelName] :
		                category === `video` ?
		                videoModelProtocolBindings?.[task.modelName] :
		                category === `audio` || category === `music` || category === `tts-music` ?
		                audioModelProtocolBindings?.[task.modelName] :
		                ``;
		              return {
		                task: task,
		                category: category,
		                protocolName: protocolKey || ``,
		                protocolConfig: protocolKey ? modelProtocolRegistry?.[protocolKey] || null : null,
		              };
		            };
  return { getConfigButlerRepairContext };
}
