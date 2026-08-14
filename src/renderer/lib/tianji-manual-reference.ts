import {
  wanjuanHasTianjiPortraitClaim,
  wanjuanIsReadyTianjiPortraitBinding,
} from "./tianji-portrait";

const trustedPortraitSource = (data: any): boolean =>
  Boolean(
    data?.sourceOrigin === `tianji-portrait` ||
      data?.source === `tianji-portrait` ||
      data?.type === `image/tianji-portrait`,
  );

const portraitBindingError = (data: any): string => {
  const status = String(data?.tianjiPortraitBindingStatus || ``).trim().toLowerCase();
  if (!trustedPortraitSource(data)) return `这张图片没有可验证的天玑 Active 素材来源，请从天玑人像库重新选择`;
  if (status === `reviewing`) return `天玑人像正在审核中，请等待审核完成后再生成`;
  if (status === `failed`) return `天玑人像绑定失败，请手动从天玑人像库选择后再生成`;
  if (status === `pending`) return `天玑人像还没有绑定素材库最终 ID，请稍后刷新天玑人像库后再生成`;
  if (status !== `ready`) return `天玑人像缺少 Active 状态证明，请刷新人像库后重新选择`;
  return `天玑人像缺少最终素材 ID，请刷新人像库后重新选择`;
};

export interface TianjiManualPortraitInputs {
  portraitAssetIds: string[];
  portraitPreviewUrls: Set<string>;
  claimedSourceNodeIds: Set<string>;
  claimedContextIndexes: Set<number>;
  reviewedPortraitClaimCount: number;
}

export const wanjuanExcludeTianjiPortraitPreviews = (
  imageReferences: any[] = [],
  portraitPreviewUrls: Set<string> = new Set(),
  claimedSourceNodeIds: Set<string> = new Set(),
): any[] =>
  imageReferences.filter((reference) => {
    const sourceNodeId = String(reference && typeof reference === `object` ? reference.sourceNodeId || reference.nodeId || `` : ``).trim();
    if (sourceNodeId && claimedSourceNodeIds.has(sourceNodeId)) return false;
    const url = String(typeof reference === `string` ? reference : reference?.url || ``).trim();
    return !portraitPreviewUrls.has(url);
  });

const portraitPreviewUrlsFromData = (data: any): string[] =>
  [
    data?.imageUrl,
    data?.url,
    data?.thumbnailUrl,
    data?.previewUrl,
    data?.tianjiPortraitPreviewUrl,
    data?.tianjiPortraitBindingSourceUrl,
    data?.tianjiPortraitBindingLookupUrl,
  ]
    .map((value) => String(value || ``).trim())
    .filter((value) => /^https?:\/\//i.test(value));

/** Keep reviewed portraits out of the ordinary image URL channel. */
export const wanjuanCollectTianjiManualPortraitInputs = ({
  nodes,
  incomingEdges,
  contextResources,
}: {
  nodes?: any[];
  incomingEdges?: any[];
  contextResources?: any[];
}): TianjiManualPortraitInputs => {
  const nodeList = Array.isArray(nodes) ? nodes : [];
  const edges = Array.isArray(incomingEdges) ? incomingEdges : [];
  const contexts = Array.isArray(contextResources) ? contextResources : [];
  const portraitAssetIds: string[] = [];
  const portraitPreviewUrls = new Set<string>();
  const assetIds = new Set<string>();
  const claimedSourceNodeIds = new Set<string>();
  const claimedContextIndexes = new Set<number>();

  const collect = (data: any, identifyClaim: () => void) => {
    if (!wanjuanHasTianjiPortraitClaim(data)) return;
    identifyClaim();
    if (!wanjuanIsReadyTianjiPortraitBinding(data))
      throw Error(data?.tianjiPortraitBindingMessage || portraitBindingError(data));
    const assetId = String(data?.tianjiPortraitAssetId || ``).trim();
    if (!assetId) throw Error(`天玑人像缺少最终素材 ID，请刷新人像库后重新选择`);
    portraitPreviewUrlsFromData(data).forEach((url) => portraitPreviewUrls.add(url));
    if (!assetIds.has(assetId)) {
      assetIds.add(assetId);
      portraitAssetIds.push(assetId);
    }
  };

  edges.forEach((edge) => {
    const sourceNode = nodeList.find((node) => node?.id === edge?.source);
    if (!sourceNode) return;
    collect(sourceNode.data, () => claimedSourceNodeIds.add(String(sourceNode.id)));
  });
  contexts.forEach((resource, index) => {
    const sourceId = String(resource?.sourceId || resource?.nodeId || resource?.id || ``).trim();
    if (sourceId && claimedSourceNodeIds.has(sourceId)) {
      claimedContextIndexes.add(index);
      return;
    }
    collect(resource, () => claimedContextIndexes.add(index));
  });

  return {
    portraitAssetIds,
    portraitPreviewUrls,
    claimedSourceNodeIds,
    claimedContextIndexes,
    reviewedPortraitClaimCount: portraitAssetIds.length,
  };
};
