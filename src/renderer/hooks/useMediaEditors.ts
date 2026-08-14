/**
 * 媒体编辑器打开状态与操作（图片预览 / 图片标注 / 视频剪辑）。
 * 自 bundle(WanJuanAppCanvas) 抽出的自定义 hook，行为保持一致。
 * 复杂的 saveEditedVideo 仍留在组件内（依赖较多），此处只管「打开哪段媒体在编辑」的状态与打开/裁剪回写。
 */
import { useCallback, useRef, useState } from "react";
import { wanjuanApplyEditedImageToCanvasNodes, wanjuanPrepareImageEditorSource } from "../lib/image-editor";

export function useMediaEditors({ setNodes, projectIdRef, showToast }: { setNodes: (updater: any) => void; projectIdRef?: any; showToast?: (message: string) => void }) {
  const [previewImageUrl, setPreviewImageUrl] = useState<any>(null);
  const [imageEditState, setImageEditState] = useState<any>(null);
  const [videoEditState, setVideoEditState] = useState<any>(null);
  const imageEditorOpenRequestRef = useRef(0);

  const openImagePreview = useCallback((imageUrl: any) => {
    setPreviewImageUrl(imageUrl);
  }, []);
  const openImageEditor = useCallback(async (nodeId: any, imageUrl: any, initialTool: any) => {
    const requestId = ++imageEditorOpenRequestRef.current;
    try {
      const editorUrl = await wanjuanPrepareImageEditorSource(imageUrl);
      if (requestId !== imageEditorOpenRequestRef.current) return;
      setImageEditState({ id: nodeId, url: editorUrl, sourceUrl: imageUrl, initialTool });
    } catch (error: any) {
      if (requestId !== imageEditorOpenRequestRef.current) return;
      showToast?.(`图片编辑器打开失败：${error?.message || error}`);
    }
  }, [showToast]);
  const openVideoEditor = useCallback((nodeId: any, videoUrl: any, label: any) => {
    setVideoEditState({ id: nodeId, url: videoUrl, label });
  }, []);
  const handleCropComplete = useCallback(async (imageUrl: any) => {
    if (!imageEditState || typeof imageUrl !== `string` || !imageUrl.startsWith(`data:image/`)) {
      throw new Error(`编辑器没有生成有效图片`);
    }
    let persisted = null;
    if (window.wanjuanDesktop?.persistProjectAsset) {
      persisted = await window.wanjuanDesktop.persistProjectAsset({
        url: imageUrl,
        filename: `edited-image-${Date.now()}.png`,
        mime: `image/png`,
        projectId: projectIdRef?.current || (typeof globalThis !== `undefined` && globalThis.__wanjuanCurrentProjectId) || `default`,
        nodeId: imageEditState.id,
        field: `imageUrl`,
        kind: `image`,
        directory: ``,
      });
      if (!persisted?.ok || !persisted.localPath) {
        const error = new Error(persisted?.error || `编辑后的图片无法保存到项目媒体库`);
        showToast?.(error.message);
        throw error;
      }
    }
    setNodes((nodes: any[]) =>
      wanjuanApplyEditedImageToCanvasNodes(nodes, imageEditState.id, { dataUrl: imageUrl, persisted }),
    );
    setImageEditState(null);
    showToast?.(`图片编辑已保存`);
  }, [imageEditState, projectIdRef, setNodes, showToast]);

  const handleImageEditorError = useCallback((error: any) => {
    showToast?.(`图片编辑失败：${error?.message || error}`);
  }, [showToast]);

  return {
    previewImageUrl, setPreviewImageUrl,
    imageEditState, setImageEditState,
    videoEditState, setVideoEditState,
    openImagePreview, openImageEditor, openVideoEditor, handleCropComplete, handleImageEditorError,
  };
}
