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
