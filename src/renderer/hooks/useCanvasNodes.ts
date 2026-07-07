// @ts-nocheck
/**
 * wanjuanCanvasNodes。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";

export function useCanvasNodes(deps: any) {
  const {
    WanJuanComputeNodeRenderMode,
    nodes,
    useMemo,
    wanjuanSelectedReferenceSourcesByTarget,
    wanjuanViewport,
    wanjuanViewportSize,
  } = deps;
  const wanjuanCanvasNodes = useMemo(
		      () =>
		      nodes.map((node) => {
	        let referenceSources = wanjuanSelectedReferenceSourcesByTarget.get(node.id),
	          renderMode = WanJuanComputeNodeRenderMode(node, wanjuanViewport, wanjuanViewportSize),
	          data = node.data || {},
	          nextReferenceSources = referenceSources && referenceSources.length ? referenceSources : undefined,
	          hasReferenceChange =
	            (nextReferenceSources && data.wanjuanSelectedReferenceSourceIds !== nextReferenceSources) ||
	            (!nextReferenceSources && Array.isArray(data.wanjuanSelectedReferenceSourceIds)),
	          hasRenderModeChange = data.wanjuanRenderMode !== renderMode;
	        return hasReferenceChange || hasRenderModeChange ?
	          {
	            ...node,
	            data: {
	              ...data,
	              ...(nextReferenceSources ? {
	                wanjuanSelectedReferenceSourceIds: nextReferenceSources
	              } : {
	                wanjuanSelectedReferenceSourceIds: undefined
	              }),
	              wanjuanRenderMode: renderMode,
	              wanjuanRenderRuntime: true
	            },
	          } :
	          node;
		      }),
		      [nodes, wanjuanSelectedReferenceSourcesByTarget, wanjuanViewport, wanjuanViewportSize],
		    );
  return { wanjuanCanvasNodes };
}
