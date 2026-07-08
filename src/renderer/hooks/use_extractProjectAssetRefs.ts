/**
 * extractProjectAssetRefs。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseExtractProjectAssetRefsDeps {
  PROJECT_ASSET_REF_SUFFIX: any;
}

export function use_extractProjectAssetRefs(deps: UseExtractProjectAssetRefsDeps) {
  const {
    PROJECT_ASSET_REF_SUFFIX,
  } = deps;
  const extractProjectAssetRefs = (container, refs = new Set()) => {
              if (Array.isArray(container)) {
                container.forEach((item) => extractProjectAssetRefs(item, refs));
                return [...refs];
              }
              if (!container || typeof container != `object`) return [...refs];
              for (let [key, value] of Object.entries(container))
                (key.endsWith(PROJECT_ASSET_REF_SUFFIX) &&
                  typeof value == `string` &&
                  value &&
                  refs.add(value),
                  extractProjectAssetRefs(value, refs));
              return [...refs];
            };
  return { extractProjectAssetRefs };
}
