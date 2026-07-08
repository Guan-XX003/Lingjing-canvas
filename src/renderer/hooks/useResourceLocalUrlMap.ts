// @ts-nocheck
/**
 * wanjuanResourceLocalUrlMap。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import { buildProjectMediaFileUrl } from "../lib/resource";

export function useResourceLocalUrlMap(deps: any) {
  const {
    resources,
    useMemo,
  } = deps;
  const wanjuanResourceLocalUrlMap = useMemo(() => {
	      let localResourceMap = new Map();
	      (Array.isArray(resources) ? resources : []).forEach((resource) => {
	        if (!resource || typeof resource != `object`) return;
	        let localUrl =
	          typeof resource.url == `string` && /^file:\/\//i.test(resource.url) ?
	          resource.url :
	          buildProjectMediaFileUrl(resource.localPath || resource.projectAssetBinding?.localPath || ``);
	        if (!localUrl) return;
	        [
	          resource.originalUrl,
	          resource.remoteUrl,
	          resource.sourceUrl,
	          resource.resultUrl,
	          resource.mediaUrl,
	          resource.projectAssetBinding?.sourceSignature,
	          typeof resource.url == `string` && !/^file:\/\//i.test(resource.url) ? resource.url : ``,
	        ].forEach((candidate) => {
	          typeof candidate == `string` && candidate && candidate !== localUrl && localResourceMap.set(candidate, {
	            url: localUrl,
	            resource,
	          });
	        });
	        resource.projectAssetBinding?.assetId &&
	          localResourceMap.set(`asset:${resource.projectAssetBinding.assetId}`, {
	            url: localUrl,
	            resource,
	          });
	        resource.projectAssetBinding?.sha256 &&
	          localResourceMap.set(`sha256:${resource.projectAssetBinding.sha256}`, {
	            url: localUrl,
	            resource,
	          });
	      });
	      return localResourceMap;
	    }, [resources]);
  return { wanjuanResourceLocalUrlMap };
}
