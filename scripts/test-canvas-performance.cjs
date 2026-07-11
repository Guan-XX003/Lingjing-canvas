#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const projectRoot = path.resolve(__dirname, "..");
const electronPath = require("electron");
const port = Number(process.env.WANJUAN_PERF_DEBUG_PORT || 9455);
const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-canvas-perf-"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getJson = (url) => new Promise((resolve, reject) => {
  http.get(url, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => {
      try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
    });
  }).on("error", reject);
});

async function waitForTarget() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
      const target = targets.find((item) => item.type === "page" && /index\.html/.test(item.url || ""));
      if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("Timed out waiting for Electron debug target");
}

async function run() {
  const child = spawn(electronPath, [projectRoot, `--remote-debugging-port=${port}`], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      WANJUAN_TEST_USER_DATA_PATH: userDataPath,
      WANJUAN_ALLOW_RANDOM_PORT: "1",
      WANJUAN_DISABLE_UPDATE_CHECK: "1",
      WANJUAN_DEBUG: "1",
      WANJUAN_PERF_TEST: "1",
    },
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  let ws;
  try {
    const targetUrl = await waitForTarget();
    ws = new WebSocket(targetUrl);
    let id = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const send = (method, params = {}) => new Promise((resolve) => {
      const requestId = ++id;
      pending.set(requestId, resolve);
      ws.send(JSON.stringify({ id: requestId, method, params }));
    });
    const evaluate = async (expression, awaitPromise = false) => {
      const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
      if (response.result?.exceptionDetails) {
        throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text || "Runtime evaluation failed");
      }
      return response.result?.result?.value;
    };
    const measureVisibleEdgeAnchors = () => evaluate(`(() => {
      const center = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      };
      const screenPoint = (path, point) => {
        const svgPoint = path.ownerSVGElement.createSVGPoint();
        svgPoint.x = point.x;
        svgPoint.y = point.y;
        const result = svgPoint.matrixTransform(path.getScreenCTM());
        return { x: result.x, y: result.y };
      };
      const distance = (left, right) => Math.hypot(left.x - right.x, left.y - right.y);
      const measurements = [...document.querySelectorAll('.react-flow__edge')].flatMap((edge) => {
        const label = edge.getAttribute('aria-label') || '';
        const match = label.match(/^Edge from (.+) to (.+)$/);
        const path = edge.querySelector('path');
        if (!match || !path) return [];
        const sourceNode = document.querySelector('[data-id="' + CSS.escape(match[1]) + '"]');
        const targetNode = document.querySelector('[data-id="' + CSS.escape(match[2]) + '"]');
        const sourceMode = sourceNode?.querySelector('[data-wanjuan-render-mode]')?.dataset.wanjuanRenderMode;
        const targetMode = targetNode?.querySelector('[data-wanjuan-render-mode]')?.dataset.wanjuanRenderMode;
        const sourceHandle = sourceNode?.querySelector('.react-flow__handle.source');
        const targetHandle = targetNode?.querySelector('.react-flow__handle.target');
        if (!sourceHandle || !targetHandle) return [];
        const length = path.getTotalLength();
        return [
          sourceMode && sourceMode !== 'full' ? {
            label: label + ' (source)',
            distance: distance(screenPoint(path, path.getPointAtLength(0)), center(sourceHandle)),
          } : null,
          targetMode && targetMode !== 'full' ? {
            label: label + ' (target)',
            distance: distance(screenPoint(path, path.getPointAtLength(length)), center(targetHandle)),
          } : null,
        ].filter(Boolean);
      });
      return {
        count: measurements.length,
        maxDistance: measurements.reduce((max, item) => Math.max(max, item.distance), 0),
        worst: measurements.sort((left, right) => right.distance - left.distance)[0] || null,
      };
    })()`);
    await send("Performance.enable");
    const waitForDebugApi = async () => {
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        if (await evaluate(`typeof globalThis.__wanjuanCanvasDebug === 'object'`)) return;
        await sleep(300);
      }
      throw new Error("Canvas debug API was not installed");
    };
    await waitForDebugApi();
    let largeImageResult = null;
    const largeImagePath = String(process.env.WANJUAN_PERF_LARGE_IMAGE || "").trim();
    if (largeImagePath && fs.existsSync(largeImagePath)) {
      largeImageResult = await evaluate(`window.wanjuanDesktop.persistProjectAsset(${JSON.stringify({
        localPath: largeImagePath,
        directory: userDataPath,
        projectId: "performance-large-image",
        nodeId: "large-image-node",
        field: "imageUrl",
        kind: "image",
        filename: path.basename(largeImagePath),
      })})`, true);
      if (!largeImageResult?.ok || !largeImageResult.thumbnailLocalPath) throw new Error(`Large image thumbnail generation failed`);
      if (!fs.existsSync(largeImageResult.thumbnailLocalPath)) throw new Error(`Large image thumbnail file is missing`);
      if (largeImageResult.thumbnailLocalPath !== largeImageResult.localPath) {
        const originalSize = fs.statSync(largeImageResult.localPath).size;
        const thumbnailSize = fs.statSync(largeImageResult.thumbnailLocalPath).size;
        if (thumbnailSize >= originalSize) throw new Error(`Large image thumbnail was not smaller than original`);
      }
    }
    await evaluate(`globalThis.__wanjuanCanvasDebug.clearFixture()`);
    await sleep(6000);
    const metricValue = async (name) => {
      const response = await send("Performance.getMetrics");
      return Number(response.result?.metrics?.find((metric) => metric.name === name)?.value || 0);
    };
    const taskDurationBefore = await metricValue("TaskDuration");
    const idleMutations = await evaluate(`new Promise(resolve=>{let count=0;const observer=new MutationObserver(items=>count+=items.length);observer.observe(document.documentElement,{subtree:true,childList:true});setTimeout(()=>{observer.disconnect();resolve(count)},2000)})`, true);
    const taskDurationAfter = await metricValue("TaskDuration");
    const idleTaskUtilization = (taskDurationAfter - taskDurationBefore) / 2;
    const idleSnapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.snapshot()`);
    if (idleMutations > 20) throw new Error(`Idle DOM mutation budget exceeded: ${idleMutations}`);
    if (idleTaskUtilization > 0.15) throw new Error(`Idle renderer task utilization exceeded: ${idleTaskUtilization.toFixed(3)}`);
    if (Number(idleSnapshot?.runtime?.setNodes5s || 0) > 1) throw new Error(`Idle setNodes budget exceeded: ${idleSnapshot.runtime.setNodes5s}`);

    const results = [];
    for (const count of [100, 300, 600]) {
      await evaluate(`globalThis.__wanjuanCanvasDebug.loadFixture(${count}, { withResults: true, extractedFrameCount: 120 })`);
      await sleep(2500);
      let resultViewport = null;
      if (count === 300) {
        await evaluate(`globalThis.__wanjuanCanvasDebug.setViewport({ x: 80, y: 80, zoom: 0.62 })`);
        await sleep(2500);
        resultViewport = await evaluate(`globalThis.__wanjuanCanvasDebug.snapshot()`);
        if (Number(resultViewport?.images || 0) < 8) {
          throw new Error(`Dense result viewport did not render enough image results: ${resultViewport?.images || 0}`);
        }
        if (Number(resultViewport?.modes?.lite || 0) < 7) {
          throw new Error(`Dense result viewport did not exercise lightweight result nodes: ${JSON.stringify(resultViewport?.modes || {})}`);
        }
        const edgeAnchors = await measureVisibleEdgeAnchors();
        if (edgeAnchors.count < 1) throw new Error(`Dense result viewport did not expose measurable edge anchors`);
        if (edgeAnchors.maxDistance > 3) {
          throw new Error(`Lightweight edge anchors drifted from visible handles: ${JSON.stringify(edgeAnchors.worst)}`);
        }
        resultViewport.edgeAnchors = edgeAnchors;
      }
      const snapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.snapshot()`);
      const fullNodes = Number(snapshot?.modes?.full || 0);
      if (fullNodes > 36) throw new Error(`${count}-node fixture mounted too many full nodes: ${fullNodes}`);
      if (Number(snapshot?.brokenImages || 0) !== 0) throw new Error(`${count}-node fixture rendered broken image previews`);
      if (count === 100) {
        const fixtureDataBefore = await evaluate(`globalThis.__wanjuanCanvasDebug.inspectFixtureData()`);
        if (fixtureDataBefore.imageResults < 20 || fixtureDataBefore.videoResults < 10 || fixtureDataBefore.audioResults < 10) {
          throw new Error(`Result fixture is missing generated media data: ${JSON.stringify(fixtureDataBefore)}`);
        }
        if (fixtureDataBefore.musicClips < 40 || fixtureDataBefore.extractedFrames < 1200) {
          throw new Error(`Result fixture is missing multi-result history: ${JSON.stringify(fixtureDataBefore)}`);
        }
        await evaluate(`globalThis.__wanjuanCanvasDebug.selectNodesByType('videoExtractNode', 1)`);
        await evaluate(`globalThis.__wanjuanCanvasDebug.connectFixtureFrame('wanjuan-perf-6', 119, 'wanjuan-perf-7')`);
        await sleep(700);
        const extractFullSnapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.nodeSnapshot('wanjuan-perf-6')`);
        if (extractFullSnapshot.renderMode !== "full" || extractFullSnapshot.extractedFrames !== 120) {
          throw new Error(`Extract result node did not restore full mode with intact data: ${JSON.stringify(extractFullSnapshot)}`);
        }
        if (extractFullSnapshot.images > 20) {
          throw new Error(`Extract result virtualization mounted too many frames: ${JSON.stringify(extractFullSnapshot)}`);
        }
        if (!extractFullSnapshot.hasLastFrameHandle) {
          throw new Error(`Connected off-page frame lost its source handle: ${JSON.stringify(extractFullSnapshot)}`);
        }
        await evaluate(`globalThis.__wanjuanCanvasDebug.clearSelection()`);
        await sleep(700);
        const extractLiteSnapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.nodeSnapshot('wanjuan-perf-6')`);
        if (extractLiteSnapshot.renderMode === "full" || extractLiteSnapshot.extractedFrames !== 120) {
          throw new Error(`Extract result node did not return to lightweight mode safely: ${JSON.stringify(extractLiteSnapshot)}`);
        }
        await evaluate(`globalThis.__wanjuanCanvasDebug.selectMediaNodes(12, 8)`);
        await sleep(3500);
        const mediaSnapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.snapshot()`);
        if (mediaSnapshot.videos < 4 || mediaSnapshot.audios < 2) throw new Error(`Result fixture did not mount real media elements`);
        if (!Array.isArray(mediaSnapshot.videoPlayOverlays) || mediaSnapshot.videoPlayOverlays.length < 1) {
          throw new Error(`Selected result videos did not render a play overlay`);
        }
        if (mediaSnapshot.videoPlayOverlays.some((offset) => Math.abs(offset.dx) > 1 || Math.abs(offset.dy) > 1)) {
          throw new Error(`Video play overlay is not centered: ${JSON.stringify(mediaSnapshot.videoPlayOverlays)}`);
        }
        if (mediaSnapshot.activeVideos > 4 || mediaSnapshot.activeAudios > 2) {
          throw new Error(`Result fixture exceeded media budget: ${JSON.stringify({ videos: mediaSnapshot.videos, activeVideos: mediaSnapshot.activeVideos, audios: mediaSnapshot.audios, activeAudios: mediaSnapshot.activeAudios, mediaPerf: mediaSnapshot.mediaPerf })}`);
        }
        await evaluate(`globalThis.__wanjuanCanvasDebug.clearSelection()`);
        await sleep(900);
        const releasedMediaSnapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.snapshot()`);
        if (releasedMediaSnapshot.activeVideos !== 0 || releasedMediaSnapshot.activeAudios !== 0) {
          throw new Error(`Media slots were not released after nodes became inactive: ${JSON.stringify(releasedMediaSnapshot)}`);
        }
        await evaluate(`globalThis.__wanjuanCanvasDebug.selectMediaNodes(12, 8)`);
        await sleep(1800);
        const reacquiredMediaSnapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.snapshot()`);
        if (reacquiredMediaSnapshot.activeVideos !== 4 || reacquiredMediaSnapshot.activeAudios !== 2) {
          throw new Error(`Media slots could not be reacquired: ${JSON.stringify(reacquiredMediaSnapshot)}`);
        }
        const fixtureDataAfter = await evaluate(`globalThis.__wanjuanCanvasDebug.inspectFixtureData()`);
        if (JSON.stringify(fixtureDataAfter) !== JSON.stringify(fixtureDataBefore)) {
          throw new Error(`Render-mode and media transitions changed result data: ${JSON.stringify({ before: fixtureDataBefore, after: fixtureDataAfter })}`);
        }
        snapshot.mediaBudget = { mounted: mediaSnapshot, released: releasedMediaSnapshot, reacquired: reacquiredMediaSnapshot };
        snapshot.fixtureData = fixtureDataAfter;
      }
      if (resultViewport) snapshot.resultViewport = resultViewport;
      results.push({ requested: count, ...snapshot });
    }
    await evaluate(`globalThis.__wanjuanCanvasDebug.loadFixture(20, { withResults: true, videoThumbnails: false, extractedFrameCount: 24 })`);
    await sleep(700);
    await evaluate(`globalThis.__wanjuanCanvasDebug.setViewport({ x: 250, y: 250, zoom: 0.5 })`);
    await sleep(1600);
    const compactModeSnapshot = await evaluate(`globalThis.__wanjuanCanvasDebug.snapshot()`);
    if (Number(compactModeSnapshot?.modes?.full || 0) > 1 || Number(compactModeSnapshot?.modes?.lite || 0) < 15) {
      throw new Error(`Small projected nodes were promoted to full mode: ${JSON.stringify(compactModeSnapshot?.modes || {})}`);
    }
    await evaluate(`globalThis.__wanjuanCanvasDebug.setViewport({ x: 120, y: 100, zoom: 0.82 })`);
    await sleep(1800);
    const expandedModeSnapshot = await evaluate(`({
      ...globalThis.__wanjuanCanvasDebug.snapshot(),
      videoFallbacks: document.querySelectorAll('.wanjuan-video-poster-fallback').length,
    })`);
    if (Number(expandedModeSnapshot?.modes?.full || 0) < 1) {
      throw new Error(`Large projected nodes did not restore full mode: ${JSON.stringify(expandedModeSnapshot?.modes || {})}`);
    }
    if (Number(expandedModeSnapshot?.activeVideos || 0) < 1 || Number(expandedModeSnapshot?.activeVideos || 0) > 4) {
      throw new Error(`Full video nodes did not render within the media budget: ${JSON.stringify({ videos: expandedModeSnapshot?.videos, activeVideos: expandedModeSnapshot?.activeVideos })}`);
    }
    const largeImageSummary = largeImageResult ? { ...largeImageResult } : null;
    if (largeImageSummary?.value) largeImageSummary.value = `[${largeImageSummary.valueFormat || `asset`} omitted]`;
    console.log(JSON.stringify({ ok: true, largeImageResult: largeImageSummary, idleMutations, idleTaskUtilization, idleSnapshot, results, renderModeTransitions: { compactModeSnapshot, expandedModeSnapshot } }, null, 2));
  } finally {
    try { ws?.close(); } catch {}
    child.kill("SIGTERM");
    await sleep(500);
    if (!child.killed) child.kill("SIGKILL");
    fs.rmSync(userDataPath, { recursive: true, force: true });
    if (stderr && process.env.WANJUAN_PERF_VERBOSE === "1") process.stderr.write(stderr);
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
