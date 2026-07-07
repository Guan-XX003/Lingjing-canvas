// @ts-nocheck
/**
 * useSafeEffect37（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useSafeEffect37(deps: any) {
  const {
    activeProjectId,
    isReady,
    projectHydratedRef,
    settingsHydratedRef,
    themeMode,
  } = deps;
  useEffect(() => {
      if (!isReady || !settingsHydratedRef.current || !projectHydratedRef.current) return;
      let markAppReady = () => {
        try {
          let rootElement = document.documentElement;
          ((rootElement.dataset.wanjuanAppReady = `true`),
            (rootElement.dataset.wanjuanProjectId = activeProjectId || `default`),
            (rootElement.dataset.wanjuanThemeMode = themeMode || ``));
        } catch {}
      };
      typeof requestAnimationFrame == `function` ?
        requestAnimationFrame(() => requestAnimationFrame(markAppReady)) :
        setTimeout(markAppReady, 32);
    }, [isReady, activeProjectId, themeMode]);
}
