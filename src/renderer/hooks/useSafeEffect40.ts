/**
 * useSafeEffect40（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

interface UseSafeEffect40Deps {
  activeProjectId: any;
  globalTasks: any;
  storageOptimizationEnabled: any;
  storageOptimizationPaused: any;
}

export function useSafeEffect40(deps: UseSafeEffect40Deps) {
  const {
    activeProjectId,
    globalTasks,
    storageOptimizationEnabled,
    storageOptimizationPaused,
  } = deps;
  useEffect(() => {
      if (!storageOptimizationEnabled || storageOptimizationPaused) return;
      let timer = setInterval(() => {
        let hasActiveTask = globalTasks.some((task) => task?.status === `running` || task?.status === `pending`);
        if (hasActiveTask || Date.now() - Number(globalThis.__wanjuanLastCanvasActivityAt || 0) < 3e4) return;
        globalThis.__wanjuanRunNextStorageMigration?.(true);
      }, 15e3);
      return () => clearInterval(timer);
    }, [storageOptimizationEnabled, storageOptimizationPaused, globalTasks, activeProjectId]);
}
