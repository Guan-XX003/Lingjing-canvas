// @ts-nocheck
/**
 * useSafeEffect38（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

interface UseSafeEffect38Deps {
  agentConversations: any;
  agentItems: any;
  appLanguage: any;
  autoDownloadGeneratedResults: any;
  backupExportSelection: any;
  downloadDirectory: any;
  layeredRunConcurrencyOptions: any;
  layeredRunMaxConcurrency: any;
  maxPollingDuration: any;
  performanceProfile: any;
  pollingInterval: any;
  presetPrompts: any;
  saveNonModelSettings: any;
  selectedAgentId: any;
  storageOptimizationEnabled: any;
  storageOptimizationPaused: any;
  themeMode: any;
}

export function useSafeEffect38(deps: UseSafeEffect38Deps) {
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
    performanceProfile,
    pollingInterval,
    presetPrompts,
    saveNonModelSettings,
    selectedAgentId,
    storageOptimizationEnabled,
    storageOptimizationPaused,
    themeMode,
  } = deps;
  useEffect(() => {
      saveNonModelSettings();
    }, [
      pollingInterval,
      maxPollingDuration,
      themeMode,
      appLanguage,
      downloadDirectory,
      autoDownloadGeneratedResults,
      storageOptimizationEnabled,
      storageOptimizationPaused,
      presetPrompts,
      layeredRunConcurrencyOptions,
      layeredRunMaxConcurrency,
      performanceProfile,
      backupExportSelection,
      agentItems,
      selectedAgentId,
      agentConversations,
    ]);
}
