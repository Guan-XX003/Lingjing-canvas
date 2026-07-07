// @ts-nocheck
/**
 * createNodeAt。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_createNodeAt(deps: any) {
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
  const createNodeAt = (nodeType, position, nodeData = {}, connection) => {
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
            onGenerateVideo: nodeType === `videoNode` || nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` ? generateVideo : undefined,
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
	              nodeType === `qwenTtsCloneNode` ?
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
            onShowToast: nodeType === `textNode` ||
              nodeType === `audioNode` ||
              nodeType === `ttsMusicNode` ||
              nodeType === `musicNode` ||
              nodeType === `customNode` ||
              nodeType === `seedanceNode` ||
              nodeType === `tongyiWanxiangNode` ||
              nodeType === `videoExtractNode` ||
              nodeType === `fileToLinkNode` ||
              nodeType === `videoFaceBlurNode` ||
              nodeType === `qwenTtsCloneNode` ?
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
            seedanceUploadMode: nodeType === `fileToLinkNode` ? seedanceUploadMode : nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` || nodeType === `musicNode` ? seedanceUploadMode : undefined,
            tosConfig: nodeType === `fileToLinkNode` ? tosConfig : nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` || nodeType === `musicNode` ? tosConfig : undefined,
            customPublicUploadConfig: nodeType === `fileToLinkNode` ? customPublicUploadConfig : nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` || nodeType === `musicNode` ? customPublicUploadConfig : undefined,
            qiniuConfig: nodeType === `fileToLinkNode` ? qiniuConfig : nodeType === `seedanceNode` || nodeType === `tongyiWanxiangNode` || nodeType === `musicNode` ? qiniuConfig : undefined,
            apiConfigs: nodeType === `promptNode` ||
              nodeType === `textNode` ||
              nodeType === `videoNode` ||
              nodeType === `seedanceNode` ||
              nodeType === `tongyiWanxiangNode` ||
              nodeType === `audioNode` ||
              nodeType === `ttsMusicNode` ||
              nodeType === `musicNode` ?
              apiConfigs :
              undefined,
            modelProtocolRegistry: nodeType === `promptNode` ||
              nodeType === `textNode` ||
              nodeType === `videoNode` ||
              nodeType === `audioNode` ||
              nodeType === `ttsMusicNode` ||
              nodeType === `musicNode` ||
              nodeType === `seedanceNode` ||
              nodeType === `tongyiWanxiangNode` ?
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
	            audioApiUrl: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` ? audioApiUrl : undefined,
	            audioApiKey: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` ? audioApiKey : undefined,
	            audioModel: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` ? audioModel : undefined,
	            audioModelApiBindings: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` ? audioModelApiBindings : undefined,
	            ttsMusicModels: nodeType === `ttsMusicNode` || nodeType === `musicNode` || nodeType === `audioNode` ? ttsMusicModel : undefined,
            audioModelProtocolBindings: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` ? audioModelProtocolBindings : undefined,
            projectId: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` ? projectIdRef.current : undefined,
            updateGlobalTasks: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` ? updateTaskList : undefined,
            addTransitResource: nodeType === `audioNode` || nodeType === `ttsMusicNode` || nodeType === `musicNode` || nodeType === `videoFaceBlurNode` || nodeType === `qwenTtsCloneNode` ? addGeneratedAsset : undefined,
          },
        };
      if ((setNodes((nodes2) => nodes2.concat(newNode)), connection)) {
        let newEdge = {
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
