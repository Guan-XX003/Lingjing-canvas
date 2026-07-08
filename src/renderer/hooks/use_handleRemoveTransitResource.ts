/**
 * handleRemoveTransitResource。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetState, TransitResource } from "../lib/app-types";
declare const chrome: any;

interface UseHandleRemoveTransitResourceDeps {
  localforageModule: any;
  isPluginEnv: boolean;
  setTransitResources: SetState<TransitResource[]>;
  transitResources: TransitResource[];
}

export function use_handleRemoveTransitResource(deps: UseHandleRemoveTransitResourceDeps) {
  const {
    localforageModule,
    isPluginEnv,
    setTransitResources,
    transitResources,
  } = deps;
  const handleRemoveTransitResource = (resourceId) => {
          setTransitResources((resources) => {
            let updatedResources = resources.filter((resource) => resource.id !== resourceId);
            return (
              localforageModule.default.setItem(`transitResources`, updatedResources),
              isPluginEnv && chrome.storage.local.set({
                transitResources: updatedResources
              }),
              updatedResources
            );
          });
        };
  return { handleRemoveTransitResource };
}
