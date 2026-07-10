import { memo, useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const nodeHasMedia = (node: any) => {
  const data = node?.data || {};
  return !!(
    data.imageUrl ||
    data.videoUrl ||
    data.audioUrl ||
    data.thumbnailUrl ||
    data.resultData ||
    data.sunoClips?.length ||
    data.allExtractedImages?.length
  );
};

export const WanJuanCanvasPressureMeter = memo(({ nodes = [], edges = [] }: any) => {
  const structural = useMemo(() => {
    let media = 0;
    let loading = 0;
    let full = 0;
    let lite = 0;
    let shell = 0;
    for (const node of nodes) {
      if (nodeHasMedia(node)) media += 1;
      if (node?.data?.loading) loading += 1;
      const mode = node?.data?.wanjuanRenderMode || "full";
      if (mode === "shell") shell += 1;
      else if (mode === "lite") lite += 1;
      else full += 1;
    }
    return { media, loading, full, lite, shell };
  }, [nodes]);
  const [runtime, setRuntime] = useState(() => ({ fps: 60, longTaskMs: 0, eventLoopLagMs: 0 }));

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let burstTimer = 0;
    let lastFrame = 0;
    let lastLagTick = performance.now();
    let fps = 60;
    let longTaskMs = 0;
    let eventLoopLagMs = 0;
    const frameDeltas: number[] = [];
    const sampleBurst = () => {
      if (cancelled) return;
      let samples = 0;
      const sampleFrame = (now: number) => {
        if (cancelled) return;
        if (!document.hidden && lastFrame > 0) {
          const delta = now - lastFrame;
          if (delta > 0 && delta < 1000) {
            frameDeltas.push(delta);
            if (frameDeltas.length > 60) frameDeltas.shift();
            fps = clamp(1000 / (frameDeltas.reduce((sum, item) => sum + item, 0) / frameDeltas.length), 1, 60);
          }
        }
        lastFrame = now;
        samples += 1;
        if (samples < 18 && !document.hidden) raf = requestAnimationFrame(sampleFrame);
        else burstTimer = window.setTimeout(sampleBurst, document.hidden ? 2400 : 1600);
      };
      raf = requestAnimationFrame(sampleFrame);
    };
    sampleBurst();
    const lagTimer = window.setInterval(() => {
      const now = performance.now();
      const lag = Math.max(0, now - lastLagTick - 750);
      lastLagTick = now;
      eventLoopLagMs = Math.max(lag, eventLoopLagMs * 0.72);
    }, 750);
    const publishTimer = window.setInterval(() => {
      longTaskMs *= 0.62;
      const next = { fps, longTaskMs, eventLoopLagMs };
      (globalThis as any).__wanjuanCanvasRuntimeMetrics = next;
      if (!document.hidden) setRuntime(next);
    }, 1500);
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) longTaskMs = Math.min(1500, longTaskMs + Math.max(0, entry.duration || 0));
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {}
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (burstTimer) window.clearTimeout(burstTimer);
      window.clearInterval(lagTimer);
      window.clearInterval(publishTimer);
      observer?.disconnect();
    };
  }, []);

  const structuralPressure = clamp(
    nodes.length * 0.38 +
      edges.length * 0.16 +
      structural.media * 1.15 +
      structural.full * 0.55 +
      structural.loading * 2.2,
  );
  const runtimePressure = clamp(
    Math.max(0, 55 - runtime.fps) * 1.4 + runtime.longTaskMs / 18 + runtime.eventLoopLagMs * 1.25,
  );
  const pressure = clamp(Math.round(structuralPressure * 0.62 + runtimePressure * 0.38));
  const level = pressure >= 82 ? "overload" : pressure >= 62 ? "high" : pressure >= 36 ? "medium" : "low";
  const label = level === "overload" ? "过载" : level === "high" ? "高" : level === "medium" ? "中" : "低";

  return jsxs("div", {
    className: "wanjuan-canvas-pressure-meter wanjuan-canvas-pressure-meter-native",
    "data-pressure-level": level,
    style: { "--wanjuan-pressure": `${pressure}%` } as any,
    title: `当前画布渲染压力：${label}（${pressure}%）\nFPS ${Math.round(runtime.fps)}\n节点 ${nodes.length}，连线 ${edges.length}，完整 ${structural.full}，轻量 ${structural.lite}，外壳 ${structural.shell}`,
    children: [
      jsxs("div", {
        className: "wanjuan-canvas-pressure-copy",
        children: [
          jsx("span", { className: "wanjuan-canvas-pressure-title", children: "画布压力" }),
          jsx("span", {
            className: "wanjuan-canvas-pressure-meta",
            children: `${nodes.length} 节点 · ${Math.round(runtime.fps)} FPS`,
          }),
        ],
      }),
      jsx("div", {
        className: "wanjuan-canvas-pressure-track",
        "aria-hidden": true,
        children: jsx("span", { className: "wanjuan-canvas-pressure-fill" }),
      }),
      jsxs("div", {
        className: "wanjuan-canvas-pressure-readout",
        children: [jsx("span", { children: label }), jsx("strong", { children: `${pressure}%` })],
      }),
    ],
  });
});
