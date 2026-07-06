/**
 * 配置管家帮助气泡：一个 "?"/"!" 触发按钮 + 悬浮说明。
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { jsx, jsxs } from "react/jsx-runtime";

export const WanJuanConfigButlerHelp = ({ tone = `info`, placement = `below-start`, title, children }) =>
  jsxs(`span`, {
    className: `wanjuan-config-butler-help-wrap wanjuan-config-butler-help-${placement}`,
    children: [
      jsx(`button`, {
        type: `button`,
        className: `wanjuan-config-butler-help-trigger wanjuan-config-butler-help-trigger-${tone}`,
        "aria-label": `${title || `配置管家`}说明`,
        children: tone === `warning` ? `!` : `?`,
      }),
      jsxs(`span`, {
        className: `wanjuan-config-butler-help-popover`,
        role: `tooltip`,
        children: [
          title &&
          jsx(`span`, {
            className: `wanjuan-config-butler-help-title`,
            children: title,
          }),
          jsx(`span`, {
            className: `wanjuan-config-butler-help-copy`,
            children: children,
          }),
        ],
      }),
    ],
  });
