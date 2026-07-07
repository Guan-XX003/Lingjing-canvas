/**
 * 媒体编辑器打开状态与操作（图片预览 / 图片标注 / 视频剪辑）。
 * 自 bundle(WanJuanAppCanvas) 抽出的自定义 hook，行为保持一致。
 * 复杂的 saveEditedVideo 仍留在组件内（依赖较多），此处只管「打开哪段媒体在编辑」的状态与打开/裁剪回写。
 */
import { useCallback, useState } from "react";

export function useMediaEditors({ setNodes }: { setNodes: (updater: any) => void }) {
  const [previewImageUrl, setPreviewImageUrl] = useState<any>(null);
  const [imageEditState, setImageEditState] = useState<any>(null);
  const [videoEditState, setVideoEditState] = useState<any>(null);

  const openImagePreview = useCallback((imageUrl: any) => {
    setPreviewImageUrl(imageUrl);
  }, []);
  const openImageEditor = useCallback((nodeId: any, imageUrl: any, initialTool: any) => {
    setImageEditState({ id: nodeId, url: imageUrl, initialTool });
  }, []);
  const openVideoEditor = useCallback((nodeId: any, videoUrl: any, label: any) => {
    setVideoEditState({ id: nodeId, url: videoUrl, label });
  }, []);
  const handleCropComplete = useCallback((imageUrl: any) => {
    imageEditState &&
      setNodes((nodes: any[]) =>
        nodes.map((node) => (node.id === imageEditState.id ? { ...node, data: { ...node.data, imageUrl } } : node)),
      );
    setImageEditState(null);
  }, [imageEditState, setNodes]);

  return {
    previewImageUrl, setPreviewImageUrl,
    imageEditState, setImageEditState,
    videoEditState, setVideoEditState,
    openImagePreview, openImageEditor, openVideoEditor, handleCropComplete,
  };
}
