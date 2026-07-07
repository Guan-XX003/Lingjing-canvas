// @ts-nocheck
/**
 * findImageTaskUrl。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function useFindImageTaskUrl(deps: any) {
  const {} = deps;
  const findImageTaskUrl = (value) => {
                          if (!value) return ``;
                          if (typeof value == `string`) {
                            let cleaned = value.replace(/[`\s]/g, ``);
                            if (/^data:image\//i.test(cleaned)) return cleaned;
                            if (/^https?:\/\//i.test(cleaned) && (/\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(cleaned) || /oss|cos|cdn|image|img|file|tmpfiles/i.test(cleaned))) return cleaned;
                            try {
                              let parsed = JSON.parse(value),
                                imageUrl = findImageTaskUrl(parsed);
                              if (imageUrl) return imageUrl;
                            } catch {}
                            let urlMatches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
                            for (let url of urlMatches) {
                              let cleaned2 = url.replace(/[`\s]/g, ``);
                              if (/\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(cleaned2) || /oss|cos|cdn|image|img|file|tmpfiles/i.test(cleaned2)) return cleaned2;
                            }
                            return ``;
                          }
                          if (Array.isArray(value)) {
                            for (let value2 of value) {
                              let imageUrl = findImageTaskUrl(value2);
                              if (imageUrl) return imageUrl;
                            }
                            return ``;
                          }
                          if (typeof value == `object`) {
                            let urlKeys = [
                              `download_url`,
                              `downloadUrl`,
                              `original_url`,
                              `originalUrl`,
                              `origin_url`,
                              `originUrl`,
                              `large_image_url`,
                              `largeImageUrl`,
                              `result_url`,
                              `resultUrl`,
                              `output_url`,
                              `outputUrl`,
                              `image_url`,
                              `imageUrl`,
                              `b64_json`,
                              `url`,
                            ];
                            for (let key of urlKeys) {
                              let imageUrl = findImageTaskUrl(key === `b64_json` && value[key] ? `data:image/png;base64,${value[key]}` : value[key]);
                              if (imageUrl) return imageUrl;
                            }
	                            for (let [key, value2] of Object.entries(value)) {
	                              if ([`urls`, `url_list`, `reference`, `references`, `input`, `inputs`, `request`, `params`, `payload`, `prompt`, `thumbnail`, `thumbnail_url`, `thumbnailUrl`, `preview`, `preview_url`, `previewUrl`, `cover`, `cover_url`, `coverUrl`].includes(String(key).toLowerCase()))
	                                continue;
	                              let imageUrl = findImageTaskUrl(value2);
	                              if (imageUrl) return imageUrl;
	                            }
	                          }
	                          return ``;
	                        };
  return { findImageTaskUrl };
}
