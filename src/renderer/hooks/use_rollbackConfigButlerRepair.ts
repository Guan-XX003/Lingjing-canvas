/**
 * rollbackConfigButlerRepair。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ProtocolBindings, ProtocolRegistry, SetAny, SetState, StoredGlobalConfig, Toast } from "../lib/app-types";
import { cloneBackupValue } from "../lib/backup";
declare const chrome: any;

interface UseRollbackConfigButlerRepairDeps {
  configButlerRepairHistory: any;
  setAudioModelProtocolBindings: SetAny;
  setConfigButlerRepairHistory: SetAny;
  setImageModelProtocolBindings: SetAny;
  setModelProtocolRegistry: SetAny;
  setStoredGlobalConfigs: SetState<StoredGlobalConfig[]>;
  setTextModelProtocolBindings: SetAny;
  setVideoModelProtocolBindings: SetAny;
  showToast2: Toast;
  storedGlobalConfigs: StoredGlobalConfig[];
  audioModelProtocolBindings: ProtocolBindings;
  imageModelProtocolBindings: ProtocolBindings;
  modelProtocolRegistry: ProtocolRegistry;
  textModelProtocolBindings: ProtocolBindings;
  videoModelProtocolBindings: ProtocolBindings;
}

export function use_rollbackConfigButlerRepair(deps: UseRollbackConfigButlerRepairDeps) {
  const {
    configButlerRepairHistory,
    setAudioModelProtocolBindings,
    setConfigButlerRepairHistory,
    setImageModelProtocolBindings,
    setModelProtocolRegistry,
    setStoredGlobalConfigs,
    setTextModelProtocolBindings,
    setVideoModelProtocolBindings,
    showToast2,
    storedGlobalConfigs,
    audioModelProtocolBindings,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    textModelProtocolBindings,
    videoModelProtocolBindings,
  } = deps;
  const rollbackConfigButlerRepair = (recordId) => {
		              let repairRecord = (configButlerRepairHistory || []).find((record) => record.id === recordId);
		              if (!repairRecord?.before) {
		                showToast2(`没有找到可撤回的修复记录`);
		                return;
		              }
		              let restoredRegistry = cloneBackupValue(repairRecord.before.modelProtocolRegistry || {}),
		                restoredTextBindings = cloneBackupValue(repairRecord.before.textModelProtocolBindings || {}),
		                restoredImageBindings = cloneBackupValue(repairRecord.before.imageModelProtocolBindings || {}),
		                restoredVideoBindings = cloneBackupValue(repairRecord.before.videoModelProtocolBindings || {}),
		                restoredAudioBindings = cloneBackupValue(repairRecord.before.audioModelProtocolBindings || {});
		              (setModelProtocolRegistry(restoredRegistry),
		                setTextModelProtocolBindings(restoredTextBindings),
		                setImageModelProtocolBindings(restoredImageBindings),
		                setVideoModelProtocolBindings(restoredVideoBindings),
		                setAudioModelProtocolBindings(restoredAudioBindings));
		              let nextStoredConfigs = repairRecord.globalConfigId ?
		                (storedGlobalConfigs || []).map((config) =>
		                  config.id === repairRecord.globalConfigId ? {
		                    ...config,
		                    updatedAt: Date.now(),
		                    config: {
		                      ...(config.config || {}),
		                      modelProtocolRegistry: cloneBackupValue(restoredRegistry),
		                      textModelProtocolBindings: cloneBackupValue(restoredTextBindings),
		                      imageModelProtocolBindings: cloneBackupValue(restoredImageBindings),
		                      videoModelProtocolBindings: cloneBackupValue(restoredVideoBindings),
		                      audioModelProtocolBindings: cloneBackupValue(restoredAudioBindings),
		                    },
		                  } : config,
		                ) :
		                null,
		                nextRepairHistory = (configButlerRepairHistory || []).map((record) =>
		                  record.id === recordId ? {
		                    ...record,
		                    rolledBackAt: Date.now(),
		                  } : record,
		                );
		              (nextStoredConfigs && setStoredGlobalConfigs(nextStoredConfigs),
		                setConfigButlerRepairHistory(nextRepairHistory),
		                typeof chrome < `u` &&
		                chrome.storage?.local?.set({
		                  modelProtocolRegistry: restoredRegistry,
		                  textModelProtocolBindings: restoredTextBindings,
		                  imageModelProtocolBindings: restoredImageBindings,
		                  videoModelProtocolBindings: restoredVideoBindings,
		                  audioModelProtocolBindings: restoredAudioBindings,
		                  configButlerRepairHistory: nextRepairHistory,
		                  ...(nextStoredConfigs ? {
		                    storedGlobalConfigs: nextStoredConfigs,
		                  } : {}),
		                }),
		                showToast2(`已撤回 ${repairRecord.modelName || `模型`} 的配置管家修复`));
		            };
  return { rollbackConfigButlerRepair };
}
