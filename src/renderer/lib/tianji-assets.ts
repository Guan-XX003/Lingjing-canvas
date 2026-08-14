/**
 * 天玑（Tianji）人像素材管理模块。
 *
 * 负责天玑虚拟/真人人像素材库的完整生命周期：
 * - 素材列表请求参数、分页与分组（LivenessFace / AIGC）解析；
 * - 本地上传占位素材的创建、上传结果的素材 id / 最终素材提取；
 * - 人像素材扁平化、按节点数据解析当前选中人像；
 * - 已提交人像与本地缓存合并、带重试的素材列表刷新、虚拟人像上传。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import {
  wanjuanGetSyncedTianjiSeedanceConfig,
  wanjuanTianjiFindDeep,
  wanjuanTianjiRequest,
  wanjuanTianjiStorageGet,
  wanjuanTianjiStorageSet,
} from "./tianji-api";
import {
  wanjuanCommitPendingTianjiLocalPreview,
  wanjuanFindTianjiLocalPreview,
  wanjuanLoadTianjiLocalPreviewRegistry,
  wanjuanPersistTianjiLocalPreview,
  wanjuanQueueTianjiLocalPreview,
  wanjuanSetTianjiLocalPreview,
  wanjuanTianjiLocalPreviewScope,
} from "./tianji-local-previews";

export const wanjuanTianjiFindArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value != `object`) return [];
  for (let key of [`list`, `List`, `items`, `Items`, `records`, `Records`, `assets`, `Assets`, `asset_list`, `AssetList`, `results`, `Results`, `result`, `Result`, `rows`, `Rows`, `data`, `Data`]) {
    let found = wanjuanTianjiFindArray(value[key]);
    if (found.length) return found;
  }
  return [];
};

export const wanjuanTianjiReadPositiveNumber = (value, fallback = 0) => {
  let parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const wanjuanTianjiAssetListParams = (groupType, groupId, pageNumber = 1, pageSize = WANJUAN_TIANJI_ASSET_PAGE_SIZE) => {
  let page = Math.max(1, Number(pageNumber) || 1),
    size = Math.max(1, Number(pageSize) || WANJUAN_TIANJI_ASSET_PAGE_SIZE);
  return {
    group_ids: groupId,
    group_type: groupType,
    statuses: `Active`,
    PageNumber: String(page),
    PageSize: String(size),
    SortBy: `CreateTime`,
    SortOrder: `Desc`,
  };
};

export const wanjuanTianjiAssetPagination = (result, fallbackPage = 1, fallbackPageSize = WANJUAN_TIANJI_ASSET_PAGE_SIZE) => ({
  total: wanjuanTianjiReadPositiveNumber(wanjuanTianjiFindDeep(result, [`TotalCount`, `totalCount`, `total_count`, `total`, `Total`, `count`, `Count`])),
  page: wanjuanTianjiReadPositiveNumber(wanjuanTianjiFindDeep(result, [`PageNumber`, `pageNumber`, `page_number`, `page`, `Page`]), fallbackPage),
  pageSize: wanjuanTianjiReadPositiveNumber(wanjuanTianjiFindDeep(result, [`PageSize`, `pageSize`, `page_size`, `limit`, `Limit`, `size`, `Size`]), fallbackPageSize),
});

export const wanjuanTianjiExtractGroups = (result: any, current: any = {}, preferredType = ``) => {
  let found = [],
    visit = (value, path = []) => {
      if (value === null || value === void 0) return;
      if (typeof value == `string` || typeof value == `number`) {
        let matches = String(value).match(/group-[0-9a-z-]+/ig) || [];
        matches.forEach((id) => found.push({
          id: id,
          path: path.join(`.`).toLowerCase(),
        }));
        return;
      }
      Array.isArray(value) ?
        value.forEach((item, index) => visit(item, path.concat(String(index)))) :
        typeof value == `object` &&
        Object.entries(value).forEach(([key, item]) => visit(item, path.concat(key)));
    };
  visit(result);
  let unique = [],
    seen = new Set();
  found.forEach((item) => {
    let id = String(item.id || ``);
    id && !seen.has(id) && (seen.add(id), unique.push(item));
  });
  let pickByPath = (pattern) => unique.find((item) => pattern.test(item.path))?.id || ``,
    live = result?.data?.LivenessFace || result?.data?.group_id || result?.data?.livenessFaceGroupId || result?.data?.live_group_id || pickByPath(/liveness|live|real|真人/i),
    aigc = result?.data?.AIGC || result?.data?.virtal_group_id || result?.data?.virtual_group_id || result?.data?.virtral_group_id || result?.data?.aigcGroupId || result?.data?.aigc_group_id || pickByPath(/aigc|virtual|virtal|virtral|虚拟/i),
    ids = unique.map((item) => item.id);
  if (!live && !aigc && ids.length === 1)
    preferredType === `AIGC` ? (aigc = ids[0]) : preferredType === `LivenessFace` && (live = ids[0]);
  return {
    LivenessFace: live || current.LivenessFace || ``,
    AIGC: aigc || current.AIGC || ``,
  };
};

export const wanjuanTianjiEnsurePortraitGroups = async (config, preferredType = `AIGC`) => {
  let stored = await wanjuanTianjiStorageGet([`tianjiSeedanceGroups`]),
    currentGroups = stored.tianjiSeedanceGroups && typeof stored.tianjiSeedanceGroups == `object` ? stored.tianjiSeedanceGroups : {},
    targetKey = preferredType === `LivenessFace` ? `LivenessFace` : `AIGC`;
  if (currentGroups[targetKey]) return currentGroups;
  throw Error(
    preferredType === `LivenessFace`
      ? `尚未配置真人人像组 ID；请先在天玑面板创建真人认证，完成认证后查询任务并同步组 ID`
      : `尚未配置虚拟人像组 ID；请先在天玑面板创建虚拟组，再查询任务并同步组 ID`,
  );
};

export const wanjuanTianjiCreateLocalUploadAsset = ({ name: name, imageUrl: imageUrl, result: result, groupType = `AIGC` }) => ({
  id: wanjuanTianjiFindDeep(result, [`portrait_asset_id`, `protrait_asset_id`, `asset_id`, `assetId`, `id`, `AssetId`]) || `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  portrait_asset_id: wanjuanTianjiFindDeep(result, [`portrait_asset_id`, `protrait_asset_id`, `asset_id`, `assetId`, `id`, `AssetId`]) || ``,
  name: name || `虚拟人像素材`,
  image_url: imageUrl || ``,
  status: wanjuanTianjiFindDeep(result, [`status`, `Status`]) || `已提交`,
  groupType,
  localUploaded: ![`active`, `success`, `succeeded`, `completed`, `complete`, `done`].includes(String(wanjuanTianjiFindDeep(result, [`status`, `Status`]) || ``).trim().toLowerCase()),
  createdAt: Date.now(),
});

export const wanjuanTianjiSubmittedPortraitAssetId = (uploadResult) => {
  let uploadedUrl = String(uploadResult?.imageUrl || uploadResult?.asset?.image_url || uploadResult?.asset?.imageUrl || ``).trim(),
    label = String(uploadResult?.asset?.name || ``).trim(),
    aigcAssets = Array.isArray(uploadResult?.refresh?.assets?.AIGC) ? uploadResult.refresh.assets.AIGC : [],
    usableAssets = aigcAssets.filter((item) => wanjuanTianjiPortraitAssetIdFromItem(item) && item?.localUploaded !== !0 && wanjuanTianjiPortraitIsReady(item)),
    urlMatches = uploadedUrl ? usableAssets.filter((item) => wanjuanTianjiPortraitImageUrlFromItem(item) === uploadedUrl) : [],
    nameMatches = label ? usableAssets.filter((item) => wanjuanTianjiPortraitNameFromItem(item) === label) : [],
    matchedAsset = urlMatches.length === 1 ? urlMatches[0] : nameMatches.length === 1 ? nameMatches[0] : null;
  return wanjuanTianjiPortraitAssetIdFromItem(matchedAsset);
};

export const wanjuanTianjiFinalPortraitAsset = (uploadResult) => {
  let assetId = wanjuanTianjiSubmittedPortraitAssetId(uploadResult),
    uploadedUrl = String(uploadResult?.imageUrl || uploadResult?.asset?.image_url || uploadResult?.asset?.imageUrl || ``).trim(),
    label = String(uploadResult?.asset?.name || ``).trim(),
    assets = Array.isArray(uploadResult?.refresh?.assets?.AIGC) ? uploadResult.refresh.assets.AIGC : [],
    usableAssets = assets.filter((item) => wanjuanTianjiPortraitAssetIdFromItem(item) && item?.localUploaded !== !0 && wanjuanTianjiPortraitIsReady(item)),
    idMatches = assetId ? usableAssets.filter((item) => wanjuanTianjiPortraitAssetIdFromItem(item) === assetId) : [],
    urlMatches = uploadedUrl ? usableAssets.filter((item) => wanjuanTianjiPortraitImageUrlFromItem(item) === uploadedUrl) : [],
    nameMatches = label ? usableAssets.filter((item) => wanjuanTianjiPortraitNameFromItem(item) === label) : [],
    matchedAsset = idMatches.length === 1 ? idMatches[0] : urlMatches.length === 1 ? urlMatches[0] : nameMatches.length === 1 ? nameMatches[0] : null,
    finalId = wanjuanTianjiPortraitAssetIdFromItem(matchedAsset);
  return {
    assetId: finalId,
    asset: matchedAsset || null,
    imageUrl: wanjuanTianjiPortraitImageUrlFromItem(matchedAsset) || uploadedUrl,
    matched: !!finalId && wanjuanTianjiPortraitIsReady(matchedAsset),
  };
};

const WANJUAN_TIANJI_PORTRAIT_ID_KEYS = [
  `portrait_asset_id`, `portraitAssetId`, `PortraitAssetId`,
  `protrait_asset_id`, `protraitAssetId`, `ProtraitAssetId`,
  `asset_id`, `assetId`, `AssetId`, `assetID`,
  `material_id`, `materialId`, `MaterialId`,
  `assets_id`, `assetsId`, `AssetsId`,
  `portrait_id`, `portraitId`, `PortraitId`,
];

const WANJUAN_TIANJI_PORTRAIT_PREVIEW_KEYS = [
  `image_url`, `imageUrl`, `ImageUrl`,
  `preview_url`, `previewUrl`, `PreviewUrl`,
  `cover_url`, `coverUrl`, `CoverUrl`,
  `thumbnail_url`, `thumbnailUrl`, `ThumbnailUrl`,
  `thumb_url`, `thumbUrl`, `ThumbUrl`,
  `avatar_url`, `avatarUrl`, `AvatarUrl`,
  `portrait_url`, `portraitUrl`, `PortraitUrl`,
  `oss_url`, `ossUrl`, `OssUrl`,
  `url`, `URL`,
];

const wanjuanTianjiObjectGraph = (root, maxDepth = 8, maxObjects = 400) => {
  if (!root || typeof root != `object`) return [];
  let queue = [{ value: root, depth: 0 }],
    seen = new Set(),
    objects = [];
  while (queue.length && objects.length < maxObjects) {
    let next = queue.shift(),
      value = next?.value;
    if (!value || typeof value != `object` || seen.has(value)) continue;
    seen.add(value);
    if (!Array.isArray(value)) objects.push(value);
    if ((next?.depth || 0) >= maxDepth) continue;
    Object.values(value).forEach((child) => {
      child && typeof child == `object` && queue.push({ value: child, depth: (next?.depth || 0) + 1 });
    });
  }
  return objects;
};

const wanjuanTianjiFindNestedValue = (item, aliases, validate = (value) => Boolean(String(value || ``).trim())) => {
  let objects = wanjuanTianjiObjectGraph(item);
  for (let alias of aliases)
    for (let object of objects) {
      let value = object?.[alias];
      if (validate(value)) return String(value).trim();
    }
  return ``;
};

/** 从新旧素材响应中提取唯一资产 ID；不把 group_id 误当成可删除素材 ID。 */
export const wanjuanTianjiPortraitAssetIdFromItem = (item) => {
  const explicit = wanjuanTianjiFindNestedValue(
    item,
    WANJUAN_TIANJI_PORTRAIT_ID_KEYS,
    (value) => Boolean(String(value || ``).trim()) && !/^local-/i.test(String(value)),
  );
  if (explicit) return explicit;
  const generic = wanjuanTianjiFindNestedValue(
    item,
    [`id`, `Id`, `ID`],
    (value) => /^asset-[0-9a-z-]+$/i.test(String(value || ``).trim()),
  );
  if (!generic || /^local-/i.test(generic) || /group/i.test(generic)) return ``;
  return generic;
};

export const wanjuanTianjiPortraitStatusFromItem = (item) =>
  wanjuanTianjiFindNestedValue(item, [
    `status`, `Status`, `asset_status`, `assetStatus`, `AssetStatus`,
    `portrait_status`, `portraitStatus`, `PortraitStatus`,
    `protrait_status`, `protraitStatus`, `ProtraitStatus`,
    `review_status`, `reviewStatus`, `ReviewStatus`, `state`, `State`,
    `__wanjuanTianjiListStatus`,
  ]);

export const wanjuanTianjiPortraitGroupTypeFromItem = (item, fallback = ``) =>
  wanjuanTianjiFindNestedValue(item, [
    `groupType`, `group_type`, `asset_type`, `assetType`,
    `portrait_type`, `portraitType`, `PortraitType`,
    `protrait_type`, `protraitType`, `ProtraitType`, `type`, `Type`,
    `__wanjuanTianjiGroupType`,
  ]) || String(fallback || ``).trim();

export const wanjuanTianjiPortraitGroupIdFromItem = (item, fallback = ``) =>
  wanjuanTianjiFindNestedValue(item, [
    `group_id`, `groupId`, `GroupId`,
    `virtual_group_id`, `virtualGroupId`, `VirtualGroupId`,
    `portrait_group_id`, `portraitGroupId`, `PortraitGroupId`,
    `__wanjuanTianjiGroupId`,
  ]) || String(fallback || ``).trim();

export const wanjuanTianjiPortraitAvailabilityFromItem = (item) => {
  if (item?.localUploaded === !0) return `pending`;
  let status = wanjuanTianjiPortraitStatusFromItem(item)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ``);
  if ([`active`, `success`, `succeeded`, `completed`, `complete`, `done`, `approved`, `passed`, `可用`, `审核通过`, `已完成`].includes(status)) return `ready`;
  if ([`failed`, `fail`, `error`, `rejected`, `invalid`, `审核失败`, `失败`, `已拒绝`].includes(status)) return `failed`;
  if ([`processing`, `pending`, `reviewing`, `submitted`, `created`, `queued`, `waiting`, `inprogress`, `auditing`, `审核中`, `处理中`, `待审核`].includes(status)) return `pending`;
  return `unknown`;
};

export const wanjuanTianjiPortraitIsReady = (item) =>
  Boolean(wanjuanTianjiPortraitAssetIdFromItem(item)) && wanjuanTianjiPortraitAvailabilityFromItem(item) === `ready`;

export const wanjuanTianjiPortraitDeleteDescriptor = (item, groupType = ``) => {
  const id = wanjuanTianjiPortraitAssetIdFromItem(item);
  return {
    id,
    groupType: wanjuanTianjiPortraitGroupTypeFromItem(item, groupType),
    groupId: wanjuanTianjiPortraitGroupIdFromItem(item),
    canDelete: Boolean(id),
  };
};

export const wanjuanTianjiPortraitImageUrlFromItem = (item) =>
  wanjuanTianjiFindNestedValue(item, WANJUAN_TIANJI_PORTRAIT_PREVIEW_KEYS, (value) => /^https?:\/\//i.test(String(value || ``).trim()));

/** Display-only preview. The local fallback is deliberately separate from generation-facing image fields. */
export const wanjuanTianjiPortraitDisplayPreviewUrlFromItem = (item) =>
  wanjuanTianjiPortraitImageUrlFromItem(item) ||
  (/^file:\/\//i.test(String(item?.__wanjuanTianjiLocalPreviewUrl || ``).trim()) ? String(item.__wanjuanTianjiLocalPreviewUrl).trim() : ``);

export const wanjuanTianjiStripLocalPreviewDecoration = (assetsPayload: any) => {
  const clean = (items: any) => (Array.isArray(items) ? items : []).map((item) => {
    if (!item || typeof item !== `object`) return item;
    const { __wanjuanTianjiLocalPreviewUrl, __wanjuanTianjiLocalPreviewPath, ...rest } = item;
    return rest;
  });
  return Array.isArray(assetsPayload) ? clean(assetsPayload) : {
    ...(assetsPayload && typeof assetsPayload === `object` ? assetsPayload : {}),
    AIGC: clean(assetsPayload?.AIGC),
    LivenessFace: clean(assetsPayload?.LivenessFace),
  };
};

export const wanjuanTianjiPortraitNameFromItem = (item) =>
  wanjuanTianjiFindNestedValue(item, [`name`, `Name`, `label`, `pageTitle`, `title`, `Title`]);

export const wanjuanTianjiDecorateLocalPreviews = (registry: any, scope: string, groups: any, assetsPayload: any) => {
  const source = assetsPayload && typeof assetsPayload === `object` ? assetsPayload : {},
	    decorate = (items: any, groupType: string) => (Array.isArray(items) ? items : []).map((item) => {
	      const { __wanjuanTianjiLocalPreviewUrl, __wanjuanTianjiLocalPreviewPath, ...cleanItem } = item && typeof item === `object` ? item : {},
	        effectiveGroupType = groupType || wanjuanTianjiPortraitGroupTypeFromItem(cleanItem),
	        assetId = wanjuanTianjiPortraitAssetIdFromItem(cleanItem),
	        groupId = wanjuanTianjiPortraitGroupIdFromItem(cleanItem, groups?.[effectiveGroupType]),
	        preview = assetId && groupId && effectiveGroupType ? wanjuanFindTianjiLocalPreview(registry, { scope, groupType: effectiveGroupType, groupId, assetId }) : null;
      return preview ? {
        ...cleanItem,
        __wanjuanTianjiLocalPreviewUrl: preview.previewUrl,
        __wanjuanTianjiLocalPreviewPath: preview.localPath,
      } : cleanItem;
    });
  return Array.isArray(source) ? decorate(source, ``) : {
    ...source,
    AIGC: decorate(source.AIGC, `AIGC`),
    LivenessFace: decorate(source.LivenessFace, `LivenessFace`),
  };
};

export const wanjuanTianjiApplyLocalPreviews = async (config: any, groups: any, assetsPayload: any) => {
  const scope = await wanjuanTianjiLocalPreviewScope(config),
    registry = await wanjuanLoadTianjiLocalPreviewRegistry();
  return wanjuanTianjiDecorateLocalPreviews(registry, scope, groups, assetsPayload);
};

/** Bind pending upload previews only when one Active asset is an unambiguous match. */
export const wanjuanTianjiResolvePendingLocalPreviewAssetId = (pending: any, assetsPayload: any, groupType: string, groupId: string) => {
  const candidates = wanjuanTianjiFlattenPortraitAssets(assetsPayload).filter((item) => {
    if (!wanjuanTianjiPortraitIsReady(item)) return false;
    if (wanjuanTianjiPortraitGroupTypeFromItem(item, groupType) !== groupType) return false;
    const itemGroupId = wanjuanTianjiPortraitGroupIdFromItem(item, groupId);
    return itemGroupId === groupId;
  });
  const uniqueId = (items: any[]) => {
    const ids = [...new Set(items.map(wanjuanTianjiPortraitAssetIdFromItem).filter(Boolean))];
    return ids.length === 1 ? ids[0] : ``;
  };
  const candidateIdMatch = pending?.candidateAssetId ? uniqueId(candidates.filter((item) => wanjuanTianjiPortraitAssetIdFromItem(item) === pending.candidateAssetId)) : ``;
  if (candidateIdMatch) return candidateIdMatch;
  const urlMatch = pending?.lookupUrl ? uniqueId(candidates.filter((item) => wanjuanTianjiPortraitImageUrlFromItem(item) === pending.lookupUrl)) : ``;
  if (urlMatch) return urlMatch;
  return pending?.lookupName ? uniqueId(candidates.filter((item) => wanjuanTianjiPortraitNameFromItem(item) === pending.lookupName)) : ``;
};

export const wanjuanTianjiBindPendingLocalPreviews = async (config: any, groups: any, assetsPayload: any) => {
  const scope = await wanjuanTianjiLocalPreviewScope(config),
    registry = await wanjuanLoadTianjiLocalPreviewRegistry(),
    assets = wanjuanTianjiFlattenPortraitAssets(assetsPayload);
  let bound = 0;
  for (const [pendingKey, pending] of Object.entries(registry.pending) as any) {
    if (pending.scope !== scope) continue;
    const groupType = String(pending.groupType || ``).trim(),
      groupId = String(pending.groupId || ``).trim();
    if (!groupType || !groupId || String(groups?.[groupType] || ``).trim() !== groupId) continue;
    const resolvedAssetId = wanjuanTianjiResolvePendingLocalPreviewAssetId(pending, assets, groupType, groupId);
    if (!resolvedAssetId) continue;
    await wanjuanCommitPendingTianjiLocalPreview(pendingKey, resolvedAssetId);
    bound += 1;
  }
  return bound;
};

export const wanjuanTianjiFlattenPortraitAssets = (input) => {
  let source = input?.assets || input?.tianjiSeedanceAssets || input,
    list = [];
  if (Array.isArray(source)) list = source;
  else if (source && typeof source == `object`)
    Object.values(source).forEach((value) => {
      Array.isArray(value) && list.push(...value);
    });
  return list.filter((item) => {
    let itemId = wanjuanTianjiPortraitAssetIdFromItem(item);
    return item && itemId && !/^local-/i.test(itemId) && item?.localUploaded !== !0;
  });
};

export const wanjuanTianjiResolvePortraitAssetForNodeData = (nodeData: any = {}, assetsPayload) => {
  let uploadedUrl = String(
      nodeData.tianjiPortraitBindingLookupUrl ||
        nodeData.tianjiPortraitPreviewUrl ||
        nodeData.tianjiPortraitUploadedUrl ||
        ``,
    ).trim(),
    label = String(nodeData.tianjiPortraitBindingName || nodeData.label || nodeData.name || ``).trim(),
    assets = wanjuanTianjiFlattenPortraitAssets(assetsPayload),
    matchedAsset =
      assets.find((item) => {
        let itemUrl = wanjuanTianjiPortraitImageUrlFromItem(item);
        return uploadedUrl && itemUrl && itemUrl === uploadedUrl;
      }) ||
      assets.find((item) => {
        let itemName = wanjuanTianjiPortraitNameFromItem(item);
        return label && itemName && itemName === label;
      }) ||
      null,
    finalId = wanjuanTianjiPortraitAssetIdFromItem(matchedAsset);
  return finalId && wanjuanTianjiPortraitIsReady(matchedAsset) ?
    {
      assetId: finalId,
      asset: matchedAsset,
      imageUrl: wanjuanTianjiPortraitImageUrlFromItem(matchedAsset) || uploadedUrl,
      groupType: wanjuanTianjiPortraitGroupTypeFromItem(matchedAsset, `AIGC`),
      availability: `ready`,
    } :
    null;
};

export const wanjuanTianjiMergeSubmittedPortraitAsset = async (asset) => {
  let stored = await wanjuanTianjiStorageGet([`tianjiSeedanceAssets`]),
    assets = stored.tianjiSeedanceAssets && typeof stored.tianjiSeedanceAssets == `object` ?
    stored.tianjiSeedanceAssets :
    {},
    currentAigc = Array.isArray(assets.AIGC) ? assets.AIGC : [],
    assetId = String(asset.portrait_asset_id || asset.asset_id || asset.assetId || asset.id || ``).trim(),
    imageUrl = String(asset.image_url || asset.imageUrl || asset.url || ``).trim(),
    nextAigc = currentAigc.filter((item) => {
      let itemAssetId = String(item?.portrait_asset_id || item?.asset_id || item?.assetId || item?.id || ``).trim(),
        itemImageUrl = String(item?.image_url || item?.imageUrl || item?.url || ``).trim();
      return !(
        (assetId && itemAssetId && assetId === itemAssetId) ||
        (imageUrl && itemImageUrl && imageUrl === itemImageUrl)
      );
    });
  await wanjuanTianjiStorageSet({
    tianjiSeedanceAssets: {
      ...assets,
      AIGC: [asset, ...nextAigc],
      LivenessFace: Array.isArray(assets.LivenessFace) ? assets.LivenessFace : [],
    },
    tianjiSeedanceSettingsMode: `tianji`,
  });
};

export const WANJUAN_TIANJI_ASSET_PAGE_SIZE = 10;

export const wanjuanTianjiMergePagedAssets = (existing = [], incoming = [], pageNumber = 1, pageSize = WANJUAN_TIANJI_ASSET_PAGE_SIZE) => {
  let next = Array.isArray(existing) ? existing.slice() : [];
  (Array.isArray(incoming) ? incoming : [])
    .filter((item) => item?.localUploaded !== !0)
    .forEach((item, index) => {
      next[(Math.max(1, pageNumber) - 1) * pageSize + index] = item;
    });
  return next.filter(Boolean);
};

export const wanjuanTianjiRefreshPortraitAssets = async (config, {
  preferredType: preferredType = `AIGC`,
  retries: retries = 5,
  delayMs: delayMs = 2e3,
  pageNumber: pageNumber = 1,
  pageSize: pageSize = WANJUAN_TIANJI_ASSET_PAGE_SIZE,
} = {}) => {
  let stored = await wanjuanTianjiStorageGet([`tianjiSeedanceAssets`, `tianjiSeedanceGroups`]),
    currentAssets = stored.tianjiSeedanceAssets && typeof stored.tianjiSeedanceAssets == `object` ? stored.tianjiSeedanceAssets : {},
    groups = stored.tianjiSeedanceGroups && typeof stored.tianjiSeedanceGroups == `object` ? stored.tianjiSeedanceGroups : {},
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	let normalizedPageNumber = Math.max(1, Number(pageNumber) || 1),
	    normalizedPageSize = Math.max(1, Number(pageSize) || WANJUAN_TIANJI_ASSET_PAGE_SIZE),
	    load = async (groupType, groupId, nextPageNumber = normalizedPageNumber) => {
	      if (!groupId) return { items: [], pagination: { total: 0, page: nextPageNumber, pageSize: normalizedPageSize } };
      let result = await wanjuanTianjiRequest(config, `/api/cut/model/get-list-assets`, {
        params: wanjuanTianjiAssetListParams(groupType, groupId, nextPageNumber, normalizedPageSize),
        enterpriseRequestKind: `request`,
	      });
	      return {
	        items: wanjuanTianjiFindArray(result).map((item) => item && typeof item == `object` ? {
	          ...item,
	          __wanjuanTianjiListStatus: `Active`,
	          __wanjuanTianjiGroupType: groupType,
	          __wanjuanTianjiGroupId: groupId,
	        } : item),
	        pagination: wanjuanTianjiAssetPagination(result, nextPageNumber, normalizedPageSize),
	      };
	    },
	    aigcItems = Array.isArray(currentAssets.AIGC) ? currentAssets.AIGC : [],
	    liveItems = Array.isArray(currentAssets.LivenessFace) ? currentAssets.LivenessFace : [],
	    aigcPagination = { total: 0, page: normalizedPageNumber, pageSize: normalizedPageSize },
	    livePagination = { total: 0, page: normalizedPageNumber, pageSize: normalizedPageSize };
	  for (let attempt = 0; attempt <= retries; attempt++) {
	    try {
	      if (groups.AIGC) {
	        let loaded = await load(`AIGC`, groups.AIGC, normalizedPageNumber);
	        aigcItems = loaded.items;
	        aigcPagination = loaded.pagination;
	      }
	      if (aigcItems.length > 0 || attempt >= retries) break;
    } catch (error) {
      if (attempt >= retries) throw error;
      console.warn(`Tianji AIGC portrait refresh retry`, error);
    }
    await sleep(delayMs);
	  }
	  aigcItems.length === 0 &&
	    normalizedPageNumber === 1 &&
	    Array.isArray(currentAssets.AIGC) &&
	    currentAssets.AIGC.length > 0 &&
	    (aigcItems = currentAssets.AIGC);
	  if (preferredType === `LivenessFace` && groups.LivenessFace)
	    try {
	      let loaded = await load(`LivenessFace`, groups.LivenessFace, normalizedPageNumber);
	      liveItems = loaded.items;
	      livePagination = loaded.pagination;
	    } catch (error) {
      console.warn(`Tianji live portrait refresh skipped`, error);
    }
  let nextAssets = {
    ...currentAssets,
    AIGC: wanjuanTianjiMergePagedAssets(currentAssets.AIGC, aigcItems, normalizedPageNumber, normalizedPageSize),
    LivenessFace: preferredType === `LivenessFace` ?
      wanjuanTianjiMergePagedAssets(currentAssets.LivenessFace, liveItems, normalizedPageNumber, normalizedPageSize) :
      liveItems,
  };
  await wanjuanTianjiStorageSet({
    tianjiSeedanceAssets: nextAssets,
    tianjiSeedanceGroups: groups,
  });
  await wanjuanTianjiBindPendingLocalPreviews(config, groups, nextAssets);
  const displayAssets = await wanjuanTianjiApplyLocalPreviews(config, groups, nextAssets);
  return {
    assets: displayAssets,
	    groups: groups,
	    aigcCount: aigcItems.length,
	    liveCount: liveItems.length,
	    aigcTotal: aigcPagination.total || (normalizedPageNumber === 1 ? aigcItems.length : 0),
	    liveTotal: livePagination.total || (normalizedPageNumber === 1 ? liveItems.length : 0),
	    pageNumber: normalizedPageNumber,
    pageSize: normalizedPageSize,
  };
};

export const wanjuanUploadTianjiVirtualPortrait = async (imageUrl: any, options: any = {}) => {
  let sourceUrl = String(imageUrl || ``).trim();
  if (!sourceUrl) throw Error(`图片节点没有可上传的人像图片`);
  if (/^(data:video\/|data:audio\/)/i.test(sourceUrl) || /\.(mp4|webm|ogg|mov|mp3|wav|m4a|aac|flac)(?:$|[?#])/i.test(sourceUrl))
    throw Error(`天玑人像审核只支持图片素材`);
  if (!window.wanjuanDesktop?.uploadPublicMedia)
    throw Error(`当前桌面端缺少公网图片上传能力，请重启应用后再试`);
  let config = await wanjuanGetSyncedTianjiSeedanceConfig(),
    label = String(options.name || options.label || `虚拟人像素材`).trim() || `虚拟人像素材`,
    groups = await wanjuanTianjiEnsurePortraitGroups(config, `AIGC`),
    scope = await wanjuanTianjiLocalPreviewScope(config),
    localPreview = null;
  try {
    localPreview = await wanjuanPersistTianjiLocalPreview(sourceUrl, { scope, filename: `${label}.jpg` });
  } catch (error) {
    console.warn(`Tianji local portrait preview persist skipped`, error);
  }
  let uploaded = await window.wanjuanDesktop.uploadPublicMedia({
      url: sourceUrl,
      kind: `image`,
      filename: `tianji-portrait-${Date.now()}`,
    });
  if (!uploaded?.ok || !uploaded.url) throw Error(uploaded?.error || `图片公网链接上传失败`);
  let result = await wanjuanTianjiRequest(config, `/api/cut/model/upload-VirtralPortrait`, {
      params: {
        image_url: uploaded.url,
        name: label,
        virtual_group_id: groups.AIGC,
        type: `Image`,
      },
      enterpriseRequestKind: `request`,
    }),
    asset = wanjuanTianjiCreateLocalUploadAsset({
      name: label,
      imageUrl: uploaded.url,
      result: result,
      groupType: `AIGC`,
    });
  await wanjuanTianjiMergeSubmittedPortraitAsset(asset);
  let refresh = null;
  try {
    refresh = await wanjuanTianjiRefreshPortraitAssets(config, {
      preferredType: `AIGC`
    });
  } catch (error) {
    console.warn(`Tianji portrait auto refresh failed`, error);
  }
  if (localPreview) {
    const finalPortrait = wanjuanTianjiFinalPortraitAsset({ imageUrl: uploaded.url, asset, refresh });
    if (finalPortrait.matched && finalPortrait.assetId)
      await wanjuanSetTianjiLocalPreview({ scope, groupType: `AIGC`, groupId: groups.AIGC, assetId: finalPortrait.assetId }, localPreview);
    else
      await wanjuanQueueTianjiLocalPreview({ scope, groupType: `AIGC`, groupId: groups.AIGC }, {
        ...localPreview,
        candidateAssetId: wanjuanTianjiPortraitAssetIdFromItem(result),
        lookupName: label,
      });
  }
  return {
    result: result,
    asset: asset,
    imageUrl: uploaded.url,
    localPreview,
    refresh: refresh,
    groups: groups,
  };
};
