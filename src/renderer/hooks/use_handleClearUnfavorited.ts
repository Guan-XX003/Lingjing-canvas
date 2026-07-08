// @ts-nocheck
/**
 * handleClearUnfavorited。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_handleClearUnfavorited(deps: any) {
  const {
    localforageModule,
    isPluginEnv,
    setTransitResources,
    transitResources,
  } = deps;
  const handleClearUnfavorited = async () => {
              if (confirm(`确定清空所有未收藏的资源吗？（收藏的资源将保留）`)) {
                let favoritedResources = transitResources.filter((resource) => resource.isFavorite);
                (setTransitResources(favoritedResources),
                  await localforageModule.default.setItem(`transitResources`, favoritedResources),
                  isPluginEnv && chrome.storage.local.set({
                    transitResources: favoritedResources
                  }));
              }
            };
  return { handleClearUnfavorited };
}
