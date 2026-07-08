// @ts-nocheck
/**
 * callConfigButlerModel。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { normalizeButlerBaseUrl } from "../lib/config-butler";

export function useCallConfigButlerModel(deps: any) {
  const {
    configButlerApiKey,
    configButlerApiUrl,
    configButlerProtocol,
    getDefaultButlerModel,
  } = deps;
  const callConfigButlerModel = async (prompt, options = {}) => {
          let butlerApiUrl = String(options.apiUrl ?? configButlerApiUrl ?? ``),
            butlerApiKey = String(options.apiKey ?? configButlerApiKey ?? ``),
            butlerProtocol = String(options.protocol || configButlerProtocol || `openai`),
            baseUrl = normalizeButlerBaseUrl(butlerApiUrl),
            modelName = String(options.model || getDefaultButlerModel() || ``).trim() || getDefaultButlerModel();
          if (!baseUrl || !butlerApiKey)
            throw Error(`请先在配置管家中填写请求地址和 API Key`);
          if (butlerProtocol === `openai`) {
            let response = await fetch(`${baseUrl}/v1/chat/completions`, {
              method: `POST`,
              headers: {
                Authorization: `Bearer ${butlerApiKey}`,
                "Content-Type": `application/json`,
              },
              body: JSON.stringify({
                model: modelName,
                messages: [{
                  role: `user`,
                  content: prompt
                }],
                temperature: 0.1,
              }),
            });
            if (!response.ok) {
              let statusText = String(response.statusText || ``).trim();
              try {
                let errorBody = await response.text();
                errorBody && (statusText = `${statusText} ${errorBody.slice(0, 500)}`.trim());
              } catch {}
              throw Error(`配置管家请求失败: ${response.status} ${statusText || `HTTP Error`}`);
            }
            let responseData = await response.json(),
              content = responseData?.choices?.[0]?.message?.content || ``;
            if (!content) throw Error(`配置管家未返回可用内容`);
            return content;
          }
          let requestGemini = (async (modelName2) => {
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
          });
          try {
            return await requestGemini(modelName);
          } catch (error) {
            if (
              modelName !== `gemini-3-flash-preview` &&
              /无可用渠道|distributor|not found|404/i.test(String(error.message || ``))
            )
              return await requestGemini(`gemini-3-flash-preview`);
	            throw error;
	          }
	        };
  return { callConfigButlerModel };
}
