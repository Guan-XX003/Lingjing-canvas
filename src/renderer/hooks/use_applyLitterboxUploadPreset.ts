// @ts-nocheck
/**
 * applyLitterboxUploadPreset。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_applyLitterboxUploadPreset(deps: any) {
  const {
    setCustomPublicUploadConfig,
    setCustomUploadConfigExpanded,
    setSeedanceUploadMode,
    showToast2,
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
