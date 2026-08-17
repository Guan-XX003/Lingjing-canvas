function inspectRendererStartupDocument(documentRef, windowRef) {
  const root = documentRef.getElementById("root");
  const rootText = String(root?.innerText || root?.textContent || "").replace(/\s+/g, " ").trim();
  const rootRect = root?.getBoundingClientRect?.();
  const navTabCount = documentRef.querySelectorAll(".wanjuan-app-top-nav .wanjuan-app-nav-tab").length;

  return {
    readyState: documentRef.readyState,
    appReady: documentRef.documentElement.dataset.wanjuanAppReady === "true",
    projectId: documentRef.documentElement.dataset.wanjuanProjectId || "",
    themeMode: documentRef.documentElement.dataset.wanjuanThemeMode || "",
    desktopBridge: {
      hasProxyFetch: typeof windowRef.wanjuanDesktop?.proxyFetch === "function",
      hasAbortProxyFetch: typeof windowRef.wanjuanDesktop?.abortProxyFetch === "function",
      hasSaveDownload: typeof windowRef.wanjuanDesktop?.saveDownload === "function",
      hasUploadPublicMedia: typeof windowRef.wanjuanDesktop?.uploadPublicMedia === "function",
      hasMainWorldFetchProxy: windowRef.__wanjuanMainWorldFetchProxyInstalled === true
    },
    hasMainNav: navTabCount >= 4,
    navTabCount,
    isLoading: /^Loading\.\.\.$/.test(rootText),
    rootChildren: root?.childElementCount || 0,
    rootWidth: Math.round(rootRect?.width || 0),
    rootHeight: Math.round(rootRect?.height || 0)
  };
}

function isRendererBaseReady(status) {
  return Boolean(
    status &&
    (status.readyState === "interactive" || status.readyState === "complete") &&
    status.hasMainNav &&
    !status.isLoading &&
    status.rootChildren > 0 &&
    status.rootWidth > 200 &&
    status.rootHeight > 200
  );
}

function createRendererStartupLifecycle() {
  let generation = 0;
  let activeRevealGeneration = 0;
  let revealedGeneration = 0;

  return {
    beginNavigation() {
      generation += 1;
      activeRevealGeneration = 0;
      revealedGeneration = 0;
      return generation;
    },
    beginReveal() {
      if (!generation || revealedGeneration === generation || activeRevealGeneration === generation) return 0;
      activeRevealGeneration = generation;
      return generation;
    },
    isCurrent(attemptGeneration) {
      return attemptGeneration === generation;
    },
    isRevealed(attemptGeneration = generation) {
      return revealedGeneration === attemptGeneration;
    },
    markRevealed(attemptGeneration) {
      if (attemptGeneration !== generation) return false;
      revealedGeneration = attemptGeneration;
      if (activeRevealGeneration === attemptGeneration) activeRevealGeneration = 0;
      return true;
    },
    finishReveal(attemptGeneration) {
      if (activeRevealGeneration === attemptGeneration) activeRevealGeneration = 0;
    },
    snapshot() {
      return { generation, activeRevealGeneration, revealedGeneration };
    }
  };
}

module.exports = {
  createRendererStartupLifecycle,
  inspectRendererStartupDocument,
  isRendererBaseReady
};
