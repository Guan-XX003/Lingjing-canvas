// @ts-nocheck
/**
 * createImportedMediaNode。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildProjectMediaFileUrl } from "../lib/resource";
import { wanjuanGetDroppedFilePath, wanjuanMediaKindFromFile } from "../lib/project-asset-binding";

export function use_createImportedMediaNode(deps: any) {
  const {
    createNodeAt,
    persistImportedMediaFile,
    setNodes,
  } = deps;
  const createImportedMediaNode = (file, position, connection) => {
      let mediaKind = wanjuanMediaKindFromFile(file),
        nodeId = `imageNode-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nativePath = wanjuanGetDroppedFilePath(file),
        stableUrl = nativePath ? buildProjectMediaFileUrl(nativePath) : ``,
        createNodeWithUrl = (mediaUrl) => {
          if (!mediaUrl) return;
          createNodeAt(
            `imageNode`,
            position, {
              __nodeId: nodeId,
              imageUrl: mediaUrl,
              label: file.name,
              sourceOrigin: `external-upload`,
              originalName: file.name,
              mediaKind,
              ...(nativePath ? {
                localPath: nativePath,
                filePath: nativePath,
              } : {}),
            },
            connection,
          );
          persistImportedMediaFile(file, nodeId, `imageUrl`, mediaKind, mediaUrl).then((persisted) => {
        if (!persisted?.url) {
          addGeneratedAsset?.(mediaUrl, mediaKind, file.name, `external-upload`);
          return;
        }
        setNodes((nodes2) =>
          nodes2.map((node) =>
            node.id === nodeId ?
            {
              ...node,
              data: {
                ...node.data,
                imageUrl: persisted.url,
                localPath: persisted.localPath,
                filePath: persisted.localPath,
                projectAssetBindings: persisted.binding ? {
                  ...(node.data?.projectAssetBindings || {}),
                  imageUrl: persisted.binding,
                } : node.data?.projectAssetBindings,
              },
            } :
            node,
          ),
        );
        addGeneratedAsset?.(persisted.url, mediaKind, file.name, `external-upload`);
          });
        };
      if (stableUrl) {
        createNodeWithUrl(stableUrl);
        return;
      }
      let reader = new FileReader();
      ((reader.onload = (event2) => {
          let dataUrl = event2.target?.result;
          typeof dataUrl == `string` && dataUrl && createNodeWithUrl(dataUrl);
        }),
        reader.readAsDataURL(file));
    };
  return { createImportedMediaNode };
}
