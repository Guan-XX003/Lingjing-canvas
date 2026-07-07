// @ts-nocheck
/**
 * refreshSystemNotifications。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { WanJuanFetchAppNotifications, WanJuanFilterAppNotifications, WanJuanLoadCachedAppNotifications, WanJuanSaveCachedAppNotifications } from "../lib/app-notifications";

export function use_refreshSystemNotifications(deps: any) {
  const {
    setSettingsNotificationChecking,
    setSystemNotificationError,
    setSystemNotifications,
    showToast2,
    systemNotificationFetchRef,
  } = deps;
  const refreshSystemNotifications = async (options = {}) => {
      if (systemNotificationFetchRef.current) return systemNotificationFetchRef.current;
      let run = (async () => {
        options.silent || setSettingsNotificationChecking(true);
        try {
          let fetchedNotifications = await WanJuanFetchAppNotifications(),
            filteredNotifications = WanJuanFilterAppNotifications(fetchedNotifications);
          (WanJuanSaveCachedAppNotifications(fetchedNotifications),
            setSystemNotifications(filteredNotifications),
            setSystemNotificationError(``));
          return filteredNotifications;
        } catch (error) {
          let cachedNotifications = WanJuanLoadCachedAppNotifications();
          (cachedNotifications.length && setSystemNotifications(cachedNotifications),
            setSystemNotificationError(error?.message || String(error || `通知接口请求失败`)));
          options.silent || showToast2(cachedNotifications.length ? `通知接口暂不可用，已使用本地缓存` : `通知获取失败：${error?.message || error}`);
          return cachedNotifications;
        } finally {
          systemNotificationFetchRef.current = null;
          options.silent || setSettingsNotificationChecking(false);
        }
      })();
      return (systemNotificationFetchRef.current = run);
    };
  return { refreshSystemNotifications };
}
