/**
 * useSafeEffect20（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetAny } from "../lib/app-types";
import { WanJuanIsMusicModel } from "../components/audio-nodes";
declare const chrome: any;

interface UseSafeEffect20Deps {
  audioModels: any;
  setAudioModels: SetAny;
  setTtsMusicModel: SetAny;
  ttsMusicModel: any;
}

export function useSafeEffect20(deps: UseSafeEffect20Deps) {
  const {
    audioModels,
    setAudioModels,
    setTtsMusicModel,
    ttsMusicModel,
  } = deps;
  useEffect(() => {
	    let parseModelList = (text) => String(text || ``).split(/[\n,，、]+/).map((model) => model.trim()).filter(Boolean),
	      dedupe = (list) => list.filter((item, index, array) => array.indexOf(item) === index),
	      audioModelList = parseModelList(audioModels),
	      musicModelList = parseModelList(ttsMusicModel),
	      musicModels = audioModelList.filter((model) => WanJuanIsMusicModel(model)),
	      nonMusicModels = musicModelList.filter((model) => !WanJuanIsMusicModel(model));
	    if (!musicModels.length && !nonMusicModels.length) return;
	    let nextAudioModels = dedupe([...audioModelList.filter((model) => !WanJuanIsMusicModel(model)), ...nonMusicModels]).join(`
	`),
	      ttsMusicModelText = dedupe([...musicModelList.filter((model) => WanJuanIsMusicModel(model)), ...musicModels]).join(`
	`);
	    nextAudioModels !== audioModels && setAudioModels(nextAudioModels);
	    ttsMusicModelText !== ttsMusicModel && setTtsMusicModel(ttsMusicModelText);
	    typeof chrome < `u` &&
	      chrome.storage?.local?.set({
	        audioModel: nextAudioModels,
	        ttsMusicModel: ttsMusicModelText
	      });
	  }, [audioModels, ttsMusicModel]);
}
