/**
 * 把资源页中的远端生成结果保存到项目媒体库，并统一切换为本地播放地址。
 */
import { useCallback } from "react";
import {
  wanjuanApplyPersistedTransitResource,
  wanjuanResourceKind,
  wanjuanResourceMediaUrl,
  wanjuanTransitResourceProjectId,
} from "../lib/resource";

interface UsePersistTransitResourceDeps {}

export function use_persistTransitResource(deps: UsePersistTransitResourceDeps) {
  const {} = deps;
  const persistTransitResource = useCallback(async (resource) => {
    let resourceUrl = wanjuanResourceMediaUrl(resource),
      resourceKind = wanjuanResourceKind(resource);
    if (
      !resource ||
      !window.wanjuanDesktop?.persistProjectAsset ||
      !resourceUrl ||
      /^file:\/\//i.test(resourceUrl) ||
      resourceKind === `text`
    )
      return null;
    try {
      let persisted = await window.wanjuanDesktop.persistProjectAsset({
          url: resourceUrl,
          projectId: wanjuanTransitResourceProjectId(
            resource,
            (typeof globalThis !== `undefined` && globalThis.__wanjuanCurrentProjectId) || document.documentElement.dataset.wanjuanProjectId || `default`,
          ),
          nodeId: `transit-resource`,
          field: `url`,
          kind: resourceKind || `asset`,
          filename: resource.originalName || resource.pageTitle || `${resourceKind || `asset`}-${Date.now()}`,
          mime: resource.type,
          directory: ``,
        });
      if (!persisted?.ok || !persisted.localPath) return null;
      return wanjuanApplyPersistedTransitResource(resource, persisted);
    } catch (error) {
      console.warn(`transit resource persist skipped`, error);
      return null;
    }
  }, []);
  return { persistTransitResource };
}
