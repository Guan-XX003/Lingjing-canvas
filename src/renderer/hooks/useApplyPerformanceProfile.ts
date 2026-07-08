// @ts-nocheck
/**
 * applyPerformanceProfile。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetAny } from "../lib/app-types";
import { WANJUAN_PERFORMANCE_PROFILE_CUSTOM_KEY, WANJUAN_PERFORMANCE_PROFILE_PRESETS, WANJUAN_PERFORMANCE_PROFILE_STORAGE_KEY, WanJuanNormalizePerformanceProfile } from "../lib/performance-profile";
declare const chrome: any;

interface UseApplyPerformanceProfileDeps {
  layeredRunConcurrencyOptions: any;
  layeredRunMaxConcurrency: any;
  setLayeredRunConcurrencyOptions: SetAny;
  setLayeredRunMaxConcurrency: SetAny;
  setPerformanceProfile: SetAny;
}

export function useApplyPerformanceProfile(deps: UseApplyPerformanceProfileDeps) {
  const {
    layeredRunConcurrencyOptions,
    layeredRunMaxConcurrency,
    setLayeredRunConcurrencyOptions,
    setLayeredRunMaxConcurrency,
    setPerformanceProfile,
  } = deps;
  const applyPerformanceProfile = useCallback((profileKey) => {
    let normalizedKey = WanJuanNormalizePerformanceProfile(profileKey),
      preset = WANJUAN_PERFORMANCE_PROFILE_PRESETS[normalizedKey] || WANJUAN_PERFORMANCE_PROFILE_PRESETS.balanced,
      customSettings = normalizedKey === `custom` ? {
        ...WANJUAN_PERFORMANCE_PROFILE_PRESETS.custom,
        layeredRunConcurrencyOptions: layeredRunConcurrencyOptions || WANJUAN_PERFORMANCE_PROFILE_PRESETS.custom.layeredRunConcurrencyOptions,
        layeredRunMaxConcurrency: Math.max(1, Math.min(20, Number(layeredRunMaxConcurrency) || WANJUAN_PERFORMANCE_PROFILE_PRESETS.custom.layeredRunMaxConcurrency)),
      } : null,
      nextSettings = customSettings || preset;
    setPerformanceProfile(normalizedKey);
    if (normalizedKey !== `custom`) {
      setLayeredRunConcurrencyOptions(preset.layeredRunConcurrencyOptions);
      setLayeredRunMaxConcurrency(preset.layeredRunMaxConcurrency);
    }
    try {
      window.localStorage?.setItem(WANJUAN_PERFORMANCE_PROFILE_STORAGE_KEY, normalizedKey);
      customSettings && window.localStorage?.setItem(WANJUAN_PERFORMANCE_PROFILE_CUSTOM_KEY, JSON.stringify(customSettings));
      document.documentElement.classList.remove(`wj-perf-performance`, `wj-perf-balanced`, `wj-perf-quality`, `wj-perf-custom`);
      document.documentElement.classList.add(`wj-perf-${normalizedKey}`);
      document.documentElement.dataset.wanjuanPerformanceProfile = normalizedKey;
      document.documentElement.dataset.wanjuanRenderMode = nextSettings.renderMode || normalizedKey;
      window.dispatchEvent(new CustomEvent(`wanjuan:performance-profile-changed`, {
        detail: {
          key: normalizedKey,
          settings: {
            ...nextSettings,
            key: normalizedKey,
          },
        },
      }));
    } catch {}
    try {
      typeof chrome < `u` && chrome.storage?.local?.set?.({
        [WANJUAN_PERFORMANCE_PROFILE_STORAGE_KEY]: normalizedKey,
        ...(normalizedKey === `custom` ? {} : {
          layeredRunConcurrencyOptions: preset.layeredRunConcurrencyOptions,
          layeredRunMaxConcurrency: preset.layeredRunMaxConcurrency,
        }),
      });
    } catch {}
    try {
      let performancePromise = window.wanjuanDesktop?.setPerformanceProfile?.(normalizedKey, customSettings);
      performancePromise?.catch?.((error) => console.warn(`set performance profile failed`, error));
    } catch {}
  }, [layeredRunConcurrencyOptions, layeredRunMaxConcurrency]);
  return { applyPerformanceProfile };
}
