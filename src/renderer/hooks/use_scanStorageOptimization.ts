// @ts-nocheck
/**
 * scanStorageOptimization。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { formatStorageBytes } from "../lib/app-utils";

interface UseScanStorageOptimizationDeps {
  buildCompleteStorageReferenceIndex: any;
  downloadDirectory: any;
  refreshStorageOptimizationStatus: any;
  setStorageOptimizationBusy: SetAny;
  setStorageOptimizationLastResult: SetAny;
  showToast2: Toast;
}

export function use_scanStorageOptimization(deps: UseScanStorageOptimizationDeps) {
  const {
    buildCompleteStorageReferenceIndex,
    downloadDirectory,
    refreshStorageOptimizationStatus,
    setStorageOptimizationBusy,
    setStorageOptimizationLastResult,
    showToast2,
  } = deps;
  const scanStorageOptimization = async () => {
          setStorageOptimizationBusy(true);
          globalThis.__wanjuanStorageMaintenanceRunning = true;
          try {
            await new Promise((resolve) => setTimeout(resolve, 300));
            let index = await buildCompleteStorageReferenceIndex();
            if (!index?.ok || !index.index?.complete) {
              setStorageOptimizationLastResult(`扫描未通过：存在未建立画布状态或缺失引用的项目`);
              showToast2(`引用索引不完整，已拒绝清理`);
              return;
            }
            let scan = await window.wanjuanDesktop.scanStorageReclaimable({
              directory: downloadDirectory
            });
            setStorageOptimizationLastResult(scan?.ok ? `扫描完成：${scan.candidateCount} 个文件，可释放 ${formatStorageBytes(scan.candidateBytes)}` : `扫描失败：${scan?.error || `未知错误`}`);
            await refreshStorageOptimizationStatus();
          } finally {
            globalThis.__wanjuanStorageMaintenanceRunning = false;
            setStorageOptimizationBusy(false);
          }
        };
  return { scanStorageOptimization };
}
