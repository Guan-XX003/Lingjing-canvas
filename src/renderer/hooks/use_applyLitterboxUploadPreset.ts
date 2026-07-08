// @ts-nocheck
/**
 * applyLitterboxUploadPreset。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
declare const chrome: any;

interface UseApplyLitterboxUploadPresetDeps {
  setCustomPublicUploadConfig: SetAny;
  setCustomUploadConfigExpanded: SetAny;
  setSeedanceUploadMode: SetAny;
  showToast2: Toast;
  customPublicUploadConfig: any;
  seedanceUploadMode: any;
}

export function use_applyLitterboxUploadPreset(deps: UseApplyLitterboxUploadPresetDeps) {
  const {
    setCustomPublicUploadConfig,
    setCustomUploadConfigExpanded,
    setSeedanceUploadMode,
    showToast2,
    customPublicUploadConfig,
    seedanceUploadMode,
  } = deps;
  const applyLitterboxUploadPreset = (ttl = `1h`) => {
      let normalizedTtl = [`1h`, `12h`, `24h`, `72h`].includes(String(ttl || ``)) ? String(ttl) : `1h`,
        nextConfig = {
          endpoint: `https://litterbox.catbox.moe/resources/internals/api.php`,
          fileField: `fileToUpload`,
          fields: `reqtype=fileupload
time=${normalizedTtl}`,
          headers: ``,
          resultPath: ``,
        };
      (setCustomPublicUploadConfig(nextConfig),
        setSeedanceUploadMode(`custom`),
        setCustomUploadConfigExpanded(true),
        typeof chrome < `u` &&
        chrome.storage?.local?.set?.({
          customPublicUploadConfig: nextConfig,
          seedanceUploadMode: `custom`,
        }),
        showToast2(`已应用 Litterbox 临时直链 ${normalizedTtl} 预设`));
    };
  return { applyLitterboxUploadPreset };
}
