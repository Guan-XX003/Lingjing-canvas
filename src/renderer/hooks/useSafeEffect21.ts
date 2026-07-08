/**
 * useSafeEffect21（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { ApiConfig, SetAny } from "../lib/app-types";

interface UseSafeEffect21Deps {
  apiConfigs: ApiConfig[];
  configButlerTargetApiConfigId: any;
  setConfigButlerTargetApiConfigId: SetAny;
  setConfigButlerTargetApiKey: SetAny;
  setConfigButlerTargetApiUrl: SetAny;
}

export function useSafeEffect21(deps: UseSafeEffect21Deps) {
  const {
    apiConfigs,
    configButlerTargetApiConfigId,
    setConfigButlerTargetApiConfigId,
    setConfigButlerTargetApiKey,
    setConfigButlerTargetApiUrl,
  } = deps;
  useEffect(() => {
    let targetApiConfig =
      apiConfigs.find((config) => config.id === configButlerTargetApiConfigId) ||
      apiConfigs.find((config) => config.id === `vectorengine`) ||
      apiConfigs[0];
    targetApiConfig &&
      (setConfigButlerTargetApiConfigId(targetApiConfig.id),
        setConfigButlerTargetApiUrl(targetApiConfig.url || ``),
        setConfigButlerTargetApiKey(targetApiConfig.key || ``));
  }, [apiConfigs, configButlerTargetApiConfigId]);
}
