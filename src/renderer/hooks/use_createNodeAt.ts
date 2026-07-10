/**
 * createNodeAt。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiBindings, ApiConfig, ProtocolBindings, ProtocolRegistry, Ref, SetAny, SetState, Toast, WjEdge, WjNode } from "../lib/app-types";
import {
  WANJUAN_API_CONFIG_NODE_TYPES,
  WANJUAN_AUDIO_RUNTIME_NODE_TYPES,
  WANJUAN_TOAST_NODE_TYPES,
  WANJUAN_TRANSIT_RESOURCE_NODE_TYPES,
  WANJUAN_UPLOAD_CONFIG_NODE_TYPES,
  WANJUAN_VIDEO_GENERATION_NODE_TYPES,
  wanjuanNodeHasRuntimeCapability,
} from "../lib/node-runtime-contract";

interface UseCreateNodeAtDeps {
  createImageNode: any;
  generateImage: any;
  generateText: any;
  generateVideo: any;
  handleAIAssist: any;
  handleCrop: any;
  handleGenerateCustom: any;
  handleSplit: any;
  handleSplitOne: any;
  handleTianjiPortraitReview: any;
  nodesRef: Ref<WjNode[]>;
  openImageEditor: any;
  openImagePreview: any;
  openVideoEditor: any;
  projectIdRef: Ref;
  setEdges: SetState<WjEdge[]>;
  setMenuPosition: SetAny;
  setNodes: SetState<WjNode[]>;
  stopGeneration: any;
  addCustomNode: any;
  addGeneratedAsset: any;
  apiConfigs: ApiConfig[];
  audioApiKey: any;
  audioApiUrl: any;
  audioModel: any;
  audioModelApiBindings: ApiBindings;
  audioModelProtocolBindings: ProtocolBindings;
  customPublicUploadConfig: any;
  drawingModel: any;
  imageCompatResolutions: any;
  imageModelApiBindings: ApiBindings;
  imageModelProtocolBindings: ProtocolBindings;
  modelProtocolRegistry: ProtocolRegistry;
  presetPrompts: any;
  projectId: any;
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
  showToast: Toast;
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

export function use_createNodeAt(deps: UseCreateNodeAtDeps) {
  const {
    createImageNode,
    generateImage,
    generateText,
    generateVideo,
    handleAIAssist,
    handleCrop,
    handleGenerateCustom,
    handleSplit,
    handleSplitOne,
    handleTianjiPortraitReview,
    nodesRef,
    openImageEditor,
    openImagePreview,
    openVideoEditor,
    projectIdRef,
    setEdges,
    setMenuPosition,
    setNodes,
    stopGeneration,
    addCustomNode,
    addGeneratedAsset,
    apiConfigs,
    audioApiKey,
    audioApiUrl,
    audioModel,
    audioModelApiBindings,
    audioModelProtocolBindings,
    customPublicUploadConfig,
    drawingModel,
    imageCompatResolutions,
    imageModelApiBindings,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    presetPrompts,
    projectId,
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
    showToast,
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
  const createNodeAt = (nodeType, position, nodeData: Record<string, any> = {}, connection) => {
      let {
          __nodeId,
          ...cleanNodeData
        } = nodeData || {},
        newNodeId = typeof __nodeId == `string` && __nodeId ? __nodeId : `${nodeType}-${Date.now()}`,
        newNode = {
          id: newNodeId,
          type: nodeType,
          position: position,
          style: nodeType === `promptNode` || nodeType === `imageNode` ?
            {
              width: 224,
              height: 224
            } :
            nodeType === `videoNode` || nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` ?
            {
              width: 320,
              height: 320
            } :
            nodeType === `fileToLinkNode` ?
            {
              width: 360,
              height: 300
            } :
            nodeType === `videoFaceBlurNode` ?
            {
              width: 320,
              height: 430
            } :
            nodeType === `qwenTtsCloneNode` ?
            {
              width: 340,
              height: 430
            } :
            undefined,
          data: {
            ...cleanNodeData,
            expanded: cleanNodeData.expanded === undefined ?
              nodeType === `promptNode` || nodeType === `textNode` || nodeType === `videoNode` || nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` ?
              true :
              undefined :
              cleanNodeData.expanded,
            onGenerate: nodeType === `promptNode` ? generateImage : undefined,
            onGenerateText: nodeType === `textNode` ? generateText : undefined,
            onGenerateVideo: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_VIDEO_GENERATION_NODE_TYPES) ? generateVideo : undefined,
            onGenerateCustom: nodeType === `customNode` ? handleGenerateCustom : undefined,
            onGenerateTtsMusic: nodeType === `ttsMusicNode` || nodeType === `musicNode` ? undefined : undefined,
            onAIAssist: nodeType === `customNode` ? handleAIAssist : undefined,
            onSaveTemplate: nodeType === `customNode` ?
              (templateName, templateConfig) => {
                addCustomNode && addCustomNode({
                  id: Date.now().toString(),
                  name: templateName,
                  config: templateConfig
                });
              } :
              undefined,
            onCrop: nodeType === `imageNode` || nodeType === `promptNode` ? handleCrop : undefined,
            onVideoEdit: nodeType === `imageNode` ||
              nodeType === `videoNode` ||
	              nodeType === `seedanceNode` ||
	              nodeType === `tongyiWanxiangNode` ||
	              nodeType === `videoExtractNode` ||
	              nodeType === `fileToLinkNode` ||
	              nodeType === `videoFaceBlurNode` ||
	              nodeType === `qwenTtsCloneNode` ||
	              nodeType === `realEsrganVideoNode` ?
              openVideoEditor :
              undefined,
            onSplit: nodeType === `gridSplitNode` ? handleSplit : undefined,
            onSplitOne: nodeType === `gridSplitNode` ? handleSplitOne : undefined,
            onZoom: openImagePreview,
            onEdit: nodeType === `imageNode` || nodeType === `promptNode` ? openImageEditor : undefined,
            onAddImage: nodeType === `promptNode` ||
              nodeType === `textNode` ||
              nodeType === `videoNode` ||
              nodeType === `seedanceNode` ||
              nodeType === `tongyiWanxiangNode` ?
              createImageNode :
              undefined,
            onStop: nodeType === `promptNode` ||
              nodeType === `textNode` ||
              nodeType === `videoNode` ||
              nodeType === `seedanceNode` ||
              nodeType === `tongyiWanxiangNode` ||
              nodeType === `customNode` ||
              nodeType === `ttsMusicNode` ||
              nodeType === `musicNode` ||
              nodeType === `seedanceNode` ||
              nodeType === `videoExtractNode` ?
              stopGeneration :
              undefined,
            onShowToast: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_TOAST_NODE_TYPES) ?
              showToast :
              undefined,
            presetPrompts: presetPrompts,
            onSendToActiveTab: nodeType === `promptNode` || nodeType === `imageNode` ? sendToActiveTab : undefined,
            onTianjiPortraitReview: nodeType === `promptNode` || nodeType === `imageNode` ? handleTianjiPortraitReview : undefined,
            seedanceNode: nodeType === `seedanceNode` ? true : undefined,
            tongyiWanxiangNode: nodeType === `tongyiWanxiangNode` ? true : undefined,
            tongyiWanxiangMode: nodeType === `tongyiWanxiangNode` ? `text-to-video` : undefined,
            tongyiWanxiangTextModels: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangTextModels : undefined,
            tongyiWanxiangReferenceImageModels: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangReferenceImageModels : undefined,
            tongyiWanxiangImageModels: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangImageModels : undefined,
            tongyiWanxiangEditModels: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangEditModels : undefined,
            tongyiWanxiangDurations: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangDurations : undefined,
            tongyiWanxiangResolutions: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangResolutions : undefined,
            tongyiWanxiangRatios: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangRatios : undefined,
            videoModel: nodeType === `seedanceNode` ?
              cleanNodeData.seedanceMode === `tianji` ?
              tianjiSeedanceModel :
              seedanceModel :
              nodeType === `tongyiWanxiangNode` ?
              tongyiWanxiangTextModels :
              nodeType === `videoNode` ?
              videoModel :
              undefined,
            videoDurations: nodeType === `seedanceNode` ? seedanceDurations : nodeType === `tongyiWanxiangNode` ? tongyiWanxiangDurations : nodeType === `videoNode` ? videoDurations : undefined,
            seedanceModel: nodeType === `seedanceNode` ? seedanceModel : undefined,
            tianjiSeedanceModel: nodeType === `seedanceNode` ? tianjiSeedanceModel : undefined,
            videoResolutions: nodeType === `seedanceNode` ?
              seedanceRatios :
              nodeType === `tongyiWanxiangNode` ?
              tongyiWanxiangRatios :
              nodeType === `videoNode` ?
              videoResolutions :
              undefined,
            videoAspectRatios: nodeType === `tongyiWanxiangNode` ? tongyiWanxiangRatios : nodeType === `videoNode` ? videoAspectRatios : undefined,
            seedanceResolutions: nodeType === `seedanceNode` ? seedanceResolutions : undefined,
            seedanceRatios: nodeType === `seedanceNode` ? seedanceRatios : undefined,
            generateAudio: nodeType === `seedanceNode` ? seedanceGenerateAudio : undefined,
            watermark: nodeType === `seedanceNode` ? seedanceWatermark : undefined,
            enableWebSearch: nodeType === `seedanceNode` ? seedanceEnableWebSearch : undefined,
            seedanceVirtualPortraits: nodeType === `seedanceNode` ? seedanceVirtualPortraits : undefined,
            seedanceUploadMode: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_UPLOAD_CONFIG_NODE_TYPES) ? seedanceUploadMode : undefined,
            tosConfig: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_UPLOAD_CONFIG_NODE_TYPES) ? tosConfig : undefined,
            customPublicUploadConfig: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_UPLOAD_CONFIG_NODE_TYPES) ? customPublicUploadConfig : undefined,
            qiniuConfig: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_UPLOAD_CONFIG_NODE_TYPES) ? qiniuConfig : undefined,
            apiConfigs: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_API_CONFIG_NODE_TYPES) ?
              apiConfigs :
              undefined,
            modelProtocolRegistry: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_API_CONFIG_NODE_TYPES) ?
              modelProtocolRegistry :
              undefined,
            textModelApiBindings: nodeType === `textNode` ? textModelApiBindings : undefined,
            textModelProtocolBindings: nodeType === `textNode` ? textModelProtocolBindings : undefined,
            imageModelApiBindings: nodeType === `promptNode` ? imageModelApiBindings : undefined,
	            imageModelProtocolBindings: nodeType === `promptNode` ? imageModelProtocolBindings : undefined,
	            imageCompatResolutions: nodeType === `promptNode` ? imageCompatResolutions : undefined,
            videoModelProtocolBindings: nodeType === `videoNode` || nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` ?
              videoModelProtocolBindings :
              undefined,
            videoModelApiBindings: nodeType === `videoNode` || nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` ? videoModelApiBindings : undefined,
            videoModelRequestProfiles: nodeType === `videoNode` || nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` ?
              videoModelRequestProfiles :
              undefined,
            drawingModel: nodeType === `promptNode` ? drawingModel : undefined,
            textModel: nodeType === `textNode` ? textModel : undefined,
	            audioApiUrl: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? audioApiUrl : undefined,
	            audioApiKey: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? audioApiKey : undefined,
	            audioModel: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? audioModel : undefined,
	            audioModelApiBindings: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? audioModelApiBindings : undefined,
	            ttsMusicModels: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? ttsMusicModel : undefined,
            audioModelProtocolBindings: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? audioModelProtocolBindings : undefined,
            projectId: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? projectIdRef.current : undefined,
            updateGlobalTasks: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_AUDIO_RUNTIME_NODE_TYPES) ? updateTaskList : undefined,
	            addTransitResource: wanjuanNodeHasRuntimeCapability(nodeType, WANJUAN_TRANSIT_RESOURCE_NODE_TYPES) ? addGeneratedAsset : undefined,
          },
        };
      if ((setNodes((nodes2) => nodes2.concat(newNode)), connection)) {
        let newEdge: any = {
          id: `e-${connection.source}-${newNodeId}`,
          source: connection.source,
          sourceHandle: connection.sourceHandle,
          target: newNodeId,
          targetHandle: null,
          type: `custom`,
        };
        (nodesRef.current.find((node) => node.id === connection.source)?.type === `imageNode` &&
          (nodeType === `promptNode` ||
            nodeType === `textNode` ||
            nodeType === `videoNode` ||
            nodeType === `seedanceNode`) &&
          (newEdge.animated = true),
          setEdges((edges2) => edges2.concat(newEdge)));
      }
      setMenuPosition(null);
    };
  return { createNodeAt };
}
