import { normalizeUnifiedApiConfigs } from "./unified-api-config";
import { WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG } from "./ark-trusted-assets";

export const WANJUAN_CUSTOM_EMPTY_GLOBAL_CONFIG_ID = `custom-empty`;

/**
 * Clear provider/model identity while deliberately omitting model parameter fields.
 * Applying this patch therefore preserves duration, resolution, ratio and upload settings.
 */
export const buildCustomEmptyGlobalConfigPatch = () => ({
  apiUrl: ``,
  apiKey: ``,
  apiConfigs: [],
  arkTrustedAssetConfig: { ...WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG },
  textApiConfigId: ``,
  imageApiConfigId: ``,
  videoApiConfigId: ``,
  audioApiConfigId: ``,
  textApiUrl: ``,
  textApiKey: ``,
  imageApiUrl: ``,
  imageApiKey: ``,
  videoApiUrl: ``,
  videoApiKey: ``,
  audioApiUrl: ``,
  audioApiKey: ``,
  textModel: ``,
  drawingModel: ``,
  videoModel: ``,
  audioModel: ``,
  ttsMusicModel: ``,
  seedanceModel: ``,
  tianjiSeedanceModel: ``,
  tongyiWanxiangTextModels: ``,
  tongyiWanxiangReferenceImageModels: ``,
  tongyiWanxiangImageModels: ``,
  tongyiWanxiangEditModels: ``,
  modelProtocolRegistry: {},
  textModelApiBindings: {},
  textModelProtocolBindings: {},
  imageModelApiBindings: {},
  imageModelProtocolBindings: {},
  videoModelApiBindings: {},
  videoModelProtocolBindings: {},
  audioModelApiBindings: {},
  audioModelProtocolBindings: {},
  videoModelRequestProfiles: `{}`,
  configButlerApiUrl: ``,
  configButlerApiKey: ``,
  configButlerModel: ``,
  configButlerDocUrl: ``,
  configButlerTargetApiConfigId: ``,
  activeStoredGlobalConfigId: WANJUAN_CUSTOM_EMPTY_GLOBAL_CONFIG_ID,
});

const cloneConfigValue = <T>(value: T): T => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

/** Build a normalized API-only snapshot for explicit empty/reset operations. */
export const replaceGlobalConfigApiConfigs = (value: unknown) =>
  Array.isArray(value) ? cloneConfigValue(normalizeUnifiedApiConfigs(value)) : [];

/**
 * Applying a stored model configuration must not delete unrelated user API
 * entries. Incoming entries update matching ids and append new ids; the
 * selected preset still replaces model bindings and protocol relationships.
 */
export const mergeGlobalConfigApiConfigs = (currentValue: unknown, incomingValue: unknown) => {
  const current = Array.isArray(currentValue) ? normalizeUnifiedApiConfigs(currentValue) : [];
  const incoming = Array.isArray(incomingValue) ? normalizeUnifiedApiConfigs(incomingValue) : [];
  const incomingById = new Map(incoming.map((config) => [String(config?.id || ``), config]));
  const seen = new Set<string>();
  const merged = current.map((config) => {
    const id = String(config?.id || ``);
    seen.add(id);
    return incomingById.has(id) ? incomingById.get(id) : config;
  });
  for (const config of incoming) {
    const id = String(config?.id || ``);
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(config);
  }
  return cloneConfigValue(merged);
};

export const isCurrentSettingsSave = (currentSaveId: unknown, scheduledSaveId: unknown) =>
  currentSaveId === scheduledSaveId;

export const collectTaskCredentialConfigs = (
  activeApiConfigs: unknown,
  storedGlobalConfigs: unknown,
) => {
  const candidates = [
    ...(Array.isArray(activeApiConfigs) ? activeApiConfigs : []),
    ...(Array.isArray(storedGlobalConfigs)
      ? storedGlobalConfigs.flatMap((storedConfig) =>
          Array.isArray(storedConfig?.config?.apiConfigs)
            ? storedConfig.config.apiConfigs
            : [],
        )
      : []),
  ];
  const seen = new Set<string>();
  return normalizeUnifiedApiConfigs(candidates).filter((config) => {
    const identity = `${config?.id || ``}::${normalizeApiBaseUrl(config?.url)}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
};

const normalizeApiBaseUrl = (value: unknown) =>
  String(value || ``).replace(/\s+/g, ``).replace(/\/+$/, ``).toLowerCase();

export const resolveTaskPollUrl = ({
  baseUrl = ``,
  pollPath = ``,
  storedPollUrl = ``,
  taskId = ``,
}: Record<string, any>) => {
  const replaceTaskId = (template: unknown, appendWhenMissing: boolean) => {
    const value = String(template || ``).trim();
    if (/\{(?:taskId|task_id|video_id|id)\}/.test(value)) {
      return value.replace(/\{(?:taskId|task_id|video_id|id)\}/g, taskId);
    }
    return appendWhenMissing && value
      ? `${value.replace(/\/$/, ``)}/${taskId}`
      : value;
  };
  const stored = replaceTaskId(storedPollUrl, false);
  if (stored) return stored;
  const resolvedPath = replaceTaskId(pollPath || `/v1/videos/{taskId}`, true);
  if (/^https?:\/\//i.test(resolvedPath)) return resolvedPath;
  return `${String(baseUrl || ``).replace(/\/$/, ``)}/${resolvedPath.replace(/^\/+/, ``)}`;
};

export const resolveTaskApiCredential = ({
  apiConfigs = [],
  taskApiConfigId = ``,
  taskApiBaseUrl = ``,
  boundApiConfigId = ``,
  currentApiUrl = ``,
  currentApiKey = ``,
}: Record<string, any>) => {
  const configs = Array.isArray(apiConfigs) ? apiConfigs : [];
  const normalizedTaskBaseUrl = normalizeApiBaseUrl(taskApiBaseUrl);
  const hasTaskProvenance = !!taskApiConfigId || !!normalizedTaskBaseUrl;
  const configById = taskApiConfigId
    ? configs.find(
        (config) =>
          config?.id === taskApiConfigId &&
          (!normalizedTaskBaseUrl || normalizeApiBaseUrl(config?.url) === normalizedTaskBaseUrl),
      )
    : null;
  const configByBaseUrl = normalizedTaskBaseUrl
    ? configs.find((config) => normalizeApiBaseUrl(config?.url) === normalizedTaskBaseUrl)
    : null;
  const configByBinding = !hasTaskProvenance && boundApiConfigId
    ? configs.find((config) => config?.id === boundApiConfigId)
    : null;
  const matchedConfig = configByBaseUrl || configById || configByBinding || null;
  const currentMatchesTaskBase =
    !!normalizedTaskBaseUrl && normalizeApiBaseUrl(currentApiUrl) === normalizedTaskBaseUrl;
  const baseUrl = String(
    taskApiBaseUrl || matchedConfig?.url || (!hasTaskProvenance ? currentApiUrl : ``),
  ).replace(/\s+/g, ``).replace(/\/+$/, ``);
  const key = String(
    matchedConfig?.key || ((!hasTaskProvenance || currentMatchesTaskBase) ? currentApiKey : ``),
  ).trim();
  return {
    baseUrl,
    key,
    matchedConfig,
    missingOriginalConfig: hasTaskProvenance && (!baseUrl || !key),
  };
};
