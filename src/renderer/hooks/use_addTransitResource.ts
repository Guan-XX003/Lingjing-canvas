/**
 * addTransitResource。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetState, TransitResource, WjEdge } from "../lib/app-types";
import { localPathFromProjectFileUrl } from "../lib/project-asset-binding";
declare const chrome: any;

interface UseAddTransitResourceDeps {
  localforageModule: any;
  isPluginEnv: boolean;
  persistTransitResource: any;
  setEdges: any;
  setTransitResources: SetState<TransitResource[]>;
  transitResources: TransitResource[];
}

export function use_addTransitResource(deps: UseAddTransitResourceDeps) {
  const {
    localforageModule,
    isPluginEnv,
    persistTransitResource,
    setEdges,
    setTransitResources,
    transitResources,
  } = deps;
  const addTransitResource = (url, resourceType = `image`, resourceName = `AI生成内容`, source = `generated`) => {
    if (!url || typeof url != `string`) return;
    let mimeType = resourceType === `audio` ? `audio/mpeg` : resourceType === `video` ? `video/mp4` : resourceType === `text` ? `text` : `image/png`;
    if (resourceType === `audio`) {
      /^data:audio\/wav/i.test(url) || /\.wav(?:$|[?#])/i.test(url) ? mimeType = `audio/wav` : /^data:audio\/ogg/i.test(url) || /\.ogg(?:$|[?#])/i.test(url) ? mimeType = `audio/ogg` : /^data:audio\/mp4/i.test(url) || /\.(m4a|aac)(?:$|[?#])/i.test(url) ? mimeType = `audio/mp4` : /^data:audio\/flac/i.test(url) || /\.flac(?:$|[?#])/i.test(url) ? mimeType = `audio/flac` : mimeType = `audio/mpeg`;
    }
    let localResourcePath = /^file:\/\//i.test(url) ? localPathFromProjectFileUrl(url) : ``;
    setTransitResources((existingResources) => {
      if (existingResources.some((resource) => resource.url === url || resource.originalUrl === url)) return existingResources;
      let resourceEntry = {
        id: `${resourceType}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: url,
        type: mimeType,
        timestamp: Date.now(),
	        pageUrl: `canvas:${setEdges.current || `default`}`,
	        pageTitle: resourceName || (resourceType === `audio` ? `音频资源` : `AI生成内容`),
	        source,
	        sourceOrigin: source,
	        originalName: resourceName || ``,
	        ...(localResourcePath ? {
	          localPath: localResourcePath,
	          projectAssetBinding: {
	            ok: true,
	            localPath: localResourcePath,
	            filename: resourceName || ``,
	            mime: mimeType,
	            field: `url`,
	            kind: resourceType,
	            sourceOrigin: source,
	            sourceSignature: url,
	            valueFormat: `file-url`,
	          },
	        } : {}),
	      },
        updatedResources = [resourceEntry, ...existingResources];
      persistTransitResource(resourceEntry).then((persistedResource) => {
        if (!persistedResource) return;
        setTransitResources((resources) => {
          let replaced = resources.map((resource) => resource.id === resourceEntry.id ? {
            ...resource,
            ...persistedResource,
            isFavorite: resource.isFavorite,
          } : resource);
          return (
            localforageModule.default.setItem(`transitResources`, replaced),
            isPluginEnv && chrome.storage.local.set({
              transitResources: replaced
            }),
            replaced
          );
        });
      });
      return (
        localforageModule.default.setItem(`transitResources`, updatedResources),
        isPluginEnv && chrome.storage.local.set({
          transitResources: updatedResources
        }),
        updatedResources
      );
    });
  };
  return { addTransitResource };
}
