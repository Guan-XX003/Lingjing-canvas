/**
 * openAccountSite。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
declare const chrome: any;

interface UseOpenAccountSiteDeps {
  isPluginEnv: boolean;
  restoreCookies: any;
  setSelectedUser: SetAny;
}

export function use_openAccountSite(deps: UseOpenAccountSiteDeps) {
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
