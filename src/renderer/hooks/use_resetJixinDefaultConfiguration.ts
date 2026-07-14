/**
 * resetJixinDefaultConfiguration。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Ref, Toast } from "../lib/app-types";
import { WANJUAN_TIANJI_CONFIG_MIRROR_KEY } from "../lib/tianji-api";
declare const chrome: any;

interface UseResetJixinDefaultConfigurationDeps {
  apiModelCloudSettingsSaveTimerRef: Ref;
  applyJixinDefaultResetPatch: any;
  buildJixinDefaultResetPatch: any;
  showToast2: Toast;
}

export function use_resetJixinDefaultConfiguration(deps: UseResetJixinDefaultConfigurationDeps) {
  const {
    apiModelCloudSettingsSaveTimerRef,
    applyJixinDefaultResetPatch,
    buildJixinDefaultResetPatch,
    showToast2,
  } = deps;
  const resetJixinDefaultConfiguration = () => {
      let confirmed = window.confirm(
        `恢复极鑫默认配置会清空当前统一 API、模型列表、模型绑定、协议配置、配置管家和即梦天玑授权信息，需要重新填写 Key。\n\n不会删除画布项目、资源库、智能体、工作空间、下载目录和人像素材库。\n\n确定继续吗？`,
      );
      if (!confirmed) return;
      let resetPatch = buildJixinDefaultResetPatch();
      apiModelCloudSettingsSaveTimerRef.current &&
        clearTimeout(apiModelCloudSettingsSaveTimerRef.current);
      apiModelCloudSettingsSaveTimerRef.current = 0;
      applyJixinDefaultResetPatch(resetPatch);
      try {
        window.localStorage?.removeItem(WANJUAN_TIANJI_CONFIG_MIRROR_KEY);
      } catch {}
      typeof chrome < `u` &&
        chrome.storage?.local?.set?.(resetPatch, () => {
          showToast2(`已恢复极鑫默认配置，请重新填写 Key`);
        });
    };
  return { resetJixinDefaultConfiguration };
}
