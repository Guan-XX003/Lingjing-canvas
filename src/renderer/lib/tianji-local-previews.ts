import { wanjuanTianjiStorageGet, wanjuanTianjiStorageSet, wanjuanNormalizeTianjiApiBaseUrl } from "./tianji-api";
import { buildProjectMediaFileUrl } from "./resource";
import { wanjuanBlobToDataUrl, wanjuanPortableSeedancePortraitPreview, wanjuanPrepareSeedancePortraitPreview } from "./seedance";

export const WANJUAN_TIANJI_LOCAL_PREVIEW_STORAGE_KEY = `tianjiPortraitLocalPreviews`;

export interface TianjiLocalPreviewRecord {
  scope: string;
  groupType: string;
  groupId: string;
  assetId: string;
  localPath: string;
  previewUrl: string;
  thumbnailLocalPath?: string;
  filename?: string;
  updatedAt: number;
}

export interface TianjiPendingLocalPreviewRecord extends Omit<TianjiLocalPreviewRecord, "assetId"> {
  pendingId: string;
  candidateAssetId?: string;
  lookupName?: string;
  lookupUrl?: string;
}

export interface TianjiLocalPreviewRegistry {
  version: 1;
  entries: Record<string, TianjiLocalPreviewRecord>;
  pending: Record<string, TianjiPendingLocalPreviewRecord>;
}

const emptyRegistry = (): TianjiLocalPreviewRegistry => ({ version: 1, entries: {}, pending: {} });
const normalizedToken = (value: any) => String(value || ``).trim().replace(/^Bearer\s+/i, ``).trim();
const normalizedPart = (value: any) => String(value || ``).trim();
const allowedLocalPreviewUrl = (value: any) => /^file:\/\//i.test(String(value || ``).trim());

const fallbackHash = (value: string): string => {
  let first = 2166136261,
    second = 2246822519;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 3266489917);
  }
  return `${(first >>> 0).toString(16).padStart(8, `0`)}${(second >>> 0).toString(16).padStart(8, `0`)}`;
};

/** Hashes the configured relay identity without persisting the bearer token itself. */
export async function wanjuanTianjiLocalPreviewScope(config: any = {}): Promise<string> {
  const input = `${wanjuanNormalizeTianjiApiBaseUrl(config?.baseUrl)}\n${normalizedToken(config?.token)}\n${normalizedPart(config?.sassId || `1`)}\n${normalizedPart(config?.platform || `web`)}`;
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest(`SHA-256`, new TextEncoder().encode(input));
      return `sha256:${Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, `0`)).join(``)}`;
    }
  } catch {}
  return `local:${fallbackHash(input)}`;
}

export const wanjuanTianjiLocalPreviewEntryKey = ({ scope, groupType, groupId, assetId }: any): string =>
  [scope, groupType, groupId, assetId].map((value) => encodeURIComponent(normalizedPart(value))).join(`|`);

export const wanjuanTianjiPendingLocalPreviewKey = ({ scope, groupType, groupId, pendingId }: any): string =>
  [scope, groupType, groupId, pendingId].map((value) => encodeURIComponent(normalizedPart(value))).join(`|`);

export function wanjuanNormalizeTianjiLocalPreviewRegistry(value: any): TianjiLocalPreviewRegistry {
  const registry = emptyRegistry();
  Object.entries(value?.entries && typeof value.entries === `object` ? value.entries : {}).forEach(([key, item]: any) => {
    const record = item && typeof item === `object` ? item : null;
    if (!record || !record.scope || !record.groupType || !record.groupId || !record.assetId || !record.localPath || !allowedLocalPreviewUrl(record.previewUrl)) return;
    registry.entries[key] = {
      scope: normalizedPart(record.scope),
      groupType: normalizedPart(record.groupType),
      groupId: normalizedPart(record.groupId),
      assetId: normalizedPart(record.assetId),
      localPath: normalizedPart(record.localPath),
      previewUrl: normalizedPart(record.previewUrl),
      thumbnailLocalPath: normalizedPart(record.thumbnailLocalPath) || undefined,
      filename: normalizedPart(record.filename) || undefined,
      updatedAt: Number(record.updatedAt || Date.now()),
    };
  });
  Object.entries(value?.pending && typeof value.pending === `object` ? value.pending : {}).forEach(([key, item]: any) => {
    const record = item && typeof item === `object` ? item : null;
    if (!record || !record.scope || !record.groupType || !record.groupId || !record.pendingId || !record.localPath || !allowedLocalPreviewUrl(record.previewUrl)) return;
    registry.pending[key] = {
      scope: normalizedPart(record.scope),
      groupType: normalizedPart(record.groupType),
      groupId: normalizedPart(record.groupId),
      pendingId: normalizedPart(record.pendingId),
      candidateAssetId: normalizedPart(record.candidateAssetId) || undefined,
      lookupName: normalizedPart(record.lookupName) || undefined,
      lookupUrl: normalizedPart(record.lookupUrl) || undefined,
      localPath: normalizedPart(record.localPath),
      previewUrl: normalizedPart(record.previewUrl),
      thumbnailLocalPath: normalizedPart(record.thumbnailLocalPath) || undefined,
      filename: normalizedPart(record.filename) || undefined,
      updatedAt: Number(record.updatedAt || Date.now()),
    };
  });
  return registry;
}

export async function wanjuanLoadTianjiLocalPreviewRegistry(): Promise<TianjiLocalPreviewRegistry> {
  const stored = await wanjuanTianjiStorageGet([WANJUAN_TIANJI_LOCAL_PREVIEW_STORAGE_KEY]);
  return wanjuanNormalizeTianjiLocalPreviewRegistry(stored?.[WANJUAN_TIANJI_LOCAL_PREVIEW_STORAGE_KEY]);
}

export async function wanjuanSaveTianjiLocalPreviewRegistry(registry: any): Promise<TianjiLocalPreviewRegistry> {
  const normalized = wanjuanNormalizeTianjiLocalPreviewRegistry(registry);
  await wanjuanTianjiStorageSet({ [WANJUAN_TIANJI_LOCAL_PREVIEW_STORAGE_KEY]: normalized });
  return normalized;
}

export const wanjuanFindTianjiLocalPreview = (
  registry: any,
  identity: { scope: string; groupType: string; groupId: string; assetId: string },
): TianjiLocalPreviewRecord | null => {
  const normalized = wanjuanNormalizeTianjiLocalPreviewRegistry(registry);
  return normalized.entries[wanjuanTianjiLocalPreviewEntryKey(identity)] || null;
};

export function wanjuanRemoveTianjiLocalPreviewFromRegistry(
  registry: any,
  identity: { scope: string; groupType: string; groupId: string; assetId: string },
): { registry: TianjiLocalPreviewRegistry; removed: boolean } {
  const normalized = wanjuanNormalizeTianjiLocalPreviewRegistry(registry);
  const key = wanjuanTianjiLocalPreviewEntryKey(identity);
  const removed = Boolean(normalized.entries[key]);
  delete normalized.entries[key];
  return { registry: normalized, removed };
}

export async function wanjuanSetTianjiLocalPreview(
  identity: { scope: string; groupType: string; groupId: string; assetId: string },
  preview: Partial<TianjiLocalPreviewRecord>,
): Promise<TianjiLocalPreviewRecord> {
  const registry = await wanjuanLoadTianjiLocalPreviewRegistry();
  const record: TianjiLocalPreviewRecord = {
    scope: normalizedPart(identity.scope),
    groupType: normalizedPart(identity.groupType),
    groupId: normalizedPart(identity.groupId),
    assetId: normalizedPart(identity.assetId),
    localPath: normalizedPart(preview.localPath),
    previewUrl: normalizedPart(preview.previewUrl),
    thumbnailLocalPath: normalizedPart(preview.thumbnailLocalPath) || undefined,
    filename: normalizedPart(preview.filename) || undefined,
    updatedAt: Date.now(),
  };
  if (!record.scope || !record.groupType || !record.groupId || !record.assetId || !record.localPath || !allowedLocalPreviewUrl(record.previewUrl))
    throw Error(`本地人像预览信息不完整`);
  registry.entries[wanjuanTianjiLocalPreviewEntryKey(record)] = record;
  await wanjuanSaveTianjiLocalPreviewRegistry(registry);
  return record;
}

export async function wanjuanRemoveTianjiLocalPreview(identity: { scope: string; groupType: string; groupId: string; assetId: string }): Promise<boolean> {
  const result = wanjuanRemoveTianjiLocalPreviewFromRegistry(await wanjuanLoadTianjiLocalPreviewRegistry(), identity);
  await wanjuanSaveTianjiLocalPreviewRegistry(result.registry);
  return result.removed;
}

export async function wanjuanQueueTianjiLocalPreview(
  identity: { scope: string; groupType: string; groupId: string; pendingId?: string },
  preview: Partial<TianjiPendingLocalPreviewRecord>,
): Promise<TianjiPendingLocalPreviewRecord> {
  const registry = await wanjuanLoadTianjiLocalPreviewRegistry();
  const pendingId = normalizedPart(identity.pendingId) || `pending-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const record: TianjiPendingLocalPreviewRecord = {
    scope: normalizedPart(identity.scope),
    groupType: normalizedPart(identity.groupType),
    groupId: normalizedPart(identity.groupId),
    pendingId,
    candidateAssetId: normalizedPart(preview.candidateAssetId) || undefined,
    lookupName: normalizedPart(preview.lookupName) || undefined,
    lookupUrl: normalizedPart(preview.lookupUrl) || undefined,
    localPath: normalizedPart(preview.localPath),
    previewUrl: normalizedPart(preview.previewUrl),
    thumbnailLocalPath: normalizedPart(preview.thumbnailLocalPath) || undefined,
    filename: normalizedPart(preview.filename) || undefined,
    updatedAt: Date.now(),
  };
  if (!record.scope || !record.groupType || !record.groupId || !record.localPath || !allowedLocalPreviewUrl(record.previewUrl))
    throw Error(`待绑定本地人像预览信息不完整`);
  registry.pending[wanjuanTianjiPendingLocalPreviewKey(record)] = record;
  await wanjuanSaveTianjiLocalPreviewRegistry(registry);
  return record;
}

export async function wanjuanCommitPendingTianjiLocalPreview(pendingKey: string, assetId: string): Promise<TianjiLocalPreviewRecord | null> {
  const registry = await wanjuanLoadTianjiLocalPreviewRegistry();
  const pending = registry.pending[pendingKey];
  const normalizedAssetId = normalizedPart(assetId);
  if (!pending || !normalizedAssetId) return null;
  const record: TianjiLocalPreviewRecord = {
    scope: pending.scope,
    groupType: pending.groupType,
    groupId: pending.groupId,
    assetId: normalizedAssetId,
    localPath: pending.localPath,
    previewUrl: pending.previewUrl,
    thumbnailLocalPath: pending.thumbnailLocalPath,
    filename: pending.filename,
    updatedAt: Date.now(),
  };
  registry.entries[wanjuanTianjiLocalPreviewEntryKey(record)] = record;
  delete registry.pending[pendingKey];
  await wanjuanSaveTianjiLocalPreviewRegistry(registry);
  return record;
}

/** Creates a small display-only image in the existing content-addressed media library. */
export async function wanjuanPersistTianjiLocalPreview(source: File | Blob | string, options: { scope: string; filename?: string } ): Promise<Partial<TianjiLocalPreviewRecord>> {
  let portable = ``;
  if (typeof source === `string`) portable = await wanjuanPortableSeedancePortraitPreview(source);
  else portable = await wanjuanPrepareSeedancePortraitPreview(await wanjuanBlobToDataUrl(source), { maxSize: 512, quality: 0.8 });
  if (!/^data:image\//i.test(portable)) throw Error(`无法读取本地人像预览`);
  if (!window.wanjuanDesktop?.persistProjectAsset) throw Error(`当前桌面端缺少本地预览持久化能力`);
  const mime = /^data:(image\/[^;]+);/i.exec(portable)?.[1] || `image/jpeg`;
  const persisted = await window.wanjuanDesktop.persistProjectAsset({
    projectId: `tianji-local-previews`,
    nodeId: normalizedPart(options.scope).slice(0, 48) || `local`,
    field: `portrait-preview`,
    kind: `image`,
    filename: normalizedPart(options.filename) || `tianji-portrait-preview-${Date.now()}.jpg`,
    mime,
    url: portable,
    storageOptimizationEnabled: true,
  });
  if (!persisted?.ok || !persisted.localPath) throw Error(persisted?.error || `本地人像预览保存失败`);
  const displayPath = persisted.thumbnailLocalPath || persisted.localPath;
  return {
    localPath: persisted.localPath,
    previewUrl: buildProjectMediaFileUrl(displayPath),
    thumbnailLocalPath: persisted.thumbnailLocalPath || undefined,
    filename: persisted.filename || options.filename,
    updatedAt: Date.now(),
  };
}
