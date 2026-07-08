/**
 * layeredRunDownstream。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Toast, WjEdge, WjNode } from "../lib/app-types";

interface UseLayeredRunDeps {
  generateImage: any;
  generateText: any;
  generateVideo: any;
  getEdges: () => WjEdge[];
  getNodes: () => WjNode[];
  handleGenerateCustom: any;
  layeredRunMaxConcurrency: any;
  resolveVideoRunModel: any;
  showToast: Toast;
}

export function useLayeredRun(deps: UseLayeredRunDeps) {
  const {
    generateImage,
    generateText,
    generateVideo,
    getEdges,
    getNodes,
    handleGenerateCustom,
    layeredRunMaxConcurrency,
    resolveVideoRunModel,
    showToast,
  } = deps;
  const layeredRunDownstream = useCallback(
      async (startNodeId) => {
          let edges2 = getEdges(),
            visited = new Set(),
            queue = [startNodeId];
	          for (; queue.length > 0;) {
	            let nodeId = queue.shift();
	            visited.has(nodeId) ||
	              (visited.add(nodeId),
	                edges2.filter((edge) => edge.source === nodeId).forEach((edge) => queue.push(edge.target)));
	          }
	          visited.delete(startNodeId);
          let nodeIds = getNodes().map((node) => node.id),
            maxConcurrency = Math.max(
              1,
              Math.min(20, Number((() => {
                try {
                  let performanceProfile = window.localStorage?.getItem(`wanjuanPerformanceProfile`);
                  if (performanceProfile && performanceProfile !== `custom`)
                    return {
                      performance: 2,
                      balanced: 3,
                      quality: 5
                    } [performanceProfile] || layeredRunMaxConcurrency;
                } catch {}
                return layeredRunMaxConcurrency;
              })()) || 1),
            ),
            delay = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
            hasOutput = (node) =>
            !!(
              node?.data?.imageUrl ||
              node?.data?.videoUrl ||
              node?.data?.audioUrl ||
              node?.data?.text ||
              node?.data?.resultData ||
              (Array.isArray(node?.data?.chunks) && node.data.chunks.length > 0)
            ),
            isGeneratingNode = (node) => [
              `promptNode`,
              `textNode`,
              `videoNode`,
              `seedanceNode`,
              `audioNode`,
              `ttsMusicNode`,
              `musicNode`,
              `videoExtractNode`,
              `customNode`,
            ].includes(node?.type),
            waitForNode = async (nodeId, timeout = 9e5) => {
                let startTime = Date.now();
                for (;;) {
                  let node = getNodes().find((node2) => node2.id === nodeId);
                  if (!node) return {
                    ok: false,
                    error: `节点不存在`
                  };
                  let nodeData = node.data || {};
                  if (nodeData.errorMessage) return {
                    ok: false,
                    error: nodeData.errorMessage
                  };
                  if (!nodeData.loading && (!isGeneratingNode(node) || hasOutput(node))) return {
                    ok: true,
                    node: node
                  };
                  if (!nodeData.loading && isGeneratingNode(node) && Date.now() - startTime > 3e3 && !hasOutput(node))
                    return {
                      ok: false,
                      error: `节点没有生成可用结果`
                    };
                  if (Date.now() - startTime > timeout)
                    return {
                      ok: false,
                      error: `等待节点完成超时`
                    };
                  await delay(500);
                }
              },
              getInputNodeIds = (nodeId) =>
              edges2
              .filter((edge) => edge.target === nodeId && visited.has(edge.source))
              .map((nodeId2) => nodeId2.source),
              runNode = async (nodeId, node) => {
                  let nodeData = node.data || {};
                  return node.type === `promptNode` ?
                    await generateImage(
                      nodeId,
                      nodeData.prompt || ``,
                      `1024x1024`,
                      nodeData.selectedModel ?
                      nodeData.selectedModel :
                      nodeData.drawingModel ?
                      nodeData.drawingModel
                      .split(
                        `
	`,
                      )[0]
                      .trim() :
                      undefined,
                    ) :
                    node.type === `textNode` ?
                    await generateText(
                      nodeId,
                      nodeData.prompt || ``,
                      nodeData.autoSplit || false,
                      nodeData.selectedModel ?
                      nodeData.selectedModel :
                      nodeData.textModel ?
                      nodeData.textModel
                      .split(
                        `
	`,
                      )[0]
                      .trim() :
                      undefined,
                    ) :
                    node.type === `videoNode` ||
                    node.type === `seedanceNode` ||
                    node.type === `tongyiWanxiangNode` ?
                    await generateVideo(
                      nodeId,
                      nodeData.prompt || ``,
	                      String(nodeData.size || `1280x720`)
	                      .split(/[\s,，、]+/)[0]
	                      ?.trim() || `1280x720`,
	                      resolveVideoRunModel(nodeData, node.type),
                      nodeData.selectedSeconds ?
                      String(nodeData.selectedSeconds || ``)
                      .split(/[\s,，、]+/)[0]
                      ?.trim() :
                      nodeData.videoDurations ?
                      String(nodeData.videoDurations || ``)
                      .split(/[\s,，、]+/)[0]
                      ?.trim() :
                      undefined,
                    ) :
                    node.type === `audioNode` ?
                    nodeData.onGenerateAudio && (await nodeData.onGenerateAudio(nodeId)) :
                    node.type === `ttsMusicNode` || node.type === `musicNode` ?
                    nodeData.onGenerateTtsMusic && (await nodeData.onGenerateTtsMusic(nodeId)) :
                    node.type === `videoExtractNode` ?
                    nodeData.onExtractFrames && (await nodeData.onExtractFrames(nodeId)) :
                    node.type === `customNode` ?
                    await handleGenerateCustom(nodeId) :
                    null;
                },
                completedNodes = new Set(),
                failedNodes = new Set();
          showToast(`开始按层级运行，最大并发 ${maxConcurrency}`);
          for (;;) {
            let readyNodes = [...visited]
              .filter((nodeId) => !completedNodes.has(nodeId) && !failedNodes.has(nodeId))
              .filter((nodeId) => {
                let sourceIds = getInputNodeIds(nodeId);
                return (
                  !sourceIds.some((sourceId) => failedNodes.has(sourceId)) &&
                  sourceIds.every((sourceId) => completedNodes.has(sourceId))
                );
              })
              .sort((firstId: any, secondId: any) => nodeIds.indexOf(firstId) - nodeIds.indexOf(secondId));
            if (readyNodes.length === 0) {
              let remainingNodes = [...visited].filter((nodeId) => !completedNodes.has(nodeId) && !failedNodes.has(nodeId));
              remainingNodes.length > 0 &&
                remainingNodes.forEach((nodeId) => {
                  getInputNodeIds(nodeId).some((sourceId) => failedNodes.has(sourceId)) && failedNodes.add(nodeId);
                });
              break;
            }
            let batch = readyNodes.slice(0, maxConcurrency);
            await Promise.all(
              batch.map(async (nodeId) => {
                let node = getNodes().find((node2) => node2.id === nodeId);
                if (!node) {
                  failedNodes.add(nodeId);
                  return;
                }
                try {
                  await runNode(nodeId, node);
                  let waitResult = await waitForNode(nodeId);
                  waitResult.ok ?
                    completedNodes.add(nodeId) :
                    (failedNodes.add(nodeId),
                      showToast(`节点 ${nodeId} 运行失败，停止该分支：${waitResult.error}`));
                } catch (error) {
                  (console.error(`Error running node ${nodeId}`, error),
                    failedNodes.add(nodeId),
                    showToast(`节点 ${nodeId} 运行失败，停止该分支：${error?.message || error}`));
                }
              }),
            );
          }
          showToast(`按层级运行完成`);
        },
        [getNodes, getEdges, generateImage, generateText, generateVideo, handleGenerateCustom, showToast, layeredRunMaxConcurrency],
    );
  return { layeredRunDownstream };
}
