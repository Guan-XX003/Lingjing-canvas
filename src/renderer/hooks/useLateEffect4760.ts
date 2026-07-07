// @ts-nocheck
/**
 * useLateEffect4760（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useLateEffect4760(deps: any) {
  const {
    activeSettingsTab,
    downloadDirectory,
    setStorageOptimizationStatus,
  } = deps;
  useEffect(() => {
      activeSettingsTab === `data` && window.wanjuanDesktop?.getStorageOptimizationStatus?.({
        directory: downloadDirectory
      }).then((result) => result?.ok && setStorageOptimizationStatus(result)).catch(console.error);
    }, [activeSettingsTab, downloadDirectory]);
}
