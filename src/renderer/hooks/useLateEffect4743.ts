/**
 * useLateEffect4743（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
declare const chrome: any;

interface UseLateEffect4743Deps {
  activeProjectId: any;
  isReady: boolean;
}

export function useLateEffect4743(deps: UseLateEffect4743Deps) {
  const {
    activeProjectId,
    isReady,
  } = deps;
  useEffect(() => {
      isReady &&
        activeProjectId &&
        (localStorage.setItem(`lastOpenedProjectId`, activeProjectId),
          typeof chrome < `u` &&
          chrome.storage &&
          chrome.storage.local.set({
            lastOpenedProjectId: activeProjectId
          }));
    }, [activeProjectId, isReady]);
}
