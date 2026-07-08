/**
 * addResource。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
declare const chrome: any;

interface UseAddResourceDeps {
  localforageModule: any;
  isPluginEnv: boolean;
  setTransitResources: SetAny;
  transitResources: any;
}

export function use_addResource(deps: UseAddResourceDeps) {
  const {
    localforageModule,
    isPluginEnv,
    setTransitResources,
    transitResources,
  } = deps;
  const addResource = (url, resourceType, source = `pasted`) => {
	      let newResource = {
        id: Date.now().toString(),
        url: url,
        type: resourceType,
        timestamp: Date.now(),
        pageUrl: `clipboard`,
        pageTitle: source === `generated` ? `AI生成内容` : `来自剪贴板`,
        source: source,
      };
      setTransitResources((prevResources) => {
        let updatedResources = [newResource, ...prevResources];
        return (
          localforageModule.default.setItem(`transitResources`, updatedResources),
          isPluginEnv && chrome.storage.local.set({
            transitResources: updatedResources
          }),
          updatedResources
        );
	      });
	    };
  return { addResource };
}
