// @ts-nocheck
/**
 * purgeStorageOptimizationTrash。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";

interface UsePurgeStorageOptimizationTrashDeps {
  downloadDirectory: any;
  refreshStorageOptimizationStatus: any;
  setStorageOptimizationLastResult: SetAny;
}

export function use_purgeStorageOptimizationTrash(deps: UsePurgeStorageOptimizationTrashDeps) {
  const {
    downloadDirectory,
    refreshStorageOptimizationStatus,
    setStorageOptimizationLastResult,
  } = deps;
  const purgeStorageOptimizationTrash = async () => {
          if (!confirm(`永久删除回收区内超过 30 天的文件？此操作无法撤销。`)) return;
          let result = await window.wanjuanDesktop?.purgeStorageTrash?.({
            directory: downloadDirectory,
            olderThanDays: 30,
            confirm: true,
          });
          setStorageOptimizationLastResult(result?.ok ? `已永久删除 ${result.purgedFiles} 个过期文件` : `永久删除失败`);
          await refreshStorageOptimizationStatus();
        };
  return { purgeStorageOptimizationTrash };
}
