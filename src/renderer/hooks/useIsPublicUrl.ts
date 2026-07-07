// @ts-nocheck
/**
 * isPublicUrl。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function useIsPublicUrl(deps: any) {
  const {} = deps;
  const isPublicUrl = (url) => {
                  try {
                    let parsedUrl = new URL(url),
                      hostname = parsedUrl.hostname.toLowerCase();
                    if (parsedUrl.protocol !== `http:` && parsedUrl.protocol !== `https:`) return false;
                    if (hostname === `localhost` || hostname.endsWith(`.localhost`)) return false;
                    if (hostname === `::1` || hostname === `[::1]`) return false;
                    let ipv4Match = hostname.match(/^\d+\.\d+\.\d+\.\d+$/);
                    if (ipv4Match) {
                      let [firstOctet, secondOctet] = hostname.split(`.`).map(Number);
                      return !(
                        firstOctet === 10 ||
                        (firstOctet === 127 && secondOctet >= 0) ||
                        (firstOctet === 192 && secondOctet === 168) ||
                        (firstOctet === 169 && secondOctet === 254) ||
                        (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31)
                      );
                    }
                    return true;
                  } catch {
                    return false;
                  }
                };
  return { isPublicUrl };
}
