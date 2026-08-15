import { useCallback } from "react";
import type { SetAny, SetState, Toast, WjNode } from "../lib/app-types";
import {
  wanjuanArkTrustedAssetReadyPatch,
  wanjuanNormalizeArkTrustedAssetConfig,
} from "../lib/ark-trusted-assets";

interface UseArkTrustedAssetReviewDeps {
  arkTrustedAssetConfig: any;
  setArkTrustedAssetConfig: SetAny;
  setNodes: SetState<WjNode[]>;
  showToast: Toast;
  tosConfig: any;
}

export function useArkTrustedAssetReview({
  arkTrustedAssetConfig,
  setArkTrustedAssetConfig,
  setNodes,
  showToast,
  tosConfig,
}: UseArkTrustedAssetReviewDeps) {
  const handleArkTrustedAssetReview = useCallback(async (imageUrl: any, meta: any = {}) => {
    const sourceUrl = String(imageUrl || ``).trim();
    const targetNodeId = String(meta.nodeId || ``).trim();
    const config = wanjuanNormalizeArkTrustedAssetConfig(arkTrustedAssetConfig);
    if (!config.enabled && meta.allowWhenDisabled !== true) {
      throw new Error(`请先在即梦官方兼容设置中启用 Ark 可信素材`);
    }
    if (!sourceUrl) throw new Error(`图片为空，无法提交 Ark 可信素材审核`);
    const registerAsset = window.wanjuanDesktop?.registerArkTrustedAsset;
    if (typeof registerAsset !== `function`) throw new Error(`当前桌面版本不支持 Ark 可信素材审核`);
    const requestId = String(meta.requestId || `ark-review-${targetNodeId || `media`}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    if (targetNodeId) {
      setNodes((nodes) => nodes.map((node) =>
        node.id === targetNodeId && String(node.data?.imageUrl || ``).trim() === sourceUrl ? {
          ...node,
          data: {
            ...node.data,
            arkTrustedAssetId: undefined,
            arkTrustedAssetGroupId: undefined,
            arkTrustedAssetContentHash: undefined,
            arkTrustedAssetSourceUrl: sourceUrl,
            arkTrustedAssetStatus: `reviewing`,
            arkTrustedAssetMessage: `正在提交 Ark 可信素材审核...`,
          },
        } : node,
      ));
    }
    meta.silent !== true && showToast(`正在提交 Ark 可信素材审核...`);
    try {
      const result = await registerAsset({
        url: sourceUrl,
        localPath: meta.localPath || meta.filePath || undefined,
        filename: meta.filename || meta.label || `ark-reference-${Date.now()}`,
        name: meta.label || meta.name || `StarCanvas参考图`,
        kind: `image`,
        requestId,
        tos: tosConfig || {},
        ark: config,
      });
      if (!result?.ok) throw new Error(result?.error || `Ark 可信素材审核失败`);
      const readyPatch = wanjuanArkTrustedAssetReadyPatch(result, sourceUrl);
      if (!readyPatch) throw new Error(`Ark 可信素材审核未返回 Asset ID`);
      if (result.groupId && result.groupId !== config.assetGroupId) {
        setArkTrustedAssetConfig((current) => wanjuanNormalizeArkTrustedAssetConfig({
          ...(current || {}),
          assetGroupId: result.groupId,
        }));
      }
      if (targetNodeId) {
        setNodes((nodes) => nodes.map((node) =>
          node.id === targetNodeId && String(node.data?.imageUrl || ``).trim() === sourceUrl ? {
            ...node,
            data: { ...node.data, ...readyPatch },
          } : node,
        ));
      }
      meta.silent !== true && showToast(result.cached ? `已复用 Ark 可信素材，可直接用于即梦官方兼容模式` : `Ark 可信素材审核通过，可直接用于即梦官方兼容模式`);
      return result;
    } catch (error: any) {
      const message = error?.message || String(error || `Ark 可信素材审核失败`);
      if (targetNodeId) {
        setNodes((nodes) => nodes.map((node) =>
          node.id === targetNodeId && String(node.data?.imageUrl || ``).trim() === sourceUrl ? {
            ...node,
            data: {
              ...node.data,
              arkTrustedAssetId: undefined,
              arkTrustedAssetGroupId: undefined,
              arkTrustedAssetContentHash: undefined,
              arkTrustedAssetSourceUrl: sourceUrl,
              arkTrustedAssetStatus: `failed`,
              arkTrustedAssetMessage: message,
            },
          } : node,
        ));
      }
      meta.silent !== true && showToast(`Ark 可信素材审核失败：${message}`);
      throw error;
    }
  }, [arkTrustedAssetConfig, setArkTrustedAssetConfig, setNodes, showToast, tosConfig]);

  return { handleArkTrustedAssetReview };
}
