// @ts-nocheck
/**
 * handleAddPreset。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";

interface UseHandleAddPresetDeps {
  currentLimits: any;
  presetPrompts: any;
  setPresetPrompts: SetAny;
  showToast2: Toast;
}

export function use_handleAddPreset(deps: UseHandleAddPresetDeps) {
  const {
    currentLimits,
    presetPrompts,
    setPresetPrompts,
    showToast2,
  } = deps;
  const handleAddPreset = () => {
                if (false && presetPrompts.length >= currentLimits.presets) {
                  showToast2(`当前${currentLimits.name}最多支持 ${currentLimits.presets} 个预设，请升级会员`);
                  return;
                }
                setPresetPrompts([...presetPrompts, {
                  title: `新预设`,
                  prompt: ``,
                  type: `all`,
                  enabled: true
                }]);
              };
  return { handleAddPreset };
}
