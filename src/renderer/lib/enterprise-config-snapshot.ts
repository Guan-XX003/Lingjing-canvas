import { BACKUP_SETTINGS_SECTION_KEYS } from "./app-root-helpers";
import { cloneBackupValue } from "./backup";

declare const chrome: any;

export type EnterpriseSecretEntry = {
  id: string;
  type: string;
  path: string;
  value: string;
};

export type EnterpriseConfigSnapshot = {
  schemaVersion: 1;
  backupSchemaVersion: 4;
  version: number;
  createdAt: number;
  sourceAppVersion: string;
  hash: string;
  modules: {
    settings: {
      chromeStorage: Record<string, unknown>;
      selectedSections: ["api", "models", "cloud"];
    };
  };
};

export type EnterpriseConfigDraft = {
  snapshot: EnterpriseConfigSnapshot;
  secrets: EnterpriseSecretEntry[];
  summary: {
    apiConfigCount: number;
    storedGlobalConfigCount: number;
    protocolCount: number;
    modelBindingCount: number;
    uploadChannelCount: number;
    secretCount: number;
  };
  warnings: string[];
};

const ENTERPRISE_API_KEYS = new Set([
  "apiUrl",
  "apiKey",
  "textApiUrl",
  "textApiKey",
  "imageApiUrl",
  "imageApiKey",
  "videoApiUrl",
  "videoApiKey",
  "audioApiUrl",
  "audioApiKey",
  "apiConfigs",
  "textApiConfigId",
  "imageApiConfigId",
  "videoApiConfigId",
  "audioApiConfigId",
  "storedGlobalConfigs",
  "activeStoredGlobalConfigId",
]);

const ENTERPRISE_SETTINGS_KEYS = [
  ...BACKUP_SETTINGS_SECTION_KEYS.api.filter((key) => ENTERPRISE_API_KEYS.has(key)),
  ...BACKUP_SETTINGS_SECTION_KEYS.models,
  ...BACKUP_SETTINGS_SECTION_KEYS.cloud,
];

const LIKELY_SECRET_VALUE_PATTERN = /^(?:bearer\s+|sk-[a-z0-9_-]{12,}|aklt[a-z0-9_-]{8,}|eyj[a-z0-9_-]+\.[a-z0-9_-]+\.)/i;
const NON_SECRET_HEADER_NAMES = new Set(["accept", "content-type", "user-agent"]);
const SENSITIVE_FIELD_NAMES = new Set([
  "key",
  "apikey",
  "token",
  "authtoken",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "password",
  "credential",
  "clientsecret",
  "secret",
  "secretkey",
  "secretaccesskey",
  "accesskey",
  "accesskeyid",
  "privatekey",
  "signature",
  "cookie",
]);

function secretTypeForPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.includes("tos") || lower.includes("qiniu") || lower.includes("accesskey")) return "storage_credential";
  if (lower.includes("authorization") || lower.includes("token")) return "bearer_token";
  if (lower.includes("header")) return "custom_header";
  return "api_key";
}

function shouldExtractSecret(key: string, value: string, path: string) {
  if (!value) return false;
  const normalizedKey = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (SENSITIVE_FIELD_NAMES.has(normalizedKey) || normalizedKey.endsWith("apikey") || normalizedKey.endsWith("token")) return true;
  const pathParts = path.toLowerCase().split(".");
  const headersIndex = pathParts.lastIndexOf("headers");
  if (headersIndex >= 0 && !NON_SECRET_HEADER_NAMES.has(key.toLowerCase())) return true;
  return LIKELY_SECRET_VALUE_PATTERN.test(value.trim());
}

function extractSecrets(value: unknown, path: string, entries: EnterpriseSecretEntry[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) => extractSecrets(item, `${path}.${index}`, entries));
  }
  if (!value || typeof value !== "object") return cloneBackupValue(value);

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (typeof child === "string" && shouldExtractSecret(key, child, childPath)) {
      const id = `secret_${entries.length + 1}_${childPath.replace(/[^a-z0-9]+/gi, "_").slice(-52).toLowerCase()}`;
      entries.push({ id, type: secretTypeForPath(childPath), path: childPath, value: child });
      output[key] = { $secretRef: id };
      continue;
    }
    output[key] = extractSecrets(child, childPath, entries);
  }
  return output;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [key, stableValue((value as Record<string, unknown>)[key])]),
  );
}

async function sha256(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(stableValue(value)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

function readStorage(keys: string[]): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    if (!chrome?.storage?.local) {
      reject(new Error("配置存储暂不可用"));
      return;
    }
    chrome.storage.local.get(keys, (items: Record<string, unknown>) => {
      const error = chrome.runtime?.lastError;
      if (error) reject(new Error(error.message || "读取配置失败"));
      else resolve(items || {});
    });
  });
}

function countObjectEntries(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).length : 0;
}

export async function buildEnterpriseConfigDraft(options: { sourceAppVersion?: string; version?: number } = {}): Promise<EnterpriseConfigDraft> {
  const stored = await readStorage(ENTERPRISE_SETTINGS_KEYS);
  const selectedSettings = Object.fromEntries(
    ENTERPRISE_SETTINGS_KEYS
      .filter((key) => Object.prototype.hasOwnProperty.call(stored, key))
      .map((key) => [key, cloneBackupValue(stored[key])]),
  );
  const secrets: EnterpriseSecretEntry[] = [];
  const sanitizedSettings = extractSecrets(selectedSettings, "modules.settings.chromeStorage", secrets) as Record<string, unknown>;
  const snapshotWithoutHash = {
    schemaVersion: 1 as const,
    backupSchemaVersion: 4 as const,
    version: Math.max(1, Number(options.version || 1)),
    createdAt: Date.now(),
    sourceAppVersion: String(options.sourceAppVersion || ""),
    modules: {
      settings: {
        chromeStorage: sanitizedSettings,
        selectedSections: ["api", "models", "cloud"] as ["api", "models", "cloud"],
      },
    },
  };
  const modelBindings = [
    sanitizedSettings.textModelApiBindings,
    sanitizedSettings.imageModelApiBindings,
    sanitizedSettings.videoModelApiBindings,
    sanitizedSettings.audioModelApiBindings,
  ].reduce<number>((total, item) => total + countObjectEntries(item), 0);
  const uploadChannelCount = ["tosConfig", "qiniuConfig", "customPublicUploadConfig"]
    .filter((key) => countObjectEntries(sanitizedSettings[key]) > 0).length;
  const apiConfigCount = Array.isArray(sanitizedSettings.apiConfigs) ? sanitizedSettings.apiConfigs.length : 0;
  const storedGlobalConfigCount = Array.isArray(sanitizedSettings.storedGlobalConfigs) ? sanitizedSettings.storedGlobalConfigs.length : 0;
  const protocolCount = Array.isArray(sanitizedSettings.modelProtocolRegistry) ? sanitizedSettings.modelProtocolRegistry.length : 0;
  const warnings: string[] = [];
  if (!apiConfigCount && !storedGlobalConfigCount) warnings.push("当前没有可共享的 API 配置");
  if (!protocolCount) warnings.push("当前没有自定义模型协议，成员将只能使用内置协议能力");
  if (!secrets.length) warnings.push("没有检测到可用密钥，发布后模型请求可能无法鉴权");

  return {
    snapshot: {
      ...snapshotWithoutHash,
      hash: await sha256(snapshotWithoutHash),
    },
    secrets,
    summary: {
      apiConfigCount,
      storedGlobalConfigCount,
      protocolCount,
      modelBindingCount: modelBindings,
      uploadChannelCount,
      secretCount: secrets.length,
    },
    warnings,
  };
}

export const enterpriseConfigStorageKeys = Object.freeze([...ENTERPRISE_SETTINGS_KEYS]);
