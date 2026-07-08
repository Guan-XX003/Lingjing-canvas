/**
 * useTransitAudioEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetAny } from "../lib/app-types";
import { wanjuanBuildGeneratedVideoResourcesFromNodes, wanjuanCollectResourceSignatures } from "../lib/resource";
declare const chrome: any;

interface UseTransitAudioEffectDeps {
  activeProjectId: any;
  activeView: any;
  isPluginEnv: boolean;
  localforageModule: any;
  setTransitResources: SetAny;
  transitResources: any;
}

export function useTransitAudioEffect(deps: UseTransitAudioEffectDeps) {
  const {
    activeProjectId,
    activeView,
    isPluginEnv,
    localforageModule,
    setTransitResources,
    transitResources,
  } = deps;
  useEffect(() => {
    if (activeView !== `transit`) return;
    let canvasNodesSnapshot = typeof globalThis !== `undefined` && Array.isArray(globalThis.__wanjuanCanvasNodesSnapshot) ?
      globalThis.__wanjuanCanvasNodesSnapshot :
      [];
    let generatedVideoResources = wanjuanBuildGeneratedVideoResourcesFromNodes(canvasNodesSnapshot, transitResources, activeProjectId);
    if (!generatedVideoResources.length) return;
    // 把签名计算与持久化移出 setState updater（保持 updater 纯）；transitResources 在 effect 依赖里，是最新提交值
    let existingSignatures = new Set();
    transitResources.forEach((resource) => wanjuanCollectResourceSignatures(resource).forEach((signature) => existingSignatures.add(signature)));
    let missingResources = generatedVideoResources.filter((resource) => !wanjuanCollectResourceSignatures(resource).some((signature) => existingSignatures.has(signature)));
    if (!missingResources.length) return;
    let updatedResources = [...missingResources, ...transitResources];
    setTransitResources(updatedResources);
    localforageModule.default.setItem(`transitResources`, updatedResources);
    isPluginEnv && chrome.storage.local.set({ transitResources: updatedResources });
  }, [activeView, transitResources, activeProjectId]);
}
