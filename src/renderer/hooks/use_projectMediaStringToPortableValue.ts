/**
 * projectMediaStringToPortableValue。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseProjectMediaStringToPortableValueDeps {
  blobToDataUrl: any;
  warnProjectMediaFetchOnce: any;
}

export function use_projectMediaStringToPortableValue(deps: UseProjectMediaStringToPortableValueDeps) {
  const {
    blobToDataUrl,
    warnProjectMediaFetchOnce,
  } = deps;
  const projectMediaStringToPortableValue = async (mediaString) => {
                if (typeof mediaString != `string` || !mediaString) return mediaString;
                if (mediaString.startsWith(`data:`)) return mediaString;
                if (
                  mediaString.startsWith(`blob:`) ||
                  /^https?:\/\//i.test(mediaString) ||
                  mediaString.startsWith(`file://`)
                )
                  try {
                    let response = await fetch(mediaString);
                    if (!response.ok) throw Error(`media fetch failed`);
                    return await blobToDataUrl(await response.blob());
                  } catch (error) {
                    return (warnProjectMediaFetchOnce(mediaString, error), mediaString);
                  }
                return mediaString;
              };
  return { projectMediaStringToPortableValue };
}
