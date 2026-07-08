// @ts-nocheck
/**
 * persistSeedanceVirtualPortraits。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
import { wanjuanNormalizeSeedanceVirtualPortraits } from "../lib/seedance";
declare const chrome: any;

interface UsePersistSeedanceVirtualPortraitsDeps {
  setSeedanceVirtualPortraits: SetAny;
  seedanceVirtualPortraits: any;
}

export function use_persistSeedanceVirtualPortraits(deps: UsePersistSeedanceVirtualPortraitsDeps) {
  const {
    setSeedanceVirtualPortraits,
    seedanceVirtualPortraits,
  } = deps;
  const persistSeedanceVirtualPortraits = (portraits) => {
      let normalizedPortraits = wanjuanNormalizeSeedanceVirtualPortraits(portraits);
      (setSeedanceVirtualPortraits(normalizedPortraits),
        typeof chrome < `u` &&
        chrome.storage?.local?.set({
          seedanceVirtualPortraits: normalizedPortraits
        }));
      return normalizedPortraits;
    };
  return { persistSeedanceVirtualPortraits };
}
