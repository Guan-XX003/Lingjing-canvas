/**
 * manageStorageOptimizationTrash。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { formatStorageBytes } from "../lib/app-utils";

interface UseManageStorageOptimizationTrashDeps {
  downloadDirectory: any;
}

export function use_manageStorageOptimizationTrash(deps: UseManageStorageOptimizationTrashDeps) {
  const {
    downloadDirectory,
  } = deps;
  const manageStorageOptimizationTrash = async () => {
          let result = await window.wanjuanDesktop?.listStorageTrash?.({
            directory: downloadDirectory
          });
          alert(result?.ok ? `回收区共有 ${result.totalFiles} 个文件，占用 ${formatStorageBytes(result.totalBytes)}。\n\n可使用“恢复回收区”恢复全部文件，或永久删除超过 30 天的文件。` : `无法读取回收区：${result?.error || `未知错误`}`);
        };
  return { manageStorageOptimizationTrash };
}
