// @ts-nocheck
/**
 * isNonVideoUrl。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function useIsNonVideoUrl(deps: any) {
  const {} = deps;
  const isNonVideoUrl = (url) => {
                  try {
                    let parsedUrl = new URL(url),
                      pathname = decodeURIComponent(parsedUrl.pathname || ``).toLowerCase(),
                      queryString = decodeURIComponent(parsedUrl.search || ``).toLowerCase(),
                      pathAndQuery = `${pathname}${queryString}`;
                    return (
                      /\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|[?#])/i.test(pathAndQuery) ||
                      /(?:^|[?&])(?:mime|content[-_]?type|response-content-type)=video(?:\/|%2f)/i.test(
                        queryString,
                      ) ||
                      /(?:^|[?&])filename=[^&]+\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|&)/i.test(
                        queryString,
                      )
                    );
                  } catch {
                    return false;
                  }
                };
  return { isNonVideoUrl };
}
