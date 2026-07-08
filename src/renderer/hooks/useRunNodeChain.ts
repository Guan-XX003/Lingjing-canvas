/**
 * runNodeChain。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Toast } from "../lib/app-types";

interface UseRunNodeChainDeps {
  generateImage: any;
  generateText: any;
  generateVideo: any;
  getEdges: () => any[];
  getNodes: () => any[];
  handleGenerateCustom: any;
  resolveVideoRunModel: any;
  showToast: Toast;
}

export function useRunNodeChain(deps: UseRunNodeChainDeps) {
  const {
    generateImage,
    generateText,
    generateVideo,
    getEdges,
    getNodes,
    handleGenerateCustom,
    resolveVideoRunModel,
    showToast,
  } = deps;
  const runNodeChain = useCallback(
	      async (nodeId) => {
          let descendantIds = new Set(),
            edges2 = getEdges(),
            queue = [nodeId];
          for (; queue.length > 0;) {
            let currentId = queue.shift();
            descendantIds.has(currentId) ||
              (descendantIds.add(currentId),
                edges2.filter((edge) => edge.source === currentId).forEach((edge) => queue.push(edge.target)));
          }
          let runQueue = [nodeId],
            processed = new Set(),
            failedNodes = new Set(),
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
            isInputNode = (node) => [
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
            waitForNode = async (nodeId2, timeout = 9e5) => {
                let startTime = Date.now();
                for (;;) {
                  let node = getNodes().find((node2) => node2.id === nodeId2);
                  if (!node) return {
                    ok: false,
                    error: `节点不存在`
                  };
                  let nodeData = node.data || {};
                  if (nodeData.errorMessage) return {
                    ok: false,
                    error: nodeData.errorMessage
                  };
                  if (!nodeData.loading && (!isInputNode(node) || hasOutput(node))) return {
                    ok: true,
                    node: node
                  };
                  if (!nodeData.loading && isInputNode(node) && Date.now() - startTime > 3e3 && !hasOutput(node))
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
              getIncomingEdges = (nodeId2) =>
              edges2
              .filter((edge) => edge.target === nodeId2)
              .some((edge) => descendantIds.has(edge.source) && !processed.has(edge.source)),
              runNode = async (nodeId2, node) => {
                let nodeData = node.data || {};
                return node.type === `promptNode` ?
                  await generateImage(
                    nodeId2,
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
                    nodeId2,
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
                    nodeId2,
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
                  nodeData.onGenerateAudio && (await nodeData.onGenerateAudio(nodeId2)) :
                  node.type === `ttsMusicNode` || node.type === `musicNode` ?
                  nodeData.onGenerateTtsMusic && (await nodeData.onGenerateTtsMusic(nodeId2)) :
                  node.type === `videoExtractNode` ?
                  nodeData.onExtractFrames && (await nodeData.onExtractFrames(nodeId2)) :
                  node.type === `customNode` ?
                  await handleGenerateCustom(nodeId2) :
                  null;
              };
          for (showToast(`开始依次运行...`); runQueue.length > 0;) {
            let nodeId2 = runQueue.shift();
            if (!nodeId2 || processed.has(nodeId2) || failedNodes.has(nodeId2)) continue;
            if (getIncomingEdges(nodeId2)) {
              runQueue.push(nodeId2);
              if (runQueue.every((nodeId3) => getIncomingEdges(nodeId3))) break;
              continue;
            }
            let node = getNodes().find((node2) => node2.id === nodeId2);
            if (!node) {
              failedNodes.add(nodeId2);
              continue;
            }
            let runResult = null;
            try {
              runResult = await runNode(nodeId2, node);
            } catch (error) {
              (console.error(`Error running node ${nodeId2}`, error),
                failedNodes.add(nodeId2),
                showToast(`节点 ${nodeId2} 运行失败，停止后续节点运行`));
              continue;
            }
            let waitResult = await waitForNode(nodeId2);
            if (!waitResult.ok) {
              (console.warn(`Node ${nodeId2} failed, stopping branch:`, waitResult.error),
                failedNodes.add(nodeId2),
                showToast(`节点 ${nodeId2} 运行失败，停止后续节点运行：${waitResult.error}`));
              continue;
            }
            processed.add(nodeId2);
            if (runResult && runResult.splitNodes) {
              let edges3 = getEdges();
              runResult.splitNodes.forEach((splitNodeId) => {
                (processed.add(splitNodeId),
                  descendantIds.add(splitNodeId),
                  edges3
                  .filter((edge) => edge.source === splitNodeId)
                  .forEach((edge) => {
                    descendantIds.add(edge.target);
                    !processed.has(edge.target) && !failedNodes.has(edge.target) && runQueue.push(edge.target);
                  }));
              });
            } else
              getEdges()
              .filter((edge) => edge.source === nodeId2)
              .forEach((edge) => {
                !processed.has(edge.target) && !failedNodes.has(edge.target) && runQueue.push(edge.target);
              });
          }
          showToast(`依次运行完成`);
        },
        [getNodes, getEdges, generateImage, generateText, generateVideo, handleGenerateCustom, showToast],
    );
  return { runNodeChain };
}
