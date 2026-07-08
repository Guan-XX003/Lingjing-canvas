/**
 * hydrateProjectAssetContainer。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { wanjuanResolveHydratedProjectAssetFileValue, wanjuanShouldSkipHydratedProjectAssetValue } from "../lib/project-asset-binding";

interface UseHydrateProjectAssetContainerDeps {
  localforageModule: any;
  PROJECT_ASSET_REF_SUFFIX: any;
}

export function use_hydrateProjectAssetContainer(deps: UseHydrateProjectAssetContainerDeps) {
  const {
    localforageModule,
    PROJECT_ASSET_REF_SUFFIX,
  } = deps;
  const hydrateProjectAssetContainer = async (container) => {
	              if (Array.isArray(container))
                return await Promise.all(container.map((item) => hydrateProjectAssetContainer(item)));
	              if (!container || typeof container != `object`) return container;
              let result = {};
	              for (let [key, value] of Object.entries(container)) {
	                if (typeof value == `string` && key.endsWith(PROJECT_ASSET_REF_SUFFIX)) {
	                  let baseKey = key.slice(0, -PROJECT_ASSET_REF_SUFFIX.length);
	                  if (baseKey && container[baseKey] === undefined && localforageModule.default)
	                    try {
	                      let storedValue = await localforageModule.default.getItem(value);
                      if (wanjuanShouldSkipHydratedProjectAssetValue(storedValue)) {
                        let fileValue = wanjuanResolveHydratedProjectAssetFileValue(container, baseKey);
                        fileValue && (result[baseKey] = fileValue);
                      } else {
                        storedValue && (result[baseKey] = storedValue);
                      }
	                    } catch (error) {
	                      console.error(`Failed to hydrate project asset`, error);
	                    }
	                  result[key] = value;
	                  continue;
	                }
                result[key] = await hydrateProjectAssetContainer(value);
              }
	              return result;
	            };
  return { hydrateProjectAssetContainer };
}
