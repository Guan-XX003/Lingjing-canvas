/**
 * 工程素材绑定（projectAssetBinding）工具。
 *
 * 画布节点的媒体字段可绑定到本地已落盘素材；这里提供 file:// URL 转本地路径、
 * 超大 dataURL 跳过判断、从绑定还原 file 值、拖拽文件的路径 / 媒体种类 / MIME 推断，
 * 以及由持久化结果构造绑定对象。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { buildProjectMediaFileUrl } from "./resource";

export function localPathFromProjectFileUrl(value: any) {
  if (typeof value != `string` || !/^file:\/\//i.test(value)) return ``;
  try {
    const parsed = new URL(value);
    const hostname = decodeURIComponent(parsed.hostname || ``);
    const pathname = decodeURIComponent(parsed.pathname || ``);
    if (hostname && hostname !== `localhost`) return `\\\\${hostname}${pathname.replace(/\//g, `\\`)}`;
    if (/^\/[A-Za-z]:[\\/]/.test(pathname)) return pathname.slice(1).replace(/\//g, `\\`);
    return pathname;
  } catch {
    return ``;
  }
}
export const WANJUAN_PROJECT_ASSET_HYDRATE_DATA_URL_MAX_CHARS = 1500000;
export function wanjuanShouldSkipHydratedProjectAssetValue(value: any) {
  return (
    typeof value == `string` &&
    value.length > WANJUAN_PROJECT_ASSET_HYDRATE_DATA_URL_MAX_CHARS &&
    /^data:(?:image|video|audio)\//i.test(value)
  );
}
export function wanjuanResolveHydratedProjectAssetFileValue(container: any, baseKey: any) {
  let binding = container?.projectAssetBindings?.[baseKey];
  if (!binding?.localPath || typeof binding.localPath != `string`) return ``;
  if (!/^(?:imageUrl|videoUrl|audioUrl|thumbnailUrl)$/i.test(baseKey)) return ``;
  return buildProjectMediaFileUrl(binding.localPath);
}
export function wanjuanGetDroppedFilePath(file: any) {
  return typeof file?.path == `string` && file.path ? file.path : ``;
}
export function wanjuanMediaKindFromFile(file: any) {
  return file?.type?.startsWith?.(`video/`) ? `video` : file?.type?.startsWith?.(`audio/`) ? `audio` : `image`;
}
export function wanjuanMimeFromMediaKind(kind: any, file: any) {
  return file?.type || (kind === `video` ? `video/mp4` : kind === `audio` ? `audio/mpeg` : `image/png`);
}
export function wanjuanBuildProjectAssetBinding(persisted: any, extras: any = {}) {
  if (!persisted?.ok || !persisted.localPath) return null;
  return {
    ok: !0,
    assetId: persisted.assetId,
    localPath: persisted.localPath,
    filename: persisted.filename,
    mime: persisted.mime,
    size: persisted.size,
    sha256: persisted.sha256,
    projectId: persisted.projectId,
    nodeId: persisted.nodeId,
    field: persisted.field,
    kind: persisted.kind,
    savedAt: persisted.savedAt,
    valueFormat: persisted.valueFormat || `file-url`,
    sourceOrigin: extras.sourceOrigin || `external-upload`,
    sourceSignature: buildProjectMediaFileUrl(persisted.localPath),
  };
}
