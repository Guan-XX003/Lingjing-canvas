/**
 * useSafeEffect30（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { wanjuanNormalizeTianjiSeedanceConfig, wanjuanTianjiStorageSet } from "../lib/tianji-api";

interface UseSafeEffect30Deps {
  isReady: boolean;
}

export function useSafeEffect30(deps: UseSafeEffect30Deps) {
  const {
    isReady,
  } = deps;
  useEffect(() => {
    if (!isReady) return;
    let handleTianjiConfigUpdated = (event) => {
      try {
        let config = wanjuanNormalizeTianjiSeedanceConfig(event?.detail?.config || {});
        if (!config.token) return;
        wanjuanTianjiStorageSet({
          tianjiSeedanceConfig: config
        }).catch((error) => console.warn(`Mirror Tianji config update failed`, error));
      } catch (error) {
        console.warn(`Handle Tianji config update failed`, error);
      }
    };
    window.addEventListener(`wanjuan:tianji-config-updated`, handleTianjiConfigUpdated);
    return () => window.removeEventListener(`wanjuan:tianji-config-updated`, handleTianjiConfigUpdated);
  }, [isReady]);
}
