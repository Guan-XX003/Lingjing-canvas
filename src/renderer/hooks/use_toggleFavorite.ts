// @ts-nocheck
/**
 * toggleFavorite。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetState, TransitResource } from "../lib/app-types";
declare const chrome: any;

interface UseToggleFavoriteDeps {
  localforageModule: any;
  isPluginEnv: boolean;
  setTransitResources: SetState<TransitResource[]>;
  transitResources: TransitResource[];
}

export function use_toggleFavorite(deps: UseToggleFavoriteDeps) {
  const {
    localforageModule,
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
