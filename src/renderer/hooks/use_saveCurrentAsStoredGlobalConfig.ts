/**
 * saveCurrentAsStoredGlobalConfig。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { StoredGlobalConfig, Toast } from "../lib/app-types";

interface UseSaveCurrentAsStoredGlobalConfigDeps {
  captureCurrentGlobalConfig: any;
  persistStoredGlobalConfigs: any;
  showToast2: Toast;
  storedGlobalConfigs: StoredGlobalConfig[];
}

export function use_saveCurrentAsStoredGlobalConfig(deps: UseSaveCurrentAsStoredGlobalConfigDeps) {
  const {
    captureCurrentGlobalConfig,
    persistStoredGlobalConfigs,
    showToast2,
    storedGlobalConfigs,
  } = deps;
  const saveCurrentAsStoredGlobalConfig = async () => {
      let configName = typeof window < `u` && window.wanjuanDesktop?.showInputDialog ? await window.wanjuanDesktop.showInputDialog({
        title: `保存全局模型配置`,
        message: `给这套全局模型配置命名`,
        defaultValue: `新的全局配置`,
      }) : ``;
      configName = String(configName || ``).trim();
      if (!configName) return;
      let newConfigId = `global-config-${Date.now()}`,
        nextConfigs = [
          ...(storedGlobalConfigs || []),
          {
            id: newConfigId,
            name: configName,
            description: `手动保存`,
            updatedAt: Date.now(),
            config: captureCurrentGlobalConfig(),
          },
        ];
      persistStoredGlobalConfigs(nextConfigs, newConfigId);
      showToast2(`已保存 ${configName}`);
    };
  return { saveCurrentAsStoredGlobalConfig };
}
