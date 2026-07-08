/**
 * saveNonModelSettings。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Ref } from "../lib/app-types";
declare const chrome: any;

interface UseSaveNonModelSettingsDeps {
  agentConversations: any;
  agentItems: any;
  appLanguage: any;
  autoDownloadGeneratedResults: any;
  backupExportSelection: any;
  downloadDirectory: any;
  layeredRunConcurrencyOptions: any;
  layeredRunMaxConcurrency: any;
  maxPollingDuration: any;
  nonModelSettingsSaveTimerRef: Ref;
  performanceProfile: any;
  pollingInterval: any;
  presetPrompts: any;
  selectedAgentId: any;
  settingsHydratedRef: Ref;
  storageOptimizationEnabled: any;
  storageOptimizationPaused: any;
  themeMode: any;
}

export function use_saveNonModelSettings(deps: UseSaveNonModelSettingsDeps) {
  const {
    agentConversations,
    agentItems,
    appLanguage,
    autoDownloadGeneratedResults,
    backupExportSelection,
    downloadDirectory,
    layeredRunConcurrencyOptions,
    layeredRunMaxConcurrency,
    maxPollingDuration,
    nonModelSettingsSaveTimerRef,
    performanceProfile,
    pollingInterval,
    presetPrompts,
    selectedAgentId,
    settingsHydratedRef,
    storageOptimizationEnabled,
    storageOptimizationPaused,
    themeMode,
  } = deps;
  const saveNonModelSettings = () => {
      if (
        !settingsHydratedRef.current ||
        typeof chrome > `u` ||
        !chrome.storage ||
        !chrome.storage.local
      )
        return;
      nonModelSettingsSaveTimerRef.current &&
        clearTimeout(nonModelSettingsSaveTimerRef.current),
        (nonModelSettingsSaveTimerRef.current = setTimeout(() => {
          chrome.storage.local.set({
            globalPollingInterval: pollingInterval,
            globalMaxPollingDuration: maxPollingDuration,
            themeMode: themeMode,
            uiTheme: themeMode,
            theme: themeMode,
            appearanceTheme: themeMode,
            appLanguage: appLanguage,
            uiLanguage: appLanguage,
            downloadDirectory: downloadDirectory,
            autoDownloadGeneratedResults: autoDownloadGeneratedResults,
            storageOptimizationEnabled: storageOptimizationEnabled,
            storageOptimizationPaused: storageOptimizationPaused,
            presetPrompts: presetPrompts,
            layeredRunConcurrencyOptions: layeredRunConcurrencyOptions,
            layeredRunMaxConcurrency: layeredRunMaxConcurrency,
            wanjuanPerformanceProfile: performanceProfile,
            backupExportSelection: backupExportSelection,
            agents: agentItems,
            selectedAgentId: selectedAgentId,
            agentConversations: agentConversations,
          });
        }, 250));
    };
  return { saveNonModelSettings };
}
