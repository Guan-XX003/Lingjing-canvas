// @ts-nocheck
/**
 * unlockAdvancedSettings。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_unlockAdvancedSettings(deps: any) {
  const {
    setAdvancedSettingsUnlocked,
    setSettingsNavUnlockClicks,
    showToast2,
    advancedSettingsUnlocked,
  } = deps;
  const unlockAdvancedSettings = () => {
      (setAdvancedSettingsUnlocked(true),
        setSettingsNavUnlockClicks(0));
      try {
        localStorage.setItem(`wanjuanAdvancedSettingsUnlocked`, `true`);
        typeof chrome < `u` &&
          chrome.storage?.local?.set?.({
            advancedSettingsUnlocked: true,
          });
      } catch {}
      showToast2(`高级设置已解锁`);
    };
  return { unlockAdvancedSettings };
}
