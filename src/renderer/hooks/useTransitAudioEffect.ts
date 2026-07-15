/**
 * 资源页补录画布视频，并为只有临时远端地址的生成结果补做本地持久化。
 */
import { useEffect, useRef } from "react";
import type { SetState, TransitResource } from "../lib/app-types";
import {
  wanjuanBuildGeneratedVideoResourcesFromNodes,
  wanjuanResourceMediaUrl,
  wanjuanResourceSameIdentity,
  wanjuanTransitResourceNeedsPersistence,
} from "../lib/resource";
declare const chrome: any;

interface UseTransitAudioEffectDeps {
  activeProjectId: any;
  activeView: any;
  isPluginEnv: boolean;
  localforageModule: any;
  persistTransitResource: any;
  setTransitResources: SetState<TransitResource[]>;
  transitResources: TransitResource[];
}

export function useTransitAudioEffect(deps: UseTransitAudioEffectDeps) {
  const {
    activeProjectId,
    activeView,
    isPluginEnv,
    localforageModule,
    persistTransitResource,
    setTransitResources,
    transitResources,
  } = deps;
  const resourcesRef = useRef(transitResources);
  const attemptedPersistenceRef = useRef(new Set<string>());
  resourcesRef.current = transitResources;
  useEffect(() => {
    if (activeView !== `transit`) return;
    let canvasNodesSnapshot = typeof globalThis !== `undefined` && Array.isArray(globalThis.__wanjuanCanvasNodesSnapshot) ?
      globalThis.__wanjuanCanvasNodesSnapshot :
      [];
    let currentResources = resourcesRef.current || [],
      generatedVideoResources = wanjuanBuildGeneratedVideoResourcesFromNodes(canvasNodesSnapshot, currentResources, activeProjectId),
      persistenceCandidates = [...currentResources.filter(wanjuanTransitResourceNeedsPersistence), ...generatedVideoResources],
      candidateKeys = new Set(),
      uniqueCandidates = persistenceCandidates.filter((resource) => {
        let key = String(resource?.id || wanjuanResourceMediaUrl(resource) || ``);
        if (!key || candidateKeys.has(key) || attemptedPersistenceRef.current.has(key)) return !1;
        candidateKeys.add(key);
        attemptedPersistenceRef.current.add(key);
        return !0;
      });
    if (!uniqueCandidates.length) return;
    let commitResource = (original, persisted = null) => {
      let latestResources = resourcesRef.current || [],
        updatedResources = [...latestResources],
        finalResource = persisted || original,
        existingIndex = updatedResources.findIndex((resource) => resource.id === original.id || wanjuanResourceSameIdentity(resource, original));
      if (existingIndex >= 0) {
        if (!persisted) return;
        updatedResources[existingIndex] = { ...updatedResources[existingIndex], ...persisted };
      } else {
        updatedResources.unshift(finalResource);
      }
      resourcesRef.current = updatedResources;
      setTransitResources(updatedResources);
      localforageModule.default.setItem(`transitResources`, updatedResources);
      isPluginEnv && chrome.storage.local.set({ transitResources: updatedResources });
    };
    uniqueCandidates.forEach((resource) => {
      let alreadyListed = (resourcesRef.current || []).some((current) => current.id === resource.id || wanjuanResourceSameIdentity(current, resource));
      if (!alreadyListed) commitResource(resource);
      if (wanjuanTransitResourceNeedsPersistence(resource)) {
        persistTransitResource(resource).then((persistedResource) => {
          persistedResource && commitResource(resource, persistedResource);
        });
      } else if (alreadyListed) {
        let localMediaUrl = wanjuanResourceMediaUrl(resource),
          currentResource = (resourcesRef.current || []).find((current) => current.id === resource.id || wanjuanResourceSameIdentity(current, resource));
        if (currentResource && wanjuanResourceMediaUrl(currentResource) !== localMediaUrl) {
          commitResource(resource, resource);
        }
      }
    });
  }, [activeView, activeProjectId, isPluginEnv, localforageModule, persistTransitResource, setTransitResources]);
}
