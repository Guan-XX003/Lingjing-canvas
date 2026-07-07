// @ts-nocheck
/**
 * applyTianjiSeedanceSettingsMode。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_applyTianjiSeedanceSettingsMode(deps: any) {
  const {
    setTianjiSeedanceSettingsMode,
  } = deps;
  const applyTianjiSeedanceSettingsMode = (mode) => {
	      let normalizedMode = mode === `tianji` ? `tianji` : `official`;
      setTianjiSeedanceSettingsMode(normalizedMode);
      try {
        document.querySelector(`.wanjuan-seedance-settings-card`)?.classList?.toggle(`wanjuan-tianji-mode-active`, normalizedMode === `tianji`);
        let panel = document.querySelector(`.wanjuan-tianji-settings-card`);
        panel && (panel.hidden = normalizedMode !== `tianji`);
        document.querySelectorAll(`[data-tianji-mode]`).forEach((button) => {
          let isActive = button.getAttribute(`data-tianji-mode`) === normalizedMode;
          button.classList?.toggle(`is-active`, isActive);
          button.setAttribute?.(`aria-pressed`, isActive ? `true` : `false`);
          button.removeAttribute?.(`style`);
        });
      } catch (error) {
        console.warn(`Failed to apply Tianji settings mode`, error);
      }
      try {
        typeof chrome < `u` &&
          chrome.storage?.local?.set?.({
            tianjiSeedanceSettingsMode: normalizedMode,
          });
      } catch (error) {
        console.warn(`Failed to persist Tianji settings mode`, error);
      }
    };
  return { applyTianjiSeedanceSettingsMode };
}
