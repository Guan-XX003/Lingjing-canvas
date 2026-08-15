// 火山方舟可信素材：图片预处理、TOS 公读上传、Ark V4 签名、审核轮询与本地去重缓存。

const fs = require("node:fs");
const path = require("node:path");

const { app, nativeImage } = require("../electron-refs.cjs");
const { appendDesktopLog, formatErrorMessage } = require("../logging.cjs");
const { bufferFromMediaPayload } = require("../media/payload.cjs");
const { hmac, sha256Buffer, sha256Hex } = require("../utils/crypto.cjs");
const { uploadToTos } = require("./cloud-storage.cjs");

const ARK_ASSETS_HOST = "open.volcengineapi.com";
const ARK_ASSETS_VERSION = "2024-01-01";
const ARK_ASSET_CACHE_VERSION = 1;
const DEFAULT_CACHE_LIMIT = 500;
const DEFAULT_MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function arkIsoDate(now = new Date()) {
  return new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function encodeArkQuery(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildArkSignedRequest({
  action,
  payload = {},
  accessKeyId,
  secretAccessKey,
  region = "cn-beijing",
  now = new Date(),
}) {
  const ak = String(accessKeyId || "").trim();
  const sk = String(secretAccessKey || "").trim();
  const cleanRegion = String(region || "cn-beijing").trim() || "cn-beijing";
  if (!ak || !sk) throw new Error("Ark 可信素材配置缺少 AccessKey 或 SecretKey");
  const body = JSON.stringify(payload || {});
  const query = { Action: String(action || "").trim(), Version: ARK_ASSETS_VERSION };
  if (!query.Action) throw new Error("Ark 可信素材请求缺少 Action");
  const date = arkIsoDate(now);
  const shortDate = date.slice(0, 8);
  const payloadHash = sha256Hex(Buffer.from(body, "utf8"));
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((key) => `${encodeArkQuery(key)}=${encodeArkQuery(query[key])}`)
    .join("&");
  const headerEntries = [
    ["accept", "application/json"],
    ["content-type", "application/json"],
    ["host", ARK_ASSETS_HOST],
    ["x-content-sha256", payloadHash],
    ["x-date", date],
  ];
  const canonicalHeaders = headerEntries.map(([key, value]) => `${key}:${value}\n`).join("");
  const signedHeaders = headerEntries.map(([key]) => key).join(";");
  const canonicalRequest = ["POST", "/", canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const algorithm = "HMAC-SHA256";
  const credentialScope = `${shortDate}/${cleanRegion}/ark/request`;
  const stringToSign = [algorithm, date, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const kDate = hmac(sk, shortDate);
  const kRegion = hmac(kDate, cleanRegion);
  const kService = hmac(kRegion, "ark");
  const kSigning = hmac(kService, "request");
  const signature = hmac(kSigning, stringToSign, "hex");
  const authorization = `${algorithm} Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return {
    url: `https://${ARK_ASSETS_HOST}/?${canonicalQuery}`,
    method: "POST",
    body,
    headers: {
      Accept: "application/json",
      Authorization: authorization,
      "Content-Type": "application/json",
      Host: ARK_ASSETS_HOST,
      "X-Content-Sha256": payloadHash,
      "X-Date": date,
    },
    canonicalRequest,
    stringToSign,
    signature,
  };
}

function normalizeArkTrustedAssetConfig(payload = {}) {
  const tos = payload.tos || {};
  const ark = payload.ark || {};
  const accessKeyId = String(tos.accessKeyId || tos.accessKey || ark.accessKeyId || "").trim();
  const secretAccessKey = String(tos.secretAccessKey || tos.secretKey || ark.secretAccessKey || "").trim();
  const projectName = String(ark.projectName || "default").trim() || "default";
  const groupId = String(ark.assetGroupId || ark.groupId || "").trim();
  const groupName = String(ark.assetGroupName || "StarCanvas可信素材").trim() || "StarCanvas可信素材";
  const region = String(ark.region || "cn-beijing").trim() || "cn-beijing";
  if (!accessKeyId || !secretAccessKey) throw new Error("请先在上传与直链中填写火山 TOS AccessKey 和 SecretKey");
  if (!String(tos.bucket || "").trim()) throw new Error("请先在上传与直链中填写火山 TOS Bucket");
  return { accessKeyId, secretAccessKey, projectName, groupId, groupName, region, tos };
}

async function callArkAssetsApi(action, payload, config, fetchImpl = globalThis.fetch, now = new Date()) {
  const signed = buildArkSignedRequest({
    action,
    payload,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    now,
  });
  const response = await fetchImpl(signed.url, { method: signed.method, headers: signed.headers, body: signed.body });
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Ark ${action} 返回非 JSON（HTTP ${response.status}）：${raw.slice(0, 240)}`);
  }
  const upstreamError = data?.ResponseMetadata?.Error;
  if (upstreamError) throw new Error(`${action} 失败：${upstreamError.Code || ""} ${upstreamError.Message || ""}`.trim());
  if (!response.ok) throw new Error(`${action} HTTP ${response.status}：${raw.slice(0, 240)}`);
  return data?.Result ?? data;
}

function preprocessArkTrustedImage(buffer, mime, filename, maxBytes = DEFAULT_MAX_IMAGE_BYTES) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error("可信素材图片为空");
  const normalizedMime = String(mime || "").split(";")[0].trim().toLowerCase();
  if (normalizedMime && !normalizedMime.startsWith("image/")) throw new Error("Ark 可信素材目前只支持图片");
  if (buffer.length <= maxBytes) {
    return { buffer, mime: normalizedMime || "image/jpeg", filename: filename || `ark-reference-${Date.now()}` };
  }
  if (!nativeImage?.createFromBuffer) throw new Error("图片超过 4MB，当前桌面运行时无法压缩该图片");
  let image = nativeImage.createFromBuffer(buffer);
  if (!image || image.isEmpty()) throw new Error("图片无法解码，不能提交 Ark 可信素材审核");
  let width = image.getSize().width || 0;
  let encoded = image.toJPEG(98);
  while (encoded.length > maxBytes && width > 512) {
    width = Math.max(512, Math.round(width * 0.85));
    image = image.resize({ width, quality: "best" });
    encoded = image.toJPEG(98);
  }
  if (encoded.length > maxBytes) throw new Error("图片压缩后仍超过 4MB，请先缩小文件后重试");
  const rawFilename = String(filename || `ark-reference-${Date.now()}`);
  const baseName = path.basename(rawFilename, path.extname(rawFilename));
  return { buffer: Buffer.from(encoded), mime: "image/jpeg", filename: `${baseName || "ark-reference"}.jpg` };
}

function defaultCacheFilePath() {
  try {
    return path.join(app.getPath("userData"), "ark-trusted-assets-cache.json");
  } catch {
    return "";
  }
}

function createArkAssetCacheStore(filePath = defaultCacheFilePath(), limit = DEFAULT_CACHE_LIMIT) {
  let state = { version: ARK_ASSET_CACHE_VERSION, assets: {}, groups: {} };
  try {
    if (filePath && fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (parsed && typeof parsed === "object") {
        state = {
          version: ARK_ASSET_CACHE_VERSION,
          assets: parsed.assets && typeof parsed.assets === "object" ? parsed.assets : {},
          groups: parsed.groups && typeof parsed.groups === "object" ? parsed.groups : {},
        };
      }
    }
  } catch {}
  const persist = () => {
    if (!filePath) return;
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.tmp-${process.pid}`;
      fs.writeFileSync(tempPath, JSON.stringify(state, null, 2));
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      appendDesktopLog("ark-trusted-asset-cache-write-failed", { error: formatErrorMessage(error) });
    }
  };
  const pruneAssets = () => {
    const entries = Object.entries(state.assets).sort(([, a], [, b]) => Number(b?.lastUsedAt || 0) - Number(a?.lastUsedAt || 0));
    state.assets = Object.fromEntries(entries.slice(0, Math.max(1, Number(limit) || DEFAULT_CACHE_LIMIT)));
  };
  return {
    getAsset(key) {
      const value = state.assets[key];
      if (!value) return null;
      value.lastUsedAt = Date.now();
      persist();
      return { ...value };
    },
    setAsset(key, value) {
      state.assets[key] = { ...value, lastUsedAt: Date.now() };
      pruneAssets();
      persist();
    },
    getGroup(key) {
      return state.groups[key] ? { ...state.groups[key] } : null;
    },
    setGroup(key, value) {
      state.groups[key] = { ...value, updatedAt: Date.now() };
      persist();
    },
    clear() {
      state = { version: ARK_ASSET_CACHE_VERSION, assets: {}, groups: {} };
      persist();
    },
    snapshot() {
      return JSON.parse(JSON.stringify(state));
    },
  };
}

function createArkTrustedAssetService({
  fetchImpl = globalThis.fetch,
  uploadToTosImpl = uploadToTos,
  readMediaPayload = bufferFromMediaPayload,
  preprocessImage = preprocessArkTrustedImage,
  sleepImpl = sleep,
  now = () => new Date(),
  cacheStore = createArkAssetCacheStore(),
} = {}) {
  const assetInflight = new Map();
  const groupInflight = new Map();
  const requestControllers = new Map();
  const groupProfileKey = (config) => sha256Hex(JSON.stringify([config.accessKeyId, config.region, config.projectName, config.groupName]));
  const assetProfileKey = (config, groupId, contentHash) => sha256Hex(JSON.stringify([
    config.accessKeyId, config.region, config.projectName, groupId, contentHash, "ark-trusted-image-v1",
  ]));

  const ensureAssetGroup = async (config, signal) => {
    if (config.groupId) return config.groupId;
    const profileKey = groupProfileKey(config);
    const cached = cacheStore.getGroup(profileKey);
    if (cached?.groupId) return cached.groupId;
    if (groupInflight.has(profileKey)) return groupInflight.get(profileKey);
    const operation = (async () => {
      if (signal?.aborted) throw new Error("可信素材审核已取消");
      const result = await callArkAssetsApi("CreateAssetGroup", {
        Name: config.groupName,
        Description: "StarCanvas Seedance 参考图可信素材",
        GroupType: "AIGC",
        ProjectName: config.projectName,
      }, config, fetchImpl, now());
      const groupId = String(result?.Id || result?.id || "").trim();
      if (!groupId) throw new Error("CreateAssetGroup 未返回资产组 ID");
      cacheStore.setGroup(profileKey, { groupId, groupName: config.groupName, projectName: config.projectName });
      return groupId;
    })();
    groupInflight.set(profileKey, operation);
    try {
      return await operation;
    } finally {
      groupInflight.delete(profileKey);
    }
  };

  const register = async (payload = {}) => {
    const config = normalizeArkTrustedAssetConfig(payload);
    const requestId = String(payload.requestId || "").trim();
    const controller = new AbortController();
    if (requestId) requestControllers.set(requestId, controller);
    try {
      const media = await readMediaPayload(payload);
      const prepared = await preprocessImage(media.buffer, media.mime, payload.filename || media.filename, payload.maxImageBytes);
      const contentHash = sha256Buffer(prepared.buffer);
      const groupId = await ensureAssetGroup(config, controller.signal);
      const cacheKey = assetProfileKey(config, groupId, contentHash);
      const cached = cacheStore.getAsset(cacheKey);
      if (cached?.assetId && String(cached.status || "").toLowerCase() === "active") {
        return { ok: true, ...cached, groupId, contentHash, assetUrl: `asset://${cached.assetId}`, cached: true };
      }
      if (assetInflight.has(cacheKey)) return assetInflight.get(cacheKey);
      const operation = (async () => {
        if (controller.signal.aborted) throw new Error("可信素材审核已取消");
        const uploadResult = await uploadToTosImpl({
          bytes: prepared.buffer,
          mime: prepared.mime,
          filename: prepared.filename,
          kind: "image",
          publicRead: true,
          tos: {
            ...config.tos,
            publicRead: true,
            prefix: [String(config.tos.prefix || "wanjuan/seedance").replace(/^\/+|\/+$/g, ""), "ark-trusted-assets"].filter(Boolean).join("/"),
          },
        });
        if (!uploadResult?.ok || !uploadResult.url) throw new Error(uploadResult?.error || "TOS 可信素材上传失败");
        if (controller.signal.aborted) throw new Error("可信素材审核已取消");
        const created = await callArkAssetsApi("CreateAsset", {
          GroupId: groupId,
          URL: uploadResult.url,
          AssetType: "Image",
          Name: String(payload.name || prepared.filename || `可信素材-${contentHash.slice(0, 8)}`).slice(0, 120),
          ProjectName: config.projectName,
        }, config, fetchImpl, now());
        const assetId = String(created?.Id || created?.id || "").trim();
        if (!assetId) throw new Error("CreateAsset 未返回 Asset ID");
        const timeoutMs = Math.max(5000, Number(payload.timeoutMs) || 5 * 60 * 1000);
        const pollIntervalMs = Math.max(250, Number(payload.pollIntervalMs) || 5000);
        const startedAt = Date.now();
        let status = String(created?.Status || created?.status || "").trim();
        while (status.toLowerCase() !== "active") {
          if (controller.signal.aborted) throw new Error("可信素材审核已取消");
          if (Date.now() - startedAt >= timeoutMs) throw new Error("Ark 可信素材审核超时（超过 5 分钟）");
          if (["failed", "rejected", "error"].includes(status.toLowerCase())) {
            throw new Error(`Ark 可信素材审核失败：${created?.FailureReason || created?.failureReason || "未知原因"}`);
          }
          await sleepImpl(pollIntervalMs);
          const current = await callArkAssetsApi("GetAsset", { Id: assetId, ProjectName: config.projectName }, config, fetchImpl, now());
          status = String(current?.Status || current?.status || "").trim();
          if (["failed", "rejected", "error"].includes(status.toLowerCase())) {
            throw new Error(`Ark 可信素材审核失败：${current?.FailureReason || current?.failureReason || "未知原因"}`);
          }
        }
        const cacheValue = {
          assetId,
          groupId,
          contentHash,
          status: "Active",
          name: String(payload.name || prepared.filename || "可信素材"),
          createdAt: Date.now(),
        };
        cacheStore.setAsset(cacheKey, cacheValue);
        appendDesktopLog("ark-trusted-asset-ready", {
          assetId,
          groupId,
          contentHash: contentHash.slice(0, 12),
          cached: false,
        });
        return { ok: true, ...cacheValue, assetUrl: `asset://${assetId}`, cached: false };
      })();
      assetInflight.set(cacheKey, operation);
      try {
        return await operation;
      } finally {
        assetInflight.delete(cacheKey);
      }
    } finally {
      if (requestId) requestControllers.delete(requestId);
    }
  };

  return {
    register,
    async ensureGroup(payload = {}) {
      const config = normalizeArkTrustedAssetConfig(payload);
      const groupId = await ensureAssetGroup(config);
      return { ok: true, groupId, groupName: config.groupName, projectName: config.projectName };
    },
    cancel(requestId) {
      const controller = requestControllers.get(String(requestId || ""));
      controller?.abort();
      return { ok: Boolean(controller) };
    },
    clearCache() {
      cacheStore.clear();
      return { ok: true };
    },
    cacheSnapshot() {
      return cacheStore.snapshot();
    },
  };
}

let defaultService;
function getDefaultArkTrustedAssetService() {
  defaultService ||= createArkTrustedAssetService();
  return defaultService;
}

module.exports = {
  ARK_ASSETS_HOST,
  ARK_ASSETS_VERSION,
  arkIsoDate,
  buildArkSignedRequest,
  callArkAssetsApi,
  normalizeArkTrustedAssetConfig,
  preprocessArkTrustedImage,
  createArkAssetCacheStore,
  createArkTrustedAssetService,
  getDefaultArkTrustedAssetService,
};
