/**
 * handleCleanInvalidResources。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, SetState, Toast, TransitResource } from "../lib/app-types";
declare const chrome: any;

interface UseHandleCleanInvalidResourcesDeps {
  localforageModule: any;
  isPluginEnv: boolean;
  probeResourceAlive: any;
  resourceCleanupBusy: any;
  setCurrentPage: SetAny;
  setResourceCleanupBusy: SetAny;
  setTransitResources: SetState<TransitResource[]>;
  showToast2: Toast;
  transitResources: TransitResource[];
}

export function use_handleCleanInvalidResources(deps: UseHandleCleanInvalidResourcesDeps) {
  const {
    localforageModule,
    isPluginEnv,
    probeResourceAlive,
    resourceCleanupBusy,
    setCurrentPage,
    setResourceCleanupBusy,
    setTransitResources,
    showToast2,
    transitResources,
  } = deps;
  const handleCleanInvalidResources = async () => {
              if (resourceCleanupBusy) return;
              let mediaResources = transitResources.filter((resource) => !String(resource?.type || resource?.mediaKind || ``).toLowerCase().startsWith(`text`));
              if (mediaResources.length === 0) {
                showToast2(`没有需要检查的媒体素材`);
                return;
              }
              setResourceCleanupBusy(true);
              showToast2(`正在检查失效素材...`);
              try {
                let invalidIds = new Set();
                for (let resource of mediaResources) {
                  let alive = await probeResourceAlive(resource);
                  alive || invalidIds.add(resource.id);
                }
                if (invalidIds.size === 0) {
                  showToast2(`没有发现失效素材`);
                  return;
                }
                if (!confirm(`检测到 ${invalidIds.size} 个失效素材，确定从资源库移除吗？`)) return;
                setCurrentPage(1);
                // 用函数式更新拿最新 transitResources：扫描期间(每素材最长 6s 串行探活)可能有 paste/消息/画布同步新增素材，
                // 基于最新 prev 过滤并持久化，避免用陈旧闭包的旧数组覆盖、把新素材静默抹掉。
                setTransitResources((prev) => {
                  let next = prev.filter((resource) => !invalidIds.has(resource.id));
                  localforageModule.default.setItem(`transitResources`, next);
                  isPluginEnv && chrome.storage.local.set({ transitResources: next });
                  return next;
                });
                showToast2(`已清理 ${invalidIds.size} 个失效素材`);
              } catch (error) {
                (console.error(`Clean invalid resources failed`, error), showToast2(`清理失败，请稍后重试`));
              } finally {
                setResourceCleanupBusy(false);
              }
            };
  return { handleCleanInvalidResources };
}
