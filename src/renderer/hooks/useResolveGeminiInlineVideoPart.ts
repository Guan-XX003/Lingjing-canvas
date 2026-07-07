// @ts-nocheck
/**
 * resolveGeminiInlineVideoPart。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function useResolveGeminiInlineVideoPart(deps: any) {
  const {
    resolveDataUrl,
  } = deps;
  const resolveGeminiInlineVideoPart = async (video) => {
	                  let dataUrl = await resolveDataUrl(video),
	                    dataUrlMatch = String(dataUrl || ``).match(/^data:([^;,]*)(;base64)?,(.*)$/s);
	                  if (!dataUrlMatch || !dataUrlMatch[2] || !dataUrlMatch[3])
	                    throw Error(`参考视频未能转为模型可读取的视频内容，请重新选择本地视频文件或检查资源文件是否存在`);
	                  let mimeType = /^video\//i.test(String(dataUrlMatch[1] || ``).trim()) ?
	                    String(dataUrlMatch[1] || ``).trim() :
	                    /^video\//i.test(String(video?.mime || ``).trim()) ?
	                    String(video?.mime || ``).trim() :
	                    `video/mp4`;
	                  return {
	                    inlineData: {
	                      mimeType: mimeType,
	                      data: String(dataUrlMatch[3] || ``).replace(/\s+/g, ``),
	                    },
	                  };
	                };
  return { resolveGeminiInlineVideoPart };
}
