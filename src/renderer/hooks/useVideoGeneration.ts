// @ts-nocheck
/**
 * 视频生成（generateVideo）。自 bundle(WanJuanAppCanvas) 抽出的自定义 hook，逻辑逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { ApiBindings, ApiConfig, ProtocolBindings, ProtocolRegistry, Ref, SetAny, SetState, Toast, WjEdge, WjNode } from "../lib/app-types";
import { buildApiUrl, extractVideoTaskErrorHelper, resolveModelApiBindingIdHelper, resolveModelProtocolBindingHelper } from "../lib/model-binding";
import { mediaUrlToDataUrl, wanjuanCollectNodeReferenceMedia, wanjuanNormalizeReferenceMediaUrl } from "../lib/reference-media";
import { wanjuanHasTianjiPortraitClaim, wanjuanPreferCurrentCanvasNodes, wanjuanRecoverTianjiPortraitNodeData } from "../lib/tianji-portrait";
import { wanjuanCollectTianjiManualPortraitInputs, wanjuanExcludeTianjiPortraitPreviews } from "../lib/tianji-manual-reference";
import { normalizeVideoAspectRatioValue, normalizeVideoSizeValue } from "../lib/video-aspect-ratio";
import { safeStringifyRequestForLog, serializeErrorPreview } from "../lib/log-utils";
import { wanjuanClearProjectAssetBindingsFromData, wanjuanResourceKind } from "../lib/resource";
import { wanjuanFormatMentionToken, wanjuanLegacyMentionToken, wanjuanNormalizeMentionTokensForApi } from "../lib/mention";
import { WanJuanGetPreferredModel } from "../lib/model-favorites";
import { wanjuanNormalizeSeedanceAssetId, wanjuanSeedanceAssetUrl } from "../lib/seedance";
import { wanjuanRunTianjiSeedanceVideo, wanjuanTianjiStorageGet } from "../lib/tianji-api";
import { wanjuanTianjiResolvePortraitAssetForNodeData } from "../lib/tianji-assets";
import { wanjuanBuildReferenceMediaEntries } from "../lib/video-task";
import { applyRunScopedStateUpdate, supersedeActiveNodeTasks, updateTaskRunningProgress } from "../lib/global-tasks";
import { wanjuanResolveArkTrustedAssetReference } from "../lib/ark-trusted-assets";

interface UseVideoGenerationDeps {
  videoApiKey: any;
  videoApiUrl: any;
  videoModel: any;
  videoDurations: any;
  apiConfigs: ApiConfig[];
  videoModelApiBindings: ApiBindings;
  videoModelProtocolBindings: ProtocolBindings;
  modelProtocolRegistry: ProtocolRegistry;
  videoModelRequestProfiles: any;
  seedanceUploadMode: any;
  tosConfig: any;
  customPublicUploadConfig: any;
  arkTrustedAssetConfig: any;
  handleArkTrustedAssetReview: any;
  planLimits: any;
  showToast: Toast;
  getNodes: () => WjNode[];
  getEdges: () => WjEdge[];
  setNodes: SetState<WjNode[]>;
  addGeneratedAsset: any;
  membership: any;
  abortControllersRef: Ref;
  canvasStateKeyPrefix: any;
  localforageModule: any;
  nodesRef: Ref<WjNode[]>;
  pollIntervalMs: any;
  projectIdRef: Ref;
  qiniuConfig: any;
  setDailyGenerationCount: SetAny;
  setEdges: SetState<WjEdge[]>;
  timeoutSeconds: any;
  updateTaskList: any;
}

export function useVideoGeneration(deps: UseVideoGenerationDeps) {
  const {
    videoApiKey,
    videoApiUrl,
    videoModel,
    videoDurations,
    apiConfigs,
    videoModelApiBindings,
    videoModelProtocolBindings,
    modelProtocolRegistry,
    videoModelRequestProfiles,
    seedanceUploadMode,
    tosConfig,
    customPublicUploadConfig,
    arkTrustedAssetConfig,
    handleArkTrustedAssetReview,
    planLimits,
    showToast,
    getNodes,
    getEdges,
    setNodes: setNodesRaw,
    addGeneratedAsset,
    membership,
    abortControllersRef,
    canvasStateKeyPrefix,
    localforageModule,
    nodesRef,
    pollIntervalMs,
    projectIdRef,
    qiniuConfig,
    setDailyGenerationCount,
    setEdges: setEdgesRaw,
    timeoutSeconds,
    updateTaskList: updateTaskListRaw,
  } = deps;
  const generateVideo = useCallback(
      async (nodeId, prompt, resolution = `1280x720`, modelName2, duration, apiBindingId, aspectRatioOverride) => {
          let previousController = abortControllersRef.current.get(nodeId);
          if (previousController && !previousController.signal?.aborted) previousController.abort();
          abortControllersRef.current.delete(nodeId);
          updateTaskListRaw && updateTaskListRaw((tasks) => supersedeActiveNodeTasks(tasks, nodeId));
          let videoRunTokens = globalThis.__wanjuanVideoRunTokens || (globalThis.__wanjuanVideoRunTokens = new Map()),
            videoRunToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            isCurrentVideoRun = () => videoRunTokens.get(nodeId) === videoRunToken;
          videoRunTokens.set(nodeId, videoRunToken);
          const runScopedSetState = (setter, update) =>
              setter?.((current) => applyRunScopedStateUpdate(current, update, isCurrentVideoRun())),
            setNodes = (update) => runScopedSetState(setNodesRaw, update),
            setEdges = (update) => runScopedSetState(setEdgesRaw, update),
            updateTaskList = (update) => runScopedSetState(updateTaskListRaw, update);
          let dailyLimitKey = `daily-limit-${new Date().toISOString().split(`T`)[0]}`,
            dailyCount = parseInt(localStorage.getItem(dailyLimitKey) || `0`);
          let normalizeApiBase = (rawBaseUrl) =>
            String(rawBaseUrl || ``)
            .replace(/\s+/g, ``)
            .replace(/\/$/, ``),
            normalizeVideoModelName = (modelName3) =>
	            String(modelName3 || `grok-video-4.2`)
	            .split(/[\n,，、]+/)
	            .map((item) => item.trim())
	            .filter(Boolean)[0] || `grok-video-4.2`,
		            modelName = normalizeVideoModelName(WanJuanGetPreferredModel(videoModel, modelName2 || ``) || modelName2 || videoModel),
		            currentCanvasNodes = () => {
		              const renderedNodes = Array.from(globalThis.__wanjuanRenderRuntime?.renderedNodes?.values?.() || []);
		              return wanjuanPreferCurrentCanvasNodes(renderedNodes, wanjuanPreferCurrentCanvasNodes(nodesRef.current, getNodes()));
		            },
		            seedanceSourceNode = currentCanvasNodes().find((node) => node.id === nodeId);
	          if (seedanceSourceNode?.type === `seedanceNode` && seedanceSourceNode?.data?.seedanceMode !== `tianji`) {
	            let seedanceOfficialModelText = seedanceSourceNode?.data?.seedanceModel || seedanceSourceNode?.data?.videoModel || ``,
	              seedanceOfficialModel = WanJuanGetPreferredModel(
	                seedanceOfficialModelText || modelName,
	                seedanceSourceNode?.data?.seedanceSelectedModel || modelName || ``,
	                undefined,
	                {
	                  manual: seedanceSourceNode?.data?.seedanceModelManual === true,
	                  auto: seedanceSourceNode?.data?.wanjuanModelAuto === true,
	                },
	              );
	            seedanceOfficialModel && (modelName = normalizeVideoModelName(seedanceOfficialModel));
	          }
	          let
	            isVideoApiBoundSourceNode =
	            seedanceSourceNode?.type === `seedanceNode` ||
	            seedanceSourceNode?.type === `tongyiWanxiangNode`,
            selectedVideoApiConfigId =
            apiBindingId ||
            resolveModelApiBindingIdHelper(
              videoModelApiBindings,
              modelName,
              isVideoApiBoundSourceNode ?
              seedanceSourceNode?.data?.selectedApiConfigId ||
              seedanceSourceNode?.data?.apiConfigId ||
              undefined :
              undefined,
            ) ||
            (isVideoApiBoundSourceNode ?
              seedanceSourceNode?.data?.selectedApiConfigId ||
              seedanceSourceNode?.data?.apiConfigId ||
              undefined :
              undefined),
            explicitVideoConfig = selectedVideoApiConfigId ?
            apiConfigs.find((apiConfig) => apiConfig.id === selectedVideoApiConfigId) :
            null,
            videoConfig = explicitVideoConfig,
            videoBaseUrl = normalizeApiBase(videoConfig?.url || videoApiUrl || ``),
            apiOrigin = (() => {
              try {
                return new URL(videoBaseUrl).origin;
              } catch {
                return videoBaseUrl;
              }
            })(),
            isXpclawMiniMax23 =
            /^MiniMax-Hailuo-2\.3$/i.test(modelName) &&
            /xpclaw\.ai/i.test(videoBaseUrl),
            isXpclawSoraCompatTask =
            /^grok-video/i.test(modelName) && /xpclaw\.ai/i.test(videoBaseUrl),
            videoKey = videoConfig?.key || videoApiKey,
            projectIdAtStart = projectIdRef.current,
            persistVideoNodeState = async (styleUpdates = {}, dataUpdates = {}, options = {}) => {
              try {
                let storageKey = `${canvasStateKeyPrefix}${projectIdAtStart}`,
                  projectData = await localforageModule.default.getItem(storageKey);
                projectData?.nodes &&
                  ((projectData = {
                      ...projectData,
                      nodes: projectData.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        let baseData = wanjuanClearProjectAssetBindingsFromData(
                          node.data,
                          options.clearProjectAssetBindings || [],
                        );
                        return {
                          ...node,
                          style: Object.keys(styleUpdates).length > 0 ?
                            {
                              ...node.style,
                              ...styleUpdates
                            } :
                            node.style,
                          data: {
                            ...baseData,
                            ...dataUpdates
                          },
                        };
                      }),
                    }),
                    await localforageModule.default.setItem(storageKey, projectData));
              } catch (error) {
                console.warn(`Failed to persist background video node`, error);
              }
            };
		          let isSeedanceNode =
		            seedanceSourceNode?.type === `seedanceNode` ||
		            /^(?:doubao-)?seedance(?:-2(?:\.|-)?0|-2-0)/i.test(modelName),
		            selectedVideoProtocolName =
		            resolveModelProtocolBindingHelper(seedanceSourceNode?.data?.videoModelProtocolBindings, modelName) ||
		            resolveModelProtocolBindingHelper(videoModelProtocolBindings, modelName),
		            modelProtocolDefinition =
		            modelProtocolRegistry?.[selectedVideoProtocolName],
            parseVideoModelRequestProfiles = (value) => {
              if (!value) return {};
              if (typeof value == `object`) return value;
              if (typeof value != `string`) return {};
              try {
                let parsed = JSON.parse(value);
                return parsed && typeof parsed == `object` ? parsed : {};
              } catch (error) {
                return (
                  console.warn(`Invalid video model request profiles JSON`, error), {}
                );
              }
            },
            videoModelRequestProfile =
            (modelProtocolDefinition &&
              typeof modelProtocolDefinition == `object` &&
              modelProtocolDefinition.category === `video` ?
              modelProtocolDefinition :
              null) ||
            parseVideoModelRequestProfiles(
              seedanceSourceNode?.data?.videoModelRequestProfiles,
            )?.[modelName] ||
            (isXpclawMiniMax23 ?
              {
                requestType: `openai-video`,
                submitPath: `${apiOrigin}/v1/video/generations`,
                pollPath: `${apiOrigin}/v1/video/generations/{taskId}`,
                fieldMapping: {
                  prompt: `prompt`,
                  resolution: `size`,
                  duration: `duration`,
                  referenceImage: `first_frame_image`,
                },
              } :
              isXpclawSoraCompatTask ?
              {
                requestType: `multipart-video`,
                submitPath: `${apiOrigin}/v1/videos`,
                pollPath: `${apiOrigin}/v1/videos/{taskId}`,
                contentPath: `${apiOrigin}/v1/videos/{taskId}/content`,
                fieldMapping: {
                  duration: `seconds`,
                  resolution: `size`,
                  referenceImage: `input_reference`,
                },
              } :
              /^MiniMax-Hailuo-2\.3$/i.test(modelName) ?
              {
                requestType: `json-video`,
                submitPath: `${apiOrigin}/v1/video_generation`,
                pollPath: `${apiOrigin}/v1/query/video_generation?task_id={taskId}`,
                fieldMapping: {
                  duration: `duration`,
                  resolution: `resolution`,
                  referenceImage: `first_frame_image`,
                },
              } :
              {}),
            videoBuildApiUrl = (baseUrl, path) => {
              let normalizedBaseUrl = String(baseUrl || ``)
                .replace(/\s+/g, ``)
                .replace(/\/$/, ``),
                trimmedPath = String(path || ``).trim();
              return trimmedPath ?
                /^https?:\/\//i.test(trimmedPath) ?
                trimmedPath :
                `${normalizedBaseUrl}/${trimmedPath.replace(/^\/+/, ``)}` :
                normalizedBaseUrl;
            },
            replaceTaskPath = (pathTemplate, taskId) => {
              let template = String(pathTemplate || `/v1/videos/{taskId}`);
              return /\{(?:taskId|task_id|video_id|id)\}/.test(template) ?
                template.replace(/\{(?:taskId|task_id|video_id|id)\}/g, taskId) :
                `${template.replace(/\/$/, ``)}/${taskId}`;
            },
            createdVideoTaskId = ``,
            arkConfig = isSeedanceNode ?
            apiConfigs.find(
              (apiConfig) =>
              apiConfig.id === `volcengine-ark` ||
              /ark\.cn-beijing\.volces\.com/.test(apiConfig.url || ``),
            ) :
            null;
          if (
            isSeedanceNode &&
            !videoConfig
          ) {
            videoBaseUrl = normalizeApiBase(arkConfig?.url || ``);
            videoKey = arkConfig?.key || videoKey;
          }
          if (!videoKey && !(isSeedanceNode && seedanceSourceNode?.data?.seedanceMode === `tianji`)) {
            showToast(`请先在设置中配置视频大模型 API Key`);
            return;
          }
          let videoTaskPromptForDiagnostics = prompt;
          (setNodes((nodes2) =>
              nodes2.map((node) =>
                node.id === nodeId ?
	                {
	                  ...node,
	                  data: {
	                    ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                    loading: true,
	                    manuallyStopped: false,
                    progress: 0,
                    taskId: undefined,
                    seedanceTaskId: undefined,
                    errorMessage: undefined,
                    videoUrl: undefined,
                    thumbnailUrl: undefined,
                    videoAspectRatio: undefined,
                    resultData: undefined,
                  },
                } :
                node,
              ),
            ),
            setEdges((edges2) =>
              edges2.map((edge) => (edge.target === nodeId ? {
                ...edge,
                animated: true
              } : edge)),
            ));
          try {
            showToast(`正在提交视频生成任务...`);
	            let edgesList = getEdges(),
	              nodes2 = currentCanvasNodes(),
              incomingEdges = edgesList.filter((edge) => edge.target === nodeId),
              imageReferences = [],
              promptParts = [],
              videoReferences = [],
              seedanceAudioRefs = [],
              tongyiReferenceEntries = [],
              tongyiReferenceSeen = new Set(),
              wanjuanVideoReferenceSeen = new Set(),
              addVideoReferenceImage = (url, meta = {}) => {
                let seedanceMeta =
                    url && typeof url == `object` ?
                    {
                      ...url,
                      ...meta
                    } :
                    meta || {},
                  value = String(
                    url && typeof url == `object` ?
                    url.url || url.localPath || url.path || url.imageUrl || url.thumbnailUrl || `` :
                    url || ``,
                  ).trim(),
                  assetId = wanjuanNormalizeSeedanceAssetId(
                    seedanceMeta.seedanceAssetId || seedanceMeta.assetId,
                  ),
                  tianjiPortraitAssetId = String(seedanceMeta.tianjiPortraitAssetId || ``).trim(),
                  arkTrustedAssetId = String(seedanceMeta.arkTrustedAssetId || ``).replace(/^asset:\/\//i, ``).trim(),
                  entry = assetId ?
                  {
                    ...seedanceMeta,
                    url: value,
                    kind: `image`,
                    seedanceAssetId: assetId,
                  } :
                  tianjiPortraitAssetId ?
                  {
                    ...seedanceMeta,
                    url: value,
                    kind: `image`,
                    tianjiPortraitAssetId,
                  } :
                  arkTrustedAssetId || Object.keys(seedanceMeta).length > 0 ?
                  {
                    ...seedanceMeta,
                    url: value,
                    kind: `image`,
                    arkTrustedAssetId: arkTrustedAssetId || undefined,
                  } :
                  value;
                if (!value && !assetId && !tianjiPortraitAssetId && !arkTrustedAssetId) return;
                let existingIndex = imageReferences.findIndex((reference) => {
                  if (typeof reference == `string`) return !tianjiPortraitAssetId && !assetId && !arkTrustedAssetId && value && reference === value;
                  if (tianjiPortraitAssetId) return String(reference?.tianjiPortraitAssetId || ``).trim() === tianjiPortraitAssetId;
                  if (assetId) return wanjuanNormalizeSeedanceAssetId(reference?.seedanceAssetId || reference?.assetId) === assetId;
                  if (arkTrustedAssetId) return String(reference?.arkTrustedAssetId || ``).replace(/^asset:\/\//i, ``).trim() === arkTrustedAssetId;
                  return Boolean(value) && String(reference?.url || ``).trim() === value;
                });
                if (existingIndex >= 0) {
                  (assetId || tianjiPortraitAssetId || arkTrustedAssetId || Object.keys(seedanceMeta).length > 0) && (imageReferences[existingIndex] = entry);
                  return;
                }
                let seenKey = assetId ? `image:asset:${assetId}` : tianjiPortraitAssetId ? `image:tianji-asset:${tianjiPortraitAssetId}` : arkTrustedAssetId ? `image:ark-asset:${arkTrustedAssetId}` : `image:${value}`;
                if (wanjuanVideoReferenceSeen.has(seenKey)) return;
                wanjuanVideoReferenceSeen.add(seenKey);
                imageReferences.push(entry);
                tongyiAddReference(value, `image`);
              },
              addVideoReferenceVideo = (url) => {
                let value = String(url || ``).trim();
                if (!value || wanjuanVideoReferenceSeen.has(`video:${value}`)) return;
                wanjuanVideoReferenceSeen.add(`video:${value}`);
                videoReferences.push(value);
                tongyiAddReference(value, `video`);
              },
              tongyiAddReference = (url, kind = `image`) => {
                let trimmedUrl = String(url || ``).trim();
                if (!trimmedUrl || tongyiReferenceSeen.has(trimmedUrl)) return;
                tongyiReferenceSeen.add(trimmedUrl);
                tongyiReferenceEntries.push({
                  url: trimmedUrl,
                  kind,
                });
              };
            if (seedanceSourceNode?.data?.seedanceMode === `tianji`) {
              let stored = await wanjuanTianjiStorageGet([`tianjiSeedanceAssets`]),
                cachedAssets = stored?.tianjiSeedanceAssets || {},
                recoveredNodes = new Map();
              incomingEdges.forEach((edge) => {
                let sourceNode = nodes2.find((node) => node.id === edge.source);
                if (!sourceNode || !wanjuanHasTianjiPortraitClaim(sourceNode.data) || String(sourceNode.data?.tianjiPortraitAssetId || ``).trim()) return;
                let resolved = wanjuanTianjiResolvePortraitAssetForNodeData(sourceNode.data, cachedAssets);
                let recoveredData = wanjuanRecoverTianjiPortraitNodeData(sourceNode.data, resolved);
                if (!recoveredData) return;
                recoveredNodes.set(sourceNode.id, {
                  ...sourceNode,
                  data: recoveredData,
                });
              });
              if (recoveredNodes.size) {
                nodes2 = nodes2.map((node) => recoveredNodes.get(node.id) || node);
                setNodes((current) => current.map((node) => recoveredNodes.get(node.id) || node));
              }
            }
            incomingEdges.forEach((edge) => {
              let sourceNode = nodes2.find((node) => node.id === edge.source);
              let sourceTianjiBindingStatus = String(sourceNode?.data?.tianjiPortraitBindingStatus || ``).trim().toLowerCase(),
                sourceTianjiPortraitAssetId = String(sourceNode?.data?.tianjiPortraitAssetId || ``).trim(),
                sourceHasTianjiPortraitClaim = Boolean(sourceNode?.data?.tianjiPortraitAssetId || sourceNode?.data?.isTianjiPortrait),
                sourceIsTianjiPortrait = Boolean(sourceNode?.data?.sourceOrigin === `tianji-portrait` || sourceNode?.data?.source === `tianji-portrait` || sourceNode?.data?.type === `image/tianji-portrait`);
              if (seedanceSourceNode?.data?.seedanceMode === `tianji` && sourceHasTianjiPortraitClaim && !sourceIsTianjiPortrait)
                throw Error(`这张图片没有可验证的天玑 Active 素材来源，请从天玑人像库重新选择`);
              if (seedanceSourceNode?.data?.seedanceMode === `tianji` && sourceIsTianjiPortrait && (sourceTianjiBindingStatus !== `ready` || !sourceTianjiPortraitAssetId)) {
                let fallbackMessage =
                  sourceTianjiBindingStatus === `reviewing` ?
                  `天玑人像正在审核中，请等待审核完成后再生成` :
                  sourceTianjiBindingStatus === `failed` ?
                  `天玑人像绑定失败，请手动从天玑人像库选择后再生成` :
                  sourceTianjiBindingStatus === `pending` ?
                  `天玑人像还没有绑定素材库最终 ID，请稍后刷新天玑人像库后再生成` :
                  sourceTianjiBindingStatus !== `ready` ?
                  `天玑人像缺少 Active 状态证明，请刷新人像库后重新选择` :
                  `天玑人像缺少最终素材 ID，请刷新人像库后重新选择`;
                throw Error(sourceNode.data.tianjiPortraitBindingMessage || fallbackMessage);
              }
              if (seedanceSourceNode?.data?.seedanceMode === `tianji` && sourceNode && wanjuanHasTianjiPortraitClaim(sourceNode.data)) {
                return;
              }
              if (sourceNode?.data?.seedanceAssetId) {
                addVideoReferenceImage(wanjuanSeedanceAssetUrl(sourceNode.data.seedanceAssetId), {
                  seedanceAssetId: sourceNode.data.seedanceAssetId,
                  virtualPortraitId: sourceNode.data.virtualPortraitId,
                  isSeedanceVirtualPortrait: true,
                  sourceOrigin: sourceNode.data.sourceOrigin || `seedance-virtual-portrait`,
                });
                return;
              }
              if (sourceNode) {
                let {
                  images: images,
                  videos: videos
                } = wanjuanCollectNodeReferenceMedia(sourceNode, edge.sourceHandle);
                ![`imageNode`, `promptNode`, `gridMergeNode`].includes(sourceNode.type) &&
                  (images || []).forEach(addVideoReferenceImage);
                (videos || []).forEach(addVideoReferenceVideo);
              }
              if (
                sourceNode &&
                (sourceNode.type === `imageNode` ||
                  sourceNode.type === `promptNode` ||
                  sourceNode.type === `gridMergeNode`) &&
                (sourceNode.data.imageUrl || sourceNode.data.seedanceAssetId)
              ) {
                let imageUrl = sourceNode.data.imageUrl || ``,
                  arkReferenceMeta = {
                    arkTrustedAssetId: sourceNode.data.arkTrustedAssetId,
                    arkTrustedAssetGroupId: sourceNode.data.arkTrustedAssetGroupId,
                    arkTrustedAssetContentHash: sourceNode.data.arkTrustedAssetContentHash,
                    arkTrustedAssetSourceUrl: sourceNode.data.arkTrustedAssetSourceUrl,
                    arkTrustedAssetStatus: sourceNode.data.arkTrustedAssetStatus,
                    nodeId: sourceNode.id,
                    label: sourceNode.data.label,
                    localPath: sourceNode.data.localPath || sourceNode.data.filePath,
                    filename: sourceNode.data.originalName,
                  };
                sourceNode.data.seedanceAssetId ?
                  addVideoReferenceImage(wanjuanSeedanceAssetUrl(sourceNode.data.seedanceAssetId), {
                    seedanceAssetId: sourceNode.data.seedanceAssetId,
                    virtualPortraitId: sourceNode.data.virtualPortraitId,
                    isSeedanceVirtualPortrait: sourceNode.data.isSeedanceVirtualPortrait,
                    sourceOrigin: sourceNode.data.sourceOrigin,
                  }) :
                  sourceNode.data.tianjiPortraitAssetId ?
                  addVideoReferenceImage(imageUrl, {
                    ...arkReferenceMeta,
                    tianjiPortraitAssetId: sourceNode.data.tianjiPortraitAssetId,
                    tianjiPortraitGroupType: sourceNode.data.tianjiPortraitGroupType,
                    tianjiPortraitPreviewUrl: sourceNode.data.tianjiPortraitPreviewUrl,
                    tianjiPortraitBindingStatus: sourceNode.data.tianjiPortraitBindingStatus,
                    tianjiPortraitBindingMessage: sourceNode.data.tianjiPortraitBindingMessage,
                    isTianjiPortrait: true,
                    sourceOrigin: sourceNode.data.sourceOrigin || `tianji-portrait`,
                  }) :
                  imageUrl.startsWith(`data:image/`) ||
                  /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(imageUrl) ?
                  addVideoReferenceImage(imageUrl, {
                    ...arkReferenceMeta,
                    seedanceAssetId: sourceNode.data.seedanceAssetId,
                    virtualPortraitId: sourceNode.data.virtualPortraitId,
                    isSeedanceVirtualPortrait: sourceNode.data.isSeedanceVirtualPortrait,
                  }) :
                  (imageUrl.startsWith(`data:video/`) ||
                    /\.(mp4|webm|mov|ogg)($|\?)/i.test(imageUrl)) &&
                  addVideoReferenceVideo(imageUrl);
              } else if (
                sourceNode &&
	                (sourceNode.type === `videoNode` || sourceNode.type === `videoExtractNode` || sourceNode.type === `videoFaceBlurNode`) &&
                sourceNode.data.videoUrl
              ) {
                let videoUrl = sourceNode.data.videoUrl;
                addVideoReferenceVideo(videoUrl);
              } else if (sourceNode && sourceNode.type === `audioNode` && sourceNode.data.audioUrl) {
                let audioUrl = sourceNode.data.audioUrl;
                seedanceAudioRefs.push(audioUrl);
              } else if (
                sourceNode &&
                sourceNode.type === `videoExtractNode` &&
                sourceNode.data.allExtractedImages
              )
                if (edge.sourceHandle && edge.sourceHandle.startsWith(`frame-`)) {
                  let frameIndex = parseInt(edge.sourceHandle.replace(`frame-`, ``), 10);
                  if (!(sourceNode.data.hiddenIndices || []).includes(frameIndex)) {
                    let extractedImages = sourceNode.data.allExtractedImages;
                    extractedImages && extractedImages[frameIndex] && addVideoReferenceImage(extractedImages[frameIndex]);
                  }
                } else
                  sourceNode.data.extractedImages.forEach((image) => {
                    addVideoReferenceImage(image);
                  });
              if (sourceNode && sourceNode.type === `customNode` && sourceNode.data.resultData) {
                let resultData = sourceNode.data.resultData;
                sourceNode.data.config?.outputType === `image` ?
                  Array.isArray(resultData) ?
                  resultData.forEach((item) => {
                    typeof item == `string` && addVideoReferenceImage(item);
                  }) :
                  typeof resultData == `string` && addVideoReferenceImage(resultData) :
                  sourceNode.data.config?.outputType === `text` &&
	                  promptParts.push(
	                    typeof resultData == `object` ?
	                    JSON.stringify(resultData, null, 2) :
	                    String(resultData),
	                  );
	              } else
	                sourceNode && sourceNode.type === `textNode` && sourceNode.data.text && promptParts.push(sourceNode.data.text);
	            });
	            let matchedNodeForUpdate = nodes2.find((node) => node.id === nodeId);
	            const tianjiManualPortraitInputs = seedanceSourceNode?.data?.seedanceMode === `tianji`
	              ? wanjuanCollectTianjiManualPortraitInputs({
	                  nodes: nodes2,
	                  incomingEdges,
	                  contextResources: matchedNodeForUpdate?.data?.selectedContextResources,
	                })
	              : null;
	            matchedNodeForUpdate &&
	              matchedNodeForUpdate.data.selectedContextResources &&
	              matchedNodeForUpdate.data.selectedContextResources.forEach((resource, resourceIndex) => {
	                if (tianjiManualPortraitInputs?.claimedContextIndexes.has(resourceIndex)) return;
	                wanjuanResourceKind(resource) === `image` ?
	                  addVideoReferenceImage(resource) :
	                  wanjuanResourceKind(resource) === `video` ?
	                  addVideoReferenceVideo(resource.url || resource.localPath || resource.path) :
	                  wanjuanResourceKind(resource) === `audio` &&
	                  seedanceAudioRefs.push(resource.url || resource.localPath || resource.path);
              });
	            // Take the snapshots only after connected/context resources have all been collected.
	            // Otherwise resources added from the context picker are omitted from Tianji payloads.
	            let seedanceConnectedImageRefs = wanjuanExcludeTianjiPortraitPreviews(
	                imageReferences,
	                tianjiManualPortraitInputs?.portraitPreviewUrls,
	              ),
	              seedanceConnectedVideoRefs = [...videoReferences],
	              seedanceConnectedAudioRefs = [...seedanceAudioRefs],
	              seedanceConnectedPortraitAssetIds = [...(tianjiManualPortraitInputs?.portraitAssetIds || [])];
            if (seedanceSourceNode?.type === `tongyiWanxiangNode`) {
              let tongyiMode =
                  seedanceSourceNode?.data?.tongyiWanxiangMode || `text-to-video`,
                tongyiPrompt =
                promptParts.length > 0 ?
                `${promptParts.join(`
`)}\n${prompt}` :
                prompt,
                tongyiSize = normalizeVideoAspectRatioValue(
                  resolution || seedanceSourceNode?.data?.size || `16:9`,
                  seedanceSourceNode?.data?.selectedResolution || `1280x720`,
                ),
                tongyiDuration =
                parseInt(
                  String(
                    duration ||
                    seedanceSourceNode?.data?.selectedSeconds ||
                    seedanceSourceNode?.data?.videoDurations
                    ?.split(/[\s,，、]+/)[0]
                    ?.trim() ||
                    2,
                  ),
                  10,
                ) || 2,
                tongyiUploadMode =
                seedanceSourceNode?.data?.seedanceUploadMode ||
                seedanceUploadMode ||
                `public`,
                tongyiTosConfig =
                seedanceSourceNode?.data?.tosConfig || tosConfig || {},
                tongyiCustomUploadConfig =
                seedanceSourceNode?.data?.customPublicUploadConfig ||
                customPublicUploadConfig ||
                {},
                tongyiQiniuConfig =
                seedanceSourceNode?.data?.qiniuConfig ||
                qiniuConfig ||
                {},
                tongyiNormalizePublicMediaUrl = async (url, mediaKind = `image`) => {
                  if (typeof url != `string`) return ``;
                  let trimmedUrl = url.trim();
                  if (!trimmedUrl) return ``;
                  if (/^https?:\/\//i.test(trimmedUrl)) return trimmedUrl;
                  if (
                    !window.wanjuanDesktop ||
                    (typeof window.wanjuanDesktop.uploadPublicMedia != `function` &&
                      typeof window.wanjuanDesktop.uploadTosMedia != `function` &&
                      typeof window.wanjuanDesktop.uploadCustomPublicMedia != `function`)
                  )
                    throw Error(`通义万相参考${mediaKind === `video` ? `视频` : mediaKind === `audio` ? `音频` : `图片`}必须是公网 URL`);
                  let fileName = `${String(modelName || `wanxiang`).replace(/[^a-z0-9_-]+/gi, `-`)}-${mediaKind}-${Date.now()}`,
                    uploadStrategies = [];
                  tongyiUploadMode === `custom` &&
                    /^https?:\/\//i.test(String(tongyiCustomUploadConfig?.endpoint || ``)) &&
                    typeof window.wanjuanDesktop.uploadCustomPublicMedia == `function` &&
                    uploadStrategies.push({
                      label: `自定义公网直链`,
                      run: () =>
                        window.wanjuanDesktop.uploadCustomPublicMedia({
                          url: trimmedUrl,
                          kind: mediaKind,
                          filename: fileName,
                          customUpload: tongyiCustomUploadConfig,
                        }),
                    });
                  tongyiUploadMode === `qiniu` &&
                    String(tongyiQiniuConfig?.accessKey || tongyiQiniuConfig?.accessKeyId || ``).trim() &&
                    String(tongyiQiniuConfig?.secretKey || tongyiQiniuConfig?.secretAccessKey || ``).trim() &&
                    String(tongyiQiniuConfig?.bucket || ``).trim() &&
                    String(tongyiQiniuConfig?.endpoint || ``).trim() &&
                    typeof window.wanjuanDesktop.uploadQiniuMedia == `function` &&
                    uploadStrategies.push({
                      label: `七牛云`,
                      run: () =>
                        window.wanjuanDesktop.uploadQiniuMedia({
                          url: trimmedUrl,
                          kind: mediaKind,
                          filename: fileName,
                          qiniu: tongyiQiniuConfig,
                        }),
                    });
                  String(tongyiTosConfig?.accessKeyId || tongyiTosConfig?.accessKey || ``).trim() &&
                    String(tongyiTosConfig?.secretAccessKey || tongyiTosConfig?.secretKey || ``).trim() &&
                    String(tongyiTosConfig?.bucket || ``).trim() &&
                    typeof window.wanjuanDesktop.uploadTosMedia == `function` &&
                    uploadStrategies.push({
                      label: `火山 TOS`,
                      run: () =>
                        window.wanjuanDesktop.uploadTosMedia({
                          url: trimmedUrl,
                          kind: mediaKind,
                          filename: fileName,
                          tos: tongyiTosConfig,
                        }),
                    });
                  typeof window.wanjuanDesktop.uploadPublicMedia == `function` &&
                    uploadStrategies.push({
                      label: `公网临时链接`,
                      run: () =>
                        window.wanjuanDesktop.uploadPublicMedia({
                          url: trimmedUrl,
                          kind: mediaKind,
                          filename: fileName,
                        }),
                    });
                  let errors = [];
                  for (let strategy of uploadStrategies)
                    try {
                      showToast(`正在上传通义万相参考${mediaKind === `video` ? `视频` : mediaKind === `audio` ? `音频` : `图片`}到${strategy.label}...`);
                      let uploadResult = await strategy.run();
                      if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                      errors.push(`${strategy.label}: ${uploadResult?.error || `上传失败`}`);
                    } catch (error) {
                      errors.push(`${strategy.label}: ${error?.message || error}`);
                    }
                  throw Error(
                    errors.length > 0 ?
                    `通义万相参考${mediaKind === `video` ? `视频` : mediaKind === `audio` ? `音频` : `图片`}上传失败：${errors.join(`；`)}` :
                    `通义万相参考${mediaKind === `video` ? `视频` : mediaKind === `audio` ? `音频` : `图片`}上传失败`,
                  );
                };
              if (!tongyiPrompt.trim())
                throw Error(`请输入通义万相提示词`);
              // 通义万相用节点按当前模式选择的模型，而不是全局视频模型（否则会回退成 grok 默认，导致中转站收到 grok-* 模型）
              let tongyiModelListText =
                  tongyiMode === `reference-image-to-video` ? seedanceSourceNode?.data?.tongyiWanxiangReferenceImageModels :
                  tongyiMode === `image-to-video` ? seedanceSourceNode?.data?.tongyiWanxiangImageModels :
                  tongyiMode === `video-edit` ? seedanceSourceNode?.data?.tongyiWanxiangEditModels :
                  seedanceSourceNode?.data?.tongyiWanxiangTextModels,
                tongyiModelList = String(tongyiModelListText || ``).split(/[\n,，、]+/).map((item) => item.trim()).filter(Boolean),
                tongyiSelectedModel = String(seedanceSourceNode?.data?.selectedModel || ``).trim(),
                tongyiModelName = tongyiSelectedModel && tongyiModelList.includes(tongyiSelectedModel) ? tongyiSelectedModel : tongyiModelList[0] || tongyiSelectedModel;
              if (!tongyiModelName)
                throw Error(`请先在「设置 → 通义万相」里为当前模式配置模型（该模式的模型列表为空）`);
              modelName = tongyiModelName;
              let formData = new FormData();
              formData.append(`model`, modelName);
              formData.append(`prompt`, tongyiPrompt);
              if (
                tongyiMode === `reference-image-to-video` ||
                tongyiMode === `image-to-video` ||
                tongyiMode === `video-edit`
              ) {
                // input_reference 图片和视频都可以：统一转公网直链后,用英文逗号分隔的数组传
                // 参考项可能是字符串URL,也可能是对象(如已绑定天玑素材),统一取出 url 字符串
                let refUrlOf = (r) => (typeof r === `string` ? r : r?.url || ``);
                if (tongyiMode === `video-edit` && !videoReferences.length && !imageReferences.length)
                  throw Error(`视频编辑需要连接参考图片或视频节点`);
                let reference =
                  tongyiMode === `video-edit` ?
                  videoReferences[0] || imageReferences[0] :
                  tongyiMode === `image-to-video` ?
                  imageReferences[0] || videoReferences[0] :
                  tongyiReferenceEntries[0]?.url || imageReferences[0] || videoReferences[0];
                if (!reference && tongyiMode !== `video-edit`)
                  throw Error(`当前通义万相模式需要连接至少一张参考图`);
                if (tongyiMode === `reference-image-to-video` || tongyiMode === `video-edit`) {
                  let referenceEntries =
                    tongyiMode === `video-edit` ?
                    [
                      ...videoReferences.map((r) => ({ url: refUrlOf(r), kind: `video` })),
                      ...imageReferences.map((r) => ({ url: refUrlOf(r), kind: `image` })),
                    ] :
                    tongyiReferenceEntries.length > 0 ? tongyiReferenceEntries : [{
                      url: refUrlOf(reference),
                      kind: videoReferences.includes(reference) ? `video` : `image`,
                    }],
                    referenceUrls = [];
                  for (let entry of referenceEntries) {
                    let normalizedUrl = await tongyiNormalizePublicMediaUrl(refUrlOf(entry.url), entry.kind || `image`);
                    normalizedUrl && referenceUrls.push(normalizedUrl);
                  }
                  if (referenceUrls.length === 0)
                    throw Error(`当前通义万相模式需要连接至少一张参考图或视频`);
                  formData.append(`input_reference`, referenceUrls.join(`,`));
                } else
                  formData.append(
                    `input_reference`,
                    await tongyiNormalizePublicMediaUrl(
                      refUrlOf(reference),
                      videoReferences.includes(reference) ? `video` : `image`,
                    ),
                  );
              }
              if (seedanceAudioRefs[0]) {
                let audioUrl = await tongyiNormalizePublicMediaUrl(
                  seedanceAudioRefs[0],
                  `audio`,
                );
                formData.append(
                  tongyiMode === `text-to-video` ? `audio_url` : `input_audio`,
                  audioUrl,
                );
              }
              (tongyiMode === `text-to-video` ||
                tongyiMode === `reference-image-to-video`) &&
                formData.append(`size`, tongyiSize);
              formData.append(`seconds`, String(tongyiDuration));
              tongyiMode !== `reference-image-to-video` &&
                formData.append(`prompt_extend`, `true`);
              tongyiMode === `video-edit` && formData.append(`watermark`, `false`);
              let apiUrl = videoBuildApiUrl(videoBaseUrl, `/v1/videos`),
                abortController = new AbortController();
              abortControllersRef.current.set(nodeId, abortController);
              console.info(
                `Sending Tongyi Wanxiang request: ${JSON.stringify({
                  modelName: modelName,
                  mode: tongyiMode,
                  submitUrl: apiUrl,
                  size: tongyiSize,
                  seconds: tongyiDuration,
                })}`,
              );
              let response = await fetch(apiUrl, {
                method: `POST`,
                headers: {
                  Authorization: `Bearer ${videoKey}`
                },
                body: formData,
                signal: abortController.signal,
              });
              if (!response.ok) {
                let errorMessage = `API 请求失败: ${response.status} ${response.statusText}`;
                try {
                  let errorData = await response.json();
                  errorMessage =
                    errorData.error && errorData.error.message ?
                    `API 请求失败: ${errorData.error.message}` :
                    errorData.message ?
                    `API 请求失败: ${errorData.message}` :
                    `API 请求失败: ${response.status} - ${serializeErrorPreview(errorData)}`;
                } catch {
                  try {
                    let errorText = await response.text();
                    errorMessage = `API 请求失败: ${response.status} - ${serializeErrorPreview(errorText)}`;
                  } catch {}
                }
                throw Error(errorMessage);
              }
              let responseData = await response.json();
              if (responseData.error) throw Error(responseData.error.message || `提交任务失败`);
              let taskId =
                responseData.id ||
                responseData.task_id ||
                responseData.taskId ||
                responseData.data?.id ||
                responseData.data?.task_id ||
                responseData.data?.taskId;
              if (!taskId) throw Error(`通义万相提交成功但未返回任务 ID`);
              createdVideoTaskId = taskId;
              (updateTaskList &&
                updateTaskList((tasks) => [
                  ...tasks,
                  {
                    id: taskId,
                    type: `video`,
                    provider: `tongyi-wanxiang`,
                    apiBaseUrl: videoBaseUrl,
                    apiConfigId: videoConfig?.id,
                    modelName: modelName,
                    projectId: projectIdAtStart,
                    nodeId: nodeId,
                    status: `pending`,
                    progress: 0,
                    createdAt: Date.now(),
                    prompt: prompt,
                  },
                ]),
                setNodes((nodes3) =>
                  nodes3.map((node) =>
                    node.id === nodeId ?
	                    {
	                      ...node,
	                      data: {
	                        ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                        taskId: taskId,
	                        videoUrl: undefined,
	                        thumbnailUrl: undefined,
	                        resultData: undefined
	                      }
	                    } :
                    node,
                  ),
	                ),
	                await persistVideoNodeState({}, {
	                  taskId: taskId,
	                  videoUrl: undefined,
	                  thumbnailUrl: undefined,
	                  resultData: undefined
	                }, {
	                  clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	                }),
                localStorage.setItem(dailyLimitKey, (edgesList + 1).toString()),
                setDailyGenerationCount(edgesList + 1),
                showToast(`通义万相任务提交成功，正在生成中...`));
              let isDone = false,
                pollCount = 0,
                errorCount = 0,
                timeoutMs = Math.max(5e3, (Number(timeoutSeconds) || 600) * 1e3),
                startTime = Date.now(),
                maxPolls = Math.max(1, Math.ceil(timeoutMs / Math.max(Number(pollIntervalMs) || 3e3, 500)));
              for (; !isDone;) {
                if (abortController.signal.aborted) throw Error(`生成已取消`);
                if (Date.now() - startTime >= timeoutMs)
                  throw Error(`通义万相视频生成超时，请在设置中增大全局异步轮询最大时长后重试`);
                (await new Promise((resolve) => setTimeout(resolve, pollIntervalMs)),
                  pollCount++,
                  pollCount % 120 == 0 &&
                  pollCount < maxPolls &&
                  showToast(`通义万相视频生成仍在进行中，请耐心等待...`));
                try {
                  let pollResponse = await fetch(videoBuildApiUrl(videoBaseUrl, `/v1/videos/${taskId}`), {
                    headers: {
                      Authorization: `Bearer ${videoKey}`
                    },
                  });
                  if (!pollResponse.ok) throw Error(`Polling failed: ${pollResponse.status}`);
                  let pollData = await pollResponse.json(),
                    status = String(pollData.status || pollData.data?.status || ``)
                    .trim()
                    .toLowerCase(),
                    tongyiVideoUrl =
                    pollData.video_url ||
                    pollData.videoUrl ||
                    pollData.data?.video_url ||
                    pollData.data?.videoUrl ||
                    pollData.output?.video_url ||
                    pollData.output?.videoUrl ||
                    pollData.result?.video_url ||
                    pollData.result?.videoUrl ||
                    pollData.url,
                    tongyiProgress =
                    pollData.progress !== undefined && pollData.progress !== null ?
                    parseInt(pollData.progress) :
                    pollData.data?.progress !== undefined && pollData.data?.progress !== null ?
                    parseInt(pollData.data.progress) :
                    Math.min(99, pollCount * 2);
                  if (
                    ((errorCount = 0),
                      [`completed`, `success`, `succeeded`, `done`].includes(
                        status,
                      ) || tongyiVideoUrl)
                  ) {
                    isDone = true;
                    let videoUrl =
                      typeof tongyiVideoUrl == `string` ?
                      tongyiVideoUrl.replace(/[`\s]/g, ``) :
                      ``;
                    if (!videoUrl) throw Error(`通义万相任务已完成，但未返回视频地址`);
                    updateTaskList &&
                      updateTaskList((nodes3) =>
                        nodes3.map((node) =>
                          node.id === taskId ?
                          {
                            ...node,
                            status: `completed`,
                            progress: 100,
                            resultUrl: videoUrl,
                          } :
                          node,
                        ),
                      );
                    let width = 320,
                      height = 320,
                      tongyiNodeRatio = null,
                      sizeMatch = String(tongyiSize || `16:9`)
                      .trim()
                      .match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
                    if (sizeMatch) {
                      let ratioWidth = Number(sizeMatch[1]),
                        ratioHeight = Number(sizeMatch[2]);
                      if (!isNaN(ratioWidth) && !isNaN(ratioHeight) && ratioHeight > 0) {
                        let ratio = ratioWidth / ratioHeight;
                        (tongyiNodeRatio = `${ratioWidth} / ${ratioHeight}`),
                        ratio > 1 ?
                          ((width = Math.min(600, Math.max(320, 360 * ratio))),
                            (height = width / ratio)) :
                          ratio < 1 ?
                          ((height = 420), (width = height * ratio)) :
                          ((height = 320), (width = height));
                      }
                    }
                    (setNodes((nodes3) =>
                        nodes3.map((node) =>
                          node.id === nodeId ?
                          {
                            ...node,
                            style: {
                              ...node.style,
                              width: width,
                              height: height + 24
	                            },
	                            data: {
	                              ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                              videoUrl: videoUrl,
                              videoAspectRatio: tongyiNodeRatio,
                              loading: false,
                              progress: 100,
                              errorMessage: undefined,
                            },
                          } :
                          node,
                        ),
                      ),
                      await persistVideoNodeState({
                        width: width,
                        height: height + 24
                      }, {
                        videoUrl: videoUrl,
                        videoAspectRatio: tongyiNodeRatio,
                        loading: false,
	                        progress: 100,
	                        errorMessage: undefined,
	                      }, {
	                        clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	                      }),
                      setEdges((edges2) =>
                        edges2.map((edge) => (edge.target === nodeId ? {
                          ...edge,
                          animated: false
                        } : edge)),
                      ),
                      addGeneratedAsset && videoUrl && addGeneratedAsset(videoUrl, `video`, `generated`),
                      showToast(`通义万相视频生成成功！`));
                    break;
                  }
                  if (
                    [`failed`, `error`, `fail`, `canceled`, `cancelled`, `rejected`].includes(
                      status,
                    )
                  )
                    throw Error(`[TONGYI_TASK_FAILED]${extractVideoTaskErrorHelper(pollData)}`);
                  tongyiProgress = Math.min(
                    99,
                    Math.max(0, isNaN(tongyiProgress) ? pollCount * 2 : tongyiProgress),
                  );
                  (updateTaskList &&
                    updateTaskList((nodes3) =>
                      nodes3.map((node) =>
                        node.id === taskId ?
                        updateTaskRunningProgress(node, tongyiProgress) :
                        node,
                      ),
                    ),
                    setNodes((nodes3) =>
                      nodes3.map((node) =>
                        node.id === nodeId ?
                        {
                          ...node,
                          data: {
                            ...node.data,
                            progress: tongyiProgress
                          }
                        } :
                        node,
                      ),
                    ));
                } catch (error) {
                  if (
                    (console.warn(`Tongyi Wanxiang polling error:`, error),
                      error?.message &&
                      error.message.startsWith(`[TONGYI_TASK_FAILED]`))
                  )
                    throw Error(error.message.replace(`[TONGYI_TASK_FAILED]`, ``));
                  (errorCount++,
                    errorCount === 5 &&
                    showToast(`通义万相状态查询暂时失败，仍会继续重试...`));
                }
              }
              return;
            }
            if (isSeedanceNode) {
              if (seedanceSourceNode?.data?.seedanceMode === `tianji`) {
                await wanjuanRunTianjiSeedanceVideo({
                  nodeId: nodeId,
                  prompt: prompt,
                  extraPrompts: promptParts,
                  selectedSize: resolution,
                  selectedDuration: duration,
                  sourceNode: seedanceSourceNode,
	                  imageRefs: seedanceConnectedImageRefs,
	                  portraitAssetIds: seedanceConnectedPortraitAssetIds,
	                  reviewedPortraitClaimCount: tianjiManualPortraitInputs?.reviewedPortraitClaimCount || 0,
	                  reviewedPortraitPreviewUrls: [...(tianjiManualPortraitInputs?.portraitPreviewUrls || [])],
                  videoRefs: seedanceConnectedVideoRefs,
                  audioRefs: seedanceConnectedAudioRefs,
                  updateNodes: setNodes,
                  updateEdges: setEdges,
                  updateGlobalTasks: updateTaskList,
                  addTransitResource: addGeneratedAsset,
                  showToast: showToast,
                  abortControllers: abortControllersRef,
                  pollingInterval: pollIntervalMs,
                  maxPollingDuration: timeoutSeconds,
                  projectIdAtStart: projectIdAtStart,
                  persistVideoNodeState: persistVideoNodeState,
                  dailyKey: dailyLimitKey,
                  dailyCount: edgesList,
                  setDailyCount: setDailyGenerationCount,
                });
                return;
              }
              let seedancePrompt =
	                promptParts.length > 0 ?
	                `${promptParts.join(`
	`)}\n${prompt}` :
	                prompt,
	                seedanceApiPrompt = wanjuanNormalizeMentionTokensForApi(seedancePrompt),
	                seedanceRatio = String(resolution || ``).includes(`:`) ?
                String(resolution) :
                ((size) => {
                  let [width, height] = String(size || ``)
                    .split(`x`)
                    .map((size2) => parseInt(size2, 10));
                  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return `16:9`;
                  let gcd = (gcdNumA, gcdNumB) => (gcdNumB === 0 ? gcdNumA : gcd(gcdNumB, gcdNumA % gcdNumB)),
                    gcd2 = gcd(width, height);
                  return `${width / gcd2}:${height / gcd2}`;
                })(resolution),
                seedanceResolution =
                seedanceSourceNode?.data?.selectedResolution ||
                seedanceSourceNode?.data?.seedanceResolutions
                ?.split(/[\s,，、]+/)[0]
                ?.trim() ||
                ((resolution2) => {
                  let [width, height] = String(resolution2 || ``)
                    .split(`x`)
                    .map((resolution3) => parseInt(resolution3, 10));
                  return !isNaN(width) && !isNaN(height) && Math.max(width, height) >= 1920 ?
                    `1080p` :
                    `720p`;
                })(resolution),
                seedanceDuration =
                parseInt(
                  String(
                    seedanceSourceNode?.data?.selectedSeconds ||
                    seedanceSourceNode?.data?.videoDurations
                    ?.split(/[\s,，、]+/)[0]
                    ?.trim() ||
                    10,
                  ),
                  10,
                ) || 10,
                seedanceContent = [];
		              let seedanceMentionMap = new Map(),
		                seedanceUsedUrls = new Set(),
		                seedanceSkippedMedia = {
		                  image: 0,
		                  video: 0,
		                  audio: 0
                },
                seedanceAttemptedMedia = {
                  image: 0,
                  video: 0,
                  audio: 0
                },
                seedanceAcceptedMedia = {
                  image: 0,
                  video: 0,
                  audio: 0
                },
                seedanceBuildMediaEntry = (input, defaultKind = `image`) => {
                  let entry =
                      input && typeof input == `object` ?
                      {
                        ...input
                      } :
                      {
                        url: input
                      },
                    assetId = wanjuanNormalizeSeedanceAssetId(entry.seedanceAssetId || entry.assetId),
                    url = String(entry.url || entry.localPath || entry.path || entry.imageUrl || entry.thumbnailUrl || ``).trim();
                  return {
                    ...entry,
                    kind: entry.kind || defaultKind,
                    url: url,
                    seedanceAssetId: assetId || undefined,
                  };
                },
                seedanceMediaKey = (source, kind) => {
                  let entry = seedanceBuildMediaEntry(source, kind),
                    assetId = wanjuanNormalizeSeedanceAssetId(entry.seedanceAssetId);
                  return assetId ? `${entry.kind || kind}:asset:${assetId}` : `${entry.kind || kind}:${entry.url || ``}`;
                },
			                seedanceAddMention = (mention, kind, source) => {
		                  let entry = seedanceBuildMediaEntry(source, kind);
		                  mention && kind && (entry.url || entry.seedanceAssetId) && !seedanceMentionMap.has(mention) && seedanceMentionMap.set(mention, entry);
		                },
		                seedanceAddNumberedMention = (kind, index, entry) => {
		                  let typeLabel =
		                    kind === `video` ? `视频` : kind === `audio` ? `音频` : `图片`,
		                    mentionLabel = `${typeLabel}${index + 1}`,
		                    mentionToken = wanjuanFormatMentionToken(mentionLabel);
		                  (seedanceAddMention(mentionToken, kind, entry),
		                    seedanceAddMention(wanjuanLegacyMentionToken(mentionToken), kind, entry));
		                },
                seedanceIsPublicUrl = (url) => {
                  try {
                    let urlObj = new URL(url),
                      hostname = urlObj.hostname.toLowerCase();
                    if (urlObj.protocol !== `http:` && urlObj.protocol !== `https:`) return false;
                    if (hostname === `localhost` || hostname.endsWith(`.localhost`)) return false;
                    if (hostname === `::1` || hostname === `[::1]`) return false;
                    let ipMatch = hostname.match(/^\d+\.\d+\.\d+\.\d+$/);
                    if (ipMatch) {
                      let [firstOctet, secondOctet] = hostname.split(`.`).map(Number);
                      return !(
                        firstOctet === 10 ||
                        (firstOctet === 127 && secondOctet >= 0) ||
                        (firstOctet === 192 && secondOctet === 168) ||
                        (firstOctet === 169 && secondOctet === 254) ||
                        (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31)
                      );
                    }
                    return true;
                  } catch {
                    return false;
                  }
                },
                seedanceIsArkMediaRef = (url) =>
                /^asset:\/\//i.test(String(url || ``)) || seedanceIsPublicUrl(url),
                seedanceLooksLikeDirectMediaUrl = (url, kind) => {
                  try {
                    let urlObj = new URL(url),
                      pathname = decodeURIComponent(urlObj.pathname || ``).toLowerCase(),
                      queryString = decodeURIComponent(urlObj.search || ``).toLowerCase(),
                      pathAndQuery = `${pathname}${queryString}`;
                    return kind === `video` ?
                      /\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|[?#])/i.test(pathAndQuery) ||
                      /(?:^|[?&])(?:mime|content[-_]?type|response-content-type)=video(?:\/|%2f)/i.test(queryString) ||
                      /(?:^|[?&])filename=[^&]+\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|&)/i.test(queryString) :
                      kind === `audio` ?
                      /\.(mp3|wav|m4a|aac|ogg|flac|mpeg)(?:$|[?#])/i.test(pathAndQuery) ||
                      /(?:^|[?&])(?:mime|content[-_]?type|response-content-type)=audio(?:\/|%2f)/i.test(queryString) ||
                      /(?:^|[?&])filename=[^&]+\.(mp3|wav|m4a|aac|ogg|flac|mpeg)(?:$|&)/i.test(queryString) :
                      true;
                  } catch {
                    return false;
                  }
                },
                seedanceUploadPublicMedia = async (url, kind = `video`) => {
                    let uploadMode =
                      seedanceSourceNode?.data?.seedanceUploadMode ||
                      `public`,
                      tosConfig2 = seedanceSourceNode?.data?.tosConfig || {},
                      qiniuUploadConfig = seedanceSourceNode?.data?.qiniuConfig || {},
                      hasQiniuConfig = !!(
                        String(
                          qiniuUploadConfig.accessKey || qiniuUploadConfig.accessKeyId || ``
                        ).trim() &&
                        String(
                          qiniuUploadConfig.secretKey || qiniuUploadConfig.secretAccessKey || ``
                        ).trim() &&
                        String(qiniuUploadConfig.bucket || ``).trim() &&
                        String(qiniuUploadConfig.endpoint || ``).trim()
                      ),
                      hasTosConfig = !!(
                        String(
                          tosConfig2.accessKeyId || tosConfig2.accessKey || ``
                        ).trim() &&
                        String(
                          tosConfig2.secretAccessKey || tosConfig2.secretKey || ``
                        ).trim() &&
                        String(tosConfig2.bucket || ``).trim()
                      );
                    if (
                      uploadMode === `tos` &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadTosMedia == `function`
                    )
                      try {
                        showToast(`正在上传 Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}到火山 TOS...`);
                        let uploadResult = await window.wanjuanDesktop.uploadTosMedia({
                          url: url,
                          kind: kind,
                          filename: `seedance-reference-${Date.now()}`,
                          tos: tosConfig2,
                        });
                        if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                        throw Error(uploadResult?.error || `上传失败`);
                      } catch (error) {
                        console.error(`Seedance TOS media upload failed:`, error);
                        showToast(`火山 TOS 上传失败，正在改用公网临时链接...`);
                      }
                    if (
                      uploadMode === `qiniu` &&
                      hasQiniuConfig &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadQiniuMedia == `function`
                    )
                      try {
                        showToast(`正在上传 Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}到七牛云...`);
                        let uploadResult = await window.wanjuanDesktop.uploadQiniuMedia({
                          url: url,
                          kind: kind,
                          filename: `seedance-reference-${Date.now()}`,
                          qiniu: qiniuUploadConfig,
                        });
                        if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                        throw Error(uploadResult?.error || `上传失败`);
                      } catch (error) {
                        console.error(`Seedance Qiniu media upload failed:`, error);
                        showToast(`七牛云上传失败，正在改用公网临时链接...`);
                      }
                    if (
                      uploadMode === `custom` &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadCustomPublicMedia == `function`
                    )
                      try {
                        showToast(`正在上传 Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}到自定义公网直链...`);
                        let uploadResult = await window.wanjuanDesktop.uploadCustomPublicMedia({
                          url: url,
                          kind: kind,
                          filename: `seedance-reference-${Date.now()}`,
                          customUpload: seedanceSourceNode?.data?.customPublicUploadConfig || {},
                        });
                        if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                        throw Error(uploadResult?.error || `上传失败`);
                      } catch (error) {
                        console.error(`Seedance custom media upload failed:`, error);
                        if (
                          hasTosConfig &&
                          window.wanjuanDesktop &&
                          typeof window.wanjuanDesktop.uploadTosMedia == `function`
                        )
                          try {
                            showToast(`自定义公网直链失败，正在改用火山 TOS 上传 Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}...`);
                            let uploadResult = await window.wanjuanDesktop.uploadTosMedia({
                              url: url,
                              kind: kind,
                              filename: `seedance-reference-${Date.now()}`,
                              tos: tosConfig2,
                            });
                            if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                            throw Error(uploadResult?.error || `上传失败`);
                          } catch (error2) {
                            console.error(`Seedance custom->TOS fallback failed:`, error2);
                            throw Error(
                              `Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}上传失败：自定义公网直链失败（${serializeErrorPreview(error?.message || error, 180)}）；火山 TOS 兜底失败（${serializeErrorPreview(error2?.message || error2, 180)}）`,
                            );
                          }
                        throw Error(`Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}上传自定义公网直链失败：${serializeErrorPreview(error?.message || error, 320)}`);
                      }
                    if (
                      uploadMode !== `tos` &&
                      hasTosConfig &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadTosMedia == `function`
                    )
                      try {
                        showToast(`正在上传 Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}到火山 TOS...`);
                        let uploadResult = await window.wanjuanDesktop.uploadTosMedia({
                          url: url,
                          kind: kind,
                          filename: `seedance-reference-${Date.now()}`,
                          tos: tosConfig2,
                        });
                        if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                        throw Error(uploadResult?.error || `上传失败`);
                      } catch (error) {
                        console.error(`Seedance default->TOS upload failed:`, error);
                      }
                    if (
                      !window.wanjuanDesktop ||
                      typeof window.wanjuanDesktop.uploadPublicMedia != `function`
                    )
                      return ``;
                    try {
                      showToast(`正在上传 Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}到公网临时链接...`);
                      let uploadResult = await window.wanjuanDesktop.uploadPublicMedia({
                        url: url,
                        kind: kind,
                        filename: `seedance-reference-${Date.now()}`,
                      });
                      if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                      throw Error(uploadResult?.error || `上传失败`);
                    } catch (error) {
                      console.error(`Seedance public media upload failed:`, error);
                      throw Error(`Seedance 参考${kind === `audio` ? `音频` : kind === `image` ? `图片` : `视频`}上传公网链接失败：${error?.message || error}`);
                    }
                  },
                  seedanceNormalizeMediaUrl = async (source, kind = `image`) => {
                      let entry = seedanceBuildMediaEntry(source, kind),
                        assetId = wanjuanNormalizeSeedanceAssetId(entry.seedanceAssetId);
                      if (assetId) return wanjuanSeedanceAssetUrl(assetId);
                      if (typeof entry.url != `string`) return ``;
                      let url = entry.url.trim();
                      if (!url) return ``;
                      if (/^asset:\/\//i.test(url)) return url;
                      if (kind === `image`) {
                        let arkReference = await wanjuanResolveArkTrustedAssetReference({
                          config: arkTrustedAssetConfig,
                          entry,
                          reviewAsset: (reviewUrl, reviewEntry) => handleArkTrustedAssetReview(reviewUrl, {
                            nodeId: reviewEntry.nodeId,
                            label: reviewEntry.label || `即梦参考图`,
                            localPath: reviewEntry.localPath || reviewEntry.filePath,
                            filename: reviewEntry.filename || reviewEntry.originalName,
                            silent: true,
                          }),
                        });
                        if (/^asset:\/\//i.test(arkReference.url || ``)) return arkReference.url;
                        url = String(arkReference.url || url).trim();
                      }
                      if (!/^https?:\/\//i.test(url)) url = await seedanceUploadPublicMedia(url, kind);
                      if (!seedanceIsArkMediaRef(url)) url = await seedanceUploadPublicMedia(url, kind);
                      if (!url || !seedanceIsArkMediaRef(url))
                        return (
                          seedanceSkippedMedia[kind] = (seedanceSkippedMedia[kind] || 0) + 1,
                          console.warn(`Seedance skipped non-public ${kind} URL:`, source),
                          ``
                        );
                      return url;
                    },
                    seedancePushMedia = async (media) => {
                      let mediaEntry = seedanceBuildMediaEntry(media, media?.kind || `image`);
                      if (
                        (mediaEntry.isSeedanceVirtualPortrait ||
                          mediaEntry.source === `seedance-virtual-portrait` ||
                          mediaEntry.sourceOrigin === `seedance-virtual-portrait`) &&
                        !mediaEntry.seedanceAssetId
                      )
                        throw Error(`虚拟人像缺少 Asset ID，请在设置中补全后再生成`);
                      if (!mediaEntry.url && !mediaEntry.seedanceAssetId) return;
                      let kind = mediaEntry.kind || `image`,
                        mediaKey = seedanceMediaKey(mediaEntry, kind);
                      seedanceAttemptedMedia[kind] = (seedanceAttemptedMedia[kind] || 0) + 1;
                      if (seedanceUsedUrls.has(mediaKey)) return;
                      let normalizedUrl = await seedanceNormalizeMediaUrl(mediaEntry, kind);
                      if (!normalizedUrl || seedanceUsedUrls.has(normalizedUrl)) return;
                      seedanceAcceptedMedia[kind] = (seedanceAcceptedMedia[kind] || 0) + 1;
                      (seedanceUsedUrls.add(mediaKey),
                        mediaEntry.url && seedanceUsedUrls.add(mediaEntry.url),
                        seedanceUsedUrls.add(normalizedUrl),
                        kind === `video` ?
                        seedanceContent.push({
                          type: `video_url`,
                          video_url: {
                            url: normalizedUrl
                          },
                          role: `reference_video`,
                        }) :
                        kind === `audio` ?
                        seedanceContent.push({
                          type: `audio_url`,
                          audio_url: {
                            url: normalizedUrl
                          },
                          role: `reference_audio`,
                        }) :
                        seedanceContent.push({
                          type: `image_url`,
                          image_url: {
                            url: normalizedUrl
                          },
                          role: `reference_image`,
                        }));
                    };
	              seedanceConnectedImageRefs.forEach((media, index) =>
	                seedanceAddNumberedMention(`image`, index, media),
	              );
	              seedanceConnectedVideoRefs.forEach((media, index) =>
	                seedanceAddNumberedMention(`video`, index, media),
	              );
	              seedanceConnectedAudioRefs.forEach((media, index) =>
	                seedanceAddNumberedMention(`audio`, index, media),
	              );
	              (seedanceSourceNode?.data?.selectedContextResources || []).forEach(
	                (media) => {
	                  let kind =
	                    media.type === `video` || media.type?.startsWith(`video/`) ?
	                    `video` :
	                    media.type === `audio` || media.type?.startsWith(`audio/`) ?
	                    `audio` :
	                    `image`;
	                  (seedanceAddMention(media.mention, kind, media),
	                    seedanceAddMention(wanjuanLegacyMentionToken(media.mention), kind, media));
	                },
	              );
	              let seedanceMentionPattern = /@(?:「)?(图片|视频|音频)\d+(?:」)?/g;
		              seedancePrompt.trim() &&
		                seedanceContent.push({
		                  type: `text`,
		                  text: seedanceApiPrompt,
		                });
	              if (
	                seedanceMentionMap.size > 0 &&
	                seedanceMentionPattern.test(seedancePrompt)
	              ) {
	                seedanceMentionPattern.lastIndex = 0;
	                let match;
	                for (;
	                  (match = seedanceMentionPattern.exec(seedancePrompt));) {
	                  let entry = seedanceMentionMap.get(match[0]);
	                  entry && (await seedancePushMedia(entry));
	                }
	              }
              for (let source of seedanceConnectedImageRefs.slice(0, 9))
                await seedancePushMedia({
                  ...seedanceBuildMediaEntry(source, `image`),
                  kind: `image`,
                });
              for (let url of seedanceConnectedVideoRefs.slice(0, 3))
                await seedancePushMedia({
                  url: url,
                  kind: `video`,
                });
              for (let url of seedanceConnectedAudioRefs
                  .filter((url2) => !seedanceUsedUrls.has(url2))
                  .slice(0, 3)) {
                let normalizedUrl = await seedanceNormalizeMediaUrl(url, `audio`);
                normalizedUrl &&
                  (seedanceUsedUrls.add(url),
                    seedanceUsedUrls.add(normalizedUrl),
                    seedanceContent.push({
                      type: `audio_url`,
                      audio_url: {
                        url: normalizedUrl
                      },
                      role: `reference_audio`,
                    }));
              }
              if (seedanceConnectedVideoRefs.length > 0 && seedanceSkippedMedia.video >= seedanceConnectedVideoRefs.length) {
                throw Error(`Seedance 参考视频必须是公网可访问的视频直链 URL；本地文件、blob、data、页面地址或私网地址不支持`);
              }
              if (seedanceConnectedAudioRefs.length > 0 && seedanceSkippedMedia.audio >= seedanceConnectedAudioRefs.length) {
                throw Error(`Seedance 参考音频必须是公网可访问的直链 URL；本地文件、blob、data、页面地址或私网地址不支持`);
              }
              let seedanceHasAudioReference = seedanceContent.some(
                  (part) => part?.type === `audio_url`,
                ),
                seedanceHasVisualReference = seedanceContent.some(
                  (part) =>
                  part?.type === `image_url` ||
                  part?.type === `video_url`,
                );
              if (seedanceHasAudioReference && !seedanceHasVisualReference)
                throw Error(`Seedance 音频参考不能单独使用；请同时连接至少一张参考图片或一个参考视频`);
              let seedanceInvalidReference = seedanceContent.find(
                (part) =>
                part?.type === `video_url` &&
                !seedanceIsArkMediaRef(part.video_url?.url || ``),
              );
              if (seedanceInvalidReference)
                throw Error(`Seedance 参考视频必须是公网可访问的 Web URL；请先把视频上传到可外网访问的对象存储/CDN，再填入该视频链接`);
              if (seedanceContent.length === 0)
                throw Error(`请输入提示词，或连接图片、视频、音频参考节点`);
	              let requestBody = {
	                model: modelName,
	                prompt: seedanceApiPrompt,
                content: seedanceContent,
                ratio: seedanceRatio,
                resolution: seedanceResolution,
                duration: seedanceDuration,
                generate_audio: seedanceSourceNode?.data?.generateAudio !== false,
                watermark: seedanceSourceNode?.data?.watermark === true,
                return_last_frame: true,
	              };
	              seedanceSourceNode?.data?.enableWebSearch &&
	                seedanceConnectedImageRefs.length === 0 &&
	                seedanceConnectedVideoRefs.length === 0 &&
	                seedanceConnectedAudioRefs.length === 0 &&
	                (requestBody.tools = [{
	                  type: `web_search`
	                }]);
              let apiUrl = `${videoBaseUrl}/contents/generations/tasks`,
                abortController = new AbortController();
              abortControllersRef.current.set(nodeId, abortController);
              let response = await fetch(apiUrl, {
                method: `POST`,
                headers: {
                  Authorization: `Bearer ${videoKey}`,
                  "Content-Type": `application/json`,
                },
                body: JSON.stringify(requestBody),
                signal: abortController.signal,
              });
              if (!response.ok) {
                let errorMessage = `API 请求失败: ${response.status} ${response.statusText}`;
                try {
                  let errorData = await response.json();
                  errorMessage =
                    errorData.error && errorData.error.message ?
                    `API 请求失败: ${errorData.error.message}` :
                    errorData.message ?
                    `API 请求失败: ${errorData.message}` :
                    `API 请求失败: ${response.status} - ${serializeErrorPreview(errorData)}`;
                } catch {
                  try {
                    let errorText = await response.text();
                    errorMessage = `API 请求失败: ${response.status} - ${serializeErrorPreview(errorText)}`;
                  } catch {}
                }
                throw Error(errorMessage);
              }
              let submitResult = await response.json();
              if (submitResult.error) throw Error(submitResult.error.message || `提交任务失败`);
              let taskId =
                submitResult.id ||
                submitResult.task_id ||
                submitResult.taskId ||
                submitResult.data?.id ||
                submitResult.data?.task_id ||
                submitResult.data?.taskId;
              if (!taskId) throw Error(`无法获取 Seedance 任务 ID`);
              createdVideoTaskId = taskId;
              (updateTaskList &&
                updateTaskList((tasks) => [
                  ...tasks,
                  {
                    id: taskId,
                    type: `video`,
                    provider: `seedance`,
                    apiBaseUrl: videoBaseUrl,
                    apiConfigId: videoConfig?.id,
                    modelName: modelName,
                    projectId: projectIdAtStart,
                    nodeId: nodeId,
                    status: `pending`,
                    progress: 0,
                    createdAt: Date.now(),
                    prompt: prompt,
                  },
                ]),
                setNodes((nodes3) =>
                  nodes3.map((node) =>
                    node.id === nodeId ?
	                    {
	                      ...node,
	                      data: {
	                        ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                        seedanceTaskId: taskId,
	                        videoUrl: undefined,
	                        thumbnailUrl: undefined,
	                        resultData: undefined
	                      }
	                    } :
                    node,
                  ),
	                ),
	                await persistVideoNodeState({}, {
	                  seedanceTaskId: taskId,
	                  videoUrl: undefined,
	                  thumbnailUrl: undefined,
	                  resultData: undefined
	                }, {
	                  clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	                }),
	                localStorage.setItem(dailyLimitKey, (edgesList + 1).toString()),
                setDailyGenerationCount(edgesList + 1),
                showToast(`Seedance 任务提交成功，正在生成中...`));
              let done = false,
                pollCount = 0,
                errorCount = 0,
                seedancePollingTimeoutMs = Math.max(5e3, (Number(timeoutSeconds) || 600) * 1e3),
                seedancePollingStartedAt = Date.now(),
                maxPolls = Math.max(1, Math.ceil(seedancePollingTimeoutMs / Math.max(Number(pollIntervalMs) || 3e3, 500)));
              for (; !done;) {
                if (abortController.signal.aborted) throw Error(`生成已取消`);
                if (Date.now() - seedancePollingStartedAt >= seedancePollingTimeoutMs)
                  throw Error(`Seedance 视频生成超时，请在设置中增大全局异步轮询最大时长后重试`);
                (await new Promise((resolve) => setTimeout(resolve, pollIntervalMs)),
                  pollCount++,
                  pollCount % 120 == 0 &&
                  pollCount < maxPolls &&
                  showToast(`Seedance 视频生成仍在进行中，请耐心等待...`));
                try {
                  let response2 = await fetch(`${videoBaseUrl}/contents/generations/tasks/${taskId}`, {
                    headers: {
                      Authorization: `Bearer ${videoKey}`
                    },
                  });
	                  if (response2.ok) {
		                    let responseData = await response2.json(),
		                      seedanceItems = Array.isArray(responseData.items) ?
		                      responseData.items :
		                      Array.isArray(responseData.data?.items) ?
		                      responseData.data.items :
		                      Array.isArray(responseData.output?.items) ?
		                      responseData.output.items :
		                      Array.isArray(responseData.result?.items) ?
		                      responseData.result.items :
		                      null,
		                      seedanceItem = Array.isArray(seedanceItems) ?
		                      seedanceItems.find(
		                        (item) =>
		                        item &&
		                        typeof item == `object` &&
		                        (item.status || item.content || item.video_url || item.videoUrl || item.error || item.progress !== undefined),
		                      ) || seedanceItems[0] :
		                      null,
	                      seedanceItemError = seedanceItem?.error,
	                      seedanceItemErrorMessage =
	                      typeof seedanceItemError == `string` ?
	                      seedanceItemError :
	                      seedanceItemError?.message ||
	                      seedanceItemError?.detail ||
	                      seedanceItemError?.code ||
	                      ``,
	                      seedanceStatus = String(
	                        seedanceItem?.status ||
	                        (seedanceItem?.error ? `failed` : ``) ||
	                        responseData.status ||
	                        responseData.data?.status ||
	                        responseData.task?.status ||
	                        responseData.content?.status ||
	                        ``,
	                      ).toLowerCase(),
                      cleanSeedanceUrl = (value) =>
                      typeof value == `string` ? value.replace(/[`\s]/g, ``) : ``,
	                      seedanceVideoUrl = cleanSeedanceUrl(
		                        seedanceItem?.content?.video_url ||
		                        seedanceItem?.content?.videoUrl ||
		                        seedanceItem?.content?.[0]?.video_url ||
		                        seedanceItem?.content?.[0]?.videoUrl ||
		                        seedanceItem?.content?.[0]?.url ||
		                        seedanceItem?.video_url ||
	                        seedanceItem?.videoUrl ||
	                        seedanceItem?.url ||
	                        responseData.content?.video_url ||
	                        responseData.content?.videoUrl ||
	                        responseData.output?.video_url ||
                        responseData.output?.videoUrl ||
                        responseData.data?.video_url ||
                        responseData.data?.videoUrl ||
                        responseData.data?.content?.video_url ||
                        responseData.data?.output?.video_url ||
                        responseData.result?.video_url ||
                        responseData.result?.videoUrl ||
                        responseData.video_url ||
                        responseData.videoUrl ||
                        responseData.url,
                      ),
	                      seedanceThumbUrl = cleanSeedanceUrl(
		                        seedanceItem?.content?.last_frame_url ||
		                        seedanceItem?.content?.lastFrameUrl ||
		                        seedanceItem?.content?.thumbnail_url ||
		                        seedanceItem?.content?.[0]?.last_frame_url ||
		                        seedanceItem?.content?.[0]?.lastFrameUrl ||
		                        seedanceItem?.content?.[0]?.thumbnail_url ||
		                        seedanceItem?.last_frame_url ||
	                        seedanceItem?.thumbnail_url ||
	                        seedanceItem?.cover_url ||
	                        responseData.content?.last_frame_url ||
	                        responseData.content?.lastFrameUrl ||
                        responseData.content?.thumbnail_url ||
                        responseData.output?.last_frame_url ||
                        responseData.output?.thumbnail_url ||
                        responseData.data?.last_frame_url ||
                        responseData.data?.thumbnail_url ||
                        responseData.data?.content?.last_frame_url ||
                        responseData.data?.output?.last_frame_url ||
                        responseData.result?.last_frame_url ||
                        responseData.result?.thumbnail_url ||
                        responseData.thumbnail_url ||
                        responseData.cover_url,
                      );
                    if (
                      !seedanceVideoUrl &&
                      [
                        `succeeded`,
                        `completed`,
                        `complete`,
                        `success`,
                        `done`,
                      ].includes(seedanceStatus)
                    )
                      try {
                        let baseUrl = new URL(videoBaseUrl),
                          candidateUrls = [`${baseUrl.origin}/v1/videos/${taskId}`];
                        if (baseUrl.hostname.startsWith(`api.`)) {
                          let altUrl = new URL(baseUrl.origin);
                          ((altUrl.hostname = altUrl.hostname.replace(/^api\./, ``)),
                            candidateUrls.push(`${altUrl.origin}/v1/videos/${taskId}`));
                        }
                        for (let url of [...new Set(candidateUrls)]) {
                          let response3 = await fetch(url, {
                            headers: {
                              Authorization: `Bearer ${videoKey}`
                            },
                          });
                          if (response3.ok) {
                            let result = await response3.json().catch(() => null);
                            seedanceVideoUrl =
                              cleanSeedanceUrl(
                                result?.video_url ||
                                result?.videoUrl ||
                                result?.url ||
                                result?.content?.video_url ||
                                result?.content?.videoUrl ||
                                result?.data?.video_url ||
                                result?.data?.videoUrl ||
                                result?.result?.video_url ||
                                result?.result?.videoUrl,
                              ) || seedanceVideoUrl;
                            seedanceThumbUrl =
                              cleanSeedanceUrl(
                                result?.thumbnail_url ||
                                result?.cover_url ||
                                result?.content?.last_frame_url ||
                                result?.content?.thumbnail_url ||
                                result?.data?.thumbnail_url ||
                                result?.result?.thumbnail_url,
                              ) || seedanceThumbUrl;
                            if (seedanceVideoUrl) break;
                          }
                        }
                      } catch (error) {
                        console.warn(`Failed to query Sora-compatible Seedance status`, error);
                      }
                    if (
                      !seedanceVideoUrl &&
                      [
                        `succeeded`,
                        `completed`,
                        `complete`,
                        `success`,
                        `done`,
                      ].includes(seedanceStatus)
                    )
                      try {
                        let baseUrl = new URL(videoBaseUrl),
                          candidateUrls = [`${baseUrl.origin}/v1/videos/${taskId}/content`];
                        if (baseUrl.hostname.startsWith(`api.`)) {
                          let altUrl = new URL(baseUrl.origin);
                          ((altUrl.hostname = altUrl.hostname.replace(/^api\./, ``)),
                            candidateUrls.push(`${altUrl.origin}/v1/videos/${taskId}/content`));
                        }
                        for (let url of [...new Set(candidateUrls)]) {
                          let response3 = await fetch(url, {
                            headers: {
                              Authorization: `Bearer ${videoKey}`
                            },
                          });
                          if (response3.ok) {
                            let contentType = response3.headers.get(`content-type`) || ``,
                              blob = await response3.blob();
                            if (blob.size > 0 && !/json|text\/html/i.test(contentType)) {
                              seedanceVideoUrl = URL.createObjectURL(blob);
                              break;
                            }
                          }
                        }
                      } catch (error) {
                        console.warn(`Failed to fetch Seedance video content`, error);
                      }
                    if (
                      ((errorCount = 0),
                        [
                          `succeeded`,
                          `completed`,
                          `complete`,
                          `success`,
                          `done`,
                        ].includes(seedanceStatus) || seedanceVideoUrl)
                    ) {
                      done = true;
                      if (!seedanceVideoUrl)
                        throw Error(`Seedance 任务已完成，但未返回视频地址`);
                      let videoUrl = seedanceVideoUrl,
                        thumbUrl = seedanceThumbUrl,
                        shouldApplySeedanceResult = (nodesRef.current || []).some(
                          (node) =>
                            node.id === nodeId &&
                            (node.data?.seedanceTaskId === taskId || node.data?.taskId === taskId),
                        );
                      updateTaskList &&
                        updateTaskList((nodes3) =>
                          nodes3.map((node) =>
                            node.id === taskId ?
                            {
                              ...node,
                              status: `completed`,
                              progress: 100,
                              resultUrl: videoUrl,
                              thumbnailUrl: thumbUrl,
                            } :
                            node,
                          ),
                        );
                      let width = 320,
                        height = 320,
                        seedanceNodeRatio = null;
                      if (resolution) {
                        let match = String(resolution)
                          .trim()
                          .match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
                        if (match) {
                          let ratioWidth = Number(match[1]),
                            ratioHeight = Number(match[2]);
                          if (!isNaN(ratioWidth) && !isNaN(ratioHeight) && ratioHeight > 0) {
                            let aspectRatio = ratioWidth / ratioHeight;
                            (seedanceNodeRatio = `${ratioWidth} / ${ratioHeight}`),
                            aspectRatio > 1 ?
                              ((width = Math.min(600, Math.max(320, 360 * aspectRatio))),
                                (height = width / aspectRatio)) :
                              aspectRatio < 1 ?
                              ((height = 420), (width = height * aspectRatio)) :
                              ((height = 320), (width = height));
                          }
                        }
                      }
                      shouldApplySeedanceResult &&
                        (setNodes((nodes3) =>
                          nodes3.map((node) =>
                            node.id === nodeId &&
                            (node.data?.seedanceTaskId === taskId || node.data?.taskId === taskId) ?
                            {
                              ...node,
                              style: {
                                ...node.style,
                                width: width,
                                height: height + 24
	                              },
	                              data: {
	                                ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                                videoUrl: videoUrl,
                                thumbnailUrl: thumbUrl,
                                videoAspectRatio: seedanceNodeRatio,
                                loading: false,
                                progress: 100,
                                errorMessage: undefined,
                              },
                            } :
                            node,
                          ),
                        ),
                        await persistVideoNodeState({
                          width: width,
                          height: height + 24
                        }, {
                          videoUrl: videoUrl,
                          thumbnailUrl: thumbUrl,
                          videoAspectRatio: seedanceNodeRatio,
                          loading: false,
	                          progress: 100,
	                          errorMessage: undefined,
	                        }, {
	                          clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	                        }),
                        setEdges((edges2) =>
                          edges2.map((edge) => (edge.target === nodeId ? {
                            ...edge,
                            animated: false
                          } : edge)),
                        ),
                        addGeneratedAsset && videoUrl && addGeneratedAsset(videoUrl, `video`, `generated`),
                        showToast(`Seedance 视频生成成功！`));
                      break;
                    } else if (
                      [
	                        `failed`,
	                        `fail`,
	                        `error`,
                        `expired`,
                        `canceled`,
                        `cancelled`,
                        `rejected`,
                      ].includes(seedanceStatus)
	                    ) {
	                      let errorMessage =
	                        seedanceItemErrorMessage ||
	                        seedanceItem?.message ||
	                        responseData.error?.message ||
	                        responseData.data?.error?.message ||
	                        responseData.message ||
                        responseData.error?.code ||
                        (seedanceStatus === `expired` ? `任务超时` : `视频生成失败`);
                      throw Error(`[SEEDANCE_TASK_FAILED]${errorMessage}`);
                    } else {
	                      let progress =
	                        seedanceItem?.progress !== undefined &&
	                        seedanceItem?.progress !== null ?
	                        parseInt(seedanceItem.progress) :
	                        responseData.progress !== undefined && responseData.progress !== null ?
	                        parseInt(responseData.progress) :
                        responseData.data?.progress !== undefined && responseData.data?.progress !== null ?
                        parseInt(responseData.data.progress) :
                        responseData.content?.progress !== undefined &&
                        responseData.content?.progress !== null ?
                        parseInt(responseData.content.progress) :
                        Math.min(99, pollCount * 2);
                      progress = Math.min(99, Math.max(0, isNaN(progress) ? pollCount * 2 : progress));
                      (setNodes((nodes3) =>
                          nodes3.map((node) =>
                            node.id === nodeId &&
                            (node.data?.seedanceTaskId === taskId || node.data?.taskId === taskId) ?
                            {
                              ...node,
                              data: {
                                ...node.data,
                                progress: progress
                              }
                            } :
                            node,
                          ),
                        ),
                        updateTaskList &&
                        updateTaskList((nodes3) =>
                          nodes3.map((node) =>
                            node.id === taskId ?
                            updateTaskRunningProgress(node, progress) :
                            node,
                          ),
                        ));
                    }
                  } else errorCount++;
                } catch (error) {
                  if (
                    error?.message &&
                    error.message.startsWith(`[SEEDANCE_TASK_FAILED]`)
                  )
                    throw Error(error.message.replace(`[SEEDANCE_TASK_FAILED]`, ``));
                  (console.warn(`Seedance polling error:`, error),
                    errorCount++,
                    errorCount === 11 &&
                    showToast(`Seedance 状态查询暂时失败，仍会继续重试...`));
                }
              }
              return;
            }
	            let selectedVideoSizeValue = String(resolution || `1280x720`).trim() || `1280x720`,
	              normalizedVideoSize = normalizeVideoSizeValue(selectedVideoSizeValue),
	              isLconaiVideoApi =
	              /(^|\.)lconai\.com|\/\/[nsv]\.lconai\.com/i.test(String(videoBaseUrl || ``)),
	              isVectorEngineGrokVideo3 =
	              /^grok-video-3$/i.test(String(modelName || ``)) &&
	              /api\.vectorengine\.ai/i.test(String(videoBaseUrl || ``)),
	              modelUsesDimensionSize =
	              isLconaiVideoApi ||
	              (/\bgrok[-_]?videos\b/i.test(String(modelName || ``)) &&
	                !isVectorEngineGrokVideo3),
              baseUrl = videoBaseUrl,
              multipartFieldMapping = {
                model: `model`,
                prompt: `prompt`,
                resolution: `size`,
                aspectRatio: `aspect_ratio`,
                duration: `seconds`,
                referenceImage: `input_reference`,
                referenceVideo: `input_video`,
                referenceAudio: ``,
              },
              normalizedFieldMapping = {
                ...multipartFieldMapping,
                ...(videoModelRequestProfile?.fieldMapping || {}),
              },
              effectiveVideoRequestProfile = ((input, modelConfig = {}) => {
                let requestProfile = input && typeof input == `object` ? {
                    ...input
                  } : {},
                  modelName3 = String(modelConfig.modelName || ``).trim().toLowerCase(),
                  apiUrl = String(modelConfig.apiUrl || ``).trim().toLowerCase(),
                  requestType2 = String(requestProfile.requestType || ``).trim().toLowerCase();
                return (
                  requestProfile.fieldValueTypes &&
                  typeof requestProfile.fieldValueTypes == `object` &&
                  (requestProfile.fieldValueTypes = {
                    ...requestProfile.fieldValueTypes
                  }),
                  modelConfig.category === `video` &&
                  (requestType2 === `openai-video` || requestType2 === `json-video`) &&
                  (/^wan/i.test(modelName3) || /aigc\.x-see\.cn|x-see\.cn/.test(apiUrl)) &&
                  (requestProfile.fieldValueTypes = {
                    ...(requestProfile.fieldValueTypes || {}),
                    seconds: `string`,
                    duration: `string`,
                  }),
                  requestType2 === `openai-video` &&
                  !requestProfile.submitPath &&
                  !/(^|\.)lconai\.com|\/\/[nsv]\.lconai\.com/i.test(apiUrl) &&
                  ((requestProfile.submitPath = `/v1/videos`),
                    (requestProfile.pollPath = requestProfile.pollPath || `/v1/videos/{taskId}`),
                    requestProfile.contentPath === undefined &&
                    (requestProfile.contentPath = `/v1/videos/{taskId}/content`)),
                  modelConfig.category === `video` &&
                  /^veo/i.test(String(modelConfig.modelName || ``)) &&
                  /aigc\.x-see\.cn|x-see\.cn/i.test(apiUrl) &&
                  /(?:^|[-_])(portrait|landscape|fl|frame|reverse|gif|hd|4k|pro)(?:[-_]|$)/i.test(String(modelConfig.modelName || ``)) &&
                  ((requestProfile.requestType = `multipart-video`),
                    (requestProfile.submitPath = `/v1/videos`),
                    (requestProfile.pollPath = `/v1/videos/{taskId}`),
	                    delete requestProfile.contentPath,
	                    delete requestProfile.referenceImageMode,
	                    delete requestProfile.referenceImageAsArray,
	                    delete requestProfile.referenceImageItemShape,
	                    (requestProfile.requiresReferenceImage = true),
                    (requestProfile.omitDuration = true),
                    (requestProfile.fieldMapping = {
                      ...(requestProfile.fieldMapping || {}),
                      prompt: `prompt`,
                      resolution: `size`,
                      duration: ``,
                      referenceImage: `input_reference`,
                      aspectRatio: ``,
                    }),
                    (requestProfile.fieldValueTypes = {
                      ...(requestProfile.fieldValueTypes || {}),
                      size: `string`,
                    })),
                  modelConfig.category === `video` &&
                  /^veo/i.test(String(modelConfig.modelName || ``)) &&
                  /(^|\.)lconai\.com|\/\/[nsv]\.lconai\.com/i.test(apiUrl) &&
	                  ((requestProfile.requestType = `multipart-video`),
	                    (requestProfile.submitPath = `/v1/videos`),
	                    (requestProfile.pollPath = `/v1/videos/{taskId}`),
	                    delete requestProfile.contentPath,
	                    (requestProfile.fieldMapping = {
	                      ...(requestProfile.fieldMapping || {}),
	                      prompt: `prompt`,
	                      resolution: `size`,
	                      duration: `seconds`,
	                      referenceImage: `input_reference`,
	                      aspectRatio: ``,
	                    }),
	                    (requestProfile.fieldValueTypes = {
	                      ...(requestProfile.fieldValueTypes || {}),
	                      size: `string`,
	                      seconds: `number`,
	                    })),
		                  modelConfig.category === `video` &&
		                  /^grok-(?:video|imagine)/i.test(String(modelConfig.modelName || ``)) &&
	                  (/^https?:\/\/jixing\.guancn\.uk/i.test(apiUrl) ||
		                    /(^|\.)lconai\.com|\/\/[nsv]\.lconai\.com/i.test(apiUrl)) &&
		                  ((requestProfile.requestType = `multipart-video`),
	          (requestProfile.submitPath = `/v1/videos`),
	          (requestProfile.pollPath = `/v1/videos/{taskId}`),
	          delete requestProfile.contentPath,
	          delete requestProfile.referenceImageMode,
	          delete requestProfile.referenceImageAsArray,
	          delete requestProfile.referenceImageItemShape,
                    (requestProfile.fieldMapping = {
                      ...(requestProfile.fieldMapping || {}),
                      prompt: `prompt`,
                      resolution: `size`,
                      duration: `seconds`,
                      referenceImage: `input_reference`,
                      aspectRatio: ``,
                    }),
                    (requestProfile.fieldValueTypes = {
                      ...(requestProfile.fieldValueTypes || {}),
                      size: `string`,
                      seconds: `number`,
                    })),
                  modelConfig.category === `video` &&
                  /^grok-imagine-video$/i.test(String(modelConfig.modelName || ``)) &&
                  ((requestProfile.requestType = `openai-video`),
                    (requestProfile.submitPath = `/v1/videos`),
                    (requestProfile.pollPath = `/v1/videos/{taskId}`),
                    (requestProfile.referenceImageMode = `url`),
                    (requestProfile.referenceImageAsArray = true),
                    (requestProfile.referenceImageItemShape = `image_url_object`),
                    (requestProfile.fieldMapping = {
                      ...(requestProfile.fieldMapping || {}),
                      resolution: `size`,
                      duration: `seconds`,
                      referenceImage: `input_references`,
                      aspectRatio: ``,
                    }),
                    (requestProfile.extraBody = {
                      ...(requestProfile.extraBody || {}),
                      quality: `standard`,
                    }),
                    (requestProfile.fieldValueTypes = {
                      ...(requestProfile.fieldValueTypes || {}),
                      size: `string`,
                      seconds: `string`,
                    })),
                  modelConfig.category === `video` &&
                  modelName3 === `grok-video-3` &&
                  /api\.vectorengine\.ai/i.test(apiUrl) &&
                  ((requestProfile.requestType = `json-video`),
                    (requestProfile.submitPath = `/v1/video/create`),
                    (requestProfile.pollPath = `/v1/video/query?id={taskId}`),
                    (requestProfile.omitDuration = true),
                    (requestProfile.requiresReferenceImage = true),
                    (requestProfile.referenceImageMode = `url`),
                    (requestProfile.referenceImageAsArray = true),
                    (requestProfile.fieldMapping = {
                      ...(requestProfile.fieldMapping || {}),
                      resolution: `size`,
                      aspectRatio: `aspect_ratio`,
                      referenceImage: `images`,
                    }),
                    (requestProfile.fieldValueTypes = {
                      ...(requestProfile.fieldValueTypes || {}),
                      size: `string`,
                      aspect_ratio: `string`,
                    })),
                  requestProfile
                );
              })(videoModelRequestProfile, {
                modelName: modelName,
                apiUrl: videoBaseUrl,
                category: `video`,
              }),
	              effectiveFieldMapping = {
                ...multipartFieldMapping,
                ...(effectiveVideoRequestProfile?.fieldMapping || {}),
	              },
	              referenceImagesAsUrls =
	              effectiveVideoRequestProfile?.referenceImageMode === `url`,
	              referenceVideosAsUrls =
	              effectiveVideoRequestProfile?.referenceVideoMode === `url`,
              referenceImagesAsArray =
              effectiveVideoRequestProfile?.referenceImageAsArray === true,
              requiresReferenceImage =
              effectiveVideoRequestProfile?.requiresReferenceImage === true,
              requiresReferenceVideo =
              effectiveVideoRequestProfile?.requiresReferenceVideo === true,
              requiresAnyReference =
              effectiveVideoRequestProfile?.requiresAnyReference === true,
              referenceMediaAggregation = String(effectiveVideoRequestProfile?.referenceMediaAggregation || ``).trim(),
              referenceMediaField = String(effectiveVideoRequestProfile?.referenceMediaField || effectiveFieldMapping.referenceImage || effectiveFieldMapping.referenceVideo || `input_reference`).trim(),
              referenceMediaOrder = String(effectiveVideoRequestProfile?.referenceMediaOrder || `image-first`).trim(),
              referenceMediaKinds = Array.isArray(effectiveVideoRequestProfile?.referenceMediaKinds) ? effectiveVideoRequestProfile.referenceMediaKinds : [`image`, `video`],
              videoGatewayFormatOverride =
              !modelProtocolDefinition &&
              !effectiveVideoRequestProfile?.requestType &&
              videoConfig?.protocolFormat && videoConfig.protocolFormat !== `auto`
                ? videoConfig.protocolFormat
                : null,
              requestType =
              videoGatewayFormatOverride ||
              effectiveVideoRequestProfile?.requestType || `multipart-video`,
              submitPath =
              effectiveVideoRequestProfile?.submitPath || `/v1/videos`,
              pollPathTemplate =
              effectiveVideoRequestProfile?.pollPath || `/v1/videos/{taskId}`,
              contentPathTemplate =
              effectiveVideoRequestProfile?.contentPath || ``,
              useAspectRatioAsSize =
              effectiveVideoRequestProfile?.useAspectRatioAsSize === true,
              uploadReferenceMediaForUrlOnlyModel = async (url, mediaKind = `image`) => {
                  url = wanjuanNormalizeReferenceMediaUrl(url, mediaKind);
                  if (!url) return ``;
                  if (/^https?:\/\//i.test(String(url))) return String(url);
                  if (
                    !window.wanjuanDesktop ||
                    (typeof window.wanjuanDesktop.uploadPublicMedia != `function` &&
                      typeof window.wanjuanDesktop.uploadTosMedia != `function` &&
                      typeof window.wanjuanDesktop.uploadCustomPublicMedia != `function`)
                  )
                    throw Error(`模型 ${modelName} 的参考${mediaKind === `video` ? `视频` : `图片`}必须是公网 URL`);
                  let fileName = `${String(modelName || `video`).replace(/[^a-z0-9_-]+/gi, `-`)}-reference-${Date.now()}`,
                    hasCustomUpload =
                    /^https?:\/\//i.test(String(customPublicUploadConfig?.endpoint || ``)) &&
                    typeof window.wanjuanDesktop.uploadCustomPublicMedia == `function`,
                    tosAccessKey =
                    String(tosConfig?.accessKeyId || tosConfig?.accessKey || ``).trim() &&
                    String(tosConfig?.secretAccessKey || tosConfig?.secretKey || ``).trim() &&
                    String(tosConfig?.bucket || ``).trim() &&
                    typeof window.wanjuanDesktop.uploadTosMedia == `function`,
                    qiniuReady =
                    String(qiniuConfig?.accessKey || qiniuConfig?.accessKeyId || ``).trim() &&
                    String(qiniuConfig?.secretKey || qiniuConfig?.secretAccessKey || ``).trim() &&
                    String(qiniuConfig?.bucket || ``).trim() &&
                    String(qiniuConfig?.endpoint || ``).trim() &&
                    typeof window.wanjuanDesktop.uploadQiniuMedia == `function`,
                    uploaders = [];
                  hasCustomUpload &&
                    uploaders.push({
                      label: `自定义公网直链`,
                      run: () =>
                        window.wanjuanDesktop.uploadCustomPublicMedia({
                          url: url,
                          kind: mediaKind,
                          filename: fileName,
                          customUpload: customPublicUploadConfig || {},
                        }),
                    });
                  tosAccessKey &&
                    uploaders.push({
                      label: `火山 TOS`,
                      run: () =>
                        window.wanjuanDesktop.uploadTosMedia({
                          url: url,
                          kind: mediaKind,
                          filename: fileName,
                          tos: tosConfig || {},
                        }),
                    });
                  qiniuReady &&
                    uploaders.push({
                      label: `七牛云`,
                      run: () =>
                        window.wanjuanDesktop.uploadQiniuMedia({
                          url: url,
                          kind: mediaKind,
                          filename: fileName,
                          qiniu: qiniuConfig || {},
                        }),
                    });
                  typeof window.wanjuanDesktop.uploadPublicMedia == `function` &&
                    uploaders.push({
                      label: `公网临时链接`,
                      run: () =>
                        window.wanjuanDesktop.uploadPublicMedia({
                          url: url,
                          kind: mediaKind,
                          filename: fileName,
                        }),
                    });
                  let errors = [];
                  for (let uploader of uploaders)
                    try {
                      showToast(`正在上传 ${modelName} 参考${mediaKind === `video` ? `视频` : `图片`}到${uploader.label}...`);
                      let uploadResult = await uploader.run();
                      if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                      errors.push(`${uploader.label}: ${uploadResult?.error || `上传失败`}`);
                    } catch (error) {
                      errors.push(`${uploader.label}: ${error?.message || error}`);
                    }
                  throw Error(
                    errors.length > 0 ?
                    `参考${mediaKind === `video` ? `视频` : `图片`}上传失败：${errors.join(`；`)}` :
                    `参考${mediaKind === `video` ? `视频` : `图片`}上传失败`,
                  );
                },
                submitUrl = videoBuildApiUrl(baseUrl, submitPath),
                abortController = new AbortController();
            if (
              requestType !== `multipart-video` &&
              requestType !== `multipart` &&
              requestType !== `seedance-json` &&
              requestType !== `json-video` &&
              requestType !== `openai-video`
            )
              throw Error(
                `模型 ${modelName} 的请求协议 ${requestType} 暂未适配，请在设置中检查视频模型请求协议配置`,
              );
            if (requiresReferenceImage && imageReferences.length === 0)
              throw Error(`模型 ${modelName} 需要至少一张参考图片，请先连接图片节点后再生成`);
            if (requiresReferenceVideo && videoReferences.length === 0)
              throw Error(`模型 ${modelName} 需要至少一个参考视频，请先连接视频节点后再生成`);
            if (requiresAnyReference && imageReferences.length === 0 && videoReferences.length === 0)
              throw Error(`模型 ${modelName} 需要至少一张参考图片或一个参考视频，请先连接素材节点后再生成`);
            abortControllersRef.current.set(nodeId, abortController);
            let prompt2 =
              promptParts.length > 0 ?
              `${promptParts.join(`
		`)}\n${prompt}` :
              prompt,
              getFieldValue = (fieldName, value) => {
                let fieldName2 = String(fieldName || ``).trim(),
                  valueType =
                  effectiveVideoRequestProfile?.fieldValueTypes &&
                  typeof effectiveVideoRequestProfile.fieldValueTypes == `object` &&
                  effectiveVideoRequestProfile.fieldValueTypes[fieldName2] ?
                  String(effectiveVideoRequestProfile.fieldValueTypes[fieldName2]).trim().toLowerCase() :
                  ``;
                return valueType === `string` ?
                  String(value ?? ``) :
                  valueType === `number` ?
                  Number(value) :
                  value;
              },
              videoSizeValue = ((sizeValue) => {
                let resolutionMatch = String(selectedVideoSizeValue || ``).trim().match(/^(\d{3,4})\s*p$/i);
                if (resolutionMatch) return `${resolutionMatch[1]}P`;
                if (!sizeValue) return `720P`;
                let [width, height] = String(sizeValue)
                  .split(`x`)
                  .map((part) => parseInt(part, 10));
                return !isNaN(width) && !isNaN(height) && Math.max(width, height) >= 1920 ?
                  `1080P` :
                  `720P`;
              })(normalizedVideoSize),
              aspectRatio = normalizeVideoAspectRatioValue(
                aspectRatioOverride ||
                seedanceSourceNode?.data?.selectedAspectRatio ||
                ``,
                normalizedVideoSize,
              ),
              requestAspectRatioValue = ((aspectRatioValue, sizeValue) => {
                if (!isVectorEngineGrokVideo3) return aspectRatioValue;
                if ([`2:3`, `3:2`, `1:1`].includes(aspectRatioValue)) return aspectRatioValue;
                let ratioMatch =
                  String(aspectRatioValue || ``).match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/) ||
                  String(sizeValue || ``).match(/^(\d+)\s*x\s*(\d+)$/i),
                  ratio = ratioMatch ? Number(ratioMatch[1]) / Number(ratioMatch[2]) : 1;
                return ratio > 1.05 ? `3:2` : ratio < 0.95 ? `2:3` : `1:1`;
              })(aspectRatio, normalizedVideoSize),
              videoParameterAdapter =
              effectiveVideoRequestProfile?.parameterAdapter &&
              typeof effectiveVideoRequestProfile.parameterAdapter == `object` ?
              effectiveVideoRequestProfile.parameterAdapter :
              {},
              mapVideoProtocolParameterValue = (key, mapping = {}) => {
                let key2 = String(key || ``).trim(),
                  mapping2 = mapping && typeof mapping == `object` ? mapping : {};
                return Object.prototype.hasOwnProperty.call(mapping2, key2) ? mapping2[key2] : key2;
              },
              applyVideoProtocolParameterCase = (value, caseMode) => {
                let value2 = String(value || ``);
                return caseMode === `lower` ?
                  value2.toLowerCase() :
                  caseMode === `upper` ?
                  value2.toUpperCase() :
                  value2;
              },
              getVideoResolutionAdapterValue = (resolutionValue) => {
                let resolutionMode = String(
                  effectiveVideoRequestProfile?.resolutionValueMode ||
                  videoParameterAdapter.resolutionValueMode ||
                  ``,
                ).trim().toLowerCase();
                return resolutionMode === `none` || resolutionMode === `omit` ?
                  `` :
                  resolutionMode === `dimension` || resolutionMode === `dimensions` || resolutionMode === `width-height` ?
                  normalizedVideoSize :
                  resolutionMode === `quality` || resolutionMode === `quality-preset` || resolutionMode === `preset` ?
                  applyVideoProtocolParameterCase(
                    mapVideoProtocolParameterValue(
                      videoSizeValue,
                      effectiveVideoRequestProfile?.resolutionValueMap ||
                      videoParameterAdapter.resolutionValueMap,
                    ),
                    effectiveVideoRequestProfile?.resolutionValueCase ||
                    videoParameterAdapter.resolutionValueCase,
                  ) :
                  resolutionMode === `aspect-ratio` || resolutionMode === `ratio` ?
                  requestAspectRatioValue :
                  resolutionMode === `aspect-ratio-x` || resolutionMode === `ratio-x` ?
                  String(requestAspectRatioValue || ``).replace(`:`, `x`) :
                  resolutionValue;
              },
              getVideoAspectRatioAdapterValue = () => {
                let aspectRatioMode = String(
                  effectiveVideoRequestProfile?.aspectRatioValueMode ||
                  videoParameterAdapter.aspectRatioValueMode ||
                  ``,
                ).trim().toLowerCase();
                return aspectRatioMode === `none` || aspectRatioMode === `omit` ?
                  `` :
                  aspectRatioMode === `dimension` || aspectRatioMode === `dimensions` || aspectRatioMode === `width-height` ?
                  normalizedVideoSize :
                  aspectRatioMode === `quality` || aspectRatioMode === `quality-preset` || aspectRatioMode === `preset` ?
                  videoSizeValue :
                  aspectRatioMode === `aspect-ratio-x` || aspectRatioMode === `ratio-x` ?
                  String(requestAspectRatioValue || ``).replace(`:`, `x`) :
                  applyVideoProtocolParameterCase(
                    mapVideoProtocolParameterValue(
                      requestAspectRatioValue,
                      effectiveVideoRequestProfile?.aspectRatioValueMap ||
                      videoParameterAdapter.aspectRatioValueMap,
                    ),
                    effectiveVideoRequestProfile?.aspectRatioValueCase ||
                    videoParameterAdapter.aspectRatioValueCase,
                  );
              },
	              durationValue =
	              duration ||
	              (videoDurations || `10`)
	              .split(
	                `
		`,
	              )[0]
	              .trim();
	            const normalizeGrokVideoDuration = (model, value) => {
	              let modelText = String(model || ``).trim().toLowerCase();
	              if (!/^grok-(?:video|imagine)/i.test(modelText)) return value;
	              if (modelText === `grok-video-3`) return `6`;
	              if (modelText === `grok-video-3-pro`) return `10`;
	              if (modelText === `grok-video-3-max`) {
	                let numericValue = Number(value);
	                return Number.isFinite(numericValue) && numericValue > 0 ?
	                  String(Math.round(numericValue)) :
	                  `10`;
	              }
	              if (/grok-imagine-video-1\.5-preview/i.test(modelText)) return `15`;
	              let numericValue = Number(value);
	              return Number.isFinite(numericValue) && numericValue > 0 ?
	                String(Math.round(numericValue)) :
	                value;
	            };
	            durationValue = normalizeGrokVideoDuration(modelName, durationValue);
	            if (requestType === `json-video` || requestType === `openai-video`) {
              let isVeoModel = /^veo/i.test(modelName) && !isLconaiVideoApi,
                jsonBody = {
                  model: modelName,
                  prompt: prompt2,
                },
                resolutionValue =
                getVideoResolutionAdapterValue(
                isVectorEngineGrokVideo3 ?
                videoSizeValue :
                modelUsesDimensionSize || requestType === `openai-video` ?
                normalizedVideoSize :
                effectiveFieldMapping.resolution === `resolution` ?
                requestAspectRatioValue || videoSizeValue :
                videoSizeValue);
              if (effectiveVideoRequestProfile?.omitDuration !== true && effectiveFieldMapping.duration !== ``) {
                let durationField = effectiveFieldMapping.duration || `duration`;
                jsonBody[durationField] = getFieldValue(durationField, Number(durationValue) || durationValue);
              }!isVeoModel &&
                effectiveFieldMapping.resolution !== `` &&
                resolutionValue &&
                (() => {
                  let resolutionField = effectiveFieldMapping.resolution || `resolution`;
                  jsonBody[resolutionField] = getFieldValue(resolutionField, resolutionValue);
                })();
              requestAspectRatioValue &&
                effectiveFieldMapping.aspectRatio &&
                effectiveFieldMapping.aspectRatio !== effectiveFieldMapping.resolution &&
                (() => {
                  let aspectRatioValue = getVideoAspectRatioAdapterValue();
                  aspectRatioValue !== `` &&
                    (jsonBody[effectiveFieldMapping.aspectRatio] = getFieldValue(
                      effectiveFieldMapping.aspectRatio,
                      aspectRatioValue,
                    ));
                })();
              effectiveVideoRequestProfile?.extraBody &&
                typeof effectiveVideoRequestProfile.extraBody == `object` &&
                (jsonBody = {
                  ...jsonBody,
                  ...effectiveVideoRequestProfile.extraBody,
                });
              if (imageReferences.length > 0) {
                let referenceImageField = effectiveFieldMapping.referenceImage || `first_frame_image`;
                if (referenceImagesAsArray) {
                  jsonBody[referenceImageField] = await Promise.all(
                    imageReferences.map((reference) =>
                      (async () => {
                        let referenceUrl = typeof reference === `string` ? reference : reference?.url || ``,
                          imageUrl = referenceImagesAsUrls || (referenceUrl && !/^(https?:|data:)/i.test(referenceUrl)) ?
                          await uploadReferenceMediaForUrlOnlyModel(referenceUrl, `image`) :
                          referenceUrl,
                          itemShape =
                          effectiveVideoRequestProfile?.referenceImageItemShape ||
                          ``;
                        return itemShape === `image_url_object` ?
                          {
                            image_url: imageUrl
                          } :
                          imageUrl;
                      })(),
                    ),
                  );
                } else {
                  let itemShape = effectiveVideoRequestProfile?.referenceImageItemShape || ``,
                    firstReferenceUrl = typeof imageReferences[0] === `string` ? imageReferences[0] : imageReferences[0]?.url || ``,
                    imageUrl = referenceImagesAsUrls || (firstReferenceUrl && !/^(https?:|data:)/i.test(firstReferenceUrl)) ?
                    await uploadReferenceMediaForUrlOnlyModel(firstReferenceUrl, `image`) :
                    firstReferenceUrl;
                  jsonBody[referenceImageField] = itemShape === `image_url_object` ? {
                    image_url: imageUrl
                  } : imageUrl;
                }
              }
              if (/^grok-imagine-video$/i.test(String(modelName || ``))) {
                let referenceImageField = effectiveFieldMapping.referenceImage || `first_frame_image`,
                  referenceImages = jsonBody[referenceImageField];
                jsonBody.resolution_name ||
                  (jsonBody.resolution_name = String(videoSizeValue || `720P`)
                    .trim()
                    .toLowerCase());
                jsonBody.preset || (jsonBody.preset = `custom`);
                aspectRatio &&
                  jsonBody.aspect_ratio === undefined &&
                  (jsonBody.aspect_ratio = aspectRatio);
                if (Array.isArray(referenceImages)) {
                  let imageReferences2 = referenceImages
                    .map((item) =>
                      item && typeof item == `object` && item.image_url ? item.image_url : item,
                    )
                    .filter(Boolean);
                  imageReferences2.length > 0 &&
                    jsonBody.image_references === undefined &&
                    (jsonBody.image_references = imageReferences2);
                }
              }
              console.info(
                `Sending Video API request info: ${safeStringifyRequestForLog({
			                modelName: modelName,
			                protocolName: selectedVideoProtocolName,
			                requestType: requestType,
			                submitUrl: submitUrl,
			                pollPath: pollPathTemplate,
			                body: jsonBody,
			              })}`,
              );
              let submitResponse = await fetch(submitUrl, {
                method: `POST`,
                headers: {
                  Authorization: `Bearer ${videoKey}`,
                  "Content-Type": `application/json`,
                },
                body: JSON.stringify(jsonBody),
                signal: abortController.signal,
              });
              if (!submitResponse.ok) {
                let errorMessage = `API 请求失败: ${submitResponse.status} ${submitResponse.statusText}`;
                try {
                  let errorData = await submitResponse.json();
                  errorMessage =
                    errorData.error && errorData.error.message ?
                    `API 请求失败: ${errorData.error.message}` :
                    errorData.message ?
                    `API 请求失败: ${errorData.message}` :
                    `API 请求失败: ${submitResponse.status} - ${serializeErrorPreview(errorData)}`;
                } catch {
                  try {
                    let errorText = await submitResponse.text();
                    errorMessage = `API 请求失败: ${submitResponse.status} - ${serializeErrorPreview(errorText)}`;
                  } catch {}
                }
                throw Error(errorMessage);
              }
              let rawResponseText = await submitResponse.text(),
                submitResult;
              try {
                submitResult = rawResponseText ? JSON.parse(rawResponseText) : {};
              } catch (error) {
                throw Error(
                  `视频接口返回了非 JSON 响应，请检查模型绑定的 API 地址是否正确${rawResponseText ? `: ${rawResponseText.slice(0, 160)}` : ``}`,
                );
              }
              console.info(
                `Video API submit response: ${JSON.stringify({
		                modelName: modelName,
		                submitUrl: submitUrl,
		                response: submitResult,
		              })}`,
              );
              if (submitResult.error) throw Error(submitResult.error.message || `提交任务失败`);
              let taskId = submitResult.id || submitResult.task_id || submitResult.taskId || submitResult.data?.id || submitResult.data?.task_id;
              if (!taskId) throw Error(`提交成功但未返回任务 ID`);
              (updateTaskList &&
                updateTaskList((tasks) => [
                  ...tasks,
                  {
                    id: taskId,
                    type: `video`,
                    provider: `video`,
                    apiBaseUrl: videoBaseUrl,
                    apiConfigId: videoConfig?.id,
                    modelName: modelName,
	                    requestProfile: {
	                      requestType: requestType,
	                      submitPath: submitPath,
	                      submitUrl: submitUrl,
	                      pollPath: pollPathTemplate,
	                      pollUrl: videoBuildApiUrl(baseUrl, replaceTaskPath(pollPathTemplate, taskId)),
	                      contentPath: contentPathTemplate,
	                      referenceImageField: effectiveFieldMapping.referenceImage || `input_reference`,
	                      referenceImageCount: imageReferences.length,
	                      referenceVideoCount: videoReferences.length,
                      requiresReferenceImage: requiresReferenceImage,
                    },
                    projectId: projectIdAtStart,
                    nodeId: nodeId,
                    status: `pending`,
                    progress: 0,
                    createdAt: Date.now(),
                    prompt: prompt,
                  },
                ]),
                setNodes((nodes3) =>
                  nodes3.map((node) =>
                    node.id === nodeId ?
	                    {
	                      ...node,
	                      data: {
	                        ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                        taskId: taskId,
	                        videoUrl: undefined,
	                        thumbnailUrl: undefined,
	                        resultData: undefined
	                      }
	                    } :
                    node,
                  ),
	                ),
	                await persistVideoNodeState({}, {
	                  taskId: taskId,
	                  videoUrl: undefined,
	                  thumbnailUrl: undefined,
	                  resultData: undefined
	                }, {
	                  clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	                }),
                localStorage.setItem(dailyLimitKey, (edgesList + 1).toString()),
                setDailyGenerationCount(edgesList + 1),
                showToast(`任务提交成功，正在生成中...`));
              let done = false,
                pollCount = 0,
                errorCount = 0,
                videoPollingTimeoutMs = Math.max(5e3, (Number(timeoutSeconds) || 600) * 1e3),
                videoPollingStartedAt = Date.now(),
                maxPolls = Math.max(1, Math.ceil(videoPollingTimeoutMs / Math.max(Number(pollIntervalMs) || 3e3, 500))),
                fetchVideoByFileId = async (fileId) => {
                  if (!fileId) return {
                    videoUrl: ``,
                    thumbnailUrl: ``
                  };
                  let apiUrl = buildApiUrl(
                      isXpclawMiniMax23 ? apiOrigin : baseUrl,
                      `/v1/files/retrieve`,
                    ),
                    requestUrl = new URL(apiUrl);
                  requestUrl.searchParams.set(`file_id`, fileId);
                  let response = await fetch(requestUrl.toString(), {
                    headers: {
                      Authorization: `Bearer ${videoKey}`
                    },
                  });
                  if (!response.ok)
                    throw Error(`文件地址获取失败: ${response.status} ${response.statusText}`);
                  let result = await response.json(),
                    downloadUrl = result?.file?.download_url || result?.download_url || ``;
                  return {
                    videoUrl: typeof downloadUrl == `string` ? downloadUrl.replace(/[`\s]/g, ``) : ``,
                    thumbnailUrl: ``,
                  };
                };
              for (; !done;) {
                if (abortController.signal.aborted) throw Error(`生成已取消`);
                if (Date.now() - videoPollingStartedAt >= videoPollingTimeoutMs)
                  throw Error(`视频生成超时，请在设置中增大全局异步轮询最大时长后重试`);
                (await new Promise((resolve) => setTimeout(resolve, pollIntervalMs)),
                  pollCount++,
                  pollCount % 120 == 0 && pollCount < maxPolls && showToast(`视频生成仍在进行中，请耐心等待...`));
                try {
                  let pollUrl = buildApiUrl(baseUrl, replaceTaskPath(pollPathTemplate, taskId)),
                    response = await fetch(pollUrl, {
                      headers: {
                        Authorization: `Bearer ${videoKey}`
                      },
                    });
                  if (!response.ok) throw Error(`Polling failed: ${response.status}`);
                  let data = await response.json(),
                    status = String(data.status || data.base_resp?.status_msg || ``)
                    .trim()
                    .toLowerCase(),
                    fileId =
                    data.file_id ||
                    data.fileId ||
                    data.data?.file_id ||
                    data.output?.file_id ||
                    data.result?.file_id,
                    directVideoUrl =
                    data.video_url ||
                    data.videoUrl ||
                    data.data?.video_url ||
                    data.data?.videoUrl ||
                    data.output?.video_url ||
                    data.output?.videoUrl ||
                    data.result?.video_url ||
                    data.result?.videoUrl ||
                    data.video?.url ||
                    data.artifact?.video?.url ||
                    data.artifact?.video_raw?.url;
                  if (
                    ((errorCount = 0),
                      [`success`, `succeeded`, `completed`].includes(status) ||
                      fileId ||
                      directVideoUrl)
                  ) {
                    done = true;
                    console.info(
                      `Video API poll completed: ${JSON.stringify({
			                      modelName: modelName,
			                      taskId: taskId,
			                      pollUrl: pollUrl,
			                      status: height,
			                      fileId: aspectRatio2 || ``,
			                      directVideoUrl: directVideoUrl || ``,
			                      response: width,
			                    })}`,
                    );
                    let {
                      videoUrl: videoUrl,
                      thumbnailUrl: thumbUrl
                    } =
                    directVideoUrl
                      ?
                      {
                        videoUrl: String(directVideoUrl).replace(/[`\s]/g, ``),
                        thumbnailUrl: ``
                      } :
                      await fetchVideoByFileId(aspectRatio2);
                    if (!videoUrl) throw Error(`任务已完成，但未返回视频地址`);
                    updateTaskList &&
                      updateTaskList((nodes3) =>
                        nodes3.map((node) =>
                          node.id === taskId ?
                          {
                            ...node,
                            status: `completed`,
                            progress: 100,
                            resultUrl: videoUrl,
                            thumbnailUrl: thumbUrl,
                          } :
                          node,
                        ),
                      );
                    let width = 320,
                      height = 320,
                      aspectRatio2 = null;
                    if (thumbUrl) {
                      let dimensionMatch = String(thumbUrl)
                        .trim()
                        .match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
                      if (dimensionMatch) {
                        let width2 = Number(dimensionMatch[1]),
                          height2 = Number(dimensionMatch[2]);
                        if (!isNaN(width2) && !isNaN(height2) && height2 > 0) {
                          let aspectRatio3 = width2 / height2;
                          (aspectRatio2 = `${width2} / ${height2}`),
                          aspectRatio3 > 1 ?
                            ((width = Math.min(600, Math.max(320, 360 * aspectRatio3))),
                              (height = width / aspectRatio3)) :
                            aspectRatio3 < 1 ?
                            ((height = 420), (width = height * aspectRatio3)) :
                            ((height = 320), (width = height));
                        }
                      }
                    }
                    (setNodes((nodes3) =>
                          nodes3.map((node) =>
                            node.id === nodeId &&
                            (node.data?.seedanceTaskId === taskId || node.data?.taskId === taskId) ?
                            {
                              ...node,
                              style: {
                              ...node.style,
                              width: width,
                              height: height + 24
	                            },
	                            data: {
	                              ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                              videoUrl: videoUrl,
                              thumbnailUrl: thumbUrl,
                              videoAspectRatio: aspectRatio2,
                              loading: false,
                              progress: 100,
                            },
                          } :
                          node,
                        ),
                      ),
                      await persistVideoNodeState({
                        width: width,
                        height: height + 24
                      }, {
                        videoUrl: videoUrl,
                        thumbnailUrl: thumbUrl,
                        videoAspectRatio: aspectRatio2,
	                        loading: false,
	                        progress: 100,
	                      }, {
	                        clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	                      }),
                      addGeneratedAsset && videoUrl && addGeneratedAsset(videoUrl, `video`, `generated`),
                      showToast(`视频生成成功！`));
                    break;
                  } else if ([`failed`, `error`, `fail`].includes(status)) {
                    throw Error(extractVideoTaskErrorHelper(data));
                  } else {
                    let progress =
                      data.progress !== undefined && data.progress !== null ?
                      parseInt(data.progress) :
                      Math.min(99, pollCount * 2);
                    progress = Math.min(99, Math.max(0, isNaN(progress) ? pollCount * 2 : progress));
                    (updateTaskList &&
                      updateTaskList((nodes3) =>
                        nodes3.map((node) =>
                          node.id === taskId ?
                          updateTaskRunningProgress(node, progress) :
                          node,
                        ),
                      ),
                      setNodes((nodes3) =>
                          nodes3.map((node) =>
                            node.id === nodeId &&
                            (node.data?.seedanceTaskId === taskId || node.data?.taskId === taskId) ?
                            {
                              ...node,
                              data: {
                              ...node.data,
                              progress: progress
                            }
                          } :
                          node,
                        ),
                      ));
                  }
                } catch (error) {
                  (console.warn(`Polling error:`, error),
                    errorCount++,
                    errorCount === 5 && showToast(`视频状态查询暂时失败，仍会继续重试...`));
                }
              }
              return;
            }
            let multipartResolutionValue = getVideoResolutionAdapterValue(modelUsesDimensionSize ?
              normalizedVideoSize :
              useAspectRatioAsSize ?
              (requestAspectRatioValue ? requestAspectRatioValue.replace(`:`, `x`) : `16x9`) :
              videoSizeValue),
              fetchVideoContentUrlByTaskId = async (taskId2, contentPathTemplate2 = contentPathTemplate) => {
                if (!taskId2 || !contentPathTemplate2) return ``;
                let apiUrl = videoBuildApiUrl(baseUrl, replaceTaskPath(contentPathTemplate2, taskId2)),
                  response = await fetch(apiUrl, {
                    headers: {
                      Authorization: `Bearer ${videoKey}`
                    },
                    signal: abortController.signal,
                  });
                if (!response.ok)
                  throw Error(`视频内容获取失败: ${response.status} ${response.statusText}`);
                let videoBlob = await response.blob();
                return URL.createObjectURL(videoBlob);
              };
            let formData = new FormData();
            formData.append(effectiveFieldMapping.model || `model`, modelName);
            formData.append(effectiveFieldMapping.prompt || `prompt`, prompt2);
            let isVeoModel = /^veo/i.test(modelName) && !isLconaiVideoApi;
            isVeoModel ||
              effectiveFieldMapping.resolution === `` ||
              formData.append(
                effectiveFieldMapping.resolution || `size`,
                multipartResolutionValue,
              );
            requestAspectRatioValue &&
              !useAspectRatioAsSize &&
              effectiveFieldMapping.aspectRatio !== `` &&
              (() => {
                let aspectRatioValue = getVideoAspectRatioAdapterValue();
                aspectRatioValue !== `` &&
                  formData.append(
                    effectiveFieldMapping.aspectRatio || `aspect_ratio`,
                    aspectRatioValue,
                  );
		              })();
		            let referencesHandledByAggregation = false;
		            if (referenceMediaAggregation === `comma-separated`) {
		              let orderedEntries = wanjuanBuildReferenceMediaEntries(imageReferences, videoReferences, { kinds: referenceMediaKinds, order: referenceMediaOrder }),
		                referenceUrls = [];
		              for (let entry of orderedEntries) {
		                let publicUrl = await uploadReferenceMediaForUrlOnlyModel(entry.value, entry.kind);
		                publicUrl && referenceUrls.push(publicUrl);
		              }
		              referenceUrls.length > 0 && formData.append(referenceMediaField, referenceUrls.join(`,`));
		              referencesHandledByAggregation = true;
		            }
		            if (
		              (effectiveVideoRequestProfile?.omitDuration === true ||
	                effectiveFieldMapping.duration === `` ||
	                (() => {
	                  let durationField = effectiveFieldMapping.duration || `seconds`;
	                  formData.append(durationField, getFieldValue(durationField, durationValue));
	                })(),
		                !referencesHandledByAggregation && imageReferences.length > 0)
	            )
              if (referenceImagesAsUrls) {
                for (let index = 0; index < imageReferences.length; index++) {
                  let referenceImageUrl = await uploadReferenceMediaForUrlOnlyModel(typeof imageReferences[index] === `string` ? imageReferences[index] : imageReferences[index]?.url || ``, `image`);
                  referenceImageUrl &&
                    formData.append(
                      effectiveFieldMapping.referenceImage ||
                      `input_reference`,
                      referenceImageUrl,
                    );
                }
	              } else
	                for (let index = 0; index < imageReferences.length; index++) {
	                  let dataUrl = await mediaUrlToDataUrl(typeof imageReferences[index] === `string` ? imageReferences[index] : imageReferences[index]?.url || ``);
	                  try {
                    let base64Data = dataUrl.split(`,`)[1],
                      mimeType = dataUrl.split(`,`)[0].split(`:`)[1].split(`;`)[0],
                      binaryString = atob(base64Data),
                      arrayBuffer = new ArrayBuffer(binaryString.length),
                      byteArray = new Uint8Array(arrayBuffer);
                    for (let index2 = 0; index2 < binaryString.length; index2++) byteArray[index2] = binaryString.charCodeAt(index2);
                    let imageBlob = new Blob([arrayBuffer], {
                        type: mimeType
                      }),
                      fileExtension = `png`;
                    (mimeType === `image/jpeg` ?
                      (fileExtension = `jpg`) :
                      mimeType === `image/webp` && (fileExtension = `webp`),
                      formData.append(
                        effectiveFieldMapping.referenceImage ||
                        `input_reference`,
                        imageBlob,
                        `reference_${index + 1}.${fileExtension}`,
                      ));
                  } catch (error) {
                    console.error(`Error processing reference image:`, error);
                    let imageBlob = await (await fetch(dataUrl)).blob();
                    formData.append(
                      effectiveFieldMapping.referenceImage ||
                      `input_reference`,
                      imageBlob,
                      `reference_${index + 1}.png`,
                    );
                  }
                }
            if (!referencesHandledByAggregation && videoReferences.length > 0)
              if (referenceVideosAsUrls) {
                for (let index = 0; index < videoReferences.length; index++) {
                  let referenceVideoUrl = await uploadReferenceMediaForUrlOnlyModel(videoReferences[index], `video`);
                  referenceVideoUrl &&
                    formData.append(
                      effectiveFieldMapping.referenceVideo ||
                      `input_video`,
                      referenceVideoUrl,
                    );
                }
              } else
                for (let index = 0; index < videoReferences.length; index++) {
                  let dataUrl = videoReferences[index];
                  try {
                    let base64Data = dataUrl.split(`,`)[1],
                      mimeType = dataUrl.split(`,`)[0].split(`:`)[1].split(`;`)[0],
                      binaryString = atob(base64Data),
                      arrayBuffer = new ArrayBuffer(binaryString.length),
                      byteArray = new Uint8Array(arrayBuffer);
                    for (let index2 = 0; index2 < binaryString.length; index2++) byteArray[index2] = binaryString.charCodeAt(index2);
                    let videoBlob = new Blob([arrayBuffer], {
                        type: mimeType
                      }),
                      fileExtension = `mp4`;
                    (mimeType === `video/webm` && (fileExtension = `webm`),
                      formData.append(
                        effectiveFieldMapping.referenceVideo || `input_video`,
                        videoBlob,
                        `reference_video_${index + 1}.${fileExtension}`,
                      ));
                  } catch (error) {
                    console.error(`Error processing reference video:`, error);
                    let videoBlob = await (await fetch(dataUrl)).blob();
                    formData.append(
                      effectiveFieldMapping.referenceVideo || `input_video`,
                      videoBlob,
                      `reference_video_${index + 1}.mp4`,
                    );
                  }
                }
            if (seedanceAudioRefs.length > 0 && effectiveFieldMapping.referenceAudio) {
              let referenceAudioUrl = await uploadReferenceMediaForUrlOnlyModel(seedanceAudioRefs[0], `audio`);
              referenceAudioUrl && formData.append(effectiveFieldMapping.referenceAudio, referenceAudioUrl);
            }
            console.info(
              `Sending Multipart Video API request info: ${safeStringifyRequestForLog({
                modelName: modelName,
                protocolName: selectedVideoProtocolName,
                requestType: requestType,
                submitUrl: submitUrl,
                pollPath: pollPathTemplate,
                fields: Array.from(formData.keys()),
                referenceImageField: effectiveFieldMapping.referenceImage || `input_reference`,
                referenceImageCount: imageReferences.length,
                referenceVideoCount: videoReferences.length,
              })}`,
            );
            let response = await fetch(submitUrl, {
              method: `POST`,
              headers: {
                Authorization: `Bearer ${videoKey}`
              },
              body: formData,
              signal: abortController.signal,
            });
            if (!response.ok) {
              let errorMessage = `API 请求失败: ${response.status} ${response.statusText}`;
              try {
                let errorData = await response.json();
                errorMessage =
                  errorData.error && errorData.error.message ?
                  `API 请求失败: ${errorData.error.message}` :
                  errorData.message ?
                  `API 请求失败: ${errorData.message}` :
                  `API 请求失败: ${response.status} - ${serializeErrorPreview(errorData)}`;
              } catch {
                try {
                  let errorText = await response.text();
                  errorMessage = `API 请求失败: ${response.status} - ${serializeErrorPreview(errorText)}`;
                } catch {}
              }
              throw Error(errorMessage);
            }
            let submitResult = await response.json();
            if (submitResult.error) throw Error(submitResult.error.message || `提交任务失败`);
            let fetchVideoByFileId = async (fileId) => {
                if (!fileId) return {
                  videoUrl: ``,
                  thumbnailUrl: ``
                };
                let retrieveUrl = buildApiUrl(baseUrl, `/v1/files/retrieve`),
                  requestUrl = new URL(retrieveUrl);
                requestUrl.searchParams.set(`file_id`, fileId);
                let response2 = await fetch(requestUrl.toString(), {
                  headers: {
                    Authorization: `Bearer ${videoKey}`
                  },
                });
                if (!response2.ok) throw Error(`文件地址获取失败: ${response2.status} ${response2.statusText}`);
                let fileData = await response2.json(),
                  downloadUrl = fileData?.file?.download_url || fileData?.download_url || ``;
                return {
                  videoUrl: typeof downloadUrl == `string` ? downloadUrl.replace(/[`\s]/g, ``) : ``,
                  thumbnailUrl: ``,
                };
              },
              normalizeGenericVideoResult = async (taskResult, taskIdForContent = taskId) => {
                  // 数据驱动优先：若协议 responseMapping 配了视频结果路径(videoUrl/video_url/url/resultUrl 任一)，
                  // 先按协议路径取;取不到再回退下面的硬编码字段瀑布(保证未配协议的旧中转站仍可用)。
                  let readRespPath = (source, path) => {
                    let trimmedPath = String(path || ``).trim(); if (!trimmedPath) return undefined;
                    return trimmedPath.split(`.`).reduce((cur, seg) => {
                      if (cur == null) return undefined;
                      let arrayIndexMatch = seg.match(/^(.+)\[(\d+)\]$/);
                      return arrayIndexMatch ? cur?.[arrayIndexMatch[1]]?.[Number(arrayIndexMatch[2])] : /^\d+$/.test(seg) ? cur?.[Number(seg)] : cur?.[seg];
                    }, source);
                  };
                  let videoRespMapping = effectiveVideoRequestProfile?.responseMapping && typeof effectiveVideoRequestProfile.responseMapping == `object` ? effectiveVideoRequestProfile.responseMapping : {};
                  let mappedVideoUrl = (() => {
                    let paths = videoRespMapping.video || videoRespMapping.videoUrl || videoRespMapping.video_url || videoRespMapping.url || videoRespMapping.resultUrl;
                    paths = Array.isArray(paths) ? paths : paths ? [paths] : [];
                    for (let responsePath of paths) { let resolvedValue = readRespPath(taskResult, responsePath); if (typeof resolvedValue == `string` && resolvedValue.trim()) return resolvedValue.replace(/[`\s]/g, ``); }
                    return ``;
                  })();
                  let videoUrl = mappedVideoUrl || (taskResult.video_url || taskResult.videoUrl || taskResult.data?.result_url || taskResult.data?.video_url || taskResult.data?.videoUrl || taskResult.output?.video_url || taskResult.output?.videoUrl || taskResult.result?.video_url || taskResult.result?.videoUrl || taskResult.video?.url || taskResult.artifact?.video?.url || taskResult.artifact?.video_raw?.url || taskResult.video || taskResult.result_url || taskResult.url)?.replace(
                      /[`\s]/g,
                      ``,
                    ) || ``,
                    thumbnailUrl =
                    (taskResult.thumbnail_url || taskResult.cover_url || taskResult.thumbnail)?.replace(
                      /[`\s]/g,
                      ``,
                    ) || ``,
                    fileId =
                    taskResult.file_id ||
                    taskResult.fileId ||
                    taskResult.data?.file_id ||
                    taskResult.output?.file_id ||
                    taskResult.result?.file_id;
                  return !videoUrl && fileId ?
                    await fetchVideoByFileId(fileId) :
                    !videoUrl && contentPathTemplate ?
                    {
                      videoUrl: await fetchVideoContentUrlByTaskId(taskIdForContent, contentPathTemplate),
                      thumbnailUrl: thumbnailUrl,
                    } :
                    {
                      videoUrl: videoUrl,
                      thumbnailUrl: thumbnailUrl
                    };
                },
                normalizeGenericStatus = (value) =>
                String(value || ``)
                .trim()
                .toLowerCase(),
                taskId = submitResult.id || submitResult.task_id || submitResult.taskId || submitResult.data?.id || submitResult.data?.task_id;
            if (!taskId) throw Error(`提交成功但未返回任务 ID`);
            createdVideoTaskId = taskId;
            (updateTaskList &&
              updateTaskList((tasks) => [
                ...tasks,
                {
                  id: taskId,
                  type: `video`,
                  provider: `video`,
                  apiBaseUrl: videoBaseUrl,
                  apiConfigId: videoConfig?.id,
                  modelName: modelName,
	                  requestProfile: {
	                    requestType: requestType,
	                    submitPath: submitPath,
	                    submitUrl: submitUrl,
	                    pollPath: pollPathTemplate,
	                    pollUrl: videoBuildApiUrl(baseUrl, replaceTaskPath(pollPathTemplate, taskId)),
	                    contentPath: contentPathTemplate,
	                    referenceImageField: effectiveFieldMapping.referenceImage || `input_reference`,
                    referenceImageCount: imageReferences.length,
                    referenceVideoCount: videoReferences.length,
                    requiresReferenceImage: requiresReferenceImage,
                  },
                  projectId: projectIdAtStart,
                  nodeId: nodeId,
                  status: `pending`,
                  progress: 0,
                  createdAt: Date.now(),
                  prompt: prompt,
                },
              ]),
              setNodes((nodes3) =>
                nodes3.map((node) =>
                  node.id === nodeId ?
	                  {
	                    ...node,
	                    data: {
	                      ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                      taskId: taskId,
	                      videoUrl: undefined,
	                      thumbnailUrl: undefined,
	                      resultData: undefined
	                    }
	                  } :
                  node,
                ),
	              ),
	              await persistVideoNodeState({}, {
	                taskId: taskId,
	                videoUrl: undefined,
	                thumbnailUrl: undefined,
	                resultData: undefined
	              }, {
	                clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	              }),
              localStorage.setItem(dailyLimitKey, (edgesList + 1).toString()),
              setDailyGenerationCount(edgesList + 1),
              showToast(`任务提交成功，正在生成中...`));
            let isCompleted = false,
              pollCount = 0,
              failureCount = 0,
              multipartPollingTimeoutMs = Math.max(5e3, (Number(timeoutSeconds) || 600) * 1e3),
              multipartPollingStartedAt = Date.now(),
              maxPollCount = Math.max(1, Math.ceil(multipartPollingTimeoutMs / Math.max(Number(pollIntervalMs) || 3e3, 500)));
            for (; !isCompleted;) {
              if (abortController.signal.aborted) throw Error(`生成已取消`);
              if (Date.now() - multipartPollingStartedAt >= multipartPollingTimeoutMs)
                throw Error(`视频生成超时，请在设置中增大全局异步轮询最大时长后重试`);
              (await new Promise((resolve) => setTimeout(resolve, pollIntervalMs)),
                pollCount++,
                pollCount % 120 == 0 && pollCount < maxPollCount && showToast(`视频生成仍在进行中，请耐心等待...`));
              try {
                let pollResponse = await fetch(
                  videoBuildApiUrl(baseUrl, replaceTaskPath(pollPathTemplate, taskId)), {
                    headers: {
                      Authorization: `Bearer ${videoKey}`
                    },
                  },
                );
                if (pollResponse.ok) {
                  let pollResult = await pollResponse.json(),
                    status = normalizeGenericStatus(
                      // 协议 responseMapping.status 配了状态路径就优先用,否则回退硬编码字段瀑布。
                      (() => {
                        let responseMapping = effectiveVideoRequestProfile?.responseMapping;
                        let statusPathSpec = responseMapping && typeof responseMapping == `object` ? (responseMapping.status || responseMapping.statusPath) : null;
                        statusPathSpec = Array.isArray(statusPathSpec) ? statusPathSpec : statusPathSpec ? [statusPathSpec] : [];
                        for (let statusPathEntry of statusPathSpec) { let statusValue = String(statusPathEntry||``).trim().split(`.`).reduce((reduceAccumulator,pathSegment)=>reduceAccumulator==null?undefined:reduceAccumulator[pathSegment], pollResult); if (statusValue != null && statusValue !== ``) return statusValue; }
                        return pollResult.status || pollResult.data?.status || pollResult.output?.status || pollResult.result?.status || pollResult.task?.status;
                      })(),
                    ),
                    genericDirectVideoUrl =
                    pollResult.video_url ||
                    pollResult.videoUrl ||
                    pollResult.data?.video_url ||
                    pollResult.data?.videoUrl ||
                    pollResult.output?.video_url ||
                    pollResult.output?.videoUrl ||
                    pollResult.result?.video_url ||
                    pollResult.result?.videoUrl ||
                    pollResult.data?.result_url ||
                    pollResult.video?.url ||
                    pollResult.artifact?.video?.url ||
                    pollResult.artifact?.video_raw?.url;
                  let completedValueSet = (() => {
                    let videoResponseMapping = effectiveVideoRequestProfile?.responseMapping;
                    let completedValuesSpec = videoResponseMapping && typeof videoResponseMapping == `object` ? (videoResponseMapping.completedValues || videoResponseMapping.completed) : null;
                    completedValuesSpec = Array.isArray(completedValuesSpec) ? completedValuesSpec.map((item) => normalizeGenericStatus(item)).filter(Boolean) : [];
                    return completedValuesSpec.length ? completedValuesSpec : [`completed`, `complete`, `success`, `succeeded`, `done`, `finished`, `ready`, `succeed`];
                  })();
                  if (((failureCount = 0), completedValueSet.includes(status) || genericDirectVideoUrl)) {
                    isCompleted = true;
                    let {
                      videoUrl: videoUrl,
                      thumbnailUrl: thumbnailUrl
                    } =
                    await normalizeGenericVideoResult(pollResult);
                    if (!videoUrl) throw Error(`任务已完成，但未返回视频地址`);
                    updateTaskList &&
                      updateTaskList((nodes3) =>
                        nodes3.map((node) =>
                          node.id === taskId ?
                          {
                            ...node,
                            status: `completed`,
                            progress: 100,
                            resultUrl: videoUrl,
                            thumbnailUrl: thumbnailUrl,
                          } :
                          node,
                        ),
                      );
                    let width = 320,
                      height = 320,
                      seedanceNodeRatio = null;
                    if (resolution) {
                      let sizeMatch = String(normalizedVideoSize)
                        .trim()
                        .match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
                      if (sizeMatch) {
                        let ratioWidth = Number(sizeMatch[1]),
                          ratioHeight = Number(sizeMatch[2]);
                        if (!isNaN(ratioWidth) && !isNaN(ratioHeight) && ratioHeight > 0) {
                          let aspectRatio2 = ratioWidth / ratioHeight;
                          (seedanceNodeRatio = `${ratioWidth} / ${ratioHeight}`),
                          aspectRatio2 > 1 ?
                            ((width = Math.min(600, Math.max(320, 360 * aspectRatio2))),
                              (height = width / aspectRatio2)) :
                            aspectRatio2 < 1 ?
                            ((height = 420), (width = height * aspectRatio2)) :
                            ((height = 320), (width = height));
                        }
                      }
                    }
                    (setNodes((nodes3) =>
                        nodes3.map((node) =>
                          node.id === nodeId ?
                          {
                            ...node,
                            style: {
                              ...node.style,
                              width: width,
                              height: height + 24
	                            },
	                            data: {
	                              ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                              videoUrl: videoUrl,
                              thumbnailUrl: thumbnailUrl,
                              videoAspectRatio: seedanceNodeRatio,
                              loading: false,
                              progress: 100,
                            },
                          } :
                          node,
                        ),
                      ),
                      await persistVideoNodeState({
                        width: width,
                        height: height + 24
                      }, {
                        videoUrl: videoUrl,
                        thumbnailUrl: thumbnailUrl,
                        videoAspectRatio: seedanceNodeRatio,
	                        loading: false,
	                        progress: 100,
	                      }, {
	                        clearProjectAssetBindings: [`videoUrl`, `thumbnailUrl`, `resultData`]
	                      }),
                      addGeneratedAsset && videoUrl && addGeneratedAsset(videoUrl, `video`, `generated`),
                      showToast(`视频生成成功！`));
                    break;
                  } else if (((() => {
                    let videoResponseMapping = effectiveVideoRequestProfile?.responseMapping;
                    let failedValuesSpec = videoResponseMapping && typeof videoResponseMapping == `object` ? (videoResponseMapping.failedValues || videoResponseMapping.failed) : null;
                    failedValuesSpec = Array.isArray(failedValuesSpec) ? failedValuesSpec.map((item) => normalizeGenericStatus(item)).filter(Boolean) : [];
                    return (failedValuesSpec.length ? failedValuesSpec : [`failed`, `failure`, `error`, `fail`, `expired`, `canceled`, `cancelled`, `rejected`]).includes(status);
                  })())) {
                    let taskError = extractVideoTaskErrorHelper(pollResult);
                    throw (
                      pollResult.error &&
                      (typeof pollResult.error == `string` ?
                        (taskError = pollResult.error) :
                        typeof pollResult.error == `object` &&
                        pollResult.error.message &&
                        (taskError = pollResult.error.message)),
                      updateTaskList &&
                      updateTaskList((nodes3) =>
                        nodes3.map((node) =>
                          node.id === taskId ?
                          {
                            ...node,
                            status: `failed`,
                            errorMsg: taskError
                          } :
                          node,
                        ),
                      ),
                      Error(`[TASK_FAILED]${taskError}`)
                    );
                  } else {
                    let progress =
                      pollResult.progress !== undefined && pollResult.progress !== null ?
                      parseInt(pollResult.progress) :
                      pollResult.data?.progress !== undefined &&
                      pollResult.data?.progress !== null ?
                      parseInt(pollResult.data.progress) :
                      Math.min(99, pollCount * 2);
                    progress = Math.min(99, Math.max(0, isNaN(progress) ? pollCount * 2 : progress));
                    (updateTaskList &&
                      updateTaskList((nodes3) =>
                          nodes3.map((node) =>
                            node.id === taskId ?
                            updateTaskRunningProgress(node, progress) :
                          node,
                        ),
                      ),
                      setNodes((nodes3) =>
                        nodes3.map((node) =>
                          node.id === nodeId ?
                          {
                            ...node,
                            data: {
                              ...node.data,
                              progress: progress
                            }
                          } :
                          node,
                        ),
                      ));
                  }
                } else throw Error(`Polling failed: ${pollResponse.status}`);
              } catch (error) {
                if (
                  (console.warn(`Polling error:`, error),
                    error.message && error.message.startsWith(`[TASK_FAILED]`))
                )
                  throw Error(error.message.replace(`[TASK_FAILED]`, ``));
                (failureCount++,
                  failureCount === 5 &&
                  showToast(`视频状态查询暂时失败，仍会继续重试...`));
              }
            }
          } catch (error) {
            let shouldApplyVideoError =
              isCurrentVideoRun() && (!createdVideoTaskId ||
              (nodesRef.current || []).some(
                (node) =>
                  node.id === nodeId &&
                  (node.data?.seedanceTaskId === createdVideoTaskId || node.data?.taskId === createdVideoTaskId),
              ));
            (console.error(error),
              error.name !== `AbortError` &&
              (showToast(error.message || `生成失败，请检查网络或配置`),
                updateTaskList &&
                updateTaskList((nodes2) =>
                  createdVideoTaskId ?
                  nodes2.map((node) =>
                    node.id === createdVideoTaskId ?
                    {
                      ...node,
                      status: `failed`,
                      progress: 0,
                      errorMsg: error.message || `生成失败，请检查网络或配置`,
                    } :
                    node,
                  ) :
                  [
                    ...nodes2,
                    {
                      id: `video-local-${nodeId}-${Date.now()}`,
                      type: `video`,
                      provider: `video`,
                      apiBaseUrl: videoBaseUrl,
                      apiConfigId: videoConfig?.id,
                      modelName: modelName,
                      requestProfile: {
                        ...(videoModelRequestProfile || {}),
                        referenceImageField: videoModelRequestProfile?.fieldMapping?.referenceImage || `input_reference`,
                        referenceImageCount: 0,
                        referenceVideoCount: 0,
                        requiresReferenceImage: videoModelRequestProfile?.requiresReferenceImage === true,
                      },
                      projectId: projectIdAtStart,
                      nodeId: nodeId,
                      status: `failed`,
                      progress: 0,
                      createdAt: Date.now(),
                      prompt: videoTaskPromptForDiagnostics || `视频生成任务`,
                      errorMsg: error.message || `生成失败，请检查网络或配置`,
                    },
                  ],
                ),
                shouldApplyVideoError &&
                (await persistVideoNodeState({}, {
                  loading: false,
                  errorMessage: error.message,
                }, ),
                setNodes((nodes2) =>
                  nodes2.map((node) =>
                    node.id === nodeId &&
                    (!createdVideoTaskId ||
                      node.data?.seedanceTaskId === createdVideoTaskId ||
                      node.data?.taskId === createdVideoTaskId) ?
                    {
                      ...node,
                      data: {
                        ...node.data,
                        loading: false,
                        errorMessage: error.message,
                      },
                    } :
                    node,
                  ),
                ))));
          } finally {
            let shouldFinalizeVideoGeneration =
              isCurrentVideoRun() && (!createdVideoTaskId ||
              (nodesRef.current || []).some(
                (node) =>
                  node.id === nodeId &&
                  (node.data?.seedanceTaskId === createdVideoTaskId || node.data?.taskId === createdVideoTaskId),
              ));
            (shouldFinalizeVideoGeneration && abortControllersRef.current.delete(nodeId),
              shouldFinalizeVideoGeneration && videoRunTokens.delete(nodeId),
              shouldFinalizeVideoGeneration &&
              setEdges((edges2) =>
                edges2.map((edge) => (edge.target === nodeId ? {
                  ...edge,
                  animated: false
                } : edge)),
              ));
          }
        },
        [
          videoApiKey,
          videoApiUrl,
          videoModel,
          videoDurations,
          apiConfigs,
          videoModelApiBindings,
          videoModelProtocolBindings,
          modelProtocolRegistry,
          videoModelRequestProfiles,
          seedanceUploadMode,
          tosConfig,
          customPublicUploadConfig,
          arkTrustedAssetConfig,
          handleArkTrustedAssetReview,
          planLimits,
          showToast,
          getNodes,
          getEdges,
          setNodesRaw,
          setEdgesRaw,
          updateTaskListRaw,
          addGeneratedAsset,
          membership,
        ],
  );
  return { generateVideo };
}
