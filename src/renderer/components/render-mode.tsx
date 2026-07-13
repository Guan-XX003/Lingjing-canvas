/**
 * 画布节点渲染分层（render mode）域。
 *
 * - WanJuanRenderRuntime：节点更新频率计数与渲染模式统计（挂 globalThis.__wanjuanRenderRuntime）。
 * - WanJuanRenderShellNode：低负载"壳"节点（仅显示类型/状态），供视口外或低档位节点降级渲染。
 * - WanJuanComputeNodeRenderMode / NodeNeedsFullRender / EstimateNodeSize：按视口与节点状态决定 full/shell。
 * - WanJuanUseThrottledNodeDataUpdate：节点 data 更新节流 hook（关键补丁立即刷）。
 * - 模块加载时把 wanjuanPerformanceProfile 映射为 <html> 的 wj-perf-* 类（独立于 React）。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";
import { CirclePlay, Image as ImageIcon, Music2 } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
import { WANJUAN_RUNTIME_NODE_DATA_KEYS, wanjuanStripRuntimeNodeData } from "../lib/node-runtime-contract";

/**
 * 节点连接柄：包装 @xyflow/react 的 Handle，提供大/小两种样式、
 * 左右侧圆角方向与 hover 放大高亮的统一外观。（原 bundle 局部名 Y）
 */
export const WanJuanNodeHandle = reactMemo(
    ({
      className: className = ``,
      variant: variant = `large`,
      title: title,
      ...props
    }: any) => {
      let isLeft = props.position === `left`,
        variantClass =
        variant === `large` ?
        `!relative !top-0 !left-0 !right-0 !bottom-0 !transform-none !bg-[#555] !w-2 !h-4 !border-[1px] !border-[#222] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.35)]` :
        `!relative !top-0 !left-0 !right-0 !bottom-0 !transform-none !bg-[#555] !w-1.5 !h-3 !border-[1px] !border-[#222] transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.3)]`,
        sideClass = isLeft ?
        `!rounded-r-none !rounded-l-full translate-x-[1px]` :
        `!rounded-l-none !rounded-r-full -translate-x-[1px]`,
        hoverClass =
        variant === `large` ?
        `group-hover:!w-3 group-hover:!h-3 group-hover:!rounded-full group-hover:!translate-x-0 group-hover:!bg-blue-500 group-hover:!border-white group-hover:!scale-[1.5] group-hover:!shadow-[0_0_15px_rgba(59,130,246,1)]` :
        `group-hover:!w-2.5 group-hover:!h-2.5 group-hover:!rounded-full group-hover:!translate-x-0 group-hover:!bg-blue-500 group-hover:!border-white group-hover:!scale-[1.5] group-hover:!shadow-[0_0_10px_rgba(59,130,246,1)]`;
      return jsx(`div`, {
        className: `absolute flex items-center ${isLeft ? `-left-[40px] w-[50px] pr-[10px] justify-end` : `-right-[40px] w-[50px] pl-[10px] justify-start`} h-[50px] -translate-y-1/2 z-[90] cursor-crosshair group`,
        style: {
          top: props.style?.top || `50%`
        },
        title: title,
        children: jsx(Handle, {
          ...props,
          className: `${variantClass} ${sideClass} ${hoverClass} ${className}`,
          style: void 0,
        }),
      });
    },
  );

export const WanJuanRenderRuntime = (() => {
    let counters: any = {
        nodeUpdates: [],
        renderModeAt: Date.now()
      },
      mark = (key) => {
        let now = Date.now();
        counters[key] || (counters[key] = []);
        counters[key].push(now);
        counters[key] = counters[key].filter((time) => now - time <= 5000);
      },
      debugEnabled = () => {
        try {
          return localStorage.getItem(`wanjuan.renderDebug`) === `1` || document.documentElement.dataset.wanjuanDebug === `1`;
        } catch {
          return !1;
        }
      };
    try {
      globalThis.__wanjuanRenderRuntime = {
        counters: counters,
        mark: mark,
        snapshot: () => {
          let now = Date.now();
          counters.nodeUpdates = (counters.nodeUpdates || []).filter((time) => now - time <= 5000);
          counters.setNodes = (counters.setNodes || []).filter((time) => now - time <= 5000);
          return {
            nodeUpdates5s: counters.nodeUpdates.length,
            setNodes5s: counters.setNodes.length,
            renderModeAt: counters.renderModeAt
          };
        }
      };
    } catch {}
    return {
      mark: mark,
      debugEnabled: debugEnabled,
      snapshot: () => globalThis.__wanjuanRenderRuntime?.snapshot?.() || {}
    };
  })();

export const WanJuanRuntimeNodeDataKeys = WANJUAN_RUNTIME_NODE_DATA_KEYS;
export const WanJuanStripRuntimeNodeData = wanjuanStripRuntimeNodeData;

export const WanJuanNodeTypeLabel = (type, data: any = {}) => {
    if (type === `promptNode`) return `图像生成`;
    if (type === `videoNode`) return `视频生成`;
    if (type === `seedanceNode`) return `即梦视频`;
    if (type === `tongyiWanxiangNode`) return `通义万相`;
    if (type === `audioNode`) return `音频`;
    if (type === `ttsMusicNode` || type === `musicNode`) return data.mode === `tts` ? `语音` : `音乐`;
    if (type === `videoExtractNode`) return `视频抽帧`;
    if (type === `videoFaceBlurNode`) return `人脸打码`;
    if (type === `realEsrganVideoNode`) return `视频超分`;
    if (type === `qwenTtsCloneNode`) return `声音克隆`;
    if (type === `textNode`) return `文本`;
    if (type === `imageNode`) {
      if (data.mediaKind === `video`) return `视频素材`;
      if (data.mediaKind === `audio`) return `音频素材`;
      if (data.mediaKind === `text`) return `文本素材`;
      return `图片素材`;
    }
    return data.label || `节点`;
  };

export const WanJuanNodeStatusLabel = (data: any = {}) =>
    data.loading ? (data.loadingText || `生成中`) :
    data.errorMessage || data.errorMsg ? `失败` :
    data.videoUrl || data.audioUrl || data.imageUrl || data.resultData ? `已生成` :
    `就绪`;

export const WanJuanNodeStatusColor = (data: any = {}) =>
    data.loading ? `#38bdf8` : data.errorMessage || data.errorMsg ? `#ef4444` : data.videoUrl || data.audioUrl || data.imageUrl || data.resultData ? `#22c55e` : `#64748b`;

export const WanJuanRenderShellNode = reactMemo(({
    id: nodeId,
    type: nodeType,
    data: data = {},
    selected: selected
  }: any) => {
    let label = data.label || data.audioName || data.videoName || data.title || WanJuanNodeTypeLabel(nodeType, data),
      status = WanJuanNodeStatusLabel(data),
      color = WanJuanNodeStatusColor(data);
    if (!selected && Number(data.wanjuanRenderZoom || 1) <= 0.18) {
      return jsxs(`div`, {
        className: `wanjuan-render-mini-shell`,
        "data-wanjuan-render-mode": `shell`,
        title: `${label}\n${status}`,
        style: { "--wanjuan-shell-color": color },
        children: [
          jsx(`span`, { className: `wanjuan-render-mini-shell-dot` }),
          jsx(`strong`, { children: label }),
        ],
      });
    }
    return jsxs(`div`, {
      className: `wanjuan-render-shell-node group/node ${selected ? `is-selected` : ``}`,
      "data-wanjuan-render-mode": `shell`,
      title: `${label}\n${status}\n点击节点可恢复完整视图`,
      children: [
        jsx(WanJuanNodeHandle, {
          type: `target`,
          position: Position.Left,
          variant: `small`
        }),
        jsxs(`div`, {
          className: `wanjuan-render-shell-frame`,
          style: {
            borderColor: selected ? `#3b82f6` : color,
            "--wanjuan-shell-color": color
          },
          children: [
            jsx(`span`, {
              className: `wanjuan-render-shell-dot`,
              style: {
                background: color
              }
            }),
            jsxs(`div`, {
              className: `wanjuan-render-shell-copy`,
              children: [
                jsx(`strong`, {
                  children: label
                }),
                jsx(`span`, {
                  children: status
                }),
              ],
            }),
          ],
        }),
        jsx(WanJuanNodeHandle, {
          type: `source`,
          position: Position.Right,
          variant: `small`
        }),
      ],
    });
  });

export const WanJuanRenderLiteNode = reactMemo(({
    type: nodeType,
    data: data = {},
    selected: selected
  }: any) => {
    let label = data.label || data.audioName || data.videoName || data.title || WanJuanNodeTypeLabel(nodeType, data),
      status = WanJuanNodeStatusLabel(data),
      color = WanJuanNodeStatusColor(data),
      hasVideo = !!data.videoUrl || data.mediaKind === `video`,
      hasAudio = !!data.audioUrl || data.mediaKind === `audio`,
      previewUrl = data.thumbnailUrl || (!hasVideo && !hasAudio ? data.imageUrl || (data.mediaKind === `image` ? data.url : ``) : ``),
      [previewFailed, setPreviewFailed] = useState(!1),
      hasPreview = !!previewUrl && !previewFailed;
    useEffect(() => setPreviewFailed(!1), [previewUrl]);
    return jsxs(`div`, {
      className: `wanjuan-render-lite-node group/node ${selected ? `is-selected` : ``}`,
      title: `${label}\n${status}\n悬停或点击恢复完整操作`,
      children: [
        jsx(WanJuanNodeHandle, { type: `target`, position: Position.Left, variant: `small` }),
        jsxs(`div`, {
          className: `wanjuan-render-lite-frame`,
          style: { borderColor: selected ? `#3b82f6` : color, "--wanjuan-lite-color": color },
          children: [
            jsxs(`div`, {
              className: `wanjuan-render-lite-media ${hasVideo ? `is-video` : hasAudio ? `is-audio` : `is-image`}`,
              children: [
                hasPreview ?
                  jsx(`img`, {
                    src: previewUrl,
                    alt: ``,
                    loading: `lazy`,
                    decoding: `async`,
                    draggable: !1,
                    onError: () => setPreviewFailed(!0),
                    className: `wanjuan-render-lite-preview`,
                  }) :
                  jsxs(`div`, {
                    className: `wanjuan-render-lite-placeholder`,
                    children: [
                      hasVideo ? jsx(CirclePlay, { size: 24 }) : hasAudio ? jsx(Music2, { size: 22 }) : jsx(ImageIcon, { size: 22 }),
                      jsx(`span`, { children: hasVideo ? `视频结果` : hasAudio ? `音频结果` : `图片结果` }),
                    ],
                  }),
                hasVideo && hasPreview && jsx(`span`, {
                  className: `wanjuan-render-lite-play-badge`,
                  children: jsx(CirclePlay, { size: 22 }),
                }),
              ],
            }),
            jsxs(`div`, {
              className: `wanjuan-render-lite-copy`,
              children: [
                jsx(`strong`, { children: label }),
                jsx(`span`, { children: status }),
              ],
            }),
          ],
        }),
        jsx(WanJuanNodeHandle, { type: `source`, position: Position.Right, variant: `small` }),
      ],
    });
  });

export const WanJuanWithRenderMode = (Component: any, nodeType: any) =>
    reactMemo((props: any) => {
      let renderMode = props.data?.wanjuanRenderMode || `full`,
        [hovered, setHovered] = useState(!1),
        leaveTimerRef = useRef(0),
        renderZoom = Number(props.data?.wanjuanRenderZoom || 1),
        forceFull = props.selected || props.data?.loading || (hovered && renderZoom > 0.52),
        effectiveRenderMode = renderMode === `shell` && !props.selected && !props.data?.loading ? `shell` :
          renderMode === `lite` && !forceFull ? `lite` : `full`,
        updateNodeInternals = useUpdateNodeInternals();
      useLayoutEffect(() => {
        let firstFrame = window.requestAnimationFrame(() => {
          updateNodeInternals(props.id);
          window.requestAnimationFrame(() => updateNodeInternals(props.id));
        });
        return () => window.cancelAnimationFrame(firstFrame);
      }, [effectiveRenderMode, props.id, updateNodeInternals]);
      useEffect(() => () => {
        if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
      }, []);
      if (effectiveRenderMode === `shell`)
        return jsx(WanJuanRenderShellNode, {
          ...props,
          type: nodeType
        });
      if (effectiveRenderMode === `lite`)
        return jsx(`div`, {
          className: `wanjuan-render-mode-lite`,
          "data-wanjuan-render-mode": `lite`,
          onPointerEnter: () => {
            if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
            setHovered(!0);
          },
          onPointerLeave: () => {
            if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = window.setTimeout(() => setHovered(!1), 300);
          },
          children: jsx(WanJuanRenderLiteNode, { ...props, type: nodeType }),
        });
      return jsx(`div`, {
        className: `wanjuan-render-mode-${effectiveRenderMode}`,
        "data-wanjuan-render-mode": effectiveRenderMode,
        onPointerEnter: () => {
          if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
          setHovered(!0);
        },
        onPointerLeave: () => {
          if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
          leaveTimerRef.current = window.setTimeout(() => setHovered(!1), 300);
        },
        children: jsx(Component, props)
      });
    });

export const WanJuanHeavyRenderNodeTypes = new Set([
    `imageNode`,
    `promptNode`,
    `textNode`,
    `videoNode`,
    `seedanceNode`,
    `tongyiWanxiangNode`,
    `audioNode`,
    `musicNode`,
    `ttsMusicNode`,
    `videoExtractNode`,
    `videoFaceBlurNode`,
    `qwenTtsCloneNode`,
    `realEsrganVideoNode`,
  ]);

export const WanJuanEstimateNodeSize = (node) => ({
    width: Number(node?.style?.width || node?.width || node?.measured?.width || 280),
    height: Number(node?.style?.height || node?.height || node?.measured?.height || 220)
  });

export const WanJuanNodeNeedsFullRender = (node, zoom = 1) => {
    let data = node?.data || {};
    if (
      node?.selected ||
      node?.dragging ||
      data.loading
    ) return !0;
    if (zoom <= 0.52) return !1;
    return !!(
      data.expanded ||
      data.configMode ||
      data.wanjuanForceFullRender
    );
  };

export const WanJuanComputeNodeRenderMode = (node, viewport = {
    x: 0,
    y: 0,
    zoom: 1
  }, viewportSize = {
    width: 1600,
    height: 900
  }) => {
    if (!WanJuanHeavyRenderNodeTypes.has(node?.type)) return `full`;
    let zoom = Number(viewport?.zoom || 1);
    if (WanJuanNodeNeedsFullRender(node, zoom)) return `full`;
    let {
        width,
        height
      } = WanJuanEstimateNodeSize(node),
      centerX = (Number(node?.position?.x || 0) + width / 2) * zoom + Number(viewport?.x || 0),
      centerY = (Number(node?.position?.y || 0) + height / 2) * zoom + Number(viewport?.y || 0),
      screenCenterX = Number(viewportSize?.width || 1600) / 2,
      screenCenterY = Number(viewportSize?.height || 900) / 2,
      distance = Math.hypot(centerX - screenCenterX, centerY - screenCenterY),
      centerRadius = Math.max(screenCenterX, screenCenterY) * (zoom < 0.32 ? 0.82 : 1.05);
    if (zoom <= 0.18) return `shell`;
    if (zoom <= 0.36 && distance > centerRadius * 0.72) return `shell`;
    if (zoom <= 0.52 && distance > centerRadius) return `shell`;
    return `lite`;
  };

export const WanJuanIsCriticalNodePatch = (patch: any = {}) =>
    patch.loading === !1 ||
    patch.errorMessage !== void 0 ||
    patch.errorMsg !== void 0 ||
    patch.videoUrl !== void 0 ||
    patch.audioUrl !== void 0 ||
    patch.imageUrl !== void 0 ||
    patch.resultData !== void 0 && patch.loading === !1 ||
    patch.progress === 100 ||
    patch.realEsrganProgress === 100;

export const WanJuanUseThrottledNodeDataUpdate = (nodeId, updateNodeData, delay = 420) => {
    let pendingRef = useRef(null),
      timerRef = useRef(0),
      flush = useCallback(() => {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
          timerRef.current = 0;
        }
        if (!pendingRef.current) return;
        let patch = pendingRef.current;
        pendingRef.current = null;
        WanJuanRenderRuntime.mark(`nodeUpdates`);
        updateNodeData(nodeId, patch);
      }, [nodeId, updateNodeData]);
    useEffect(() => () => flush(), [flush]);
    return useCallback((patch: any, options: any = {}) => {
      if (!patch || typeof patch != `object`) return;
      if (options.immediate || WanJuanIsCriticalNodePatch(patch)) {
        pendingRef.current = {
          ...(pendingRef.current || {}),
          ...patch
        };
        flush();
        return;
      }
      pendingRef.current = {
        ...(pendingRef.current || {}),
        ...patch
      };
      if (timerRef.current) return;
      timerRef.current = window.setTimeout(flush, delay);
    }, [delay, flush]);
  };

// —— 性能档位接入画布：把 wanjuanPerformanceProfile 映射为 <html> 上的 wj-perf-* 类，
// 供 ui-overrides.css 在低档位时降低画布渲染负载（关动画/降阴影等）。独立于 React 状态。
(function syncCanvasPerfMode() {
  if (typeof window === `undefined` || typeof document === `undefined`) return;
  let lastProfile = null;
  const apply = () => {
    let profile = ``;
    try { profile = document.documentElement.dataset.wanjuanSessionPerformanceProfile || window.localStorage?.getItem(`wanjuanPerformanceProfile`) || `balanced`; } catch { profile = `balanced`; }
    if (profile === lastProfile) return;
    lastProfile = profile;
    const root = document.documentElement;
    root.classList.remove(`wj-perf-performance`, `wj-perf-balanced`, `wj-perf-quality`, `wj-perf-custom`);
    root.classList.add(`wj-perf-${profile}`);
  };
  apply();
  try { window.setInterval(apply, 1500); } catch {}
})();
