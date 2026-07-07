// @ts-nocheck
/**
 * useLateEffect4766（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useLateEffect4766(deps: any) {
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
