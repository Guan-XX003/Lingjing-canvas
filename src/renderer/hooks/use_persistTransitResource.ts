// @ts-nocheck
/**
 * persistTransitResource。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildProjectMediaFileUrl } from "../lib/resource";

export function use_persistTransitResource(deps: any) {
  const {} = deps;
  const persistTransitResource = async (resource) => {
    if (
      !resource ||
      !window.wanjuanDesktop?.persistProjectAsset ||
      typeof resource.url != `string` ||
      !resource.url ||
      /^file:\/\//i.test(resource.url) ||
      resource.type === `text`
    )
      return null;
    try {
      let kind = resource.type?.startsWith(`video`) ?
          `video` :
          resource.type?.startsWith(`audio`) ?
          `audio` :
          resource.type?.startsWith(`image`) ?
          `image` :
          ``,
        persisted = await window.wanjuanDesktop.persistProjectAsset({
          url: resource.url,
          projectId: (typeof globalThis !== `undefined` && globalThis.__wanjuanCurrentProjectId) || document.documentElement.dataset.wanjuanProjectId || `default`,
          nodeId: `transit-resource`,
          field: `url`,
          kind: kind || `asset`,
          filename: resource.originalName || resource.pageTitle || `${kind || `asset`}-${Date.now()}`,
          mime: resource.type,
          directory: ``,
        });
      if (!persisted?.ok || !persisted.localPath) return null;
      let localUrl = buildProjectMediaFileUrl(persisted.localPath);
      return {
        ...resource,
        url: localUrl,
        localPath: persisted.localPath,
        originalUrl: resource.originalUrl || resource.url,
        projectAssetBinding: {
          ok: true,
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
          sourceOrigin: resource.sourceOrigin || resource.source || `generated`,
        },
      };
    } catch (error) {
      console.warn(`transit resource persist skipped`, error);
      return null;
    }
  };
  return { persistTransitResource };
}
