// @ts-nocheck
/**
 * saveStoredGlobalConfigApiDocUrl。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_saveStoredGlobalConfigApiDocUrl(deps: any) {
  const {
    persistStoredGlobalConfigs,
    setConfigButlerDocUrl,
    showToast2,
    storedGlobalConfigs,
  } = deps;
  const saveStoredGlobalConfigApiDocUrl = (configId, rawDocUrl) => {
      let apiDocUrl = String(rawDocUrl || ``).trim(),
        targetConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
      if (!targetConfig) {
        showToast2(`请选择一个已存储配置`);
        return;
      }
      let updatedConfigs = (storedGlobalConfigs || []).map((config) =>
        config.id === configId ? {
          ...config,
          apiDocUrl: apiDocUrl,
          updatedAt: Date.now(),
          config: {
            ...(config.config || {}),
            apiDocUrl: apiDocUrl,
            configButlerDocUrl: apiDocUrl,
          },
        } : config,
      );
      (persistStoredGlobalConfigs(updatedConfigs, configId),
        setConfigButlerDocUrl(apiDocUrl),
        showToast2(apiDocUrl ? `已保存 ${targetConfig.name} 的 API 文档链接` : `已清空 ${targetConfig.name} 的 API 文档链接`));
    };
  return { saveStoredGlobalConfigApiDocUrl };
}
