/** 系统通知弹窗。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanSystemNotificationDialog({
  dismissSystemNotificationDialog,
  notificationLevelLabel,
  openSystemNotificationLink,
  systemNotificationDialog,
}: any) {
  return jsx(`div`, {
          className: `wanjuan-system-notification-overlay`,
          onClick: (event) => {
            event.target === event.currentTarget && dismissSystemNotificationDialog(systemNotificationDialog);
          },
          children: jsxs(`div`, {
            className: `wanjuan-system-notification-dialog wanjuan-system-notification-${systemNotificationDialog.level}`,
            children: [
              jsxs(`div`, {
                className: `wanjuan-system-notification-panel-header`,
                children: [
                  jsxs(`div`, {
                    className: `min-w-0`,
                    children: [
                      jsx(`span`, {
                        className: `wanjuan-system-notification-pill`,
                        children: notificationLevelLabel(systemNotificationDialog.level),
                      }),
                      jsx(`div`, {
                        className: `wanjuan-system-notification-panel-title mt-2`,
                        children: systemNotificationDialog.title,
                      }),
                    ],
                  }),
                  jsx(`button`, {
                    type: `button`,
                    className: `wanjuan-system-notification-close-button`,
                    onClick: () => dismissSystemNotificationDialog(systemNotificationDialog),
                    title: `关闭`,
                    children: `×`,
                  }),
                ],
              }),
              systemNotificationDialog.content &&
              jsx(`div`, {
                className: `wanjuan-system-notification-dialog-content`,
                children: systemNotificationDialog.content,
              }),
              jsxs(`div`, {
                className: `wanjuan-system-notification-dialog-actions`,
                children: [
                  jsx(`button`, {
                    type: `button`,
                    className: `wanjuan-system-notification-soft-button`,
                    onClick: () => dismissSystemNotificationDialog(systemNotificationDialog),
                    children: `知道了`,
                  }),
                  systemNotificationDialog.link_url &&
                  jsx(`button`, {
                    type: `button`,
                    className: `wanjuan-system-notification-primary-button`,
                    onClick: () => {
                      (openSystemNotificationLink(systemNotificationDialog),
                        dismissSystemNotificationDialog(systemNotificationDialog));
                    },
                    children: `查看详情`,
                  }),
                ],
              }),
            ],
          }),
        });
}
