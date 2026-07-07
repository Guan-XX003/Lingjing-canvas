// @ts-nocheck —— 逐字搬出;缺失依赖已tsc解析补齐,仅跳过loose-JS严格类型检查以保持行为不变。
/**
 * 自定义 API 节点：AI 辅助配置(handleAIAssist) + 生成(handleGenerateCustom)。
 * 自 bundle(WanJuanAppCanvas) 抽出，逻辑逐字搬运、行为不变。
 */
import { useCallback } from "react";
import { WanJuanIsTransientNetworkError } from "../lib/log-utils";

export function useCustomNodeGeneration(deps: any) {
  const {
    abortControllersRef,
    addGeneratedAsset,
    apiConfigs,
    getEdges,
    getNodes,
    modelProtocolRegistry,
    pollIntervalMs,
    projectIdRef,
    propTextApiKey,
    propTextApiUrl,
    setEdges,
    setNodes,
    showToast,
    textModel,
    textModelApiBindings,
    textModelProtocolBindings,
    timeoutSeconds,
    updateTaskList,
  } = deps;
  let     handleAIAssist = useCallback(
      async (userPrompt, existingConfig) => {
          if (!propTextApiKey) throw Error(`请先在设置中配置文本大模型 API Key`);
          let apiUrl = `${propTextApiUrl.replace(/\/$/, ``)}/v1/chat/completions`,
            contextPrefix = ``;
          existingConfig &&
            (contextPrefix = `当前节点的已有配置如下，请在这个配置的基础上进行修改或补充，而不是完全从零生成（除非用户要求重置）：\n\`\`\`json\n${JSON.stringify(existingConfig, null, 2)}\n\`\`\`\n\n`);
          let messages = [{
                role: `system`,
                content: `你是一个智能API配置助手。用户会描述一个API的需求，你需要理解意图并严格返回一个包含完整配置的 JSON 对象。不要有任何额外的解释文字，不要使用Markdown代码块包裹，必须直接返回纯 JSON 字符串。
返回的 JSON 结构必须符合以下格式：
{
  "apiUrl": "请求的完整URL",
  "method": "GET 或 POST 或 PUT",
  "headers": "请求头对象的JSON字符串格式，例如 '{\\n  "Content-Type": "application/json",\\n  "Authorization": "Bearer xxx"\\n}'",
  "body": "请求体的JSON字符串格式（如果有）。请务必将用户可能需要动态传入的值替换为 {{变量名}} 形式，例如 '{\\n  "text": "{{prompt}}"\\n}'",
  "outputType": "text 或 image 或 video 或 audio，根据你推测的 API 返回内容决定",
  "executionMode": "sync 或 async，如果需要轮询则为 async，一般默认为 sync",
  "resultPath": "推测的用于提取核心返回内容的 JSON Path，例如 'data.url' 或 'choices[0].message.content'",
  "taskIdPath": "如果是 async 模式，提取任务ID的路径，例如 'data.task_id'，否则为空字符串",
  "pollingUrl": "如果是 async 模式，轮询状态的API地址，例如 'https://api.example.com/v1/tasks/{{task_id}}'，否则为空字符串",
  "pollingMethod": "如果是 async 模式，轮询状态的请求方法，例如 'GET' 或 'POST'。默认通常是 'GET'。",
  "pollingHeaders": "如果是 async 模式，轮询时专属的请求头JSON字符串，如果不填或为空则默认继承主请求的 headers。如果遇到轮询必须传不同鉴权信息的，可以填这个字段。",
  "pollingBody": "如果是 async 模式且 pollingMethod 为 POST，轮询时的请求体JSON字符串格式。可以使用 {{task_id}} 代替任务ID。如果不填则为空。",
  "pollingResultPath": "如果是 async 模式，轮询返回结果中判断状态的字段路径，例如 'data.status'，否则为空字符串",
  "pollingCompletedValue": "如果是 async 模式，代表任务完成的状态值，例如 'completed' 或 'success'，否则为空字符串",
  "pollingFailedValue": "如果是 async 模式，代表任务失败的状态值，例如 'failed' 或 'error'，如果不确定可为空",
  "pollingErrorPath": "如果是 async 模式，提取错误信息的路径，例如 'data.error'，否则为空字符串",
  "pollingProgressPath": "如果是 async 模式，提取进度百分比的路径，例如 'data.progress'，否则为空字符串",
  "pollingResultDataPath": "如果是 async 模式，代表轮询成功后最终结果提取的字段路径，例如 'data.output_url'。如果与主请求一致或不确定，可为空字符串",
  "rawTextOutput": "布尔值，是否纯文本输出，通常在 outputType 为 text 时使用"
}
请注意：
1. 【核心参数变量化】：不要把所有输入都变成变量！只需提取最核心的 2-3 个参数作为变量（如 {{prompt}}, {{image_1}} 等），其他次要参数（如分辨率、模型版本、负面提示词等）请直接写死一个合理的默认值，或者如果不必要则直接省略。
2. 【异步智能填充】：如果你判断该接口（如生成视频、长音频、绘图等）通常是异步的（即提交后返回任务ID，需要轮询结果），请务必将 executionMode 设为 async，并一键推断填好 taskIdPath, pollingUrl, pollingResultPath, pollingCompletedValue 这四个字段。如果 pollingUrl 和 apiUrl 类似只是后面拼个ID，可以写成带有 {{task_id}} 的格式。
3. 【异步轮询 Headers 和 Body】：如果用户提供了轮询专用的 curl 或明确要求，请务必生成 pollingHeaders。如果轮询是 POST 请求且需要在 body 中传递 task_id，请务必设置 pollingMethod 为 "POST"，并正确生成 pollingBody，如 '{
  "taskId": "{{task_id}}"
}'。
4. resultPath 需要根据常见 API 的返回结构（如 OpenAI 格式为 choices[0].message.content，常见图生图为 data.image_url）进行合理推测。如果是异步且结果在轮询返回里，请填到 pollingResultDataPath。
5. 必须确保输出是合法的 JSON 格式。`,
              },
              {
                role: `user`,
                content: contextPrefix + userPrompt
              },
            ],
            response = await fetch(apiUrl, {
              method: `POST`,
              headers: {
                Authorization: `Bearer ${propTextApiKey}`,
                "Content-Type": `application/json`,
              },
              body: JSON.stringify({
                model: textModel
                  .split(
                    `
`,
                  )[0]
                  .trim(),
                messages: messages,
                temperature: 0.1,
              }),
            });
          if (!response.ok) throw Error(`API 请求失败: ${response.status}`);
          let aiContent = (await response.json()).choices?.[0]?.message?.content || ``;
          return (
            (aiContent = aiContent
              .replace(/```json\n?/gi, ``)
              .replace(/```\n?/g, ``)
              .trim()),
            aiContent
          );
        },
        [propTextApiKey, propTextApiUrl, textModel, apiConfigs, textModelApiBindings, textModelProtocolBindings, modelProtocolRegistry],
    ),
    handleGenerateCustom = useCallback(
      async (nodeId) => {
          let node = getNodes().find((node2) => node2.id === nodeId);
          if (!node || node.type !== `customNode` || !node.data.config) return;
          let config = node.data.config;
          (setNodes((nodes2) =>
              nodes2.map((node2) =>
                node2.id === nodeId ?
                {
                  ...node2,
                  data: {
                    ...node2.data,
                    loading: true,
                    progress: 0,
                    errorMessage: undefined,
                    taskId: undefined,
                    seedanceTaskId: undefined,
                    resultData: undefined,
                  },
                } :
                node2,
              ),
            ),
            setEdges((edges2) =>
              edges2.map((edge) => (edge.target === nodeId ? {
                ...edge,
                animated: true
              } : edge)),
            ));
          let taskId = null;
          try {
            let allEdges = getEdges(),
              allNodes = getNodes(),
              incomingEdges = allEdges.filter((edge) => edge.target === nodeId),
              variables = {
                ...(node.data.config?.variables || {})
              },
              mediaUrls = [],
              textInputs = [];
            incomingEdges.forEach((edge) => {
              let sourceNode = allNodes.find((node2) => node2.id === edge.source);
              if (sourceNode) {
                let sourceValue = ``;
                if (
                  (sourceNode.data.resultData ?
                    ((sourceValue = String(sourceNode.data.resultData)),
                      sourceNode.data.audioUrl ?
                      (sourceValue = sourceNode.data.audioUrl) :
                      sourceNode.data.videoUrl ?
                      (sourceValue = sourceNode.data.videoUrl) :
                      sourceNode.data.imageUrl && (sourceValue = sourceNode.data.imageUrl)) :
                    sourceNode.data.audioUrl ?
                    (sourceValue = sourceNode.data.audioUrl) :
                    sourceNode.data.videoUrl ?
                    (sourceValue = sourceNode.data.videoUrl) :
                    sourceNode.data.imageUrl ?
                    (sourceValue = sourceNode.data.imageUrl) :
                    sourceNode.data.extractedImages ?
                    (sourceValue = sourceNode.data.extractedImages[0] || ``) :
                    sourceNode.data.text && (sourceValue = sourceNode.data.text),
                    edge.targetHandle && edge.targetHandle.startsWith(`var-`))
                ) {
                  let variableName = edge.targetHandle.replace(`var-`, ``);
                  variables[variableName] = sourceValue;
                } else
                  (!edge.targetHandle ||
                    edge.targetHandle === `default` ||
                    edge.targetHandle === ``) &&
                  (sourceNode.data.imageUrl ||
                    sourceNode.data.videoUrl ||
                    String(sourceValue).startsWith(`http`) ||
                    String(sourceValue).startsWith(`data:image/`) ?
                    mediaUrls.push(sourceValue) :
                    textInputs.push(sourceValue));
              }
            });
            let requestBody = config.body || ``,
              apiUrl = config.apiUrl || ``,
              fetchAsDataUrl = async (url) => {
                try {
                  let _r = await fetch(url);
                  if (!_r.ok) throw Error(`下载失败: ${_r.status}`);
                  let blob = await _r.blob();
                  return new Promise((resolve, reject) => {
                    let fileReader = new FileReader();
                    ((fileReader.onloadend = () => resolve(fileReader.result)),
                      (fileReader.onerror = reject),
                      fileReader.readAsDataURL(blob));
                  });
                } catch (error) {
                  return (
                    console.warn(
                      `Failed to fetch and convert URL to Base64:`,
                      url,
                      error,
                    ),
                    url
                  );
                }
              };
            for (let [key, value] of Object.entries(variables))
              typeof value == `string` &&
              value.startsWith(`http`) &&
              (key.startsWith(`image`) ||
                key.startsWith(`audio`) ||
                key.startsWith(`video`)) &&
              (variables[key] = await fetchAsDataUrl(value));
            let headersStr = config.headers || `{}`,
              pollingHeadersStr = config.pollingHeaders || `{}`;
            (Object.entries(variables).forEach(([varKey, varValue]) => {
                let stringValue = String(varValue),
                  escapedValue = stringValue.replace(/"/g, `\\"`).replace(/\n/g, `\\n`);
                varKey === `prompt` && textInputs.length > 0 && (escapedValue = `${textInputs.join(`\\n`)}\n${escapedValue}`);
                let quotedPlaceholderRegex = RegExp(`"\\{\\{${varKey}(?:\\|[^}]+)?\\}\\}"`, `g`),
                  placeholderRegex = RegExp(`\\{\\{${varKey}(?:\\|[^}]+)?\\}\\}`, `g`);
                if (config.variableFormats && config.variableFormats[varKey] === `json`)
                  try {
                    (JSON.parse(stringValue), (requestBody = requestBody.replace(quotedPlaceholderRegex, stringValue)), (requestBody = requestBody.replace(placeholderRegex, stringValue)));
                  } catch {
                    ((requestBody = requestBody.replace(quotedPlaceholderRegex, stringValue)), (requestBody = requestBody.replace(placeholderRegex, stringValue)));
                  }
                else requestBody = requestBody.replace(placeholderRegex, escapedValue);
                ((apiUrl = apiUrl.replace(placeholderRegex, stringValue)),
                  (headersStr = headersStr.replace(placeholderRegex, stringValue)),
                  (pollingHeadersStr = pollingHeadersStr.replace(placeholderRegex, stringValue)));
              }),
              textInputs.length > 0 &&
              !Object.keys(variables).includes(`prompt`) &&
              (requestBody = requestBody.replace(
                /\{\{prompt\}\}/g,
                textInputs.join(`\\n`).replace(/"/g, `\\"`).replace(/\n/g, `\\n`),
              )),
              mediaUrls.forEach((imageUrl, index) => {
                requestBody = requestBody.replace(RegExp(`\\{\\{image_${index + 1}\\}\\}`, `g`), imageUrl);
              }));
            let headers = {};
            try {
              headersStr && (headers = {
                ...JSON.parse(headersStr)
              });
            } catch (error) {
              console.warn(`Failed to parse headers`, error);
            }
            let pollingHeaders = headers;
            try {
              pollingHeadersStr && pollingHeadersStr !== `{}` && (pollingHeaders = {
                ...JSON.parse(pollingHeadersStr)
              });
            } catch (error) {
              console.warn(`Failed to parse polling headers`, error);
            }
            let requestPayload = config.method === `GET` ? undefined : requestBody;
            if (requestPayload && headers[`Content-Type`] === `multipart/form-data`)
              try {
                let formFields = JSON.parse(requestBody),
                  formData = new FormData();
                for (let fieldName in formFields) {
                  let fieldValue = formFields[fieldName];
                  if (typeof fieldValue == `string` && fieldValue.startsWith(`data:`)) {
                    let dataUrlParts = fieldValue.split(`,`),
                      mimeMatch = dataUrlParts[0].match(/:(.*?);/),
                      mimeType = mimeMatch ? mimeMatch[1] : `application/octet-stream`,
                      binaryString = atob(dataUrlParts[1]),
                      byteLength = binaryString.length,
                      byteArray = new Uint8Array(byteLength);
                    for (; byteLength--;) byteArray[byteLength] = binaryString.charCodeAt(byteLength);
                    let fileExtension = mimeType.split(`/`)[1] || `bin`;
                    formData.append(fieldName, new Blob([byteArray], {
                      type: mimeType
                    }), `upload.${fileExtension}`);
                  } else
                    formData.append(
                      fieldName,
                      typeof fieldValue == `object` ? JSON.stringify(fieldValue) : String(fieldValue),
                    );
                }
                ((requestPayload = formData), delete headers[`Content-Type`]);
              } catch (error) {
                throw (
                  console.warn(
                    `Failed to parse body as JSON for FormData conversion`,
                    error,
                  ),
                  Error(
                    `FormData 请求的 Body 必须是有效的 JSON 格式，以便自动转换为文件`,
                  )
                );
              }
            let abortController = new AbortController();
            abortControllersRef.current.set(nodeId, abortController);
            let response = await fetch(apiUrl, {
              method: config.method,
              headers: headers,
              body: requestPayload,
              signal: abortController.signal,
            });
            if (!response.ok) throw Error(`API 请求失败: ${response.status}`);
            let contentType = response.headers.get(`content-type`) || ``,
              isBinaryResponse = false,
              binaryPayload;
            if (
              contentType.includes(`audio/`) ||
              contentType.includes(`image/`) ||
              contentType.includes(`video/`) ||
              contentType.includes(`application/octet-stream`)
            ) {
              isBinaryResponse = true;
              let blob = await response.blob();
              binaryPayload = await new Promise((resolve, reject) => {
                let fileReader = new FileReader();
                ((fileReader.onloadend = () => resolve(fileReader.result)),
                  (fileReader.onerror = reject),
                  fileReader.readAsDataURL(blob));
              });
            }
            let responseData = null;
            isBinaryResponse || (responseData = await response.json());
            let extractByPath = (data, path) =>
              !path || path === `$` ?
              data :
              path
              .replace(/\{\{|\}\}/g, ``)
              .replace(/\[(\d+)\]/g, `.$1`)
              .replace(/^\./, ``)
              .split(`.`)
              .reduce((obj, key) => {
                if (obj && typeof obj == `object`) return obj[key];
              }, data);
            if (config.executionMode === `sync`) {
              let result;
              if (
                (isBinaryResponse ?
                  (result = binaryPayload) :
                  ((result = extractByPath(responseData, config.resultPath)),
                    typeof result == `object` &&
                    result &&
                    (result =
                      config.rawTextOutput &&
                      Array.isArray(result) &&
                      result.every((item) => typeof item != `object`) ?
                      result.join(`
`) :
                      JSON.stringify(result, null, 2))),
                  result === undefined)
              )
                throw Error(`无法提取结果`);
              (setNodes((nodes2) =>
                  nodes2.map((node2) => {
                    if (node2.id === nodeId) {
                      let updatedData = {
                        ...node2.data,
                        resultData: result,
                        loading: false
                      };
                      return (
                        config.outputType === `text` && (updatedData.text = result),
                        config.outputType === `image` &&
                        (updatedData.imageUrl = Array.isArray(result) ? result[0] : result),
                        config.outputType === `video` && (updatedData.videoUrl = result),
                        config.outputType === `audio` && (updatedData.audioUrl = result), {
                          ...node2,
                          data: updatedData
                        }
                      );
                    }
                    return node2;
                  }),
                ),
                addGeneratedAsset && addGeneratedAsset(result, config.outputType, `generated`),
                showToast(`节点执行成功`));
            } else {
              let taskId2 = extractByPath(responseData, config.taskIdPath || ``);
              if (!taskId2) throw Error(`无法提取 Task ID`);
              ((taskId = `custom-${taskId2 || Date.now()}`),
                updateTaskList &&
                updateTaskList((nodes2) => [
                  ...nodes2,
                  {
                    id: taskId,
                    type: `custom`,
                    projectId: projectIdRef.current,
                    nodeId: nodes2,
                    status: `pending`,
                    progress: 0,
                    createdAt: Date.now(),
                    prompt: config.apiUrl,
                    customOutputType: config.outputType,
                    customRawResponse: responseData,
                  },
                ]));
              setNodes((nodes2) =>
                nodes2.map((node2) =>
                  node2.id === nodeId ?
                  {
                    ...node2,
                    data: {
                      ...node2.data,
                      taskId: taskId
                    }
                  } :
                  node2,
                ),
              );
              let isCompleted = false,
                attempts = 0,
                pollingUrl = (config.pollingUrl || config.apiUrl).replace(`{{task_id}}`, taskId2);
              Object.entries(variables).forEach(([key, value]) => {
                let placeholderRegex = RegExp(`\\{\\{${key}(?:\\|[^}]+)?\\}\\}`, `g`);
                pollingUrl = pollingUrl.replace(placeholderRegex, String(value));
              });
              let customPollingTimeoutMs = Math.max(5e3, (Number(timeoutSeconds) || 600) * 1e3),
                customPollingStartedAt = Date.now(),
                customPollingNetworkErrorCount = 0,
                maxPollingAttempts = Math.max(1, Math.ceil(customPollingTimeoutMs / Math.max(Number(pollIntervalMs) || 3e3, 500)));
              for (; !isCompleted;) {
                if (abortController.signal.aborted) throw Error(`已取消`);
                if (Date.now() - customPollingStartedAt >= customPollingTimeoutMs)
                  throw Error(`异步轮询超时，请在设置中增大全局异步轮询最大时长后重试`);
                (await new Promise((resolve) => setTimeout(resolve, pollIntervalMs)), attempts++);
                let pollingMethod = config.pollingMethod || `GET`,
                  pollingBody = config.pollingBody || ``;
                pollingBody &&
                  ((pollingBody = pollingBody.replace(/\{\{task_id\}\}/g, taskId2)),
                    Object.entries(variables).forEach(([key, value]) => {
                      let placeholderRegex = RegExp(`\\{\\{${key}(?:\\|[^}]+)?\\}\\}`, `g`);
                      pollingBody = pollingBody.replace(
                        placeholderRegex,
                        String(value).replace(/"/g, `\\"`).replace(/\n/g, `\\n`),
                      );
                    }));
                let fetchOptions = {
                  method: pollingMethod,
                  headers: pollingHeaders
                };
                pollingMethod !== `GET` && pollingBody && (fetchOptions.body = pollingBody);
                let pollingResponse,
                  pollingData;
                try {
                  pollingResponse = await fetch(pollingUrl, fetchOptions);
                  if (!pollingResponse.ok) continue;
                  pollingData = await pollingResponse.json();
                  customPollingNetworkErrorCount = 0;
                } catch (error) {
                  if (abortController.signal.aborted || error?.name === `AbortError`)
                    throw error;
                  if (!WanJuanIsTransientNetworkError(error)) throw error;
                  (customPollingNetworkErrorCount++,
                    console.warn(`Custom node polling transient network error:`, error),
                    customPollingNetworkErrorCount === 3 &&
                    showToast(`异步节点状态查询遇到临时网络错误，仍会继续重试...`));
                  continue;
                }
                let resultPath = config.pollingResultPath || ``,
                  responseBody = pollingData;
                resultPath.includes(`{{task_id}}`) &&
                  (resultPath = resultPath.replace(/\{\{task_id\}\}/g, taskId2));
                let pollingStatus = extractByPath(responseBody, resultPath);
                if (pollingStatus === config.pollingCompletedValue) {
                  isCompleted = true;
                  let resultDataPath = config.pollingResultDataPath || config.resultPath;
                  resultDataPath &&
                    resultDataPath.includes(`{{task_id}}`) &&
                    (resultDataPath = resultDataPath.replace(/\{\{task_id\}\}/g, taskId2));
                  let resultData = extractByPath(pollingData, resultDataPath);
                  (typeof resultData == `object` &&
                    resultData &&
                    (resultData =
                      config.rawTextOutput &&
                      Array.isArray(resultData) &&
                      resultData.every((item) => typeof item != `object`) ?
                      resultData.join(`
`) :
                      JSON.stringify(resultData, null, 2)),
                    updateTaskList &&
                    taskId &&
                    updateTaskList((nodes2) =>
                      nodes2.map((node2) =>
                        node2.id === taskId ?
                        {
                          ...node2,
                          status: `completed`,
                          progress: 100,
                          customResultData: resultData,
                          customRawResponse: pollingData,
                        } :
                        node2,
                      ),
                    ),
                    setNodes((nodes2) =>
                      nodes2.map((node2) => {
                        if (node2.id === nodeId) {
                          let updatedData = {
                            ...node2.data,
                            resultData: resultData,
                            loading: false,
                            progress: 100,
                          };
                          return (
                            config.outputType === `text` && (updatedData.text = resultData),
                            config.outputType === `image` &&
                            (updatedData.imageUrl = Array.isArray(resultData) ? resultData[0] : resultData),
                            config.outputType === `video` && (updatedData.videoUrl = resultData),
                            config.outputType === `audio` && (updatedData.audioUrl = resultData), {
                              ...node2,
                              data: updatedData
                            }
                          );
                        }
                        return node2;
                      }),
                    ),
                    addGeneratedAsset && resultData && addGeneratedAsset(resultData, config.outputType, `generated`),
                    showToast(`节点执行成功`));
                  break;
                } else if (config.pollingFailedValue && pollingStatus === config.pollingFailedValue) {
                  let errorPath = config.pollingErrorPath || ``;
                  errorPath &&
                    errorPath.includes(`{{task_id}}`) &&
                    (errorPath = errorPath.replace(/\{\{task_id\}\}/g, taskId2));
                  let errorValue = errorPath ? extractByPath(pollingData, errorPath) : `任务执行失败`;
                  throw Error(
                    typeof errorValue == `object` ? JSON.stringify(errorValue) : String(errorValue),
                  );
                } else {
                  let progress = Math.min(99, attempts * 2),
                    progressPath = config.pollingProgressPath || ``;
                  if (progressPath) {
                    progressPath.includes(`{{task_id}}`) &&
                      (progressPath = progressPath.replace(/\{\{task_id\}\}/g, taskId2));
                    let progressValue = extractByPath(pollingData, progressPath);
                    if (progressValue != null) {
                      let progressText = String(progressValue).replace(/[^0-9.-]/g, ``);
                      progressText && !isNaN(Number(progressText)) && (progress = Number(progressText));
                    }
                  }
                  (updateTaskList &&
                    taskId &&
                    updateTaskList((nodes2) =>
                      nodes2.map((node2) =>
                        node2.id === taskId ?
                        {
                          ...node2,
                          status: `running`,
                          progress: progress,
                          customRawResponse: pollingData,
                        } :
                        node2,
                      ),
                    ),
                    setNodes((nodes2) =>
                      nodes2.map((node2) =>
                        node2.id === nodeId ?
                        {
                          ...node2,
                          data: {
                            ...node2.data,
                            progress: progress
                          }
                        } :
                        node2,
                      ),
                    ));
                }
              }
            }
          } catch (error) {
            error.name !== `AbortError` &&
              (updateTaskList &&
                taskId &&
                updateTaskList((nodes2) =>
                  nodes2.map((node2) =>
                    node2.id === taskId ?
                    {
                      ...node2,
                      status: `failed`,
                      errorMsg: error.message
                    } :
                    node2,
                  ),
                ),
                setNodes((nodes2) =>
                  nodes2.map((node2) =>
                    node2.id === nodeId ?
                    {
                      ...node2,
                      data: {
                        ...node2.data,
                        loading: false,
                        errorMessage: error.message
                      },
                    } :
                    node2,
                  ),
                ),
                showToast(`节点执行失败: ${error.message}`));
          } finally {
            (abortControllersRef.current.delete(nodeId),
              setEdges((edges2) =>
                edges2.map((edge) => (edge.target === nodeId ? {
                  ...edge,
                  animated: false
                } : edge)),
              ));
          }
        },
        [getNodes, getEdges, setNodes, setEdges, showToast, addGeneratedAsset],
    );
  return { handleAIAssist, handleGenerateCustom };
}
