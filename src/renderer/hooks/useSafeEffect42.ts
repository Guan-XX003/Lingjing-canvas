// @ts-nocheck
/**
 * useSafeEffect42（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useSafeEffect42(deps: any) {
  const {
    downloadDirectory,
    setStorageOptimizationLastResult,
    storageOptimizationEnabled,
  } = deps;
  useEffect(() => {
      if (!storageOptimizationEnabled) return;
      let previous = globalThis.__wanjuanStorageOptimizationDirectory;
      if (previous !== undefined && previous !== downloadDirectory)
        setStorageOptimizationLastResult(`下载目录已更改。新结果写入新媒体库，旧媒体库保持只读可用；如需集中存放，请手动搬迁。`);
      globalThis.__wanjuanStorageOptimizationDirectory = downloadDirectory;
    }, [storageOptimizationEnabled, downloadDirectory]);
}
