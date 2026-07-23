import type { EnterpriseConfigSnapshot } from "./enterprise-config-snapshot";

export type EnterpriseRuntimeScope = "personal" | "enterprise";

type EnterpriseOverlay = {
  organizationId: string;
  gatewayId: string;
  gatewayUrl: string;
  snapshot: EnterpriseConfigSnapshot;
};

let overlay: EnterpriseOverlay | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getEnterpriseRuntimeScope(): EnterpriseRuntimeScope {
  return overlay ? "enterprise" : "personal";
}

export function getEnterpriseConfigOverlay() {
  return overlay;
}

export function installEnterpriseConfigOverlay(next: EnterpriseOverlay) {
  if (!next?.organizationId || !next?.gatewayId || !next?.gatewayUrl || !next?.snapshot) {
    throw new Error("企业配置快照不完整");
  }
  overlay = Object.freeze({ ...next });
  emit();
  return overlay;
}

export function clearEnterpriseConfigOverlay() {
  if (!overlay) return;
  overlay = null;
  emit();
}

export function resolveRuntimeSetting<T>(key: string, personalValue: T): T {
  if (!overlay) return personalValue;
  const settings = overlay.snapshot.modules?.settings?.chromeStorage || {};
  return Object.prototype.hasOwnProperty.call(settings, key) ? settings[key] as T : personalValue;
}

export function subscribeEnterpriseRuntime(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
