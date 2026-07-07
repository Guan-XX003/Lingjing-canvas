/**
 * 文本生成（generateText）。自 bundle(WanJuanAppCanvas) 抽出的自定义 hook，逻辑逐字搬运、行为不变。
 * 依赖经 deps 传入；hook 为 .ts，body 里引用的任何未提供名字 tsc 会报错，便于补齐。
 */
import { useCallback } from "react";
import { resolveModelApiBindingIdHelper, resolveModelProtocolBindingHelper } from "../lib/model-binding";
import { mediaUrlToDataUrl, wanjuanCollectNodeReferenceMedia, wanjuanNodeTextValue, wanjuanNormalizeReferenceMediaUrl } from "../lib/reference-media";
import { serializeErrorPreview } from "../lib/log-utils";
import { WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE } from "../lib/upload-defaults";
import { wanjuanResourceKind, wanjuanResourceMediaUrl } from "../lib/resource";

export function useTextGeneration(deps: any) {
  const {
    propTextApiKey,
    propTextApiUrl,
    textModel,
    apiConfigs,
    textModelApiBindings,
    textModelProtocolBindings,
    modelProtocolRegistry,
    planLimits,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
    showToast,
    addGeneratedAsset,
    updateTaskList,
    updateNodeData,
    projectIdRef,
    openImageEditor,
    abortControllersRef,
    customPublicUploadConfig,
    presetPrompts,
    seedanceUploadMode,
    setDailyGenerationCount,
    tosConfig,
  } = deps;
  const generateText = useCallback(
      async (nodeId, prompt, isRegenerate = false, extraOptions) => {
          let dailyLimitKey = `daily-limit-${new Date().toISOString().split(`T`)[0]}`,
            dailyUsageCount = parseInt(localStorage.getItem(dailyLimitKey) || `0`);
          let generatedText = ``, updateGlobalTaskList = updateTaskList,
            textModelName = (
              extraOptions ||
              textModel.split(`
`)[0]
            ).trim(),
            normalizedTextModelName = String(textModelName || ``).trim(),
            selectedTextApiConfigId =
            resolveModelApiBindingIdHelper(textModelApiBindings, textModelName, ``) ||
            ``,
            textConfig = apiConfigs.find(
              (config) => config.id === selectedTextApiConfigId,
            ),
            textApiUrl = textConfig?.url || propTextApiUrl,
            textApiKey = textConfig?.key || propTextApiKey,
            textApiBaseUrl = textApiUrl.replace(/\/$/, ``),
            textApiHost = (() => {
              try {
                return new URL(textApiBaseUrl).host;
              } catch {
                return textApiBaseUrl;
              }
            })(),
            textProtocolBindingName = resolveModelProtocolBindingHelper(
              textModelProtocolBindings,
              textModelName,
              textModelProtocolBindings?.[textModelName],
            ),
            textProtocolDefinition = modelProtocolRegistry?.[textProtocolBindingName],
            inferTextRequestProtocol = (modelCandidateA, modelCandidateB, modelCandidateC, modelCandidateD, apiUrl) => {
              let modelIdentifier = [modelCandidateA, modelCandidateB, modelCandidateC, modelCandidateD]
                .filter(Boolean)
                .map((modelName) => String(modelName).trim())
                .join(` `),
                apiHost = String(apiUrl || ``).trim(),
                isVectorEngineApi = /(?:^|\.)api\.vectorengine\.ai$/i.test(String(apiHost || ``)),
                isGenerateContent = /generatecontent/i.test(modelIdentifier);
              return isVectorEngineApi ? (isGenerateContent || /gemini/i.test(modelIdentifier) ? `gemini-generate-content` : `openai-chat`) : isGenerateContent || /gemini/i.test(modelIdentifier) ? `gemini-generate-content` : `openai-chat`;
            },
            gatewayProtocolOverride =
            !textProtocolDefinition &&
            textConfig?.protocolFormat && textConfig.protocolFormat !== `auto`
              ? textConfig.protocolFormat
              : null,
            forceVectorengineGeminiNative =
            /(?:^|\.)api\.vectorengine\.ai$/i.test(String(textApiHost || ``)) &&
            /gemini/i.test(String(textModelName || ``)),
            textRequestProtocol =
            gatewayProtocolOverride ||
            (forceVectorengineGeminiNative ?
            `gemini-generate-content` :
            textProtocolDefinition?.requestType ||
            inferTextRequestProtocol(
              textModelName,
              textProtocolBindingName,
              textProtocolDefinition?.requestType,
              textProtocolDefinition?.submitPath,
              textApiHost,
            ));
          if (!textApiKey) {
            showToast(`请先在设置中配置文本大模型 API Key`);
            return;
          }
          let textTaskId = `text-${nodeId}-${Date.now()}`;
          (setNodes((nodes2) =>
              nodes2.map((node) =>
                node.id === nodeId ?
                {
                  ...node,
                  data: {
                    ...node.data,
                    loading: true,
                    taskId: textTaskId,
                    seedanceTaskId: undefined,
                    manuallyStopped: false,
                    errorMessage: undefined,
                  },
                } :
                node,
              ),
            ),
            updateGlobalTaskList &&
            updateGlobalTaskList((nodes2) => [
              ...nodes2,
              {
                id: textTaskId,
                type: `text`,
                projectId: projectIdRef.current,
                nodeId: nodeId,
                status: `running`,
                progress: 0,
                createdAt: Date.now(),
                prompt: prompt || `文本生成任务`,
                customOutputType: `text`,
              },
            ]),
            setEdges((edges2) =>
              edges2.map((edge) => (edge.target === nodeId ? {
                ...edge,
                animated: true
              } : edge)),
            ));
          try {
            let edges2 = getEdges(),
              nodes2 = getNodes(),
              incomingEdges = edges2.filter((edge) => edge.target === nodeId),
              imageUrls = [],
              textParts = [],
              videoUrls = [];
            incomingEdges.forEach((edge) => {
              let sourceNode = nodes2.find((node) => node.id === edge.source);
              if (sourceNode) {
                let {
                  images: images,
                  videos: videos
                } = wanjuanCollectNodeReferenceMedia(sourceNode, edge.sourceHandle);
                (imageUrls.push(...images), videoUrls.push(...videos));
                let nodeText = wanjuanNodeTextValue(sourceNode);
                nodeText && textParts.push(nodeText);
              }
            });
            let node = nodes2.find((node2) => node2.id === nodeId);
            node &&
	              node.data.selectedContextResources &&
	              node.data.selectedContextResources.forEach((resource) => {
	                let resourceKind = wanjuanResourceKind(resource);
	                resourceKind === `image` ?
	                  imageUrls.push(wanjuanNormalizeReferenceMediaUrl(resource, `image`)) :
	                  resourceKind === `video` ?
	                  videoUrls.push(wanjuanNormalizeReferenceMediaUrl(resource, `video`)) :
	                  resourceKind === `text` && textParts.push(wanjuanResourceMediaUrl(resource) || resource.url);
	              });
	            imageUrls = imageUrls.map((url) => wanjuanNormalizeReferenceMediaUrl(url, `image`)).filter(Boolean);
	            videoUrls = videoUrls.map((url) => wanjuanNormalizeReferenceMediaUrl(url, `video`)).filter(Boolean);
            let textContent = (
                textParts.length > 0 ?
                `${textParts.join(`
`)}\n${prompt}` :
                prompt
              ).trim(),
              lowerModelName = textModelName.toLowerCase(),
              geminiRoutingHint = [
                normalizedTextModelName,
                textProtocolBindingName,
                textProtocolDefinition?.requestType,
                textProtocolDefinition?.submitPath,
              ]
              .filter(Boolean)
              .join(` `),
              forceGeminiMultimodal =
              (imageUrls.length > 0 || videoUrls.length > 0) &&
              (textRequestProtocol === `gemini-generate-content` ||
                /generatecontent/i.test(geminiRoutingHint)),
              isReasoningModel =
              lowerModelName.includes(`deepseek`) ||
              lowerModelName.includes(`o1-mini`) ||
              lowerModelName.includes(`o3-mini`),
              messages = [],
              textNodeVideoIsPublicUrl = (url) => {
                try {
                  let parsedUrl = new URL(url),
                    hostname = parsedUrl.hostname.toLowerCase();
                  if (parsedUrl.protocol !== `http:` && parsedUrl.protocol !== `https:`) return false;
                  if (hostname === `localhost` || hostname.endsWith(`.localhost`)) return false;
                  if (hostname === `::1` || hostname === `[::1]`) return false;
                  let ipv4Match = hostname.match(/^\d+\.\d+\.\d+\.\d+$/);
                  if (ipv4Match) {
                    let [firstOctet, secondOctet] = hostname.split(`.`).map(Number);
                    return !(
                      firstOctet === 10 ||
                      (firstOctet === 127 && secondOctet >= 0) ||
                      (firstOctet === 192 && secondOctet === 168) ||
                      (firstOctet === 169 && secondOctet === 254) ||
                      (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31)
                    );
                  }
                  return true;
                } catch {
                  return false;
                }
              },
              textNodeVideoLooksLikeDirectUrl = (url) => {
                try {
                  let parsedUrl = new URL(url),
                    pathname = decodeURIComponent(parsedUrl.pathname || ``).toLowerCase(),
                    queryString = decodeURIComponent(parsedUrl.search || ``).toLowerCase(),
                    pathAndQuery = `${pathname}${queryString}`;
                  return (
                    /\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|[?#])/i.test(pathAndQuery) ||
                    /(?:^|[?&])(?:mime|content[-_]?type|response-content-type)=video(?:\/|%2f)/i.test(queryString) ||
                    /(?:^|[?&])filename=[^&]+\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|&)/i.test(queryString)
                  );
                } catch {
                  return false;
                }
              },
              normalizeTextNodeChatVideoUrl = async (url) => {
                  let trimmedUrl = String(url || ``).trim();
                  if (!trimmedUrl) return ``;
                  if (
                    /^https?:\/\//i.test(trimmedUrl) &&
                    textNodeVideoIsPublicUrl(trimmedUrl) &&
                    textNodeVideoLooksLikeDirectUrl(trimmedUrl)
                  )
                    return (
                      console.log(`Text node chat video using direct public URL:`, trimmedUrl),
                      trimmedUrl
                    );
                  let uploadMode = seedanceUploadMode || WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE;
                  try {
                    let uploadResult =
                      uploadMode === `tos` &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadTosMedia == `function` ?
                      await window.wanjuanDesktop.uploadTosMedia({
                        url: trimmedUrl,
                        kind: `video`,
                        filename: `text-node-video-${Date.now()}`,
                        tos: tosConfig || {},
                      }) :
                      uploadMode === `custom` &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadCustomPublicMedia ==
                      `function` ?
                      await window.wanjuanDesktop.uploadCustomPublicMedia({
                        url: trimmedUrl,
                        kind: `video`,
                        filename: `text-node-video-${Date.now()}`,
                        customUpload: customPublicUploadConfig || {},
                      }) :
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadPublicMedia ==
                      `function` ?
                      await window.wanjuanDesktop.uploadPublicMedia({
                        url: trimmedUrl,
                        kind: `video`,
                        filename: `text-node-video-${Date.now()}`,
                      }) :
                      null;
                    if (
                      /^https?:\/\//i.test(uploadResult?.url || ``) &&
                      textNodeVideoIsPublicUrl(uploadResult.url) &&
                      textNodeVideoLooksLikeDirectUrl(uploadResult.url)
                    )
                      return (
                        console.log(`Text node chat video uploaded to public URL:`, trimmedUrl, uploadResult.url),
                        uploadResult.url
                      );
                    uploadResult && console.warn(`Text node video upload did not return a direct public URL:`, uploadResult);
                  } catch (error) {
                    console.warn(`Failed to upload text node video for chat payload:`, trimmedUrl, error);
                  }
                  return /^https?:\/\//i.test(trimmedUrl) && textNodeVideoIsPublicUrl(trimmedUrl) ?
                    (console.warn(
                        `Text node chat video fallback is using non-direct public URL; upstream may still ignore it:`,
                        trimmedUrl,
                      ),
                      trimmedUrl) :
                    (console.warn(
                        `Video was not attached to chat payload because it could not be normalized to a public video URL:`,
                        trimmedUrl,
                      ),
                      ``);
                },
	                requestUrl = null,
	                abortController = new AbortController(),
	                textProtocolProfile =
	                textProtocolDefinition && typeof textProtocolDefinition == `object` ?
	                textProtocolDefinition :
	                {},
	                textProtocolFieldMapping = {
	                  model: `model`,
	                  messages: `messages`,
	                  prompt: `prompt`,
	                  input: `input`,
	                  temperature: `temperature`,
	                  responseFormat: `response_format`,
	                  ...(textProtocolProfile.fieldMapping || {}),
	                },
	                textProtocolFieldValueTypes =
	                textProtocolProfile.fieldValueTypes &&
	                typeof textProtocolProfile.fieldValueTypes == `object` ?
	                textProtocolProfile.fieldValueTypes :
	                {},
	                textProtocolExtraBody =
	                textProtocolProfile.extraBody &&
	                typeof textProtocolProfile.extraBody == `object` ?
	                textProtocolProfile.extraBody :
	                null,
	                textProtocolHasDynamicMapping = !!(
	                  textProtocolProfile.fieldMapping ||
	                  textProtocolExtraBody ||
	                  textProtocolProfile.responseMapping ||
	                  textProtocolProfile.submitPath ||
	                  textRequestProtocol === `openai-responses`
	                ),
	                coerceTextProtocolValue = (fieldKey, value) => {
	                  let normalizedFieldKey = String(fieldKey || ``).trim(),
	                    valueType = textProtocolFieldValueTypes[normalizedFieldKey] ?
	                    String(textProtocolFieldValueTypes[normalizedFieldKey]).trim().toLowerCase() :
	                    ``;
	                  return valueType === `string` ?
	                    String(value ?? ``) :
	                    valueType === `number` ?
	                    Number(value) :
	                    valueType === `boolean` ?
	                    value === true || value === `true` :
	                    value;
	                },
	                putTextProtocolField = (fieldKey, target, value) => {
	                  let normalizedKey = String(fieldKey || ``).trim();
	                  normalizedKey && value !== undefined && value !== null && value !== `` && (target[normalizedKey] = coerceTextProtocolValue(normalizedKey, value));
	                },
	                readTextProtocolResponsePath = (obj, path) => {
	                  let normalizedPath = String(path || ``).trim();
	                  if (!normalizedPath) return undefined;
	                  return normalizedPath.split(`.`).reduce((acc, segment) => {
	                    if (acc === undefined || acc === null) return undefined;
	                    let arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
	                    return arrayMatch ?
	                      acc?.[arrayMatch[1]]?.[Number(arrayMatch[2])] :
	                      /^\d+$/.test(segment) ?
	                      acc?.[Number(segment)] :
	                      acc?.[segment];
	                  }, obj);
	                };
            abortControllersRef.current.set(nodeId, abortController);
            console.log(
              `Text node routing:`,
              JSON.stringify({
                textModelName,
                textProtocolBindingName,
                textRequestProtocol,
                multimodalImageCount: imageUrls.length,
                multimodalVideoCount: videoUrls.length,
                forceGeminiMultimodal,
              }),
            );
	            if (
	              textRequestProtocol === `gemini-generate-content` ||
	              forceGeminiMultimodal ||
	              textProtocolHasDynamicMapping
	            ) {
              let parts = [],
                systemParts = [];
              isRegenerate
                ?
                systemParts.push({
                  text: `你是一个智能内容拆分助手。用户会输入一段文本或要求，你必须将内容拆分成多个独立的部分。你必须返回一个严格的JSON对象，包含一个 'items' 数组。数组中的每个对象必须包含 'title' (最多8个字符) 和 'content' (详细内容) 字段。示例：{"items": [{"title": "场景一", "content": "这是第一部分的详细内容..."}]}。请直接返回纯JSON字符串，不要包含任何额外的解释文字或Markdown代码块。`,
                }) :
                systemParts.push({
                  text: `You are a helpful assistant.`
                });
              textContent && systemParts.push({
                text: textContent
              });
              for (let imageUrl of imageUrls)
                try {
                  imageUrl = await mediaUrlToDataUrl(imageUrl);
                  let dataUrlMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
                  dataUrlMatch && parts.push({
                    inlineData: {
                      mimeType: dataUrlMatch[1],
                      data: dataUrlMatch[2]
                    }
                  });
                } catch (error) {
                  console.warn(`Failed to process image for text node:`, imageUrl, error);
                }
              for (let videoUrl of videoUrls)
                try {
                  let videoDataUrl = await mediaUrlToDataUrl(videoUrl),
                    dataUrlMatch = String(videoDataUrl || ``).match(/^data:([^;,]*)(;base64)?,(.*)$/s);
                  if (!dataUrlMatch || !dataUrlMatch[2] || !dataUrlMatch[3])
                    throw Error(`参考视频未能转为模型可读取的视频内容，请检查资源文件是否存在或重新选择本地视频`);
                  let lowerUrl = String(videoUrl || ``).toLowerCase(),
                    mimeType = /^video\//i.test(String(dataUrlMatch[1] || ``).trim()) ?
                    String(dataUrlMatch[1] || ``).trim() :
                    lowerUrl.includes(`.webm`) ?
                    `video/webm` :
                    lowerUrl.includes(`.mov`) ?
                    `video/quicktime` :
                    lowerUrl.includes(`.m4v`) ?
                    `video/x-m4v` :
                    `video/mp4`;
                  parts.push({
                    inlineData: {
                      mimeType: mimeType,
                      data: String(dataUrlMatch[3] || ``).replace(/\s+/g, ``),
                    },
                  });
                } catch (error) {
                  throw Error(`参考视频处理失败，未发送到模型：${error?.message || error}`);
                }
              parts.length === 0 && systemParts.length === 0 && systemParts.push({
                text: ` `
              });
              let geminiRequest: any = {
                  contents: [{
                    role: `user`,
                    parts: [...systemParts, ...parts],
                  }, ],
                },
                messages2 = [],
                contentParts = [];
              isRegenerate
                ?
                messages2.push({
                  role: `system`,
                  content: `你是一个智能内容拆分助手。用户会输入一段文本或要求，你必须将内容拆分成多个独立的部分。你必须返回一个严格的JSON对象，包含一个 'items' 数组。数组中的每个对象必须包含 'title' (最多8个字符) 和 'content' (详细内容) 字段。示例：{"items": [{"title": "场景一", "content": "这是第一部分的详细内容..."}]}。请直接返回纯JSON字符串，不要包含任何额外的解释文字或Markdown代码块。`,
                }) :
                messages2.push({
                  role: `system`,
                  content: `You are a helpful assistant.`
                });
              for (let imageUrl of imageUrls)
                try {
                  /^https?:/i.test(imageUrl) || imageUrl.startsWith(`data:image/`) || (imageUrl = await mediaUrlToDataUrl(imageUrl));
                  let imageUrl2 = imageUrl;
                  !imageUrl.startsWith(`data:image/`) &&
                    !/^https?:/i.test(imageUrl) &&
                    (imageUrl2 = `data:image/jpeg;base64,${imageUrl.split(`,`).pop()}`);
                  contentParts.push({
                    type: `image_url`,
                    image_url: {
                      url: imageUrl2
                    }
                  });
                } catch (error) {
                  console.warn(`Failed to process image for text node chat payload:`, imageUrl, error);
                }
              for (let videoUrl of videoUrls)
                try {
                  let normalizedVideoUrl = await normalizeTextNodeChatVideoUrl(videoUrl);
                  normalizedVideoUrl
                    ?
                    contentParts.push({
                      type: `video_url`,
                      video_url: {
                        url: normalizedVideoUrl
                      }
                    }) :
                    console.warn(
                      `Video was not attached to chat payload because it could not be normalized to a public video URL:`,
                      videoUrl,
                    );
                } catch (error) {
                  console.warn(`Failed to process video for text node chat payload:`, videoUrl, error);
                }
              textContent ? contentParts.push({
                type: `text`,
                text: textContent
              }) : contentParts.push({
                type: `text`,
                text: ` `
              });
              let endpointOverride = forceVectorengineGeminiNative ?
                `` :
                String(textProtocolDefinition?.submitPath || ``)
                .trim()
                .replace(/\{model\}/gi, encodeURIComponent(textModelName))
                .replace(/\{apiKey\}/gi, encodeURIComponent(textApiKey)),
                authScheme = forceVectorengineGeminiNative ?
                `bearer` :
                String(textProtocolDefinition?.authType || ``)
                .trim()
                .toLowerCase(),
                isGoogleEndpoint = /(?:generativelanguage|googleapis|google\.com)/i.test(
                  textApiBaseUrl,
                ),
	                requestEndpoint = endpointOverride ?
	                endpointOverride :
		                textRequestProtocol === `gemini-generate-content` ?
		                `/v1beta/models/${encodeURIComponent(textModelName)}:generateContent` :
		                textRequestProtocol === `openai-responses` ?
		                `/v1/responses` :
		                textRequestProtocol === `claude-messages` ?
		                `/v1/messages` :
		                `/v1/chat/completions`,
                isGeminiProtocol =
                textRequestProtocol === `gemini-generate-content` ||
                /generatecontent/i.test(requestEndpoint),
	                requestPayload = isGeminiProtocol ?
	                geminiRequest :
	                (messages2.push({
	                  role: `user`,
	                  content: contentParts
	                }), textProtocolHasDynamicMapping ?
		                  (() => {
		                    let requestBody = {},
		                      inputText = `${messages2.map((message) => `${message.role}: ${typeof message.content == `string` ? message.content : JSON.stringify(message.content)}`).join(`
`)}`;
		                    return (
			                      putTextProtocolField(textProtocolFieldMapping.model, requestBody, textModelName),
				                      textRequestProtocol === `openai-responses` ?
				                      putTextProtocolField(textProtocolFieldMapping.input, requestBody, messages2) :
				                      textRequestProtocol === `claude-messages` ?
				                      (() => {
				                        let systemMessage = messages2.find((message) => message.role === `system`)?.content;
				                        systemMessage && putTextProtocolField(textProtocolFieldMapping.system, requestBody, systemMessage);
				                        putTextProtocolField(
				                          textProtocolFieldMapping.messages,
				                          requestBody,
				                          messages2
				                            .filter((message) => message.role !== `system`)
				                            .map((message) => ({
				                              role: message.role === `assistant` ? `assistant` : `user`,
				                              content: Array.isArray(message.content) ?
				                                message.content.map((part) =>
				                                  part?.type === `image_url` ?
				                                  {
				                                    type: `image`,
				                                    source: {
				                                      type: `base64`,
				                                      media_type: String(part.image_url?.url || ``).match(/^data:([^;]+);base64,/)?.[1] || `image/jpeg`,
				                                      data: String(part.image_url?.url || ``).replace(/^data:[^;]+;base64,/, ``),
				                                    },
				                                  } :
				                                  part?.type === `text` ?
				                                  {
				                                    type: `text`,
				                                    text: part.text || ` `
				                                  } :
				                                  {
				                                    type: `text`,
				                                    text: JSON.stringify(part)
				                                  },
				                                ) :
				                                String(message.content || ` `),
				                            })),
				                        );
				                      })() :
				                      textRequestProtocol === `openai-chat` ?
				                      putTextProtocolField(textProtocolFieldMapping.messages, requestBody, messages2) :
			                      (textProtocolProfile.fieldMapping?.messages ||
			                        (!textProtocolProfile.fieldMapping?.prompt &&
			                          !textProtocolProfile.fieldMapping?.input)) &&
			                      putTextProtocolField(textProtocolFieldMapping.messages, requestBody, messages2),
			                      textProtocolProfile.fieldMapping?.prompt &&
			                      putTextProtocolField(textProtocolFieldMapping.prompt, requestBody, textContent || ` `),
			                      textProtocolProfile.fieldMapping?.input &&
			                      textRequestProtocol !== `openai-responses` &&
			                      putTextProtocolField(textProtocolFieldMapping.input, requestBody, inputText || textContent || ` `),
	                      putTextProtocolField(textProtocolFieldMapping.temperature, requestBody, 0.7),
		                      textRequestProtocol !== `claude-messages` &&
		                      isRegenerate &&
	                      !(
	                        textModelName.toLowerCase().includes(`deepseek`) ||
	                        textModelName.toLowerCase().includes(`claude`)
	                      ) &&
	                      putTextProtocolField(textProtocolFieldMapping.responseFormat, requestBody, {
	                        type: `json_object`
	                      }),
	                      textProtocolExtraBody &&
	                      Object.entries(textProtocolExtraBody).forEach(([fieldPath, value]) =>
	                        putTextProtocolField(fieldPath, requestBody, value),
	                      ),
	                      requestBody
	                    );
	                  })() :
	                  {
	                    model: textModelName,
	                    messages: messages2,
	                    temperature: 0.7,
	                    response_format: isRegenerate &&
	                      !(
	                        textModelName.toLowerCase().includes(`deepseek`) ||
	                        textModelName.toLowerCase().includes(`claude`)
	                      ) ?
	                      {
	                        type: `json_object`
	                      } :
	                      undefined,
	                  }),
                headers: any = {
                  "Content-Type": String(textProtocolDefinition?.contentType || `application/json`)
                    .trim() || `application/json`,
                };
              isRegenerate && isGeminiProtocol && (geminiRequest.generationConfig = {
                responseMimeType: `application/json`
              });
	              textProtocolProfile.headers &&
	                typeof textProtocolProfile.headers == `object` &&
	                Object.entries(textProtocolProfile.headers).forEach(([headerName, headerValue]) => {
	                  headers[headerName] = String(headerValue).replace(/\{apiKey\}/gi, textApiKey);
	                });
	              textProtocolProfile.extraHeaders &&
	                typeof textProtocolProfile.extraHeaders == `object` &&
	                Object.entries(textProtocolProfile.extraHeaders).forEach(([headerName, headerValue]) => {
	                  headers[headerName] = String(headerValue).replace(/\{apiKey\}/gi, textApiKey);
	                });
	              authScheme === `none` ?
	                null :
	                authScheme === `x-goog-api-key` && isGoogleEndpoint ?
	                (headers[`x-goog-api-key`] = textApiKey) :
	                authScheme === `x-api-key` || authScheme === `anthropic-x-api-key` ?
	                (headers[`x-api-key`] = textApiKey) :
	                authScheme === `api-key` ?
	                (headers[`api-key`] = textApiKey) :
	                (headers.Authorization || (headers.Authorization = `Bearer ${textApiKey}`));
              let textRequestUrl = (() => {
                let baseUrl = String(textApiBaseUrl || ``)
                  .replace(/\s+/g, ``)
                  .replace(/\/$/, ``),
                  endpointPath = String(requestEndpoint || ``).trim();
                return endpointPath ?
                  /^https?:\/\//i.test(endpointPath) ?
                  endpointPath :
                  `${baseUrl}${endpointPath.startsWith(`/`) ? `` : `/`}${endpointPath}` :
                  baseUrl;
              })();
              console.log(
                `Sending Text API payload:`,
                JSON.stringify(requestPayload, null, 2).substring(0, 1e3) + `...(truncated)`,
              );
              console.log(
                `Sending Text API request info:`,
                JSON.stringify({
                  url: textRequestUrl,
                  authType: isGeminiProtocol ? (authScheme === `x-goog-api-key` && isGoogleEndpoint ? `x-goog-api-key` : `bearer`) : `bearer`,
                  requestType: isGeminiProtocol ? `gemini-compatible` : `chat-completions-multimodal`,
                }),
              );
              requestUrl = textRequestUrl;
              let response = await fetch(requestUrl, {
                method: `POST`,
                headers: headers,
                body: JSON.stringify(requestPayload),
                signal: abortController.signal,
              });
              if ((abortControllersRef.current.delete(parts), !response.ok)) {
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                try {
                  let errorData = await response.json();
                  errorMessage =
                    errorData.error && errorData.error.message ?
                    `API Error: ${errorData.error.message}` :
                    errorData.message ?
                    `API Error: ${errorData.message}` :
                    `API Error: ${response.status} - ${serializeErrorPreview(errorData)}`;
                } catch {
                  try {
                    let errorText = await response.text();
                    errorMessage = `API Error: ${response.status} - ${serializeErrorPreview(errorText)}`;
                  } catch {}
                }
                throw Error(errorMessage);
              }
	              let responseData = await response.json(),
	                textProtocolResponsePaths =
	                textProtocolProfile.responseMapping &&
	                typeof textProtocolProfile.responseMapping == `object` ?
	                textProtocolProfile.responseMapping.text :
	                null,
	                protocolMappedText =
	                (Array.isArray(textProtocolResponsePaths) ?
	                  textProtocolResponsePaths :
	                  textProtocolResponsePaths ?
	                  [textProtocolResponsePaths] :
	                  [])
	                .map((item) => readTextProtocolResponsePath(responseData, item))
	                .find((value) => typeof value == `string` && value.trim()),
	                geminiText =
	                responseData?.candidates?.[0]?.content?.parts
	                ?.map((part) => part.text || ``)
                .join(``)
                .trim() || ``,
                messageText = Array.isArray(responseData?.choices?.[0]?.message?.content) ?
                responseData.choices[0].message.content
                .map((part) => part?.text || part?.content || ``)
                .join(``)
                .trim() :
                String(responseData?.choices?.[0]?.message?.content || ``).trim();
	              generatedText = protocolMappedText || geminiText || messageText || String(responseData?.output_text || responseData?.text || ``).trim();
            } else {
              if (
                (isRegenerate ?
                  messages.push({
                    role: `system`,
                    content: `你是一个智能内容拆分助手。用户会输入一段文本或要求，你必须将内容拆分成多个独立的部分。你必须返回一个严格的JSON对象，包含一个 'items' 数组。数组中的每个对象必须包含 'title' (最多8个字符) 和 'content' (详细内容) 字段。示例：{"items": [{"title": "场景一", "content": "这是第一部分的详细内容..."}]}。请直接返回纯JSON字符串，不要包含任何额外的解释文字或Markdown代码块。`,
                  }) :
                  messages.push({
                    role: `system`,
                    content: `You are a helpful assistant.`,
                  }),
                  (imageUrls.length > 0 || videoUrls.length > 0) && !isReasoningModel)
              ) {
                let contentParts = [];
                for (let imageUrl of imageUrls)
                  try {
                    imageUrl = await mediaUrlToDataUrl(imageUrl);
                    let imageUrl2 = imageUrl;
                    (!imageUrl.startsWith(`data:image/`) &&
                      !imageUrl.startsWith(`http`) &&
                      (imageUrl2 = `data:image/jpeg;base64,${imageUrl.split(`,`).pop()}`),
                      contentParts.push({
                        type: `image_url`,
                        image_url: {
                          url: imageUrl2
                        }
                      }));
                  } catch (error) {
                    console.warn(`Failed to process image for text node:`, imageUrl, error);
                  }
                for (let videoUrl of videoUrls)
                  try {
                    let normalizedVideoUrl = await normalizeTextNodeChatVideoUrl(videoUrl);
                    normalizedVideoUrl
                      ?
                      contentParts.push({
                        type: `video_url`,
                        video_url: {
                          url: normalizedVideoUrl
                        }
                      }) :
                      console.warn(
                        `Video was not attached to text node payload because it could not be normalized to a public video URL:`,
                        videoUrl,
                      );
                  } catch (error) {
                    console.warn(`Failed to process video for text node:`, videoUrl, error);
                  }
                  (textContent ?
                    contentParts.push({
                      type: `text`,
                      text: textContent
                    }) :
                    contentParts.push({
                      type: `text`,
                      text: ` `
                    }),
                    messages.push({
                      role: `user`,
                      content: contentParts
                    }));
              } else messages.push({
                role: `user`,
                content: textContent || ` `
              });
              console.log(
                `Sending Text API payload:`,
                JSON.stringify(messages, null, 2).substring(0, 1e3) + `...(truncated)`,
              );
              requestUrl = `${textApiBaseUrl}/v1/chat/completions`;
              let response = await fetch(requestUrl, {
                method: `POST`,
                headers: {
                  Authorization: `Bearer ${textApiKey}`,
                  "Content-Type": `application/json`,
                },
                body: JSON.stringify({
                  model: textModelName,
                  messages: messages,
                  temperature: 0.7,
                  response_format: isRegenerate &&
                    !(
                      textModelName.toLowerCase().includes(`deepseek`) ||
                      textModelName.toLowerCase().includes(`claude`)
                    ) ?
                    {
                      type: `json_object`
                    } :
                    undefined,
                }),
                signal: abortController.signal,
              });
              if ((abortControllersRef.current.delete(nodeId), !response.ok)) {
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                try {
                  let errorData = await response.json();
                  errorMessage =
                    errorData.error && errorData.error.message ?
                    `API Error: ${errorData.error.message}` :
                    errorData.message ?
                    `API Error: ${errorData.message}` :
                    `API Error: ${response.status} - ${serializeErrorPreview(errorData)}`;
                } catch {
                  try {
                    let responseText = await response.text();
                    errorMessage = `API Error: ${response.status} - ${serializeErrorPreview(responseText)}`;
                  } catch {}
                }
                throw Error(errorMessage);
              }
              generatedText = (await response.json()).choices?.[0]?.message?.content || ``;
            }
            (updateGlobalTaskList &&
              updateGlobalTaskList((taskList) =>
                taskList.map((task) =>
                  task.id === textTaskId ?
                  {
                    ...task,
                    status: `completed`,
                    progress: 100,
                    customResultData: generatedText,
                  } :
                  task,
                ),
              ),
              localStorage.setItem(dailyLimitKey, (dailyUsageCount + 1).toString()),
              setDailyGenerationCount(dailyUsageCount + 1));
            if (isRegenerate)
              try {
                let jsonText = generatedText.replace(/```json/g, ``)
                  .replace(/```/g, ``)
                  .trim(),
                  parsedItems = [];
                try {
                  let parsedJson = JSON.parse(jsonText);
                  parsedItems = parsedJson.items || parsedJson;
                } catch (error) {
                  console.warn(
                    `JSON parsing failed, attempting fallback regex parsing`,
                    error,
                  );
                  let titleContentRegex =
                    /"title"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([^"]+)"/g,
                    match;
                  for (;
                    (match = titleContentRegex.exec(jsonText)) !== null;)
                    parsedItems.push({
                      title: match[1],
                      content: match[2]
                    });
                  if (parsedItems.length === 0)
                    throw Error(`Failed to parse JSON and fallback failed`);
                }
                if (Array.isArray(parsedItems)) {
                  let sourceNode = getNodes().find((node2) => node2.id === nodeId),
                    baseX = (sourceNode?.position.x || 0) + 400,
                    baseY = sourceNode?.position.y || 0,
                    splitNodes = parsedItems.map((item, index) => {
                      let textContent2 = typeof item == `string` ? item : item.content,
                        title = typeof item == `string` ? `Text ${index + 1}` : item.title;
                      return {
                        id: `text-split-${nodeId}-${index}-${Date.now()}`,
                        type: `textNode`,
                        position: {
                          x: baseX,
                          y: baseY + index * 250
                        },
                        data: {
                          text: textContent2,
                          label: title,
                          expanded: false,
                          onGenerateText: generateText,
                          presetPrompts: presetPrompts,
                          splitSourceId: nodeId,
                        },
                      };
                    }),
                    splitEdges = splitNodes.map((node2) => ({
                      id: `e-${nodeId}-${node2.id}`,
                      source: nodeId,
                      target: node2.id,
                      type: `default`,
                    })),
                    visitedNodeIds = new Set(),
                    edgeIds = new Set(),
                    collectDescendants = (sourceId) => {
                      getNodes().forEach((node2) => {
                        node2.data.splitSourceId === sourceId &&
                          (visitedNodeIds.has(node2.id) || (visitedNodeIds.add(node2.id), collectDescendants(node2.id)));
                      });
                    };
                  (collectDescendants(nodeId),
                    getEdges().forEach((edge) => {
                      (visitedNodeIds.has(edge.source) || visitedNodeIds.has(edge.target)) && edgeIds.add(edge.id);
                    }));
                  let clonedNodes = [],
                    clonedEdges = [];
                  return (
                    splitNodes.forEach((newNode) => {
                      let idMap = new Map();
                      idMap.set(nodeId, newNode.id);
                      let queue = [nodeId],
                        visitedEdgeIds = new Set();
                      for (; queue.length > 0;) {
                        let currentNodeId = queue.shift(),
                          outgoingEdges = edges2.filter((edge) => edge.source === currentNodeId);
                        for (let edge of outgoingEdges) {
                          if (visitedEdgeIds.has(edge.id)) continue;
                          visitedEdgeIds.add(edge.id);
                          let targetNode = nodes2.find((node2) => node2.id === edge.target);
                          if (targetNode) {
                            if (visitedNodeIds.has(targetNode.id)) continue;
                            if (!idMap.has(targetNode.id)) {
                              let clonedId = `${targetNode.type}-clone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                              (idMap.set(targetNode.id, clonedId), queue.push(targetNode.id));
                              let clonedNode = {
                                ...targetNode,
                                id: clonedId,
                                position: {
                                  x: newNode.position.x + (targetNode.position.x - sourceNode.position.x),
                                  y: newNode.position.y + (targetNode.position.y - sourceNode.position.y),
                                },
                                selected: false,
                                data: {
                                  ...targetNode.data,
	                                  loading: false,
	                                  errorMessage: undefined,
	                                  selectedContextResources: undefined,
	                                  imageUrl: targetNode.type === `imageNode` ||
	                                    targetNode.type === `promptNode` ?
                                    undefined :
                                    targetNode.data.imageUrl,
                                  expanded: false,
                                  splitSourceId: nodeId,
                                },
                              };
                              clonedNodes.push(clonedNode);
                            }
                            clonedEdges.push({
                              id: `e-${idMap.get(currentNodeId)}-${idMap.get(edge.target)}`,
                              source: idMap.get(currentNodeId),
                              sourceHandle: edge.sourceHandle,
                              target: idMap.get(edge.target),
                              targetHandle: edge.targetHandle,
                            });
                          }
                        }
                      }
                    }),
                    setNodes((nodes3) =>
                      nodes3
                      .filter((node2) => !visitedNodeIds.has(node2.id))
                      .concat(splitNodes)
                      .concat(clonedNodes),
                    ),
                    setEdges((edges3) =>
                      edges3
                      .filter((edge) => !edgeIds.has(edge.id))
                      .concat(splitEdges)
                      .concat(clonedEdges),
                    ),
                    showToast(`已自动拆分为 ${parsedItems.length} 个节点并复制后续节点`), {
                      splitNodes: splitNodes.map((node2) => node2.id),
                      clonedNodes: clonedNodes.map((node2) => node2.id),
                      newEdges: splitEdges.concat(clonedEdges),
                    }
                  );
                } else throw Error(`Result is not an array`);
              } catch (error) {
                (console.warn(`Auto split failed, fallback to normal text`, error),
                  showToast(`自动拆分失败 (格式不符)，已显示完整文本`),
                  setNodes((nodes3) =>
                    nodes3.map((node2) =>
                      node2.id === nodeId ?
                      {
                        ...node2,
                        data: {
                          ...node2.data,
                          text: generatedText,
                          loading: false
                        }
                      } :
                      node2,
                    ),
                  ));
              }
            else
              (setNodes((nodes3) =>
                  nodes3.map((node2) =>
                    node2.id === nodeId ?
                    {
                      ...node2,
                      data: {
                        ...node2.data,
                        text: generatedText,
                        loading: false
                      }
                    } :
                    node2,
                  ),
                ),
                addGeneratedAsset && addGeneratedAsset(generatedText, `text`, `generated`));
            isRegenerate &&
              setNodes((nodes3) =>
                nodes3.map((node2) =>
                  node2.id === nodeId ? {
                    ...node2,
                    data: {
                      ...node2.data,
                      loading: false
                    }
                  } : node2,
                ),
              );
          } catch (error) {
            if (error.name === `AbortError`) {
              console.log(`Fetch aborted`);
              return;
            }
            (updateGlobalTaskList &&
              updateGlobalTaskList((taskList) =>
                taskList.map((task) =>
                  task.id === textTaskId ?
                  {
                    ...task,
                    status: `failed`,
                    errorMsg: error.message
                  } :
                  task,
                ),
              ),
              console.error(error),
              showToast(`生成失败: ${error.message}`),
              setNodes((nodes2) =>
                nodes2.map((node) =>
                  node.id === nodeId ?
                  {
                    ...node,
                    data: {
                      ...node.data,
                      loading: false,
                      errorMessage: error.message
                    },
                  } :
                  node,
                ),
              ));
          } finally {
            (setNodes((nodes2) =>
                nodes2.map((node) =>
                  node.id === nodeId ? {
                    ...node,
                    data: {
                      ...node.data,
                      loading: false
                    }
                  } : node,
                ),
              ),
              setEdges((edges2) =>
                edges2.map((edge) => (edge.target === nodeId ? {
                  ...edge,
                  animated: false
                } : edge)),
              ));
          }
        },
        [
          propTextApiKey,
          propTextApiUrl,
          textModel,
          apiConfigs,
          textModelApiBindings,
          textModelProtocolBindings,
          modelProtocolRegistry,
          planLimits,
          getNodes,
          getEdges,
          setNodes,
          setEdges,
          showToast,
          addGeneratedAsset,
          updateTaskList,
        ],
  );
  return { generateText };
}
