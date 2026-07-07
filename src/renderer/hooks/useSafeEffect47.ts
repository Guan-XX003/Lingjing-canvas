// @ts-nocheck
/**
 * useSafeEffect47（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
declare const chrome: any;

export function useSafeEffect47(deps: any) {
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
      audioResources = [],
      isAudioUrl = (value) => {
        if (!value || typeof value != `string`) return false;
        let trimmed = value.trim();
        return /^(https?:\/\/|file:\/\/|blob:|data:audio\/)/i.test(trimmed) || /\.(mp3|wav|ogg|m4a|aac|flac)(?:$|[?#])/i.test(trimmed);
      },
      extractAudioUrl = (value) => {
        if (!value || typeof value != `string`) return null;
        let trimmed = value.trim();
        if (isAudioUrl(trimmed)) return trimmed;
        try {
          let parsed = JSON.parse(trimmed);
          if (typeof parsed == `string` && isAudioUrl(parsed)) return parsed.trim();
          if (parsed && typeof parsed == `object`) {
            let audioUrl = parsed.audioUrl || parsed.url || parsed.outputUrl || parsed.resultUrl || parsed.audio_url || parsed.audio || parsed.data?.audioUrl || parsed.data?.url;
            if (typeof audioUrl == `string` && isAudioUrl(audioUrl)) return audioUrl.trim();
          }
        } catch {}
        return null;
      },
      getAudioMime = (url) => {
        let mimeType = `audio/mpeg`;
        return /^data:audio\/wav/i.test(url) || /\.wav(?:$|[?#])/i.test(url) ? mimeType = `audio/wav` : /^data:audio\/ogg/i.test(url) || /\.ogg(?:$|[?#])/i.test(url) ? mimeType = `audio/ogg` : /^data:audio\/mp4/i.test(url) || /\.(m4a|aac)(?:$|[?#])/i.test(url) ? mimeType = `audio/mp4` : /^data:audio\/flac/i.test(url) || /\.flac(?:$|[?#])/i.test(url) ? mimeType = `audio/flac` : /^data:audio\/mpeg/i.test(url) || /\.mp3(?:$|[?#])/i.test(url) ? mimeType = `audio/mpeg` : mimeType;
      };
    for (let node of nodes) {
      let nodeData = node?.data || {},
        isAudioNode = [`qwenTtsCloneNode`, `ttsMusicNode`, `musicNode`, `audioNode`].includes(node?.type),
        audioUrlCandidate = nodeData.audioUrl || nodeData.resultAudioUrl || nodeData.outputAudioUrl || nodeData.audio_url || nodeData.url || (isAudioNode || nodeData.mediaKind === `audio` ? nodeData.imageUrl || nodeData.resultData || nodeData.text : ``),
        audioUrlString = typeof audioUrlCandidate == `string` ? audioUrlCandidate : ``,
        extractedAudioUrl = extractAudioUrl(audioUrlString);
      if (!extractedAudioUrl) continue;
      let audioUrl = extractedAudioUrl;
      if (transitResources.some((resource) => resource.url === audioUrl) || audioResources.some((resource) => resource.url === audioUrl)) continue;
      let audioMimeType = getAudioMime(audioUrl),
        hash = 0;
      for (let charIndex = 0; charIndex < audioUrl.length; charIndex++) hash = (hash * 31 + audioUrl.charCodeAt(charIndex)) >>> 0;
      audioResources.push({
        id: `audio-${node.id}-${hash.toString(16)}`,
        url: audioUrl,
        type: audioMimeType,
        timestamp: Date.now(),
        pageUrl: `canvas:${setEdges.current || `default`}`,
        pageTitle: nodeData.audioName || nodeData.label || (node.type === `qwenTtsCloneNode` ? `Qwen-TTS 音频` : node.type === `musicNode` ? `音乐资源` : node.type === `ttsMusicNode` ? `音频资源` : `音频资源`),
        source: `generated`,
      });
    }
    typeof document < `u` &&
      document.querySelectorAll(`.react-flow__node audio[src], audio[src]`).forEach((audioElement, index) => {
        let srcUrl = (audioElement.currentSrc || audioElement.src || audioElement.getAttribute(`src`) || ``).trim();
        if (!srcUrl || !isAudioUrl(srcUrl) || transitResources.some((resource) => resource.url === srcUrl) || audioResources.some((resource) => resource.url === srcUrl)) return;
        let nodeElement = audioElement.closest(`.react-flow__node`),
          nodeText = nodeElement?.textContent?.trim() || ``,
          audioLabel = nodeText.includes(`Qwen-TTS`) ? `Qwen-TTS 音频` : nodeText.includes(`TTS`) ? `TTS 音频` : nodeText.match(/[\w\u4e00-\u9fa5 ._-]+\.(?:mp3|wav|ogg|m4a|aac|flac)/i)?.[0]?.trim() || nodeText.split(/\s+/).slice(0, 4).join(` `) || `音频资源`,
          hash = 0;
        for (let charIndex = 0; charIndex < srcUrl.length; charIndex++) hash = (hash * 31 + srcUrl.charCodeAt(charIndex)) >>> 0;
        audioResources.push({
          id: `audio-dom-${hash.toString(16)}-${index}`,
          url: srcUrl,
          type: getAudioMime(srcUrl),
          timestamp: Date.now(),
          pageUrl: `canvas:${setEdges.current || `default`}`,
          pageTitle: audioLabel || `音频资源`,
          source: `generated`,
        });
      });
    audioResources.length > 0 &&
      setTransitResources((newResources) => {
        let mergedResources = [...audioResources, ...newResources];
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
