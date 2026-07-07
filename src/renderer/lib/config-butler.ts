/**
 * 配置管家（Config Butler）纯函数域：模型分类/协议推断、OpenAPI/curl 解析、
 * 协议配置规范化与校验、模型清单抽取与过滤、错误诊断签名与本地规则诊断等。
 * 全部为纯数据变换（不依赖 React state），自 WanJuanAppRoot 组件体抽出，行为不变。
 */
import { buildApiUrl } from "./model-binding";
import { GlobalTask, ProtocolConfig } from "./types";

export const normalizeButlerBaseUrl = (value) =>
    String(value || ``)
    .replace(/\s+/g, ``)
    .replace(/\/$/, ``);

export const normalizeButlerModelName = (modelName) =>
    String(modelName || ``).trim();

export const getButlerModelFamilyKey = (modelName) => {
      let name = normalizeButlerModelName(modelName).toLowerCase();
      return name
        .replace(/(?:^|[-_])(?:preview|latest|exp|experimental|beta|alpha|fast|turbo|lite|pro|max|mini|all|hd|4k|8k|thinking|flash)(?:[-_]|$)/g, `-`)
        .replace(/[-_]*\d{4}[-_]\d{2}[-_]\d{2}$/g, ``)
        .replace(/[-_]*\d{6,8}$/g, ``)
        .replace(/[-_]*v?\d+(?:\.\d+){0,2}.*$/g, ``)
        .replace(/[-_]+/g, `-`)
        .replace(/^-|-$/g, ``) ||
        name;
    };

export const getButlerModelGenerationRank = (modelName) => {
      let name = normalizeButlerModelName(modelName).toLowerCase(),
        dateMatch = name.match(/(?:^|[-_])(\d{4})[-_]?(\d{2})[-_]?(\d{2})(?:$|[-_])/);
      if (dateMatch) return Number(`${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`);
      let versionMatches = [...name.matchAll(/(?:^|[-_])v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:$|[-_])/g)];
      if (versionMatches.length) {
        let version = versionMatches[versionMatches.length - 1];
        return Number(version[1] || 0) * 1e6 + Number(version[2] || 0) * 1e3 + Number(version[3] || 0);
      }
      return 0;
    };

export const filterButlerLatestTwoGenerations = (models) => {
      let inputModels = (Array.isArray(models) ? models : [])
          .map(normalizeButlerModelName)
          .filter(Boolean),
        groups = new Map();
      inputModels.forEach((modelName) => {
        let familyKey = getButlerModelFamilyKey(modelName),
          rank = getButlerModelGenerationRank(modelName);
        if (!groups.has(familyKey)) groups.set(familyKey, new Map());
        let rankKey = String(rank || 0);
        groups.get(familyKey).has(rankKey) || groups.get(familyKey).set(rankKey, []);
        groups.get(familyKey).get(rankKey).push(modelName);
      });
      let allowed = new Set();
      groups.forEach((rankMap) => {
        [...rankMap.entries()]
          .sort((first, second) => Number(second[0]) - Number(first[0]))
          .slice(0, 2)
          .forEach(([, names]) => names.forEach((name) => allowed.add(name)));
      });
      return inputModels.filter((modelName) => allowed.has(modelName));
    };

export const normalizeModelCategory = (type) => {
      let normalizedType = String(type || ``)
        .trim()
        .toLowerCase();
	      return [`text`, `文本`, `textmodel`, `llm`].includes(normalizedType) ?
	        `text` :
	      [`image`, `img`, `图片`, `图像`, `绘画`].includes(normalizedType) ?
	        `image` :
	      [`video`, `视频`].includes(normalizedType) ?
	        `video` :
	      [`audio`, `asr`, `tts`, `speech`, `voice`, `听音`, `听音断句`, `转写`, `transcription`, `语音`, `朗读`, `音频`].includes(
	          normalizedType,
	        ) ?
	        `audio` :
		      [`music`, `suno`, `tts-music`, `tts_music`, `音乐`, `歌曲`, `歌词`, `tts/音乐`].includes(normalizedType) ?
		        `music` :
		        ``;
		    };

export const configButlerCategoryOptions = [{
        value: `text`,
        label: `文本模型`
      },
	      {
	        value: `image`,
	        label: `图片模型`
	      },
	      {
	        value: `video`,
	        label: `视频模型`
	      },
	      {
	        value: `audio`,
	        label: `音频模型`
	      },
	      {
	        value: `music`,
        label: `音乐模型`
      },
    ];

export const buildXSeeVeoReferenceVideoProtocol = () => ({
      category: `video`,
      requestType: `multipart-video`,
      submitPath: `/v1/videos`,
      pollPath: `/v1/videos/{taskId}`,
      requiresReferenceImage: true,
      omitDuration: true,
      fieldMapping: {
        model: `model`,
        prompt: `prompt`,
        resolution: `size`,
        aspectRatio: ``,
        duration: ``,
        referenceImage: `input_reference`,
        referenceVideo: `input_video`,
      },
      fieldValueTypes: {
        model: `string`,
        prompt: `string`,
        size: `string`,
      },
      parameterAdapter: {
        resolutionValueMode: `dimension`,
        aspectRatioValueMode: `omit`,
        sizeValueMode: `dimension`,
      },
      responseMapping: {
        video: [
          `video_url`,
          `videoUrl`,
          `data.video_url`,
          `data.videoUrl`,
          `data.0.url`,
          `output.video_url`,
          `output.0`,
          `result.video_url`,
          `url`,
        ],
      },
      validationNotes: [`已按 X-See Veo 帧转/参考视频模型规则启用 input_reference 并要求参考图`],
      __wanjuanButlerValidated: true,
    });

export const butlerCloneObject = (source) =>
    source && typeof source == `object` && !Array.isArray(source) ? {
      ...source
    } : {};

export const butlerUniquePaths = (...inputs) => {
      let uniqueValues = [];
      return (
        inputs.flat().forEach((value) => {
          let trimmed = String(value || ``).trim();
          trimmed && !uniqueValues.includes(trimmed) && uniqueValues.push(trimmed);
        }),
        uniqueValues
      );
    };

export const butlerNormalizeTaskPath = (value) =>
    typeof value == `string` ?
    value.replace(/\{(?:task_id|video_id|id|generation_id|job_id)\}/gi, `{taskId}`) :
    value;

export const normalizeProtocolConfig = (model, category) => {
      let normalizedModel = model && typeof model == `object` ? {
        ...model
      } : {};
      normalizedModel.category = normalizeModelCategory(category || normalizedModel.category) || category || normalizedModel.category;
      let requestType = String(normalizedModel.requestType || ``)
          .trim()
          .toLowerCase()
          .replace(/_/g, `-`),
        requestTypeAliases = {
          "openai-image-generations": `openai-images`,
          "openai-images-generations": `openai-images`,
          "openai-image-generation": `openai-images`,
          "image-generations": `openai-images`,
          "images-generations": `openai-images`,
          "image-generation": `openai-images`,
          "openai-audio-transcriptions": `openai-audio-transcription`,
          "openai-transcription": `openai-audio-transcription`,
          "audio-transcription": `openai-audio-transcription`,
          "audio-speech": `openai-audio-speech`,
          "tts": `openai-audio-speech`,
          "speech": `openai-audio-speech`,
          "gemini": `gemini-generate-content`,
          "gemini-image": `gemini-generate-content`,
          "gemini-text": `gemini-generate-content`,
          "openai-chat-completions": `openai-chat`,
	          "chat-completions": `openai-chat`,
	          "chat-completion": `openai-chat`,
	          "chat": `openai-chat`,
	          "claude": `claude-messages`,
	          "anthropic": `claude-messages`,
	          "anthropic-messages": `claude-messages`,
	          "claude-messages-api": `claude-messages`,
	          "openai-response": `openai-responses`,
          "openai-responses-api": `openai-responses`,
          "responses-api": `openai-responses`,
          "responses": `openai-responses`,
          "sora": `openai-video`,
          "videos": `openai-video`,
          "video-generation": `openai-video`,
          "video-generations": `openai-video`,
          "openai-video-generations": `openai-video`,
          "multipart": `multipart-video`,
          "multipart-form": `multipart-video`,
          "form-video": `multipart-video`,
          "multipart-videos": `multipart-video`,
        } [requestType];
      return (
        normalizedModel.valueTypes &&
        !normalizedModel.fieldValueTypes &&
        typeof normalizedModel.valueTypes == `object` &&
        (normalizedModel.fieldValueTypes = {
          ...normalizedModel.valueTypes
        }),
        normalizedModel.fieldTypes &&
        !normalizedModel.fieldValueTypes &&
        typeof normalizedModel.fieldTypes == `object` &&
        (normalizedModel.fieldValueTypes = {
          ...normalizedModel.fieldTypes
        }),
        requestTypeAliases && (normalizedModel.requestType = requestTypeAliases),
        normalizedModel.responsePaths &&
        !normalizedModel.responseMapping &&
        (normalizedModel.responseMapping = {
          [normalizedModel.category === `video` ? `video` : normalizedModel.category === `image` ? `image` : `text`]: normalizedModel.responsePaths,
        }),
        normalizedModel.outputPath &&
        !normalizedModel.responseMapping &&
        (normalizedModel.responseMapping = {
          [normalizedModel.category === `video` ? `video` : normalizedModel.category === `image` ? `image` : `text`]: normalizedModel.outputPath,
        }),
        [`pollPath`, `contentPath`, `statusPath`, `resultPath`].forEach((pathKey) => {
          normalizedModel[pathKey] = butlerNormalizeTaskPath(normalizedModel[pathKey]);
        }),
        normalizedModel.requestType || (normalizedModel.requestType = `custom`),
        normalizedModel
      );
    };

export const finalizeButlerProtocolConfig = (model, modelInfo: any = {}) => {
      let normalizedModel = model && typeof model == `object` ? {
          ...model
        } : {},
        modelName = String(modelInfo.modelName || ``).trim().toLowerCase(),
        apiUrl = String(modelInfo.apiUrl || ``).trim().toLowerCase(),
        category = normalizeModelCategory(modelInfo.category || normalizedModel.category) || normalizedModel.category || ``,
        validationNotes = [];
      return (
        (normalizedModel.category = category || normalizedModel.category),
        (normalizedModel.fieldMapping = butlerCloneObject(normalizedModel.fieldMapping)),
        (normalizedModel.fieldValueTypes = butlerCloneObject(normalizedModel.fieldValueTypes)),
        (normalizedModel.responseMapping = butlerCloneObject(normalizedModel.responseMapping)),
        (normalizedModel.extraBody = butlerCloneObject(normalizedModel.extraBody)),
        (normalizedModel.parameterAdapter = butlerCloneObject(normalizedModel.parameterAdapter)),
        [`pollPath`, `contentPath`, `statusPath`, `resultPath`].forEach((pathKey) => {
          normalizedModel[pathKey] = butlerNormalizeTaskPath(normalizedModel[pathKey]);
        }),
        category === `text` &&
        (((/gemini|generativelanguage|googleapis/.test(modelName) &&
              (/generativelanguage|googleapis|google\.com/.test(apiUrl) ||
                String(normalizedModel.requestType || ``).trim() === `gemini-generate-content`)) ||
            /generativelanguage|googleapis|google\.com/.test(apiUrl)) &&
          (normalizedModel.requestType = `gemini-generate-content`),
          normalizedModel.requestType === `custom` && (normalizedModel.requestType = `openai-chat`),
          String(normalizedModel.requestType || ``).trim() === `openai-chat` &&
          ((normalizedModel.submitPath = normalizedModel.submitPath || `/v1/chat/completions`),
            (normalizedModel.fieldMapping = {
              model: `model`,
              messages: `messages`,
              prompt: `prompt`,
              input: `input`,
              temperature: `temperature`,
              responseFormat: `response_format`,
              ...normalizedModel.fieldMapping,
            }),
            (normalizedModel.responseMapping = {
              ...normalizedModel.responseMapping,
              text: butlerUniquePaths(normalizedModel.responseMapping.text, [
                `choices.0.message.content`,
                `choices[0].message.content`,
                `output_text`,
                `text`,
              ]),
            })),
          String(normalizedModel.requestType || ``).trim() === `openai-responses` &&
          ((normalizedModel.submitPath = normalizedModel.submitPath || `/v1/responses`),
            (normalizedModel.fieldMapping = {
              model: `model`,
              input: `input`,
              messages: `messages`,
              prompt: `prompt`,
              temperature: `temperature`,
              responseFormat: `response_format`,
              ...normalizedModel.fieldMapping,
            }),
            (normalizedModel.responseMapping = {
              ...normalizedModel.responseMapping,
              text: butlerUniquePaths(normalizedModel.responseMapping.text, [
                `output_text`,
                `text`,
                `choices.0.message.content`,
              ]),
            }))),
        category === `image` &&
        String(normalizedModel.requestType || ``).trim() === `openai-images` &&
        ((normalizedModel.submitPath = normalizedModel.submitPath || `/v1/images/generations`),
          (normalizedModel.editPath = normalizedModel.editPath || `/v1/images/edits`),
          (normalizedModel.fieldMapping = {
            model: `model`,
            prompt: `prompt`,
            count: `n`,
            size: `size`,
            aspectRatio: `aspect_ratio`,
            responseFormat: `response_format`,
            referenceImage: `image`,
            ...normalizedModel.fieldMapping,
          }),
          (normalizedModel.fieldValueTypes = {
            n: `number`,
            size: `string`,
            ...normalizedModel.fieldValueTypes,
          }),
          (normalizedModel.parameterAdapter = {
            sizeValueMode: /seedream|grok-imagine|gemini.*image/.test(modelName) ? `preset` : `dimension`,
            aspectRatioValueMode: /seedream|grok-imagine|gemini.*image/.test(modelName) ? `ratio` : `omit`,
            ...(normalizedModel.parameterAdapter || {}),
          }),
          (normalizedModel.responseMapping = {
            ...normalizedModel.responseMapping,
            image: butlerUniquePaths(normalizedModel.responseMapping.image, [
              `data.0.url`,
              `data.0.b64_json`,
              `data.0.download_url`,
              `data.0.image_url`,
              `url`,
              `image_url`,
              `output.0`,
            ]),
          })),
        category === `video` &&
        (String(normalizedModel.requestType || ``).trim() === `openai-video` ||
          String(normalizedModel.requestType || ``).trim() === `multipart-video`) &&
        ((/sora|openai/.test(modelName) ||
            /api\.openai\.com|\/v1\/videos/i.test(apiUrl) ||
            /\/v1\/videos/i.test(String(normalizedModel.submitPath || normalizedModel.pollPath || ``))) &&
          ((normalizedModel.submitPath = `/v1/videos`),
            (normalizedModel.pollPath = `/v1/videos/{taskId}`),
            normalizedModel.contentPath === undefined && (normalizedModel.contentPath = `/v1/videos/{taskId}/content`),
            validationNotes.push(`已按 OpenAI/Sora 视频接口修正 submitPath、pollPath、contentPath`)),
          normalizedModel.requestType === `openai-video` &&
          !normalizedModel.submitPath &&
          !/(^|\.)lconai\.com|\/\/[nsv]\.lconai\.com/i.test(apiUrl) &&
          (normalizedModel.submitPath = `/v1/videos`),
          normalizedModel.pollPath || (normalizedModel.pollPath = `/v1/videos/{taskId}`),
          (normalizedModel.fieldMapping = {
            model: `model`,
            prompt: `prompt`,
            resolution: `size`,
            aspectRatio: ``,
            duration: `seconds`,
            referenceImage: normalizedModel.requestType === `openai-video` ? `input_reference` : `input_reference`,
            referenceVideo: `input_video`,
            ...normalizedModel.fieldMapping,
          }),
          (normalizedModel.fieldValueTypes = {
            size: `string`,
            seconds: `string`,
            duration: `string`,
            ...normalizedModel.fieldValueTypes,
          }),
          (normalizedModel.parameterAdapter = {
            resolutionValueMode: `dimension`,
            aspectRatioValueMode: `omit`,
            ...(normalizedModel.parameterAdapter || {}),
          }),
          (normalizedModel.responseMapping = {
            ...normalizedModel.responseMapping,
            video: butlerUniquePaths(normalizedModel.responseMapping.video, [
              `video_url`,
              `videoUrl`,
              `data.video_url`,
              `data.videoUrl`,
              `data.0.url`,
              `output.video_url`,
              `output.0`,
              `result.video_url`,
              `url`,
            ]),
          })),
        category === `video` &&
        (String(normalizedModel.requestType || ``).trim() === `json-video`) &&
        ((normalizedModel.submitPath = normalizedModel.submitPath || `/v1/video/create`),
          (normalizedModel.pollPath = normalizedModel.pollPath || `/v1/video/query?id={taskId}`),
          (normalizedModel.fieldMapping = {
            model: `model`,
            prompt: `prompt`,
            resolution: `resolution`,
            aspectRatio: `aspect_ratio`,
            duration: `duration`,
            referenceImage: `image`,
            referenceVideo: `video`,
            ...normalizedModel.fieldMapping,
          }),
          (normalizedModel.parameterAdapter = {
            resolutionValueMode: `quality`,
            aspectRatioValueMode: `ratio`,
            ...(normalizedModel.parameterAdapter || {}),
          }),
          (normalizedModel.responseMapping = {
            ...normalizedModel.responseMapping,
            video: butlerUniquePaths(normalizedModel.responseMapping.video, [
              `video_url`,
              `data.video_url`,
              `output.video_url`,
              `result.video_url`,
              `url`,
            ]),
          })),
        category === `video` &&
        (String(normalizedModel.requestType || ``).trim() === `openai-video` || String(normalizedModel.requestType || ``).trim() === `json-video`) &&
        (/^wan/i.test(modelName) || /aigc\.x-see\.cn|x-see\.cn/.test(apiUrl)) &&
        (normalizedModel.fieldValueTypes = {
          ...normalizedModel.fieldValueTypes,
          seconds: `string`,
          duration: `string`,
        }),
        category === `video` &&
        /^veo/i.test(modelName) &&
        /aigc\.x-see\.cn|x-see\.cn/i.test(apiUrl) &&
        /(?:^|[-_])(portrait|landscape|fl|frame|reverse|gif|hd|4k|pro)(?:[-_]|$)/i.test(modelName) &&
        ((normalizedModel.requestType = `multipart-video`),
	            (normalizedModel.submitPath = `/v1/videos`),
	            (normalizedModel.pollPath = `/v1/videos/{taskId}`),
	            delete normalizedModel.contentPath,
	            delete normalizedModel.referenceImageMode,
	            delete normalizedModel.referenceImageAsArray,
	            delete normalizedModel.referenceImageItemShape,
	            (normalizedModel.requiresReferenceImage = true),
          (normalizedModel.omitDuration = true),
          (normalizedModel.fieldMapping = {
            ...normalizedModel.fieldMapping,
            prompt: `prompt`,
            resolution: `size`,
            duration: ``,
            referenceImage: `input_reference`,
            aspectRatio: ``,
          }),
          (normalizedModel.fieldValueTypes = {
            ...normalizedModel.fieldValueTypes,
            size: `string`,
          }),
          (normalizedModel.parameterAdapter = {
            resolutionValueMode: `dimension`,
            aspectRatioValueMode: `omit`,
            ...(normalizedModel.parameterAdapter || {}),
          }),
          validationNotes.push(`已按 X-See Veo 帧转/参考视频模型规则启用 input_reference 并要求参考图`)),
        category === `video` &&
        /^veo/i.test(modelName) &&
        /(^|\.)lconai\.com|\/\/[nsv]\.lconai\.com/i.test(apiUrl) &&
        ((normalizedModel.requestType = `multipart-video`),
          (normalizedModel.submitPath = `/v1/videos`),
          (normalizedModel.pollPath = `/v1/videos/{taskId}`),
          delete normalizedModel.contentPath,
          (normalizedModel.fieldMapping = {
            ...normalizedModel.fieldMapping,
            prompt: `prompt`,
            resolution: `size`,
            duration: `seconds`,
            referenceImage: `input_reference`,
            aspectRatio: ``,
          }),
          (normalizedModel.fieldValueTypes = {
            ...normalizedModel.fieldValueTypes,
            size: `string`,
            seconds: `number`,
          })),
        category === `image` &&
        /^doubao-seedream/i.test(modelName) &&
        /(^|\.)lconai\.com|\/\/[nsv]\.lconai\.com/i.test(apiUrl) &&
        ((normalizedModel.requestType = `openai-images`),
          (normalizedModel.submitPath = `/v1/images/generations`),
          (normalizedModel.editPath = `/v1/images/edits`),
          (normalizedModel.useAspectRatioAsSize = true),
          (normalizedModel.fieldMapping = {
            model: `model`,
            prompt: `prompt`,
            count: `n`,
            size: `size`,
            aspectRatio: `size`,
            referenceImage: `image`,
            ...normalizedModel.fieldMapping,
          }),
          (normalizedModel.fieldValueTypes = {
            ...normalizedModel.fieldValueTypes,
            n: `number`,
            size: `string`,
            watermark: `boolean`,
          }),
          (normalizedModel.parameterAdapter = {
            sizeValueMode: `aspect-ratio`,
            aspectRatioValueMode: `omit`,
            ...(normalizedModel.parameterAdapter || {}),
          }),
          (normalizedModel.extraBody = {
            n: 1,
            type: `normal`,
            watermark: false,
            ...normalizedModel.extraBody,
          }),
          (normalizedModel.responseMapping = {
            ...normalizedModel.responseMapping,
            image: butlerUniquePaths(normalizedModel.responseMapping.image, [
              `data.0.url`,
              `data.0.b64_json`,
              `data.0.download_url`,
            ]),
          })),
        validationNotes.length > 0 &&
        (normalizedModel.validationNotes = butlerUniquePaths(normalizedModel.validationNotes, validationNotes)),
        (normalizedModel.__wanjuanButlerValidated = true),
        normalizedModel
      );
    };

export const configButlerToolsExposed = (() => {
      try {
        typeof window < `u` &&
          ((window as any).__wanjuanConfigButlerTools = {
            normalizeProtocolConfig,
            finalizeButlerProtocolConfig,
            normalizeModelCategory,
          });
      } catch {}
      return true;
    })();

export const coerceProtocolFieldValue = (fieldName, model, value) => {
      let fieldKey = String(fieldName || ``).trim(),
        valueType =
        model?.fieldValueTypes &&
        typeof model.fieldValueTypes == `object` &&
        model.fieldValueTypes[fieldKey] ?
        String(model.fieldValueTypes[fieldKey]).trim().toLowerCase() :
        ``;
      return valueType === `string` ?
        String(value ?? ``) :
        valueType === `number` ?
        Number(value) :
        value;
    };

export const getProtocolCategoryLabel = (category: string) =>
    category === `text` ?
    `文本` :
    category === `image` ?
    `图片` :
    category === `video` ?
    `视频` :
	      category === `audio` ?
	      `音频` :
	      category === `music` ?
	      `音乐` :
	      category === `tts-music` ?
	      `音乐` :
	      `自定义`;

export const inferProtocolDisplayName = (model) => {
      let requestType = String(model?.requestType || ``).trim(),
        labelMap = {
	          "gemini-generate-content": `Gemini 原生`,
	          "openai-chat": `OpenAI Chat 原生`,
	          "claude-messages": `Claude Messages 原生`,
	          "openai-responses": `OpenAI Responses 原生`,
          "openai-images": `OpenAI 图片原生`,
          "gpt-image-2-async": `OpenAI 图片异步兼容`,
          "vectorengine-image-generation": `向量引擎图片原生`,
          "ark-image-generation": `Ark 图片原生`,
          "openai-video": `OpenAI 视频兼容`,
          "multipart-video": `表单视频兼容`,
          "json-video": `JSON 视频原生`,
	          "seedance-json": `Seedance 视频原生`,
	          "openai-audio-transcription": `OpenAI 音频转写原生`,
	          "openai-audio-speech": `OpenAI TTS 原生`,
	          "suno-music": `Suno 音乐生成`,
	        } [requestType];
      return (
        labelMap ||
        `${getProtocolCategoryLabel(model?.category)}协议 ${requestType || `custom`}`.trim()
      );
    };

export const normalizeProtocolName = (protocolName: string, model: any) => {
      let requestType = String(model?.requestType || ``).trim(),
        category = String(model?.category || ``).trim(),
        labelMap = {
	          "openai-chat": `OpenAI Chat 原生`,
	          "claude-messages": `Claude Messages 原生`,
	          "openai-responses": `OpenAI Responses 原生`,
          "openai-images": `OpenAI 图片原生`,
          "gpt-image-2-async": `OpenAI 图片异步兼容`,
          "vectorengine-image-generation": `Ark 图片原生`,
          "ark-image-generation": `Ark 图片原生`,
          "openai-video": `OpenAI 视频兼容`,
          "multipart-video": `表单视频兼容`,
	          "json-video": `MiniMax 视频原生`,
	          "seedance-json": `Seedance 视频原生`,
	          "openai-audio-transcription": `OpenAI 音频转写原生`,
	          "openai-audio-speech": `OpenAI TTS 原生`,
	          "suno-music": `Suno 音乐生成`,
	        } [requestType];
      return requestType === `gemini-generate-content` ?
        category === `image` ?
        `Gemini 图片原生` :
        `Gemini 文本原生` :
        labelMap || String(protocolName || ``).trim() || `自定义协议`;
    };

export const parseButlerLooseJson = (rawText) => {
        let text = String(rawText || ``).trim();
        if (!text) return null;
        let extractedJson = (() => {
          let startIndex = text.search(/\{\s*"(?:openapi|swagger)"/i);
          if (startIndex < 0) return ``;
          let braceDepth = 0,
            inString = false,
            escaped = false;
          for (let index = startIndex; index < text.length; index++) {
            let char = text[index];
            if (inString) {
              escaped ? (escaped = false) : char === `\\` ? (escaped = true) : char === `"` && (inString = false);
              continue;
            }
            if (char === `"`) {
              inString = true;
              continue;
            }
            if (char === `{`) braceDepth += 1;
            else if (char === `}` && ((braceDepth -= 1), braceDepth === 0)) return text.slice(startIndex, index + 1);
          }
          return ``;
        })();
        let candidates = [
          text,
          extractedJson,
          (text.match(/```(?:json|openapi|swagger)?\s*([\s\S]*?)```/i) || [])[1],
          (text.match(/(\{\s*"(?:openapi|swagger)"[\s\S]*\})/) || [])[1],
        ].filter(Boolean);
        for (let candidate of candidates)
          try {
            let parsed = JSON.parse(candidate);
            if (parsed && typeof parsed == `object`) return parsed;
          } catch {}
        return null;
      };

export const extractButlerJsonKeys = (rawText) => {
        let text = String(rawText || ``).trim();
        if (!text) return [];
        try {
          let parsed = JSON.parse(text),
            collectKeys = (value) =>
            value && typeof value == `object` && !Array.isArray(value) ?
            Object.keys(value).slice(0, 40) :
            [];
          return collectKeys(parsed);
        } catch {}
        return [...text.matchAll(/"([^"]+)"\s*:/g)]
          .map((match) => match[1])
          .filter(Boolean)
          .slice(0, 40);
      };

export const extractButlerCurlExamples = (rawText) => {
        let text = String(rawText || ``),
          examples: any[] = [],
          curlPattern = /curl(?:\s|\\\n|\\\r\n)[\s\S]{0,2500}?(?=\n\s*(?:curl|GET|POST|PUT|PATCH|DELETE)\s|$)/gi,
          normalizeWhitespace = (text2) => String(text2 || ``).replace(/\\\r?\n/g, ` `).replace(/\s+/g, ` `).trim(),
          extractMethod = (curl) => {
            let match = curl.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
            if (match) return match[1].toUpperCase();
            return /(?:-d|--data|--data-raw|--data-binary)\s/i.test(curl) ? `POST` : `GET`;
          },
          extractUrl = (curl) => {
            let match = curl.match(/https?:\/\/[^\s'"`]+/i) || curl.match(/['"]((?:\/v\d+|\/api)[^'"]+)['"]/i);
            return match ? String(match[1] || match[0]).replace(/[\\,;]+$/g, ``) : ``;
          },
          extractBodyKeys = (curl) => {
            let match = curl.match(/(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1/i);
            return match ? extractButlerJsonKeys(match[2]) : [];
          };
        for (let match of text.matchAll(curlPattern)) {
          let command = normalizeWhitespace(match[0]),
            url = extractUrl(command);
          url &&
            examples.push({
              method: extractMethod(command),
              url: url,
              path: url.replace(/^https?:\/\/[^/]+/i, ``),
              bodyKeys: extractBodyKeys(command),
              hasAuthorization: /authorization\s*:/i.test(command),
            });
          if (examples.length >= 12) break;
        }
        return examples;
      };

export const extractButlerOpenApiSummary = (docText) => {
        let spec = parseButlerLooseJson(docText),
          endpoints: any[] = [],
          collectedRequests = [],
          collectedResponses = [];
        if (spec?.paths && typeof spec.paths == `object`) {
          Object.entries(spec.paths).forEach(([path, pathItem]) => {
            pathItem &&
              typeof pathItem == `object` &&
              Object.entries(pathItem).forEach(([method, operation]) => {
                if (!/^(get|post|put|patch|delete)$/i.test(method)) return;
                let content = operation?.requestBody?.content || {},
                  schema: any = (Object.values(content)[0] as any)?.schema || {},
                  properties =
                  schema?.properties ||
                  schema?.items?.properties ||
                  (Object.values((schema?.allOf || {}) as any)?.[0] as any)?.properties ||
                  {},
                  requestKeys = Object.keys(properties || {}).slice(0, 40),
                  responses = operation?.responses || {},
                  responseKeys = Object.keys(responses).slice(0, 8);
                endpoints.push({
                  method: method.toUpperCase(),
                  path: path,
                  operationId: operation?.operationId || ``,
                  requestKeys: requestKeys,
                  responseCodes: responseKeys,
                });
              });
          });
          spec.components?.securitySchemes &&
            (collectedRequests = Object.keys(spec.components.securitySchemes).slice(0, 12));
        }
        if (!endpoints.length) {
          let text = String(docText || ``),
            endpointRegex = /(?:^|\n)\s*(GET|POST|PUT|PATCH|DELETE)\s+((?:https?:\/\/[^\s'"`]+)|\/[A-Za-z0-9_./:{}?=&%[\]-]+)/gi;
          for (let match of text.matchAll(endpointRegex)) {
            let path = String(match[2] || ``).replace(/^https?:\/\/[^/]+/i, ``);
            path &&
              endpoints.push({
                method: String(match[1]).toUpperCase(),
                path: path,
                operationId: ``,
                requestKeys: [],
                responseCodes: [],
              });
            if (endpoints.length >= 30) break;
          }
        }
        collectedResponses = [...new Set(endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`))].slice(0, 30);
        return {
          format: spec?.openapi ? `openapi-${spec.openapi}` : spec?.swagger ? `swagger-${spec.swagger}` : endpoints.length ? `text-endpoints` : `plain-text`,
          endpoints: endpoints.slice(0, 30),
          endpointLines: collectedResponses,
          securitySchemes: collectedRequests,
        };
      };

export const inferButlerProtocolFromTools = (summary, modelInfo: any = {}) => {
        let category = normalizeModelCategory(modelInfo.category) || inferButlerCategoryFromModelName(modelInfo.modelName),
          text = `${(summary?.endpointLines || []).join(`\n`)}\n${(summary?.curlExamples || [])
            .map((example) => `${example.method} ${example.path || example.url} ${(example.bodyKeys || []).join(`,`)}`)
            .join(`\n`)}`.toLowerCase();
        return category === `text` ?
          /\/responses\b/.test(text) ?
          `openai-responses` :
          /generatecontent|gemini/.test(text) ?
          `gemini-generate-content` :
          `openai-chat` :
          category === `image` ?
          /\/images\/edits|\/images\/generations|b64_json|response_format/.test(text) ?
          `openai-images` :
          `openai-images` :
          category === `video` ?
          /\/v1\/videos\b/.test(text) ?
          `openai-video` :
          /multipart|form-data|input_reference/.test(text) ?
          `multipart-video` :
          /query\/video|video\/query|task_id/.test(text) ?
          `json-video` :
          `openai-video` :
          category === `audio` ?
          `openai-audio-transcription` :
          category === `music` ?
          `suno-music` :
          category === `tts-music` ?
          `openai-audio-speech` :
          `custom`;
      };

export const buildConfigButlerToolContext = (docText, sourceUrl, modelInfo: any = {}) => {
        let openApiSummary = extractButlerOpenApiSummary(docText),
          curlExamples = extractButlerCurlExamples(docText),
          result = {
            sourceUrl: String(sourceUrl || ``).trim(),
            target: {
              modelName: modelInfo.modelName || ``,
              category: normalizeModelCategory(modelInfo.category) || modelInfo.category || ``,
              apiUrl: modelInfo.apiUrl || ``,
            },
            openApi: openApiSummary,
            curlExamples: curlExamples,
          };
        return (
          ((result as any).inferredRequestType = inferButlerProtocolFromTools({
            ...openApiSummary,
            curlExamples: curlExamples,
          }, result.target)),
          result
        );
      };

export const formatConfigButlerToolContext = (toolResult) => {
        if (!toolResult) return `未提取到结构化工具结果`;
        let endpointLines = toolResult.openApi?.endpointLines || [],
          curlExamples = toolResult.curlExamples || [];
        return [
          `工具层来源：OpenAPI/Swagger 解析、curl 示例解析、协议 Schema 校验、Mock dry-run 规则`,
          `文档格式判断：${toolResult.openApi?.format || `unknown`}`,
          `工具推断 requestType：${toolResult.inferredRequestType || `custom`}`,
          `认证方案：${(toolResult.openApi?.securitySchemes || []).join(`, `) || `未识别`}`,
          `候选端点：`,
          ...(endpointLines.length ? endpointLines.slice(0, 18).map((line) => `- ${line}`) : [`- 未提取到明确端点`]),
          `curl 请求样例：`,
          ...(curlExamples.length ?
            curlExamples.slice(0, 6).map((example) => `- ${example.method} ${example.path || example.url} bodyKeys=${(example.bodyKeys || []).join(`,`) || `无`}`) : [`- 未提取到 curl 示例`]),
        ].join(`
`);
      };

export const getButlerDocFieldsForPath = (toolResult, path) => {
        let normalizedPath = String(path || ``).replace(/^https?:\/\/[^/]+/i, ``).replace(/\/+$/g, ``),
          keys = new Set(),
          normalizePath = (path2) => String(path2 || ``).replace(/^https?:\/\/[^/]+/i, ``).replace(/\/+$/g, ``);
        return (
          (toolResult?.openApi?.endpoints || []).forEach((endpoint) => {
            normalizePath(endpoint.path) === normalizedPath && (endpoint.requestKeys || []).forEach((key) => keys.add(String(key || ``).trim()));
          }),
          (toolResult?.curlExamples || []).forEach((example) => {
            normalizePath(example.path || example.url) === normalizedPath && (example.bodyKeys || []).forEach((key) => keys.add(String(key || ``).trim()));
          }),
          [...keys].filter(Boolean)
        );
      };

export const applyButlerLearnedProtocolRules = (baseConfig, modelInfo: any = {}) => {
        let config = baseConfig && typeof baseConfig == `object` ? {
            ...baseConfig,
            fieldMapping: {
              ...(baseConfig.fieldMapping || {})
            },
            fieldValueTypes: {
              ...(baseConfig.fieldValueTypes || {})
            },
            parameterAdapter: {
              ...(baseConfig.parameterAdapter || {})
            },
          } : {},
          category = normalizeModelCategory(modelInfo.category || config.category) || ``,
          modelName = String(modelInfo.modelName || ``).trim().toLowerCase(),
          toolContext = modelInfo.toolContext || null,
          endpointText = (toolContext?.openApi?.endpointLines || []).join(`
`),
          curlText = (toolContext?.curlExamples || []).map((example) => `${example.method} ${example.path || example.url}`).join(`
`),
          combinedText = `${endpointText}
${curlText}`,
          notes: any[] = [],
          protocolName = ``,
          hasGenerationsPath = /\/v1\/video\/generations\b/i.test(combinedText),
          hasVideosPath = /\/v1\/videos\b/i.test(combinedText);
        if (category === `video` && /^veo/i.test(modelName) && hasGenerationsPath && hasVideosPath) {
          let hasVariantSuffix = /-(portrait|landscape|pro|gif|hd|4k|reverse|sora)\b/i.test(modelName),
            submitPath = hasVariantSuffix ? `/v1/videos` : `/v1/video/generations`;
          ((config.requestType = `multipart-video`),
            (config.submitPath = submitPath),
            (config.pollPath = `${submitPath}/{taskId}`),
            delete config.contentPath,
            (config.fieldMapping = {
              ...config.fieldMapping,
              model: config.fieldMapping.model || `model`,
              prompt: config.fieldMapping.prompt || `prompt`,
              resolution: `size`,
              aspectRatio: ``,
              duration: ``,
              referenceImage: config.fieldMapping.referenceImage || `input_reference`,
            }),
            (config.fieldValueTypes = {
              ...config.fieldValueTypes,
              size: `string`,
            }),
            (config.parameterAdapter = {
              resolutionValueMode: `dimension`,
              aspectRatioValueMode: `omit`,
              ...config.parameterAdapter,
            }),
            (config.omitDuration = true),
            (protocolName = hasVariantSuffix ? `X-See Veo 逆向` : `X-See Veo 普通`),
            notes.push(`已按文档多视频端点规则拆分 Veo 协议：${submitPath}，并省略固定时长字段`));
        }
        if (category === `video` && /^veo/i.test(modelName) && /aigc\.x-see\.cn|x-see\.cn/i.test(String(modelInfo.apiUrl || ``)) && /(?:^|[-_])(portrait|landscape|fl|frame|reverse|gif|hd|4k|pro)(?:[-_]|$)/i.test(modelName)) {
          ((config.requestType = `multipart-video`),
            (config.submitPath = `/v1/videos`),
            (config.pollPath = `/v1/videos/{taskId}`),
            delete config.contentPath,
            (config.requiresReferenceImage = true),
            (config.omitDuration = true),
            (config.fieldMapping = {
              ...config.fieldMapping,
              model: config.fieldMapping.model || `model`,
              prompt: config.fieldMapping.prompt || `prompt`,
              resolution: `size`,
              aspectRatio: ``,
              duration: ``,
              referenceImage: `input_reference`,
            }),
            (config.fieldValueTypes = {
              ...config.fieldValueTypes,
              size: `string`,
            }),
            (config.parameterAdapter = {
              resolutionValueMode: `dimension`,
              aspectRatioValueMode: `omit`,
              ...config.parameterAdapter,
            }),
            (protocolName = `X-See Veo 帧转视频`),
            notes.push(`已按 X-See Veo 帧转/参考视频模型规则启用 input_reference，并要求画布提供参考图`));
        }
        if (category === `video`) {
          let docFields = getButlerDocFieldsForPath(toolContext, config.submitPath),
            fieldSet = new Set(docFields.map((field: any) => field.toLowerCase())),
            hasField = (field) => fieldSet.has(String(field || ``).toLowerCase());
          if (docFields.length) {
            let durationField = String(config.fieldMapping?.duration || ``).trim();
            durationField && !hasField(durationField) && ((config.fieldMapping.duration = ``), (config.omitDuration = true), notes.push(`文档请求体未声明 ${durationField}，已省略时长字段`));
            let resolutionField = String(config.fieldMapping?.resolution || ``).trim();
            resolutionField &&
              !hasField(resolutionField) &&
              (hasField(`size`) ?
                ((config.fieldMapping.resolution = `size`), notes.push(`分辨率字段已按文档修正为 size`)) :
                hasField(`resolution`) ?
                ((config.fieldMapping.resolution = `resolution`), notes.push(`分辨率字段已按文档修正为 resolution`)) :
                ((config.fieldMapping.resolution = ``), notes.push(`文档请求体未声明 ${resolutionField}，已省略分辨率字段`)));
            let aspectRatioField = String(config.fieldMapping?.aspectRatio || ``).trim();
            aspectRatioField && !hasField(aspectRatioField) && ((config.fieldMapping.aspectRatio = ``), notes.push(`文档请求体未声明 ${aspectRatioField}，已省略比例字段`));
          }
        }
        return {
          config: config,
          protocolName: protocolName,
          notes: notes,
        };
      };

export const validateButlerProtocolConfig = (baseConfig, modelInfo: any = {}) => {
        let config = baseConfig && typeof baseConfig == `object` ? baseConfig : {},
          category = normalizeModelCategory(modelInfo.category || config.category) || ``,
          requestType = String(config.requestType || ``).trim(),
          issues: any[] = [],
          warnings = [],
          trimValue = (value) => String(value || ``).trim();
        (category || issues.push(`缺少 category`),
          requestType || issues.push(`缺少 requestType`),
          [`pollPath`, `contentPath`, `statusPath`, `resultPath`].forEach((key) => {
            trimValue(config[key]) && !/\{taskId\}/.test(trimValue(config[key])) && warnings.push(`${key} 应使用 {taskId} 占位符`);
          }),
          category === `text` &&
	          ![`openai-chat`, `openai-responses`, `gemini-generate-content`, `claude-messages`].includes(requestType) &&
          warnings.push(`文本模型 requestType 不是常用可执行协议`),
          category === `image` &&
          requestType === `openai-images` &&
          (!trimValue(config.submitPath) || !config.fieldMapping?.prompt) &&
          issues.push(`图片协议缺少 submitPath 或 prompt 字段映射`),
          category === `video` &&
          (!trimValue(config.submitPath) || !trimValue(config.pollPath)) &&
          issues.push(`视频协议缺少 submitPath 或 pollPath`),
          category === `video` &&
          /\/v1\/videos\b/.test(`${config.submitPath || ``} ${config.pollPath || ``}`) &&
          /\/v1\/video\/generations\b/.test(`${config.submitPath || ``} ${config.pollPath || ``}`) &&
          warnings.push(`检测到多个视频任务路径，请按文档示例和模型名拆分协议，不要把 /v1/videos 与 /v1/video/generations 合并成同一条链路`));
        return {
          ok: issues.length === 0,
          errors: issues,
          warnings: warnings,
        };
      };

export const dryRunButlerProtocolConfig = (baseConfig, modelInfo: any = {}) => {
        let config = baseConfig && typeof baseConfig == `object` ? baseConfig : {},
          category = normalizeModelCategory(modelInfo.category || config.category) || ``,
          fieldMapping = config.fieldMapping && typeof config.fieldMapping == `object` ? config.fieldMapping : {},
          buildField = (fieldName, value) => {
            let key = String(fieldName || ``).trim();
            return key && value !== `` && value !== undefined && value !== null ? {
              [key]: value
            } : {};
          },
          parameterAdapter = config.parameterAdapter && typeof config.parameterAdapter == `object` ? config.parameterAdapter : {},
          mapValue = (value, valueMap) => {
            let key = String(value || ``).trim(),
              valueMap2 = valueMap && typeof valueMap == `object` ? valueMap : {};
            return Object.prototype.hasOwnProperty.call(valueMap2, key) ? valueMap2[key] : key;
          },
          applyCase = (value, caseMode) => {
            let value2 = String(value || ``);
            return caseMode === `lower` ? value2.toLowerCase() : caseMode === `upper` ? value2.toUpperCase() : value2;
          },
		          resolveImageDimensions = (aspectRatio, sizeValue = `1K`, resolution = ``) => {
		            let sizeMode = String(config.sizeValueMode || parameterAdapter.sizeValueMode || ``).trim().toLowerCase(),
		              aspectRatioMode = String(config.aspectRatioValueMode || parameterAdapter.aspectRatioValueMode || ``).trim().toLowerCase(),
	              dimensionMap = {
	                "1:1": `1024x1024`,
                "16:9": `1280x720`,
                "9:16": `720x1280`,
	                "4:3": `1280x960`,
	                "3:4": `960x1280`,
		              },
		              mappedSize = mapValue(sizeValue, config.sizeValueMap || parameterAdapter.sizeValueMap),
		              mappedAspectRatio = mapValue(aspectRatio, config.aspectRatioValueMap || parameterAdapter.aspectRatioValueMap),
		              resolutionInput = String(resolution || sizeValue || ``).trim(),
		              resolvedDimensions = /^\d{2,5}x\d{2,5}$/i.test(resolutionInput) ? resolutionInput.toLowerCase() : dimensionMap[aspectRatio] || `1024x1024`;
	            return {
	              size: sizeMode === `preset` || sizeMode === `quality` || sizeMode === `quality-preset` ?
	                applyCase(mappedSize, config.sizeValueCase || parameterAdapter.sizeValueCase) :
	                sizeMode === `aspect-ratio` || sizeMode === `ratio` ?
	                applyCase(mappedAspectRatio, config.aspectRatioValueCase || parameterAdapter.aspectRatioValueCase) :
	                sizeMode === `none` || sizeMode === `omit` ?
	                `` :
	                resolvedDimensions,
	              aspectRatio: aspectRatioMode === `none` || aspectRatioMode === `omit` ?
	                `` :
	                aspectRatioMode === `dimension` || aspectRatioMode === `dimensions` || aspectRatioMode === `width-height` ?
	                resolvedDimensions :
	                aspectRatioMode === `preset` || aspectRatioMode === `quality` || aspectRatioMode === `quality-preset` ?
	                applyCase(mappedSize, config.sizeValueCase || parameterAdapter.sizeValueCase) :
	                applyCase(mappedAspectRatio, config.aspectRatioValueCase || parameterAdapter.aspectRatioValueCase),
            };
          },
          resolveVideoDimensions = (resolution, aspectRatio) => {
            let resolutionMode = String(config.resolutionValueMode || parameterAdapter.resolutionValueMode || ``).trim().toLowerCase(),
              aspectRatioMode = String(config.aspectRatioValueMode || parameterAdapter.aspectRatioValueMode || ``).trim().toLowerCase(),
              mappedResolution = mapValue(`720P`, config.resolutionValueMap || parameterAdapter.resolutionValueMap),
              mappedAspectRatio = mapValue(aspectRatio, config.aspectRatioValueMap || parameterAdapter.aspectRatioValueMap);
            return {
              resolution: resolutionMode === `quality` || resolutionMode === `quality-preset` || resolutionMode === `preset` ?
                applyCase(mappedResolution, config.resolutionValueCase || parameterAdapter.resolutionValueCase) :
                resolutionMode === `aspect-ratio` || resolutionMode === `ratio` ?
                applyCase(mappedAspectRatio, config.aspectRatioValueCase || parameterAdapter.aspectRatioValueCase) :
                resolutionMode === `aspect-ratio-x` || resolutionMode === `ratio-x` ?
                String(aspectRatio || ``).replace(`:`, `x`) :
                resolutionMode === `none` || resolutionMode === `omit` ?
                `` :
                resolution,
              aspectRatio: aspectRatioMode === `none` || aspectRatioMode === `omit` ?
                `` :
                aspectRatioMode === `dimension` || aspectRatioMode === `dimensions` ?
                resolution :
                aspectRatioMode === `quality` || aspectRatioMode === `quality-preset` || aspectRatioMode === `preset` ?
                `720P` :
                aspectRatioMode === `aspect-ratio-x` || aspectRatioMode === `ratio-x` ?
                String(aspectRatio || ``).replace(`:`, `x`) :
                applyCase(mappedAspectRatio, config.aspectRatioValueCase || parameterAdapter.aspectRatioValueCase),
            };
          },
          result = {};
        return (
          category === `text` ?
          (result =
            config.requestType === `openai-responses` ?
            {
              ...buildField(fieldMapping.model || `model`, modelInfo.modelName || `model`),
              ...buildField(fieldMapping.input || `input`, [{
                role: `user`,
                content: `ping`,
              }, ]),
            } :
            {
              ...buildField(fieldMapping.model || `model`, modelInfo.modelName || `model`),
              ...buildField(fieldMapping.messages || `messages`, [{
                role: `user`,
                content: `ping`,
              }, ]),
            }) :
	          category === `image` ?
	          ((parameterAdapter = resolveImageDimensions(`9:16`, `1K`, modelInfo.imageResolution || `2560x1440`)),
            (result = {
              ...buildField(fieldMapping.model || `model`, modelInfo.modelName || `model`),
              ...buildField(fieldMapping.prompt || `prompt`, `test image`),
              ...buildField(fieldMapping.count || `n`, 1),
              ...buildField(fieldMapping.size || `size`, parameterAdapter.size),
              ...buildField(fieldMapping.aspectRatio || ``, parameterAdapter.aspectRatio),
            })) :
          category === `video` &&
          ((parameterAdapter = resolveVideoDimensions(`720x1280`, `9:16`)),
            (result = {
              ...buildField(fieldMapping.model || `model`, modelInfo.modelName || `model`),
              ...buildField(fieldMapping.prompt || `prompt`, `test video`),
              ...(config.omitDuration === true || fieldMapping.duration === `` ?
                {} :
                buildField(fieldMapping.duration || `seconds`, config.fieldValueTypes?.[fieldMapping.duration || `seconds`] === `number` ? 5 : `5`)),
              ...buildField(fieldMapping.resolution || `size`, parameterAdapter.resolution),
              ...buildField(fieldMapping.aspectRatio || ``, parameterAdapter.aspectRatio),
            })),
          {
            method: `POST`,
            submitPath: config.submitPath || ``,
            pollPath: config.pollPath || ``,
            contentPath: config.contentPath || ``,
            requestBody: result,
          }
        );
      };

export const probeButlerProtocol = async (config, modelInfo: any = {}, apiUrl = ``, apiKey = ``) => {
        let category = normalizeModelCategory(modelInfo.category || config?.category) || ``;
        if (category !== `text` && category !== `image`) {
          return { probed: false, skipped: true, reason: `异步或非同步类模型跳过真实探活` };
        }
        let base = normalizeButlerBaseUrl(apiUrl);
        if (!base || !apiKey) return { probed: false, skipped: true, reason: `缺少请求地址或令牌` };
        let dry = dryRunButlerProtocolConfig(config, modelInfo),
          submitPath = String(dry.submitPath || (category === `image` ? `/v1/images/generations` : `/v1/chat/completions`)).trim(),
          requestUrl = buildApiUrl(base, submitPath),
          requestBody = dry.requestBody && typeof dry.requestBody == `object` ? dry.requestBody : {},
          headers = { "Content-Type": `application/json`, Authorization: `Bearer ${apiKey}` };
        // 图像探活强制不带 response_format(它正是常见的不兼容参数;探活只为验证端点+核心字段可用)。
        if (category === `image`) { delete (requestBody as any).response_format; delete (requestBody as any).responseFormat; }
        try {
          let controller = new AbortController(),
            timeoutId = window.setTimeout(() => controller.abort(), 45000),
            response;
          try {
            response = await fetch(requestUrl, { method: `POST`, headers, body: JSON.stringify(requestBody), signal: controller.signal });
          } finally { window.clearTimeout(timeoutId); }
          let rawText = await response.text().catch(() => ``),
            payload = (() => { try { return JSON.parse(rawText); } catch { return null; } })(),
            errMsg = String(payload?.error?.message || payload?.message || ``).trim(),
            // 识别错误类别，给出可操作的修复建议。
            unknownParam = errMsg.match(/unknown parameter[:\s]*'?([a-zA-Z_]+)'?/i),
            isPathErr = response.status === 404 || /not found|无效的?\s*(url|路径|endpoint)|invalid url/i.test(errMsg),
            isAuthErr = response.status === 401 || response.status === 403 || /无效的?令牌|invalid (api )?key|unauthorized|令牌/i.test(errMsg),
            requestSucceeded = response.ok && !errMsg;
          return {
            probed: true,
            requestSucceeded,
            status: response.status,
            submitPath,
            errorMessage: errMsg.slice(0, 200),
            errorType: requestSucceeded ? `none` : unknownParam ? `unknown_parameter` : isPathErr ? `path` : isAuthErr ? `auth` : errMsg ? `upstream` : `unknown`,
            unknownParameter: unknownParam ? unknownParam[1] : ``,
            suggestion: requestSucceeded ? `` :
              unknownParam ? `该模型不接受参数 ${unknownParam[1]}，应在协议 fieldMapping 里把它设为空字符串以跳过。` :
              isPathErr ? `提交路径 ${submitPath} 可能不正确，请核对文档接口路径。` :
              isAuthErr ? `令牌或鉴权方式可能不被该接口接受。` :
              errMsg ? `上游返回错误：${errMsg.slice(0, 80)}` : `请求未成功(${response.status})`,
          };
        } catch (error) {
          return { probed: true, ok: false, errorType: `network`, errorMessage: String(error?.message || error).slice(0, 150), suggestion: `网络异常或超时，未能完成探活(不代表协议错误)。` };
        }
      };

export const validateAndRepairConfigButlerResult = (baseModel, options: any = {}) => {
        let model = baseModel && typeof baseModel == `object` ? {
            ...baseModel
          } : {},
	          modelName = String(model.modelName || options.modelName || ``).trim(),
	          category = normalizeModelCategory(options.category || model.category) || inferButlerCategoryFromModelName(modelName),
	          apiUrl = normalizeButlerBaseUrl(options.apiUrl || model.apiConfig?.url || ``),
	          protocol = model.protocol && typeof model.protocol == `object` ? {
	            ...model.protocol
	          } : buildButlerFallbackProtocol(modelName, {
	            category: category,
	            apiUrl: apiUrl,
	            apiConfigName: model.apiConfig?.name || options.apiConfigName || ``,
	          }),
	          protocolConfig = normalizeProtocolConfig(protocol.config, category),
	          providerPackage = matchWanJuanProviderProtocolPackage({
	            modelName: modelName,
	            category: category,
	            apiUrl: apiUrl,
	            apiConfigName: model.apiConfig?.name || options.apiConfigName || ``,
	          });
	        providerPackage &&
	          (!model.protocol?.config ||
	            protocolConfig.requestType === `custom` ||
	            (providerPackage.config?.requestType &&
	              providerPackage.config.requestType !== protocolConfig.requestType &&
	              (/generativelanguage|googleapis|google\.com|aiplatform\.googleapis|ark\.cn-beijing\.volces\.com|volces\.com|\/api\/v3\b/i.test(apiUrl) ||
	                providerPackage.providerPackageId === `suno` ||
	                (providerPackage.providerPackageId === `bytedance` && /seedance|seedream|doubao/i.test(modelName))))) &&
	          ((protocol = {
	              name: providerPackage.name,
	              config: providerPackage.config,
	              providerPackageId: providerPackage.providerPackageId,
	              providerPackageLabel: providerPackage.providerPackageLabel,
	              providerPackageNote: providerPackage.providerPackageNote,
	            }),
	            (protocolConfig = normalizeProtocolConfig(protocol.config, category)));
	        (!protocolConfig.requestType || protocolConfig.requestType === `custom`) &&
	          options.toolContext?.inferredRequestType &&
	          options.toolContext.inferredRequestType !== `custom` &&
	          (protocolConfig.requestType = options.toolContext.inferredRequestType);
        let finalConfig = finalizeButlerProtocolConfig(protocolConfig, {
            modelName: modelName,
            apiUrl: apiUrl,
            category: category,
          }),
          learnedResult = applyButlerLearnedProtocolRules(finalConfig, {
            modelName: modelName,
            apiUrl: apiUrl,
            category: category,
            toolContext: options.toolContext || null,
          });
        finalConfig = learnedResult.config;
        let
          validationResult = validateButlerProtocolConfig(finalConfig, {
            modelName: modelName,
            apiUrl: apiUrl,
            category: category,
          }),
          dryRunResult = dryRunButlerProtocolConfig(finalConfig, {
            modelName: modelName,
            apiUrl: apiUrl,
            category: category,
          }),
	          notes = [
	            model.notes,
	            protocol.providerPackageLabel ?
	            `供应商规则：${protocol.providerPackageLabel}；${protocol.providerPackageNote || `已套用本地协议包`}` :
	            ``,
	            options.toolContext?.inferredRequestType ?
	            `工具层推断 requestType=${options.toolContext.inferredRequestType}` :
	            ``,
            learnedResult.notes?.length ? `学习规则修复：${learnedResult.notes.join(`；`)}` : ``,
            validationResult.warnings.length ? `校验警告：${validationResult.warnings.join(`；`)}` : ``,
            validationResult.errors.length ? `校验错误：${validationResult.errors.join(`；`)}` : ``,
          ].filter(Boolean).join(`
`);
        return {
          ...model,
          modelName: modelName,
          category: category,
          apiConfig: {
            ...(model.apiConfig || {}),
          },
          protocol: {
            ...protocol,
            name: learnedResult.protocolName || normalizeProtocolName(protocol.name, finalConfig),
            config: finalConfig,
          },
          notes: notes,
          validation: validationResult,
          dryRun: dryRunResult,
        };
      };

export const configButlerAdvancedToolsExposed = (() => {
        try {
          typeof window < `u` &&
            ((window as any).__wanjuanConfigButlerTools = {
              ...((window as any).__wanjuanConfigButlerTools || {}),
              normalizeProtocolConfig,
              finalizeButlerProtocolConfig,
              normalizeModelCategory,
              extractButlerCurlExamples,
              extractButlerOpenApiSummary,
              buildConfigButlerToolContext,
              formatConfigButlerToolContext,
	              getButlerDocFieldsForPath,
	              applyButlerLearnedProtocolRules,
	              validateButlerProtocolConfig,
              dryRunButlerProtocolConfig,
              validateAndRepairConfigButlerResult,
            });
        } catch {}
        return true;
      })();

export const getButlerModelNameFromItem = (value) => {
	          if (typeof value == `string`) return value.trim();
	          if (!value || typeof value != `object`) return ``;
	          return String(value.id || value.name || value.model || value.modelName || value.slug || ``).trim();
	        };

export const extractButlerModelsFromPayload = (payload) => {
	          let results = [],
	            seen = new Set(),
	            collect = (value) => {
	              if (!value) return;
	              if (Array.isArray(value)) {
	                value.forEach(collect);
	                return;
	              }
	              if (typeof value == `string`) {
	                let trimmed = value.trim();
	                trimmed && !seen.has(trimmed) && (seen.add(trimmed), results.push(trimmed));
	                return;
	              }
	              if (typeof value == `object`) {
	                let modelName = getButlerModelNameFromItem(value);
	                modelName && !seen.has(modelName) && (seen.add(modelName), results.push(modelName));
	                [`data`, `models`, `items`, `result`, `list`].forEach((key) => {
	                  Array.isArray(value[key]) && collect(value[key]);
	                });
	              }
	            };
	          return collect(payload), results;
	        };

export const inferButlerCategoryFromModelName = (modelName: string) => {
	          let normalized = String(modelName || ``).toLowerCase();
	          return /suno|music|song|lyrics|concat|stems/.test(normalized) ?
	            `music` :
	            /tts|speech|voice|audio[-_]?speech|cosyvoice|fish|elevenlabs/.test(normalized) ?
	            `audio` :
	            /whisper|asr|transcrib|audio[-_]?trans|paraformer|sensevoice/.test(normalized) ?
	            `audio` :
	            /video|sora|seedance|kling|veo|wan\d|t2v|i2v|r2v|vidu|hailuo|runway|pika|luma/.test(normalized) ?
	            `video` :
		            /image|img|gpt-image|dall|seedream|flux|sdxl|stable|midjourney|mj|kolors|dream|paint/.test(normalized) ?
		            `image` :
		            `text`;
		        };

export const wanjuanButlerBuildProviderProtocol = (provider, options: any = {}) => {
		          let category = normalizeModelCategory(options.category) || inferButlerCategoryFromModelName(options.modelName),
		            apiUrl = String(options.apiUrl || ``).trim().toLowerCase(),
		            modelName = String(options.modelName || ``).trim().toLowerCase(),
		            isOpenAI = /api\.openai\.com|platform\.openai\.com/.test(apiUrl),
		            isGoogle = /generativelanguage|googleapis|google\.com|aiplatform\.googleapis/.test(apiUrl),
		            isVolces = /ark\.cn-beijing\.volces\.com|volces\.com|\/api\/v3\b/.test(apiUrl),
		            deepClone = (source) => JSON.parse(JSON.stringify(source || {})),
		            protocolPresets = {
		              "openai-chat": {
		                name: `OpenAI Chat 原生`,
		                config: {
		                  category: `text`,
		                  requestType: `openai-chat`,
		                  submitPath: isVolces ? `/chat/completions` : `/v1/chat/completions`,
		                  fieldMapping: {
		                    model: `model`,
		                    messages: `messages`,
		                    prompt: `prompt`,
		                    temperature: `temperature`,
		                    responseFormat: `response_format`,
		                  },
		                  responseMapping: {
		                    text: [`choices.0.message.content`, `choices[0].message.content`, `output_text`, `text`],
		                  },
		                },
		              },
		              "openai-responses": {
		                name: `OpenAI Responses 原生`,
		                config: {
		                  category: `text`,
		                  requestType: `openai-responses`,
		                  submitPath: `/v1/responses`,
		                  fieldMapping: {
		                    model: `model`,
		                    input: `input`,
		                    messages: `messages`,
		                    prompt: `prompt`,
		                    temperature: `temperature`,
		                    responseFormat: `response_format`,
		                  },
		                  responseMapping: {
		                    text: [`output_text`, `text`, `choices.0.message.content`],
		                  },
		                },
		              },
		              "gemini": {
		                name: category === `image` ? `Gemini 图片原生` : `Gemini 文本原生`,
		                config: {
		                  category: category === `image` ? `image` : `text`,
		                  requestType: `gemini-generate-content`,
		                },
		              },
		              "openai-images": {
		                name: `OpenAI 图片原生`,
		                config: {
		                  category: `image`,
		                  requestType: `openai-images`,
		                  submitPath: `/v1/images/generations`,
		                  editPath: `/v1/images/edits`,
		                  fieldMapping: {
		                    model: `model`,
		                    prompt: `prompt`,
		                    count: `n`,
		                    size: /seedream|imagen|grok-imagine/.test(modelName) ? `size` : `size`,
		                    aspectRatio: /seedream|imagen|grok-imagine/.test(modelName) ? `aspect_ratio` : ``,
		                    responseFormat: `response_format`,
		                    referenceImage: `image`,
		                  },
		                  fieldValueTypes: {
		                    n: `number`,
		                    size: `string`,
		                  },
		                  parameterAdapter: {
		                    sizeValueMode: /seedream|imagen|grok-imagine/.test(modelName) ? `preset` : `dimension`,
		                    aspectRatioValueMode: /seedream|imagen|grok-imagine/.test(modelName) ? `ratio` : `omit`,
		                  },
		                  responseMapping: {
		                    image: [`data.0.url`, `data.0.b64_json`, `data.0.download_url`, `data.0.image_url`, `url`, `image_url`],
		                  },
		                },
		              },
		              "ark-image": {
		                name: `Ark 图片原生`,
		                config: {
		                  category: `image`,
		                  requestType: `ark-image-generation`,
		                  submitPath: isVolces ? `/images/generations` : `/api/v3/images/generations`,
		                  fieldMapping: {
		                    model: `model`,
		                    prompt: `prompt`,
		                    count: `n`,
		                    size: `size`,
		                    aspectRatio: `size`,
		                    referenceImage: `image`,
		                  },
		                  fieldValueTypes: {
		                    n: `number`,
		                    size: `string`,
		                  },
		                  parameterAdapter: {
		                    sizeValueMode: `aspect-ratio`,
		                    aspectRatioValueMode: `omit`,
		                  },
		                  responseMapping: {
		                    image: [`data.0.url`, `data.0.b64_json`, `data.0.download_url`, `url`],
		                  },
		                },
		              },
		              "openai-video": {
		                name: `OpenAI 视频兼容`,
		                config: {
		                  category: `video`,
		                  requestType: `openai-video`,
		                  submitPath: `/v1/videos`,
		                  pollPath: `/v1/videos/{taskId}`,
		                  contentPath: `/v1/videos/{taskId}/content`,
		                  fieldMapping: {
		                    model: `model`,
		                    prompt: `prompt`,
		                    resolution: `size`,
		                    aspectRatio: ``,
		                    duration: `seconds`,
		                    referenceImage: `input_reference`,
		                    referenceVideo: `input_video`,
		                  },
		                  fieldValueTypes: {
		                    seconds: `string`,
		                    size: `string`,
		                  },
		                  parameterAdapter: {
		                    resolutionValueMode: `dimension`,
		                    aspectRatioValueMode: `omit`,
		                  },
		                  responseMapping: {
		                    video: [`video_url`, `videoUrl`, `data.video_url`, `data.0.url`, `output.video_url`, `result.video_url`, `url`],
		                    taskId: [`id`, `data.id`, `task_id`, `taskId`],
		                    status: [`status`, `data.status`, `state`],
		                  },
		                },
		              },
		              "json-video": {
		                name: /minimax|hailuo|abab|video-01/.test(modelName) ? `MiniMax 视频原生` : `JSON 视频原生`,
		                config: {
		                  category: `video`,
		                  requestType: `json-video`,
		                  submitPath: `/v1/video/create`,
		                  pollPath: `/v1/video/query?id={taskId}`,
		                  fieldMapping: {
		                    model: `model`,
		                    prompt: `prompt`,
		                    resolution: `resolution`,
		                    aspectRatio: `aspect_ratio`,
		                    duration: `duration`,
		                    referenceImage: `image`,
		                    referenceVideo: `video`,
		                  },
		                  fieldValueTypes: {
		                    duration: `string`,
		                  },
		                  parameterAdapter: {
		                    resolutionValueMode: `quality`,
		                    aspectRatioValueMode: `ratio`,
		                  },
		                  responseMapping: {
		                    video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
		                    taskId: [`task_id`, `taskId`, `id`, `data.task_id`, `data.id`],
		                    status: [`status`, `data.status`, `state`],
		                  },
		                },
		              },
		              "seedance": {
		                name: `Seedance 视频原生`,
		                config: {
		                  category: `video`,
		                  requestType: `seedance-json`,
		                  submitPath: `/contents/generations/tasks`,
		                  pollPath: `/contents/generations/tasks/{taskId}`,
		                  fieldMapping: {
		                    model: `model`,
		                    prompt: `prompt`,
		                    resolution: `resolution`,
		                    aspectRatio: `ratio`,
		                    duration: `duration`,
		                    referenceImage: `content`,
		                    referenceVideo: `content`,
		                  },
		                  fieldValueTypes: {
		                    duration: `string`,
		                  },
		                  parameterAdapter: {
		                    resolutionValueMode: `quality`,
		                    aspectRatioValueMode: `ratio`,
		                  },
		                  responseMapping: {
		                    video: [`items.0.content.video_url`, `data.items.0.content.video_url`, `content.video_url`, `video_url`],
		                    taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
		                    status: [`items.0.status`, `status`, `data.status`],
		                  },
		                },
		              },
		              "audio-transcription": {
		                name: `OpenAI 音频转写原生`,
		                config: {
		                  category: `audio`,
		                  requestType: `openai-audio-transcription`,
		                  submitPath: `/v1/audio/transcriptions`,
		                  fieldMapping: {
		                    model: `model`,
		                    file: `file`,
		                  },
		                  responseMapping: {
		                    text: [`text`, `data.text`],
		                  },
		                },
		              },
		              "audio-speech": {
		                name: `OpenAI TTS 原生`,
		                config: {
		                  category: `audio`,
		                  requestType: `openai-audio-speech`,
		                  submitPath: `/v1/audio/speech`,
		                  fieldMapping: {
		                    model: `model`,
		                    input: `input`,
		                    voice: `voice`,
		                    format: `response_format`,
		                  },
		                  responseMapping: {
		                    audio: [`url`, `data.0.url`, `audio_url`],
		                  },
		                },
		              },
		              "suno": {
		                name: `Suno 音乐生成`,
		                config: {
		                  category: `music`,
		                  requestType: `suno-music`,
		                  submitPath: `/suno/submit/music`,
		                  pollPath: `/suno/fetch/{taskId}`,
		                  fieldMapping: {
		                    model: `model`,
		                    prompt: `prompt`,
		                    title: `title`,
		                  },
		                  responseMapping: {
		                    audio: [`data.0.audio_url`, `data.0.audioUrl`, `audio_url`, `url`],
		                    taskId: [`id`, `task_id`, `data.id`],
		                  },
		                },
		              },
		            },
		            clonePreset = (presetKey) => deepClone(protocolPresets[presetKey]);
		          if (provider === `openai`)
		            return category === `image` ?
		              clonePreset(`openai-images`) :
		              category === `video` ?
		              clonePreset(`openai-video`) :
		              category === `audio` ?
		              clonePreset(`audio-transcription`) :
		              category === `music` ?
		              clonePreset(`suno`) :
		              category === `tts-music` ?
		              clonePreset(`audio-speech`) :
		              clonePreset(isOpenAI ? `openai-responses` : `openai-chat`);
		          if (provider === `google`)
		            return isGoogle && (category === `text` || category === `image`) ?
		              clonePreset(`gemini`) :
		              category === `video` ?
		              clonePreset(`openai-video`) :
		              category === `image` ?
		              clonePreset(`openai-images`) :
		              clonePreset(`openai-chat`);
		          if (provider === `bytedance`)
		            return category === `image` ?
		              clonePreset(isVolces ? `ark-image` : `openai-images`) :
		              category === `video` ?
		              clonePreset(/seedance|doubao-seedance|即梦|jimeng/i.test(modelName) && isVolces ? `seedance` : `openai-video`) :
		              clonePreset(`openai-chat`);
		          if (provider === `minimax`)
		            return category === `video` ?
		              clonePreset(`json-video`) :
		              category === `music` ?
		              clonePreset(`suno`) :
		              category === `tts-music` ?
		              clonePreset(`audio-speech`) :
		              clonePreset(`openai-chat`);
		          if (provider === `suno`) return clonePreset(`suno`);
	          if (provider === `audio`) return category === `music` ? clonePreset(`suno`) : category === `audio` ? clonePreset(`audio-transcription`) : clonePreset(`audio-speech`);
		          if (provider === `image`) return clonePreset(`openai-images`);
		          if (provider === `video`) return clonePreset(`openai-video`);
		          return clonePreset(`openai-chat`);
		        };

export const wanjuanButlerProviderProtocolPackages = [{
		          id: `openai`,
		          label: `OpenAI / Sora / DALL-E / Whisper`,
		          match: /(^|[\s/_-])(openai|chatgpt|gpt-|gpt_|o[1345](?:-|$)|sora|dall|whisper|tts-1|gpt-image)/i,
		          protocol: `openai`,
		          note: `已按 OpenAI 官方/兼容接口家族生成协议`,
		        }, {
		          id: `anthropic`,
		          label: `Anthropic Claude`,
		          match: /anthropic|claude/i,
		          protocol: `text-openai-compatible`,
		          note: `Claude 原生 Messages API 当前未接入节点运行时，已按中转站 OpenAI 兼容 Chat 链路生成`,
		        }, {
		          id: `google`,
		          label: `Google Gemini / Imagen / Veo`,
		          match: /google|gemini|imagen|veo(?:[-_\s]|$)|generativelanguage|googleapis/i,
		          protocol: `google`,
		          note: `Google 官方 Gemini 文本/图片走原生 generateContent；Veo 或中转站模型走画布已支持的兼容视频链路`,
		        }, {
		          id: `bytedance`,
		          label: `ByteDance / Volcengine Ark / Doubao / Seedream / Seedance / Jimeng`,
		          match: /bytedance|volc|volces|ark|doubao|seedream|seedance|jimeng|即梦|火山|字节/i,
		          protocol: `bytedance`,
		          note: `已按火山 Ark/豆包/即梦/Seedream/Seedance 家族生成可执行协议`,
		        }, {
		          id: `alibaba`,
		          label: `Alibaba Qwen / Tongyi Wanxiang`,
		          match: /alibaba|aliyun|dashscope|qwen|qwq|通义|wanxiang|wan\d|paraformer|cosyvoice/i,
		          protocol: `openai-compatible`,
		          note: `通义/Qwen 通过 OpenAI 兼容或现有音视频链路导入；DashScope 原生专有端点需后续运行时扩展`,
		        }, {
		          id: `zhipu`,
		          label: `Zhipu GLM / CogView / CogVideo`,
		          match: /zhipu|bigmodel|glm-|chatglm|cogview|cogvideo|智谱/i,
		          protocol: `openai-compatible`,
		          note: `智谱 GLM/Cog 系列按 OpenAI 兼容链路生成`,
		        }, {
		          id: `deepseek`,
		          label: `DeepSeek`,
		          match: /deepseek/i,
		          protocol: `openai-compatible`,
		          note: `DeepSeek 按 OpenAI 兼容 Chat 链路生成`,
		        }, {
		          id: `moonshot`,
		          label: `Moonshot Kimi`,
		          match: /moonshot|kimi/i,
		          protocol: `openai-compatible`,
		          note: `Kimi/Moonshot 按 OpenAI 兼容 Chat 链路生成`,
		        }, {
		          id: `minimax`,
		          label: `MiniMax / Hailuo / abab`,
		          match: /minimax|hailuo|海螺|abab|video-01/i,
		          protocol: `minimax`,
		          note: `MiniMax/Hailuo 文本按兼容 Chat，视频按画布 JSON 视频链路生成`,
		        }, {
		          id: `kling`,
		          label: `Kuaishou Kling / Kolors`,
		          match: /kling|kwaipilot|kolors|可灵|快手/i,
		          protocol: `openai-compatible`,
		          note: `可灵/Kolors 原生任务端点差异较大，当前按中转站 OpenAI/视频兼容链路生成`,
		        }, {
		          id: `xai`,
		          label: `xAI Grok`,
		          match: /xai|grok/i,
		          protocol: `openai-compatible`,
		          note: `Grok 文本/图像/视频按画布已支持的 OpenAI 兼容链路生成`,
		        }, {
		          id: `stability`,
		          label: `Stability / SDXL / Flux / Recraft`,
		          match: /stability|stable-diffusion|sdxl|flux|black-forest|recraft|ideogram|midjourney|mj-/i,
		          protocol: `image`,
		          note: `图片生成家族按 OpenAI 图片兼容链路生成；原生专有参数由 API 文档继续修正`,
		        }, {
		          id: `video`,
		          label: `Kling / Vidu / Runway / Pika / Luma / Veeo video`,
		          match: /kling|vidu|runway|pika|luma|video|t2v|i2v|r2v/i,
		          protocol: `video`,
		          note: `视频生成家族按画布兼容异步视频链路生成，再由文档字段规则修正路径和字段`,
		        }, {
		          id: `suno`,
		          label: `Suno`,
		          match: /suno|music|song|lyrics/i,
		          protocol: `suno`,
		          note: `Suno/音乐生成按画布音乐任务链路生成`,
		        }, {
		          id: `audio`,
		          label: `ElevenLabs / FishAudio / CosyVoice / Whisper`,
		          match: /elevenlabs|fish|cosyvoice|whisper|sensevoice|paraformer|asr|tts|voice|speech/i,
		          protocol: `audio`,
		          note: `语音/转写/TTS 家族按画布音频协议生成`,
		        }];

export const matchWanJuanProviderProtocolPackage = (model: any = {}) => {
		          let category = normalizeModelCategory(model.category) || inferButlerCategoryFromModelName(model.modelName),
		            searchText = `${model.modelName || ``}
${model.apiUrl || ``}
${model.apiConfigName || ``}`.toLowerCase();
		          for (let providerRule of wanjuanButlerProviderProtocolPackages) {
		            if (!providerRule.match.test(searchText)) continue;
		            let builtConfig =
		              providerRule.protocol === `text-openai-compatible` ?
		              wanjuanButlerBuildProviderProtocol(`openai`, {
		                ...model,
		                category: `text`,
		              }) :
		              providerRule.protocol === `openai-compatible` ?
		              wanjuanButlerBuildProviderProtocol(category === `image` ? `image` : category === `video` ? `video` : `openai`, {
		                ...model,
		                category: category,
		              }) :
		              wanjuanButlerBuildProviderProtocol(providerRule.protocol, {
		                ...model,
		                category: category,
		              });
		            return builtConfig ? {
		              ...builtConfig,
		              providerPackageId: providerRule.id,
		              providerPackageLabel: providerRule.label,
		              providerPackageNote: providerRule.note,
		            } : null;
			          }
			          return null;
			        };

export const wanjuanButlerProviderToolsExposed = (() => {
			          try {
			            typeof window < `u` &&
			              ((window as any).__wanjuanConfigButlerTools = {
			                ...((window as any).__wanjuanConfigButlerTools || {}),
			                matchWanJuanProviderProtocolPackage,
			                wanjuanButlerProviderProtocolPackages,
			                wanjuanButlerBuildProviderProtocol,
			              });
			          } catch {}
			          return true;
			        })();

export const buildButlerFallbackProtocol = (modelName: any, options: any = {}) => {
		          // 修复(A)：原压缩代码在箭头函数里误用 arguments 使第二参一直被忽略；现正常接收 options，让兜底协议用上调用方传的 category/apiUrl。
		            let providerPackage = matchWanJuanProviderProtocolPackage({
		              modelName: modelName,
		              category: options.category,
		              apiUrl: options.apiUrl,
		              apiConfigName: options.apiConfigName,
		            });
		          if (providerPackage) return {
		            name: providerPackage.name,
		            config: providerPackage.config,
		            providerPackageId: providerPackage.providerPackageId,
		            providerPackageLabel: providerPackage.providerPackageLabel,
		            providerPackageNote: providerPackage.providerPackageNote,
		          };
		          let category = inferButlerCategoryFromModelName(modelName);
	          return category === `image` ?
	            {
	              name: `OpenAI 图片原生`,
	              config: {
	                category: `image`,
	                requestType: `openai-images`,
	                submitPath: `/v1/images/generations`,
	                editPath: `/v1/images/edits`,
	                fieldMapping: {
	                  model: `model`,
	                  prompt: `prompt`,
	                  count: `n`,
	                  size: `size`,
	                  aspectRatio: `size`,
	                  referenceImage: `image`
	                },
	                fieldValueTypes: {
	                  n: `number`,
	                  size: `string`
	                },
	                responseMapping: {
	                  image: [`data.0.url`, `data.0.b64_json`, `data.0.download_url`]
	                }
	              }
	            } :
	            category === `video` ?
	            {
	              name: `OpenAI 视频兼容`,
	              config: {
	                category: `video`,
	                requestType: `openai-video`,
	                submitPath: `/v1/videos`,
	                pollPath: `/v1/videos/{taskId}`,
	                contentPath: `/v1/videos/{taskId}/content`,
	                fieldMapping: {
	                  model: `model`,
	                  prompt: `prompt`,
	                  resolution: `size`,
	                  aspectRatio: ``,
	                  duration: `seconds`,
	                  referenceImage: `input_reference`,
	                  referenceVideo: `input_video`
	                },
	                fieldValueTypes: {
	                  seconds: `string`,
	                  size: `string`
	                },
	                responseMapping: {
	                  video: [`data.0.url`, `data.0.video_url`, `output.video_url`, `url`],
	                  taskId: [`id`, `data.id`, `task_id`],
	                  status: [`status`, `data.status`]
	                }
	              }
	            } :
	            category === `audio` ?
	            {
	              name: `OpenAI 音频转写原生`,
	              config: {
	                category: `audio`,
	                requestType: `openai-audio-transcription`,
	                submitPath: `/v1/audio/transcriptions`,
	                fieldMapping: {
	                  model: `model`,
	                  file: `file`
	                },
	                responseMapping: {
	                  text: [`text`, `data.text`]
	                }
	              }
	            } :
	            category === `music` ?
	            {
	              name: `Suno 音乐生成`,
	              config: {
	                category: `music`,
	                requestType: `suno-music`,
	                submitPath: `/suno/submit/music`,
	                pollPath: `/suno/fetch/{taskId}`,
	                fieldMapping: {
	                  prompt: `prompt`,
	                  title: `title`
	                },
	                responseMapping: {
	                  audio: [`data.0.audio_url`, `data.0.audioUrl`, `audio_url`, `url`],
	                  taskId: [`id`, `task_id`, `data.id`, `data`]
	                }
	              }
	            } :
	            category === `tts-music` ?
	            {
	              name: `OpenAI TTS 原生`,
	              config: {
	                category: `audio`,
	                requestType: `openai-audio-speech`,
	                submitPath: `/v1/audio/speech`,
	                fieldMapping: {
	                  model: `model`,
	                  input: `input`,
	                  voice: `voice`,
	                  format: `response_format`
	                },
	                responseMapping: {
	                  audio: [`url`, `data.0.url`, `audio_url`]
	                }
	              }
	            } :
	            {
	              name: `OpenAI Chat 原生`,
	              config: {
	                category: `text`,
	                requestType: `openai-chat`,
	                submitPath: `/v1/chat/completions`,
	                fieldMapping: {
	                  model: `model`,
	                  messages: `messages`,
	                  temperature: `temperature`
	                },
	                responseMapping: {
	                  text: [`choices.0.message.content`, `output_text`, `text`]
	                }
	              }
	            };
	        };

export const scanButlerTargetModels = async (options: any = {}) => {
	          let apiConfig = options.apiConfig, // 原有 || getSelectedButlerTargetApiConfig() 兜底：两个调用点均已传 apiConfig，兜底为死代码，外移时移除
	            baseUrl = normalizeButlerBaseUrl(apiConfig?.url),
	            apiKey = String(apiConfig?.key || ``).trim();
	          if (!baseUrl || !apiKey) throw Error(`请先选择一个已填写 base URL 和 API Key 的统一 API 配置`);
	          let rootUrl = baseUrl.replace(/\/v1$/i, ``),
	            candidateUrls = [...new Set([`${rootUrl}/v1/models`, `${baseUrl}/v1/models`, `${baseUrl}/models`])],
	            errorMessages = [];
	          for (let url of candidateUrls)
	            try {
	              let response = await fetch(url, {
	                headers: {
	                  Authorization: `Bearer ${apiKey}`,
	                  "x-api-key": apiKey,
	                  "Content-Type": `application/json`
	                }
	              });
	              if (!response.ok) {
	                let errorMessage = `${response.status} ${response.statusText}`;
	                try {
	                  let bodyText = await response.text();
	                  bodyText && (errorMessage = `${errorMessage} ${bodyText.slice(0, 200)}`);
	                } catch {}
	                errorMessages.push(`${url}: ${errorMessage}`);
	                continue;
	              }
	              let payload = await response.json(),
	                models = extractButlerModelsFromPayload(payload).filter(Boolean);
	              if (models.length)
	                return options.filterLatestTwo === false ? models : filterButlerLatestTwoGenerations(models);
	              errorMessages.push(`${url}: 未返回模型列表`);
	            } catch (error) {
	              errorMessages.push(`${url}: ${error.message}`);
	            }
	          throw Error(`未能从目标统一 API 配置读取模型列表。${errorMessages.join(`；`)}`);
	        };

export const compareButlerModelSnapshots = (previousModels: any[] = [], nextModels = []) => {
	          let previousSet = new Set((Array.isArray(previousModels) ? previousModels : []).map(normalizeButlerModelName).filter(Boolean)),
	            nextSet = new Set((Array.isArray(nextModels) ? nextModels : []).map(normalizeButlerModelName).filter(Boolean));
	          return {
	            added: [...nextSet].filter((modelName) => !previousSet.has(modelName)),
	            removed: [...previousSet].filter((modelName) => !nextSet.has(modelName)),
	          };
	        };

export const normalizeButlerBatchItems = (payload, modelNames, options: any = {}) => {
	          let modelList = Array.isArray(payload?.models) ? payload.models : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
	            modelMap = new Map();
	          modelList.forEach((modelItem) => {
	            let modelName = String(modelItem?.modelName || modelItem?.name || modelItem?.id || modelItem?.model || ``).trim();
	            if (!modelName) return;
	            let category = normalizeModelCategory(modelItem?.category) || inferButlerCategoryFromModelName(modelName),
	              repairedConfig = validateAndRepairConfigButlerResult({
		                ...modelItem,
		                modelName: modelName,
		                category: category,
		                protocol: modelItem?.protocol || buildButlerFallbackProtocol(modelName, {
		                  category: category,
		                  apiUrl: options.apiUrl || modelItem?.apiConfig?.url || ``,
		                  apiConfigName: modelItem?.apiConfig?.name || ``,
		                }),
		              }, {
		                modelName: modelName,
		                category: category,
		                apiUrl: options.apiUrl || modelItem?.apiConfig?.url || ``,
	                toolContext: options.toolContext || null,
	              });
	            modelMap.set(modelName, {
	              id: `${modelName}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	              modelName: modelName,
	              category: category,
	              apiConfig: repairedConfig.apiConfig || modelItem?.apiConfig || {},
	              protocol: repairedConfig.protocol,
	              notes: repairedConfig.notes || modelItem?.notes || ``,
	              validation: repairedConfig.validation,
	              dryRun: repairedConfig.dryRun,
	            });
	          });
	          modelNames.forEach((modelName) => {
	            if (modelMap.has(modelName)) return;
		            let fallbackProtocol = buildButlerFallbackProtocol(modelName, {
		                apiUrl: options.apiUrl || ``,
		              }),
		              category = inferButlerCategoryFromModelName(modelName),
	              repairedConfig = validateAndRepairConfigButlerResult({
	                modelName: modelName,
	                category: category,
	                protocol: fallbackProtocol,
	              }, {
	                modelName: modelName,
	                category: category,
	                apiUrl: options.apiUrl || ``,
	                toolContext: options.toolContext || null,
	              });
	            modelMap.set(modelName, {
	              id: `${modelName}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	              modelName: modelName,
	              category: category,
	              apiConfig: {},
	              protocol: repairedConfig.protocol,
	              notes: `未在配置管家结果中找到，已按模型名生成基础兼容配置${repairedConfig.notes ? `\n${repairedConfig.notes}` : ``}`,
	              validation: repairedConfig.validation,
	              dryRun: repairedConfig.dryRun,
	            });
	          });
	          return [...modelMap.values()];
	        };

export const stableConfigButlerTaskStringify = (value) => {
		              let sortObjectDeep = (innerValue) =>
		                innerValue && typeof innerValue == `object` && !Array.isArray(innerValue) ?
		                Object.keys(innerValue).sort().reduce((accumulator, objectKey) => ((accumulator[objectKey] = sortObjectDeep(innerValue[objectKey])), accumulator), {}) :
		                Array.isArray(innerValue) ?
		                innerValue.map(sortObjectDeep) :
		                innerValue;
		              try {
		                return JSON.stringify(sortObjectDeep(value || {}));
		              } catch {
		                return String(value || ``);
		              }
		            };

export const getConfigButlerTaskFailureSignature = (task: GlobalTask) => {
		              if (!task || !task.nodeId) return ``;
		              let category = normalizeModelCategory(task.type || task.customOutputType) || inferButlerCategoryFromModelName(task.modelName || ``);
		              return stableConfigButlerTaskStringify({
		                projectId: task.projectId || `default`,
		                nodeId: task.nodeId,
		                category: category,
		                modelName: task.modelName || ``,
		                apiBaseUrl: normalizeButlerBaseUrl(task.apiBaseUrl || ``).toLowerCase(),
		                apiConfigId: task.apiConfigId || ``,
		                prompt: String(task.prompt || ``).trim().slice(0, 4000),
		              });
		            };

export const buildLocalConfigButlerErrorDiagnosis = (task: GlobalTask, errorText = ``) => {
		              let errorMsgText = String(task?.errorMsg || ``),
		                isClientErrorRegex = /\b(400|401|403|404|422)\b|format|schema|invalid|parameter|param|field|body|json|multipart|字段|参数|格式|请求体/i.test(errorMsgText),
		                isServerErrorRegex = /\b(500|502|503|504|429)\b|timeout|temporar|overload|busy|rate limit|服务器|上游|繁忙|超时|限流/i.test(errorMsgText);
		              return {
		                classification: isClientErrorRegex ? `request_config` : isServerErrorRegex ? `upstream` : `unknown`,
		                confidence: isClientErrorRegex || isServerErrorRegex ? 0.68 : 0.35,
			                summary: isClientErrorRegex ?
			                  `最新失败任务的错误信息更像请求体或协议配置不匹配。` :
			                  isServerErrorRegex ?
			                  `最新失败任务的错误信息更像上游中转站或模型服务暂时异常。` :
			                  `最新失败任务信息不足以可靠区分上游和本地配置。`,
		                evidence: [errorMsgText, errorText ? `已读取文档摘要，但智能诊断未完成：${errorText}` : ``].filter(Boolean),
		                suggestedFix: isClientErrorRegex ?
		                  `请检查该模型绑定的协议、submitPath/pollPath、字段映射和字段类型。配置管家可根据 API 文档重新生成协议后再应用。` :
		                  isServerErrorRegex ?
		                  `建议稍后重试、换同中转站其他模型，或在中转站后台确认该模型通道是否可用。` :
		                  `建议打开配置管家填入该中转站 API 文档后重新诊断。`,
			                shouldApplyPatch: false,
			              };
			            };

export const normalizeConfigButlerDiagnosis = (diagnosis: any, task: GlobalTask = {} as GlobalTask, protocolBinding: ProtocolConfig | null = null, protocolConfig: ProtocolConfig | null = null) => {
				              let normalizedDiagnosis = diagnosis && typeof diagnosis == `object` ? {
			                  ...diagnosis
			                } : {},
			                requestProfile = task?.requestProfile && typeof task.requestProfile == `object` ? task.requestProfile : {},
			                errorMsg = String(task?.errorMsg || ``),
				                submitPath = String(requestProfile.submitPath || protocolConfig?.submitPath || ``),
			                submitUrl = String(requestProfile.submitUrl || ``),
			                pollUrl = String(requestProfile.pollUrl || ``),
			                apiBaseUrl = String(task?.apiBaseUrl || ``),
			                resolvedSubmitUrl = /^https?:\/\//i.test(submitUrl) ?
			                submitUrl :
			                apiBaseUrl && submitPath ?
			                buildApiUrl(apiBaseUrl, submitPath) :
			                ``,
			                isInvalidUrlError = /invalid url\s*\(\s*post\s+\/[^)]+\)/i.test(errorMsg),
			                isAbsoluteSubmitUrl = /^https?:\/\//i.test(resolvedSubmitUrl);
			              if (isInvalidUrlError && isAbsoluteSubmitUrl) {
			                let diagnosisMessage = `任务记录可还原实际提交 URL 为 ${resolvedSubmitUrl}，不是单独请求 ${submitPath || `相对路径`}。`;
			                normalizedDiagnosis.classification === `model_code` && (normalizedDiagnosis.classification = `request_config`);
			                normalizedDiagnosis.confidence = Math.max(Number(normalizedDiagnosis.confidence) || 0, 0.86);
			                normalizedDiagnosis.summary = `上游拒绝了当前视频提交路径，问题更像 endpoint/平台路由不匹配，不是前端没有拼接 baseUrl。`;
			                normalizedDiagnosis.evidence = butlerUniquePaths(normalizedDiagnosis.evidence, [
			                  diagnosisMessage,
			                  pollUrl ? `轮询 URL 记录为 ${pollUrl}` : ``,
			                  errorMsg,
			                ]).slice(0, 5);
			                normalizedDiagnosis.suggestedFix =
			                  normalizedDiagnosis.suggestedProtocol?.config ?
			                  normalizedDiagnosis.suggestedFix || `可应用配置管家给出的协议修复后重试。` :
			                  `当前没有足够证据安全改成另一个 endpoint。请用单模型配置管家结合该中转站文档重新生成 ${task?.modelName || `该模型`} 的视频协议，或向中转站确认 ${submitUrl || submitPath} 是否支持这个模型。`;
			                normalizedDiagnosis.shouldApplyPatch = !!(
			                  normalizedDiagnosis.suggestedProtocol?.config &&
			                  normalizedDiagnosis.suggestedProtocol.config.requestType &&
			                  normalizedDiagnosis.suggestedProtocol.config.requestType !== `custom`
			                );
			              }
			              if (normalizedDiagnosis.suggestedProtocol?.config) {
			                try {
			                  let suggestedCategory = normalizeModelCategory(normalizedDiagnosis.suggestedProtocol.config.category || task.type || task.customOutputType) || inferButlerCategoryFromModelName(task.modelName || ``),
			                    repairedResult = validateAndRepairConfigButlerResult({
			                      modelName: task.modelName,
			                      category: suggestedCategory,
			                      protocol: normalizedDiagnosis.suggestedProtocol,
			                    }, {
			                      modelName: task.modelName,
			                      category: suggestedCategory,
			                      apiUrl: task.apiBaseUrl || ``,
			                      toolContext: protocolBinding,
			                    });
			                  normalizedDiagnosis.suggestedProtocol = repairedResult.protocol;
			                } catch {}
			              }
			              if (
			                /^grok-video/i.test(String(task?.modelName || ``)) &&
			                /xpclaw\.ai/i.test(String(task?.apiBaseUrl || ``)) &&
			                /\/v1\/grok\/videos\b/i.test(
			                  `${normalizedDiagnosis.suggestedProtocol?.config?.submitPath || ``} ${normalizedDiagnosis.suggestedProtocol?.config?.pollPath || ``} ${normalizedDiagnosis.suggestedProtocol?.config?.contentPath || ``}`,
			                )
			              ) {
			                normalizedDiagnosis.classification = `request_config`;
			                normalizedDiagnosis.confidence = Math.max(Number(normalizedDiagnosis.confidence) || 0, 0.9);
			                normalizedDiagnosis.summary = `配置管家给出的 /v1/grok/videos 不是 xpclaw 已验证可用的视频端点，不能直接作为自动修复应用。`;
			                normalizedDiagnosis.evidence = butlerUniquePaths(normalizedDiagnosis.evidence, [
			                  `本地协议包没有定义 /v1/grok/videos；该路径来自诊断结果或已保存的协议修复。`,
			                  `当前中转站返回 Invalid URL (POST /v1/grok/videos)，说明这个路由在 xpclaw 上不可用。`,
			                ]).slice(0, 5);
			                normalizedDiagnosis.suggestedFix = `不要应用 /v1/grok/videos 这条修复。请以 xpclaw 文档里的真实 Grok 视频创建和查询端点重新生成单模型协议；在未验证 submitPath/pollPath 前，配置管家不会再允许把该路径写入模型绑定。`;
			                normalizedDiagnosis.shouldApplyPatch = false;
			              }
			              return normalizedDiagnosis;
			            };

export const inferConfigButlerProblemPart = (errorAssistant = null) => {
		              let errorText = String(errorAssistant?.errorMsg || errorAssistant?.task?.errorMsg || errorAssistant?.diagnosis?.summary || ``),
		                requestProfile = errorAssistant?.requestProfile || errorAssistant?.task?.requestProfile || {};
		              return /content|result|download|获取结果|结果地址/i.test(`${errorText} ${requestProfile.contentPath || ``} ${requestProfile.contentUrl || ``}`) ?
		                `content` :
		                /poll|query|status|GET\s+\/|查询|状态/i.test(`${errorText} ${requestProfile.pollPath || ``} ${requestProfile.pollUrl || ``}`) ?
		                `poll` :
		                `submit`;
		            };
