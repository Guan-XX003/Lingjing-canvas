/**
 * useSafeEffect37（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref } from "../lib/app-types";

interface UseSafeEffect37Deps {
  activeProjectId: any;
  isReady: boolean;
  projectHydratedRef: Ref;
  settingsHydratedRef: Ref;
  themeMode: any;
}

export function useSafeEffect37(deps: UseSafeEffect37Deps) {
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
