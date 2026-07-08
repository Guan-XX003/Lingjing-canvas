// @ts-nocheck
/**
 * useLateEffect4727（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

interface UseLateEffect4727Deps {
  activeView: any;
  refreshSystemNotifications: any;
}

export function useLateEffect4727(deps: UseLateEffect4727Deps) {
  const {
    activeView,
    refreshSystemNotifications,
  } = deps;
  useEffect(() => {
    if (activeView !== `canvas` && activeView !== `settings`) return;
    refreshSystemNotifications({
      source: activeView,
      silent: true,
    });
  }, [activeView]);
}
