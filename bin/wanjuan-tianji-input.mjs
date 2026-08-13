const PORTRAIT_ASSET_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,511}$/;

export function normalizePortraitAssetId(value) {
  const id = String(value ?? "").trim();
  if (!id) throw new Error("天玑已审核人像素材 ID 不能为空");
  if (!PORTRAIT_ASSET_ID_PATTERN.test(id)) {
    throw new Error("天玑已审核人像素材 ID 格式无效");
  }
  return id;
}

export function normalizeTianjiAutomationPayload(value = {}) {
  const payload = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const mode = String(payload.mode || "text-to-video");
  const images = Array.isArray(payload.images) ? payload.images.map((item) => String(item)) : [];
  const portraitAssetIds = Array.isArray(payload.portraitAssetIds)
    ? payload.portraitAssetIds.map(normalizePortraitAssetId)
    : [];
  if (images.some((item) => /^asset:\/\//i.test(item.trim()))) {
    throw new Error("普通图片参数不能使用 asset://；已审核天玑人像请使用 --portrait-asset-id");
  }
  if (portraitAssetIds.length && mode !== "reference-media") {
    throw new Error("已审核天玑人像仅支持 reference-media 模式");
  }
  if (images.length + portraitAssetIds.length > 9) {
    throw new Error("images 与 portraitAssetIds 合计最多 9 个");
  }
  return { ...payload, mode, images, portraitAssetIds };
}
