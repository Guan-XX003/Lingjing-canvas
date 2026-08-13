/**
 * 天玑人像资源处理模块。
 *
 * 负责把天玑(Seedance)接口返回的原始人像素材数据归一化为统一结构，
 * 并把单个归一化人像转换为编辑器内部使用的资源对象(resource)。
 */

import { wanjuanResetArkTrustedAssetBindingForImage } from "./ark-trusted-assets";
import {
  wanjuanTianjiFlattenPortraitAssets,
  wanjuanTianjiPortraitAssetIdFromItem,
  wanjuanTianjiPortraitAvailabilityFromItem,
  wanjuanTianjiPortraitGroupTypeFromItem,
  wanjuanTianjiPortraitImageUrlFromItem,
  wanjuanTianjiPortraitNameFromItem,
  wanjuanTianjiPortraitStatusFromItem,
} from "./tianji-assets";

/** 归一化后的天玑人像素材结构。 */
interface TianjiPortraitAsset {
  id: string;
  name: string;
  portraitAssetId: string;
  imageUrl: string;
  previewUrl: string;
  groupType: string;
  status: string;
  availability: string;
  localUploaded: boolean;
  createdAt: number;
}

export const wanjuanHasTianjiPortraitClaim = (data: any): boolean =>
  Boolean(
    data &&
      typeof data == `object` &&
      (data.tianjiPortraitAssetId ||
        data.isTianjiPortrait === true ||
        data.tianjiPortraitBindingStatus ||
        data.tianjiPortraitPreviewUrl ||
        data.tianjiPortraitBindingSourceUrl ||
        data.source === `tianji-portrait` ||
        data.sourceOrigin === `tianji-portrait` ||
        data.type === `image/tianji-portrait`),
  );

export const wanjuanIsReadyTianjiPortraitBinding = (data: any): boolean =>
  Boolean(
    data &&
      typeof data == `object` &&
      String(data.tianjiPortraitBindingStatus || ``).trim().toLowerCase() === `ready` &&
      String(data.tianjiPortraitAssetId || ``).trim() &&
      (data.source === `tianji-portrait` ||
        data.sourceOrigin === `tianji-portrait` ||
        data.type === `image/tianji-portrait`),
  );

/**
 * React Flow 的 getNodes() 在节点数据刚更新时可能短暂返回旧快照。
 * 合并两个快照时，同 ID 节点始终采用 React state ref 中的最新数据。
 */
export const wanjuanPreferCurrentCanvasNodes = (currentNodes: any, fallbackNodes: any): any[] => {
  const current = Array.isArray(currentNodes) ? currentNodes : [];
  const fallback = Array.isArray(fallbackNodes) ? fallbackNodes : [];
  if (!current.length) return fallback;
  if (!fallback.length) return current;
  const currentById = new Map(current.map((node) => [node?.id, node]));
  const bindingStrength = (node: any) => {
    const data = node?.data;
    if (wanjuanIsReadyTianjiPortraitBinding(data)) return 2;
    return wanjuanHasTianjiPortraitClaim(data) ? 1 : 0;
  };
  const merged = fallback.map((node) => {
    const currentNode = currentById.get(node?.id);
    if (!currentNode) return node;
    return bindingStrength(node) > bindingStrength(currentNode) ? node : currentNode;
  });
  const fallbackIds = new Set(fallback.map((node) => node?.id));
  current.forEach((node) => {
    if (!fallbackIds.has(node?.id)) merged.push(node);
  });
  return merged;
};

export const wanjuanTianjiPortraitNodeDataFromAutomation = (assetId: any): any => {
  const id = String(assetId || ``).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,511}$/.test(id))
    throw Error(`天玑已审核人像素材 ID 格式无效`);
  return {
    imageUrl: ``,
    mediaKind: `image`,
    type: `image/tianji-portrait`,
    tianjiPortraitAssetId: id,
    tianjiPortraitBindingStatus: `ready`,
    isTianjiPortrait: true,
    source: `tianji-portrait`,
    sourceOrigin: `tianji-portrait`,
  };
};

/** Preserve reviewed portrait metadata when a canvas node becomes a video reference. */
export const wanjuanTianjiPortraitReferenceFromNodeData = (data: any): any => {
  if (!wanjuanHasTianjiPortraitClaim(data)) return null;
  if (!wanjuanIsReadyTianjiPortraitBinding(data))
    throw Error(`这张图片的天玑审核绑定不完整，请从天玑人像库重新选择`);
  return {
    url: String(data.imageUrl || data.url || data.tianjiPortraitPreviewUrl || ``).trim(),
    tianjiPortraitAssetId: String(data.tianjiPortraitAssetId || ``).trim(),
    tianjiPortraitGroupType: data.tianjiPortraitGroupType,
    tianjiPortraitPreviewUrl: data.tianjiPortraitPreviewUrl,
    tianjiPortraitBindingStatus: `ready`,
    tianjiPortraitBindingMessage: data.tianjiPortraitBindingMessage,
    isTianjiPortrait: true,
    source: data.source === `tianji-portrait` ? data.source : undefined,
    sourceOrigin: `tianji-portrait`,
  };
};

export const wanjuanRecoverTianjiPortraitNodeData = (data: any, resolved: any): any => {
  if (!wanjuanHasTianjiPortraitClaim(data) || String(data?.tianjiPortraitAssetId || ``).trim() || !resolved?.assetId)
    return null;
  return {
    ...(data || {}),
    tianjiPortraitAssetId: String(resolved.assetId).trim(),
    tianjiPortraitGroupType: resolved.groupType || data?.tianjiPortraitGroupType || `AIGC`,
    tianjiPortraitPreviewUrl: resolved.imageUrl || data?.tianjiPortraitPreviewUrl || data?.imageUrl,
    isTianjiPortrait: true,
    sourceOrigin: `tianji-portrait`,
    tianjiPortraitBindingStatus: `ready`,
    tianjiPortraitBindingMessage: `已从本地 Active 素材缓存恢复最终人像 ID`,
  };
};

/** Clear image-specific Tianji binding metadata when a new result replaces the image. */
export function wanjuanResetTianjiPortraitBindingForImage(data: any, nextImageUrl: any): any {
  const currentImageUrl = String(data?.imageUrl || ``).trim();
  const normalizedNextImageUrl = String(nextImageUrl || ``).trim();
  if (!normalizedNextImageUrl || normalizedNextImageUrl === currentImageUrl) return { ...(data || {}) };
  return {
    ...wanjuanResetArkTrustedAssetBindingForImage(data, nextImageUrl),
    tianjiPortraitAssetId: undefined,
    tianjiPortraitGroupType: undefined,
    tianjiPortraitPreviewUrl: undefined,
    tianjiPortraitBindingLookupUrl: undefined,
    tianjiPortraitBindingName: undefined,
    tianjiPortraitBindingSourceUrl: undefined,
    tianjiPortraitBindingStatus: undefined,
    tianjiPortraitBindingMessage: undefined,
    tianjiPortraitReviewedAt: undefined,
    tianjiPortraitBoundAt: undefined,
    isTianjiPortrait: false,
    sourceOrigin: data?.sourceOrigin === `tianji-portrait` ? `generated` : data?.sourceOrigin,
  };
}

/**
 * 归一化天玑人像素材。
 *
 * 入参既可能是素材数组，也可能是按分组(LivenessFace / AIGC)组织的对象；
 * 统一展开后提取人像 id、图片地址、分组类型等字段，过滤掉无图片地址和本地上传的项。
 */
export function wanjuanNormalizeTianjiPortraitAssets(rawAssets: any): TianjiPortraitAsset[] {
  return wanjuanTianjiFlattenPortraitAssets(rawAssets)
    .map((asset, index) => {
      let assetId = wanjuanTianjiPortraitAssetIdFromItem(asset),
        imageUrl = wanjuanTianjiPortraitImageUrlFromItem(asset),
        groupType = wanjuanTianjiPortraitGroupTypeFromItem(asset);
      return imageUrl
        ? {
            id: assetId || `tianji-portrait-${Date.now()}-${index}`,
            name: wanjuanTianjiPortraitNameFromItem(asset) || (groupType === `AIGC` ? `虚拟人像` : `真人人像`),
            portraitAssetId: assetId,
            imageUrl: imageUrl,
            previewUrl: imageUrl,
            groupType: groupType || `LivenessFace`,
            status: wanjuanTianjiPortraitStatusFromItem(asset),
            availability: wanjuanTianjiPortraitAvailabilityFromItem(asset),
            localUploaded: asset?.localUploaded === !0,
            createdAt: Number(asset?.createdAt || asset?.CreateTime || Date.now()),
          }
        : null;
    })
    .filter((asset): asset is TianjiPortraitAsset => !!asset && asset.localUploaded !== !0);
}

/**
 * 把单个归一化天玑人像转换为编辑器内部资源对象。
 *
 * 缺少图片地址时返回 null；否则构造带 isTianjiPortrait 标记、
 * source/sourceOrigin 为 tianji-portrait 的图片资源。
 */
export function wanjuanTianjiPortraitToResource(portrait: any, index = 0): any {
  let imageUrl = String(portrait?.imageUrl || portrait?.previewUrl || portrait?.url || ``).trim();
  let availability = String(portrait?.availability || wanjuanTianjiPortraitAvailabilityFromItem(portrait)).trim();
  if (!imageUrl || availability !== `ready`) return null;
  let defaultName = portrait?.groupType === `AIGC` ? `虚拟人像` : `真人人像`,
    portraitAssetId = String(portrait?.portraitAssetId || portrait?.id || ``).trim();
  return {
    id: `tianji-portrait-${portrait?.id || index}`,
    tianjiPortraitAssetId: portraitAssetId,
    url: imageUrl,
    thumbnailUrl: portrait?.previewUrl || imageUrl,
    previewUrl: portrait?.previewUrl || imageUrl,
    type: `image/tianji-portrait`,
    pageTitle: portrait?.name || defaultName,
    label: portrait?.name || defaultName,
    name: portrait?.name || defaultName,
    source: `tianji-portrait`,
    sourceOrigin: `tianji-portrait`,
    groupType: portrait?.groupType || `LivenessFace`,
    localUploaded: portrait?.localUploaded === !0,
    isTianjiPortrait: !0,
    tianjiPortraitBindingStatus: `ready`,
  };
}
