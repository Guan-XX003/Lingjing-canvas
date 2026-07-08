/**
 * useLateEffect4712（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { ApiConfig, Ref } from "../lib/app-types";

interface UseLateEffect4712Deps {
  apiConfigs: ApiConfig[];
  isReady: boolean;
  settingsHydratedRef: Ref;
  syncTianjiConfigFromJixinApi: any;
}

export function useLateEffect4712(deps: UseLateEffect4712Deps) {
  const {
    apiConfigs,
    isReady,
    settingsHydratedRef,
    syncTianjiConfigFromJixinApi,
  } = deps;
  useEffect(() => {
    if (!isReady || !settingsHydratedRef.current) return;
    syncTianjiConfigFromJixinApi(apiConfigs).catch((error) => console.warn(`Sync Tianji config from Jixin API failed`, error));
  }, [isReady, apiConfigs]);
}
