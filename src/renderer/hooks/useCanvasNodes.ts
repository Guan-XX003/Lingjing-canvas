/**
 * wanjuanCanvasNodes。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { WjNode } from "../lib/app-types";

interface UseCanvasNodesDeps {
  WanJuanComputeNodeRenderMode: any;
  nodes: WjNode[];
  useMemo: any;
  wanjuanSelectedReferenceSourcesByTarget: any;
  wanjuanViewport: any;
  wanjuanViewportSize: any;
}

export function useCanvasNodes(deps: UseCanvasNodesDeps) {
  const {
    WanJuanComputeNodeRenderMode,
    nodes,
    useMemo,
    wanjuanSelectedReferenceSourcesByTarget,
    wanjuanViewport,
    wanjuanViewportSize,
  } = deps;
  const wanjuanCanvasNodes = useMemo(
		      () => {
		      const profile = (() => {
		        try { return document.documentElement.dataset.wanjuanSessionPerformanceProfile || localStorage.getItem(`wanjuanPerformanceProfile`) || `balanced`; } catch { return `balanced`; }
		      })();
		      const fullBudget = profile === `performance` ? 8 : profile === `quality` ? 32 : 16;
		      const zoom = Number(wanjuanViewport?.zoom || 1);
		      const candidates: any[] = [];
		      const baseModes = new Map();
		      nodes.forEach((node) => {
		        const mode = WanJuanComputeNodeRenderMode(node, wanjuanViewport, wanjuanViewportSize);
		        baseModes.set(node.id, mode);
		        if (mode !== `lite` || zoom < 0.56) return;
		        const width = Number(node?.style?.width || node?.width || node?.measured?.width || 280);
		        const height = Number(node?.style?.height || node?.height || node?.measured?.height || 220);
		        const projectedWidth = width * zoom;
		        const projectedHeight = height * zoom;
		        if (Math.min(projectedWidth, projectedHeight) < 96) return;
		        const screenX = (Number(node?.position?.x || 0) + width / 2) * zoom + Number(wanjuanViewport?.x || 0);
		        const screenY = (Number(node?.position?.y || 0) + height / 2) * zoom + Number(wanjuanViewport?.y || 0);
		        const viewportWidth = Number(wanjuanViewportSize?.width || 1600);
		        const viewportHeight = Number(wanjuanViewportSize?.height || 900);
		        if (screenX < -width || screenY < -height || screenX > viewportWidth + width || screenY > viewportHeight + height) return;
		        candidates.push({
		          id: node.id,
		          distance: Math.hypot(screenX - viewportWidth / 2, screenY - viewportHeight / 2)
		        });
		      });
		      candidates.sort((a, b) => a.distance - b.distance);
		      const promoted = new Set(candidates.slice(0, fullBudget).map((item) => item.id));
		      return nodes.map((node) => {
	        let referenceSources = wanjuanSelectedReferenceSourcesByTarget.get(node.id),
	          baseMode = baseModes.get(node.id),
	          renderMode = baseMode === `lite` && promoted.has(node.id) ? `full` : baseMode,
	          data = node.data || {},
	          nextReferenceSources = referenceSources && referenceSources.length ? referenceSources : undefined,
	          hasReferenceChange =
	            (nextReferenceSources && data.wanjuanSelectedReferenceSourceIds !== nextReferenceSources) ||
	            (!nextReferenceSources && Array.isArray(data.wanjuanSelectedReferenceSourceIds)),
	          hasRenderModeChange = data.wanjuanRenderMode !== renderMode;
	        let hasRenderZoomChange = renderMode === `shell` && data.wanjuanRenderZoom !== zoom;
	        return hasReferenceChange || hasRenderModeChange || hasRenderZoomChange ?
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
	              wanjuanRenderZoom: renderMode === `shell` ? zoom : void 0,
	              wanjuanRenderRuntime: true
	            },
	          } :
	          node;
		      });
		      },
		      [nodes, wanjuanSelectedReferenceSourcesByTarget, wanjuanViewport, wanjuanViewportSize],
		    );
  return { wanjuanCanvasNodes };
}
