/**
 * 内联 SVG 图标组件：通义万相 Logo、替换图片、天玑人像审核中。
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { jsx, jsxs } from "react/jsx-runtime";

export const TongyiWanxiangLogo = ({
    size: size = 16,
    className: className = ``
  } = {}) =>
  jsxs(`svg`, {
    width: size,
    height: size,
    viewBox: `0 0 32 32`,
    fill: `none`,
    className: className,
    "aria-hidden": `true`,
    children: [
      jsx(`path`, {
        d: `M16 3.8 21.6 7 28 7.1 24.8 12.7 28 18.3 21.6 18.4 16 28.2 10.4 18.4 4 18.3 7.2 12.7 4 7.1 10.4 7 16 3.8Z`,
        stroke: `currentColor`,
        strokeWidth: `3`,
        strokeLinejoin: `round`,
      }),
      jsx(`path`, {
        d: `M10.6 16 16 10.6 21.4 16 16 21.4 10.6 16Z`,
        stroke: `currentColor`,
        strokeWidth: `2.4`,
        strokeLinejoin: `round`,
      }),
    ],
  });

export const WanJuanReplaceImageIcon = ({
    size: size = 14
  } = {}) =>
  jsxs(`svg`, {
    width: size,
    height: size,
    viewBox: `0 0 24 24`,
    fill: `none`,
    stroke: `currentColor`,
    strokeWidth: `2`,
    strokeLinecap: `round`,
    strokeLinejoin: `round`,
    "aria-hidden": `true`,
    children: [
      jsx(`path`, {
        d: `M4 6.5A2.5 2.5 0 0 1 6.5 4H14l4 4v2`
      }),
      jsx(`path`, {
        d: `M14 4v4h4`
      }),
      jsx(`path`, {
        d: `M5 18l3.2-3.2a1.4 1.4 0 0 1 2 0L12 16.6l1-1a1.4 1.4 0 0 1 2 0L17 17.6`
      }),
      jsx(`path`, {
        d: `M6 20h8`
      }),
      jsx(`path`, {
        d: `M18 14a3 3 0 0 1 0 6h-1`
      }),
      jsx(`path`, {
        d: `M18 14v2.5h2.5`
      }),
    ],
  });

export const WanJuanTianjiPortraitReviewIcon = ({
    size: size = 14
  } = {}) =>
  jsxs(`svg`, {
    width: size,
    height: size,
    viewBox: `0 0 24 24`,
    fill: `none`,
    stroke: `currentColor`,
    strokeWidth: `2`,
    strokeLinecap: `round`,
    strokeLinejoin: `round`,
    "aria-hidden": `true`,
    children: [
      jsx(`path`, {
        d: `M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z`
      }),
      jsx(`path`, {
        d: `M3 21a6 6 0 0 1 10.2-4.3`
      }),
      jsx(`path`, {
        d: `M17.5 21 14 17.7l1.4-1.4 2.1 2 4.1-4.3 1.4 1.4-5.5 5.6Z`
      }),
    ],
  });
