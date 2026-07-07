// @ts-nocheck
/**
 * toggleFavorite。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_toggleFavorite(deps: any) {
  const {
    isPluginEnv,
    setTransitResources,
    transitResources,
  } = deps;
  const toggleFavorite = async (resourceId) => {
              let updatedResources = transitResources.map((resource) =>
                resource.id === resourceId ? {
                  ...resource,
                  isFavorite: !resource.isFavorite
                } : resource,
              );
              (setTransitResources(updatedResources),
                await localforageModule.default.setItem(`transitResources`, updatedResources),
                isPluginEnv && chrome.storage.local.set({
                  transitResources: updatedResources
                }));
            };
  return { toggleFavorite };
}
