// @ts-nocheck
/**
 * probeResourceAlive。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_probeResourceAlive(deps: any) {
  const {} = deps;
  const probeResourceAlive = (resource) =>
              new Promise((resolve) => {
                let type = String(resource?.type || resource?.mediaKind || ``).toLowerCase();
                if (type.startsWith(`text`)) {
                  resolve(true);
                  return;
                }
                if (resource?.tianjiPortraitAssetId || resource?.seedanceAssetId || resource?.isTianjiPortrait || resource?.isSeedanceVirtualPortrait) {
                  resolve(true);
                  return;
                }
                let mediaUrl = String(type.startsWith(`image`) ? resource?.thumbnailUrl || resource?.previewUrl || resource?.url || `` : resource?.url || ``).trim();
                if (!mediaUrl) {
                  resolve(false);
                  return;
                }
                if (/^data:/i.test(mediaUrl)) {
                  resolve(true);
                  return;
                }
                let done = false,
                  finish = (succeeded) => {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    resolve(succeeded);
                  },
                  timer = setTimeout(() => finish(false), 6e3);
                if (type.startsWith(`image`)) {
                  let image = new Image();
                  image.onload = () => finish(image.naturalWidth > 0 || image.width > 0);
                  image.onerror = () => finish(false);
                  image.src = mediaUrl;
                  return;
                }
                if (type.startsWith(`video`) || type.startsWith(`audio`)) {
                  let media = document.createElement(type.startsWith(`video`) ? `video` : `audio`);
                  media.preload = `metadata`;
                  media.muted = true;
                  media.onloadedmetadata = () => finish(true);
                  media.oncanplay = () => finish(true);
                  media.onerror = () => finish(false);
                  media.src = mediaUrl;
                  try {
                    media.load();
                  } catch {
                    finish(false);
                  }
                  return;
                }
                finish(Boolean(mediaUrl));
              });
  return { probeResourceAlive };
}
