// @ts-nocheck
/**
 * useLateEffect4703（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
declare const chrome: any;

interface UseLateEffect4703Deps {}

export function useLateEffect4703(deps: UseLateEffect4703Deps) {
  const {} = deps;
  useEffect(() => {
	    try {
	      localStorage.setItem(`wanjuanAdvancedSettingsUnlocked`, `true`);
	      typeof chrome < `u` &&
	        chrome.storage?.local?.set?.({
	          advancedSettingsUnlocked: true,
	        });
	    } catch {}
	  }, []);
}
