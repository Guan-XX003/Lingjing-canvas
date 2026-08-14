// 企业本机网关：管理网关身份、TLS、脱密配置快照、本机 Secret Vault 和成员请求代理。
const crypto = require("node:crypto");
const fs = require("node:fs");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const { Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const selfsigned = require("selfsigned");

const { app } = require("./electron-refs.cjs");
const { decryptLocalSecret, encryptLocalSecret, secretStorageMode } = require("./local-secret-storage.cjs");
const { appendDesktopLog, formatErrorMessage } = require("./logging.cjs");
const { assertPublicHttpUrl } = require("./net/security.cjs");
const { sanitizeFilename } = require("./utils/paths.cjs");
const { uploadToAnonymousHosts } = require("./uploaders/anonymous-hosts.cjs");
const { uploadToTos, uploadToQiniuS3 } = require("./uploaders/cloud-storage.cjs");
const { uploadToCustomPublicHost } = require("./uploaders/custom-host.cjs");
const {
  countActiveEnterpriseTasks,
  createEnterpriseTask,
  failEnterpriseTask,
  getEnterpriseTask,
  reconcileEnterpriseTasks,
  settleEnterpriseTask,
} = require("./enterprise-task-store.cjs");
const {
  enterpriseUsageSummary,
  enterpriseUsageForSession,
  reserveEnterpriseQuota,
  settleEnterpriseQuota,
} = require("./enterprise-quota-store.cjs");
const {
  TeamTemplateError,
  createTeamTemplate,
  deleteTeamTemplate,
  getTeamTemplate,
  listTeamTemplateChanges,
  listTeamTemplates,
  updateTeamTemplate,
} = require("./enterprise-team-template-store.cjs");

const DEFAULT_GATEWAY_PORT = 39472;
const GATEWAY_STATE_VERSION = 1;
const MAX_REQUEST_BODY_BYTES = 32 * 1024 * 1024;
const MAX_ENTERPRISE_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const WORKSPACE_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

let gatewayServer = null;
let runtimeState = null;
let heartbeatTimer = null;
let jwksCache = null;
const teamTemplateRateLimits = new Map();

function gatewayRoot() {
  return path.join(app.getPath("userData"), "enterprise-gateway");
}

function gatewayStatePath() {
  return path.join(gatewayRoot(), "gateway.json");
}

function gatewaySnapshotPath() {
  return path.join(gatewayRoot(), "config-snapshot.json");
}

function gatewayVaultPath() {
  return path.join(gatewayRoot(), "vault.enc");
}

function gatewayPrivateStatePath() {
  return path.join(gatewayRoot(), "identity.enc");
}

function gatewayWorkspaceSessionsPath() {
  return path.join(gatewayRoot(), "workspace-sessions.json");
}

function gatewayControlSnapshotPath() {
  return path.join(gatewayRoot(), "control-snapshot.json");
}

function ensureGatewayRoot() {
  fs.mkdirSync(gatewayRoot(), { recursive: true, mode: 0o700 });
}

function atomicWrite(filePath, value, options = {}) {
  ensureGatewayRoot();
  const temp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, value, options);
  fs.renameSync(temp, filePath);
}

function canEncrypt() {
  return secretStorageMode() !== "unavailable";
}

function encryptJson(value) {
  if (!canEncrypt()) throw new Error("系统安全存储不可用，无法创建企业密钥库");
  return encryptLocalSecret(JSON.stringify(value));
}

function decryptJson(encoded) {
  if (!encoded || !canEncrypt()) return null;
  try {
    return JSON.parse(decryptLocalSecret(String(encoded)));
  } catch {
    return null;
  }
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readEncryptedJson(filePath) {
  try {
    return decryptJson(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeEncryptedJson(filePath, value) {
  atomicWrite(filePath, encryptJson(value), { encoding: "utf8", mode: 0o600 });
}

function getLanIPv4Addresses() {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (!entry || entry.family !== "IPv4" || entry.internal) continue;
      const parts = String(entry.address || "").split(".").map(Number);
      const privateAddress = parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168);
      if (privateAddress) addresses.push(entry.address);
    }
  }
  return [...new Set(addresses)];
}

function certificateFingerprint(certificatePem) {
  const certificate = new crypto.X509Certificate(certificatePem);
  return `sha256/${crypto.createHash("sha256").update(certificate.raw).digest("base64")}`;
}

function ed25519PublicKeyBase64(publicKey) {
  const keyObject = typeof publicKey === "string" ? crypto.createPublicKey(publicKey) : publicKey;
  const der = keyObject.export({ type: "spki", format: "der" });
  return der.subarray(der.length - 32).toString("base64");
}

function sanitizeGatewayState(state = {}) {
  const port = Number(state.port || DEFAULT_GATEWAY_PORT);
  const addresses = getLanIPv4Addresses();
  return {
    initialized: !!state.localGatewayId,
    running: !!gatewayServer?.listening,
    status: gatewayServer?.listening ? "online" : state.status || (state.localGatewayId ? "stopped" : "not_created"),
    localGatewayId: state.localGatewayId || "",
    gatewayId: state.gatewayId || "",
    organizationId: state.organizationId || "",
    organizationName: state.organizationName || "",
    gatewayName: state.gatewayName || "",
    port,
    addresses,
    urls: addresses.map((address) => `https://${address}:${port}`),
    preferredUrl: addresses[0] ? `https://${addresses[0]}:${port}` : `https://127.0.0.1:${port}`,
    certificateFingerprint: state.certificateFingerprint || "",
    configVersion: Number(state.configVersion || 0),
    configHash: state.configHash || "",
    autoStart: state.autoStart !== false,
    createdAt: Number(state.createdAt || 0),
    startedAt: Number(state.startedAt || 0),
    lastError: state.lastError || "",
    cloudStatus: state.cloudStatus || "pending",
  };
}

function loadRuntimeState() {
  if (runtimeState) return runtimeState;
  runtimeState = {
    version: GATEWAY_STATE_VERSION,
    ...(readJson(gatewayStatePath(), {}) || {}),
  };
  return runtimeState;
}

function saveRuntimeState(patch = {}) {
  runtimeState = {
    ...loadRuntimeState(),
    ...patch,
    version: GATEWAY_STATE_VERSION,
    updatedAt: Date.now(),
  };
  atomicWrite(gatewayStatePath(), JSON.stringify(runtimeState, null, 2), { encoding: "utf8", mode: 0o600 });
  return runtimeState;
}

function getEnterpriseGatewayStatus() {
  return sanitizeGatewayState(loadRuntimeState());
}

function getEnterpriseGatewayManagementSnapshot() {
  const control = readJson(gatewayControlSnapshotPath(), {}) || {};
  return {
    policyVersion: Number(control.policyVersion || 0),
    timezone: String(control.timezone || "Asia/Shanghai"),
    members: Array.isArray(control.members) ? control.members : [],
    quotaDefaults: Array.isArray(control.quotaDefaults) ? control.quotaDefaults : [],
    memberQuotaOverrides: Array.isArray(control.memberQuotaOverrides) ? control.memberQuotaOverrides : [],
    usage: enterpriseUsageSummary(control),
    activeTasks: countActiveEnterpriseTasks(),
  };
}

function normalizeSecretEntries(entries) {
  const secretMap = {};
  for (const item of Array.isArray(entries) ? entries : []) {
    const id = String(item?.id || "").trim();
    const value = String(item?.value || "");
    if (!id || !value) continue;
    secretMap[id] = {
      type: String(item?.type || "secret"),
      path: String(item?.path || ""),
      value,
    };
  }
  return secretMap;
}

function readGatewayVault() {
  return readEncryptedJson(gatewayVaultPath()) || { version: 1, secrets: {} };
}

function secretRefId(value) {
  return value && typeof value === "object" ? String(value.$secretRef || "") : "";
}

function resolveSecretValue(value, vault) {
  const ref = secretRefId(value);
  return ref ? String(vault?.secrets?.[ref]?.value || "") : typeof value === "string" ? value : "";
}

function resolveSecretRefs(value, vault) {
  if (Array.isArray(value)) return value.map((item) => resolveSecretRefs(item, vault));
  if (!value || typeof value !== "object") return value;
  const ref = secretRefId(value);
  if (ref) {
    const secret = String(vault?.secrets?.[ref]?.value || "");
    if (!secret) throw new Error("企业上传配置缺少可用密钥");
    return secret;
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolveSecretRefs(child, vault)]));
}

function parseUploadMetadata(request) {
  try {
    const raw = String(request.headers["x-wanjuan-upload-metadata"] || "");
    return raw ? JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) : {};
  } catch {
    throw new Error("企业上传元数据格式无效");
  }
}

async function receiveEnterpriseUpload(request, metadata) {
  ensureGatewayRoot();
  const uploadRoot = path.join(gatewayRoot(), "upload-temp");
  fs.mkdirSync(uploadRoot, { recursive: true, mode: 0o700 });
  const filename = sanitizeFilename(metadata.filename || `enterprise-upload-${Date.now()}`);
  const tempPath = path.join(uploadRoot, `${crypto.randomUUID()}-${filename}`);
  const declaredSize = Number(request.headers["content-length"] || 0);
  if (declaredSize > MAX_ENTERPRISE_UPLOAD_BYTES) throw new Error("企业上传文件超过 2GB 限制");
  let received = 0;
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      if (received > MAX_ENTERPRISE_UPLOAD_BYTES) callback(new Error("企业上传文件超过 2GB 限制"));
      else callback(null, chunk);
    },
  });
  try {
    await pipeline(request, limiter, fs.createWriteStream(tempPath, { mode: 0o600 }));
    if (!received) throw new Error("企业上传文件为空");
    return {
      tempPath,
      size: received,
      filename,
      mime: String(metadata.mime || request.headers["content-type"] || "application/octet-stream").split(";")[0],
    };
  } catch (error) {
    try { fs.rmSync(tempPath, { force: true }); } catch {}
    throw error;
  }
}

async function executeEnterpriseUpload(request, metadata) {
  const snapshot = readJson(gatewaySnapshotPath(), null);
  const settings = snapshot?.modules?.settings?.chromeStorage || {};
  const vault = readGatewayVault();
  const source = await receiveEnterpriseUpload(request, metadata);
  const channel = String(metadata.channel || "public").toLowerCase();
  const payload = {
    localPath: source.tempPath,
    filename: source.filename,
    mime: source.mime,
    kind: String(metadata.kind || "media"),
  };
  try {
    if (channel === "tos") return await uploadToTos({ ...payload, tos: resolveSecretRefs(settings.tosConfig || {}, vault) });
    if (channel === "qiniu") return await uploadToQiniuS3({ ...payload, qiniu: resolveSecretRefs(settings.qiniuConfig || {}, vault) });
    if (channel === "custom") {
      return await uploadToCustomPublicHost({ ...payload, customUpload: resolveSecretRefs(settings.customPublicUploadConfig || {}, vault) });
    }
    if (channel !== "public") throw new Error("企业上传通道无效");
    const buffer = fs.readFileSync(source.tempPath);
    return { ok: true, url: await uploadToAnonymousHosts(buffer, source.mime, source.filename) };
  } finally {
    try { fs.rmSync(source.tempPath, { force: true }); } catch {}
  }
}

function listManagedApiConfigs(snapshot) {
  const settings = snapshot?.modules?.settings?.chromeStorage || {};
  const configured = (Array.isArray(settings.apiConfigs) ? settings.apiConfigs : [])
    .filter((item) => item && (item.url || item.apiUrl))
    .map((item) => ({ ...item, url: String(item.url || item.apiUrl || ""), key: item.key ?? item.apiKey }));
  const legacy = [
    ["legacy:default", settings.apiUrl, settings.apiKey],
    ["legacy:text", settings.textApiUrl, settings.textApiKey],
    ["legacy:image", settings.imageApiUrl, settings.imageApiKey],
    ["legacy:video", settings.videoApiUrl, settings.videoApiKey],
    ["legacy:audio", settings.audioApiUrl, settings.audioApiKey],
  ].filter(([, url]) => String(url || "").trim()).map(([id, url, key]) => ({ id, url, key }));
  const seen = new Set();
  return [...configured, ...legacy].filter((item) => {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function findManagedApiConfig(snapshot, id) {
  return listManagedApiConfigs(snapshot).find((item) => String(item?.id || "") === String(id || "")) || null;
}

function assertManagedTarget(apiConfig, requestUrl) {
  const base = new URL(String(apiConfig?.url || ""));
  const target = new URL(String(requestUrl || ""));
  const basePath = base.pathname.replace(/\/$/, "");
  if (target.origin !== base.origin || (basePath && basePath !== "/" && !target.pathname.startsWith(`${basePath}/`) && target.pathname !== basePath)) {
    throw new Error("企业请求目标不属于托管 API 配置");
  }
  return target;
}

function managedRequestHeaders(apiConfig, sourceHeaders, vault, target, authMetadata = {}) {
  const blocked = new Set(["host", "connection", "content-length", "cookie", "origin", "referer"]);
  const headers = {};
  for (const [key, value] of Object.entries(sourceHeaders || {})) {
    const normalized = String(key).toLowerCase();
    if (!key || blocked.has(normalized) || value == null) continue;
    if (["authorization", "x-api-key", "api-key", "x-goog-api-key"].includes(normalized)) continue;
    headers[key] = String(value);
  }
  const secret = resolveSecretValue(apiConfig?.key, vault);
  const hasConfiguredSecret = !!secretRefId(apiConfig?.key) || (typeof apiConfig?.key === "string" && !!apiConfig.key);
  if (hasConfiguredSecret && !secret) throw new Error("企业 API 配置缺少可用密钥");
  const originalHeaderNames = new Set([
    ...Object.keys(sourceHeaders || {}).map((item) => item.toLowerCase()),
    ...(Array.isArray(authMetadata.headerNames) ? authMetadata.headerNames.map((item) => String(item).toLowerCase()) : []),
  ]);
  if (secret) {
    if (originalHeaderNames.has("x-goog-api-key") || /googleapis\.com$/i.test(target.hostname)) headers["x-goog-api-key"] = secret;
    else if (originalHeaderNames.has("x-api-key")) headers["x-api-key"] = secret;
    else if (originalHeaderNames.has("api-key")) headers["api-key"] = secret;
    else headers.authorization = `${String(authMetadata.authorizationScheme || "Bearer")} ${secret}`;
  }
  return headers;
}

function injectManagedQuerySecret(target, apiConfig, vault) {
  const secret = resolveSecretValue(apiConfig?.key, vault);
  if (!secret) return target;
  const querySecretNames = ["key", "api_key", "apikey", "access_token"];
  const existingName = querySecretNames.find((name) => target.searchParams.has(name));
  if (existingName) target.searchParams.set(existingName, secret);
  return target;
}

async function executeManagedProxyRequest(payload) {
  const snapshot = readJson(gatewaySnapshotPath(), null);
  const apiConfig = findManagedApiConfig(snapshot, payload.managedApiConfigId);
  if (!apiConfig) throw new Error("企业托管 API 配置不存在");
  const target = assertManagedTarget(apiConfig, payload.url);
  const vault = readGatewayVault();
  injectManagedQuerySecret(target, apiConfig, vault);
  const headers = managedRequestHeaders(apiConfig, payload.headers, vault, target, {
    headerNames: payload.authHeaderNames,
    authorizationScheme: payload.authorizationScheme,
  });
  const body = payload.bodyBase64 ? Buffer.from(String(payload.bodyBase64), "base64") : undefined;
  let currentTarget = target;
  let currentMethod = String(payload.method || "GET").toUpperCase();
  let currentHeaders = headers;
  let currentBody = body;
  let response;
  const timeoutSignal = AbortSignal.timeout(Math.max(1000, Math.min(600000, Number(payload.requestTimeout || 180000))));
  const requestSignal = payload.signal ? AbortSignal.any([payload.signal, timeoutSignal]) : timeoutSignal;
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    response = await fetch(currentTarget, {
      method: currentMethod,
      headers: currentHeaders,
      body: currentMethod === "GET" || currentMethod === "HEAD" ? undefined : currentBody,
      redirect: "manual",
      signal: requestSignal,
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location) break;
    if (redirectCount >= 5) throw new Error("企业代理请求重定向次数过多");
    const nextTarget = new URL(location, currentTarget);
    if (nextTarget.origin !== target.origin) {
      assertPublicHttpUrl(nextTarget, "企业代理重定向目标");
      currentHeaders = Object.fromEntries(Object.entries(currentHeaders).filter(([key]) =>
        !["authorization", "x-api-key", "api-key", "x-goog-api-key", "cookie"].includes(String(key).toLowerCase())));
    } else {
      assertManagedTarget(apiConfig, nextTarget);
    }
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod === "POST")) {
      currentMethod = "GET";
      currentBody = undefined;
      currentHeaders = Object.fromEntries(Object.entries(currentHeaders).filter(([key]) => String(key).toLowerCase() !== "content-type"));
    }
    currentTarget = nextTarget;
  }
  if (!response) throw new Error("企业代理请求未获得响应");
  const responseBuffer = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Array.from(response.headers.entries()),
    bodyBase64: responseBuffer.toString("base64"),
  };
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !snapshot.modules?.settings?.chromeStorage) {
    throw new Error("企业配置快照格式不正确");
  }
  const serialized = JSON.stringify(snapshot);
  if (/(?:"apiKey"|"secretKey"|"accessKey"|"token"|"authorization")\s*:\s*"(?!")/i.test(serialized)) {
    throw new Error("企业配置快照仍包含疑似明文密钥，已拒绝发布");
  }
}

async function generateGatewayIdentity(localGatewayId) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const commonName = `wanjuan-gateway-${localGatewayId.slice(-8)}.local`;
  const altNames = [
    { type: 2, value: commonName },
    { type: 2, value: "localhost" },
    { type: 7, ip: "127.0.0.1" },
    ...getLanIPv4Addresses().map((ip) => ({ type: 7, ip })),
  ];
  const certificate = await selfsigned.generate(
    [{ name: "commonName", value: commonName }],
    {
      keyType: "ec",
      curve: "P-256",
      algorithm: "sha256",
      notBeforeDate: new Date(Date.now() - 5 * 60 * 1000),
      notAfterDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      extensions: [
        { name: "basicConstraints", cA: false, critical: true },
        { name: "keyUsage", digitalSignature: true, keyEncipherment: true, critical: true },
        { name: "extKeyUsage", serverAuth: true },
        { name: "subjectAltName", altNames },
      ],
    },
  );
  return {
    publicKey: publicKey.export({ type: "spki", format: "pem" }),
    publicKeyBase64: ed25519PublicKeyBase64(publicKey),
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }),
    tlsCertificate: certificate.cert,
    tlsPrivateKey: certificate.private,
    certificateFingerprint: certificateFingerprint(certificate.cert),
    commonName,
  };
}

function migrateGatewayIdentity(identity) {
  if (!identity?.privateKey || !identity?.tlsCertificate || !identity?.tlsPrivateKey) return identity;
  const next = { ...identity };
  if (!next.publicKeyBase64) {
    const publicKey = next.publicKey || crypto.createPublicKey(next.privateKey);
    next.publicKeyBase64 = ed25519PublicKeyBase64(publicKey);
  }
  if (!String(next.certificateFingerprint || "").startsWith("sha256/")) {
    next.certificateFingerprint = certificateFingerprint(next.tlsCertificate);
  }
  return next;
}

function sendJson(response, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": body.length,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BODY_BYTES) {
        reject(new Error("请求内容过大"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function parseJsonBuffer(buffer) {
  if (!buffer?.length) return {};
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new Error("请求 JSON 格式不正确");
  }
}

function bearerToken(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function decodeBase64Url(value) {
  return Buffer.from(String(value || "").replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

async function getAccountJwks(accountBaseUrl) {
  if (jwksCache && jwksCache.baseUrl === accountBaseUrl && Date.now() - jwksCache.loadedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.value;
  }
  const response = await fetch(`${String(accountBaseUrl).replace(/\/$/, "")}/.well-known/jwks.json`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`账号公钥读取失败 (${response.status})`);
  const value = await response.json();
  if (!Array.isArray(value?.keys) || !value.keys.length) throw new Error("账号公钥数据不完整");
  jwksCache = { baseUrl: accountBaseUrl, loadedAt: Date.now(), value };
  return value;
}

async function verifyAccountJwt(token, options = {}) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("账号授权格式无效");
  const header = parseJsonBuffer(decodeBase64Url(parts[0]));
  const claims = parseJsonBuffer(decodeBase64Url(parts[1]));
  if (header.alg !== "RS256" || !header.kid) throw new Error("账号授权签名算法无效");
  const jwks = await getAccountJwks(options.issuer);
  const jwk = jwks.keys.find((item) => item.kid === header.kid && item.kty === "RSA" && item.alg === "RS256");
  if (!jwk) throw new Error("账号授权签名密钥不存在");
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const valid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`, "utf8"),
    publicKey,
    decodeBase64Url(parts[2]),
  );
  if (!valid) throw new Error("账号授权签名无效");
  const nowSeconds = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== options.issuer || !audiences.includes(options.audience)) throw new Error("账号授权签发方无效");
  if (!Number(claims.exp) || Number(claims.exp) <= nowSeconds) throw new Error("账号授权已过期");
  if (Number(claims.iat || 0) > nowSeconds + 300) throw new Error("账号授权签发时间无效");
  return claims;
}

function readWorkspaceSessions() {
  const value = readJson(gatewayWorkspaceSessionsPath(), { version: 1, sessions: [] });
  const now = Date.now();
  value.sessions = (Array.isArray(value.sessions) ? value.sessions : []).filter((item) => !item.revokedAt && Number(item.expiresAt || 0) > now);
  return value;
}

function writeWorkspaceSessions(value) {
  atomicWrite(gatewayWorkspaceSessionsPath(), JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 });
}

function workspaceTokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function createWorkspaceSession(claims, accessClaims) {
  const token = crypto.randomBytes(32).toString("base64url");
  const sessions = readWorkspaceSessions();
  const session = {
    id: crypto.randomUUID(),
    tokenHash: workspaceTokenHash(token),
    userId: String(claims.sub),
    deviceId: String(claims.device),
    organizationId: String(claims.org),
    gatewayId: String(claims.gateway),
    role: String(claims.role || "member"),
    policyVersion: Number(claims.policyVersion || 0),
    accountSessionId: String(accessClaims.sid || ""),
    createdAt: Date.now(),
    expiresAt: Date.now() + WORKSPACE_SESSION_TTL_MS,
    revokedAt: 0,
  };
  sessions.sessions.push(session);
  writeWorkspaceSessions(sessions);
  return { token, session };
}

function requireWorkspaceSession(request) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = workspaceTokenHash(token);
  return readWorkspaceSessions().sessions.find((item) => item.tokenHash === tokenHash) || null;
}

function revokeWorkspaceSession(request) {
  const token = bearerToken(request);
  if (!token) return false;
  const tokenHash = workspaceTokenHash(token);
  const sessions = readWorkspaceSessions();
  const target = sessions.sessions.find((item) => item.tokenHash === tokenHash);
  if (!target) return false;
  target.revokedAt = Date.now();
  writeWorkspaceSessions(sessions);
  return true;
}

function gatewaySignaturePayload(method, pathname, timestamp, nonce, bodyBuffer) {
  const bodyHash = crypto.createHash("sha256").update(bodyBuffer).digest("hex");
  return Buffer.from(`${String(method).toUpperCase()}\n${pathname}\n${timestamp}\n${nonce}\n${bodyHash}`, "utf8");
}

async function signedControlPlaneRequest(pathname, options = {}) {
  const state = loadRuntimeState();
  const identity = migrateGatewayIdentity(readEncryptedJson(gatewayPrivateStatePath()));
  if (!state.gatewayId || !state.accountBaseUrl || !identity?.privateKey) throw new Error("网关云端身份尚未激活");
  const method = String(options.method || "GET").toUpperCase();
  const bodyBuffer = options.body === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(options.body), "utf8");
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(24).toString("base64url");
  const signature = crypto.sign(null, gatewaySignaturePayload(method, new URL(pathname, state.accountBaseUrl).pathname, timestamp, nonce, bodyBuffer), identity.privateKey).toString("base64");
  const response = await fetch(`${String(state.accountBaseUrl).replace(/\/$/, "")}${pathname}`, {
    method,
    headers: {
      accept: "application/json",
      ...(bodyBuffer.length ? { "content-type": "application/json" } : {}),
      "x-wanjuan-timestamp": timestamp,
      "x-wanjuan-nonce": nonce,
      "x-wanjuan-signature": signature,
    },
    body: bodyBuffer.length ? bodyBuffer : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(value.error || `网关控制平面请求失败 (${response.status})`);
    error.code = value.code || `HTTP_${response.status}`;
    throw error;
  }
  return value;
}

async function syncGatewayControlPlane() {
  const state = loadRuntimeState();
  if (!state.gatewayId || !state.accountBaseUrl) return;
  const sessions = readWorkspaceSessions().sessions;
  const snapshot = readJson(gatewaySnapshotPath(), {});
  const heartbeat = await signedControlPlaneRequest(`/gateways/${encodeURIComponent(state.gatewayId)}/heartbeat`, {
    method: "POST",
    body: {
      status: "online",
      appVersion: app.getVersion(),
      configVersion: Number(state.configVersion || 0),
      configHash: state.configHash || null,
      capabilitySummary: Object.keys(snapshot?.modules?.settings?.chromeStorage || {}).length
        ? ["managed_configuration", "task_proxy", "streaming_upload", "local_quota_accounting"]
        : [],
      activeSessions: sessions.length,
    },
  });
  const control = await signedControlPlaneRequest(
    `/gateways/${encodeURIComponent(state.gatewayId)}/control-snapshot?afterVersion=${Number(state.policyVersion || 0)}`,
  );
  atomicWrite(gatewayControlSnapshotPath(), JSON.stringify(control, null, 2), { encoding: "utf8", mode: 0o600 });
  const usage = enterpriseUsageSummary(control);
  try {
    await signedControlPlaneRequest(`/gateways/${encodeURIComponent(state.gatewayId)}/usage-summary`, {
      method: "POST",
      body: {
        day: usage.day,
        successfulByCapability: usage.successfulByCapability,
        activeTasks: countActiveEnterpriseTasks(),
      },
    });
  } catch (error) {
    appendDesktopLog("enterprise-gateway-usage-summary-failed", { error: formatErrorMessage(error) });
  }
  saveRuntimeState({
    cloudStatus: "active",
    policyVersion: Number(control.policyVersion || heartbeat.policyVersion || state.policyVersion || 0),
    lastHeartbeatAt: Date.now(),
    lastError: "",
  });
}

function startGatewayHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  syncGatewayControlPlane().catch((error) => saveRuntimeState({ cloudStatus: "offline", lastError: formatErrorMessage(error) }));
  heartbeatTimer = setInterval(() => {
    syncGatewayControlPlane().catch((error) => saveRuntimeState({ cloudStatus: "offline", lastError: formatErrorMessage(error) }));
  }, 60000);
  heartbeatTimer.unref?.();
}

function stopGatewayHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function membershipExpiry(value) {
  const raw = value?.expires_at ?? value?.expiresAt;
  if (raw === undefined || raw === null || raw === "") return 0;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric > 0 && numeric < 1e12 ? numeric * 1000 : numeric;
  const parsed = Date.parse(String(raw));
  return Number.isFinite(parsed) ? parsed : -1;
}

function currentTeamTemplatePrincipal(session, options = {}) {
  const state = loadRuntimeState();
  const principal = {
    userId: String(session?.userId || ""),
    organizationId: String(session?.organizationId || ""),
    gatewayId: String(session?.gatewayId || ""),
    role: String(session?.role || "member").toLowerCase(),
  };
  if (!principal.userId || principal.organizationId !== String(state.organizationId || "") || principal.gatewayId !== String(state.gatewayId || "")) {
    throw new TeamTemplateError("企业会话与当前网关不匹配", { status: 403, code: "TEAM_TEMPLATE_FORBIDDEN" });
  }
  if (options.trustedHost) {
    if (session?.trustedHost !== true || !["owner", "admin"].includes(principal.role)) {
      throw new TeamTemplateError("本机团队提示词调用缺少已核验的网关所有者身份", {
        status: 403,
        code: "TEAM_TEMPLATE_HOST_AUTH_REQUIRED",
      });
    }
    return principal;
  }

  if (!fs.existsSync(gatewayControlSnapshotPath())) {
    throw new TeamTemplateError("企业成员控制快照暂不可用", { status: 503, code: "TEAM_TEMPLATE_CONTROL_UNAVAILABLE" });
  }
  const control = readJson(gatewayControlSnapshotPath(), null);
  if (!control || !Array.isArray(control.members)) {
    throw new TeamTemplateError("企业成员控制快照暂不可用", { status: 503, code: "TEAM_TEMPLATE_CONTROL_UNAVAILABLE" });
  }
  if ((control.organizationId && String(control.organizationId) !== principal.organizationId) ||
      (control.gatewayId && String(control.gatewayId) !== principal.gatewayId)) {
    throw new TeamTemplateError("企业成员控制快照与当前网关不匹配", { status: 403, code: "TEAM_TEMPLATE_FORBIDDEN" });
  }
  const member = (Array.isArray(control.members) ? control.members : []).find((item) =>
    String(item?.user_id ?? item?.userId ?? item?.id ?? "") === principal.userId);
  const status = String(member?.status || "").toLowerCase();
  const expiresAt = membershipExpiry(member);
  if (!member || status !== "active" || expiresAt < 0 || (expiresAt > 0 && expiresAt <= Date.now())) {
    throw new TeamTemplateError("企业成员资格已失效", { status: 403, code: "TEAM_TEMPLATE_MEMBERSHIP_REVOKED" });
  }
  principal.role = String(member.role || "member").toLowerCase();
  if (!["member", "owner", "admin"].includes(principal.role)) {
    throw new TeamTemplateError("当前企业角色无权访问团队提示词", { status: 403, code: "TEAM_TEMPLATE_FORBIDDEN" });
  }
  return principal;
}

function enforceTeamTemplateRateLimit(principal, operation) {
  const group = ["list", "get", "changes"].includes(operation) ? "read" : operation === "create" ? "create" : "modify";
  const rules = {
    read: { limit: 300, windowMs: 60 * 1000 },
    create: { limit: 120, windowMs: 60 * 60 * 1000 },
    modify: { limit: 300, windowMs: 60 * 60 * 1000 },
  };
  const rule = rules[group];
  const now = Date.now();
  const key = `${principal.organizationId}:${principal.gatewayId}:${principal.userId}:${group}`;
  const recent = (teamTemplateRateLimits.get(key) || []).filter((timestamp) => timestamp > now - rule.windowMs);
  if (recent.length >= rule.limit) {
    const retryAfter = Math.max(1, Math.ceil((recent[0] + rule.windowMs - now) / 1000));
    throw new TeamTemplateError("团队提示词请求过于频繁", {
      status: 429,
      code: "TEAM_TEMPLATE_RATE_LIMITED",
      details: { retryAfter },
    });
  }
  recent.push(now);
  teamTemplateRateLimits.set(key, recent);
}

function teamTemplateOperation(operation, payload, principal) {
  enforceTeamTemplateRateLimit(principal, operation);
  if (operation === "list") return { ok: true, ...listTeamTemplates(principal, payload) };
  if (operation === "changes") return { ok: true, ...listTeamTemplateChanges(principal, payload) };
  if (operation === "get") return { ok: true, item: getTeamTemplate(principal, payload.id) };
  if (operation === "create") {
    return { ok: true, item: createTeamTemplate(principal, payload.input, payload.idempotencyKey) };
  }
  if (operation === "update") {
    return { ok: true, item: updateTeamTemplate(principal, payload.id, payload.input, payload.revision) };
  }
  if (operation === "delete") {
    return { ok: true, tombstone: deleteTeamTemplate(principal, payload.id, payload.revision) };
  }
  throw new TeamTemplateError("未知的团队提示词操作", { status: 400, code: "TEAM_TEMPLATE_OPERATION_INVALID" });
}

async function invokeEnterpriseTeamTemplatesAsHost({ operation, payload = {}, session } = {}) {
  const principal = currentTeamTemplatePrincipal(session, { trustedHost: true });
  return teamTemplateOperation(String(operation || ""), payload && typeof payload === "object" ? payload : {}, principal);
}

function ifMatchRevision(request, bodyRevision) {
  const raw = String(request.headers["if-match"] || "").trim();
  let headerRevision;
  if (raw) {
    const normalized = raw.replace(/^W\//i, "").replace(/^"|"$/g, "");
    headerRevision = Number(normalized);
    if (!Number.isInteger(headerRevision) || headerRevision < 1) {
      throw new TeamTemplateError("If-Match revision 格式无效", { status: 400, code: "TEAM_TEMPLATE_REVISION_INVALID" });
    }
  }
  if (bodyRevision !== undefined && headerRevision !== undefined && Number(bodyRevision) !== headerRevision) {
    throw new TeamTemplateError("revision 与 If-Match 不一致", { status: 400, code: "TEAM_TEMPLATE_REVISION_INVALID" });
  }
  return headerRevision ?? bodyRevision;
}

function sendTeamTemplateError(response, error) {
  const status = error instanceof TeamTemplateError ? error.status : 500;
  sendJson(response, status, {
    ok: false,
    code: String(error?.code || "TEAM_TEMPLATE_FAILED"),
    error: error instanceof TeamTemplateError ? error.message : "团队提示词操作失败",
    ...(error?.details ? { details: error.details } : {}),
  });
}

async function handleTeamTemplateRequest(request, response, url, workspaceSession) {
  if (!url.pathname.startsWith("/workspace/team-templates")) return false;
  try {
    const principal = currentTeamTemplatePrincipal(workspaceSession);
    if (request.method === "GET" && url.pathname === "/workspace/team-templates") {
      const result = teamTemplateOperation("list", {
        cursor: url.searchParams.get("cursor") || "",
        limit: url.searchParams.get("limit") || undefined,
        updatedAfter: url.searchParams.get("updatedAfter") || "",
        includeArchived: url.searchParams.get("includeArchived") || "",
      }, principal);
      sendJson(response, 200, result);
      return true;
    }
    if (request.method === "POST" && url.pathname === "/workspace/team-templates") {
      const input = parseJsonBuffer(await readRequestBody(request));
      const result = teamTemplateOperation("create", {
        input,
        idempotencyKey: String(request.headers["idempotency-key"] || ""),
      }, principal);
      response.setHeader("etag", `"${result.item.revision}"`);
      sendJson(response, 201, result);
      return true;
    }
    if (request.method === "GET" && url.pathname === "/workspace/team-templates/changes") {
      const result = teamTemplateOperation("changes", {
        cursor: url.searchParams.get("cursor") || "",
        limit: url.searchParams.get("limit") || undefined,
      }, principal);
      sendJson(response, 200, result);
      return true;
    }
    const match = url.pathname.match(/^\/workspace\/team-templates\/([^/]+)$/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      if (request.method === "GET") {
        const result = teamTemplateOperation("get", { id }, principal);
        response.setHeader("etag", `"${result.item.revision}"`);
        sendJson(response, 200, result);
        return true;
      }
      if (request.method === "PATCH") {
        const body = parseJsonBuffer(await readRequestBody(request));
        const { revision, ...input } = body;
        const result = teamTemplateOperation("update", { id, input, revision: ifMatchRevision(request, revision) }, principal);
        response.setHeader("etag", `"${result.item.revision}"`);
        sendJson(response, 200, result);
        return true;
      }
      if (request.method === "DELETE") {
        const body = parseJsonBuffer(await readRequestBody(request));
        const result = teamTemplateOperation("delete", { id, revision: ifMatchRevision(request, body.revision) }, principal);
        sendJson(response, 200, result);
        return true;
      }
    }
    sendJson(response, 404, { ok: false, code: "TEAM_TEMPLATE_ROUTE_NOT_FOUND", error: "团队提示词接口不存在" });
  } catch (error) {
    sendTeamTemplateError(response, error);
  }
  return true;
}

async function handleGatewayRequest(request, response) {
  const url = new URL(request.url || "/", "https://wanjuan-gateway.local");
  if (request.method === "GET" && url.pathname === "/health") {
    const status = getEnterpriseGatewayStatus();
    sendJson(response, 200, {
      ok: true,
      protocol: "wanjuan-enterprise-gateway",
      protocolVersion: 1,
      gatewayId: status.gatewayId || status.localGatewayId,
      organizationId: status.organizationId,
      appVersion: app.getVersion(),
      configVersion: status.configVersion,
      cloudStatus: status.cloudStatus,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/workspace/session") {
    const state = loadRuntimeState();
    if (!state.gatewayId || state.cloudStatus !== "active") {
      sendJson(response, 503, { ok: false, code: "GATEWAY_OFFLINE", error: "企业网关尚未完成云端激活" });
      return;
    }
    try {
      const body = parseJsonBuffer(await readRequestBody(request));
      const accountToken = bearerToken(request);
      const accessClaims = await verifyAccountJwt(accountToken, {
        issuer: state.accountBaseUrl,
        audience: "wanjuan-desktop",
      });
      const grantClaims = await verifyAccountJwt(body.signedGatewayGrant, {
        issuer: state.accountBaseUrl,
        audience: "wanjuan-local-gateway",
      });
      const deviceId = String(body.deviceId || "");
      if (grantClaims.typ !== "wanjuan-gateway-grant" ||
          grantClaims.org !== state.organizationId ||
          grantClaims.gateway !== state.gatewayId ||
          grantClaims.device !== deviceId ||
          accessClaims.sub !== grantClaims.sub ||
          accessClaims.did !== deviceId) {
        sendJson(response, 403, { ok: false, code: "INVALID_GATEWAY_GRANT", error: "企业网关授权与当前账号或设备不匹配" });
        return;
      }
      const { token, session } = createWorkspaceSession(grantClaims, accessClaims);
      sendJson(response, 200, {
        ok: true,
        workspaceToken: token,
        expiresIn: Math.floor(WORKSPACE_SESSION_TTL_MS / 1000),
        organization: {
          id: state.organizationId,
          name: state.organizationName,
          role: session.role,
        },
        gatewayId: state.gatewayId,
        snapshotVersion: Number(state.configVersion || 0),
        configHash: state.configHash || "",
      });
    } catch (error) {
      sendJson(response, 401, { ok: false, code: "INVALID_GATEWAY_GRANT", error: formatErrorMessage(error) });
    }
    return;
  }

  const workspaceSession = url.pathname.startsWith("/workspace/") ? requireWorkspaceSession(request) : null;
  if (url.pathname.startsWith("/workspace/") && !workspaceSession) {
    sendJson(response, 401, { ok: false, code: "WORKSPACE_SESSION_EXPIRED", error: "企业会话无效或已过期" });
    return;
  }

  if (await handleTeamTemplateRequest(request, response, url, workspaceSession)) return;

  if (request.method === "GET" && url.pathname === "/workspace/config-snapshot") {
    const snapshot = readJson(gatewaySnapshotPath(), null);
    if (!snapshot) {
      sendJson(response, 503, { ok: false, code: "CONFIG_NOT_AVAILABLE", error: "企业配置快照尚未发布" });
      return;
    }
    const etag = `"${String(snapshot.hash || "").replace(/^sha256:/, "")}"`;
    if (etag !== `""` && request.headers["if-none-match"] === etag) {
      response.writeHead(304, { etag, "cache-control": "no-store" });
      response.end();
      return;
    }
    response.setHeader("etag", etag);
    sendJson(response, 200, snapshot);
    return;
  }

  if (request.method === "GET" && url.pathname === "/workspace/usage") {
    const control = readJson(gatewayControlSnapshotPath(), {});
    sendJson(response, 200, { ok: true, ...enterpriseUsageForSession(workspaceSession, control) });
    return;
  }

  if (request.method === "POST" && url.pathname === "/workspace/proxy-fetch") {
    const proxyAbortController = new AbortController();
    request.once("aborted", () => proxyAbortController.abort());
    try {
      const body = parseJsonBuffer(await readRequestBody(request));
      const method = String(body.method || "GET").toUpperCase();
      if (!new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).has(method)) {
        sendJson(response, 400, { ok: false, code: "INVALID_PROXY_METHOD", error: "企业代理请求方法无效" });
        return;
      }
      const proxyPayload = { ...body, method, signal: proxyAbortController.signal };
      const result = await executeManagedProxyRequest(proxyPayload);
      const control = readJson(gatewayControlSnapshotPath(), {});
      const updatedTasks = reconcileEnterpriseTasks(proxyPayload, result, readJson(gatewaySnapshotPath(), null));
      updatedTasks.forEach((item) => settleEnterpriseQuota(item, control));
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        code: String(error?.code || "ENTERPRISE_PROXY_REJECTED"),
        error: formatErrorMessage(error),
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/workspace/tasks") {
    const taskAbortController = new AbortController();
    request.once("aborted", () => taskAbortController.abort());
    let task = null;
    try {
      const body = parseJsonBuffer(await readRequestBody(request));
      const method = String(body.method || "POST").toUpperCase();
      if (!new Set(["POST", "PUT", "PATCH", "DELETE"]).has(method)) {
        sendJson(response, 400, { ok: false, code: "INVALID_TASK_METHOD", error: "企业任务提交方法无效" });
        return;
      }
      const snapshot = readJson(gatewaySnapshotPath(), null);
      const control = readJson(gatewayControlSnapshotPath(), {});
      const proxyPayload = { ...body, method, signal: taskAbortController.signal };
      task = createEnterpriseTask({ session: workspaceSession, payload: proxyPayload, snapshot });
      reserveEnterpriseQuota(task, control);
      const result = await executeManagedProxyRequest(proxyPayload);
      task = settleEnterpriseTask(task.id, result, snapshot) || task;
      settleEnterpriseQuota(task, control);
      const headers = Array.isArray(result.headers) ? [...result.headers] : [];
      headers.push(["x-wanjuan-gateway-task-id", task.id]);
      sendJson(response, 200, { ok: true, task, proxy: { ...result, headers } });
    } catch (error) {
      if (task?.id) {
        task = failEnterpriseTask(task.id, error) || task;
        settleEnterpriseQuota(task, readJson(gatewayControlSnapshotPath(), {}));
      }
      sendJson(response, 400, {
        ok: false,
        code: String(error?.code || "ENTERPRISE_TASK_FAILED"),
        error: formatErrorMessage(error),
      });
    }
    return;
  }

  const taskMatch = request.method === "GET" ? url.pathname.match(/^\/workspace\/tasks\/([^/]+)$/) : null;
  if (taskMatch) {
    const task = getEnterpriseTask(decodeURIComponent(taskMatch[1]), workspaceSession);
    if (!task) sendJson(response, 404, { ok: false, code: "GATEWAY_TASK_NOT_FOUND", error: "企业任务不存在" });
    else sendJson(response, 200, { ok: true, task });
    return;
  }

  if (request.method === "POST" && url.pathname === "/workspace/uploads") {
    try {
      const metadata = parseUploadMetadata(request);
      const result = await executeEnterpriseUpload(request, metadata);
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        code: String(error?.code || "ENTERPRISE_UPLOAD_FAILED"),
        error: formatErrorMessage(error),
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/workspace/logout") {
    revokeWorkspaceSession(request);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname.startsWith("/workspace/tasks")) {
    sendJson(response, 503, {
      ok: false,
      code: "GATEWAY_TASK_PROXY_PENDING",
      error: "企业网关任务代理尚未启用",
    });
    return;
  }
  sendJson(response, 404, { ok: false, code: "NOT_FOUND", error: "接口不存在" });
}

async function listen(server, preferredPort) {
  const ports = Array.from({ length: 12 }, (_, index) => preferredPort + index);
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, "0.0.0.0");
      });
      return port;
    } catch (error) {
      if (error?.code !== "EADDRINUSE") throw error;
    }
  }
  throw new Error("没有可用的企业网关端口");
}

async function startEnterpriseGateway() {
  if (gatewayServer?.listening) return { ok: true, status: getEnterpriseGatewayStatus() };
  const state = loadRuntimeState();
  const identity = readEncryptedJson(gatewayPrivateStatePath());
  if (!state.localGatewayId || !identity?.tlsCertificate || !identity?.tlsPrivateKey) {
    throw new Error("企业网关尚未初始化");
  }
  const server = https.createServer({ cert: identity.tlsCertificate, key: identity.tlsPrivateKey }, (request, response) => {
    handleGatewayRequest(request, response).catch((error) => {
      appendDesktopLog("enterprise-gateway-request-failed", { error: formatErrorMessage(error) });
      if (!response.headersSent) sendJson(response, 500, { ok: false, code: "GATEWAY_INTERNAL_ERROR", error: "网关请求处理失败" });
      else response.end();
    });
  });
  const port = await listen(server, Number(state.port || DEFAULT_GATEWAY_PORT));
  gatewayServer = server;
  gatewayServer.on("close", () => {
    if (gatewayServer === server) gatewayServer = null;
  });
  saveRuntimeState({ port, status: "online", startedAt: Date.now(), lastError: "" });
  if (state.gatewayId && state.accountBaseUrl) startGatewayHeartbeat();
  appendDesktopLog("enterprise-gateway-started", { port, organizationId: state.organizationId || "" });
  return { ok: true, status: getEnterpriseGatewayStatus() };
}

async function stopEnterpriseGateway(options = {}) {
  stopGatewayHeartbeat();
  const server = gatewayServer;
  gatewayServer = null;
  if (server?.listening) {
    await new Promise((resolve) => server.close(() => resolve()));
  }
  const state = loadRuntimeState();
  if (!state.localGatewayId) return { ok: true, status: getEnterpriseGatewayStatus() };
  saveRuntimeState({
    status: "stopped",
    startedAt: 0,
    ...(options.disableAutoStart === true ? { autoStart: false } : {}),
  });
  return { ok: true, status: getEnterpriseGatewayStatus() };
}

async function clearEnterpriseGatewayLocalState() {
  await stopEnterpriseGateway({ disableAutoStart: true });
  stopGatewayHeartbeat();
  runtimeState = null;
  jwksCache = null;
  fs.rmSync(gatewayRoot(), { recursive: true, force: true });
  return { ok: true, status: getEnterpriseGatewayStatus() };
}

async function initializeEnterpriseGateway(payload = {}) {
  validateSnapshot(payload.snapshot);
  if (!canEncrypt()) throw new Error("系统安全存储不可用，不能创建企业网关");
  const organization = payload.organization || {};
  if (!organization.id) throw new Error("缺少企业组织信息");

  const existing = loadRuntimeState();
  const localGatewayId = existing.localGatewayId || `local_${crypto.randomUUID()}`;
  let identity = migrateGatewayIdentity(readEncryptedJson(gatewayPrivateStatePath()));
  if (!identity?.publicKey || !identity?.privateKey || !identity?.tlsCertificate || !identity?.tlsPrivateKey) {
    identity = await generateGatewayIdentity(localGatewayId);
  }
  writeEncryptedJson(gatewayPrivateStatePath(), identity);
  writeEncryptedJson(gatewayVaultPath(), {
    version: 1,
    updatedAt: Date.now(),
    secrets: normalizeSecretEntries(payload.secrets),
  });
  atomicWrite(gatewaySnapshotPath(), JSON.stringify(payload.snapshot, null, 2), { encoding: "utf8", mode: 0o600 });
  saveRuntimeState({
    localGatewayId,
    organizationId: String(organization.id),
    organizationName: String(organization.name || "企业空间"),
    gatewayName: String(payload.gatewayName || "企业网关"),
    accountBaseUrl: String(payload.accountBaseUrl || existing.accountBaseUrl || "").replace(/\/$/, ""),
    certificateFingerprint: identity.certificateFingerprint,
    configVersion: Number(payload.snapshot.version || 1),
    configHash: String(payload.snapshot.hash || ""),
    port: Number(payload.port || existing.port || DEFAULT_GATEWAY_PORT),
    autoStart: payload.autoStart !== false,
    createdAt: existing.createdAt || Date.now(),
    cloudStatus: "pending",
    status: "stopped",
    lastError: "",
  });
  if (payload.autoStart !== false) await startEnterpriseGateway();
  return {
    ok: true,
    status: getEnterpriseGatewayStatus(),
    activation: {
      localGatewayId,
      publicKey: identity.publicKeyBase64,
      certificateFingerprint: identity.certificateFingerprint,
      platform: process.platform,
      appVersion: app.getVersion(),
    },
  };
}

function completeEnterpriseGatewayActivation(payload = {}) {
  const state = saveRuntimeState({
    gatewayId: String(payload.gatewayId || ""),
    cloudStatus: String(payload.status || "active"),
    lastError: "",
  });
  if (gatewayServer?.listening) startGatewayHeartbeat();
  return { ok: true, status: sanitizeGatewayState(state) };
}

async function publishEnterpriseGatewaySnapshot(payload = {}) {
  validateSnapshot(payload.snapshot);
  const state = loadRuntimeState();
  if (!state.localGatewayId) throw new Error("企业网关尚未初始化");
  writeEncryptedJson(gatewayVaultPath(), {
    version: 1,
    updatedAt: Date.now(),
    secrets: normalizeSecretEntries(payload.secrets),
  });
  atomicWrite(gatewaySnapshotPath(), JSON.stringify(payload.snapshot, null, 2), { encoding: "utf8", mode: 0o600 });
  saveRuntimeState({
    configVersion: Number(payload.snapshot.version || Number(state.configVersion || 0) + 1),
    configHash: String(payload.snapshot.hash || ""),
  });
  if (gatewayServer?.listening && state.gatewayId) syncGatewayControlPlane().catch(() => {});
  return { ok: true, status: getEnterpriseGatewayStatus() };
}

async function restoreEnterpriseGatewayOnLaunch() {
  const state = loadRuntimeState();
  if (!state.localGatewayId || state.autoStart === false) return getEnterpriseGatewayStatus();
  try {
    await startEnterpriseGateway();
  } catch (error) {
    saveRuntimeState({ status: "error", lastError: formatErrorMessage(error) });
  }
  return getEnterpriseGatewayStatus();
}

module.exports = {
  clearEnterpriseGatewayLocalState,
  completeEnterpriseGatewayActivation,
  executeManagedProxyRequest,
  getEnterpriseGatewayManagementSnapshot,
  getEnterpriseGatewayStatus,
  initializeEnterpriseGateway,
  invokeEnterpriseTeamTemplatesAsHost,
  publishEnterpriseGatewaySnapshot,
  restoreEnterpriseGatewayOnLaunch,
  startEnterpriseGateway,
  stopEnterpriseGateway,
  syncGatewayControlPlane,
};
