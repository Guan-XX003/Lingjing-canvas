/**
 * 画布自定义连线（edge）：贝塞尔路径 + 可点击删除按钮。（原 bundle 局部名 et）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { BaseEdge, NodeToolbar, Position, useReactFlow, useStore, getBezierPath } from "@xyflow/react";

const LITE_NODE_WIDTH = 224;
const LITE_NODE_HEIGHT = 132;
const sameAnchorState = (left: any, right: any) =>
  left.mode === right.mode && left.x === right.x && left.y === right.y;

const useLiteNodeAnchor = (nodeId: string) => useStore((state: any) => {
  const node = state.nodeLookup.get(nodeId);
  const data = node?.data || node?.internals?.userNode?.data || {};
  return {
    mode: data.wanjuanRenderMode === `lite` && !node?.selected && !data.loading ? `lite` : `full`,
    x: Number(node?.internals?.positionAbsolute?.x || 0),
    y: Number(node?.internals?.positionAbsolute?.y || 0),
  };
}, sameAnchorState);

export function WanJuanFlowEdge({
  id: id,
  source: source,
  target: target,
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
    zoom = useStore((state: any) => state.transform[2]),
    sourceAnchor = useLiteNodeAnchor(source),
    targetAnchor = useLiteNodeAnchor(target),
    resolvedSourceX = sourceAnchor.mode === `lite` ? sourceAnchor.x + LITE_NODE_WIDTH : sourceX,
    resolvedSourceY = sourceAnchor.mode === `lite` ? sourceAnchor.y + LITE_NODE_HEIGHT / 2 : sourceY,
    resolvedTargetX = targetAnchor.mode === `lite` ? targetAnchor.x : targetX,
    resolvedTargetY = targetAnchor.mode === `lite` ? targetAnchor.y + LITE_NODE_HEIGHT / 2 : targetY,
    resolvedSourcePosition = sourceAnchor.mode === `lite` ? Position.Right : sourcePosition,
    resolvedTargetPosition = targetAnchor.mode === `lite` ? Position.Left : targetPosition,
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX: resolvedSourceX,
      sourceY: resolvedSourceY,
      sourcePosition: resolvedSourcePosition,
      targetX: resolvedTargetX,
      targetY: resolvedTargetY,
      targetPosition: resolvedTargetPosition,
    });
  if (zoom < 0.48 && !selected) {
    return jsx(BaseEdge, {
      path: edgePath,
      markerEnd,
      interactionWidth: 12,
      className: `wanjuan-flow-edge-lite`,
      style: {
        ...style,
        stroke: `var(--wj-edge-main, #64748b)`,
        strokeWidth: zoom < 0.2 ? 0.8 : 1.15,
        opacity: zoom < 0.14 ? 0.38 : 0.62,
      },
    });
  }
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
