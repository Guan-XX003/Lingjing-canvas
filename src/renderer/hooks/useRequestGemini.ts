// @ts-nocheck
/**
 * requestGemini。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function useRequestGemini(deps: any) {
  const {
    baseUrl,
    butlerApiKey,
  } = deps;
  const requestGemini = async (modelName2) => {
            let response = await fetch(
              `${baseUrl}/v1beta/models/${encodeURIComponent(modelName2)}:generateContent?key=${encodeURIComponent(butlerApiKey)}`, {
                method: `POST`,
                headers: {
                  "Content-Type": `application/json`
                },
                body: JSON.stringify({
                  contents: [{
                    role: `user`,
                    parts: [{
                      text: prompt
                    }]
                  }],
                }),
              },
            );
            if (!response.ok) {
              let errorMessage = response.statusText;
              try {
                let errorData = await response.json();
                errorMessage =
                  errorData?.error?.message ||
                  errorData?.message ||
                  JSON.stringify(errorData).slice(0, 400);
              } catch {}
              throw Error(`配置管家请求失败: ${errorMessage}`);
            }
            let responseData = await response.json(),
              textParts =
              responseData?.candidates?.[0]?.content?.parts
              ?.map((part) => part.text || ``)
              .join(``)
              .trim() || ``;
            if (!textParts) throw Error(`配置管家未返回可用内容`);
            return textParts;
          };
  return { requestGemini };
}
