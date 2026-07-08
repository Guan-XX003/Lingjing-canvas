// @ts-nocheck
/**
 * saveEditedVideo。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Ref, SetAny, SetState, Toast, WjNode } from "../lib/app-types";
import { buildProjectMediaFileUrl } from "../lib/resource";

interface UseSaveEditedVideoDeps {
  projectIdRef: Ref;
  setNodes: SetState<WjNode[]>;
  setVideoEditState: SetAny;
  showToast: Toast;
  videoEditState: any;
}

export function useSaveEditedVideo(deps: UseSaveEditedVideoDeps) {
  const {
    projectIdRef,
    setNodes,
    setVideoEditState,
    showToast,
    videoEditState,
  } = deps;
  const saveEditedVideo = useCallback(
      async (videoResult) => {
          if (!videoEditState || !videoResult?.url) return;
          let clipNodeId = `${videoEditState.id}-clip-${Date.now()}`,
            clipLabel = videoResult.label || videoEditState.label || `edited-video.webm`,
            clipUrl = videoResult.url,
            clipBinding = null;
          if (window.wanjuanDesktop?.persistProjectAsset)
            try {
	              let persistedAsset = await window.wanjuanDesktop.persistProjectAsset({
	                url: videoResult.url,
	                filename: clipLabel,
	                mime: videoResult.mime || `video/webm`,
	                size: videoResult.size || 0,
	                projectId: projectIdRef.current,
	                nodeId: clipNodeId,
	                field: `imageUrl`,
                kind: `video`,
                directory: ``,
              });
              if (!persistedAsset?.ok || !persistedAsset.localPath || !persistedAsset.size || persistedAsset.size < 1024)
                throw Error(persistedAsset?.error || `剪辑视频保存失败`);
              ((clipBinding = {
                  ok: true,
                  assetId: persistedAsset.assetId,
                  mime: persistedAsset.mime,
                  filename: persistedAsset.filename,
                  localPath: persistedAsset.localPath,
                  projectId: persistedAsset.projectId,
                  nodeId: persistedAsset.nodeId,
                  size: persistedAsset.size,
                  sha256: persistedAsset.sha256,
                  savedAt: persistedAsset.savedAt,
                  field: `imageUrl`,
                  kind: `video`,
                  portableDataRef: `project-asset-v2-${String(projectIdRef.current || `default`).replace(/[\\/:*?"<>|\\s]+/g, `-`).replace(/^\\.+/, ``) || `default`}-${String(clipNodeId || `node`).replace(/[\\/:*?"<>|\\s]+/g, `-`).replace(/^\\.+/, ``) || `node`}-media-imageUrl-portable`,
                  valueFormat: `file-url`,
                  sourceOrigin: `video-editor`,
                  missing: false,
                }),
                (clipUrl = buildProjectMediaFileUrl(persistedAsset.localPath) || clipUrl));
	            } catch (error) {
	              console.warn(`Video editor result persist skipped`, error);
	              showToast(`媒体库保存失败，已在画布创建临时副本：${error?.message || error}`);
	              if (window.wanjuanDesktop?.saveDownload)
	                try {
	                  let saved = await window.wanjuanDesktop.saveDownload({
	                    url: videoResult.url,
	                    filename: clipLabel,
	                    mime: videoResult.mime || `video/webm`,
	                    saveAs: false
	                  });
	                  saved?.ok && showToast(`剪辑副本已保存到下载目录`);
	                } catch (fallbackError) {
	                  console.warn(`Video editor fallback download skipped`, fallbackError);
	                }
	            }
          else if (typeof videoResult.url == `string` && videoResult.url.startsWith(`blob:`)) {
            showToast(`剪辑视频无法保存到本地媒体库，未创建临时副本`);
            try {
              URL.revokeObjectURL(videoResult.url);
            } catch {}
            return;
          }
          setNodes((nodes) => {
            let sourceNode = nodes.find((node) => node.id === videoEditState.id);
            if (!sourceNode) return nodes;
            let clipNode = {
              ...sourceNode,
              id: clipNodeId,
              type: `imageNode`,
              selected: false,
              dragging: false,
              style: sourceNode.type === `imageNode` && sourceNode.style ? sourceNode.style : {
                width: 224,
                height: 320
              },
              data: {
                mediaKind: `video`,
                imageUrl: clipUrl,
                thumbnailUrl: videoResult.thumbnailUrl || sourceNode.data?.thumbnailUrl,
                videoName: clipLabel,
                label: clipLabel,
                projectAssetBindings: clipBinding ? {
                  imageUrl: clipBinding
                } : undefined,
              },
              position: {
                x: (sourceNode.position?.x || 0) + 56,
                y: (sourceNode.position?.y || 0) + 56,
              },
            };
            return [...nodes, clipNode];
          }), setVideoEditState(null);
        },
        [videoEditState, setNodes],
    );
  return { saveEditedVideo };
}
