import { clearEnterpriseConfigOverlay, installEnterpriseConfigOverlay } from "./enterprise-runtime";
import type { EnterpriseConfigSnapshot } from "./enterprise-config-snapshot";

export type AccountUser = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

export type EnterpriseConnection = {
  mode?: "host" | "member";
  organization?: { id: string; name?: string; role?: string } | null;
  gatewayId?: string;
  gatewayUrl?: string;
  certificateFingerprint?: string;
  connectedAt?: number;
  lastVerifiedAt?: number;
  expiresAt?: number;
  connected?: boolean;
};

export type EnterpriseGatewayHost = {
  initialized: boolean;
  running: boolean;
  status: string;
  localGatewayId?: string;
  gatewayId?: string;
  organizationId?: string;
  organizationName?: string;
  gatewayName?: string;
  port?: number;
  addresses?: string[];
  urls?: string[];
  preferredUrl?: string;
  certificateFingerprint?: string;
  configVersion?: number;
  configHash?: string;
  autoStart?: boolean;
  createdAt?: number;
  startedAt?: number;
  lastError?: string;
  cloudStatus?: string;
};

export type OwnedEnterprise = {
  id: string;
  name?: string;
  status?: string;
  organizationType?: string;
  timezone?: string;
  policyVersion?: number;
  role?: string;
  membershipStatus?: string;
  gatewayId?: string;
  gatewayName?: string;
  gatewayStatus?: string;
  gatewayLastSeenAt?: string | null;
  configVersion?: number;
  configHash?: string;
  certificateFingerprint?: string;
};

export type AccountState = {
  loading: boolean;
  serviceConfigured: boolean;
  secureStorageAvailable: boolean;
  secureStorageMode?: "system" | "local" | "unavailable";
  onboardingComplete: boolean;
  localMode: boolean;
  authenticated: boolean;
  offline: boolean;
  offlineGraceActive: boolean;
  user: AccountUser | null;
  subscription: { plan?: string; status?: string; expiresAt?: string } | null;
  entitlements: string[];
  wallet: { balance?: number; currency?: string } | null;
  device: { id?: string; name?: string; platform?: string } | null;
  enterprise: EnterpriseConnection | null;
  enterpriseSnapshot: EnterpriseConfigSnapshot | null;
  gatewayHost: EnterpriseGatewayHost | null;
  ownedEnterprise: OwnedEnterprise | null;
  requiresLogin: boolean;
  authOpen: boolean;
  error: string;
  errorCode: string;
  errorStatus: number;
  busy: boolean;
};

const emptyState: AccountState = {
  loading: true,
  serviceConfigured: false,
  secureStorageAvailable: false,
  onboardingComplete: true,
  localMode: true,
  authenticated: false,
  offline: false,
  offlineGraceActive: false,
  user: null,
  subscription: null,
  entitlements: [],
  wallet: null,
  device: null,
  enterprise: null,
  enterpriseSnapshot: null,
  gatewayHost: null,
  ownedEnterprise: null,
  requiresLogin: false,
  authOpen: false,
  error: "",
  errorCode: "",
  errorStatus: 0,
  busy: false,
};

let state: AccountState = { ...emptyState };
const listeners = new Set<() => void>();
let bootstrapPromise: Promise<AccountState> | null = null;

function desktop() {
  return (globalThis as any).wanjuanDesktop || {};
}

function emit() {
  listeners.forEach((listener) => listener());
}

function reloadForEnterpriseScope() {
  globalThis.setTimeout(() => globalThis.location?.reload(), 120);
}

function patchState(next: Partial<AccountState>) {
  state = { ...state, ...next };
  emit();
  return state;
}

function applyDesktopState(result: any, extra: Partial<AccountState> = {}) {
  if (!result || result.ok === false) {
    return patchState({ ...extra, loading: false, error: String(result?.error || "账号服务暂不可用") });
  }
  const next = patchState({
    ...result,
    ...extra,
    // 会话失效只更新账号状态；登录界面必须由用户在“我的账号”主动打开。
    authOpen: extra.authOpen ?? state.authOpen,
    loading: false,
    error: String(extra.error || result.error || ""),
    errorCode: String((extra as any).errorCode || result.errorCode || ""),
    errorStatus: Number((extra as any).errorStatus || result.errorStatus || 0),
  });
  if (next.enterprise?.connected && next.enterpriseSnapshot && next.enterprise.organization?.id && next.enterprise.gatewayId && next.enterprise.gatewayUrl) {
    installEnterpriseConfigOverlay({
      organizationId: next.enterprise.organization.id,
      gatewayId: next.enterprise.gatewayId,
      gatewayUrl: next.enterprise.gatewayUrl,
      snapshot: next.enterpriseSnapshot,
    });
  } else if (!next.enterprise) {
    clearEnterpriseConfigOverlay();
  }
  return next;
}

function applyDesktopError(result: any, fallback: string) {
  return patchState({
    busy: false,
    error: String(result?.error || fallback),
    errorCode: String(result?.code || ""),
    errorStatus: Number(result?.status || 0),
  });
}

export function getAccountState() {
  return state;
}

export function subscribeAccount(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function bootstrapAccount() {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      const result = await desktop().accountBootstrap?.();
      return applyDesktopState(result);
    } catch (error) {
      return applyDesktopState(null, { error: String((error as Error)?.message || error) });
    } finally {
      bootstrapPromise = null;
    }
  })();
  return bootstrapPromise;
}

export function openAccountAuth() {
  return patchState({ authOpen: true, error: "", errorCode: "", errorStatus: 0 });
}

export function closeAccountAuth() {
  return patchState({ authOpen: false, error: "", errorCode: "", errorStatus: 0 });
}

export async function continueWithLocalMode() {
  patchState({ busy: true, error: "" });
  try {
    return applyDesktopState(await desktop().accountContinueLocal?.(), { authOpen: false, busy: false });
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function sendAccountCode(identifier: string, purpose: "login" | "register" = "login") {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountSendCode?.({ identifier, purpose });
    if (!result?.ok) {
      applyDesktopError(result, "验证码发送失败");
      return result;
    }
    patchState({ busy: false });
    return result;
  } catch (error) {
    patchState({ busy: false, error: String((error as Error)?.message || error) });
    return { ok: false, error: state.error };
  }
}

export async function loginAccount(payload: { identifier: string; code: string; inviteCode?: string; register?: boolean }) {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountLogin?.(payload);
    if (!result?.ok) return applyDesktopError(result, "登录失败");
    return applyDesktopState(result, { authOpen: false, busy: false });
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function logoutAccount() {
  patchState({ busy: true, error: "" });
  try {
    const wasEnterprise = !!state.enterprise;
    const next = applyDesktopState(await desktop().accountLogout?.(), { busy: false, authOpen: false });
    if (wasEnterprise) reloadForEnterpriseScope();
    return next;
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function connectEnterpriseWorkspace(payload: { gatewayUrl: string; inviteCode: string; deviceId?: string }) {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountConnectEnterprise?.(payload);
    if (!result?.ok) return applyDesktopError(result, "企业空间连接失败");
    const next = applyDesktopState(result, { busy: false });
    reloadForEnterpriseScope();
    return next;
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function createEnterpriseGateway(payload: Record<string, unknown>) {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountCreateEnterpriseGateway?.(payload);
    if (!result?.ok) {
      applyDesktopError(result, "企业网关创建失败");
      return result;
    }
    applyDesktopState(result, { busy: false });
    return result;
  } catch (error) {
    patchState({ busy: false, error: String((error as Error)?.message || error) });
    return { ok: false, error: state.error };
  }
}

export async function takeOverEnterpriseGateway(payload: Record<string, unknown>) {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountTakeoverEnterpriseGateway?.(payload);
    if (!result?.ok) {
      applyDesktopError(result, "企业网关接管失败");
      return result;
    }
    applyDesktopState(result, { busy: false });
    return result;
  } catch (error) {
    patchState({ busy: false, error: String((error as Error)?.message || error) });
    return { ok: false, error: state.error };
  }
}

export async function releaseCreatedEnterpriseGateway(payload: Record<string, unknown> = {}) {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountReleaseEnterpriseGateway?.(payload);
    if (!result?.ok) return applyDesktopError(result, "本机企业网关移除失败");
    clearEnterpriseConfigOverlay();
    return applyDesktopState(result, { busy: false });
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function publishEnterpriseConfig(payload: Record<string, unknown>) {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountPublishEnterpriseConfig?.(payload);
    if (!result?.ok) return applyDesktopError(result, "企业配置发布失败");
    return applyDesktopState(result, { busy: false });
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function startEnterpriseGateway() {
  patchState({ busy: true, error: "" });
  try {
    const result = await desktop().enterpriseGatewayStart?.();
    if (!result?.ok) return applyDesktopError(result, "企业网关启动失败");
    return applyDesktopState(result, { busy: false });
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function stopEnterpriseGateway() {
  patchState({ busy: true, error: "" });
  try {
    const result = await desktop().enterpriseGatewayStop?.();
    if (!result?.ok) return applyDesktopError(result, "企业网关停止失败");
    return applyDesktopState(result, { busy: false });
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function disconnectEnterpriseWorkspace() {
  patchState({ busy: true, error: "" });
  try {
    const next = applyDesktopState(await desktop().accountDisconnectEnterprise?.(), { busy: false });
    clearEnterpriseConfigOverlay();
    reloadForEnterpriseScope();
    return next;
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function refreshEnterpriseConfig() {
  patchState({ busy: true, error: "", errorCode: "", errorStatus: 0 });
  try {
    const result = await desktop().accountRefreshEnterpriseConfig?.();
    if (!result?.ok) return applyDesktopError(result, "企业配置刷新失败");
    const next = applyDesktopState(result, { busy: false });
    reloadForEnterpriseScope();
    return next;
  } catch (error) {
    return patchState({ busy: false, error: String((error as Error)?.message || error) });
  }
}

export async function loadEnterpriseManagement() {
  return desktop().accountEnterpriseManagement?.();
}

export async function updateEnterpriseManagedMember(payload: Record<string, unknown>) {
  return desktop().accountEnterpriseMemberUpdate?.(payload);
}

export async function removeEnterpriseManagedMember(userId: string) {
  return desktop().accountEnterpriseMemberRemove?.({ userId });
}

export async function updateEnterpriseDefaultQuota(payload: Record<string, unknown>) {
  return desktop().accountEnterpriseQuotaDefaultUpdate?.(payload);
}

export async function updateEnterpriseManagedMemberQuota(payload: Record<string, unknown>) {
  return desktop().accountEnterpriseQuotaMemberUpdate?.(payload);
}
