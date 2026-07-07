// @ts-nocheck
/**
 * openAccountSite。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_openAccountSite(deps: any) {
  const {
    isPluginEnv,
    restoreCookies,
    setSelectedUser,
  } = deps;
  const openAccountSite = async (account) => {
          if ((await restoreCookies(account), isPluginEnv && account.siteUrl)) {
            let [activeTab] = await chrome.tabs.query({
              active: true,
              currentWindow: true
            });
            activeTab && chrome.tabs.update(activeTab.id, {
              url: account.siteUrl
            });
          }
          setSelectedUser(account);
        };
  return { openAccountSite };
}
