/**
 * useWorkspaceTemplateEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, Toast, WjNode } from "../lib/app-types";
import { WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS } from "../lib/jixin-catalog";
import { localPathFromProjectFileUrl } from "../lib/project-asset-binding";

interface UseWorkspaceTemplateEffectDeps {
  createNodeAt: any;
  getNodes: () => WjNode[];
  projectId: any;
  projectIdRef: Ref;
  screenToFlowPosition: any;
  showToast: Toast;
  wrapperRef: Ref;
}

export function useWorkspaceTemplateEffect(deps: UseWorkspaceTemplateEffectDeps) {
  const {
    createNodeAt,
    getNodes,
    projectId,
    projectIdRef,
    screenToFlowPosition,
    showToast,
    wrapperRef,
  } = deps;
	  useEffect(() => {
			    let nodePromptType = (node) => {
			          if (node?.type === `textNode`) return `text`;
			          if (node?.type === `promptNode`) return `image`;
			          if ([`videoNode`, `seedanceNode`, `tongyiWanxiangNode`].includes(node?.type)) return `video`;
			          if ([`audioNode`, `ttsMusicNode`, `musicNode`].includes(node?.type)) return `audio`;
			          return `generic`;
			        },
			      nodePromptContent = (node) => {
			          let nodeData = node?.data || {};
			          return String(
			            nodeData.prompt ||
			            nodeData.text ||
			            nodeData.instructions ||
			            nodeData.description ||
			            ``
			          ).trim();
			        },
			      nodeProviderHint = (node) => {
			          let nodeData = node?.data || {};
			          if (node?.type === `tongyiWanxiangNode`) return `tongyi-wanxiang`;
			          if (node?.type === `seedanceNode`) return nodeData.seedanceMode === `tianji` ? `tianji-seedance` : `seedance`;
			          if (node?.type === `promptNode`) return `image`;
			          if (node?.type === `textNode`) return `text`;
			          if ([`audioNode`, `ttsMusicNode`, `musicNode`].includes(node?.type)) return `audio`;
			          return `video`;
			        },
			      nodeSafeParameters = (node) => {
			          let nodeData = node?.data || {},
			            duration = Number(nodeData.durationSeconds || nodeData.selectedSeconds || nodeData.duration || 0),
			            parameters = {
			              aspectRatio: String(nodeData.aspectRatio || nodeData.videoAspectRatio || nodeData.ratio || nodeData.size || ``).trim() || undefined,
			              resolution: String(nodeData.selectedResolution || nodeData.imageResolution || nodeData.resolution || ``).trim() || undefined,
			              imageSize: String(nodeData.imageSize || ``).trim() || undefined,
			              durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : undefined,
			              generateAudio: typeof nodeData.generateAudio === `boolean` ? nodeData.generateAudio : undefined,
			              watermark: typeof nodeData.watermark === `boolean` ? nodeData.watermark : undefined,
			            };
			          return Object.fromEntries(Object.entries(parameters).filter(([, value]) => value !== undefined && value !== ``));
			        },
			      buildWorkspaceTemplateFromNode = (node) => {
				        let nodeData = node?.data || {},
				          promptText = nodePromptContent(node),
				          resultUrl = String(nodeData.videoUrl || nodeData.resultVideoUrl || nodeData.outputVideoUrl || nodeData.mediaUrl || ``).trim(),
				          videoBinding = nodeData.projectAssetBindings?.videoUrl || {},
				          thumbnailBinding = nodeData.projectAssetBindings?.thumbnailUrl || {},
				          resultLocalPath = String(nodeData.localPath || nodeData.filePath || videoBinding.localPath || localPathFromProjectFileUrl(resultUrl) || ``).trim(),
				          thumbnailUrl = String(nodeData.thumbnailUrl || nodeData.posterUrl || nodeData.coverUrl || ``).trim(),
				          thumbnailLocalPath = String(thumbnailBinding.localPath || localPathFromProjectFileUrl(thumbnailUrl) || ``).trim(),
				          selectedModel = String(nodeData.selectedModel || nodeData.textModel || nodeData.drawingModel || nodeData.ttsModel || nodeData.sunoModel || ``).trim(),
				          modelName = selectedModel || String(nodeData.videoModel || ``).split(/[\s,，、]+/)[0]?.trim() || ``,
				          type = nodePromptType(node),
				          providerHint = nodeProviderHint(node),
				          safeParameters = nodeSafeParameters(node);
			        if (!promptText) throw Error(`这个节点没有可保存的提示词`);
			        return {
			          id: `workspace-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			          title: String(nodeData.label || nodeData.name || promptText.slice(0, 28) || `即梦提示词模板`).trim(),
			          prompt: promptText,
			          type,
			          groupId: ``,
			          sourceProvider: providerHint,
			          sourceNodeId: node?.id || ``,
			          sourceProjectId: projectIdRef.current || projectId || `default`,
			          modelName,
			          generationMode: nodeData.tianjiSeedanceGenerationMode || nodeData.tongyiWanxiangMode || (type === `image` ? `text-to-image` : type === `audio` ? `text-to-audio` : type === `text` ? `text-generation` : `text-to-video`),
			          params: {
			            ...safeParameters,
			            seedanceMode: nodeData.seedanceMode || (node?.type === `seedanceNode` ? `official` : ``),
			            tianjiSeedanceGenerationMode: nodeData.tianjiSeedanceGenerationMode || ``,
			            selectedSeconds: nodeData.selectedSeconds || ``,
			            selectedResolution: nodeData.selectedResolution || ``,
			            size: nodeData.size || ``,
			            generateAudio: nodeData.generateAudio,
			            watermark: nodeData.watermark,
				          },
				          resultUrl,
				          resultLocalPath,
				          thumbnailUrl,
				          thumbnailLocalPath,
				          createdAt: Date.now(),
			          updatedAt: Date.now(),
			        };
		      },
			      buildCloudPromptTemplateFromNode = (node) => {
			        let legacy = buildWorkspaceTemplateFromNode(node);
			        return {
			          title: legacy.title,
			          content: legacy.prompt,
			          description: ``,
			          type: legacy.type,
			          tags: [],
			          providerHint: legacy.sourceProvider,
			          modelHint: legacy.modelName,
			          generationMode: legacy.generationMode,
			          parameters: nodeSafeParameters(node),
			        };
			      },
			      handleCreateSeedanceNodeFromWorkspace = (event) => {
			        let template = event?.detail?.template || {},
			          params = template.params && typeof template.params == `object` ? template.params : {},
			          position = screenToFlowPosition({
			            x: Math.max(220, (wrapperRef.current?.getBoundingClientRect?.().left || 0) + 360),
			            y: Math.max(180, (wrapperRef.current?.getBoundingClientRect?.().top || 0) + 220),
			          }),
			          nodeData = {
			            prompt: String(template.prompt || ``),
			            selectedModel: String(template.modelName || (template.sourceProvider === `tongyi-wanxiang` ? WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS[0] : ``)),
			            wanjuanModelManual: template.sourceProvider === `tongyi-wanxiang` ? true : undefined,
			            seedanceMode: params.seedanceMode === `tianji` || template.sourceProvider === `tianji-seedance` ? `tianji` : `official`,
			            tianjiSeedanceGenerationMode: params.tianjiSeedanceGenerationMode || template.generationMode || `text-to-video`,
			            selectedSeconds: params.selectedSeconds || undefined,
			            selectedResolution: params.selectedResolution || undefined,
			            size: params.size || undefined,
			            generateAudio: params.generateAudio,
			            watermark: params.watermark,
			            workspaceTemplateId: template.id || ``,
			            workspaceTemplateSource: template.memberName || template.sourceMemberName || ``,
			          };
			        createNodeAt(
			          template.sourceProvider === `tongyi-wanxiang` ? `videoNode` : `seedanceNode`,
			          position,
			          nodeData
			        );
			        showToast(template.sourceProvider === `tongyi-wanxiang` ? `已从工作空间创建视频节点` : `已从工作空间创建即梦节点`);
			      },
			      handleCreateCloudNode = (event) => {
			        let template = event?.detail?.template || {},
			          parameters = template.parameters && typeof template.parameters === `object` ? template.parameters : {},
			          type = String(template.type || `generic`),
			          content = String(template.content || template.prompt || ``),
			          providerHint = String(template.providerHint || ``),
			          position = screenToFlowPosition({
			            x: Math.max(220, (wrapperRef.current?.getBoundingClientRect?.().left || 0) + 360),
			            y: Math.max(180, (wrapperRef.current?.getBoundingClientRect?.().top || 0) + 220),
			          }),
			          nodeType = type === `image` ? `promptNode` :
			            type === `video` ? (providerHint === `tongyi-wanxiang` ? `tongyiWanxiangNode` : providerHint.includes(`seedance`) ? `seedanceNode` : `videoNode`) :
			            type === `audio` ? `musicNode` : `textNode`,
			          nodeData = nodeType === `textNode` ? {
			            text: content,
			            prompt: content,
			            selectedModel: String(template.modelHint || ``),
			          } : nodeType === `musicNode` ? {
			            prompt: content,
			            mode: `suno`,
			            nodeKind: `music`,
			            sunoModel: String(template.modelHint || ``) || undefined,
			          } : {
			            prompt: content,
			            selectedModel: String(template.modelHint || ``),
			            aspectRatio: parameters.aspectRatio || undefined,
			            imageResolution: parameters.resolution || undefined,
			            imageSize: parameters.imageSize || undefined,
			            selectedSeconds: parameters.durationSeconds || undefined,
			            selectedResolution: parameters.resolution || undefined,
			            generateAudio: parameters.generateAudio,
			            watermark: parameters.watermark,
			            seedanceMode: providerHint === `tianji-seedance` ? `tianji` : providerHint.includes(`seedance`) ? `official` : undefined,
			            tianjiSeedanceGenerationMode: String(template.generationMode || ``) || undefined,
			            tongyiWanxiangMode: providerHint === `tongyi-wanxiang` ? String(template.generationMode || `text-to-video`) : undefined,
			          };
			        createNodeAt(nodeType, position, nodeData);
			        showToast(`已从云提示词创建${type === `image` ? `生图` : type === `video` ? `视频` : type === `audio` ? `音频` : `文本`}节点`);
			      },
			      handleSaveWorkspaceTemplateFromNode = (event) => {
			        try {
			          let targetNodeId = String(event?.detail?.nodeId || ``).trim(),
			            target = String(event?.detail?.target || `local`),
			            node = targetNodeId ?
			            getNodes().find((item) => item.id === targetNodeId) :
			            getNodes().find((item) => item.selected && [`textNode`, `promptNode`, `seedanceNode`, `videoNode`, `tongyiWanxiangNode`, `audioNode`, `ttsMusicNode`, `musicNode`].includes(item.type));
			          if (!node) throw Error(`请先选中一个包含提示词的生成节点`);
			          let template = target === `cloud` ? buildCloudPromptTemplateFromNode(node) : buildWorkspaceTemplateFromNode(node);
			          window.dispatchEvent(new CustomEvent(target === `cloud` ? `wanjuan:cloud-prompt-template-captured` : `wanjuan:workspace-template-captured`, {
			            detail: {
			              template
			            }
			          }));
			          showToast(target === `cloud` ? `已提取云提示词模板` : `已保存到工作空间提示词模板`);
			        } catch (error) {
			          showToast(`保存模板失败：${error?.message || error}`);
			        }
			      },
			      handleWorkspaceBridgeMessage = (event) => {
			        if (event?.source !== window) return;
			        let payload = event?.data;
			        if (!payload || payload.source !== `wanjuan-desktop-preload`) return;
			        let bridgedEvent = { detail: payload.detail && typeof payload.detail === `object` ? payload.detail : {} };
			        if (payload.type === `wanjuan:workspace-create-seedance-node`) handleCreateSeedanceNodeFromWorkspace(bridgedEvent);
			        else if (payload.type === `wanjuan:workspace-create-cloud-node`) handleCreateCloudNode(bridgedEvent);
			        else if (payload.type === `wanjuan:workspace-save-node-template`) handleSaveWorkspaceTemplateFromNode(bridgedEvent);
			      };
			    return (
			      window.addEventListener(`wanjuan:workspace-create-seedance-node`, handleCreateSeedanceNodeFromWorkspace),
			      window.addEventListener(`wanjuan:workspace-create-cloud-node`, handleCreateCloudNode),
			      window.addEventListener(`wanjuan:workspace-save-node-template`, handleSaveWorkspaceTemplateFromNode),
			      window.addEventListener(`message`, handleWorkspaceBridgeMessage),
			      () => {
			        window.removeEventListener(`wanjuan:workspace-create-seedance-node`, handleCreateSeedanceNodeFromWorkspace);
			        window.removeEventListener(`wanjuan:workspace-create-cloud-node`, handleCreateCloudNode);
			        window.removeEventListener(`wanjuan:workspace-save-node-template`, handleSaveWorkspaceTemplateFromNode);
			        window.removeEventListener(`message`, handleWorkspaceBridgeMessage);
			      }
			    );
			  }, [getNodes, screenToFlowPosition, createNodeAt, showToast, projectId]);
}
