/**
 * useSafeEffect19（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { ApiConfig, SetAny } from "../lib/app-types";

interface UseSafeEffect19Deps {
  apiConfigs: ApiConfig[];
  audioApiConfigId: any;
  imageApiConfigId: any;
  setAudioApiKey: SetAny;
  setAudioApiUrl: SetAny;
  setImageApiKey: SetAny;
  setImageApiUrl: SetAny;
  setTextApiKey: SetAny;
  setTextApiUrl: SetAny;
  setVideoApiKey: SetAny;
  setVideoApiUrl: SetAny;
  textApiConfigId: any;
  videoApiConfigId: any;
}

export function useSafeEffect19(deps: UseSafeEffect19Deps) {
  const {
    apiConfigs,
    audioApiConfigId,
    imageApiConfigId,
    setAudioApiKey,
    setAudioApiUrl,
    setImageApiKey,
    setImageApiUrl,
    setTextApiKey,
    setTextApiUrl,
    setVideoApiKey,
    setVideoApiUrl,
    textApiConfigId,
    videoApiConfigId,
  } = deps;
  useEffect(() => {
    let textConfig = apiConfigs.find((config) => config.id === textApiConfigId) || apiConfigs[0];
    textConfig && (setTextApiUrl(textConfig.url), setTextApiKey(textConfig.key));
    let imageConfig = apiConfigs.find((config) => config.id === imageApiConfigId) || apiConfigs[0];
    imageConfig && (setImageApiUrl(imageConfig.url), setImageApiKey(imageConfig.key));
    let videoConfig = apiConfigs.find((config) => config.id === videoApiConfigId) || apiConfigs[0];
    videoConfig && (setVideoApiUrl(videoConfig.url), setVideoApiKey(videoConfig.key));
    let audioConfig = apiConfigs.find((config) => config.id === audioApiConfigId) || apiConfigs[0];
    audioConfig && (setAudioApiUrl(audioConfig.url), setAudioApiKey(audioConfig.key));
  }, [apiConfigs, textApiConfigId, imageApiConfigId, videoApiConfigId, audioApiConfigId]);
}
