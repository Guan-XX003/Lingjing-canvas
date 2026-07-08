/**
 * useLateEffect4737（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetAny } from "../lib/app-types";

interface UseLateEffect4737Deps {
  activeView: any;
  setDailyUsageCount: SetAny;
}

export function useLateEffect4737(deps: UseLateEffect4737Deps) {
  const {
    activeView,
    setDailyUsageCount,
  } = deps;
  useEffect(() => {
    if (activeView === `settings`) {
      let dailyLimitKey = `daily-limit-${new Date().toISOString().split(`T`)[0]}`;
      setDailyUsageCount(parseInt(localStorage.getItem(dailyLimitKey) || `0`));
    }
  }, [activeView]);
}
