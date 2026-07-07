/** 系统通知面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanSystemNotificationPanel({
  getVisibleSystemNotifications,
  markSystemNotificationRead,
  notificationLevelLabel,
  openSystemNotificationLink,
  refreshSystemNotifications,
  setSystemNotificationPanelOpen,
  settingsNotificationChecking,
  systemNotificationError,
}: any) {
  return jsx(`div`, {
          className: `wanjuan-system-notification-overlay`,
          onClick: (event) => {
            event.target === event.currentTarget && setSystemNotificationPanelOpen(false);
          },
          children: jsxs(`div`, {
            className: `wanjuan-system-notification-panel`,
            children: [
              jsxs(`div`, {
                className: `wanjuan-system-notification-panel-header`,
                children: [
                  jsxs(`div`, {
                    children: [
                      jsx(`div`, {
                        className: `wanjuan-system-notification-panel-title`,
                        children: `系统通知/公告`,
                      }),
                      jsx(`div`, {
                        className: `wanjuan-system-notification-panel-subtitle`,
                        children: systemNotificationError ? `接口暂不可用，正在显示本地缓存` : `来自后台管理网站的已发布通知`,
                      }),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `wanjuan-system-notification-panel-actions`,
                    children: [
                      jsx(`button`, {
                        type: `button`,
                        className: `wanjuan-system-notification-soft-button`,
                        disabled: settingsNotificationChecking,
                        onClick: () => refreshSystemNotifications({
                          source: `panel-refresh`,
                          silent: false,
                        }),
                        children: settingsNotificationChecking ? `刷新中` : `刷新`,
                      }),
                      jsx(`button`, {
                        type: `button`,
                        className: `wanjuan-system-notification-close-button`,
                        onClick: () => setSystemNotificationPanelOpen(false),
                        title: `关闭`,
                        children: `×`,
                      }),
                    ],
                  }),
                ],
              }),
              jsx(`div`, {
                className: `wanjuan-system-notification-list`,
                children: getVisibleSystemNotifications().length ?
                  getVisibleSystemNotifications().map((notification) =>
                    jsxs(`div`, {
                      className: `wanjuan-system-notification-list-item wanjuan-system-notification-${notification.level}`,
                      children: [
                        jsx(`span`, {
                          className: `wanjuan-system-notification-pill`,
                          children: notificationLevelLabel(notification.level),
                        }),
                        jsxs(`div`, {
                          className: `min-w-0 flex-1 text-left`,
                          children: [
                            jsx(`div`, {
                              className: `wanjuan-system-notification-title`,
                              children: notification.title,
                            }),
                            notification.content &&
                            jsx(`div`, {
                              className: `wanjuan-system-notification-content`,
                              children: notification.content,
                            }),
                            jsx(`div`, {
                              className: `wanjuan-system-notification-time`,
                              children: notification.date_created ? new Date(notification.date_created).toLocaleString() : `长期有效`,
                            }),
                          ],
                        }),
                        notification.link_url &&
                        jsx(`button`, {
                          type: `button`,
                          className: `wanjuan-system-notification-link-hint`,
                          onClick: () => openSystemNotificationLink(notification),
                          children: `打开`,
                        }),
                        jsx(`button`, {
                          type: `button`,
                          className: `wanjuan-system-notification-read-button`,
                          onClick: () => markSystemNotificationRead(notification),
                          children: `已读不再显示`,
                        }),
                      ],
                    }, notification.id),
                  ) :
                  jsx(`div`, {
                    className: `wanjuan-system-notification-empty`,
                    children: systemNotificationError ? `通知接口请求失败，且暂无可用缓存。` : `暂无系统通知。`,
                  }),
              }),
            ],
          }),
        });
}
