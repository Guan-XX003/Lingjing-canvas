// @ts-nocheck
/**
 * restoreStorageOptimizationTrash。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_restoreStorageOptimizationTrash(deps: any) {
  const {
    downloadDirectory,
    refreshStorageOptimizationStatus,
    setStorageOptimizationLastResult,
  } = deps;
  const restoreStorageOptimizationTrash = async () => {
          let result = await window.wanjuanDesktop?.restoreStorageTrash?.({
            directory: downloadDirectory
          });
          setStorageOptimizationLastResult(result?.ok ? `已恢复 ${result.restoredCount} 个回收区文件` : `恢复失败`);
          await refreshStorageOptimizationStatus();
        };
  return { restoreStorageOptimizationTrash };
}
