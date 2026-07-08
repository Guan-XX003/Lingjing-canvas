/**
 * persistStoredGlobalConfigs。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
declare const chrome: any;

interface UsePersistStoredGlobalConfigsDeps {
  activeStoredGlobalConfigId: any;
  setActiveStoredGlobalConfigId: SetAny;
  setStoredGlobalConfigs: SetAny;
  storedGlobalConfigs: any;
}

export function use_persistStoredGlobalConfigs(deps: UsePersistStoredGlobalConfigsDeps) {
  const {
    activeStoredGlobalConfigId,
    setActiveStoredGlobalConfigId,
    setStoredGlobalConfigs,
    storedGlobalConfigs,
  } = deps;
  const persistStoredGlobalConfigs = (configs, activeConfigId = activeStoredGlobalConfigId) => {
      (setStoredGlobalConfigs(configs),
        setActiveStoredGlobalConfigId(activeConfigId || ``),
        typeof chrome < `u` && chrome.storage?.local?.set({
          storedGlobalConfigs: configs,
          activeStoredGlobalConfigId: activeConfigId || ``,
        }));
    };
  return { persistStoredGlobalConfigs };
}
