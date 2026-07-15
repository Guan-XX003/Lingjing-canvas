export const WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG = Object.freeze({
  enabled: false,
  reviewMode: `manual`,
  region: `cn-beijing`,
  projectName: `default`,
  assetGroupId: ``,
  assetGroupName: `万卷灵境可信素材`,
});

export function wanjuanNormalizeArkTrustedAssetConfig(value: any = {}) {
  const source = value && typeof value === `object` ? value : {};
  return {
    ...WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG,
    ...source,
    enabled: source.enabled === true,
    reviewMode: source.reviewMode === `auto` ? `auto` : `manual`,
    region: String(source.region || WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG.region).trim() || WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG.region,
    projectName: String(source.projectName || WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG.projectName).trim() || WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG.projectName,
    assetGroupId: String(source.assetGroupId || ``).trim(),
    assetGroupName: String(source.assetGroupName || WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG.assetGroupName).trim() || WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG.assetGroupName,
  };
}

export function wanjuanArkAssetBindingMatchesImage(nodeData: any = {}, imageUrl: any = ``) {
  const assetId = String(nodeData.arkTrustedAssetId || ``).replace(/^asset:\/\//i, ``).trim();
  const sourceUrl = String(nodeData.arkTrustedAssetSourceUrl || ``).trim();
  const currentUrl = String(imageUrl || nodeData.imageUrl || ``).trim();
  return Boolean(assetId && sourceUrl && currentUrl && sourceUrl === currentUrl && nodeData.arkTrustedAssetStatus === `ready`);
}

export function wanjuanArkTrustedAssetUrl(assetId: any) {
  const cleanId = String(assetId || ``).replace(/^asset:\/\//i, ``).trim();
  return cleanId ? `asset://${cleanId}` : ``;
}

export function wanjuanResetArkTrustedAssetBindingForImage(data: any, nextImageUrl: any) {
  const currentImageUrl = String(data?.imageUrl || ``).trim();
  const normalizedNextImageUrl = String(nextImageUrl || ``).trim();
  if (!normalizedNextImageUrl || normalizedNextImageUrl === currentImageUrl) return { ...(data || {}) };
  const hasArkBinding = [
    `arkTrustedAssetId`,
    `arkTrustedAssetGroupId`,
    `arkTrustedAssetContentHash`,
    `arkTrustedAssetSourceUrl`,
    `arkTrustedAssetStatus`,
    `arkTrustedAssetMessage`,
    `arkTrustedAssetReviewedAt`,
  ].some((key) => Object.prototype.hasOwnProperty.call(data || {}, key));
  if (!hasArkBinding) return { ...(data || {}) };
  return {
    ...(data || {}),
    arkTrustedAssetId: undefined,
    arkTrustedAssetGroupId: undefined,
    arkTrustedAssetContentHash: undefined,
    arkTrustedAssetSourceUrl: undefined,
    arkTrustedAssetStatus: undefined,
    arkTrustedAssetMessage: undefined,
    arkTrustedAssetReviewedAt: undefined,
  };
}

export function wanjuanArkTrustedAssetReadyPatch(result: any, sourceUrl: any) {
  const assetId = String(result?.assetId || result?.id || ``).replace(/^asset:\/\//i, ``).trim();
  const normalizedSourceUrl = String(sourceUrl || ``).trim();
  if (!assetId || !normalizedSourceUrl) return null;
  return {
    arkTrustedAssetId: assetId,
    arkTrustedAssetGroupId: String(result?.groupId || ``).trim() || undefined,
    arkTrustedAssetContentHash: String(result?.contentHash || ``).trim() || undefined,
    arkTrustedAssetSourceUrl: normalizedSourceUrl,
    arkTrustedAssetStatus: `ready`,
    arkTrustedAssetMessage: result?.cached ? `已复用 Ark 可信素材` : `已通过 Ark 可信素材审核`,
    arkTrustedAssetReviewedAt: Date.now(),
  };
}

export async function wanjuanResolveArkTrustedAssetReference({
  config,
  entry,
  reviewAsset,
}: any) {
  const normalizedConfig = wanjuanNormalizeArkTrustedAssetConfig(config);
  const source = entry && typeof entry === `object` ? entry : { url: entry };
  const imageUrl = String(source.url || source.imageUrl || source.localPath || source.path || ``).trim();
  if (!normalizedConfig.enabled) return { url: imageUrl, reviewed: false };
  if (wanjuanArkAssetBindingMatchesImage(source, imageUrl)) {
    return {
      url: wanjuanArkTrustedAssetUrl(source.arkTrustedAssetId),
      assetId: String(source.arkTrustedAssetId || ``).replace(/^asset:\/\//i, ``).trim(),
      groupId: String(source.arkTrustedAssetGroupId || ``).trim(),
      reviewed: false,
      cached: true,
    };
  }
  if (normalizedConfig.reviewMode !== `auto`) return { url: imageUrl, reviewed: false };
  if (!imageUrl) return { url: ``, reviewed: false };
  if (typeof reviewAsset !== `function`) throw new Error(`当前环境无法提交 Ark 可信素材审核`);
  const result = await reviewAsset(imageUrl, source);
  const assetId = String(result?.assetId || result?.id || ``).replace(/^asset:\/\//i, ``).trim();
  if (!result?.ok || !assetId) throw new Error(result?.error || `Ark 可信素材审核未返回 Asset ID`);
  return {
    ...result,
    assetId,
    url: wanjuanArkTrustedAssetUrl(assetId),
    reviewed: true,
  };
}
