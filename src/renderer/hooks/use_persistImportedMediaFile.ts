// @ts-nocheck
/**
 * persistImportedMediaFile。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Ref } from "../lib/app-types";
import { buildProjectMediaFileUrl } from "../lib/resource";
import { wanjuanBuildProjectAssetBinding, wanjuanGetDroppedFilePath, wanjuanMimeFromMediaKind } from "../lib/project-asset-binding";

interface UsePersistImportedMediaFileDeps {
  projectIdRef: Ref;
  projectId: any;
}

export function use_persistImportedMediaFile(deps: UsePersistImportedMediaFileDeps) {
  const {
    projectIdRef,
    projectId,
  } = deps;
  const persistImportedMediaFile = async (file, nodeId, field, mediaKind, mediaUrl = ``) => {
      if (!file || !window.wanjuanDesktop?.persistProjectAsset) return null;
      try {
        let nativePath = wanjuanGetDroppedFilePath(file),
          payload = {
            projectId: projectIdRef.current || `default`,
            nodeId,
            field,
            kind: mediaKind,
            filename: file.name || `${mediaKind}-${Date.now()}`,
            mime: wanjuanMimeFromMediaKind(mediaKind, file),
            size: file.size || 0,
            directory: ``,
          };
        nativePath ?
          (payload.localPath = nativePath) :
          mediaUrl &&
          (payload.url = mediaUrl);
        if (!payload.localPath && !payload.url) return null;
        let persisted = await window.wanjuanDesktop.persistProjectAsset(payload);
        if (!persisted?.ok || !persisted.localPath) return null;
        let fileUrl = buildProjectMediaFileUrl(persisted.localPath);
        return {
          url: fileUrl,
          localPath: persisted.localPath,
          thumbnailUrl: persisted.thumbnailLocalPath ? buildProjectMediaFileUrl(persisted.thumbnailLocalPath) : fileUrl,
          thumbnailLocalPath: persisted.thumbnailLocalPath || persisted.localPath,
          binding: wanjuanBuildProjectAssetBinding(persisted, {
            sourceOrigin: `external-upload`,
          }),
        };
      } catch (error) {
        return (console.warn(`Import media persist skipped`, error), null);
      }
    };
  return { persistImportedMediaFile };
}
