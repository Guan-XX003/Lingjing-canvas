// @ts-nocheck
/**
 * handleClearUnfavorited。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetState, TransitResource } from "../lib/app-types";
declare const chrome: any;

interface UseHandleClearUnfavoritedDeps {
  localforageModule: any;
  isPluginEnv: boolean;
  setTransitResources: SetState<TransitResource[]>;
  transitResources: TransitResource[];
}

export function use_handleClearUnfavorited(deps: UseHandleClearUnfavoritedDeps) {
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
