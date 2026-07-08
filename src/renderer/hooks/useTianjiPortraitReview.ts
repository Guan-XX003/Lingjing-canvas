// @ts-nocheck
/**
 * handleTianjiPortraitReview。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetState, Toast, WjNode } from "../lib/app-types";
import { WANJUAN_TIANJI_ASSET_PAGE_SIZE, wanjuanTianjiFinalPortraitAsset, wanjuanTianjiRefreshPortraitAssets, wanjuanTianjiResolvePortraitAssetForNodeData, wanjuanUploadTianjiVirtualPortrait } from "../lib/tianji-assets";
import { wanjuanGetSyncedTianjiSeedanceConfig } from "../lib/tianji-api";

interface UseTianjiPortraitReviewDeps {
  setNodes: SetState<WjNode[]>;
  showToast: Toast;
}

export function useTianjiPortraitReview(deps: UseTianjiPortraitReviewDeps) {
  const {
    setNodes,
    showToast,
  } = deps;
  const handleTianjiPortraitReview = useCallback(
      async (imageUrl, meta = {}) => {
          let targetNodeId = String(meta.nodeId || ``).trim();
          try {
            showToast(`正在提交到天玑虚拟人像审核...`);
            if (targetNodeId)
              setNodes((nodes2) =>
                nodes2.map((node2) =>
                  node2.id === targetNodeId ?
                  {
                    ...node2,
                    data: {
                      ...node2.data,
                      tianjiPortraitAssetId: undefined,
                      isTianjiPortrait: false,
                      sourceOrigin: `tianji-portrait`,
                      tianjiPortraitBindingStatus: `reviewing`,
                      tianjiPortraitBindingMessage: `正在提交天玑人像审核...`,
                    },
                  } :
                  node2,
                ),
              );
            let result = await wanjuanUploadTianjiVirtualPortrait(imageUrl, {
                name: meta.label || `虚拟人像素材`,
              }),
              finalPortrait = wanjuanTianjiFinalPortraitAsset(result),
              portraitAssetId = finalPortrait.assetId,
              bindingLookupUrl = result?.imageUrl || finalPortrait.imageUrl || imageUrl,
              bindingName = meta.label || result?.asset?.name || `虚拟人像素材`;
            if (targetNodeId)
              setNodes((nodes2) =>
                nodes2.map((node2) =>
                  node2.id === targetNodeId ?
                  {
                    ...node2,
                    data: {
                      ...node2.data,
                      ...(portraitAssetId ? {
                        tianjiPortraitAssetId: portraitAssetId,
                        tianjiPortraitGroupType: finalPortrait.asset?.groupType || finalPortrait.asset?.group_type || `AIGC`,
                        tianjiPortraitPreviewUrl: finalPortrait.imageUrl || node2.data?.imageUrl || imageUrl,
                        tianjiPortraitBindingLookupUrl: bindingLookupUrl,
                        tianjiPortraitBindingName: bindingName,
                        isTianjiPortrait: true,
                        sourceOrigin: `tianji-portrait`,
                        tianjiPortraitBindingStatus: `ready`,
                        tianjiPortraitBindingMessage: `已绑定天玑素材库最终人像 ID`,
                      } : {
                        tianjiPortraitAssetId: undefined,
                        isTianjiPortrait: false,
                        tianjiPortraitBindingLookupUrl: bindingLookupUrl,
                        tianjiPortraitBindingName: bindingName,
                        tianjiPortraitBindingStatus: `pending`,
                        tianjiPortraitBindingMessage: `人像已提交审核，正在自动等待素材库返回最终 ID`,
                      }),
                      sourceOrigin: `tianji-portrait`,
                      tianjiPortraitReviewedAt: Date.now(),
                    },
                  } :
                  node2,
                ),
              );
            showToast(
              portraitAssetId ?
              `已绑定天玑素材库最终人像，可直接连接即梦天玑节点参考` :
              `已提交天玑人像审核，正在自动刷新等待绑定`,
            );
            !portraitAssetId &&
              targetNodeId &&
              void (async () => {
                let sleep = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs)),
                  retryDelays = [2500, 4e3, 6e3, 8e3, 1e4, 12e3, 15e3, 18e3, 22e3, 25e3, 3e4, 3e4];
                for (let attempt = 1; attempt <= retryDelays.length; attempt++) {
                  await sleep(retryDelays[attempt - 1]);
                  try {
                    let config = await wanjuanGetSyncedTianjiSeedanceConfig(),
                      refresh = await wanjuanTianjiRefreshPortraitAssets(config, {
                        preferredType: `AIGC`,
                        retries: attempt <= 4 ? 1 : 0,
                        delayMs: 1500,
                        pageNumber: 1,
                        pageSize: WANJUAN_TIANJI_ASSET_PAGE_SIZE,
                      }),
                      resolved = wanjuanTianjiResolvePortraitAssetForNodeData({
                        tianjiPortraitBindingLookupUrl: bindingLookupUrl,
                        tianjiPortraitBindingName: bindingName,
                        label: bindingName,
                      }, refresh?.assets || {});
                    if (!resolved?.assetId) continue;
                    setNodes((nodes2) =>
                      nodes2.map((node2) =>
                        node2.id === targetNodeId && node2.data?.tianjiPortraitBindingStatus === `pending` ?
                        {
                          ...node2,
                          data: {
                            ...node2.data,
                            tianjiPortraitAssetId: resolved.assetId,
                            tianjiPortraitGroupType: resolved.groupType || node2.data.tianjiPortraitGroupType || `AIGC`,
                            tianjiPortraitPreviewUrl: resolved.imageUrl || node2.data.tianjiPortraitPreviewUrl || node2.data.imageUrl,
                            isTianjiPortrait: true,
                            sourceOrigin: `tianji-portrait`,
                            tianjiPortraitBindingStatus: `ready`,
                            tianjiPortraitBindingMessage: `已自动绑定天玑素材库最终人像 ID`,
                            tianjiPortraitBoundAt: Date.now(),
                          },
                        } :
                        node2,
                      ),
                    );
                    showToast(`天玑人像已自动绑定，可直接连接即梦天玑节点参考`);
                    break;
                  } catch (error) {
                    console.warn(`Tianji portrait auto bind retry failed`, error);
                  }
                }
              })();
            return result;
          } catch (error) {
            let errorMessage = error?.message || String(error || `天玑人像审核提交失败`);
            (console.error(`Tianji portrait review upload failed`, error),
              targetNodeId &&
              setNodes((nodes2) =>
                nodes2.map((node2) =>
                  node2.id === targetNodeId ?
                  {
                    ...node2,
                    data: {
                      ...node2.data,
                      tianjiPortraitAssetId: undefined,
                      isTianjiPortrait: false,
                      sourceOrigin: `tianji-portrait`,
                      tianjiPortraitBindingStatus: `failed`,
                      tianjiPortraitBindingMessage: errorMessage || `绑定失败，需手动从天玑人像库选择`,
                    },
                  } :
                  node2,
                ),
              ),
              showToast(`天玑人像审核提交失败：${errorMessage}`));
            throw error;
          }
        },
        [setNodes, showToast],
    );
  return { handleTianjiPortraitReview };
}
