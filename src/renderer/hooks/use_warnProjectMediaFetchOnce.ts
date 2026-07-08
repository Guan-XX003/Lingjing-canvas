// @ts-nocheck
/**
 * warnProjectMediaFetchOnce。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseWarnProjectMediaFetchOnceDeps {
  projectMediaFetchWarningCache: any;
}

export function use_warnProjectMediaFetchOnce(deps: UseWarnProjectMediaFetchOnceDeps) {
  const {
    projectMediaFetchWarningCache,
  } = deps;
  const warnProjectMediaFetchOnce = (mediaUrl, error) => {
              let warnKey =
                typeof mediaUrl == `string` ?
                `${mediaUrl.slice(0, 180)}:${error?.message || error}` :
                String(error?.message || error);
              if (projectMediaFetchWarningCache.has(warnKey)) return;
              projectMediaFetchWarningCache.add(warnKey);
            };
  return { warnProjectMediaFetchOnce };
}
