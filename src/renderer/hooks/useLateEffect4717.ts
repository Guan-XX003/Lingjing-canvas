/**
 * useLateEffect4717（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetAny } from "../lib/app-types";

interface UseLateEffect4717Deps {
  WANJUAN_JIXIN_DOC_URL: any;
  configButlerDocUrl: any;
  isReady: boolean;
  setConfigButlerDocUrl: SetAny;
  settingsHydratedRef: Ref;
}

export function useLateEffect4717(deps: UseLateEffect4717Deps) {
  const {
    WANJUAN_JIXIN_DOC_URL,
    configButlerDocUrl,
    isReady,
    setConfigButlerDocUrl,
    settingsHydratedRef,
  } = deps;
  useEffect(() => {
    if (!isReady || !settingsHydratedRef.current) return;
    if (!configButlerDocUrl) setConfigButlerDocUrl(WANJUAN_JIXIN_DOC_URL);
  }, [isReady, configButlerDocUrl]);
}
