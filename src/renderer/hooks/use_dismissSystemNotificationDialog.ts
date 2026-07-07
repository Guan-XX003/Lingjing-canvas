// @ts-nocheck
/**
 * dismissSystemNotificationDialog。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { WanJuanSaveDismissedAppNotificationIds } from "../lib/app-notifications";

export function use_dismissSystemNotificationDialog(deps: any) {
  const {
    setSystemNotificationDialog,
    setSystemNotificationDismissedIds,
    systemNotificationDismissedIds,
  } = deps;
  const dismissSystemNotificationDialog = (notification) => {
      if (notification?.id) {
        let nextIds = Array.from(new Set([...systemNotificationDismissedIds, notification.id]));
        (setSystemNotificationDismissedIds(nextIds), WanJuanSaveDismissedAppNotificationIds(nextIds));
      }
      setSystemNotificationDialog(null);
    };
  return { dismissSystemNotificationDialog };
}
