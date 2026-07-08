// @ts-nocheck
/**
 * useSafeEffect46（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetAny } from "../lib/app-types";
import { wanjuanResourceKind } from "../lib/resource";
declare const chrome: any;

interface UseSafeEffect46Deps {
  activeView: any;
  isPluginEnv: boolean;
  localforageModule: any;
  setEdges: SetAny;
  setMaxPollingDuration: SetAny;
  setTransitResources: SetAny;
  transitResources: any;
}

export function useSafeEffect46(deps: UseSafeEffect46Deps) {
  const {
    activeView,
    isPluginEnv,
    localforageModule,
    setEdges,
    setMaxPollingDuration,
    setTransitResources,
    transitResources,
  } = deps;
  useEffect(() => {
	    if (activeView !== `transit`) return;
	    let nodes = Array.isArray(setMaxPollingDuration.current) ? setMaxPollingDuration.current : [],
	      externalUploads = [];
	    for (let node of nodes) {
	      let nodeData = node?.data || {},
	        sourceOrigin = String(nodeData.sourceOrigin || nodeData.mediaSourceOrigin || ``).trim();
	      let mediaUrl = node.type === `textNode` ? nodeData.text : nodeData.imageUrl || nodeData.videoUrl || nodeData.audioUrl || nodeData.url || nodeData.resultData;
	      let legacyName = String(nodeData.originalName || nodeData.label || nodeData.name || ``).trim(),
	        legacyNameLower = legacyName.toLowerCase(),
	        externalOriginHit = [`external-upload`, `uploaded`, `user-upload`, `user-media`, `local-file`, `relinked`].includes(sourceOrigin),
	        legacyUploadedFile =
	          !sourceOrigin &&
	          legacyName &&
	          !/^wanjuan-generated|^generated(?:\s|$)|^ai生成内容$/i.test(legacyName) &&
	          /\.(png|jpe?g|webp|gif|svg|bmp|mp4|webm|mov|m4v|mpeg|mpg|avi|mkv|mp3|wav|ogg|m4a|aac|flac|txt|md|json|csv|srt)$/i.test(legacyNameLower) &&
	          (/^(data:|blob:|file:\/\/|https?:\/\/)/i.test(String(mediaUrl || ``)) || node.type === `textNode`);
	      if (!externalOriginHit && !legacyUploadedFile) continue;
	      if (typeof mediaUrl != `string` || !mediaUrl || transitResources.some((resource) => resource.url === mediaUrl) || externalUploads.some((resource) => resource.url === mediaUrl)) continue;
	      let resourceKind = wanjuanResourceKind({
	          type: nodeData.mediaKind || nodeData.type,
	          url: mediaUrl
	        }),
	        mimeType = resourceKind === `video` ? `video/mp4` : resourceKind === `audio` ? `audio/mpeg` : resourceKind === `text` ? `text` : `image/png`,
	        resourceName = nodeData.originalName || nodeData.label || nodeData.name || (resourceKind === `video` ? `视频素材` : resourceKind === `audio` ? `音频素材` : resourceKind === `text` ? `文本素材` : `图片素材`),
	        hash = 0;
	      for (let charIndex = 0; charIndex < mediaUrl.length; charIndex++) hash = (hash * 31 + mediaUrl.charCodeAt(charIndex)) >>> 0;
	      externalUploads.push({
	        id: `external-upload-${node.id || hash}-${hash.toString(16)}`,
	        url: mediaUrl,
	        type: mimeType,
	        timestamp: Date.now(),
	        pageUrl: `canvas:${setEdges.current || `default`}`,
	        pageTitle: resourceName,
	        source: `external-upload`,
	        sourceOrigin: `external-upload`,
	        originalName: resourceName,
	      });
	    }
	    typeof document < `u` &&
	      document.querySelectorAll(`.react-flow__node video[src], .react-flow__node audio[src], .react-flow__node img[src]`).forEach((mediaElement, index) => {
	        let srcUrl = (mediaElement.currentSrc || mediaElement.src || mediaElement.getAttribute(`src`) || ``).trim();
	        if (!srcUrl || transitResources.some((resource) => resource.url === srcUrl) || externalUploads.some((resource) => resource.url === srcUrl)) return;
	        let nodeElement = mediaElement.closest(`.react-flow__node`),
	          nodeText = nodeElement?.textContent?.trim() || ``,
	          matchedFileName = nodeText.match(/[\w\u4e00-\u9fa5 ()（）._-]+\.(?:png|jpe?g|webp|gif|svg|bmp|mp4|webm|mov|m4v|mpeg|mpg|avi|mkv|mp3|wav|ogg|m4a|aac|flac)/i)?.[0]?.trim() || ``;
	        if (!matchedFileName || /^wanjuan-generated|^generated(?:\s|$)|^ai生成内容$/i.test(matchedFileName)) return;
	        let resourceKind = wanjuanResourceKind({
	            type: mediaElement.tagName === `VIDEO` ? `video` : mediaElement.tagName === `AUDIO` ? `audio` : `image`,
	            url: srcUrl
	          }),
	          mimeType = resourceKind === `video` ? `video/mp4` : resourceKind === `audio` ? `audio/mpeg` : `image/png`,
	          hash = 0;
	        for (let charIndex = 0; charIndex < srcUrl.length; charIndex++) hash = (hash * 31 + srcUrl.charCodeAt(charIndex)) >>> 0;
	        externalUploads.push({
	          id: `external-dom-${resourceKind}-${hash.toString(16)}-${index}`,
	          url: srcUrl,
	          type: mimeType,
	          timestamp: Date.now(),
	          pageUrl: `canvas:${setEdges.current || `default`}`,
	          pageTitle: matchedFileName,
	          source: `external-upload`,
	          sourceOrigin: `external-upload`,
	          originalName: matchedFileName,
	        });
	      });
	    externalUploads.length > 0 &&
	      setTransitResources((newResources) => {
	        let mergedResources = [...externalUploads, ...newResources];
	        return (
	          localforageModule.default.setItem(`transitResources`, mergedResources),
	          isPluginEnv && chrome.storage.local.set({
	            transitResources: mergedResources
	          }),
	          mergedResources
	        );
	      });
	  }, [activeView, transitResources]);
}
