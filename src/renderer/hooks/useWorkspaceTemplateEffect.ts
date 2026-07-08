/**
 * useWorkspaceTemplateEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, Toast } from "../lib/app-types";
import { localPathFromProjectFileUrl } from "../lib/project-asset-binding";

interface UseWorkspaceTemplateEffectDeps {
  createNodeAt: any;
  getNodes: () => any[];
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
			    let buildWorkspaceTemplateFromNode = (node) => {
				        let nodeData = node?.data || {},
				          promptText = String(nodeData.prompt || ``).trim(),
				          resultUrl = String(nodeData.videoUrl || nodeData.resultVideoUrl || nodeData.outputVideoUrl || nodeData.mediaUrl || ``).trim(),
				          videoBinding = nodeData.projectAssetBindings?.videoUrl || {},
				          thumbnailBinding = nodeData.projectAssetBindings?.thumbnailUrl || {},
				          resultLocalPath = String(nodeData.localPath || nodeData.filePath || videoBinding.localPath || localPathFromProjectFileUrl(resultUrl) || ``).trim(),
				          thumbnailUrl = String(nodeData.thumbnailUrl || nodeData.posterUrl || nodeData.coverUrl || ``).trim(),
				          thumbnailLocalPath = String(thumbnailBinding.localPath || localPathFromProjectFileUrl(thumbnailUrl) || ``).trim(),
				          selectedModel = String(nodeData.selectedModel || ``).trim(),
				          modelName = selectedModel || String(nodeData.videoModel || ``).split(/[\s,，、]+/)[0]?.trim() || ``;
			        if (!promptText) throw Error(`这个节点没有可保存的提示词`);
			        if (!resultUrl) throw Error(`这个节点还没有可保存的视频结果`);
			        return {
			          id: `workspace-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			          title: String(nodeData.label || nodeData.name || promptText.slice(0, 28) || `即梦提示词模板`).trim(),
			          prompt: promptText,
			          type: `video`,
			          groupId: ``,
			          sourceProvider: node?.type === `tongyiWanxiangNode` ? `tongyi-wanxiang` : nodeData.seedanceMode === `tianji` ? `tianji-seedance` : `seedance`,
			          sourceNodeId: node?.id || ``,
			          sourceProjectId: projectIdRef.current || projectId || `default`,
			          modelName,
			          generationMode: nodeData.tianjiSeedanceGenerationMode || nodeData.tongyiWanxiangMode || `text-to-video`,
			          params: {
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
			      handleCreateSeedanceNodeFromWorkspace = (event) => {
			        let template = event?.detail?.template || {},
			          params = template.params && typeof template.params == `object` ? template.params : {},
			          position = screenToFlowPosition({
			            x: Math.max(220, (wrapperRef.current?.getBoundingClientRect?.().left || 0) + 360),
			            y: Math.max(180, (wrapperRef.current?.getBoundingClientRect?.().top || 0) + 220),
			          }),
			          nodeData = {
			            prompt: String(template.prompt || ``),
			            selectedModel: String(template.modelName || ``),
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
			          template.sourceProvider === `tongyi-wanxiang` ? `tongyiWanxiangNode` : `seedanceNode`,
			          position,
			          nodeData
			        );
			        showToast(`已从工作空间创建即梦节点`);
			      },
			      handleSaveWorkspaceTemplateFromNode = (event) => {
			        try {
			          let targetNodeId = String(event?.detail?.nodeId || ``).trim(),
			            node = targetNodeId ?
			            getNodes().find((item) => item.id === targetNodeId) :
			            getNodes().find((item) => item.selected && [`seedanceNode`, `videoNode`, `tongyiWanxiangNode`].includes(item.type));
			          if (!node) throw Error(`请先选中一个已生成视频的即梦节点`);
			          let template = buildWorkspaceTemplateFromNode(node);
			          window.dispatchEvent(new CustomEvent(`wanjuan:workspace-template-captured`, {
			            detail: {
			              template
			            }
			          }));
			          showToast(`已保存到工作空间提示词模板`);
			        } catch (error) {
			          showToast(`保存模板失败：${error?.message || error}`);
			        }
			      };
			    return (
			      window.addEventListener(`wanjuan:workspace-create-seedance-node`, handleCreateSeedanceNodeFromWorkspace),
			      window.addEventListener(`wanjuan:workspace-save-node-template`, handleSaveWorkspaceTemplateFromNode),
			      () => {
			        window.removeEventListener(`wanjuan:workspace-create-seedance-node`, handleCreateSeedanceNodeFromWorkspace);
			        window.removeEventListener(`wanjuan:workspace-save-node-template`, handleSaveWorkspaceTemplateFromNode);
			      }
			    );
			  }, [getNodes, screenToFlowPosition, createNodeAt, showToast, projectId]);
}
