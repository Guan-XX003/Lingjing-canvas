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
  wanjuanTianjiPortraitDisplayPreviewUrlFromItem,
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
  displayPreviewUrl: string;
  localPreviewUrl: string;
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

export const WANJUAN_TIANJI_PORTRAIT_SYNC_ERROR = `天玑人像绑定正在同步，请稍后重试/刷新`;

export const wanjuanTianjiPortraitBindingRevision = (data: any): number => {
  const explicit = Number(data?.tianjiPortraitBindingRevision || 0);
  if (Number.isSafeInteger(explicit) && explicit > 0) return explicit;
  const legacy = Math.max(
    Number(data?.tianjiPortraitReviewedAt || 0),
    Number(data?.tianjiPortraitBoundAt || 0),
  );
  return Number.isFinite(legacy) && legacy > 0 ? Math.floor(legacy) : 0;
};

/** Persisted monotonic revision used to order asynchronous portrait binding updates. */
export const wanjuanNextTianjiPortraitBindingRevision = (data: any): number =>
  wanjuanTianjiPortraitBindingRevision(data) + 1;

const portraitAssetId = (data: any) => String(data?.tianjiPortraitAssetId || ``).trim();

const portraitSourceIdentity = (data: any) =>
  String(
    data?.tianjiPortraitBindingSourceUrl ||
      data?.tianjiPortraitBindingLookupUrl ||
      data?.imageUrl ||
      data?.url ||
      ``,
  ).trim();

const PORTRAIT_IDENTITY_FIELDS = new Set([
  `imageUrl`,
  `url`,
  `source`,
  `sourceOrigin`,
  `type`,
  `isTianjiPortrait`,
  `tianjiPortraitAssetId`,
  `tianjiPortraitBindingStatus`,
  `tianjiPortraitBindingSourceUrl`,
  `tianjiPortraitBindingLookupUrl`,
  `tianjiPortraitBindingRevision`,
  `selectedContextResources`,
]);

const supplementMissingNonIdentityData = (authoritativeData: any, fallbacks: any[]) => {
  const merged = { ...(authoritativeData || {}) };
  fallbacks.forEach((fallbackData) => {
    if (!fallbackData || typeof fallbackData !== `object`) return;
    Object.entries(fallbackData).forEach(([key, value]) => {
      if (key.startsWith(`tianjiPortrait`) || PORTRAIT_IDENTITY_FIELDS.has(key) || Object.prototype.hasOwnProperty.call(merged, key)) return;
      merged[key] = value;
    });
  });
  return merged;
};

export interface TianjiGenerationCanvasSnapshot {
  nodes: any[];
  portraitConflictCount: number;
  stalePortraitSnapshotCount: number;
}

/**
 * Resolve one immutable generation snapshot. React Flow nodes own current topology and identity.
 * Rendered/ref snapshots may fill absent non-identity fields, but never replace current identity.
 */
export const wanjuanResolveTianjiGenerationCanvasSnapshot = ({
  nodes,
  renderedNodes = [],
  refNodes = [],
}: {
  nodes?: any[];
  renderedNodes?: any[];
  refNodes?: any[];
}): TianjiGenerationCanvasSnapshot => {
  const authoritativeNodes = Array.isArray(nodes) ? nodes : [];
  const fallbackLists = [Array.isArray(renderedNodes) ? renderedNodes : [], Array.isArray(refNodes) ? refNodes : []];
  const fallbackById = fallbackLists.map((list) => new Map(list.map((node) => [String(node?.id || ``), node])));
  let portraitConflictCount = 0;
  let stalePortraitSnapshotCount = 0;

  const resolvedNodes = authoritativeNodes.map((node) => {
    const nodeId = String(node?.id || ``);
    const fallbacks = fallbackById.map((map) => map.get(nodeId)).filter(Boolean);
    if (!fallbacks.length) return node;
    const authoritativeData = node?.data || {};
    let data = supplementMissingNonIdentityData(authoritativeData, fallbacks.map((fallback) => fallback?.data));
    const currentAssetId = portraitAssetId(authoritativeData);
    const currentRevision = wanjuanTianjiPortraitBindingRevision(authoritativeData);
    const currentHasClaim = wanjuanHasTianjiPortraitClaim(authoritativeData);
    const readyFallbacks = fallbacks
      .map((fallback) => fallback?.data)
      .filter((fallbackData) => wanjuanIsReadyTianjiPortraitBinding(fallbackData));
    const conflictingFallbacks = readyFallbacks.filter(
      (fallbackData) => portraitAssetId(fallbackData) && portraitAssetId(fallbackData) !== currentAssetId,
    );

    if (currentAssetId && wanjuanIsReadyTianjiPortraitBinding(authoritativeData)) {
      const unresolvedConflict = conflictingFallbacks.some((fallbackData) => {
        const fallbackRevision = wanjuanTianjiPortraitBindingRevision(fallbackData);
        if (currentRevision > 0 && currentRevision > fallbackRevision) {
          stalePortraitSnapshotCount += 1;
          return false;
        }
        return true;
      });
      if (unresolvedConflict) portraitConflictCount += 1;
      return data === authoritativeData ? node : { ...node, data };
    }

    // A current ordinary/replaced image is authoritative. Never resurrect a reviewed fallback.
    if (!currentHasClaim) {
      if (readyFallbacks.length) stalePortraitSnapshotCount += readyFallbacks.length;
      return data === authoritativeData ? node : { ...node, data };
    }

    // Only supplement an incomplete current claim when one unambiguous fallback represents
    // the same source image. This keeps legacy projects without revisions compatible.
    const currentSource = portraitSourceIdentity(authoritativeData);
    const compatibleFallbacks = readyFallbacks.filter((fallbackData) => {
      const fallbackSource = portraitSourceIdentity(fallbackData);
      return Boolean(currentSource && fallbackSource && currentSource === fallbackSource);
    });
    const compatibleAssetIds = [...new Set(compatibleFallbacks.map(portraitAssetId).filter(Boolean))];
    if (compatibleAssetIds.length > 1) {
      portraitConflictCount += 1;
      return { ...node, data };
    }
    if (compatibleAssetIds.length === 1) {
      const matching = compatibleFallbacks
        .filter((fallbackData) => portraitAssetId(fallbackData) === compatibleAssetIds[0])
        .sort((a, b) => wanjuanTianjiPortraitBindingRevision(b) - wanjuanTianjiPortraitBindingRevision(a))[0];
      const fallbackRevision = wanjuanTianjiPortraitBindingRevision(matching);
      if (currentRevision > 0 && fallbackRevision < currentRevision) {
        stalePortraitSnapshotCount += 1;
      } else {
        data = {
          ...data,
          tianjiPortraitAssetId: portraitAssetId(matching),
          tianjiPortraitBindingStatus: `ready`,
          tianjiPortraitBindingSourceUrl: matching.tianjiPortraitBindingSourceUrl || authoritativeData.tianjiPortraitBindingSourceUrl,
          tianjiPortraitBindingLookupUrl: matching.tianjiPortraitBindingLookupUrl || authoritativeData.tianjiPortraitBindingLookupUrl,
          tianjiPortraitBindingRevision: fallbackRevision || currentRevision || undefined,
          isTianjiPortrait: true,
          sourceOrigin: `tianji-portrait`,
        };
      }
    } else if (readyFallbacks.length) {
      // A reviewed fallback for another image is stale, not a valid supplement.
      stalePortraitSnapshotCount += readyFallbacks.length;
    }
    return { ...node, data };
  });

  return { nodes: resolvedNodes, portraitConflictCount, stalePortraitSnapshotCount };
};

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
    tianjiPortraitBindingRevision: 1,
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
    tianjiPortraitBindingRevision: wanjuanTianjiPortraitBindingRevision(data) || undefined,
    tianjiPortraitSourceId: data.tianjiPortraitSourceId,
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
    tianjiPortraitBindingRevision: wanjuanNextTianjiPortraitBindingRevision(data),
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
    tianjiPortraitLocalPreviewUrl: undefined,
    tianjiPortraitBindingLookupUrl: undefined,
    tianjiPortraitBindingName: undefined,
    tianjiPortraitBindingSourceUrl: undefined,
    tianjiPortraitSourceId: undefined,
    tianjiPortraitBindingStatus: undefined,
    tianjiPortraitBindingMessage: undefined,
    tianjiPortraitReviewedAt: undefined,
    tianjiPortraitBoundAt: undefined,
    tianjiPortraitBindingRevision: wanjuanNextTianjiPortraitBindingRevision(data),
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
        displayPreviewUrl = wanjuanTianjiPortraitDisplayPreviewUrlFromItem(asset),
        localPreviewUrl = /^file:\/\//i.test(String(asset?.__wanjuanTianjiLocalPreviewUrl || ``).trim()) ? String(asset.__wanjuanTianjiLocalPreviewUrl).trim() : ``,
        groupType = wanjuanTianjiPortraitGroupTypeFromItem(asset);
      return assetId
        ? {
            id: assetId || `tianji-portrait-${Date.now()}-${index}`,
            name: wanjuanTianjiPortraitNameFromItem(asset) || (groupType === `AIGC` ? `虚拟人像` : `真人人像`),
            portraitAssetId: assetId,
            imageUrl: imageUrl,
            previewUrl: displayPreviewUrl,
            displayPreviewUrl,
            localPreviewUrl,
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
  let imageUrl = String(portrait?.imageUrl || ``).trim(),
    displayPreviewUrl = String(portrait?.displayPreviewUrl || portrait?.previewUrl || ``).trim();
  let availability = String(portrait?.availability || wanjuanTianjiPortraitAvailabilityFromItem(portrait)).trim();
  if (availability !== `ready`) return null;
  let defaultName = portrait?.groupType === `AIGC` ? `虚拟人像` : `真人人像`,
    portraitAssetId = String(portrait?.portraitAssetId || portrait?.id || ``).trim();
  if (!portraitAssetId) return null;
  return {
    id: `tianji-portrait-${portrait?.id || index}`,
    tianjiPortraitSourceId: `tianji-portrait-${portrait?.id || index}`,
    tianjiPortraitAssetId: portraitAssetId,
    url: `asset://${portraitAssetId}`,
    thumbnailUrl: displayPreviewUrl,
    previewUrl: displayPreviewUrl,
    remotePreviewUrl: imageUrl,
    localPreviewUrl: portrait?.localPreviewUrl || ``,
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
    tianjiPortraitBindingRevision: wanjuanTianjiPortraitBindingRevision(portrait) || 1,
  };
}
