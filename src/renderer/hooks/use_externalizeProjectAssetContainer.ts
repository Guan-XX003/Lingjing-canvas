// @ts-nocheck
/**
 * externalizeProjectAssetContainer。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildProjectAssetStorageKey, convertProjectAssetValueToPortableString, shouldPersistProjectAssetValue } from "../lib/backup";
import { wanjuanResolveHydratedProjectAssetFileValue, wanjuanShouldSkipHydratedProjectAssetValue } from "../lib/project-asset-binding";

export function use_externalizeProjectAssetContainer(deps: any) {
  const {
    PROJECT_ASSET_REF_SUFFIX,
  } = deps;
  const externalizeProjectAssetContainer = async (container, options = {}) => {
          let projectId = options.projectId || `default`,
            nodeId = options.nodeId || `node`,
            path = options.path || `root`,
            assetMap = options.assetMap || {},
            persist = !!options.persist;
          if (Array.isArray(container))
            return await Promise.all(
              container.map((item, index) =>
                externalizeProjectAssetContainer(item, {
                  projectId: projectId,
                  nodeId: nodeId,
                  path: `${path}-${index}`,
                  assetMap: assetMap,
                  persist: persist,
                }),
              ),
            );
          if (!container || typeof container != `object`) return container;
	          let result = {};
	          for (let [key, value] of Object.entries(container)) {
	            if (shouldPersistProjectAssetValue(key, value)) {
	              if (wanjuanShouldSkipHydratedProjectAssetValue(value)) {
	                let existingRef = container[`${key}${PROJECT_ASSET_REF_SUFFIX}`],
	                  fileValue = wanjuanResolveHydratedProjectAssetFileValue(container, key);
	                if (typeof existingRef == `string` && existingRef) {
	                  result[`${key}${PROJECT_ASSET_REF_SUFFIX}`] = existingRef;
	                  continue;
	                }
	                if (fileValue) {
	                  result[key] = fileValue;
	                  continue;
	                }
	                console.warn(`Skipped oversized project media data URL during canvas externalize`, key, nodeId);
	                continue;
	              }
	              let portableString = await convertProjectAssetValueToPortableString(value),
	                storageKey = buildProjectAssetStorageKey(projectId, nodeId, `${path}-${key}`);
              ((assetMap[storageKey] = portableString),
                persist && localforageModule.default && (await localforageModule.default.setItem(storageKey, portableString)),
                (result[`${key}${PROJECT_ASSET_REF_SUFFIX}`] = storageKey));
              continue;
            }
            result[key] = await externalizeProjectAssetContainer(value, {
              projectId: projectId,
              nodeId: nodeId,
              path: `${path}-${key}`,
              assetMap: assetMap,
              persist: persist,
            });
          }
          return result;
        };
  return { externalizeProjectAssetContainer };
}
