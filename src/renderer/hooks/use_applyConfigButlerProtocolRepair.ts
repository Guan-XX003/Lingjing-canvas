// @ts-nocheck
/**
 * applyConfigButlerProtocolRepair。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";
import { finalizeButlerProtocolConfig, inferButlerCategoryFromModelName, normalizeModelCategory, normalizeProtocolConfig, normalizeProtocolName } from "../lib/config-butler";
declare const chrome: any;

export function use_applyConfigButlerProtocolRepair(deps: any) {
  const {
    activeStoredGlobalConfigId,
    audioModelProtocolBindings,
    configButlerErrorAssistant,
    configButlerRepairHistory,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    setActiveStoredGlobalConfigId,
    setAudioModelProtocolBindings,
    setConfigButlerErrorAssistant,
    setConfigButlerRepairHistory,
    setImageModelProtocolBindings,
    setModelProtocolRegistry,
    setStoredGlobalConfigs,
    setTextModelProtocolBindings,
    setVideoModelProtocolBindings,
    showToast2,
    storedGlobalConfigs,
    textModelProtocolBindings,
    videoModelProtocolBindings,
  } = deps;
  const applyConfigButlerProtocolRepair = (protocolBinding, repairLabel = `配置管家修复`) => {
		              let errorAssistant = configButlerErrorAssistant,
		                task = errorAssistant?.task || {},
		                repairProtocol = protocolBinding;
		              if (!repairProtocol?.config || !task.modelName) return;
		              let category = normalizeModelCategory(repairProtocol.config.category || task.type || task.customOutputType) || inferButlerCategoryFromModelName(task.modelName),
		                finalizedConfig = finalizeButlerProtocolConfig(normalizeProtocolConfig(repairProtocol.config, category), {
		                  modelName: task.modelName,
		                  apiUrl: task.apiBaseUrl || ``,
		                  category: category,
		                }),
		                protocolName = String(repairProtocol.name || normalizeProtocolName(repairProtocol.name, finalizedConfig) || `${repairLabel}协议`).trim(),
		                nextRegistry = {
		                  ...modelProtocolRegistry,
		                  [protocolName]: finalizedConfig,
		                };
		              setModelProtocolRegistry(nextRegistry);
		              let bindingUpdates = {};
		              if (category === `text`) {
		                let nextTextBindings = {
		                  ...textModelProtocolBindings,
		                  [task.modelName]: protocolName,
		                };
		                (setTextModelProtocolBindings(nextTextBindings), bindingUpdates.textModelProtocolBindings = nextTextBindings);
		              } else if (category === `image`) {
		                let nextImageBindings = {
		                  ...imageModelProtocolBindings,
		                  [task.modelName]: protocolName,
		                };
		                (setImageModelProtocolBindings(nextImageBindings), bindingUpdates.imageModelProtocolBindings = nextImageBindings);
		              } else if (category === `video`) {
		                let nextVideoBindings = {
		                  ...videoModelProtocolBindings,
		                  [task.modelName]: protocolName,
		                };
		                (setVideoModelProtocolBindings(nextVideoBindings), bindingUpdates.videoModelProtocolBindings = nextVideoBindings);
		              } else if (category === `audio` || category === `music` || category === `tts-music`) {
		                let nextAudioBindings = {
		                  ...audioModelProtocolBindings,
		                  [task.modelName]: protocolName,
		                };
		                (setAudioModelProtocolBindings(nextAudioBindings), bindingUpdates.audioModelProtocolBindings = nextAudioBindings);
		              }
		              let repairRecord = {
		                id: `repair-${Date.now()}`,
		                createdAt: Date.now(),
		                modelName: task.modelName,
		                category: category,
		                protocolName: protocolName,
		                repairMode: repairLabel,
		                globalConfigId: activeStoredGlobalConfigId || ``,
		                globalConfigName: (storedGlobalConfigs || []).find((config) => config.id === activeStoredGlobalConfigId)?.name || ``,
		                diagnosisSummary: errorAssistant?.diagnosis?.summary || ``,
		                before: {
		                  modelProtocolRegistry: cloneBackupValue(modelProtocolRegistry),
		                  textModelProtocolBindings: cloneBackupValue(textModelProtocolBindings),
		                  imageModelProtocolBindings: cloneBackupValue(imageModelProtocolBindings),
		                  videoModelProtocolBindings: cloneBackupValue(videoModelProtocolBindings),
		                  audioModelProtocolBindings: cloneBackupValue(audioModelProtocolBindings),
		                },
		                after: {
		                  modelProtocolRegistry: cloneBackupValue(nextRegistry),
		                  ...cloneBackupValue(bindingUpdates),
		                },
		              };
		              let activeConfig = activeStoredGlobalConfigId && (storedGlobalConfigs || []).find((config) => config.id === activeStoredGlobalConfigId),
		                nextStoredConfigs = activeConfig ?
		                (storedGlobalConfigs || []).map((config) =>
		                  config.id === activeStoredGlobalConfigId ? {
		                    ...config,
		                    updatedAt: Date.now(),
		                    config: {
		                      ...(config.config || {}),
		                      modelProtocolRegistry: cloneBackupValue(nextRegistry),
		                      ...cloneBackupValue(bindingUpdates),
		                    },
		                  } : config,
		                ) :
		                null;
		              nextStoredConfigs && (setStoredGlobalConfigs(nextStoredConfigs), setActiveStoredGlobalConfigId(activeStoredGlobalConfigId));
		              let nextRepairHistory = [repairRecord, ...(configButlerRepairHistory || [])].slice(0, 50);
		              setConfigButlerRepairHistory(nextRepairHistory);
		              (typeof chrome < `u` &&
		                chrome.storage?.local?.set({
		                  modelProtocolRegistry: nextRegistry,
		                  ...bindingUpdates,
		                  configButlerRepairHistory: nextRepairHistory,
		                  ...(nextStoredConfigs ? {
		                    storedGlobalConfigs: nextStoredConfigs,
		                    activeStoredGlobalConfigId: activeStoredGlobalConfigId,
		                  } : {}),
		                }),
		                setConfigButlerErrorAssistant((record) => record ? {
		                  ...record,
		                  status: `applied`,
		                  appliedAt: Date.now(),
		                } : record),
		                showToast2(activeConfig ? `${repairLabel}已应用到 ${activeConfig.name} 的模型协议绑定` : `${repairLabel}已应用到当前模型协议绑定`));
		            };
  return { applyConfigButlerProtocolRepair };
}
