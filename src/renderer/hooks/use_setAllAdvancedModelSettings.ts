// @ts-nocheck
/**
 * setAllAdvancedModelSettings。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_setAllAdvancedModelSettings(deps: any) {
  const {
    setAudioModelSettingsExpanded,
    setConfigButlerExpanded,
    setImageModelSettingsExpanded,
    setSeedanceSettingsExpanded,
    setTextModelSettingsExpanded,
    setTongyiWanxiangSettingsExpanded,
    setTtsMusicSettingsExpanded,
    setVideoModelSettingsExpanded,
  } = deps;
  const setAllAdvancedModelSettings = (expanded2) => {
      (
        setConfigButlerExpanded(expanded2),
        setTextModelSettingsExpanded(expanded2),
        setImageModelSettingsExpanded(expanded2),
        setVideoModelSettingsExpanded(expanded2),
        setAudioModelSettingsExpanded(expanded2),
        setTtsMusicSettingsExpanded(expanded2),
        setSeedanceSettingsExpanded(expanded2),
        setTongyiWanxiangSettingsExpanded(expanded2)
      );
	    };
  return { setAllAdvancedModelSettings };
}
