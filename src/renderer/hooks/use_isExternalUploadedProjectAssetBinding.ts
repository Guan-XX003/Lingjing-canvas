// @ts-nocheck
/**
 * isExternalUploadedProjectAssetBinding。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { getProjectMediaBindingKind, getProjectMediaBindingOrigin, hasExternalUploadLikeFileName } from "../lib/backup";

export function use_isExternalUploadedProjectAssetBinding(deps: any) {
  const {
    EXTERNAL_PROJECT_ASSET_ORIGINS,
    GENERATED_PROJECT_ASSET_ORIGIN_PATTERN,
  } = deps;
  const isExternalUploadedProjectAssetBinding = (binding, bindingKey, data = {}) => {
                  if (!binding || typeof binding != `object`) return false;
                  let kind = String(binding.kind || getProjectMediaBindingKind(bindingKey, {
                    data: data
                  }) || ``).toLowerCase(),
                    mime = String(binding.mime || ``).toLowerCase(),
                    isMediaBinding = bindingKey === `imageUrl` || bindingKey === `videoUrl` || bindingKey === `audioUrl` || [`image`, `video`, `audio`].includes(kind) || /^image\//i.test(mime) || /^video\//i.test(mime) || /^audio\//i.test(mime);
                  if (!isMediaBinding) return false;
                  let origin = getProjectMediaBindingOrigin(binding, data).toLowerCase();
                  if (!origin) return false;
                  if (EXTERNAL_PROJECT_ASSET_ORIGINS.has(origin)) return true;
                  if (GENERATED_PROJECT_ASSET_ORIGIN_PATTERN.test(origin)) return false;
                  if (origin === `media` && hasExternalUploadLikeFileName(binding, data)) return true;
                  return false;
                };
  return { isExternalUploadedProjectAssetBinding };
}
