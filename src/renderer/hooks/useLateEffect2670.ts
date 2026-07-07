// @ts-nocheck
/**
 * useLateEffect2670（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useLateEffect2670(deps: any) {
  const {
    activeSettingsTab,
    refreshExtensionToolStatus,
  } = deps;
  useEffect(() => {
	    activeSettingsTab === `extensions` &&
	    (refreshExtensionToolStatus(`deface`),
	      refreshExtensionToolStatus(`qwen-tts`),
	      refreshExtensionToolStatus(`real-esrgan`));
	  }, [activeSettingsTab]);
}
