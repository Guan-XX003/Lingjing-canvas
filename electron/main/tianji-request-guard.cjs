const fs = require("node:fs");

const GENERATION_PATH = /^\/api\/cut\/model\/coze-seedance-(?:text|video|image-first|image-first-last)-special$/i;

function schemeCounts(values) {
  return values.reduce((counts, value) => {
    const scheme = /^asset:\/\//i.test(String(value || ""))
      ? "asset"
      : /^https?:\/\//i.test(String(value || ""))
        ? "http"
        : "other";
    counts.count += 1;
    counts[scheme] += 1;
    return counts;
  }, { count: 0, asset: 0, http: 0, other: 0 });
}

function inspectTianjiGenerationRequest(payload = {}, body = Buffer.alloc(0)) {
  let pathname = "";
  try { pathname = new URL(String(payload.url || "")).pathname; } catch { return null; }
  if (!GENERATION_PATH.test(pathname)) return null;
  const contentType = String(payload?.headers?.["Content-Type"] || payload?.headers?.["content-type"] || "");
  const params = new URLSearchParams(Buffer.isBuffer(body) ? body.toString("utf8") : String(body || ""));
  const media = Object.fromEntries(["images", "videos", "audios"].map((kind) => {
    const values = [...params.getAll(`${kind}[]`), ...params.getAll(kind)];
    return [kind, schemeCounts(values)];
  }));
  const reviewedPortraitCount = Math.max(0, Math.floor(Number(payload?.tianjiGenerationProfile?.reviewedPortraitCount || 0)));
  const ordinaryImageCount = Math.max(0, Math.floor(Number(payload?.tianjiGenerationProfile?.ordinaryImageCount || 0)));
  const reviewedPortraitResidualCount = Math.max(0, Math.floor(Number(payload?.tianjiGenerationProfile?.reviewedPortraitResidualCount || 0)));
  const portraitConflictCount = Math.max(0, Math.floor(Number(payload?.tianjiGenerationProfile?.portraitConflictCount || 0)));
  const reviewedPortraitPreviewUrls = new Set(
    (Array.isArray(payload?.tianjiGenerationProfile?.reviewedPortraitPreviewUrls)
      ? payload.tianjiGenerationProfile.reviewedPortraitPreviewUrls
      : [])
      .map((value) => String(value || "").trim())
      .filter((value) => /^https?:\/\//i.test(value)),
  );
  const reviewedPortraitPreviewMatches = [...params.getAll("images[]"), ...params.getAll("images")]
    .filter((value) => reviewedPortraitPreviewUrls.has(String(value || "").trim())).length;
  return { endpoint: pathname, encoding: contentType, reviewedPortraitCount, ordinaryImageCount, reviewedPortraitResidualCount, portraitConflictCount, reviewedPortraitPreviewMatches, media };
}

function validateTianjiGenerationRequest(profile) {
  if (profile?.portraitConflictCount > 0)
    throw Error("天玑人像绑定状态存在冲突，已阻止提交");
  if (!profile || profile.reviewedPortraitCount <= 0) return;
  if (!/application\/x-www-form-urlencoded/i.test(profile.encoding))
    throw Error("天玑已审核人像请求必须使用表单编码");
  if (profile.media.images.asset !== profile.reviewedPortraitCount)
    throw Error("天玑已审核人像引用在发送前丢失，已阻止使用预览图片替代");
  if (profile.media.images.http !== profile.ordinaryImageCount || profile.media.images.other !== 0)
    throw Error("天玑已审核人像的预览图片混入了普通图片通道，已阻止提交");
  if (profile.reviewedPortraitPreviewMatches > 0)
    throw Error("天玑已审核人像的预览图片混入了生成请求，已阻止提交");
}

function captureTianjiGenerationPreflight(profile) {
  const outputPath = String(process.env.WANJUAN_TIANJI_PREFLIGHT_FILE || "").trim();
  if (!profile || !outputPath || process.env.WANJUAN_TIANJI_PREFLIGHT !== "1") return null;
  fs.writeFileSync(outputPath, JSON.stringify(profile), { mode: 0o600 });
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: [["content-type", "application/json"]],
    bodyBase64: Buffer.from(JSON.stringify({ code: 599, msg: "CODEX_PREFLIGHT_BLOCKED" })).toString("base64"),
  };
}

module.exports = { inspectTianjiGenerationRequest, validateTianjiGenerationRequest, captureTianjiGenerationPreflight };
