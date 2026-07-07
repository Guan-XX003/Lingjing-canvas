// @ts-nocheck
/**
 * saveCurrentToStoredGlobalConfig。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_saveCurrentToStoredGlobalConfig(deps: any) {
  const {
    captureCurrentGlobalConfig,
    persistStoredGlobalConfigs,
    showToast2,
    storedGlobalConfigs,
  } = deps;
  const saveCurrentToStoredGlobalConfig = (configId) => {
      let targetConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
      if (!targetConfig) {
        showToast2(`请选择一个已存储配置`);
        return;
      }
      let updatedConfigs = (storedGlobalConfigs || []).map((config) =>
        config.id === configId ? {
          ...config,
          updatedAt: Date.now(),
          config: captureCurrentGlobalConfig(),
        } : config,
      );
      persistStoredGlobalConfigs(updatedConfigs, configId);
      showToast2(`已更新 ${targetConfig.name}`);
    };
  return { saveCurrentToStoredGlobalConfig };
}
