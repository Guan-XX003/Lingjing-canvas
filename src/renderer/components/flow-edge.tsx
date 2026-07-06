/**
 * 画布自定义连线（edge）：贝塞尔路径 + 可点击删除按钮。（原 bundle 局部名 et）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { BaseEdge, NodeToolbar, useReactFlow, getBezierPath } from "@xyflow/react";

export function WanJuanFlowEdge({
  id: id,
  sourceX: sourceX,
  sourceY: sourceY,
  targetX: targetX,
  targetY: targetY,
  sourcePosition: sourcePosition,
  targetPosition: targetPosition,
  style: style = {},
  markerEnd: markerEnd,
  selected: selected,
  animated: animated,
}) {
  let {
    setEdges: setEdges
  } = useReactFlow(),
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX: sourceX,
      sourceY: sourceY,
      sourcePosition: sourcePosition,
      targetX: targetX,
      targetY: targetY,
      targetPosition: targetPosition,
    });
  return jsxs(Fragment, {
    children: [
      jsx(`path`, {
        d: edgePath,
        className: `wanjuan-flow-edge-glow ${animated ? `wanjuan-flow-edge-glow-active` : ``} ${selected ? `wanjuan-flow-edge-selected` : ``}`,
      }),
      animated ?
        jsxs(Fragment, {
          children: [
            jsx(`path`, {
              d: edgePath,
              className: `wanjuan-flow-edge-energy-base`,
            }),
            jsx(`path`, {
              d: edgePath,
              className: `wanjuan-flow-edge-energy-flow`,
            }),
            jsx(`path`, {
              d: edgePath,
              className: `wanjuan-flow-edge-energy-spark`,
            }),
          ],
        }) :
        jsx(`path`, {
          d: edgePath,
          className: `wanjuan-flow-edge-main ${selected ? `wanjuan-flow-edge-selected` : ``}`,
        }),
      jsx(BaseEdge, {
        path: edgePath,
        markerEnd: markerEnd,
        interactionWidth: 20,
        style: {
          ...style,
          stroke: `transparent`,
          strokeWidth: 16,
          strokeDasharray: `none`,
        },
      }),
      jsx(NodeToolbar, {
        children: jsx(`div`, {
          style: {
            position: `absolute`,
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: `all`,
            opacity: selected ? 1 : 0,
            transition: `opacity 0.2s`,
          },
          className: `nodrag nopan group/edge hover:opacity-100`,
          children: jsx(`button`, {
            className: `wanjuan-danger-icon-action bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-full w-5 h-5 flex items-center justify-center shadow-lg border border-red-200 cursor-pointer transition-colors`,
            onClick: (event) => {
              (event.stopPropagation(), setEdges((items) => items.filter((item: any) => item.id !== id)));
            },
            title: `删除连线`,
            children: `×`,
          }),
        }),
      }),
    ],
  });
}
