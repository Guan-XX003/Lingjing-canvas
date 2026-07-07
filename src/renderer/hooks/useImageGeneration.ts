// @ts-nocheck —— 逐字自 bundle 搬出的大型生成逻辑；缺失依赖已用 tsc 逐一解析补齐，仅跳过 loose-JS 严格类型检查以保持行为不变。
/**
 * 图片生成（generateImage）。自 bundle(WanJuanAppCanvas) 抽出，逻辑逐字搬运、行为不变。
 */
import { useCallback } from "react";
import { buildProjectMediaFileUrl, wanjuanResourceKind, wanjuanResourceMediaUrl } from "../lib/resource";
import { mediaUrlToDataUrl, wanjuanCollectNodeReferenceMedia, wanjuanNodeTextValue, wanjuanNormalizeReferenceMediaUrl } from "../lib/reference-media";
import { parseSeedanceList, resolveModelApiBindingIdHelper, resolveModelProtocolBindingHelper } from "../lib/model-binding";
import { safeStringifyRequestForLog, serializeErrorPreview, WanJuanIsTransientNetworkError } from "../lib/log-utils";
import { WanJuanGetPreferredModel } from "../lib/model-favorites";
import { WanJuanParseModelList } from "../lib/model-id";

export function useImageGeneration(deps: any) {
  const {
    propImageApiKey,
    propImageApiUrl,
    drawingModel,
    apiConfigs,
    imageModelApiBindings,
    imageModelProtocolBindings,
    planLimits,
    showToast,
    getNodes,
    getEdges,
    setNodes,
    addGeneratedAsset,
    membership,
    updateTaskList,
    modelProtocolRegistry,
    propTextApiUrl,
    propTextApiKey,
    textModel,
    abortControllersRef,
    audioApiKey,
    localforageModule,
    projectIdRef,
    setDailyGenerationCount,
    setEdges,
    timeoutSeconds,
  } = deps;
  const generateImage = useCallback(
      async (nodeId, prompt, size = `1024x1024`, modelName, apiBindingId) => {
          let dailyLimitKey = `daily-limit-${new Date().toISOString().split(`T`)[0]}`,
            dailyGenerationCount = parseInt(
              localStorage.getItem(dailyLimitKey) || `0`,
            );
          let updateGlobalTaskList = updateTaskList,
            imageModels = drawingModel ?
            WanJuanParseModelList(drawingModel) :
            [],
            imageModelName =
            WanJuanGetPreferredModel(imageModels, modelName || ``),
            imageSourceNode = getNodes().find((node) => node.id === nodeId),
            selectedImageApiConfigId =
            apiBindingId ||
            resolveModelApiBindingIdHelper(
              imageModelApiBindings,
              imageModelName,
              undefined,
            ) ||
            imageSourceNode?.data?.selectedApiConfigId ||
            imageSourceNode?.data?.apiConfigId,
            imageConfig = apiConfigs.find((config) => config.id === selectedImageApiConfigId),
            imageApiUrl = imageConfig?.url || propImageApiUrl,
            imageApiKey = imageConfig?.key || propImageApiKey,
            normalizeImageApiBase = (value) =>
            String(value || ``)
            .replace(/\s+/g, ``)
            .replace(/\/$/, ``),
            imageApiBaseUrl = normalizeImageApiBase(imageApiUrl),
            imageApiHost = (() => {
              try {
                return new URL(imageApiBaseUrl).host;
              } catch {
                return imageApiBaseUrl;
              }
            })(),
            inferImageRequestProtocol = (modelName2, url, hostname) =>
            /(^|\.)lconai\.com$/i.test(hostname) || /\/\/[nv]\.lconai\.com/i.test(url) ?
            `openai-images` :
            /^GPT-Image-2$/i.test(modelName2) ?
            `gpt-image-2-async` :
            /api\.vectorengine\.ai$/i.test(hostname) ?
            /^doubao-seedream/i.test(modelName2) ?
            `vectorengine-image-generation` :
            `openai-images` :
            /^gemini-/i.test(modelName2) ?
            `gemini-generate-content` :
            /^(gpt-image|dall-e)/i.test(modelName2) ?
            `openai-images` :
            /^doubao-seedream/i.test(modelName2) ?
            /ark\.cn-beijing\.volces\.com$/i.test(hostname) ||
            /\/api\/v3$/i.test(url) ?
            `ark-image-generation` :
            `vectorengine-image-generation` :
            `gemini-generate-content`,
	            selectedImageProtocolName =
	            resolveModelProtocolBindingHelper(imageModelProtocolBindings, imageModelName),
	            selectedImageProtocolDefinition =
	            modelProtocolRegistry?.[selectedImageProtocolName],
	            isLconaiImageApi =
	            /(^|\.)lconai\.com$/i.test(imageApiHost) ||
	            /\/\/[nv]\.lconai\.com/i.test(imageApiBaseUrl),
	            isSuChuangGptImageApi =
	            /api\.wuyinkeji\.com/i.test(imageApiBaseUrl) ||
	            /\/api\/async\/image_gpt/i.test(imageApiBaseUrl),
	            shouldForceGptImage2Async =
	            isSuChuangGptImageApi,
            imageGatewayFormatOverride =
            !selectedImageProtocolDefinition &&
            imageConfig?.protocolFormat && imageConfig.protocolFormat !== `auto`
              ? imageConfig.protocolFormat
              : null,
            imageRequestProtocol =
            imageGatewayFormatOverride ||
            (shouldForceGptImage2Async ?
            `gpt-image-2-async` :
            selectedImageProtocolDefinition?.requestType ||
            selectedImageProtocolName ||
	            inferImageRequestProtocol(
	              imageModelName,
	              imageApiBaseUrl,
	              imageApiHost,
	            ));
	          (isLconaiImageApi || /^gpt-image/i.test(imageModelName)) &&
	            imageRequestProtocol === `gpt-image-2-async` &&
	            !isSuChuangGptImageApi &&
	            (imageRequestProtocol = `openai-images`);
          /^doubao-seedream/i.test(imageModelName) &&
            ((imageRequestProtocol === `ark-image-generation` &&
                !(/ark\.cn-beijing\.volces\.com$/i.test(imageApiHost) ||
                  /\/api\/v3$/i.test(imageApiBaseUrl))) &&
              (imageRequestProtocol = `vectorengine-image-generation`),
              imageRequestProtocol === `vectorengine-image-generation` &&
              (/ark\.cn-beijing\.volces\.com$/i.test(imageApiHost) ||
                /\/api\/v3$/i.test(imageApiBaseUrl)) &&
              (imageRequestProtocol = `ark-image-generation`));
          if (!imageModelName) {
            showToast(`请先在设置中配置图像大模型`);
            return;
          }
          if (!imageApiKey) {
            showToast(`请先在设置中配置图像大模型 API Key`);
            return;
          }
          let imageTaskId = `image-${nodeId}-${Date.now()}`;
	          (setNodes((nodes2) =>
	              nodes2.map((node) =>
	                node.id === nodeId ?
                {
                  ...node,
                  data: {
                    ...node.data,
	                    loading: true,
	                    taskId: imageTaskId,
	                    seedanceTaskId: undefined,
	                    progress: 0,
	                    manuallyStopped: false,
	                    errorMessage: undefined,
                  },
                } :
                node,
              ),
            ),
            setEdges((edges2) =>
              edges2.map((edge) => (edge.target === nodeId ? {
                ...edge,
                animated: true
              } : edge)),
            ));
          try {
            (updateGlobalTaskList &&
              updateGlobalTaskList((prevTasks) => [
                ...prevTasks,
                {
                  id: imageTaskId,
                  type: `image`,
                  projectId: projectIdRef.current,
                  nodeId: nodeId,
                  apiBaseUrl: imageApiBaseUrl,
                  apiConfigId: imageConfig?.id,
                  modelName: imageModelName,
                  requestProfile: {
                    requestType: imageRequestProtocol
                  },
                  status: `running`,
                  progress: 0,
                  createdAt: Date.now(),
                  prompt: prompt || `图片生成任务`,
                  customOutputType: `image`,
                },
              ]),
              showToast(`正在生成图片，请稍候...`));
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
                let text = wanjuanNodeTextValue(sourceNode);
                text && textParts.push(text);
              }
            });
            let matchedNode = nodes2.find((node) => node.id === nodeId);
            matchedNode &&
	              matchedNode.data.selectedContextResources &&
	              matchedNode.data.selectedContextResources.forEach((resource) => {
	                wanjuanResourceKind(resource) === `image` ?
	                  imageUrls.push(wanjuanNormalizeReferenceMediaUrl(resource, `image`)) :
	                  wanjuanResourceKind(resource) === `video` ?
	                  videoUrls.push(wanjuanNormalizeReferenceMediaUrl(resource, `video`)) :
	                  wanjuanResourceKind(resource) === `text` && textParts.push(wanjuanResourceMediaUrl(resource) || resource.url);
	              });
	            imageUrls = imageUrls.map((url) => wanjuanNormalizeReferenceMediaUrl(url, `image`)).filter(Boolean);
	            videoUrls = videoUrls.map((url) => wanjuanNormalizeReferenceMediaUrl(url, `video`)).filter(Boolean);
            let sanitizeText = (text) => {
                if (!text) return ``;
                let cleaned = text
                  .replace(
                    /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g,
                    ``,
                  )
                  .trim();
                return (
                  cleaned.length > 6e3 &&
                  ((cleaned = cleaned.substring(0, 6e3)),
                    console.warn(`Prompt truncated to 6000 characters`)),
                  cleaned
                );
              },
              combinedPrompt =
              textParts.length > 0 ?
              `${textParts.join(`
`)}\n${prompt}` :
              prompt,
              sanitizedPrompt = sanitizeText(combinedPrompt),
              contentParts = [];
            sanitizedPrompt
              ?
              contentParts.push({
                text: sanitizedPrompt
              }) :
              imageUrls.length === 0 && videoUrls.length === 0 && contentParts.push({
                text: ` `
              });
            for (let dataUrl of imageUrls) {
              dataUrl = await mediaUrlToDataUrl(dataUrl);
              let imageMatch = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
              imageMatch && contentParts.push({
                inlineData: {
                  mimeType: imageMatch[1],
                  data: imageMatch[2]
                }
              });
            }
            for (let videoDataUrl of videoUrls) {
              videoDataUrl = await mediaUrlToDataUrl(videoDataUrl);
              let videoMatch = videoDataUrl.match(/^data:(video\/[a-zA-Z+]+);base64,(.+)$/);
              videoMatch && contentParts.push({
                inlineData: {
                  mimeType: videoMatch[1],
                  data: videoMatch[2]
                }
              });
            }
	            let sourceNode = imageSourceNode || getNodes().find((node) => node.id === nodeId),
	              aspectRatio = sourceNode?.data?.aspectRatio || `Auto`,
	              imageSize = sourceNode?.data?.imageSize || `1K`,
	              imageSizeMode = sourceNode?.data?.imageSizeMode || `quality`,
	              imageResolutionValue = String(sourceNode?.data?.imageResolution || ``).trim(),
	              imageResolutionOptions = parseSeedanceList(sourceNode?.data?.imageCompatResolutions || ``).filter((item) => /^\d{2,5}x\d{2,5}$/i.test(String(item || ``).trim())),
	              selectedImageResolution =
	                /^\d{2,5}x\d{2,5}$/i.test(imageResolutionValue) ?
	                imageResolutionValue :
	                imageResolutionOptions[0],
	              isImageResolutionMode = imageSizeMode === `resolution` && !!selectedImageResolution;
	            if (!isImageResolutionMode && aspectRatio === `Auto`) {
              let resolvedRatio = `Auto`;
              try {
                let ratioCandidates = [
                  `21:9`,
                  `16:9`,
                  `3:2`,
                  `4:3`,
                  `1:1`,
                  `3:4`,
                  `2:3`,
                  `9:16`,
                ];
                if (imageUrls.length > 0) {
                  showToast(`正在分析参考图比例...`);
                  let image = new Image();
                  await new Promise((resolve, reject) => {
                    ((image.onload = resolve), (image.onerror = reject), (image.src = imageUrls[0]));
                  });
                  let imageRatio = image.width / image.height,
                    bestRatio = `1:1`,
                    minDiff = 1 / 0;
                  for (let ratio of ratioCandidates) {
                    let [ratioWidth, ratioHeight] = ratio.split(`:`).map(Number),
                      diff = Math.abs(imageRatio - ratioWidth / ratioHeight);
                    diff < minDiff && ((minDiff = diff), (bestRatio = ratio));
                  }
                  ((resolvedRatio = bestRatio), showToast(`自动匹配参考图比例: ${resolvedRatio}`));
                } else if (combinedPrompt.trim()) {
                  showToast(`正在根据提示词分析最佳比例...`);
                  let baseUrl = propTextApiUrl.replace(/\/$/, ``),
                    modelName2 = textModel
                    .split(
                      `
`,
                    )[0]
                    .trim(),
                    ratioPrompt = `请根据我的提示词，推荐一个最适合生成画面的图片比例。
可选的比例只有以下几种：
21:9
16:9
4:3
1:1
3:4
9:16

你的回复必须只包含比例本身（比如 "16:9"），不要输出任何其他文字、标点符号或解释。

我的提示词是：
${combinedPrompt}`,
                    response = await fetch(`${baseUrl}/v1/chat/completions`, {
                      method: `POST`,
                      headers: {
                        Authorization: `Bearer ${propTextApiKey}`,
                        "Content-Type": `application/json`,
                      },
                      body: JSON.stringify({
                        model: modelName2,
                        messages: [{
                          role: `user`,
                          content: ratioPrompt
                        }],
                        max_tokens: 50,
                        temperature: 0.1,
                      }),
                    });
                  if (response.ok) {
                    let ratioMatch = (await response.json()).choices?.[0]?.message?.content
                      ?.trim()
                      ?.match(/(21:9|16:9|4:3|1:1|3:4|9:16)/);
                    ratioMatch
                      ?
                      ((resolvedRatio = ratioMatch[1]), showToast(`AI分析提示词得出比例: ${resolvedRatio}`)) :
                      showToast(`大模型未提供明确比例，将使用其原生默认画幅`);
                  } else
                    console.warn(`Auto aspect ratio API failed`, await response.text());
                }
                aspectRatio = resolvedRatio;
              } catch (error) {
                (console.error(`Auto aspect ratio failed`, error), (aspectRatio = `Auto`));
              }
            }
		            let requestParams = {};
			            (!isImageResolutionMode && aspectRatio && aspectRatio !== `Auto` && (requestParams.aspectRatio = aspectRatio),
		              isImageResolutionMode ?
		              (requestParams.imageSize = selectedImageResolution) :
		              imageSize && (requestParams.imageSize = imageSize));
		            imageRequestProtocol === `gemini-generate-content` &&
		              requestParams.imageSize &&
		              !isImageResolutionMode &&
		              !/^[24]K$/i.test(String(requestParams.imageSize).trim()) &&
		              (requestParams.imageSize = /4/i.test(String(requestParams.imageSize)) ? `4K` : `2K`);
	            if (
	              imageRequestProtocol === `vectorengine-image-generation` ||
	              imageRequestProtocol === `ark-image-generation` ||
	              imageRequestProtocol === `openai-images`
	            ) {
	              let mapOpenAiImageSize = (aspectRatio2, imageSize2, modelName2) => {
	                  let ratio = String(aspectRatio2 || ``).trim(),
	                    normalizedSize = String(imageSize2 || ``).trim(),
	                    isProModel = /^gpt-image-2-pro$/i.test(String(modelName2 || ``)),
	                    validSizes = [
	                      `1024x1024`,
	                      `1024x1280`,
	                      `1280x1024`,
	                      `960x1280`,
	                      `1280x960`,
	                      `1024x1536`,
	                      `1536x1024`,
	                      `720x1280`,
	                      `1280x720`,
	                      `768x1536`,
	                      `1536x768`,
	                      `720x1680`,
	                      `1680x720`,
	                      `2048x2048`,
	                      `1536x1920`,
	                      `1920x1536`,
	                      `1536x2048`,
	                      `2048x1536`,
	                      `1280x1920`,
	                      `1920x1280`,
	                      `1152x2048`,
	                      `2048x1152`,
	                      `1024x2048`,
	                      `2048x1024`,
	                      `1008x2352`,
	                      `2352x1008`,
	                      `2880x2880`,
	                      `2304x2880`,
	                      `2880x2304`,
	                      `2160x2880`,
	                      `2880x2160`,
	                      `1920x2880`,
	                      `2880x1920`,
	                      `2160x3840`,
	                      `3840x2160`,
	                      `1920x3840`,
	                      `3840x1920`,
	                      `1632x3808`,
	                      `3808x1632`,
	                      `auto`,
	                    ];
		                  if (/^\d{2,5}x\d{2,5}$/i.test(normalizedSize)) return normalizedSize.toLowerCase();
		                  if (validSizes.includes(normalizedSize)) return normalizedSize;
	                  let ratioKey = ratio && ratio !== `Auto` ? ratio : `1:1`,
	                    sizeMap1K = {
	                      "1:1": `1024x1024`,
	                      "16:9": `1280x720`,
	                      "9:16": `720x1280`,
	                      "4:3": `1280x960`,
	                      "3:4": `960x1280`,
	                      "3:2": `1536x1024`,
	                      "2:3": `1024x1536`,
	                      "21:9": `1680x720`,
	                    },
	                    sizeMap2K = {
	                      "1:1": `2048x2048`,
	                      "16:9": `2048x1152`,
	                      "9:16": `1152x2048`,
	                      "4:3": `2048x1536`,
	                      "3:4": `1536x2048`,
	                      "3:2": `1920x1280`,
	                      "2:3": `1280x1920`,
	                      "21:9": `2352x1008`,
	                    },
	                    sizeMap4K = {
	                      "1:1": `2880x2880`,
	                      "16:9": `3840x2160`,
	                      "9:16": `2160x3840`,
	                      "4:3": `2880x2160`,
	                      "3:4": `2160x2880`,
	                      "3:2": `2880x1920`,
	                      "2:3": `1920x2880`,
	                      "21:9": `3808x1632`,
	                    };
	                  return isProModel && /4K/i.test(normalizedSize) ?
	                    sizeMap4K[ratioKey] || sizeMap4K["1:1"] :
	                    isProModel && /2K/i.test(normalizedSize) ?
	                    sizeMap2K[ratioKey] || sizeMap2K["1:1"] :
	                    sizeMap1K[ratioKey] || sizeMap1K["1:1"];
	                },
                vectorengineOpenAiCompatRequest =
                imageRequestProtocol === `openai-images` &&
                /api\.vectorengine\.ai$/i.test(imageApiHost) &&
                /^gpt-image/i.test(imageModelName),
	                openAiImageSize = mapOpenAiImageSize(requestParams.aspectRatio, requestParams.imageSize, imageModelName),
                vectorengineOpenAiCompatSize =
                requestParams.imageSize ||
                (requestParams.aspectRatio && requestParams.aspectRatio !== `Auto` ? `2K` : undefined) ||
                `2K`,
	                vectorengineOpenAiCompatAspectRatio =
		                !isImageResolutionMode && requestParams.aspectRatio && requestParams.aspectRatio !== `Auto` ?
		                requestParams.aspectRatio :
		                undefined,
	                isLconaiDoubaoImage =
	                /^doubao-seedream/i.test(imageModelName) &&
	                /(^|\.)lconai\.com$/i.test(imageApiHost),
		                lconaiDoubaoImageSize =
			                isImageResolutionMode && requestParams.imageSize ?
			                requestParams.imageSize :
			                requestParams.aspectRatio && requestParams.aspectRatio !== `Auto` ?
			                requestParams.aspectRatio :
			                String(requestParams.imageSize || `1k`).toLowerCase(),
		                imageProtocolProfile =
		                selectedImageProtocolDefinition &&
		                typeof selectedImageProtocolDefinition == `object` ?
		                selectedImageProtocolDefinition :
		                {},
		                imageProtocolFieldMapping = {
		                  model: `model`,
		                  prompt: `prompt`,
		                  count: `n`,
		                  size: `size`,
		                  aspectRatio: `aspect_ratio`,
		                  responseFormat: `response_format`,
		                  referenceImage: `image`,
		                  ...(imageProtocolProfile.fieldMapping || {}),
		                },
		                imageProtocolFieldValueTypes =
		                imageProtocolProfile.fieldValueTypes &&
		                typeof imageProtocolProfile.fieldValueTypes == `object` ?
		                imageProtocolProfile.fieldValueTypes :
		                {},
		                imageProtocolExtraBody =
		                imageProtocolProfile.extraBody &&
		                typeof imageProtocolProfile.extraBody == `object` ?
		                imageProtocolProfile.extraBody :
		                null,
		                imageProtocolHasDynamicMapping = !!(
		                  imageProtocolProfile.fieldMapping ||
		                  imageProtocolExtraBody ||
		                  imageProtocolProfile.submitPath ||
		                  imageProtocolProfile.editPath ||
		                  imageProtocolProfile.editSubmitPath ||
		                  imageProtocolProfile.contentType ||
		                  imageProtocolProfile.parameterAdapter ||
		                  imageProtocolProfile.useAspectRatioAsSize === true
		                ),
		                coerceImageProtocolValue = (fieldName, value) => {
		                  let fieldName2 = String(fieldName || ``).trim(),
		                    valueType = imageProtocolFieldValueTypes[fieldName2] ?
		                    String(imageProtocolFieldValueTypes[fieldName2]).trim().toLowerCase() :
		                    ``;
		                  return valueType === `string` ?
		                    String(value ?? ``) :
		                    valueType === `number` ?
		                    Number(value) :
		                    valueType === `boolean` ?
		                    value === true || value === `true` :
		                    value;
		                },
		                putImageProtocolField = (fieldName, target, value) => {
		                  let fieldName2 = String(fieldName || ``).trim();
		                  fieldName2 && value !== undefined && value !== null && value !== `` && (target[fieldName2] = coerceImageProtocolValue(fieldName2, value));
		                },
		                imageParameterAdapter =
		                imageProtocolProfile.parameterAdapter &&
		                typeof imageProtocolProfile.parameterAdapter == `object` ?
		                imageProtocolProfile.parameterAdapter :
		                {},
		                mapProtocolParameterValue = (key, valueMap = {}) => {
		                  let key2 = String(key || ``).trim(),
		                    valueMap2 = valueMap && typeof valueMap == `object` ? valueMap : {};
		                  return Object.prototype.hasOwnProperty.call(valueMap2, key2) ? valueMap2[key2] : key2;
		                },
		                applyProtocolParameterCase = (value, caseMode) => {
		                  let str = String(value || ``);
		                  return caseMode === `lower` ?
		                    str.toLowerCase() :
		                    caseMode === `upper` ?
		                    str.toUpperCase() :
		                    str;
		                },
		                imagePresetSizeValue = () => {
		                  let imageSize2 = String(requestParams.imageSize || `1K`).trim() || `1K`;
		                  return applyProtocolParameterCase(
		                    mapProtocolParameterValue(
		                      imageSize2,
		                      imageProtocolProfile.sizeValueMap || imageParameterAdapter.sizeValueMap,
		                    ),
		                    imageProtocolProfile.sizeValueCase || imageParameterAdapter.sizeValueCase,
		                  );
		                },
		                imageAspectRatioValue = () => {
		                  let aspectRatio2 = requestParams.aspectRatio && requestParams.aspectRatio !== `Auto` ? requestParams.aspectRatio : `1:1`;
		                  return applyProtocolParameterCase(
		                    mapProtocolParameterValue(
		                      aspectRatio2,
		                      imageProtocolProfile.aspectRatioValueMap ||
		                      imageParameterAdapter.aspectRatioValueMap,
		                    ),
		                    imageProtocolProfile.aspectRatioValueCase ||
		                    imageParameterAdapter.aspectRatioValueCase,
		                  );
		                },
		                getProtocolImageSizeValue = () => {
		                  let sizeValueMode = String(
		                    imageProtocolProfile.sizeValueMode ||
		                    imageParameterAdapter.sizeValueMode ||
		                    ``,
			                  ).trim().toLowerCase();
			                if (sizeValueMode === `none` || sizeValueMode === `omit`) return ``;
			                if (isImageResolutionMode) return openAiImageSize;
			                if (sizeValueMode === `preset` || sizeValueMode === `quality` || sizeValueMode === `quality-preset`)
			                  return imagePresetSizeValue();
			                if (sizeValueMode === `dimension` || sizeValueMode === `dimensions` || sizeValueMode === `width-height`)
			                  return applyProtocolParameterCase(
			                    mapProtocolParameterValue(
			                      openAiImageSize,
			                      imageProtocolProfile.sizeValueMap || imageParameterAdapter.sizeValueMap,
			                    ),
			                    imageProtocolProfile.sizeValueCase || imageParameterAdapter.sizeValueCase,
			                  );
		                  if (sizeValueMode === `aspect-ratio` || sizeValueMode === `ratio`) return imageAspectRatioValue();
		                  if (
			                    !isImageResolutionMode &&
			                    imageProtocolProfile.useAspectRatioAsSize === true &&
		                    requestParams.aspectRatio &&
		                    requestParams.aspectRatio !== `Auto`
		                  )
		                    return imageAspectRatioValue();
	              if (
	                    !isImageResolutionMode &&
	                    imageProtocolFieldMapping.aspectRatio &&
	                    imageProtocolFieldMapping.aspectRatio === imageProtocolFieldMapping.size &&
		                    requestParams.aspectRatio &&
	                    requestParams.aspectRatio !== `Auto`
	                  )
		                    return imageAspectRatioValue();
		                  if (isLconaiDoubaoImage) return lconaiDoubaoImageSize;
		                  return imageRequestProtocol === `openai-images` ?
		                    vectorengineOpenAiCompatRequest ?
		                    vectorengineOpenAiCompatSize :
		                    openAiImageSize :
		                    requestParams.imageSize || `2K`;
		                },
		                getProtocolImageAspectRatioValue = () => {
		                  let aspectRatioValueMode = String(
		                    imageProtocolProfile.aspectRatioValueMode ||
		                    imageParameterAdapter.aspectRatioValueMode ||
		                    ``,
		                  ).trim().toLowerCase();
		                  return aspectRatioValueMode === `none` || aspectRatioValueMode === `omit` ?
		                    `` :
		                    aspectRatioValueMode === `dimension` || aspectRatioValueMode === `dimensions` || aspectRatioValueMode === `width-height` ?
		                    openAiImageSize :
		                    aspectRatioValueMode === `preset` || aspectRatioValueMode === `quality` || aspectRatioValueMode === `quality-preset` ?
		                    imagePresetSizeValue() :
		                    imageAspectRatioValue();
		                },
		                buildImageProtocolUrl = (pathOrUrl, fallbackUrl) => {
		                  let path = String(pathOrUrl || ``).trim();
		                  if (!path) return fallbackUrl;
		                  if (/^https?:\/\//i.test(path)) return path;
		                  let baseUrl = String(seedreamBaseUrl || ``).replace(/\/$/, ``);
		                  return (
		                    /\/v1$/i.test(baseUrl) &&
		                    /^\/v1\//i.test(path) &&
		                    (path = path.replace(/^\/v1/i, ``)),
		                    `${baseUrl}${path.startsWith(`/`) ? `` : `/`}${path}`
		                  );
		                },
			                seedreamAspectHint =
	                !isImageResolutionMode && requestParams.aspectRatio && !vectorengineOpenAiCompatAspectRatio ?
	                `\n请生成宽高比为 ${requestParams.aspectRatio} 的画面，并让构图自然适配该比例。` :
	                ``,
	                seedreamPrompt = `${sanitizedPrompt || prompt || ` `}${seedreamAspectHint}`.trim(),
	                seedreamBaseUrl = imageApiBaseUrl,
	                seedreamEndpoint = buildImageProtocolUrl(
	                  imageProtocolProfile.submitPath,
	                  imageRequestProtocol === `openai-images` ?
	                  `${seedreamBaseUrl}/v1/images/generations` :
	                  imageRequestProtocol === `vectorengine-image-generation` ?
	                  `${seedreamBaseUrl}/v1/images/generations` :
	                  /\/api\/v3$/i.test(seedreamBaseUrl) ?
	                  `${seedreamBaseUrl}/images/generations` :
	                  `${seedreamBaseUrl}/api/v3/images/generations`,
	                ),
		                seedreamController = new AbortController(),
                seedreamReferenceImages = [],
                normalizeImageReferenceForProvider = async (mediaUrl) => {
                  let dataUrl = await mediaUrlToDataUrl(mediaUrl);
                  if (
                    dataUrl &&
                    (imageRequestProtocol === `vectorengine-image-generation` ||
                      imageRequestProtocol === `ark-image-generation`) &&
                    !/^https?:\/\//i.test(dataUrl) &&
                    window.wanjuanDesktop &&
                    typeof window.wanjuanDesktop.uploadPublicMedia == `function`
                  ) {
                    showToast(`正在上传参考图...`);
                    let uploadResult = await window.wanjuanDesktop.uploadPublicMedia({
                      url: dataUrl,
                      kind: `image`,
                      filename: `image-reference-${Date.now()}.png`,
                    });
                    if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                    console.warn(`Failed to upload reference image for provider compatibility`, uploadResult);
                  }
                  return dataUrl;
                };
              for (let imageReference of imageUrls.slice(0, 14))
                try {
                  let normalizedReference = await normalizeImageReferenceForProvider(imageReference);
                  normalizedReference && seedreamReferenceImages.push(normalizedReference);
                } catch (error) {
                  console.warn(`Failed to normalize image reference for image generation`, imageReference, error);
                }
              abortControllersRef.current.set(nodeId, seedreamController);
              let seedreamRequestInit;
		              if (
		                imageRequestProtocol === `openai-images` &&
		                seedreamReferenceImages.length > 0 &&
		                (/^gpt-image/i.test(imageModelName) || isLconaiDoubaoImage) &&
		                !vectorengineOpenAiCompatRequest
		              ) {
		                let formData = new FormData();
		                if (imageProtocolHasDynamicMapping) {
		                  let appendField = (key, value) => {
		                    let trimmedKey = String(key || ``).trim();
		                    trimmedKey && value !== undefined && value !== null && value !== `` && formData.append(trimmedKey, coerceImageProtocolValue(trimmedKey, value));
		                  };
		                  (appendField(imageProtocolFieldMapping.model, imageModelName),
		                    appendField(imageProtocolFieldMapping.prompt, seedreamPrompt || ` `),
		                    appendField(imageProtocolFieldMapping.count, 1),
		                    appendField(imageProtocolFieldMapping.size, getProtocolImageSizeValue()),
			                    !isImageResolutionMode &&
			                    (imageProtocolProfile.fieldMapping?.aspectRatio ||
			                      imageProtocolProfile.useAspectRatioAsSize === true) &&
		                    imageProtocolFieldMapping.aspectRatio &&
		                    imageProtocolFieldMapping.aspectRatio !== imageProtocolFieldMapping.size &&
		                    requestParams.aspectRatio &&
		                    requestParams.aspectRatio !== `Auto` &&
		                    appendField(imageProtocolFieldMapping.aspectRatio, getProtocolImageAspectRatioValue()),
		                    imageProtocolExtraBody &&
		                    Object.entries(imageProtocolExtraBody).forEach(([key, value]) => appendField(key, value)));
		                } else
		                  (formData.append(`model`, imageModelName),
		                    formData.append(`prompt`, seedreamPrompt || ` `),
		                    formData.append(`n`, `1`),
		                    isLconaiDoubaoImage && formData.append(`type`, `normal`),
		                    isLconaiDoubaoImage && formData.append(`watermark`, `false`),
		                    formData.append(
		                      `size`,
		                      isLconaiDoubaoImage ?
		                      lconaiDoubaoImageSize :
		                      vectorengineOpenAiCompatRequest ?
		                      vectorengineOpenAiCompatSize :
		                      openAiImageSize,
		                    ),
		                    !isLconaiDoubaoImage &&
		                    vectorengineOpenAiCompatAspectRatio &&
		                    formData.append(`aspect_ratio`, vectorengineOpenAiCompatAspectRatio));
                let appendedCount = 0;
                for (let index = 0; index < seedreamReferenceImages.length; index++) {
                  let referenceImage = seedreamReferenceImages[index];
                  try {
                    let blob = null,
                      extension = `png`,
                      mimeType = `image/png`,
                      dataUrlMatch = referenceImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
                    if (dataUrlMatch) {
                      ((mimeType = dataUrlMatch[1]),
                        (extension = mimeType === `image/jpeg` ? `jpg` : mimeType === `image/webp` ? `webp` : `png`));
                      let binaryString = atob(dataUrlMatch[2]),
                        bytes = new Uint8Array(binaryString.length);
                      for (let index2 = 0; index2 < binaryString.length; index2++) bytes[index2] = binaryString.charCodeAt(index2);
                      blob = new Blob([bytes], {
                        type: mimeType
                      });
                    } else if (/^https?:\/\//i.test(referenceImage)) {
                      let response = await fetch(referenceImage, {
                        signal: seedreamController.signal
                      });
                      if (response.ok) {
                        let blob2 = await response.blob();
                        blob2.size > 0 &&
                          ((blob = blob2),
                            (mimeType = blob2.type || mimeType),
                            (extension =
                              mimeType === `image/jpeg` ?
                              `jpg` :
                              mimeType === `image/webp` ?
                              `webp` :
                              `png`));
                      }
                    }
			                    blob &&
			                      (formData.append(
			                        imageProtocolHasDynamicMapping ?
			                        String(imageProtocolFieldMapping.referenceImage || `image`).replace(
			                          /\{index\}/g,
			                          String(index),
			                        ) :
			                        /(^|\.)lconai\.com$/i.test(imageApiHost) && !isLconaiDoubaoImage ?
			                        `image[${index}]` :
			                        `image`,
		                        blob,
	                        `reference_${index + 1}.${extension}`,
	                      ), appendedCount++);
                  } catch (error) {
                    console.warn(`Failed to append image reference for edits request`, referenceImage, error);
                  }
                }
                appendedCount > 0 ?
	                  ((seedreamRequestInit = {
	                      method: `POST`,
	                      headers: {
	                        Authorization: `Bearer ${imageApiKey}`
	                      },
	                      body: formData,
	                      signal: seedreamController.signal,
	                    }),
	                    (seedreamEndpoint = buildImageProtocolUrl(
	                      imageProtocolProfile.editPath || imageProtocolProfile.editSubmitPath,
	                      `${seedreamBaseUrl}/v1/images/edits`,
	                    ))) :
                  (seedreamRequestInit = undefined);
	              } else {
		                let requestBody =
		                  imageProtocolHasDynamicMapping ?
		                  (() => {
		                    let requestBody2 = {};
		                    return (
		                      putImageProtocolField(imageProtocolFieldMapping.model, requestBody2, imageModelName),
		                      putImageProtocolField(imageProtocolFieldMapping.prompt, requestBody2, seedreamPrompt || ` `),
		                      putImageProtocolField(imageProtocolFieldMapping.count, requestBody2, 1),
		                      putImageProtocolField(
		                        imageProtocolFieldMapping.size,
		                        requestBody2,
		                        getProtocolImageSizeValue(),
		                      ),
			                      !isImageResolutionMode &&
			                      (imageProtocolProfile.fieldMapping?.aspectRatio ||
			                        imageProtocolProfile.useAspectRatioAsSize === true) &&
		                      imageProtocolFieldMapping.aspectRatio &&
		                      imageProtocolFieldMapping.aspectRatio !== imageProtocolFieldMapping.size &&
		                      requestParams.aspectRatio &&
		                      requestParams.aspectRatio !== `Auto` &&
		                      putImageProtocolField(
		                        imageProtocolFieldMapping.aspectRatio,
		                        requestBody2,
		                        getProtocolImageAspectRatioValue(),
		                      ),
		                      imageProtocolFieldMapping.responseFormat &&
		                      putImageProtocolField(
		                        imageProtocolFieldMapping.responseFormat,
		                        requestBody2,
		                        `b64_json`,
		                      ),
		                      imageProtocolExtraBody &&
		                      Object.entries(imageProtocolExtraBody).forEach(([field, value]) =>
		                        putImageProtocolField(field, requestBody2, value),
		                      ),
		                      requestBody2
		                    );
		                  })() :
		                  isLconaiDoubaoImage ?
		                  {
		                    model: imageModelName,
		                    prompt: seedreamPrompt || ` `,
	                    n: 1,
	                    type: `normal`,
	                    size: lconaiDoubaoImageSize,
	                    watermark: false,
	                  } :
	                  imageRequestProtocol === `openai-images` ?
	                  {
                    model: imageModelName,
                    prompt: seedreamPrompt || ` `,
                    ...(vectorengineOpenAiCompatRequest ? {} : { response_format: `b64_json` }),
                    size: vectorengineOpenAiCompatRequest ?
                      vectorengineOpenAiCompatSize :
                      openAiImageSize,
                    ...(vectorengineOpenAiCompatAspectRatio ?
                      {
                        aspect_ratio: vectorengineOpenAiCompatAspectRatio
                      } :
                      {}),
                  } :
                  {
                    model: imageModelName,
                    prompt: seedreamPrompt || ` `,
                    size: requestParams.imageSize || `2K`,
                    response_format: `url`,
                    stream: false,
                    watermark: false,
                  };
	                seedreamReferenceImages.length > 0 &&
	                  (imageProtocolHasDynamicMapping ?
	                    String(imageProtocolFieldMapping.referenceImage || ``).trim() &&
	                    (requestBody[String(imageProtocolFieldMapping.referenceImage || `image`).trim()] =
	                      seedreamReferenceImages.length === 1 ?
	                      seedreamReferenceImages[0] :
	                      seedreamReferenceImages) :
	                    (imageRequestProtocol !== `openai-images` ||
	                      vectorengineOpenAiCompatRequest ||
	                      /(^|\.)lconai\.com$/i.test(imageApiHost)) &&
	                    (requestBody.image =
	                      seedreamReferenceImages.length === 1 ?
	                      seedreamReferenceImages[0] :
	                      seedreamReferenceImages));
	                /^doubao-seedream/i.test(imageModelName) &&
	                  !isLconaiDoubaoImage &&
	                  ((requestBody.sequential_image_generation = `disabled`),
	                    !isImageResolutionMode &&
	                    requestParams.aspectRatio &&
	                    requestParams.aspectRatio !== `Auto` &&
	                    (requestBody.aspect_ratio = requestParams.aspectRatio));
                seedreamRequestInit = {
                  method: `POST`,
                  headers: {
                    Authorization: `Bearer ${imageApiKey}`,
                    "Content-Type": `application/json`,
                  },
                  body: JSON.stringify(requestBody),
                  signal: seedreamController.signal,
                };
              }
              if (!seedreamRequestInit) {
                let requestBody = {
                  model: imageModelName,
                  prompt: seedreamPrompt || ` `,
                  ...(vectorengineOpenAiCompatRequest ? {} : { response_format: `b64_json` }),
                  size: vectorengineOpenAiCompatRequest ?
                    vectorengineOpenAiCompatSize :
                    openAiImageSize,
                  ...(vectorengineOpenAiCompatAspectRatio ?
                    {
                      aspect_ratio: vectorengineOpenAiCompatAspectRatio
                    } :
                    {}),
                };
                seedreamRequestInit = {
                  method: `POST`,
                  headers: {
                    Authorization: `Bearer ${imageApiKey}`,
                    "Content-Type": `application/json`,
                  },
                  body: JSON.stringify(requestBody),
                  signal: seedreamController.signal,
                };
                seedreamEndpoint = `${seedreamBaseUrl}/v1/images/generations`;
              }
              let seedreamResponse = await fetch(
                seedreamEndpoint,
                seedreamRequestInit,
              );
              if ((abortControllersRef.current.delete(nodeId), !seedreamResponse.ok)) {
                let errorMessage = `API 请求失败: ${seedreamResponse.status} ${seedreamResponse.statusText}`;
                try {
                  let errorData = await seedreamResponse.json();
                  errorMessage =
                    errorData.error && errorData.error.message ?
                    `API 请求失败: ${errorData.error.message}` :
                    errorData.message ?
                    `API 请求失败: ${errorData.message}` :
                    `API 请求失败: ${seedreamResponse.status} - ${serializeErrorPreview(errorData)}`;
                } catch {
                  try {
                    let errorText = await seedreamResponse.text();
                    errorMessage = `API 请求失败: ${seedreamResponse.status} - ${errorText}`;
                  } catch {}
                }
                throw Error(errorMessage);
              }
		              let seedreamResult = await seedreamResponse.json();
		              (localStorage.setItem(apiBindingId, (audioApiKey + 1).toString()), setDailyGenerationCount(audioApiKey + 1));
		              let readImageProtocolResponsePath = (source, path) => {
		                  let trimmedPath = String(path || ``).trim();
		                  if (!trimmedPath) return undefined;
	                  return trimmedPath.split(`.`).reduce((current, segment) => {
	                    if (current === undefined || current === null) return undefined;
	                    let arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
		                    return arrayMatch ?
		                      current?.[arrayMatch[1]]?.[Number(arrayMatch[2])] :
		                      /^\d+$/.test(segment) ?
		                      current?.[Number(segment)] :
		                      current?.[segment];
		                  }, source);
		                },
		                normalizeImageProtocolResultValue = (value) => {
		                  let trimmedValue = typeof value == `string` ? value.trim() : ``;
		                  if (!trimmedValue) return ``;
		                  let inlineDataImage = trimmedValue.match(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+/i);
		                  if (inlineDataImage) return inlineDataImage[0].replace(/\s+/g, ``);
		                  if (/^(https?:|blob:)/i.test(trimmedValue)) return trimmedValue.replace(/[`\s]/g, ``);
		                  let compactBase64 = trimmedValue.replace(/\s+/g, ``);
		                  return /^[A-Za-z0-9+/=]+$/.test(compactBase64) && compactBase64.length > 120 ?
		                    `data:image/png;base64,${compactBase64}` :
		                    ``;
		                },
		                findImageProtocolResult = (value, seen = new Set()) => {
		                  let directImage = normalizeImageProtocolResultValue(value);
		                  if (directImage) return directImage;
		                  if (!value || typeof value != `object` || seen.has(value)) return ``;
		                  seen.add(value);
		                  if (Array.isArray(value)) {
		                    for (let item of value) {
		                      let imageUrl = findImageProtocolResult(item, seen);
		                      if (imageUrl) return imageUrl;
		                    }
		                    return ``;
		                  }
		                  let preferredKeys = [
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
		                    `b64Json`,
		                    `url`,
		                    `image`,
		                    `data`,
		                    `result`,
		                    `output`,
		                    `content`,
		                    `text`,
		                    `message`,
		                  ];
		                  for (let key of preferredKeys) {
		                    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
		                    let imageUrl = findImageProtocolResult(value[key], seen);
		                    if (imageUrl) return imageUrl;
		                  }
		                  let ignoredKeys = new Set([
		                    `request`,
		                    `requests`,
		                    `params`,
		                    `payload`,
		                    `input`,
		                    `inputs`,
		                    `prompt`,
		                    `prompts`,
		                    `reference`,
		                    `references`,
		                    `thumbnail`,
		                    `thumbnail_url`,
		                    `preview`,
		                    `preview_url`,
		                    `cover`,
		                    `cover_url`,
		                  ]);
		                  for (let [key, childValue] of Object.entries(value)) {
		                    if (preferredKeys.includes(key) || ignoredKeys.has(String(key).toLowerCase())) continue;
		                    let imageUrl = findImageProtocolResult(childValue, seen);
		                    if (imageUrl) return imageUrl;
		                  }
		                  return ``;
		                },
		                imageProtocolTaskIdPaths =
		                imageProtocolProfile.responseMapping &&
		                typeof imageProtocolProfile.responseMapping == `object` ?
		                imageProtocolProfile.responseMapping.taskId ||
		                imageProtocolProfile.responseMapping.task_id ||
		                imageProtocolProfile.responseMapping.id :
		                null,
		                seedreamRemoteTaskId = (() => {
		                  let candidates = [];
		                  (Array.isArray(imageProtocolTaskIdPaths) ?
		                    imageProtocolTaskIdPaths :
		                    imageProtocolTaskIdPaths ?
		                    [imageProtocolTaskIdPaths] :
		                    []
		                  ).forEach((path) => candidates.push(readImageProtocolResponsePath(seedreamResult, path)));
		                  candidates.push(
		                    seedreamResult?.id,
		                    seedreamResult?.task_id,
		                    seedreamResult?.taskId,
		                    seedreamResult?.data?.id,
		                    seedreamResult?.data?.task_id,
		                    seedreamResult?.data?.taskId,
		                    seedreamResult?.result?.id,
		                    seedreamResult?.result?.task_id,
		                    seedreamResult?.result?.taskId,
		                    seedreamResult?.task?.id,
		                    seedreamResult?.task?.task_id,
		                    seedreamResult?.task?.taskId,
		                  );
		                  return candidates.map((item) => String(item || ``).trim()).find(Boolean) || ``;
		                })(),
		                imageProtocolResponsePaths =
		                imageProtocolProfile.responseMapping &&
		                typeof imageProtocolProfile.responseMapping == `object` ?
		                imageProtocolProfile.responseMapping.image :
		                null,
	                protocolMappedImage =
	                (Array.isArray(imageProtocolResponsePaths) ?
	                  imageProtocolResponsePaths :
	                  imageProtocolResponsePaths ?
	                  [imageProtocolResponsePaths] :
	                  [])
	                .map((item) => readImageProtocolResponsePath(seedreamResult, item))
	                .map((value) => findImageProtocolResult(value))
	                .find((value) => typeof value == `string` && value.trim()),
	                seedreamPrimaryImage = seedreamResult?.data?.[0] || {},
		                imageProtocolFallbackImage = findImageProtocolResult(seedreamResult),
	                seedreamImage =
	                protocolMappedImage ||
		                normalizeImageProtocolResultValue(seedreamPrimaryImage.download_url) ||
                normalizeImageProtocolResultValue(seedreamPrimaryImage.original_url) ||
                normalizeImageProtocolResultValue(seedreamPrimaryImage.origin_url) ||
                normalizeImageProtocolResultValue(seedreamPrimaryImage.large_image_url) ||
                normalizeImageProtocolResultValue(seedreamPrimaryImage.result_url) ||
                normalizeImageProtocolResultValue(seedreamPrimaryImage.output_url) ||
                normalizeImageProtocolResultValue(seedreamPrimaryImage.url) ||
                normalizeImageProtocolResultValue(seedreamPrimaryImage.image_url) ||
		                normalizeImageProtocolResultValue(seedreamPrimaryImage.b64_json) ||
		                imageProtocolFallbackImage;
		              seedreamRemoteTaskId &&
		                updateGlobalTaskList &&
		                updateGlobalTaskList((tasks) =>
		                  tasks.map((task) =>
		                    task.id === imageTaskId ?
		                    {
		                      ...task,
		                      remoteTaskId: seedreamRemoteTaskId,
		                    } :
		                    task,
		                  ),
		                );
		              if (!seedreamImage) throw Error(`未生成图片`);
		              let seedreamDisplayImage = seedreamImage,
	                seedreamAssetBinding = null;
	              if (window.wanjuanDesktop?.persistProjectAsset)
	                try {
	                  let seedreamAsset = await window.wanjuanDesktop.persistProjectAsset({
	                    url: seedreamImage,
	                    filename: `${String(imageModelName || `seedream`).replace(/[^a-z0-9_-]+/gi, `-`)}-${Date.now()}`,
	                    mime: `image/png`,
	                    projectId: projectIdRef.current,
	                    nodeId: nodeId,
	                    field: `imageUrl`,
	                    kind: `image`,
	                    directory: ``,
		                  });
		                  if (seedreamAsset?.ok && seedreamAsset.localPath) {
		                    let seedreamSafeStorageSegment = (storageSegment) =>
		                        String(storageSegment || `default`).replace(/[^a-zA-Z0-9_-]+/g, `_`).slice(0, 80) || `default`,
		                      seedreamPortableRef = `project-asset-v2-${seedreamSafeStorageSegment(projectIdRef.current)}-${seedreamSafeStorageSegment(nodeId || `node`)}-${seedreamSafeStorageSegment(`media-imageUrl-portable`)}`;
	                    seedreamDisplayImage =
	                      typeof seedreamAsset.value == `string` &&
	                      seedreamAsset.value.startsWith(`data:image/`) ?
	                      seedreamAsset.value :
	                      buildProjectMediaFileUrl(seedreamAsset.localPath) || seedreamImage;
	                    seedreamAssetBinding = {
	                      ...seedreamAsset,
	                      field: `imageUrl`,
	                      kind: `image`,
	                      portableDataRef: seedreamPortableRef,
	                      valueFormat: seedreamAsset.valueFormat || `file-url`,
	                      sourceOrigin: `generated`,
	                      sourceSignature: seedreamImage,
	                      missing: false,
	                    };
	                    localforageModule.default &&
	                      (await localforageModule.default.setItem(
	                        seedreamPortableRef,
	                        seedreamAsset.value !== undefined ?
	                        seedreamAsset.value :
	                        seedreamDisplayImage,
	                      ));
	                  }
	                } catch (seedreamPersistError) {
	                  console.warn(`Seedream result persist skipped`, seedreamPersistError);
	                }
	              let image = new Image();
	              ((image.onload = () => {
                  let width = 320,
                    height = 320,
                    aspectRatio2 = image.width / image.height;
                  (aspectRatio === `Auto` || !aspectRatio ?
                    ((height = Math.min(image.height, 400)),
                      (width = height * aspectRatio2),
                      width > 800 && ((width = 800), (height = width / aspectRatio2))) :
                    aspectRatio === `16:9` ?
                    ((width = 600), (height = (9 / 16) * width)) :
                    aspectRatio === `9:16` ?
                    ((height = 400), (width = (9 / 16) * height)) :
                    aspectRatio === `4:3` ?
                    ((width = 500), (height = (3 / 4) * width)) :
                    aspectRatio === `3:4` ?
                    ((height = 400), (width = (3 / 4) * height)) :
                    ((height = 320), (width = height)),
                    setNodes((nodes3) =>
                      nodes3.map((node) =>
	                        node.id === nodeId && node.data?.taskId === imageTaskId ?
                        {
                          ...node,
                          style: {
                            ...node.style,
                            width: width,
                            height: height
                          },
                          data: {
	                            ...node.data,
	                            imageUrl: seedreamDisplayImage,
	                            projectAssetBindings: seedreamAssetBinding ? {
	                              ...(node.data?.projectAssetBindings || {}),
	                              imageUrl: seedreamAssetBinding,
	                            } : node.data?.projectAssetBindings,
	                            loading: false,
	                            errorMessage: undefined,
                          },
                        } :
                        node,
                      ),
                    ),
                    updateGlobalTaskList &&
                    updateGlobalTaskList((tasks) =>
                      tasks.map((task) =>
                        task.id === imageTaskId ?
                        {
                          ...task,
	                          status: `completed`,
	                          progress: 100,
	                          customResultData: seedreamDisplayImage,
	                        } :
                        task,
                      ),
                    ),
                    setEdges((edges3) =>
                      edges3.map((edge) => (edge.target === nodeId ? {
                        ...edge,
                        animated: false
                      } : edge)),
                    ),
	                    addGeneratedAsset && seedreamDisplayImage && addGeneratedAsset(seedreamDisplayImage, `image`, `generated`),
                    showToast(
                      imageRequestProtocol === `openai-images` ?
                      `OpenAI Images 图片生成成功！` :
                      `图片生成成功！`,
                    ));
                }),
                (image.onerror = () => {
                  (setNodes((nodes3) =>
                      nodes3.map((node) =>
	                        node.id === nodeId && node.data?.taskId === imageTaskId ?
                        {
                          ...node,
                          data: {
	                            ...node.data,
	                            imageUrl: seedreamDisplayImage,
	                            projectAssetBindings: seedreamAssetBinding ? {
	                              ...(node.data?.projectAssetBindings || {}),
	                              imageUrl: seedreamAssetBinding,
	                            } : node.data?.projectAssetBindings,
	                            loading: false,
                            errorMessage: undefined,
                          },
                        } :
                        node,
                      ),
                    ),
                    updateGlobalTaskList &&
                    updateGlobalTaskList((tasks) =>
                      tasks.map((task) =>
                        task.id === imageTaskId ?
                        {
                          ...task,
	                          status: `completed`,
	                          progress: 100,
	                          customResultData: seedreamDisplayImage,
                        } :
                        task,
                      ),
                    ),
                    setEdges((edges3) =>
                      edges3.map((edge) => (edge.target === nodeId ? {
                        ...edge,
                        animated: false
                      } : edge)),
                    ),
                    showToast(
                      imageRequestProtocol === `openai-images` ?
                      `OpenAI Images 生成成功 (预览加载失败)` :
                      `图片生成成功 (预览加载失败)`,
                    ));
                }),
	                (image.src = seedreamDisplayImage));
              return;
            }
            if (imageRequestProtocol === `gpt-image-2-async`) {
              let suChuangConfiguredUrl = imageApiUrl.replace(/\/$/, ``),
                suChuangBaseUrl = suChuangConfiguredUrl;
              try {
                let parsedUrl = new URL(suChuangBaseUrl);
                parsedUrl.hostname.includes(`wuyinkeji.com`) && (suChuangBaseUrl = parsedUrl.origin);
              } catch {}
              let suChuangSize =
                requestParams.aspectRatio && requestParams.aspectRatio !== `Auto` ?
                requestParams.aspectRatio :
                `auto`,
                suChuangUploadImage = async (url) => {
                    if (!url || typeof url != `string`) return ``;
                    let trimmedUrl = url.trim();
                    if (/^https?:\/\//i.test(trimmedUrl)) return trimmedUrl;
                    if (
                      !window.wanjuanDesktop ||
                      typeof window.wanjuanDesktop.uploadPublicMedia != `function`
                    )
                      throw Error(`GPT-Image-2 参考图需要公网 URL，请使用网络图片或启用桌面上传服务`);
                    showToast(`正在上传 GPT-Image-2 参考图到公网临时链接...`);
                    let uploadResult = await window.wanjuanDesktop.uploadPublicMedia({
                      url: trimmedUrl,
                      kind: `image`,
                      filename: `gpt-image-2-reference-${Date.now()}.png`,
                    });
                    if (uploadResult?.ok && uploadResult.url) return uploadResult.url;
                    throw Error(uploadResult?.error || `参考图上传失败`);
                  },
                  suChuangUrls = [];
              for (let imageUrl of imageUrls) {
                let uploadedUrl = await suChuangUploadImage(imageUrl);
                uploadedUrl && suChuangUrls.push(uploadedUrl);
              }
              let suChuangController = new AbortController();
              abortControllersRef.current.set(nodeId, suChuangController);
              showToast(`正在提交 GPT-Image-2 图片任务...`);
              let suChuangSubmitEndpoint = /\/api\/async\/image_gpt$/i.test(
                  suChuangConfiguredUrl,
                ) ?
                suChuangConfiguredUrl :
                `${suChuangBaseUrl}/api/async/image_gpt`,
                suChuangDetailEndpoint = /\/api\/async\/image_gpt$/i.test(
                  suChuangConfiguredUrl,
                ) ?
                suChuangConfiguredUrl.replace(
                  /\/api\/async\/image_gpt$/i,
                  `/api/async/detail`,
                ) :
                `${suChuangBaseUrl}/api/async/detail`,
                suChuangSubmitUrl = `${suChuangSubmitEndpoint}?key=${encodeURIComponent(imageApiKey)}`,
                suChuangSubmitTask = async () => {
                  let response = await fetch(suChuangSubmitUrl, {
                    method: `POST`,
                    headers: {
                      Authorization: imageApiKey,
                      "Content-Type": `application/json`,
                    },
                    body: JSON.stringify({
                      prompt: sanitizedPrompt || prompt || ` `,
                      size: suChuangSize,
                      urls: suChuangUrls,
                    }),
                    signal: suChuangController.signal,
                  });
                  if (!response.ok) {
                    let errorText = await response.text().catch(() => ``);
                    throw Error(`GPT-Image-2 提交失败: ${response.status} ${errorText}`);
                  }
                  let submitResult = await response.json();
                  if (submitResult.code && submitResult.code !== 200)
                    throw Error(submitResult.msg || `GPT-Image-2 提交失败`);
                  let remoteTaskId = submitResult.data?.id || submitResult.id || submitResult.data?.task_id;
                  if (!remoteTaskId) throw Error(`GPT-Image-2 未返回任务 ID`);
                  return remoteTaskId;
                };
              let suChuangRemoteTaskId = await suChuangSubmitTask();
              updateGlobalTaskList &&
                updateGlobalTaskList((tasks) =>
                  tasks.map((task) =>
                    task.id === imageTaskId ?
                    {
                      ...task,
                      remoteTaskId: suChuangRemoteTaskId,
                      asyncImageDetailUrl: suChuangDetailEndpoint,
                    } :
                    task,
                  ),
                );
              let suChuangReferenceUrls = new Set(
                  suChuangUrls.map((item) => String(item || ``).replace(/[`\s]/g, ``)),
                ),
                suChuangIsReferenceUrl = (candidateUrl) => {
                  let normalizedUrl = String(candidateUrl || ``).replace(/[`\s]/g, ``);
                  return (
                    suChuangReferenceUrls.has(normalizedUrl) || [...suChuangReferenceUrls].some(
                      (referenceUrl) => normalizedUrl && referenceUrl && (normalizedUrl === referenceUrl || normalizedUrl.includes(referenceUrl) || referenceUrl.includes(normalizedUrl)),
                    )
                  );
                },
                suChuangFindImageUrl = (value) => {
                  if (!value) return ``;
                  if (typeof value == `string`) {
                    let cleaned = value.replace(/[`\s]/g, ``);
                    if (/^[\[{]/.test(value.trim()))
                      try {
                        let foundUrl = suChuangFindImageUrl(JSON.parse(value));
                        if (foundUrl) return foundUrl;
                      } catch {}
                    if (
                      /^https?:\/\//i.test(cleaned) &&
                      !suChuangIsReferenceUrl(cleaned) &&
                      (/\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(cleaned) ||
                        /oss|cos|cdn|image|img|file|tmpfiles/i.test(cleaned))
                    )
                      return cleaned;
                    let urls = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
                    for (let url of urls) {
                      let cleanedUrl = url.replace(/[`\s]/g, ``);
                      if (
                        !suChuangIsReferenceUrl(cleanedUrl) &&
                        (/\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(cleanedUrl) ||
                          /oss|cos|cdn|image|img|file|tmpfiles/i.test(cleanedUrl))
                      )
                        return cleanedUrl;
                    }
                    return ``;
                  }
                  if (Array.isArray(value)) {
                    for (let responseData of value) {
                      let foundUrl = suChuangFindImageUrl(responseData);
                      if (foundUrl) return foundUrl;
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
                      `url`,
                    ];
                    for (let key of urlKeys) {
                      let foundUrl = suChuangFindImageUrl(value[key]);
                      if (foundUrl) return foundUrl;
                    }
                    for (let [key, value2] of Object.entries(value)) {
                      if (
                        [
                          `urls`,
                          `url_list`,
                          `reference`,
                          `references`,
                          `input`,
                          `inputs`,
                          `request`,
                          `params`,
                          `payload`,
                          `prompt`,
                          `thumbnail`,
                          `thumbnail_url`,
                          `thumbnailUrl`,
                          `preview`,
                          `preview_url`,
                          `previewUrl`,
                          `cover`,
                          `cover_url`,
                          `coverUrl`,
                        ].includes(String(key).toLowerCase())
                      )
                        continue;
                      let foundUrl = suChuangFindImageUrl(value2);
                      if (foundUrl) return foundUrl;
                    }
                  }
                  return ``;
                },
                suChuangDone = false,
                suChuangPollCount = 0,
                suChuangRetryCount = 0,
                suChuangNetworkErrorCount = 0,
                suChuangPollingTimeoutMs = Math.max(5e3, (Number(timeoutSeconds) || 600) * 1e3),
                suChuangPollingStartedAt = Date.now();
              for (; !suChuangDone;) {
                if (suChuangController.signal.aborted) throw Error(`已取消`);
                if (Date.now() - suChuangPollingStartedAt >= suChuangPollingTimeoutMs)
                  throw Error(`图片异步轮询超时，可能已在中转站完成；可在任务清单手动拉回结果`);
                (await new Promise((resolve) => setTimeout(resolve, 3e3)),
                  suChuangPollCount++,
                  suChuangPollCount % 20 == 0 &&
                  showToast(`GPT-Image-2 仍在生成中，请耐心等待...`));
                let progress = Math.min(99, suChuangPollCount * 4);
                (setNodes((nodes3) =>
                    nodes3.map((node) =>
	                      node.id === nodeId && node.data?.taskId === imageTaskId ? {
                        ...node,
                        data: {
                          ...node.data,
                          progress: Math.min(99, suChuangPollCount * 4)
                        }
                      } : node,
                    ),
                  ),
                  updateGlobalTaskList &&
                  updateGlobalTaskList((tasks) =>
                    tasks.map((task) =>
                      task.id === imageTaskId ? {
                        ...task,
                        status: `running`,
                        progress: progress
                      } : task,
                    ),
                  ));
                let detailUrl = `${suChuangDetailEndpoint}?key=${encodeURIComponent(imageApiKey)}&id=${encodeURIComponent(suChuangRemoteTaskId)}`,
                  response,
                  pollResult;
                try {
                  response = await fetch(detailUrl, {
                    method: `GET`,
                    headers: {
                      Authorization: imageApiKey,
                      "Content-Type": `application/json`,
                    },
                    signal: suChuangController.signal,
                  });
                  if (!response.ok) continue;
                  pollResult = await response.json();
                  suChuangNetworkErrorCount = 0;
                } catch (error) {
                  if (suChuangController.signal.aborted || error?.name === `AbortError`)
                    throw error;
                  if (!WanJuanIsTransientNetworkError(error)) throw error;
                  (suChuangNetworkErrorCount++,
                    console.warn(`GPT-Image-2 polling transient network error:`, error),
                    suChuangNetworkErrorCount === 3 &&
                    showToast(`GPT-Image-2 状态查询遇到临时网络错误，仍会继续重试...`));
                  continue;
                }
                let status = Number(pollResult.data?.status ?? pollResult.status ?? 0);
                if (pollResult.code && pollResult.code !== 200) throw Error(pollResult.msg || `GPT-Image-2 查询失败`);
                if (status === 3) {
                  let message = pollResult.data?.message || pollResult.msg || `GPT-Image-2 生成失败`;
                  if (
                    suChuangRetryCount < 2 &&
                    /(excessive system load|system load|overload|busy|timeout|temporar|系统繁忙|负载|过载|超时)/i.test(
                      message,
                    )
                  ) {
                    (suChuangRetryCount++,
                      showToast(`GPT-Image-2 服务繁忙，正在自动重试 ${suChuangRetryCount}/2...`),
                      await new Promise((resolve) => setTimeout(resolve, 5e3 * suChuangRetryCount)),
                      (suChuangRemoteTaskId = await suChuangSubmitTask()),
                      (suChuangPollCount = 0));
                    continue;
                  }
                  throw Error(message);
                }
                let imageUrl = suChuangFindImageUrl(pollResult.data || pollResult);
                if (status === 2 || imageUrl) {
                  if (!imageUrl) throw Error(`GPT-Image-2 已完成但未返回图片地址`);
                  suChuangDone = true;
                  let imageUrl2 = imageUrl;
                  abortControllersRef.current.delete(nodeId);
                  let image = new Image();
                  ((image.onload = () => {
                      let width = 320,
                        height = 320,
                        aspectRatio2 = image.width / image.height;
                      (requestParams.aspectRatio ?
                        requestParams.aspectRatio === `16:9` ?
                        ((width = 600), (height = (9 / 16) * width)) :
                        requestParams.aspectRatio === `9:16` ?
                        ((height = 400), (width = (9 / 16) * height)) :
                        requestParams.aspectRatio === `4:3` ?
                        ((width = 500), (height = (3 / 4) * width)) :
                        requestParams.aspectRatio === `3:4` ?
                        ((height = 400), (width = (3 / 4) * height)) :
                        ((height = 320), (width = height)) :
                        ((height = Math.min(image.height, 400)),
                          (width = height * aspectRatio2),
                          width > 800 && ((width = 800), (height = width / aspectRatio2))),
                        setNodes((nodes3) =>
                          nodes3.map((node) =>
	                            node.id === nodeId && node.data?.taskId === imageTaskId ?
                            {
                              ...node,
                              style: {
                                ...node.style,
                                width: width,
                                height: height
                              },
                              data: {
                                ...node.data,
                                imageUrl: imageUrl2,
                                loading: false,
                                progress: 100,
                                errorMessage: undefined,
                              },
                            } :
                            node,
                          ),
                        ),
                        updateGlobalTaskList &&
                        updateGlobalTaskList((tasks) =>
                          tasks.map((task) =>
                            task.id === imageTaskId ?
                            {
                              ...task,
                              status: `completed`,
                              progress: 100,
                              customResultData: imageUrl2,
                            } :
                            task,
                          ),
                        ),
                        setEdges((edges3) =>
                          edges3.map((edge) => (edge.target === nodeId ? {
                            ...edge,
                            animated: false
                          } : edge)),
                        ),
                        addGeneratedAsset && imageUrl2 && addGeneratedAsset(imageUrl2, `image`, `generated`),
                        showToast(`GPT-Image-2 图片生成成功！`));
                    }),
                    (image.onerror = () => {
                      (setNodes((nodes3) =>
                          nodes3.map((node) =>
	                            node.id === nodeId && node.data?.taskId === imageTaskId ?
                            {
                              ...node,
                              data: {
                                ...node.data,
                                imageUrl: imageUrl2,
                                loading: false,
                                progress: 100,
                                errorMessage: undefined,
                              },
                            } :
                            node,
                          ),
                        ),
                        updateGlobalTaskList &&
                        updateGlobalTaskList((tasks) =>
                          tasks.map((node) =>
                            node.id === imageTaskId ?
                            {
                              ...node,
                              status: `completed`,
                              progress: 100,
                              customResultData: imageUrl2,
                            } :
                            node,
                          ),
                        ),
                        setEdges((edges3) =>
                          edges3.map((edge) => (edge.target === nodeId ? {
                            ...edge,
                            animated: false
                          } : edge)),
                        ),
                        showToast(`GPT-Image-2 生成成功 (预览加载失败)`));
                    }),
                    (image.src = imageUrl2));
                  break;
                }
              }
              return;
            }
            let requestBody = {
              contents: [{
                role: `user`,
                parts: contentParts
              }],
              generationConfig: {
                responseModalities: [`IMAGE`]
              },
            };
            (Object.keys(requestParams).length > 0 &&
              ((requestParams.aspectRatio ||= `1:1`), (requestBody.generationConfig.imageConfig = requestParams)),
              console.log(`Sending request:`, safeStringifyRequestForLog(requestBody)));
            let baseUrl = imageApiUrl.replace(/\/$/, ``),
              apiHost = (() => {
                try {
                  return new URL(baseUrl).host;
                } catch {
                  return baseUrl;
                }
              })(),
              isVectorEngine = /(?:^|\.)api\.vectorengine\.ai$/i.test(String(apiHost || ``)),
              requestUrl = isVectorEngine ?
              `${baseUrl}/v1beta/models/${imageModelName}:generateContent` :
              `${baseUrl}/v1beta/models/${imageModelName}:generateContent?key=${imageApiKey}`,
              abortController = new AbortController();
            abortControllersRef.current.set(nodeId, abortController);
            let response = await fetch(requestUrl, {
              method: `POST`,
              headers: isVectorEngine ?
                {
                  Authorization: `Bearer ${imageApiKey}`,
                  "Content-Type": `application/json`,
                } :
                {
                  "Content-Type": `application/json`
                },
              body: JSON.stringify(requestBody),
              signal: abortController.signal,
            });
            if ((abortControllersRef.current.delete(nodeId), !response.ok)) {
              let errorMessage = `API 请求失败: ${response.status} ${response.statusText}`;
              try {
                let errorData = await response.json();
                errorMessage =
                  errorData.error && errorData.error.message ?
                  `API 请求失败: ${errorData.error.message}` :
                  errorData.message ?
                  `API 请求失败: ${errorData.message}` :
                  `API 请求失败: ${response.status} - ${serializeErrorPreview(errorData)}`;
              } catch {}
              throw Error(errorMessage);
            }
            let responseData = await response.json();
            (localStorage.setItem(apiBindingId, (audioApiKey + 1).toString()), setDailyGenerationCount(audioApiKey + 1));
            let candidate = responseData.candidates?.[0];
            if (!candidate) throw Error(`API 返回格式错误：找不到 candidates`);
            let imagePart = candidate.content?.parts?.find((part) => part.inlineData),
              textPart = candidate.content?.parts?.find((part) => part.text),
              imageDataUrl = ``;
            if (imagePart && imagePart.inlineData)
              imageDataUrl = `data:${imagePart.inlineData.mimeType || `image/png`};base64,${imagePart.inlineData.data}`;
            else if (textPart && textPart.text) {
              let imageMatch = textPart.text.match(
                /!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/,
              );
              if (imageMatch && imageMatch[1]) imageDataUrl = imageMatch[1];
              else {
                let imageUrlMatch = textPart.text.match(/!\[.*?\]\((https?:\/\/[^)\s]+|blob:[^)\s]+)\)/i);
                if (imageUrlMatch && imageUrlMatch[1]) imageDataUrl = imageUrlMatch[1].replace(/[`\s]/g, ``);
              }
              if (!imageDataUrl)
                throw (
                  console.warn(`Model returned text:`, textPart.text),
                  showToast(`API返回文本: ${textPart.text.substring(0, 100)}...`),
                  Error(`未生成图片，请检查提示词或模型设置`)
                );
            } else throw Error(`未生成图片`);
            if (imageDataUrl) {
              let image = new Image();
              ((image.onload = () => {
                  let width = 320,
                    height = 320,
                    aspectRatio2 = image.width / image.height;
                  (aspectRatio === `Auto` || !aspectRatio ?
                    ((height = Math.min(image.height, 400)),
                      (width = height * aspectRatio2),
                      width > 800 && ((width = 800), (height = width / aspectRatio2))) :
                    aspectRatio === `16:9` ?
                    ((width = 600), (height = (9 / 16) * width)) :
                    aspectRatio === `9:16` ?
                    ((height = 400), (width = (9 / 16) * height)) :
                    aspectRatio === `4:3` ?
                    ((width = 500), (height = (3 / 4) * width)) :
                    aspectRatio === `3:4` ?
                    ((height = 400), (width = (3 / 4) * height)) :
                    ((height = 320), (width = height)),
                    setNodes((nodes3) =>
                      nodes3.map((node) =>
	                        node.id === nodeId && node.data?.taskId === imageTaskId ?
                        {
                          ...node,
                          style: {
                            ...node.style,
                            width: width,
                            height: height
                          },
                          data: {
                            ...node.data,
                            imageUrl: imageDataUrl,
                            loading: false,
                            errorMessage: undefined,
                          },
                        } :
                        node,
                      ),
                    ),
                    updateGlobalTaskList &&
                    updateGlobalTaskList((nodes3) =>
                      nodes3.map((node) =>
                        node.id === imageTaskId ?
                        {
                          ...node,
                          status: `completed`,
                          progress: 100,
                          customResultData: imageDataUrl,
                        } :
                        node,
                      ),
                    ),
                    setEdges((edges3) =>
                      edges3.map((edge) => (edge.target === nodeId ? {
                        ...edge,
                        animated: false
                      } : edge)),
                    ),
                    addGeneratedAsset ?
                    (addGeneratedAsset(imageDataUrl, `image`, `generated`), showToast(`生成成功并已保存到资源！`)) :
                    showToast(`生成成功！`));
                }),
                (image.onerror = () => {
                  (updateGlobalTaskList &&
                    updateGlobalTaskList((nodes3) =>
                      nodes3.map((node) =>
                        node.id === imageTaskId ?
                        {
                          ...node,
                          status: `completed`,
                          progress: 100,
                          customResultData: imageDataUrl,
                        } :
                        node,
                      ),
                    ),
                    setNodes((nodes3) =>
                      nodes3.map((node) =>
	                        node.id === nodeId && node.data?.taskId === imageTaskId ?
                        {
                          ...node,
                          data: {
                            ...node.data,
                            imageUrl: imageDataUrl,
                            loading: false,
                            errorMessage: undefined,
                          },
                        } :
                        node,
                      ),
                    ),
                    setEdges((edges3) =>
                      edges3.map((edge) => (edge.target === nodeId ? {
                        ...edge,
                        animated: false
                      } : edge)),
                    ),
                    showToast(`生成成功 (预览加载失败)`));
                }),
	                (image.src = imageDataUrl));
	            }
	          } catch (error) {
	            let imageManualRecoveryMessage = `图片请求已中断，可能已在中转站完成；可在任务清单手动拉回结果`,
	              markImageTaskNeedsManualRecovery = (errorMessage = imageManualRecoveryMessage) => {
	                (updateGlobalTaskList &&
	                  updateGlobalTaskList((nodes2) =>
	                    nodes2.map((node) =>
	                      node.id === imageTaskId ?
	                      {
	                        ...node,
	                        status: `failed`,
	                        errorMsg: errorMessage,
	                        canManualRecover: true,
	                      } :
	                      node,
	                    ),
	                  ),
	                  setNodes((nodes2) =>
	                    nodes2.map((node) =>
	                      node.id === nodeId && node.data?.taskId === imageTaskId ?
	                      {
	                        ...node,
	                        data: {
	                          ...node.data,
	                          loading: false,
	                          errorMessage: errorMessage,
	                        },
	                      } :
	                      node,
	                    ),
	                  ),
	                  setEdges((edges2) =>
	                    edges2.map((edge) => (edge.target === nodeId ? {
	                      ...edge,
	                      animated: false
	                    } : edge)),
	                  ),
	                  showToast(errorMessage));
	              };
	            if (error.name === `AbortError`) {
	              if (globalThis.__wanjuanManualRecoveredImageTaskIds?.has(imageTaskId)) {
	                (globalThis.__wanjuanManualRecoveredImageTaskIds.delete(imageTaskId),
	                  abortControllersRef.current.delete(nodeId));
	                return;
	              }
	              abortControllersRef.current.has(nodeId) ?
	                (abortControllersRef.current.delete(nodeId),
	                  console.log(`Fetch aborted`),
	                  updateGlobalTaskList &&
                  updateGlobalTaskList((nodes2) =>
                    nodes2.map((node) =>
                      node.id === imageTaskId ?
                      {
                        ...node,
                        status: `failed`,
                        errorMsg: `已取消`,
                        stoppedByUser: true,
                      } :
                      node,
                    ),
                  ),
                  showToast(`生成已取消`),
                  setNodes((nodes2) =>
                    nodes2.map((node) =>
	                      node.id === nodeId && node.data?.taskId === imageTaskId ?
                      {
                        ...node,
                        data: {
                          ...node.data,
                          loading: false,
                          errorMessage: `已取消`,
                        },
                      } :
                      node,
                    ),
                  ),
                  setEdges((edges2) =>
	                    edges2.map((edge) => (edge.target === nodeId ? {
	                      ...edge,
	                      animated: false
	                    } : edge)),
	                  )) :
	                (console.log(`Fetch aborted by user`),
	                  markImageTaskNeedsManualRecovery());
	              return;
	            }
	            if (WanJuanIsTransientNetworkError(error)) {
	              (console.error(error),
	                markImageTaskNeedsManualRecovery(`图片状态查询遇到临时网络错误，可能仍在中转站生成；可稍后在任务清单手动刷新拉回结果`));
	              return;
	            }
	            (updateGlobalTaskList &&
	              updateGlobalTaskList((nodes2) =>
                nodes2.map((node) =>
                  node.id === imageTaskId ?
                  {
                    ...node,
                    status: `failed`,
                    errorMsg: error.message
                  } :
                  node,
                ),
              ),
              console.error(error),
              showToast(`生成失败: ${error.message}`),
              setNodes((nodes2) =>
                nodes2.map((node) =>
	                  node.id === nodeId && node.data?.taskId === imageTaskId ?
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
              ),
              setEdges((edges2) =>
                edges2.map((edge) => (edge.target === nodeId ? {
                  ...edge,
                  animated: false
                } : edge)),
              ));
          }
        },
        [propImageApiKey, propImageApiUrl, drawingModel, apiConfigs, imageModelApiBindings, imageModelProtocolBindings, planLimits, showToast, getNodes, getEdges, setNodes, addGeneratedAsset, membership, updateTaskList, modelProtocolRegistry, propTextApiUrl, propTextApiKey, textModel],
  );
  return { generateImage };
}
