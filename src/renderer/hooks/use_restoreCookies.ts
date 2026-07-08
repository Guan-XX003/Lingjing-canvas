/**
 * restoreCookies。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

interface UseRestoreCookiesDeps {
  isPluginEnv: boolean;
}

export function use_restoreCookies(deps: UseRestoreCookiesDeps) {
  const {
    isPluginEnv,
  } = deps;
  const restoreCookies = async (account) => {
        if (isPluginEnv && account.cookies && account.cookies.length > 0) {
          let [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
          });
          if (activeTab?.url && activeTab.url.startsWith(`http`))
            for (let cookie of account.cookies)
              try {
                let cookieUrl =
                  `http` +
                  (cookie.secure ? `s` : ``) +
                  `://` +
                  cookie.domain.replace(/^\./, ``) +
                  cookie.path;
                await chrome.cookies.set({
                  url: cookieUrl,
                  name: cookie.name,
                  value: cookie.value,
                  domain: cookie.domain,
                  path: cookie.path,
                  secure: cookie.secure,
                  httpOnly: cookie.httpOnly,
                  expirationDate: cookie.expirationDate,
                  storeId: cookie.storeId,
                  sameSite: cookie.sameSite,
                });
              } catch (error) {
                console.error(`Failed to restore cookie`, cookie.name, error);
              }
        }
      };
  return { restoreCookies };
}
