// @ts-nocheck
/**
 * useSafeEffect27（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { normalizeThemeMode } from "../lib/app-utils";
import { wanjuanRunThemeTransition } from "../lib/theme-transition";

interface UseSafeEffect27Deps {
  themeMode: any;
}

export function useSafeEffect27(deps: UseSafeEffect27Deps) {
  const {
    themeMode,
  } = deps;
  useEffect(() => {
    let mediaQuery = window.matchMedia ?
      window.matchMedia(`(prefers-color-scheme: light)`) :
      null,
      rootElement = document.documentElement,
      resolveTheme = () =>
      themeMode === `system` ?
      mediaQuery && mediaQuery.matches ?
      `light` :
      `dark` :
      normalizeThemeMode(themeMode),
      applyTheme = () => {
        let resolvedTheme = resolveTheme();
        let updateThemeClasses = () => {
          (rootElement.classList.remove(
            `theme-dark`,
            `theme-light`,
            `theme-warm-light`,
            `theme-mist-blue`,
            `theme-chrome-blue`,
            `theme-chrome-rose`,
            `theme-chrome-sand`,
            `theme-chrome-teal`,
            `theme-sage-green`,
            `theme-graphite`,
          ),
            rootElement.classList.add(`theme-${resolvedTheme}`));
        };
        window.__wanjuanThemeTransitionReady === true &&
        !rootElement.classList.contains(`theme-${resolvedTheme}`) &&
        wanjuanRunThemeTransition(resolvedTheme, updateThemeClasses) ?
          (window.__wanjuanThemeTransitionReady = true) :
          (updateThemeClasses(), (window.__wanjuanThemeTransitionReady = true));
      };
    return (
      applyTheme(),
      mediaQuery &&
      themeMode === `system` &&
      (mediaQuery.addEventListener ?
        mediaQuery.addEventListener(`change`, applyTheme) :
        mediaQuery.addListener && mediaQuery.addListener(applyTheme)),
      () => {
        mediaQuery &&
          themeMode === `system` &&
          (mediaQuery.removeEventListener ?
            mediaQuery.removeEventListener(`change`, applyTheme) :
            mediaQuery.removeListener && mediaQuery.removeListener(applyTheme));
      }
    );
  }, [themeMode]);
}
