/**
 * useNodeSyncEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { ApiBindings, ApiConfig, ProtocolBindings, ProtocolRegistry, Ref, SetState, Toast, WjNode } from "../lib/app-types";
import { WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE } from "../lib/upload-defaults";
import { WanJuanGetPreferredModel, WanJuanShouldAutoPreferredModel } from "../lib/model-favorites";
import { WanJuanRenderRuntime, WanJuanStripRuntimeNodeData } from "../components/render-mode";
import { WanJuanSameModelId } from "../lib/model-id";
import { parseSeedanceList } from "../lib/model-binding";

interface UseNodeSyncEffectDeps {
  addCustomNode: any;
  addGeneratedAsset: any;
  apiConfigs: ApiConfig[];
  audioApiKey: any;
  audioApiUrl: any;
  audioModel: any;
  audioModelApiBindings: ApiBindings;
  audioModelProtocolBindings: ProtocolBindings;
  createImageNode: any;
  customPublicUploadConfig: any;
  drawingModel: any;
  generateImage: any;
  generateText: any;
  generateVideo: any;
  handleAIAssist: any;
  handleCancel2: any;
  handleCrop: any;
  handleExtractFrames: any;
  handleGenerateCustom: any;
  handleNoop: any;
  handleSplit: any;
  handleSplitOne: any;
  handleTianjiPortraitReview: any;
  imageCompatResolutions: any;
  imageModelApiBindings: ApiBindings;
  imageModelProtocolBindings: ProtocolBindings;
  modelProtocolRegistry: ProtocolRegistry;
  openImageEditor: any;
  openImagePreview: any;
  openVideoEditor: any;
  presetPrompts: any;
  projectIdRef: Ref;
  qiniuConfig: any;
  seedanceDurations: any;
  seedanceEnableWebSearch: any;
  seedanceGenerateAudio: any;
  seedanceModel: any;
  seedanceRatios: any;
  seedanceResolutions: any;
  seedanceUploadMode: any;
  seedanceVirtualPortraits: any;
  seedanceWatermark: any;
  sendToActiveTab: any;
  setNodes: SetState<WjNode[]>;
  shouldFitView: any;
  showToast: Toast;
  stopGeneration: any;
  textModel: any;
  textModelApiBindings: ApiBindings;
  textModelProtocolBindings: ProtocolBindings;
  tianjiSeedanceModel: any;
  tongyiWanxiangDurations: any;
  tongyiWanxiangEditModels: any;
  tongyiWanxiangImageModels: any;
  tongyiWanxiangRatios: any;
  tongyiWanxiangReferenceImageModels: any;
  tongyiWanxiangResolutions: any;
  tongyiWanxiangTextModels: any;
  tosConfig: any;
  ttsMusicModel: any;
  updateTaskList: any;
  videoAspectRatios: any;
  videoDurations: any;
  videoModel: any;
  videoModelApiBindings: ApiBindings;
  videoModelProtocolBindings: ProtocolBindings;
  videoModelRequestProfiles: any;
  videoResolutions: any;
}

export function useNodeSyncEffect(deps: UseNodeSyncEffectDeps) {
  const {
    addCustomNode,
    addGeneratedAsset,
    apiConfigs,
    audioApiKey,
    audioApiUrl,
    audioModel,
    audioModelApiBindings,
    audioModelProtocolBindings,
    createImageNode,
    customPublicUploadConfig,
    drawingModel,
    generateImage,
    generateText,
    generateVideo,
    handleAIAssist,
    handleCancel2,
    handleCrop,
    handleExtractFrames,
    handleGenerateCustom,
    handleNoop,
    handleSplit,
    handleSplitOne,
    handleTianjiPortraitReview,
    imageCompatResolutions,
    imageModelApiBindings,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    openImageEditor,
    openImagePreview,
    openVideoEditor,
    presetPrompts,
    projectIdRef,
    qiniuConfig,
    seedanceDurations,
    seedanceEnableWebSearch,
    seedanceGenerateAudio,
    seedanceModel,
    seedanceRatios,
    seedanceResolutions,
    seedanceUploadMode,
    seedanceVirtualPortraits,
    seedanceWatermark,
    sendToActiveTab,
    setNodes,
    shouldFitView,
    showToast,
    stopGeneration,
    textModel,
    textModelApiBindings,
    textModelProtocolBindings,
    tianjiSeedanceModel,
    tongyiWanxiangDurations,
    tongyiWanxiangEditModels,
    tongyiWanxiangImageModels,
    tongyiWanxiangRatios,
    tongyiWanxiangReferenceImageModels,
    tongyiWanxiangResolutions,
    tongyiWanxiangTextModels,
    tosConfig,
    ttsMusicModel,
    updateTaskList,
    videoAspectRatios,
    videoDurations,
    videoModel,
    videoModelApiBindings,
    videoModelProtocolBindings,
    videoModelRequestProfiles,
    videoResolutions,
  } = deps;
  useEffect(() => {
    WanJuanRenderRuntime.mark(`setNodes`);
    setNodes((nodes2) => {
      let anySyncChanged = false;
      let syncedNodes = nodes2.map((node) => {
        let nodeData = {
            ...WanJuanStripRuntimeNodeData(node.data || {})
          },
          hasChanged = false;
        let syncNodeResult = (
          (node.type === `promptNode` ||
            node.type === `textNode` ||
            node.type === `videoNode` ||
            node.type === `seedanceNode` ||
            node.type === `tongyiWanxiangNode`) &&
          nodeData.presetPrompts !== presetPrompts &&
          ((nodeData.presetPrompts = presetPrompts), (hasChanged = true)),
          node.type === `videoExtractNode` &&
          (nodeData.onExtractFrames !== handleExtractFrames && ((nodeData.onExtractFrames = handleExtractFrames), (hasChanged = true)),
            nodeData.onShowToast !== showToast && ((nodeData.onShowToast = showToast), (hasChanged = true))),
	          node.type === `promptNode` &&
	          (nodeData.onGenerate !== generateImage && ((nodeData.onGenerate = generateImage), (hasChanged = true)),
	            nodeData.drawingModel !== drawingModel && ((nodeData.drawingModel = drawingModel), (hasChanged = true)),
	            nodeData.imageCompatResolutions !== imageCompatResolutions &&
	            ((nodeData.imageCompatResolutions = imageCompatResolutions), (hasChanged = true)),
	            nodeData.apiConfigs !== apiConfigs &&
            ((nodeData.apiConfigs = apiConfigs), (hasChanged = true)),
            nodeData.modelProtocolRegistry !== modelProtocolRegistry &&
            ((nodeData.modelProtocolRegistry = modelProtocolRegistry), (hasChanged = true)),
            nodeData.imageModelApiBindings !== imageModelApiBindings &&
            ((nodeData.imageModelApiBindings = imageModelApiBindings), (hasChanged = true)),
            nodeData.imageModelProtocolBindings !== imageModelProtocolBindings &&
            ((nodeData.imageModelProtocolBindings = imageModelProtocolBindings),
              (hasChanged = true))),
          node.type === `textNode` &&
          (nodeData.onGenerateText !== generateText && ((nodeData.onGenerateText = generateText), (hasChanged = true)),
            nodeData.onShowToast !== showToast && ((nodeData.onShowToast = showToast), (hasChanged = true)),
            nodeData.textModel !== textModel && ((nodeData.textModel = textModel), (hasChanged = true)),
            nodeData.apiConfigs !== apiConfigs &&
            ((nodeData.apiConfigs = apiConfigs), (hasChanged = true)),
            nodeData.modelProtocolRegistry !== modelProtocolRegistry &&
            ((nodeData.modelProtocolRegistry = modelProtocolRegistry), (hasChanged = true)),
            nodeData.textModelApiBindings !== textModelApiBindings &&
            ((nodeData.textModelApiBindings = textModelApiBindings), (hasChanged = true)),
            nodeData.textModelProtocolBindings !== textModelProtocolBindings &&
            ((nodeData.textModelProtocolBindings = textModelProtocolBindings),
              (hasChanged = true))),
          (node.type === `videoNode` ||
            node.type === `seedanceNode` ||
            node.type === `tongyiWanxiangNode`) &&
          (nodeData.onGenerateVideo !== generateVideo && ((nodeData.onGenerateVideo = generateVideo), (hasChanged = true)),
            node.type === `seedanceNode` ?
            (nodeData.seedanceNode !== true && ((nodeData.seedanceNode = true), (hasChanged = true)),
              nodeData.tongyiWanxiangNode !== undefined &&
              ((nodeData.tongyiWanxiangNode = undefined), (hasChanged = true)),
              nodeData.seedanceModel !== seedanceModel &&
              ((nodeData.seedanceModel = seedanceModel), (hasChanged = true)),
	              nodeData.tianjiSeedanceModel !== tianjiSeedanceModel &&
	              ((nodeData.tianjiSeedanceModel = tianjiSeedanceModel), (hasChanged = true)),
	              nodeData.videoModel !==
	              (nodeData.seedanceMode === `tianji` ? tianjiSeedanceModel : seedanceModel) &&
	              ((nodeData.videoModel = nodeData.seedanceMode === `tianji` ? tianjiSeedanceModel : seedanceModel),
	                (hasChanged = true)),
	              (() => {
	                let officialSelectedModel = WanJuanGetPreferredModel(seedanceModel, nodeData.seedanceSelectedModel || nodeData.selectedModel || ``, undefined, {
	                    manual: nodeData.seedanceModelManual === true,
	                    auto: nodeData.wanjuanModelAuto === true,
	                  }),
	                  tianjiSelectedModel = WanJuanGetPreferredModel(tianjiSeedanceModel, nodeData.tianjiSelectedModel || nodeData.selectedModel || ``, undefined, {
	                    manual: nodeData.tianjiModelManual === true,
	                    auto: nodeData.wanjuanModelAuto === true,
	                  }),
	                  nextSelectedModel = nodeData.seedanceMode === `tianji` ? tianjiSelectedModel : officialSelectedModel;
	                officialSelectedModel &&
	                  !WanJuanSameModelId(nodeData.seedanceSelectedModel, officialSelectedModel) &&
	                  WanJuanShouldAutoPreferredModel(seedanceModel, nodeData.seedanceSelectedModel || nodeData.selectedModel || ``, {
	                    manual: nodeData.seedanceModelManual === true,
	                    auto: nodeData.wanjuanModelAuto === true,
	                  }) &&
	                  ((nodeData.seedanceSelectedModel = officialSelectedModel), (hasChanged = true));
	                tianjiSelectedModel &&
	                  !WanJuanSameModelId(nodeData.tianjiSelectedModel, tianjiSelectedModel) &&
	                  WanJuanShouldAutoPreferredModel(tianjiSeedanceModel, nodeData.tianjiSelectedModel || nodeData.selectedModel || ``, {
	                    manual: nodeData.tianjiModelManual === true,
	                    auto: nodeData.wanjuanModelAuto === true,
	                  }) &&
	                  ((nodeData.tianjiSelectedModel = tianjiSelectedModel), (hasChanged = true));
	                nextSelectedModel &&
	                  !WanJuanSameModelId(nodeData.selectedModel, nextSelectedModel) &&
	                  ((nodeData.selectedModel = nextSelectedModel), (hasChanged = true));
	              })(),
	              nodeData.videoDurations !== seedanceDurations &&
	              ((nodeData.videoDurations = seedanceDurations), (hasChanged = true)),
              nodeData.seedanceResolutions !== seedanceResolutions &&
              ((nodeData.seedanceResolutions = seedanceResolutions), (hasChanged = true)),
              nodeData.seedanceRatios !== seedanceRatios &&
              ((nodeData.seedanceRatios = seedanceRatios), (hasChanged = true)),
              nodeData.generateAudio !== seedanceGenerateAudio &&
              ((nodeData.generateAudio = seedanceGenerateAudio), (hasChanged = true)),
              nodeData.watermark !== seedanceWatermark &&
              ((nodeData.watermark = seedanceWatermark), (hasChanged = true)),
              nodeData.enableWebSearch !== seedanceEnableWebSearch &&
              ((nodeData.enableWebSearch = seedanceEnableWebSearch), (hasChanged = true)),
              nodeData.seedanceVirtualPortraits !== seedanceVirtualPortraits &&
              ((nodeData.seedanceVirtualPortraits = seedanceVirtualPortraits), (hasChanged = true)),
              ![`public`, `tos`, `custom`, `qiniu`].includes(nodeData.seedanceUploadMode) &&
              ((nodeData.seedanceUploadMode = seedanceUploadMode || WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE), (hasChanged = true)),
              nodeData.tosConfig !== tosConfig &&
              ((nodeData.tosConfig = tosConfig), (hasChanged = true)),
              nodeData.customPublicUploadConfig !== customPublicUploadConfig &&
              ((nodeData.customPublicUploadConfig = customPublicUploadConfig),
                (hasChanged = true)),
              nodeData.qiniuConfig !== qiniuConfig &&
              ((nodeData.qiniuConfig = qiniuConfig),
                (hasChanged = true))) :
            node.type === `tongyiWanxiangNode` ?
            ((nodeData.tongyiWanxiangNode !== true || nodeData.seedanceNode !== undefined) &&
              ((nodeData.tongyiWanxiangNode = true),
                (nodeData.seedanceNode = undefined),
                (hasChanged = true)),
              nodeData.tongyiWanxiangMode ||
              ((nodeData.tongyiWanxiangMode = `text-to-video`), (hasChanged = true)),
              nodeData.tongyiWanxiangTextModels !== tongyiWanxiangTextModels &&
              ((nodeData.tongyiWanxiangTextModels = tongyiWanxiangTextModels),
                (hasChanged = true)),
              nodeData.tongyiWanxiangReferenceImageModels !==
              tongyiWanxiangReferenceImageModels &&
              ((nodeData.tongyiWanxiangReferenceImageModels =
                  tongyiWanxiangReferenceImageModels),
                (hasChanged = true)),
              nodeData.tongyiWanxiangImageModels !== tongyiWanxiangImageModels &&
              ((nodeData.tongyiWanxiangImageModels = tongyiWanxiangImageModels),
                (hasChanged = true)),
              nodeData.tongyiWanxiangEditModels !== tongyiWanxiangEditModels &&
              ((nodeData.tongyiWanxiangEditModels = tongyiWanxiangEditModels),
                (hasChanged = true)),
              nodeData.videoDurations !== tongyiWanxiangDurations &&
              ((nodeData.videoDurations = tongyiWanxiangDurations), (hasChanged = true)),
              nodeData.tongyiWanxiangResolutions !== tongyiWanxiangResolutions &&
              ((nodeData.tongyiWanxiangResolutions = tongyiWanxiangResolutions),
                (hasChanged = true)),
              nodeData.videoResolutions !== tongyiWanxiangRatios &&
              ((nodeData.videoResolutions = tongyiWanxiangRatios), (hasChanged = true)),
              nodeData.videoAspectRatios !== tongyiWanxiangRatios &&
              ((nodeData.videoAspectRatios = tongyiWanxiangRatios), (hasChanged = true)),
              nodeData.selectedAspectRatio ||
              ((nodeData.selectedAspectRatio =
                  parseSeedanceList(tongyiWanxiangRatios)[0] || `16:9`),
                (hasChanged = true)),
              parseSeedanceList(tongyiWanxiangRatios).length > 0 &&
              (!nodeData.size ||
                !parseSeedanceList(tongyiWanxiangRatios).includes(nodeData.size)) &&
              ((nodeData.size =
                  parseSeedanceList(tongyiWanxiangRatios)[0] ||
                  `16:9`),
                (hasChanged = true)),
              parseSeedanceList(tongyiWanxiangResolutions).length > 0 &&
              (!nodeData.selectedResolution ||
                !parseSeedanceList(tongyiWanxiangResolutions).includes(
                  nodeData.selectedResolution,
                )) &&
              ((nodeData.selectedResolution =
                  parseSeedanceList(tongyiWanxiangResolutions)[0] ||
                  `720P`),
                (hasChanged = true)),
              ![`public`, `tos`, `custom`, `qiniu`].includes(nodeData.seedanceUploadMode) &&
              ((nodeData.seedanceUploadMode = seedanceUploadMode || WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE), (hasChanged = true)),
              nodeData.tosConfig !== tosConfig &&
              ((nodeData.tosConfig = tosConfig), (hasChanged = true)),
              nodeData.customPublicUploadConfig !== customPublicUploadConfig &&
              ((nodeData.customPublicUploadConfig = customPublicUploadConfig),
                (hasChanged = true)),
              nodeData.qiniuConfig !== qiniuConfig &&
              ((nodeData.qiniuConfig = qiniuConfig),
                (hasChanged = true)),
              (() => {
                let videoModel2 =
                    nodeData.tongyiWanxiangMode === `reference-image-to-video` ?
                    tongyiWanxiangReferenceImageModels :
                    nodeData.tongyiWanxiangMode === `image-to-video` ?
                    tongyiWanxiangImageModels :
                    nodeData.tongyiWanxiangMode === `video-edit` ?
                    tongyiWanxiangEditModels :
                    tongyiWanxiangTextModels,
                  selectedModel = WanJuanGetPreferredModel(videoModel2, nodeData.selectedModel || ``, undefined, {
                    manual: nodeData.wanjuanModelManual === true,
                    auto: nodeData.wanjuanModelAuto === true,
                  });
                (nodeData.videoModel !== videoModel2 && ((nodeData.videoModel = videoModel2), (hasChanged = true)),
                  selectedModel &&
                  !WanJuanSameModelId(nodeData.selectedModel, selectedModel) &&
                  WanJuanShouldAutoPreferredModel(videoModel2, nodeData.selectedModel || ``, {
                    manual: nodeData.wanjuanModelManual === true,
                    auto: nodeData.wanjuanModelAuto === true,
                  }) &&
                  ((nodeData.selectedModel = selectedModel),
                    (nodeData.wanjuanModelAuto = true),
                    (nodeData.wanjuanModelManual = false),
                    (hasChanged = true)));
              })()) :
            (nodeData.videoModel !== videoModel && ((nodeData.videoModel = videoModel), (hasChanged = true)),
              nodeData.videoDurations !== videoDurations && ((nodeData.videoDurations = videoDurations), (hasChanged = true)),
              nodeData.videoResolutions !== videoResolutions && ((nodeData.videoResolutions = videoResolutions), (hasChanged = true)),
              nodeData.videoAspectRatios !== videoAspectRatios &&
              ((nodeData.videoAspectRatios = videoAspectRatios), (hasChanged = true))),
            nodeData.apiConfigs !== apiConfigs &&
            ((nodeData.apiConfigs = apiConfigs), (hasChanged = true)),
            nodeData.modelProtocolRegistry !== modelProtocolRegistry &&
            ((nodeData.modelProtocolRegistry = modelProtocolRegistry), (hasChanged = true)),
            nodeData.videoModelProtocolBindings !== videoModelProtocolBindings &&
            ((nodeData.videoModelProtocolBindings = videoModelProtocolBindings),
              (hasChanged = true)),
            nodeData.videoModelApiBindings !== videoModelApiBindings &&
            ((nodeData.videoModelApiBindings = videoModelApiBindings), (hasChanged = true)),
            nodeData.videoModelRequestProfiles !== videoModelRequestProfiles &&
            ((nodeData.videoModelRequestProfiles = videoModelRequestProfiles),
              (hasChanged = true))),
          node.type === `audioNode` &&
          (nodeData.audioApiUrl !== audioApiUrl && ((nodeData.audioApiUrl = audioApiUrl), (hasChanged = true)),
            nodeData.audioApiKey !== audioApiKey && ((nodeData.audioApiKey = audioApiKey), (hasChanged = true)),
	            nodeData.audioModel !== audioModel && ((nodeData.audioModel = audioModel), (hasChanged = true)),
	            nodeData.audioModelApiBindings !== audioModelApiBindings &&
	            ((nodeData.audioModelApiBindings = audioModelApiBindings), (hasChanged = true)),
	            nodeData.apiConfigs !== apiConfigs && ((nodeData.apiConfigs = apiConfigs), (hasChanged = true)),
	            nodeData.ttsMusicModels !== ttsMusicModel &&
            ((nodeData.ttsMusicModels = ttsMusicModel), (hasChanged = true)),
            nodeData.modelProtocolRegistry !== modelProtocolRegistry &&
            ((nodeData.modelProtocolRegistry = modelProtocolRegistry), (hasChanged = true)),
            nodeData.audioModelProtocolBindings !== audioModelProtocolBindings &&
            ((nodeData.audioModelProtocolBindings = audioModelProtocolBindings),
              (hasChanged = true)),
            nodeData.projectId !== projectIdRef.current && ((nodeData.projectId = projectIdRef.current), (hasChanged = true)),
            nodeData.updateGlobalTasks !== updateTaskList && ((nodeData.updateGlobalTasks = updateTaskList), (hasChanged = true)),
            nodeData.addTransitResource !== addGeneratedAsset && ((nodeData.addTransitResource = addGeneratedAsset), (hasChanged = true)),
            nodeData.onShowToast !== showToast && ((nodeData.onShowToast = showToast), (hasChanged = true))),
          (node.type === `ttsMusicNode` || node.type === `musicNode`) &&
          (nodeData.audioApiUrl !== audioApiUrl && ((nodeData.audioApiUrl = audioApiUrl), (hasChanged = true)),
            nodeData.audioApiKey !== audioApiKey && ((nodeData.audioApiKey = audioApiKey), (hasChanged = true)),
	            nodeData.audioModel !== audioModel && ((nodeData.audioModel = audioModel), (hasChanged = true)),
	            nodeData.audioModelApiBindings !== audioModelApiBindings &&
	            ((nodeData.audioModelApiBindings = audioModelApiBindings), (hasChanged = true)),
	            nodeData.apiConfigs !== apiConfigs && ((nodeData.apiConfigs = apiConfigs), (hasChanged = true)),
	            nodeData.ttsMusicModels !== ttsMusicModel &&
            ((nodeData.ttsMusicModels = ttsMusicModel), (hasChanged = true)),
	            nodeData.modelProtocolRegistry !== modelProtocolRegistry &&
            ((nodeData.modelProtocolRegistry = modelProtocolRegistry), (hasChanged = true)),
            nodeData.audioModelProtocolBindings !== audioModelProtocolBindings &&
            ((nodeData.audioModelProtocolBindings = audioModelProtocolBindings),
              (hasChanged = true)),
            nodeData.projectId !== projectIdRef.current &&
            ((nodeData.projectId = projectIdRef.current), (hasChanged = true)),
            nodeData.updateGlobalTasks !== updateTaskList && ((nodeData.updateGlobalTasks = updateTaskList), (hasChanged = true)),
            nodeData.addTransitResource !== addGeneratedAsset && ((nodeData.addTransitResource = addGeneratedAsset), (hasChanged = true)),
            nodeData.onShowToast !== showToast && ((nodeData.onShowToast = showToast), (hasChanged = true)),
            nodeData.seedanceUploadMode !== seedanceUploadMode && ((nodeData.seedanceUploadMode = seedanceUploadMode), (hasChanged = true)),
            nodeData.tosConfig !== tosConfig && ((nodeData.tosConfig = tosConfig), (hasChanged = true)),
            nodeData.customPublicUploadConfig !== customPublicUploadConfig && ((nodeData.customPublicUploadConfig = customPublicUploadConfig), (hasChanged = true)),
            nodeData.qiniuConfig !== qiniuConfig && ((nodeData.qiniuConfig = qiniuConfig), (hasChanged = true))),
	          node.type === `customNode` &&
	          (nodeData.onGenerateCustom !== handleGenerateCustom && ((nodeData.onGenerateCustom = handleGenerateCustom), (hasChanged = true)),
	            nodeData.onAIAssist !== handleAIAssist && ((nodeData.onAIAssist = handleAIAssist), (hasChanged = true)),
            typeof nodeData.onSaveTemplate != `function` &&
            ((nodeData.onSaveTemplate = (templateName, templateData) => {
                addCustomNode && addCustomNode({
                  id: Date.now().toString(),
                  name: templateName,
                  config: templateData
                });
              }),
	              (hasChanged = true)),
	            nodeData.onShowToast !== showToast && ((nodeData.onShowToast = showToast), (hasChanged = true))),
	          node.type === `fileToLinkNode` &&
	          (nodeData.seedanceUploadMode !== seedanceUploadMode &&
	            ((nodeData.seedanceUploadMode = seedanceUploadMode), (hasChanged = true)),
	            nodeData.tosConfig !== tosConfig &&
	            ((nodeData.tosConfig = tosConfig), (hasChanged = true)),
	            nodeData.customPublicUploadConfig !== customPublicUploadConfig &&
	            ((nodeData.customPublicUploadConfig = customPublicUploadConfig), (hasChanged = true)),
	            nodeData.qiniuConfig !== qiniuConfig &&
	            ((nodeData.qiniuConfig = qiniuConfig), (hasChanged = true)),
	            nodeData.onShowToast !== showToast && ((nodeData.onShowToast = showToast), (hasChanged = true))),
	          node.type === `videoFaceBlurNode` &&
	          (nodeData.addTransitResource !== addGeneratedAsset && ((nodeData.addTransitResource = addGeneratedAsset), (hasChanged = true)),
	            nodeData.onShowToast !== showToast && ((nodeData.onShowToast = showToast), (hasChanged = true))),
	          node.type === `qwenTtsCloneNode` &&
	          nodeData.onShowToast !== showToast &&
	          ((nodeData.onShowToast = showToast), (hasChanged = true)),
	          (node.type === `promptNode` ||
            node.type === `textNode` ||
            node.type === `videoNode` ||
            node.type === `seedanceNode` ||
            node.type === `tongyiWanxiangNode`) &&
          nodeData.onAddImage !== createImageNode &&
          ((nodeData.onAddImage = createImageNode), (hasChanged = true)),
          (node.type === `promptNode` ||
            node.type === `textNode` ||
            node.type === `videoNode` ||
            node.type === `seedanceNode` ||
            node.type === `tongyiWanxiangNode`) &&
          nodeData.onStop !== stopGeneration &&
          ((nodeData.onStop = stopGeneration), (hasChanged = true)),
          (node.type === `imageNode` || node.type === `promptNode`) &&
          nodeData.onCrop !== handleCrop &&
          ((nodeData.onCrop = handleCrop), (hasChanged = true)),
          (node.type === `imageNode` ||
            node.type === `videoNode` ||
            node.type === `seedanceNode` ||
            node.type === `tongyiWanxiangNode` ||
            node.type === `videoExtractNode`) &&
          nodeData.onVideoEdit !== openVideoEditor &&
          ((nodeData.onVideoEdit = openVideoEditor), (hasChanged = true)),
          (node.type === `imageNode` || node.type === `promptNode`) &&
          nodeData.onEdit !== openImageEditor &&
          ((nodeData.onEdit = openImageEditor), (hasChanged = true)),
          node.type === `gridSplitNode` &&
          (nodeData.onSplit !== handleSplit && ((nodeData.onSplit = handleSplit), (hasChanged = true)),
            nodeData.onSplitOne !== handleSplitOne && ((nodeData.onSplitOne = handleSplitOne), (hasChanged = true))),
          node.type === `cropNode` &&
          (nodeData.onCropComplete !== handleNoop && ((nodeData.onCropComplete = handleNoop), (hasChanged = true)),
            nodeData.onCancel !== handleCancel2 && ((nodeData.onCancel = handleCancel2), (hasChanged = true))),
          nodeData.onZoom !== openImagePreview && ((nodeData.onZoom = openImagePreview), (hasChanged = true)),
          (node.type === `promptNode` || node.type === `imageNode`) &&
          nodeData.onSendToActiveTab !== sendToActiveTab &&
          ((nodeData.onSendToActiveTab = sendToActiveTab), (hasChanged = true)),
          (node.type === `promptNode` || node.type === `imageNode`) &&
          nodeData.onTianjiPortraitReview !== handleTianjiPortraitReview &&
          ((nodeData.onTianjiPortraitReview = handleTianjiPortraitReview), (hasChanged = true)),
          hasChanged ? {
            ...node,
            data: nodeData
          } : node
        );
        anySyncChanged = anySyncChanged || hasChanged;
        return syncNodeResult;
      });
      return anySyncChanged ? syncedNodes : nodes2;
    });
  }, [
    shouldFitView,
    generateImage,
    generateText,
    generateVideo,
    handleGenerateCustom,
    handleAIAssist,
    addCustomNode,
    handleCrop,
    handleSplit,
    handleSplitOne,
    handleNoop,
    handleCancel2,
    setNodes,
    presetPrompts,
    createImageNode,
    openImagePreview,
    showToast,
    stopGeneration,
    openImageEditor,
    openVideoEditor,
    sendToActiveTab,
    handleTianjiPortraitReview,
    apiConfigs,
    modelProtocolRegistry,
    textModelApiBindings,
    textModelProtocolBindings,
	    imageModelApiBindings,
	    imageModelProtocolBindings,
	    imageCompatResolutions,
		    videoModelProtocolBindings,
	    videoModelApiBindings,
	    audioModelProtocolBindings,
	    audioModelApiBindings,
	    ttsMusicModel,
	    drawingModel,
    textModel,
    audioModel,
    videoModel,
    videoDurations,
    videoResolutions,
    videoAspectRatios,
    audioApiUrl,
    audioApiKey,
    updateTaskList,
    seedanceModel,
    tianjiSeedanceModel,
    seedanceDurations,
    seedanceResolutions,
    seedanceRatios,
    seedanceGenerateAudio,
    seedanceWatermark,
    seedanceEnableWebSearch,
    seedanceVirtualPortraits,
    seedanceUploadMode,
    tosConfig,
    customPublicUploadConfig,
    qiniuConfig,
  ]);
}
