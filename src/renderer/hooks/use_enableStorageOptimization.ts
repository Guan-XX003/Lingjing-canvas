// @ts-nocheck
/**
 * enableStorageOptimization。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { formatStorageBytes } from "../lib/app-utils";
declare const chrome: any;

export function use_enableStorageOptimization(deps: any) {
  const {
    activeProjectId,
    projects,
    refreshStorageOptimizationStatus,
    setProjects,
    setStorageOptimizationEnabled,
    setStorageOptimizationLastResult,
    setStorageOptimizationPaused,
    showToast2,
  } = deps;
  const enableStorageOptimization = async () => {
          let status = await refreshStorageOptimizationStatus();
          if (!status?.ok) {
            showToast2(`无法检查媒体库状态`);
            return;
          }
          if (!status.writable) {
            setStorageOptimizationLastResult(`媒体库不可写：${status.accessError || `需要文件访问授权`}`);
            showToast2(`媒体库不可写，请先在生成设置中选择可访问的下载目录`);
            return;
          }
          if (!confirm(`启用后，新生成结果会写入全局媒体池，旧项目仅在空闲且未打开时逐个迁移。\n\n媒体库：${status.libraryPath}\n可用空间：${status.freeBytes == null ? `未知` : formatStorageBytes(status.freeBytes)}\n\n是否启用？`)) return;
          let updatedProjects = projects.map((project) => ({
            ...project,
            storageStatus: project.storageStatus === `optimized` ? `optimized` : `queued`,
            storageDetail: project.id === activeProjectId ? `切换项目后迁移` : `等待空闲迁移`,
          }));
          (setStorageOptimizationEnabled(true),
            setStorageOptimizationPaused(false),
            setProjects(updatedProjects),
            chrome.storage.local.set({
              storageOptimizationEnabled: true,
              storageOptimizationPaused: false,
              projects: updatedProjects,
            }),
            setStorageOptimizationLastResult(`已启用，等待应用空闲后迁移旧项目`));
        };
  return { enableStorageOptimization };
}
