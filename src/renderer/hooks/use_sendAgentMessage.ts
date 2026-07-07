// @ts-nocheck
/**
 * sendAgentMessage。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { mediaUrlToDataUrl } from "../lib/reference-media";
import { readAgentAttachmentFileAsDataUrl, releaseAgentAttachment, sanitizeAgentConversationText, selectKnowledgeChunksForQuery } from "../lib/agent";
import { resolveModelApiBindingIdHelper, resolveModelProtocolBindingHelper } from "../lib/model-binding";
import { serializeErrorPreview } from "../lib/log-utils";

export function use_sendAgentMessage(deps: any) {
  const {
    agentAttachments,
    agentComposer,
    agentConversations,
    agentModelOptions,
    apiConfigs,
    modelProtocolRegistry,
    searchAgentLongTermMemory,
    selectedAgent,
    setAgentAttachments,
    setAgentComposer,
    setAgentConversations,
    showToast2,
    storeAgentLongTermMemory,
    textApiConfigId,
    textApiKey,
    textApiUrl,
    textModelApiBindings,
    textModelProtocolBindings,
  } = deps;
  const sendAgentMessage = async () => {
              if (!selectedAgent || (!agentComposer.trim() && agentAttachments.length === 0))
                return;
              let messageText = agentComposer.trim(),
                selectedAttachments = agentAttachments.slice(0, 6),
                messageContent = messageText || (selectedAttachments.length > 0 ? `请结合我提供的参考内容进行分析。` : ``),
                userMessage = {
                  id: `user-${Date.now()}`,
                  role: `user`,
                  content: messageContent,
                  attachments: selectedAttachments.map((item) => ({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    mime: item.mime,
                    size: item.size,
                  })),
                  createdAt: Date.now(),
                },
                modelName = selectedAgent.model || agentModelOptions[0] || ``,
                assistantMessageId = `assistant-${Date.now() + 1}`,
                assistantMessage = {
                  id: assistantMessageId,
                  role: `assistant`,
                  content: `正在思考...`,
                  createdAt: Date.now() + 1,
                },
                isPublicUrl = useIsPublicUrl({}).isPublicUrl,
                isNonVideoUrl = useIsNonVideoUrl({}).isNonVideoUrl,
                resolveFileUri = useResolveFileUri({ customPublicUploadConfig, isNonVideoUrl, isPublicUrl, qiniuConfig, seedanceUploadMode, tosConfig }).resolveFileUri,
	                resolveDataUrl = async (attachment) =>
	                  /^blob:/i.test(String(attachment?.url || ``)) && attachment?.file ?
	                  await readAgentAttachmentFileAsDataUrl(attachment) :
	                  await mediaUrlToDataUrl(attachment.url),
	                resolveGeminiInlineVideoPart = useResolveGeminiInlineVideoPart({ resolveDataUrl }).resolveGeminiInlineVideoPart;
              (setAgentConversations((prevConversations) => ({
                  ...prevConversations,
                  [selectedAgent.id]: [...(prevConversations[selectedAgent.id] || []), userMessage, assistantMessage],
                })),
                setAgentComposer(``),
                setAgentAttachments(() => []));
              try {
                let apiBindingId =
                  resolveModelApiBindingIdHelper(
                    textModelApiBindings,
                    modelName,
                    selectedAgent.apiConfigId || textApiConfigId,
                  ) ||
                  selectedAgent.apiConfigId ||
                  textApiConfigId,
                  apiBinding = apiConfigs.find((binding) => binding.id === apiBindingId),
                  apiUrl = apiBinding?.url || textApiUrl,
                  apiKey = apiBinding?.key || textApiKey,
                  baseUrl = String(apiUrl || ``).replace(/\/$/, ``),
                  apiHost = (() => {
                    try {
                      return new URL(baseUrl).host;
                    } catch {
                      return baseUrl;
                    }
                  })(),
                  protocolBinding = resolveModelProtocolBindingHelper(
                    textModelProtocolBindings,
                    modelName,
                    textModelProtocolBindings?.[modelName],
                  ),
                  protocolConfig = modelProtocolRegistry?.[protocolBinding],
                  isVectorEngineHost = /(?:^|\.)api\.vectorengine\.ai$/i.test(String(apiHost || ``)),
                  requestType =
                  protocolConfig?.requestType ||
                  (/generatecontent/i.test(
                      [modelName, protocolBinding, protocolConfig?.requestType, protocolConfig?.submitPath].filter(Boolean).join(` `),
                    ) || /gemini/i.test(String(modelName || ``)) ?
                    `gemini-generate-content` :
                    `openai-chat`);
                if (!modelName) throw Error(`请先在智能体里绑定文本模型`);
                if (!apiKey) throw Error(`请先在设置中配置文本大模型 API Key`);
                let conversationHistory = (agentConversations[selectedAgent.id] || [])
                  .filter((message) => message.role === `user` || message.role === `assistant`)
                  .concat([userMessage])
                  .slice(-12),
                  systemPrompt = String(selectedAgent.systemPrompt || ``).trim(),
                  knowledgeText = String(selectedAgent.knowledge || ``).trim(),
                  knowledgeChunks = selectKnowledgeChunksForQuery(
                    selectedAgent.knowledgeFiles || [],
                    messageContent,
                    6e3,
                    6,
                  ),
                  knowledgeChunksText = knowledgeChunks
                  .map(
                    (chunk, index) =>
                    `片段${index + 1}｜${chunk.fileName}\n${String(chunk.text || ``).trim()}`,
                  )
                  .join(`\n\n`),
                  longTermMemory = await searchAgentLongTermMemory(selectedAgent, messageContent).catch((error) => (
                    console.warn(`Mem0 memory search failed`, error),
                    showToast2(error?.message || `Mem0 记忆检索失败`),
                    ``
                  )),
                  parsedTemperature = Number.parseFloat(selectedAgent.temperature || `0.7`),
                  temperature = Number.isFinite(parsedTemperature) ? parsedTemperature : 0.7,
                  fullSystemPrompt = `${systemPrompt || `你是一个智能体助手，请基于角色设定完成用户任务。`}${knowledgeText ? `\n\n已知知识库摘要：\n${knowledgeText}` : ``}${knowledgeChunksText ? `\n\n与当前问题相关的知识片段：\n${knowledgeChunksText}` : ``}${longTermMemory ? `\n\n长期记忆（由 Mem0 检索，仅作为上下文参考，不要生硬复述）：\n${longTermMemory}` : ``}`,
                  imageAttachments = selectedAttachments.filter((attachment) => attachment.type === `image`),
                  videoAttachments = selectedAttachments.filter((attachment) => attachment.type === `video`),
                  responseText = ``;
                if (requestType === `gemini-generate-content`) {
	                  let parts = [],
	                    conversationText = conversationHistory
	                    .map((message) =>
	                      `${message.role === `assistant` ? `助手` : `用户`}：${sanitizeAgentConversationText(message.content).trim()}`,
	                    )
                    .join(`\n\n`),
                    requestBody = {
                      contents: [{
                        role: `user`,
                        parts: [{
                          text: `${fullSystemPrompt}\n\n以下是当前会话，请继续回答用户最后一条消息：\n\n${conversationText}`,
                        }, ],
                      }, ],
                      generationConfig: {
                        temperature: temperature
                      },
                    },
                    submitPath = String(protocolConfig?.submitPath || ``)
                    .trim()
                    .replace(/\{model\}/gi, encodeURIComponent(selectedAgent.model))
                    .replace(/\{apiKey\}/gi, encodeURIComponent(apiKey)),
                    endpointPath =
                    submitPath ||
                    `/v1beta/models/${encodeURIComponent(selectedAgent.model)}:generateContent`,
                    requestUrl = /^https?:\/\//i.test(endpointPath) ?
                    endpointPath :
                    `${baseUrl}${endpointPath.startsWith(`/`) ? `` : `/`}${endpointPath}`,
                    headers = {
                      "Content-Type": String(protocolConfig?.contentType || `application/json`).trim() ||
                        `application/json`,
                    };
                  for (let image of imageAttachments)
                    try {
                      let dataUrl = await resolveDataUrl(image),
                        imageDataMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
                      imageDataMatch &&
                        parts.push({
                          inlineData: {
                            mimeType: imageDataMatch[1],
                            data: imageDataMatch[2]
                          }
                        });
                    } catch (error) {
                      console.warn(`Failed to process agent image for Gemini`, image, error);
                    }
	                  for (let video of videoAttachments)
	                    try {
	                      parts.push(await resolveGeminiInlineVideoPart(video));
                    } catch (error) {
                      throw Error(`参考视频处理失败，未发送到模型：${error?.message || error}`);
                    }
                  requestBody.contents[0].parts.push(...parts),
                    String(protocolConfig?.authType || ``).trim().toLowerCase() ===
                    `x-goog-api-key` &&
                    /(?:generativelanguage|googleapis|google\.com)/i.test(baseUrl) &&
                    !isVectorEngineHost ?
                    (headers[`x-goog-api-key`] = apiKey) :
                    (headers.Authorization = `Bearer ${apiKey}`);
                  let response = await fetch(requestUrl, {
                    method: `POST`,
                    headers: headers,
                    body: JSON.stringify(requestBody),
                  });
                  if (!response.ok) {
                    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                    try {
                      let errorBody = await response.json();
                      errorMessage =
                        errorBody?.error?.message ||
                        errorBody?.message ||
                        `API Error: ${response.status} - ${serializeErrorPreview(errorBody)}`;
                    } catch {}
                    throw Error(errorMessage);
                  }
                  let responseData = await response.json();
                  responseText =
                    responseData?.candidates?.[0]?.content?.parts
                    ?.map((part) => part.text || ``)
                    .join(``)
                    .trim() || ``;
                } else if (requestType === `openai-responses`) {
	                  let messages = conversationHistory
	                    .slice(0, -1)
	                    .map((message) => ({
	                      role: message.role === `assistant` ? `assistant` : `user`,
	                      content: sanitizeAgentConversationText(message.content),
	                    })),
                    contentParts = [{
                      type: `input_text`,
                      text: messageContent || ` `
                    }];
                  for (let image of imageAttachments)
                    try {
                      let dataUrl = await resolveDataUrl(image),
                        imageUrl = dataUrl;
                      !dataUrl.startsWith(`data:image/`) &&
                        !/^https?:/i.test(dataUrl) &&
                        (imageUrl = `data:${image.mime || `image/png`};base64,${dataUrl.split(`,`).pop()}`),
                        contentParts.push({
                          type: `input_image`,
                          image_url: imageUrl
                        });
                    } catch (error) {
                      console.warn(`Failed to process agent image for Responses`, image, error);
                    }
                  for (let video of videoAttachments)
                    try {
                      let fileUri = await resolveFileUri(video);
                      fileUri &&
                        contentParts.push({
                          type: `input_text`,
                          text: `参考视频链接：${fileUri}`,
                        });
                    } catch (error) {
                      throw Error(`参考视频处理失败，未发送到模型：${error?.message || error}`);
                    }
                  let requestUrl = `${baseUrl}/v1/responses`,
                    response = await fetch(requestUrl, {
                      method: `POST`,
                      headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": `application/json`,
                      },
                      body: JSON.stringify({
                        model: selectedAgent.model,
                        input: [{
                            role: `system`,
                            content: fullSystemPrompt
                          },
                          ...messages,
                          {
                            role: `user`,
                            content: contentParts
                          },
                        ],
                        temperature: temperature,
                      }),
                    });
                  if (!response.ok) {
                    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                    try {
                      let errorBody = await response.json();
                      errorMessage =
                        errorBody?.error?.message ||
                        errorBody?.message ||
                        `API Error: ${response.status} - ${serializeErrorPreview(errorBody)}`;
                    } catch {}
                    throw Error(errorMessage);
                  }
                  let responseData = await response.json();
                  responseText =
                    String(responseData?.output_text || ``).trim() ||
                    responseData?.output
                    ?.flatMap((item) => item?.content || [])
                    ?.map((part) => part?.text || ``)
                    ?.join(``)
                    ?.trim() ||
                    ``;
                } else {
                  let requestUrl = `${baseUrl}/v1/chat/completions`,
                    messages = [{
                        role: `system`,
                        content: fullSystemPrompt
	                      },
	                      ...conversationHistory.slice(0, -1).map((message) => ({
	                        role: message.role === `assistant` ? `assistant` : `user`,
	                        content: sanitizeAgentConversationText(message.content),
	                      })),
                    ],
                    contentParts = [{
                      type: `text`,
                      text: messageContent || ` `
                    }];
                  for (let image of imageAttachments)
                    try {
                      let dataUrl = await resolveDataUrl(image),
                        imageUrl = dataUrl;
                      !dataUrl.startsWith(`data:image/`) &&
                        !/^https?:/i.test(dataUrl) &&
                        (imageUrl = `data:${image.mime || `image/png`};base64,${dataUrl.split(`,`).pop()}`),
                        contentParts.push({
                          type: `image_url`,
                          image_url: {
                            url: imageUrl
                          }
                        });
                    } catch (error) {
                      console.warn(`Failed to process agent image for Chat`, image, error);
                    }
	                  for (let video of videoAttachments)
	                    try {
	                      let fileUri = await resolveFileUri(video);
	                      fileUri && contentParts.push({
	                        type: `text`,
	                        text: `参考视频链接：${fileUri}`
	                      });
                    } catch (error) {
                      throw Error(`参考视频处理失败，未发送到模型：${error?.message || error}`);
                    }
                  messages.push({
                    role: `user`,
                    content: contentParts
                  });
                  let response = await fetch(requestUrl, {
                    method: `POST`,
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                      "Content-Type": `application/json`,
                    },
                    body: JSON.stringify({
                      model: selectedAgent.model,
                      messages: messages,
                      temperature: temperature,
                    }),
                  });
                  if (!response.ok) {
                    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                    try {
                      let errorBody = await response.json();
                      errorMessage =
                        errorBody?.error?.message ||
                        errorBody?.message ||
                        `API Error: ${response.status} - ${serializeErrorPreview(errorBody)}`;
                    } catch {}
                    throw Error(errorMessage);
                  }
                  let responseData = await response.json();
                  responseText =
                    Array.isArray(responseData?.choices?.[0]?.message?.content) ?
                    responseData.choices[0].message.content
                    .map((message) => message?.text || message?.content || ``)
                    .join(``)
                    .trim() :
                    String(responseData?.choices?.[0]?.message?.content || ``).trim();
                }
                if (!String(responseText || ``).trim()) throw Error(`模型没有返回有效内容`);
                setAgentConversations((prevConversations) => ({
                  ...prevConversations,
                  [selectedAgent.id]: (prevConversations[selectedAgent.id] || []).map((item) =>
                    item.id === assistantMessageId ? {
                      ...item,
                      content: responseText,
                      createdAt: Date.now()
                    } : item,
                  ),
                }));
                storeAgentLongTermMemory(selectedAgent, messageContent, responseText).catch((error) =>
                  (console.warn(`Mem0 memory store failed`, error),
                    showToast2(error?.message || `Mem0 记忆写入失败`)),
                );
              } catch (error) {
                let agentErrorMessage = error?.message || `智能体回复失败`;
                (console.error(error),
                  showToast2(agentErrorMessage),
                  setAgentConversations((item) => ({
                    ...item,
                    [selectedAgent.id]: (item[selectedAgent.id] || []).map((conversationEntry) =>
                      conversationEntry.id === assistantMessageId ?
                      {
                        ...conversationEntry,
                        content: `请求失败：${agentErrorMessage}`,
                        createdAt: Date.now(),
                      } :
                      conversationEntry,
                    ),
                  })));
              } finally {
                selectedAttachments.forEach(releaseAgentAttachment);
              }
            };
  return { sendAgentMessage };
}
