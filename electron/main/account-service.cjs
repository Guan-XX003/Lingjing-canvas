// Account and private-workspace boundary. Secrets stay in the main process and are
// encrypted with Electron safeStorage; renderer callers receive sanitized state only.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const { app } = require("./electron-refs.cjs");
const { decryptLocalSecret, encryptLocalSecret, secretStorageMode } = require("./local-secret-storage.cjs");
const { readOrCreateAccountDevice } = require("./account-device.cjs");
const {
  clearEnterpriseGatewayLocalState,
  completeEnterpriseGatewayActivation,
  getEnterpriseGatewayManagementSnapshot,
  getEnterpriseGatewayStatus,
  initializeEnterpriseGateway,
  publishEnterpriseGatewaySnapshot,
  startEnterpriseGateway,
  stopEnterpriseGateway,
  syncGatewayControlPlane,
} = require("./enterprise-gateway.cjs");
const {
  clearEnterpriseSnapshotCache,
  readEnterpriseSnapshotCache,
  requestPinnedJson,
  requestPinnedUpload,
  writeEnterpriseSnapshotCache,
} = require("./enterprise-gateway-client.cjs");
const { createEnterpriseUploadSource } = require("./enterprise-upload-source.cjs");

const ACCOUNT_STATE_VERSION = 2;
const ACCOUNT_REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_OFFLINE_GRACE_MS = 72 * 60 * 60 * 1000;
const WANJUAN_ACCOUNT_DEFAULT_API_URL = "https://account.guancn.uk";
const SESSION_INVALID_CODES = new Set([
  "ACCOUNT_DISABLED",
  "DEVICE_REVOKED",
  "SESSION_REVOKED",
  "INVALID_ACCESS_TOKEN",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_REPLAY",
]);

let accessToken = "";
let accountStateCache = null;
let refreshPromise = null;
let accountOrganizationsCache = [];

class AccountRequestError extends Error {
  constructor(message, options = {}) {
    super(String(message || "账号服务请求失败"));
    this.name = "AccountRequestError";
    this.status = Number(options.status || 0);
    this.code = String(options.code || "ACCOUNT_REQUEST_FAILED");
    this.network = options.network === true;
    this.details = options.details && typeof options.details === "object" ? options.details : null;
  }
}

function accountStatePath() {
  return path.join(app.getPath("userData"), "account-session.json");
}

function defaultAccountState() {
  return {
    version: ACCOUNT_STATE_VERSION,
    // 新安装默认进入本地模式；账号登录必须由用户主动触发。
    onboardingComplete: true,
    localMode: true,
    user: null,
    subscription: null,
    entitlements: [],
    wallet: null,
    device: null,
    session: null,
    enterprise: null,
    updatedAt: 0,
    lastVerifiedAt: 0,
  };
}

function readAccountState() {
  if (accountStateCache) return accountStateCache;
  try {
    const parsed = JSON.parse(fs.readFileSync(accountStatePath(), "utf8"));
    accountStateCache = { ...defaultAccountState(), ...(parsed || {}) };
  } catch {
    accountStateCache = defaultAccountState();
  }
  // 旧版未登录状态曾要求 onboarding；升级后统一回到可操作本地模式，
  // 不自动打开账号界面，也不影响已有登录会话。
  if (!accountStateCache.user && !accountStateCache.session?.refreshTokenEncrypted) {
    accountStateCache.onboardingComplete = true;
    accountStateCache.localMode = true;
  }
  return accountStateCache;
}

function writeAccountState(patch = {}) {
  const next = {
    ...readAccountState(),
    ...patch,
    version: ACCOUNT_STATE_VERSION,
    updatedAt: Date.now(),
  };
  const target = accountStatePath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(next, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, target);
  accountStateCache = next;
  return next;
}

function canEncryptSecrets() {
  return secretStorageMode() !== "unavailable";
}

function encryptSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  if (!canEncryptSecrets()) throw new Error("系统安全存储不可用，登录令牌未保存");
  return encryptLocalSecret(text);
}

function decryptSecret(value) {
  const encoded = String(value || "");
  if (!encoded || !canEncryptSecrets()) return "";
  try {
    return decryptLocalSecret(encoded);
  } catch {
    return "";
  }
}

function isPrivateLanHostname(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (["127.0.0.1", "localhost", "::1"].includes(host) || host.endsWith(".local")) return true;
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}

function normalizeBaseUrl(value, options = {}) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  const parsed = new URL(raw);
  const allowLocalhostHttp = parsed.protocol === "http:" && ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
  const allowPrivateHttp = options.allowPrivateHttp === true && parsed.protocol === "http:" && isPrivateLanHostname(parsed.hostname);
  if (parsed.protocol !== "https:" && !allowLocalhostHttp && !allowPrivateHttp) {
    throw new Error(options.allowPrivateHttp ? "企业网关必须使用 HTTPS 或局域网私有地址" : "账号服务必须使用 HTTPS；开发环境仅允许 localhost HTTP");
  }
  return parsed.href.replace(/\/$/, "");
}

function accountApiUrl() {
  try {
    return normalizeBaseUrl(process.env.WANJUAN_ACCOUNT_API_URL || WANJUAN_ACCOUNT_DEFAULT_API_URL);
  } catch {
    return "";
  }
}

function sanitizeAccountState(state = readAccountState(), extra = {}) {
  const now = Date.now();
  const authenticated = !!state.user && (!!accessToken || !!state.session?.refreshTokenEncrypted);
  const offlineGraceUntil = Number(state.lastVerifiedAt || 0) + DEFAULT_OFFLINE_GRACE_MS;
  const gatewayHost = getEnterpriseGatewayStatus();
  const ownedEnterprises = accountOrganizationsCache.filter((item) =>
    item.role === "owner" && item.organizationType === "self_hosted" && item.membershipStatus === "active"
  );
  const ownedEnterprise = ownedEnterprises.find((item) => item.id === gatewayHost.organizationId) || ownedEnterprises[0] || null;
  return {
    ok: true,
    serviceConfigured: !!accountApiUrl(),
    secureStorageAvailable: canEncryptSecrets(),
    secureStorageMode: secretStorageMode(),
    onboardingComplete: state.onboardingComplete === true,
    localMode: state.localMode === true,
    authenticated,
    offline: !!extra.offline,
    offlineGraceUntil,
    offlineGraceActive: authenticated && now <= offlineGraceUntil,
    user: state.user || null,
    subscription: state.subscription || null,
    entitlements: Array.isArray(state.entitlements) ? state.entitlements : [],
    wallet: state.wallet || null,
    device: state.device || null,
    enterprise: state.enterprise ? {
      mode: state.enterprise.mode || "member",
      organization: state.enterprise.organization || null,
      gatewayId: state.enterprise.gatewayId || "",
      gatewayUrl: state.enterprise.gatewayUrl || "",
      certificateFingerprint: state.enterprise.certificateFingerprint || "",
      connectedAt: state.enterprise.connectedAt || 0,
      lastVerifiedAt: state.enterprise.lastVerifiedAt || 0,
      expiresAt: Number(state.enterprise.expiresAt || 0),
      connected: state.enterprise.mode === "host" ? gatewayHost.initialized :
        !!state.enterprise.workspaceTokenEncrypted && Number(state.enterprise.expiresAt || 0) > now,
    } : null,
    enterpriseSnapshot: state.enterprise?.mode === "member" ? readEnterpriseSnapshotCache()?.snapshot || null : null,
    gatewayHost,
    ownedEnterprise,
    requiresLogin: extra.requiresLogin === true,
    error: extra.error || "",
    errorCode: extra.errorCode || "",
    errorStatus: Number(extra.errorStatus || 0),
  };
}

function reconcileLocalGatewayHostState(state = readAccountState()) {
  const gatewayHost = getEnterpriseGatewayStatus();
  if (!gatewayHost.initialized || !gatewayHost.organizationId || !gatewayHost.gatewayId) return state;

  const ownedEnterprise = accountOrganizationsCache.find((item) =>
    item.id === gatewayHost.organizationId &&
    item.role === "owner" &&
    item.organizationType === "self_hosted" &&
    item.membershipStatus === "active"
  );
  if (!ownedEnterprise) return state;

  // Never revive a stale local identity after another computer has taken over.
  if (ownedEnterprise.gatewayId && ownedEnterprise.gatewayId !== gatewayHost.gatewayId) return state;
  if (
    ownedEnterprise.certificateFingerprint &&
    gatewayHost.certificateFingerprint &&
    ownedEnterprise.certificateFingerprint !== gatewayHost.certificateFingerprint
  ) return state;

  const current = state.enterprise;
  const alreadyCurrent =
    current?.mode === "host" &&
    String(current.organization?.id || "") === gatewayHost.organizationId &&
    String(current.gatewayId || "") === gatewayHost.gatewayId;
  if (alreadyCurrent) return state;

  // An explicitly connected membership for another organization remains authoritative.
  const activeMemberConnection =
    current?.mode === "member" &&
    String(current.organization?.id || "") !== gatewayHost.organizationId &&
    !!current.workspaceTokenEncrypted &&
    Number(current.expiresAt || 0) > Date.now();
  if (activeMemberConnection) return state;

  return writeAccountState({
    enterprise: {
      mode: "host",
      organization: { ...ownedEnterprise, role: "owner" },
      gatewayId: gatewayHost.gatewayId,
      gatewayUrl: gatewayHost.preferredUrl,
      connectedAt: Number(current?.connectedAt || gatewayHost.createdAt || Date.now()),
      lastVerifiedAt: Date.now(),
      expiresAt: 0,
    },
  });
}

async function requestJson(baseUrl, pathname, options = {}) {
  const url = `${normalizeBaseUrl(baseUrl, { allowPrivateHttp: options.allowPrivateHttp === true })}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || ACCOUNT_REQUEST_TIMEOUT_MS));
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        accept: "application/json",
        ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers && typeof options.headers === "object" ? options.headers : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const contentType = String(response.headers.get("content-type") || "");
    const payload = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
      throw new AccountRequestError(payload?.error || payload?.message || `请求失败 (${response.status})`, {
        status: response.status,
        code: payload?.code || `HTTP_${response.status}`,
        details: payload?.details && typeof payload.details === "object" ? payload.details : payload,
      });
    }
    return payload || {};
  } catch (error) {
    if (error instanceof AccountRequestError) throw error;
    if (error?.name === "AbortError") {
      throw new AccountRequestError("连接服务超时", { code: "ACCOUNT_REQUEST_TIMEOUT", network: true });
    }
    throw new AccountRequestError(error?.message || "无法连接账号服务", {
      code: "ACCOUNT_NETWORK_ERROR",
      network: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isSessionInvalidError(error) {
  return SESSION_INVALID_CODES.has(String(error?.code || ""));
}

function isOfflineEligibleError(error) {
  return error?.network === true || Number(error?.status || 0) >= 500;
}

function clearInvalidAccountSession(error) {
  accessToken = "";
  accountOrganizationsCache = [];
  stopEnterpriseGateway({ disableAutoStart: true }).catch(() => {});
  clearEnterpriseSnapshotCache();
  const next = writeAccountState({
    localMode: true,
    user: null,
    subscription: null,
    entitlements: [],
    wallet: null,
    device: null,
    session: null,
    enterprise: null,
    lastVerifiedAt: 0,
  });
  return sanitizeAccountState(next, {
    requiresLogin: true,
    error: error?.message || "登录状态已失效，请重新登录",
    errorCode: error?.code || "SESSION_REVOKED",
    errorStatus: error?.status || 401,
  });
}

function applyAccountPayload(payload = {}, tokens = {}) {
  const state = readAccountState();
  const refreshToken = String(tokens.refreshToken || payload.refreshToken || "");
  accessToken = String(tokens.accessToken || payload.accessToken || accessToken || "");
  const session = refreshToken ? {
    refreshTokenEncrypted: encryptSecret(refreshToken),
    issuedAt: Date.now(),
  } : state.session;
  return writeAccountState({
    onboardingComplete: true,
    localMode: false,
    user: payload.user || state.user || null,
    subscription: payload.subscription || state.subscription || null,
    entitlements: Array.isArray(payload.entitlements) ? payload.entitlements : state.entitlements || [],
    wallet: payload.wallet || state.wallet || null,
    device: payload.device || state.device || null,
    session,
    lastVerifiedAt: Date.now(),
  });
}

async function performRefreshAccountSession() {
  const baseUrl = accountApiUrl();
  const state = readAccountState();
  const refreshToken = decryptSecret(state.session?.refreshTokenEncrypted);
  if (!baseUrl || !refreshToken) return sanitizeAccountState(state);
  const payload = await requestJson(baseUrl, "/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  const next = applyAccountPayload(payload);
  return sanitizeAccountState(next);
}

async function refreshAccountSession() {
  if (!refreshPromise) {
    refreshPromise = performRefreshAccountSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function requestWithAccountAuth(baseUrl, pathname, options = {}) {
  if (!accessToken && readAccountState().session?.refreshTokenEncrypted) {
    await refreshAccountSession();
  }
  if (!accessToken) throw new AccountRequestError("请先登录万卷灵境账号", { status: 401, code: "AUTH_REQUIRED" });
  try {
    return await requestJson(baseUrl, pathname, { ...options, token: accessToken });
  } catch (error) {
    if (options.retryAfterRefresh === false || String(error?.code || "") !== "ACCESS_TOKEN_EXPIRED") throw error;
    await refreshAccountSession();
    return requestJson(baseUrl, pathname, { ...options, retryAfterRefresh: false, token: accessToken });
  }
}

function normalizeAccountOrganization(item = {}) {
  return {
    id: String(item.id || ""),
    name: String(item.name || ""),
    status: String(item.status || ""),
    organizationType: String(item.organizationType || item.organization_type || ""),
    timezone: String(item.timezone || "Asia/Shanghai"),
    policyVersion: Number(item.policyVersion || item.policy_version || 0),
    role: String(item.role || "member"),
    membershipStatus: String(item.membershipStatus || item.membership_status || "active"),
    gatewayId: String(item.gatewayId || item.gateway_id || ""),
    gatewayName: String(item.gatewayName || item.gateway_name || ""),
    gatewayStatus: String(item.gatewayStatus || item.gateway_status || ""),
    gatewayLastSeenAt: item.gatewayLastSeenAt || item.last_seen_at || null,
    configVersion: Number(item.configVersion || item.config_version || 0),
    configHash: String(item.configHash || item.config_hash || ""),
    certificateFingerprint: String(item.certificateFingerprint || item.certificate_fingerprint || ""),
  };
}

async function refreshAccountOrganizations(options = {}) {
  if (!accessToken && !readAccountState().session?.refreshTokenEncrypted) {
    accountOrganizationsCache = [];
    return accountOrganizationsCache;
  }
  try {
    const response = await requestWithAccountAuth(accountApiUrl(), "/me/organizations");
    accountOrganizationsCache = (Array.isArray(response.items) ? response.items : [])
      .map(normalizeAccountOrganization)
      .filter((item) => item.id);
  } catch (error) {
    if (options.required === true) throw error;
  }
  return accountOrganizationsCache;
}

async function getCurrentAccount() {
  const baseUrl = accountApiUrl();
  if (!baseUrl || (!accessToken && !readAccountState().session?.refreshTokenEncrypted)) return sanitizeAccountState();
  try {
    const payload = await requestWithAccountAuth(baseUrl, "/me");
    applyAccountPayload(payload);
    await refreshAccountOrganizations();
    return sanitizeAccountState(reconcileLocalGatewayHostState());
  } catch (error) {
    if (isSessionInvalidError(error)) return clearInvalidAccountSession(error);
    throw error;
  }
}

async function bootstrapAccount() {
  const state = readAccountState();
  if (!state.session?.refreshTokenEncrypted || !accountApiUrl()) return sanitizeAccountState(state);
  try {
    await refreshAccountSession();
    await getCurrentAccount();
    const enterprise = readAccountState().enterprise;
    if (enterprise?.mode === "member" && (!enterprise.workspaceTokenEncrypted || Number(enterprise.expiresAt || 0) <= Date.now())) {
      try {
        return await reconnectEnterpriseWorkspace();
      } catch (error) {
        return sanitizeAccountState(readAccountState(), {
          offline: true,
          error: error?.message || "企业网关暂时不可用",
          errorCode: error?.code || "GATEWAY_OFFLINE",
          errorStatus: error?.status || 0,
        });
      }
    }
    return sanitizeAccountState();
  } catch (error) {
    if (isSessionInvalidError(error)) return clearInvalidAccountSession(error);
    if (isOfflineEligibleError(error)) {
      return sanitizeAccountState(readAccountState(), {
        offline: true,
        error: error?.message || String(error),
        errorCode: error?.code || "ACCOUNT_NETWORK_ERROR",
        errorStatus: error?.status || 0,
      });
    }
    return clearInvalidAccountSession(error);
  }
}

function normalizeAccountEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new AccountRequestError("请输入有效的邮箱地址", { status: 400, code: "INVALID_EMAIL" });
  }
  return email;
}

async function sendAccountCode(payload = {}) {
  const identifier = normalizeAccountEmail(payload.identifier);
  return requestJson(accountApiUrl(), "/auth/send-code", {
    method: "POST",
    body: { identifier, purpose: payload.purpose || "login" },
  });
}

async function loginAccount(payload = {}) {
  const identifier = normalizeAccountEmail(payload.identifier);
  const device = readOrCreateAccountDevice();
  const result = await requestJson(accountApiUrl(), payload.register ? "/auth/register" : "/auth/login", {
    method: "POST",
    body: {
      identifier,
      code: String(payload.code || "").trim(),
      inviteCode: String(payload.inviteCode || "").trim(),
      deviceName: device.deviceName,
      deviceFingerprint: device.installationId,
      platform: device.platform,
    },
  });
  applyAccountPayload(result);
  await refreshAccountOrganizations();
  return sanitizeAccountState(reconcileLocalGatewayHostState());
}

function continueWithLocalMode() {
  return sanitizeAccountState(writeAccountState({ onboardingComplete: true, localMode: true }));
}

async function logoutAccount() {
  const baseUrl = accountApiUrl();
  const state = readAccountState();
  const refreshToken = decryptSecret(state.session?.refreshTokenEncrypted);
  if (baseUrl && (accessToken || refreshToken)) {
    try {
      await requestJson(baseUrl, "/auth/logout", {
        method: "POST",
        token: accessToken,
        body: refreshToken ? { refreshToken } : {},
      });
    } catch {}
  }
  try {
    await stopEnterpriseGateway({ disableAutoStart: true });
  } catch {}
  clearEnterpriseSnapshotCache();
  accessToken = "";
  accountOrganizationsCache = [];
  const next = writeAccountState({
    localMode: true,
    user: null,
    subscription: null,
    entitlements: [],
    wallet: null,
    device: null,
    session: null,
    enterprise: null,
    lastVerifiedAt: 0,
  });
  return sanitizeAccountState(next);
}

async function activateEnterpriseGatewayLocally({ organization, registrationToken, payload = {}, replaced = false }) {
  const device = readOrCreateAccountDevice();
  if (!organization?.id || !registrationToken) {
    throw new AccountRequestError("账号服务器返回的网关登记数据不完整", {
      code: "GATEWAY_REGISTRATION_RESPONSE_INVALID",
    });
  }
  const localGateway = await initializeEnterpriseGateway({
    organization,
    gatewayName: payload.gatewayName,
    accountBaseUrl: accountApiUrl(),
    snapshot: payload.snapshot,
    secrets: payload.secrets,
    autoStart: payload.autoStart !== false,
  });
  const activation = await requestWithAccountAuth(
    accountApiUrl(),
    `/organizations/${encodeURIComponent(organization.id)}/gateways/activate`,
    {
      method: "POST",
      body: {
        registrationToken,
        gatewayName: String(payload.gatewayName || "企业网关"),
        deviceId: String(readAccountState().device?.id || device.installationId),
        publicKey: localGateway.activation.publicKey,
        certificateFingerprint: localGateway.activation.certificateFingerprint,
        appVersion: localGateway.activation.appVersion,
        platform: localGateway.activation.platform,
      },
    },
  );
  const gatewayId = String(activation.gatewayId || "");
  if (!gatewayId) throw new AccountRequestError("网关激活结果缺少 Gateway ID", { code: "GATEWAY_ACTIVATION_INVALID" });
  completeEnterpriseGatewayActivation({ gatewayId, status: activation.status || "active" });

  let inviteCode = "";
  try {
    const invite = await requestWithAccountAuth(
      accountApiUrl(),
      `/organizations/${encodeURIComponent(organization.id)}/invites`,
      {
        method: "POST",
        body: {
          role: "member",
          maxUses: Math.max(1, Number(payload.inviteMaxUses || 20)),
          expiresAt: payload.inviteExpiresAt || null,
        },
      },
    );
    inviteCode = String(invite.inviteCode || invite.code || "");
  } catch {}

  const gatewayStatus = getEnterpriseGatewayStatus();
  const next = writeAccountState({
    enterprise: {
      mode: "host",
      organization: { ...organization, role: organization.role || "owner" },
      gatewayId,
      gatewayUrl: gatewayStatus.preferredUrl,
      connectedAt: Date.now(),
      lastVerifiedAt: Date.now(),
      expiresAt: 0,
    },
  });
  try { await refreshAccountOrganizations(); } catch {}
  return {
    ...sanitizeAccountState(next),
    creationResult: {
      organization,
      gateway: gatewayStatus,
      inviteCode,
      replaced,
    },
  };
}

async function createEnterpriseGateway(payload = {}) {
  const device = readOrCreateAccountDevice();
  const operationId = String(payload.operationId || crypto.randomUUID());
  const defaultQuotas = (Array.isArray(payload.defaultQuotas) ? payload.defaultQuotas : []).map((item) => {
    const capabilityKey = String(item?.capabilityKey || item?.capability || item?.capability_key || "").trim();
    const rawUnit = String(item?.unit || "");
    const unit = ["successful_requests", "successful_outputs", "successful_tasks"].includes(rawUnit)
      ? rawUnit
      : capabilityKey === "text_generation"
        ? "successful_requests"
        : capabilityKey === "image_generation"
          ? "successful_outputs"
          : "successful_tasks";
    const rawLimit = item?.limitValue ?? item?.limit ?? item?.limit_value;
    return {
      capabilityKey,
      enabled: item?.enabled !== false,
      limitValue: rawLimit === null || rawLimit === undefined || rawLimit === "" ? null : Math.max(0, Number(rawLimit)),
      unit,
    };
  }).filter((item) => item.capabilityKey);
  const organizationResponse = await requestWithAccountAuth(accountApiUrl(), "/organizations/self-hosted", {
    method: "POST",
    headers: { "idempotency-key": operationId },
    body: {
      name: String(payload.organizationName || "").trim(),
      gatewayName: String(payload.gatewayName || "").trim(),
      timezone: String(payload.timezone || "Asia/Shanghai"),
      deviceId: String(readAccountState().device?.id || device.installationId),
      operationId,
      defaultQuotas,
    },
  });
  const organization = organizationResponse.organization;
  const registrationToken = String(organizationResponse.gatewayRegistration?.token || "");
  if (!organization?.id || !registrationToken) {
    throw new AccountRequestError("账号服务器返回的企业创建数据不完整", {
      code: "ENTERPRISE_CREATE_RESPONSE_INVALID",
    });
  }
  const localGatewayStatus = getEnterpriseGatewayStatus();
  if (localGatewayStatus.initialized && localGatewayStatus.organizationId !== String(organization.id)) {
    await clearEnterpriseGatewayLocalState();
  }
  return activateEnterpriseGatewayLocally({ organization, registrationToken, payload, replaced: false });
}

async function takeOverEnterpriseGateway(payload = {}) {
  const device = readOrCreateAccountDevice();
  const organizationId = String(payload.organizationId || sanitizeAccountState().ownedEnterprise?.id || "");
  if (!organizationId) {
    throw new AccountRequestError("当前账号没有可接管的自托管企业", { code: "OWNED_ENTERPRISE_NOT_FOUND" });
  }
  const operationId = String(payload.operationId || crypto.randomUUID());
  const response = await requestWithAccountAuth(
    accountApiUrl(),
    `/organizations/${encodeURIComponent(organizationId)}/gateways/takeover`,
    {
      method: "POST",
      headers: { "idempotency-key": operationId },
      body: {
        deviceId: String(readAccountState().device?.id || device.installationId),
        gatewayName: String(payload.gatewayName || "企业网关"),
        operationId,
      },
    },
  );
  const organization = response.organization || accountOrganizationsCache.find((item) => item.id === organizationId);
  const registrationToken = String(response.gatewayRegistration?.token || "");
  if (!organization?.id || !registrationToken) {
    throw new AccountRequestError("账号服务器返回的网关接管数据不完整", { code: "GATEWAY_TAKEOVER_RESPONSE_INVALID" });
  }
  await clearEnterpriseGatewayLocalState();
  return activateEnterpriseGatewayLocally({ organization, registrationToken, payload, replaced: true });
}

async function releaseCreatedEnterpriseGateway(payload = {}) {
  const state = readAccountState();
  const enterprise = state.enterprise;
  const organizationId = String(payload.organizationId || enterprise?.organization?.id || "");
  const gatewayId = String(payload.gatewayId || enterprise?.gatewayId || "");
  if (enterprise?.mode !== "host" || !organizationId || !gatewayId) {
    throw new AccountRequestError("当前电脑不是可移除的企业主网关", { code: "ENTERPRISE_HOST_REQUIRED" });
  }
  await requestWithAccountAuth(
    accountApiUrl(),
    `/organizations/${encodeURIComponent(organizationId)}/gateways/${encodeURIComponent(gatewayId)}/revoke`,
    {
      method: "POST",
      body: {
        deviceId: String(state.device?.id || readOrCreateAccountDevice().installationId),
        reason: "owner_release",
      },
    },
  );
  await clearEnterpriseGatewayLocalState();
  clearEnterpriseSnapshotCache();
  const next = writeAccountState({ enterprise: null });
  try { await refreshAccountOrganizations(); } catch {}
  return sanitizeAccountState(next);
}

async function publishEnterpriseGatewayConfig(payload = {}) {
  await publishEnterpriseGatewaySnapshot(payload);
  return sanitizeAccountState();
}

function currentEnterpriseOrganization() {
  const enterprise = readAccountState().enterprise;
  const organizationId = String(enterprise?.organization?.id || "");
  if (!organizationId) throw new AccountRequestError("当前没有可管理的企业", { code: "ENTERPRISE_NOT_CONNECTED" });
  return { enterprise, organizationId };
}

async function refreshHostControlSnapshot(enterprise) {
  if (enterprise?.mode !== "host") return;
  try { await syncGatewayControlPlane(); } catch {}
}

async function getEnterpriseManagement() {
  const { enterprise, organizationId } = currentEnterpriseOrganization();
  const members = await requestWithAccountAuth(accountApiUrl(), `/organizations/${encodeURIComponent(organizationId)}/members`);
  await refreshHostControlSnapshot(enterprise);
  const local = enterprise.mode === "host" ? getEnterpriseGatewayManagementSnapshot() : {};
  return {
    ok: true,
    organization: enterprise.organization,
    requesterRole: String(members.requesterRole || enterprise.organization?.role || "member"),
    policyVersion: Number(members.policyVersion || local.policyVersion || 0),
    members: Array.isArray(members.items) ? members.items : [],
    quotaDefaults: Array.isArray(local.quotaDefaults) ? local.quotaDefaults : [],
    memberQuotaOverrides: Array.isArray(local.memberQuotaOverrides) ? local.memberQuotaOverrides : [],
    usage: local.usage || null,
    activeTasks: Number(local.activeTasks || 0),
    timezone: String(local.timezone || "Asia/Shanghai"),
    quotaReadableFromHost: enterprise.mode === "host",
  };
}

async function updateEnterpriseMember(payload = {}) {
  const { enterprise, organizationId } = currentEnterpriseOrganization();
  const userId = String(payload.userId || "");
  if (!userId) throw new AccountRequestError("缺少企业成员 ID", { code: "ENTERPRISE_MEMBER_REQUIRED" });
  await requestWithAccountAuth(accountApiUrl(), `/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: {
      ...(payload.role ? { role: String(payload.role) } : {}),
      ...(payload.status ? { status: String(payload.status) } : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "expiresAt") ? { expiresAt: payload.expiresAt || null } : {}),
    },
  });
  await refreshHostControlSnapshot(enterprise);
  return getEnterpriseManagement();
}

async function removeEnterpriseMember(payload = {}) {
  const { enterprise, organizationId } = currentEnterpriseOrganization();
  const userId = String(payload.userId || "");
  if (!userId) throw new AccountRequestError("缺少企业成员 ID", { code: "ENTERPRISE_MEMBER_REQUIRED" });
  await requestWithAccountAuth(accountApiUrl(), `/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`, { method: "DELETE" });
  await refreshHostControlSnapshot(enterprise);
  return getEnterpriseManagement();
}

async function updateEnterpriseQuotaDefault(payload = {}) {
  const { enterprise, organizationId } = currentEnterpriseOrganization();
  await requestWithAccountAuth(accountApiUrl(), `/organizations/${encodeURIComponent(organizationId)}/quota-defaults`, {
    method: "PUT",
    body: {
      capabilityKey: String(payload.capabilityKey || ""),
      enabled: payload.enabled !== false,
      limitValue: payload.limitValue === null || payload.limitValue === undefined ? null : Math.max(0, Number(payload.limitValue)),
      unit: String(payload.unit || "successful_tasks"),
    },
  });
  await refreshHostControlSnapshot(enterprise);
  return getEnterpriseManagement();
}

async function updateEnterpriseMemberQuota(payload = {}) {
  const { enterprise, organizationId } = currentEnterpriseOrganization();
  await requestWithAccountAuth(accountApiUrl(), `/organizations/${encodeURIComponent(organizationId)}/quota-overrides`, {
    method: "PUT",
    body: {
      userId: String(payload.userId || ""),
      capabilityKey: String(payload.capabilityKey || ""),
      mode: String(payload.mode || "inherit"),
      limitValue: payload.limitValue === null || payload.limitValue === undefined ? null : Math.max(0, Number(payload.limitValue)),
      startsAt: payload.startsAt || null,
      expiresAt: payload.expiresAt || null,
    },
  });
  await refreshHostControlSnapshot(enterprise);
  return getEnterpriseManagement();
}

async function startCreatedEnterpriseGateway() {
  await startEnterpriseGateway();
  return sanitizeAccountState();
}

async function stopCreatedEnterpriseGateway() {
  await stopEnterpriseGateway();
  return sanitizeAccountState();
}

async function establishEnterpriseWorkspace(payload = {}) {
  const gatewayUrl = String(payload.gatewayUrl || "").trim();
  const gateway = payload.gateway || {};
  const organization = payload.organization || {};
  const certificateFingerprint = String(gateway.certificateFingerprint || payload.certificateFingerprint || "");
  const deviceId = String(payload.deviceId || "");
  const sessionResponse = await requestPinnedJson(gatewayUrl, "/workspace/session", {
    method: "POST",
    token: accessToken,
    certificateFingerprint,
    body: {
      signedGatewayGrant: String(payload.signedGatewayGrant || ""),
      deviceId,
      appVersion: app.getVersion(),
    },
  });
  const session = sessionResponse.value || {};
  const workspaceToken = String(session.workspaceToken || "");
  if (!workspaceToken || !organization.id || !gateway.id) {
    throw new AccountRequestError("企业网关返回的数据不完整", { code: "WORKSPACE_SESSION_INVALID" });
  }
  const snapshotResponse = await requestPinnedJson(gatewayUrl, "/workspace/config-snapshot", {
    token: workspaceToken,
    certificateFingerprint,
  });
  const snapshot = snapshotResponse.value;
  if (!snapshot?.schemaVersion || !snapshot?.modules?.settings?.chromeStorage) {
    throw new AccountRequestError("企业配置快照格式不正确", { code: "ENTERPRISE_CONFIG_INVALID" });
  }
  writeEnterpriseSnapshotCache({
    organizationId: String(organization.id),
    gatewayId: String(gateway.id),
    gatewayUrl,
    certificateFingerprint,
    snapshot,
    cachedAt: Date.now(),
  });
  const next = writeAccountState({
    enterprise: {
      mode: "member",
      organization,
      gatewayId: String(gateway.id),
      gatewayUrl,
      certificateFingerprint,
      workspaceTokenEncrypted: encryptSecret(workspaceToken),
      connectedAt: Date.now(),
      lastVerifiedAt: Date.now(),
      expiresAt: Date.now() + Math.max(60, Number(session.expiresIn || 28800)) * 1000,
      configVersion: Number(snapshot.version || session.snapshotVersion || 0),
      configHash: String(snapshot.hash || session.configHash || ""),
    },
  });
  return sanitizeAccountState(next);
}

async function connectEnterpriseWorkspace(payload = {}) {
  const deviceId = String(payload.deviceId || readAccountState().device?.id || "");
  try {
    const joined = await requestWithAccountAuth(accountApiUrl(), "/organizations/join", {
      method: "POST",
      body: {
        inviteCode: String(payload.inviteCode || "").trim(),
        deviceId,
      },
    });
    return await establishEnterpriseWorkspace({
      ...joined,
      gatewayUrl: payload.gatewayUrl,
      deviceId,
    });
  } catch (error) {
    if (isSessionInvalidError(error)) return clearInvalidAccountSession(error);
    throw error;
  }
}

async function reconnectEnterpriseWorkspace() {
  const state = readAccountState();
  const enterprise = state.enterprise;
  if (enterprise?.mode !== "member" || !enterprise.organization?.id || !enterprise.gatewayUrl) {
    return sanitizeAccountState(state);
  }
  const deviceId = String(state.device?.id || "");
  const grant = await requestWithAccountAuth(
    accountApiUrl(),
    `/organizations/${encodeURIComponent(enterprise.organization.id)}/gateway-grant`,
    { method: "POST", body: { deviceId } },
  );
  return establishEnterpriseWorkspace({
    organization: enterprise.organization,
    gateway: grant.gateway,
    signedGatewayGrant: grant.signedGatewayGrant,
    gatewayUrl: enterprise.gatewayUrl,
    deviceId,
  });
}

async function refreshEnterpriseWorkspaceConfig() {
  const state = readAccountState();
  const enterprise = state.enterprise;
  if (enterprise?.mode !== "member" || !enterprise.gatewayUrl || !enterprise.certificateFingerprint) {
    return sanitizeAccountState(state);
  }
  const workspaceToken = decryptSecret(enterprise.workspaceTokenEncrypted);
  if (!workspaceToken || Number(enterprise.expiresAt || 0) <= Date.now()) return reconnectEnterpriseWorkspace();
  try {
    const response = await requestPinnedJson(enterprise.gatewayUrl, "/workspace/config-snapshot", {
      token: workspaceToken,
      certificateFingerprint: enterprise.certificateFingerprint,
      headers: enterprise.configHash ? { "if-none-match": `"${String(enterprise.configHash).replace(/^sha256:/, "")}"` } : {},
    });
    const snapshot = response.value;
    if (snapshot?.modules?.settings?.chromeStorage) {
      writeEnterpriseSnapshotCache({
        organizationId: String(enterprise.organization?.id || ""),
        gatewayId: String(enterprise.gatewayId || ""),
        gatewayUrl: enterprise.gatewayUrl,
        certificateFingerprint: enterprise.certificateFingerprint,
        snapshot,
        cachedAt: Date.now(),
      });
      writeAccountState({
        enterprise: {
          ...enterprise,
          lastVerifiedAt: Date.now(),
          configVersion: Number(snapshot.version || 0),
          configHash: String(snapshot.hash || ""),
        },
      });
    }
    return sanitizeAccountState();
  } catch (error) {
    if (error?.status === 304) return sanitizeAccountState();
    if (error?.code === "WORKSPACE_SESSION_EXPIRED") return reconnectEnterpriseWorkspace();
    throw error;
  }
}

async function disconnectEnterpriseWorkspace() {
  const enterprise = readAccountState().enterprise;
  if (enterprise?.mode === "host") {
    try {
      await stopEnterpriseGateway({ disableAutoStart: true });
    } catch {}
  } else if (enterprise?.gatewayUrl && enterprise?.workspaceTokenEncrypted) {
    try {
      await requestPinnedJson(enterprise.gatewayUrl, "/workspace/logout", {
        method: "POST",
        token: decryptSecret(enterprise.workspaceTokenEncrypted),
        certificateFingerprint: enterprise.certificateFingerprint,
      });
    } catch {}
  }
  clearEnterpriseSnapshotCache();
  return sanitizeAccountState(writeAccountState({ enterprise: null }));
}

function resetAccountOnboarding() {
  const state = readAccountState();
  return sanitizeAccountState(writeAccountState({
    onboardingComplete: false,
    localMode: false,
    user: state.user,
  }));
}

function getEnterpriseStorageOverlay() {
  const state = readAccountState();
  const cache = readEnterpriseSnapshotCache();
  if (state.enterprise?.mode !== "member" || !cache?.snapshot?.modules?.settings?.chromeStorage) {
    return { active: false, settings: {}, version: 0, hash: "" };
  }
  return {
    active: true,
    settings: cache.snapshot.modules.settings.chromeStorage,
    version: Number(cache.snapshot.version || 0),
    hash: String(cache.snapshot.hash || ""),
  };
}

function listEnterpriseManagedApiConfigs(snapshot) {
  const settings = snapshot?.modules?.settings?.chromeStorage || {};
  const configured = (Array.isArray(settings.apiConfigs) ? settings.apiConfigs : [])
    .filter((item) => item && (item.url || item.apiUrl))
    .map((item) => ({ ...item, id: String(item.id || ""), url: String(item.url || item.apiUrl || "") }));
  const legacy = [
    ["legacy:default", settings.apiUrl],
    ["legacy:text", settings.textApiUrl],
    ["legacy:image", settings.imageApiUrl],
    ["legacy:video", settings.videoApiUrl],
    ["legacy:audio", settings.audioApiUrl],
  ].filter(([, url]) => String(url || "").trim()).map(([id, url]) => ({ id, url: String(url) }));
  const seen = new Set();
  return [...configured, ...legacy].filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function managedApiMatchLength(apiConfig, requestUrl) {
  try {
    const base = new URL(String(apiConfig?.url || ""));
    const target = new URL(String(requestUrl || ""));
    const basePath = base.pathname.replace(/\/$/, "");
    if (base.origin !== target.origin) return -1;
    if (basePath && basePath !== "/" && target.pathname !== basePath && !target.pathname.startsWith(`${basePath}/`)) return -1;
    return base.origin.length + basePath.length;
  } catch {
    return -1;
  }
}

function findEnterpriseManagedApiConfig(snapshot, requestUrl) {
  return listEnterpriseManagedApiConfigs(snapshot)
    .map((item) => ({ item, score: managedApiMatchLength(item, requestUrl) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score)[0]?.item || null;
}

function stripEnterpriseMemberAuthHeaders(headers) {
  const blocked = new Set(["authorization", "x-api-key", "api-key", "x-goog-api-key", "cookie"]);
  return Object.fromEntries(Object.entries(headers || {}).filter(([key]) => !blocked.has(String(key).toLowerCase())));
}

function enterpriseAuthMetadata(headers) {
  const entries = Object.entries(headers || {});
  const authHeaderNames = entries
    .map(([key]) => String(key).toLowerCase())
    .filter((key) => ["authorization", "x-api-key", "api-key", "x-goog-api-key"].includes(key));
  const authorizationValue = entries.find(([key]) => String(key).toLowerCase() === "authorization")?.[1];
  const schemeMatch = String(authorizationValue || "").match(/^([A-Za-z][A-Za-z0-9_-]*)\s+/);
  return {
    authHeaderNames,
    authorizationScheme: schemeMatch ? schemeMatch[1] : "Bearer",
  };
}

async function proxyEnterpriseRequest(payload = {}, options = {}, retryCount = 0) {
  const state = readAccountState();
  const enterprise = state.enterprise;
  if (enterprise?.mode !== "member") return { handled: false };

  const cache = readEnterpriseSnapshotCache();
  if (!cache?.snapshot?.modules?.settings?.chromeStorage) {
    throw new AccountRequestError("企业配置快照不可用，已阻止回退到个人配置", { code: "ENTERPRISE_CONFIG_UNAVAILABLE" });
  }
  const apiConfig = findEnterpriseManagedApiConfig(cache.snapshot, payload.url);
  if (!apiConfig) return { handled: false };

  const workspaceToken = decryptSecret(enterprise.workspaceTokenEncrypted);
  if (!workspaceToken || !enterprise.gatewayUrl || !enterprise.certificateFingerprint) {
    throw new AccountRequestError("企业网关会话不可用，已阻止回退到个人配置", { code: "ENTERPRISE_GATEWAY_UNAVAILABLE" });
  }

  try {
    const authMetadata = enterpriseAuthMetadata(payload.headers);
    const method = String(payload.method || "GET").toUpperCase();
    const gatewayPath = ["POST", "PUT", "PATCH", "DELETE"].includes(method) ? "/workspace/tasks" : "/workspace/proxy-fetch";
    const response = await requestPinnedJson(enterprise.gatewayUrl, gatewayPath, {
      method: "POST",
      token: workspaceToken,
      certificateFingerprint: enterprise.certificateFingerprint,
      timeoutMs: Math.max(1000, Math.min(600000, Number(payload.requestTimeout || 180000) + 5000)),
      signal: options.signal,
      body: {
        managedApiConfigId: apiConfig.id,
        clientRequestId: String(payload.requestId || ""),
        url: String(payload.url || ""),
        method,
        headers: stripEnterpriseMemberAuthHeaders(payload.headers),
        authHeaderNames: authMetadata.authHeaderNames,
        authorizationScheme: authMetadata.authorizationScheme,
        bodyBase64: String(payload.bodyBase64 || ""),
        requestTimeout: Number(payload.requestTimeout || 180000),
      },
    });
    return { handled: true, response: response.value.proxy || response.value };
  } catch (error) {
    if (error?.code === "WORKSPACE_SESSION_EXPIRED" && retryCount < 1) {
      await reconnectEnterpriseWorkspace();
      return proxyEnterpriseRequest(payload, options, retryCount + 1);
    }
    throw error;
  }
}

async function proxyEnterpriseUpload(channel, payload = {}, options = {}, retryCount = 0) {
  const state = readAccountState();
  const enterprise = state.enterprise;
  if (enterprise?.mode !== "member") return { handled: false };
  const cache = readEnterpriseSnapshotCache();
  if (!cache?.snapshot?.modules?.settings?.chromeStorage) {
    throw new AccountRequestError("企业配置快照不可用，已阻止回退到个人上传配置", { code: "ENTERPRISE_CONFIG_UNAVAILABLE" });
  }
  const workspaceToken = decryptSecret(enterprise.workspaceTokenEncrypted);
  if (!workspaceToken || !enterprise.gatewayUrl || !enterprise.certificateFingerprint) {
    throw new AccountRequestError("企业网关会话不可用，已阻止回退到个人上传配置", { code: "ENTERPRISE_GATEWAY_UNAVAILABLE" });
  }

  let source;
  try {
    source = await createEnterpriseUploadSource(payload);
    const response = await requestPinnedUpload(enterprise.gatewayUrl, "/workspace/uploads", {
      token: workspaceToken,
      certificateFingerprint: enterprise.certificateFingerprint,
      stream: source.stream,
      size: source.size,
      mime: source.mime,
      timeoutMs: Math.max(60000, Math.min(30 * 60 * 1000, Number(options.timeoutMs || 15 * 60 * 1000))),
      signal: options.signal,
      metadata: {
        channel: String(channel || "public"),
        kind: String(payload.kind || "media"),
        filename: source.filename,
        mime: source.mime,
      },
    });
    return { handled: true, response: response.value };
  } catch (error) {
    if (error?.code === "WORKSPACE_SESSION_EXPIRED" && retryCount < 1) {
      await reconnectEnterpriseWorkspace();
      return proxyEnterpriseUpload(channel, payload, options, retryCount + 1);
    }
    error.enterpriseManaged = true;
    throw error;
  } finally {
    source?.stream?.destroy?.();
  }
}

module.exports = {
  AccountRequestError,
  WANJUAN_ACCOUNT_DEFAULT_API_URL,
  accountApiUrl,
  bootstrapAccount,
  connectEnterpriseWorkspace,
  continueWithLocalMode,
  createEnterpriseGateway,
  disconnectEnterpriseWorkspace,
  getCurrentAccount,
  getEnterpriseManagement,
  getEnterpriseStorageOverlay,
  loginAccount,
  logoutAccount,
  normalizeBaseUrl,
  normalizeAccountEmail,
  publishEnterpriseGatewayConfig,
  proxyEnterpriseRequest,
  proxyEnterpriseUpload,
  releaseCreatedEnterpriseGateway,
  refreshEnterpriseWorkspaceConfig,
  readAccountState,
  refreshAccountSession,
  requestWithAccountAuth,
  resetAccountOnboarding,
  removeEnterpriseMember,
  sanitizeAccountState,
  sendAccountCode,
  startCreatedEnterpriseGateway,
  stopCreatedEnterpriseGateway,
  takeOverEnterpriseGateway,
  updateEnterpriseMember,
  updateEnterpriseMemberQuota,
  updateEnterpriseQuotaDefault,
};
