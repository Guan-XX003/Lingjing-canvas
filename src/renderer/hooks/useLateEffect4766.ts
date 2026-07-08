// @ts-nocheck
/**
 * useLateEffect4766（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref } from "../lib/app-types";

interface UseLateEffect4766Deps {
  apiModelCloudSettingsSaveTimerRef: Ref;
  nonModelSettingsSaveTimerRef: Ref;
}

export function useLateEffect4766(deps: UseLateEffect4766Deps) {
  const {
    apiModelCloudSettingsSaveTimerRef,
    nonModelSettingsSaveTimerRef,
  } = deps;
  useEffect(() => () => {
	      nonModelSettingsSaveTimerRef.current &&
	        clearTimeout(nonModelSettingsSaveTimerRef.current);
	      apiModelCloudSettingsSaveTimerRef.current &&
	        clearTimeout(apiModelCloudSettingsSaveTimerRef.current);
	    }, []);
}
