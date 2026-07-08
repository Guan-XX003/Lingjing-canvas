// @ts-nocheck
/**
 * useLateEffect1095（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetAny } from "../lib/app-types";

interface UseLateEffect1095Deps {
  setDailyGenerationCount: SetAny;
}

export function useLateEffect1095(deps: UseLateEffect1095Deps) {
  const {
    setDailyGenerationCount,
  } = deps;
  useEffect(() => {
    let dailyLimitKey = `daily-limit-${new Date().toISOString().split(`T`)[0]}`;
    setDailyGenerationCount(parseInt(localStorage.getItem(dailyLimitKey) || `0`));
  }, []);
}
