/**
 * cleanStorageOptimization。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { formatStorageBytes } from "../lib/app-utils";

interface UseCleanStorageOptimizationDeps {
  buildCompleteStorageReferenceIndex: any;
  downloadDirectory: any;
  refreshStorageOptimizationStatus: any;
  setStorageOptimizationBusy: SetAny;
  setStorageOptimizationLastResult: SetAny;
  showToast2: Toast;
}

export function use_cleanStorageOptimization(deps: UseCleanStorageOptimizationDeps) {
  const {
    buildCompleteStorageReferenceIndex,
    downloadDirectory,
    refreshStorageOptimizationStatus,
    setStorageOptimizationBusy,
    setStorageOptimizationLastResult,
    showToast2,
  } = deps;
  const cleanStorageOptimization = async () => {
          setStorageOptimizationBusy(true);
          globalThis.__wanjuanStorageMaintenanceRunning = true;
          try {
            await new Promise((resolve) => setTimeout(resolve, 300));
            let index = await buildCompleteStorageReferenceIndex();
            if (!index?.ok || !index.index?.complete) {
              showToast2(`引用索引不完整，已拒绝清理`);
              return;
            }
            let scan = await window.wanjuanDesktop.scanStorageReclaimable({
              directory: downloadDirectory
            });
            if (!scan?.ok || !scan.candidateCount) {
              showToast2(`没有可清理的未引用媒体`);
              return;
            }
            if (!confirm(`将 ${scan.candidateCount} 个未引用文件（${formatStorageBytes(scan.candidateBytes)}）移入 30 天回收区？`)) return;
            let result = await window.wanjuanDesktop.moveUnreferencedMediaToTrash({
              directory: downloadDirectory,
              confirm: true,
            });
            setStorageOptimizationLastResult(result?.ok ? `已移入回收区：${result.movedCount} 个文件` : `清理失败：${result?.error || `未知错误`}`);
            await refreshStorageOptimizationStatus();
          } finally {
            globalThis.__wanjuanStorageMaintenanceRunning = false;
            setStorageOptimizationBusy(false);
          }
        };
  return { cleanStorageOptimization };
}
