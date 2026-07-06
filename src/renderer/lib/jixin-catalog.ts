/**
 * 极心（Jixin）内置模型目录 —— Seedance 部分。
 *
 * 万卷灵境接入极心一站式 API 时的内置候选清单：Seedance 视频模型、
 * 时长、分辨率与画幅比例。设置面板与天玑（Tianji）Seedance 默认配置均以此为底。
 *
 * 另含 wanjuanMergeModelText：把若干模型清单（数组或以换行/逗号/顿号分隔的文本）
 * 合并去重为换行分隔文本，用于合并内置清单与用户自定义清单。
 */

/** 极心内置的天玑 Seedance 视频模型清单。 */
export const WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS = [
  `doubao-seedance-2-0-260128`,
  `doubao-seedance-2-0-fast-260128`,
];

/** 极心内置的 Seedance 可选时长（秒），换行分隔。 */
export const WANJUAN_JIXIN_BUILTIN_SEEDANCE_DURATIONS = `4
5
6
7
8
9
10
11
12
13
14
15`;

/** 极心内置的 Seedance 可选分辨率，换行分隔。 */
export const WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS = `480p
720p
1080p`;

/** 极心内置的 Seedance 可选画幅比例，换行分隔。 */
export const WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS = `21:9
16:9
4:3
1:1
3:4
9:16`;

/**
 * 合并多份模型清单并去重。
 * 每个入参可以是数组，或以换行/半角逗号/全角逗号/顿号分隔的文本；
 * 输出保持首次出现顺序、以换行分隔的清单文本。
 */
export const wanjuanMergeModelText = (...inputs: any[]): string => {
  let seen = new Set<string>(),
    models: string[] = [];
  inputs.forEach((input) => {
    (Array.isArray(input) ? input : String(input || ``).split(/[\n,，、]+/))
      .map((model) => String(model || ``).trim())
      .filter(Boolean)
      .forEach((model) => {
        if (seen.has(model)) return;
        seen.add(model);
        models.push(model);
      });
  });
  return models.join(`
`);
};

// —— 以下为极心内置目录全量与配置修补域（自 bundle 反混淆迁入，行为保持一致）——
// 内置文本/图片/视频/音频模型清单与协议绑定、默认 API 配置、内置全局配置基线 patch、
// 内置智能体（Agent）目录，以及把内置目录合并进用户设置的修补函数。
import { wanjuanFindLegacyJixinApiKey } from "./tianji-api";

export const WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID = `jixin-default`;
export const WANJUAN_JIXIN_DEFAULT_API_URL = `https://jixing.guancn.uk`;
export const WANJUAN_JIXIN_DEFAULT_DOC_URL = `https://kcn07wr6x9xu.feishu.cn/wiki/RBPHwKfzhiq7Xuk06M8c3NgInKd`;
export const WANJUAN_CONFIG_BUTLER_DEFAULT_MODEL = `gpt-5.5`;
export const WANJUAN_JIXIN_BUILTIN_GLOBAL_CONFIG_ID = `builtin-jixin-base`;
export const WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION = `2026-07-06-feishu-doc-url-v1`;
export const wanjuanIsLegacyJixinDocUrl = (url: any) => {
  let normalizedUrl = String(url || ``).trim().replace(/\/+$/, ``);
  return normalizedUrl === `${WANJUAN_JIXIN_DEFAULT_API_URL}/docs` ||
    normalizedUrl === `https://newapi.guancn.uk/docs`;
};
export const WANJUAN_JIXIN_BUILTIN_TEXT_MODELS = [
  // OpenAI GPT 系列
  `gpt-5.5`,
  `gpt-5.4`,
  // DeepSeek 系列
  `deepseek-v4-pro`,
  `deepseek-v4-flash`,
  `deepseek-v3.2-thinking`,
  `deepseek-v3.2`,
  // Claude 系列
  `claude-opus-4-6`,
  `claude-opus-4-5-20251101`,
  `claude-sonnet-4-6`,
  `claude-sonnet-4-5-20250929`,
  // Qwen 系列
  `qwen3.7-max`,
  `qwen3.6-plus`,
  // Gemini 系列
  `gemini-3.1-pro-preview`,
  `gemini-3.1-pro`,
  `gemini-3-pro`,
  `gemini-3.1-flash-lite-preview`,
  `gemini-3-flash-preview`,
  // Kimi 系列
  `kimi-k2.6`,
  `kimi-k2.5`,
  // Grok 系列
  `grok-4-fast-reasoning`,
  `grok-4-fast-non-reasoning`,
  `grok-4`,
  `grok-3`,
  // GLM 系列
  `glm-5.2`,
  `glm-5.1`,
  // MiniMax 系列
  `MiniMax-M3`,
  `MiniMax-M2.7`,
];
export const WANJUAN_JIXIN_BUILTIN_IMAGE_MODELS = [
  // GPT Image 系列
  `gpt-image-2-pro`,
  `gpt-image-2`,
  `gpt-image-1.5`,
  `lconai-gpt-image-2`,
  // Gemini Image 系列
  `gemini-3.1-flash-image-preview-4k`,
  `gemini-3.1-flash-image-preview-2k`,
  `gemini-3.1-flash-image-preview`,
  `gemini-3-pro-image-preview-4k`,
  `gemini-3-pro-image-preview-2k`,
  `gemini-3-pro-image-preview`,
  `gemini-2.5-flash-image`,
  `nano-banana-2`,
  `nano-banana`,
  // 豆包 Seedream
  `doubao-seedream-5-0`,
  // Qwen Image 系列
  `qwen-image-2.0-pro`,
  `qwen-image-2.0`,
  `qwen-image-max-2025-12-30`,
  // 通义万象 Image
  `wan2.7-image`,
  `wan2.6-image`,
  // 其他
  `Z-Image-Turbo`,
];
export const WANJUAN_JIXIN_BUILTIN_VIDEO_MODELS = [
  // Google Veo 3.1 系列
  `veo3.1-fast`,
  `veo_3_1-fast`,
  // Grok Video 系列
  `grok-video-3`,
  `grok-imagine-video-1.5-preview`,
];
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS = [
  `wan2.7-t2v-1080P`,
  `wan2.7-t2v-720P`,
];
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_IMAGE_MODELS = [
  `wan2.7-i2v-1080P`,
  `wan2.7-i2v-720P`,
];
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_REFERENCE_IMAGE_MODELS = [
  `wan2.7-r2v-1080P`,
  `wan2.7-r2v-720P`,
];
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_EDIT_MODELS = [
  `wan2.7-videoedit-1080P`,
  `wan2.7-videoedit-720P`,
];
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_MODELS = [
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS,
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_IMAGE_MODELS,
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_REFERENCE_IMAGE_MODELS,
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_EDIT_MODELS,
];
export const WANJUAN_JIXIN_BUILTIN_SEEDANCE_MODELS = [
  `doubao-seedance-2-0-260128`,
  `doubao-seedance-2-0-fast-260128`,
];
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_DURATIONS = `2
5
10
15`;
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RESOLUTIONS = `720P
1080P`;
export const WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RATIOS = `16:9
9:16
1:1
4:3
3:4`;
export const WANJUAN_JIXIN_BUILTIN_MUSIC_MODELS = [
  `suno_music`,
  `suno_lyrics`,
];
export const WANJUAN_JIXIN_BUILTIN_AUDIO_MODELS = [];
export const WANJUAN_JIXIN_BUILTIN_TEXT_PROTOCOLS = {
  ...WANJUAN_JIXIN_BUILTIN_TEXT_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫文本兼容`,
  }), {}),
  // Gemini 系列按智创文档建议使用 Generate Content 协议
  [`gemini-3-pro`]: `Gemini 文本原生`,
  [`gemini-3.1-pro`]: `Gemini 文本原生`,
  [`gemini-3.1-pro-preview`]: `Gemini 文本原生`,
  [`gemini-3.1-flash-lite-preview`]: `Gemini 文本原生`,
  [`gemini-3-flash-preview`]: `Gemini 文本原生`,
  // Claude 系列按智创文档使用 Messages 协议
  [`claude-opus-4-6`]: `极鑫 Claude Messages 兼容`,
  [`claude-opus-4-5-20251101`]: `极鑫 Claude Messages 兼容`,
  [`claude-sonnet-4-6`]: `极鑫 Claude Messages 兼容`,
  [`claude-sonnet-4-5-20250929`]: `极鑫 Claude Messages 兼容`,
};
export const WANJUAN_JIXIN_BUILTIN_IMAGE_PROTOCOLS = {
  // GPT Image 系列
  [`gpt-image-2-pro`]: `极鑫图片兼容`,
  [`gpt-image-2`]: `极鑫图片兼容`,
  [`gpt-image-1.5`]: `极鑫图片兼容`,
  [`lconai-gpt-image-2`]: `极鑫图片兼容`,
  // Z-Image
  [`Z-Image-Turbo`]: `极鑫图片兼容`,
  // Gemini Image 系列
  [`gemini-3.1-flash-image-preview-4k`]: `极鑫 Gemini 图片兼容`,
  [`gemini-3.1-flash-image-preview-2k`]: `极鑫 Gemini 图片兼容`,
  [`gemini-3.1-flash-image-preview`]: `极鑫 Gemini 图片兼容`,
  [`gemini-3-pro-image-preview-4k`]: `极鑫 Gemini 图片兼容`,
  [`gemini-3-pro-image-preview-2k`]: `极鑫 Gemini 图片兼容`,
  [`gemini-3-pro-image-preview`]: `极鑫 Gemini 图片兼容`,
  [`gemini-2.5-flash-image`]: `极鑫 Gemini 图片兼容`,
  [`nano-banana-2`]: `极鑫 Gemini 图片兼容`,
  [`nano-banana`]: `极鑫 Gemini 图片兼容`,
  // 豆包 Seedream
  [`doubao-seedream-5-0`]: `极鑫图片兼容`,
  // Qwen Image 系列
  [`qwen-image-2.0-pro`]: `极鑫图片兼容`,
  [`qwen-image-2.0`]: `极鑫图片兼容`,
  [`qwen-image-max-2025-12-30`]: `极鑫图片兼容`,
  // 通义万象 Image
  [`wan2.7-image`]: `极鑫图片兼容`,
  [`wan2.6-image`]: `极鑫图片兼容`,
};
export const WANJUAN_JIXIN_BUILTIN_VIDEO_PROTOCOL_BINDINGS = {
  ...WANJUAN_JIXIN_BUILTIN_VIDEO_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: /^grok-/i.test(model) ? `极鑫 Grok 视频兼容` : `极鑫 Veo/Omni 视频兼容`,
  }), {}),
  [`sora_video2`]: `极鑫 Sora 视频兼容`,
  [`sora-video2`]: `极鑫 Sora 视频兼容`,
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫通义万相文生视频`,
  }), {}),
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_REFERENCE_IMAGE_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫通义万相参考图视频`,
  }), {}),
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_IMAGE_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫通义万相图生视频`,
  }), {}),
  ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_EDIT_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫通义万相视频编辑`,
  }), {}),
  ...WANJUAN_JIXIN_BUILTIN_SEEDANCE_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫视频兼容`,
  }), {}),
  ...WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫视频兼容`,
  }), {}),
};
export const WANJUAN_JIXIN_BUILTIN_AUDIO_PROTOCOL_BINDINGS = {
  ...WANJUAN_JIXIN_BUILTIN_AUDIO_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: /(?:whisper|asr|transcrib)/i.test(model) ? `极鑫音频转写兼容` : `极鑫 TTS 兼容`,
  }), {}),
  ...WANJUAN_JIXIN_BUILTIN_MUSIC_MODELS.reduce((bindings, model) => ({
    ...bindings,
    [model]: `极鑫 Suno 音乐生成`,
  }), {}),
};
export const WANJUAN_JIXIN_BUILTIN_PROTOCOLS = {
  [`极鑫文本兼容`]: {
    category: `text`,
    requestType: `openai-chat`,
    submitPath: `/v1/chat/completions`,
    contentType: `application/json`,
    fieldMapping: {
      model: `model`,
      messages: `messages`,
      temperature: `temperature`,
      responseFormat: `response_format`,
    },
    fieldValueTypes: {
      temperature: `number`,
    },
    responseMapping: {
      text: [`choices.0.message.content`, `output_text`, `text`],
    },
  },
  [`极鑫 Claude Messages 兼容`]: {
    category: `text`,
    requestType: `claude-messages`,
    submitPath: `/v1/messages`,
    contentType: `application/json`,
    fieldMapping: {
      model: `model`,
      messages: `messages`,
      system: `system`,
      temperature: `temperature`,
      maxTokens: `max_tokens`,
    },
    fieldValueTypes: {
      temperature: `number`,
      max_tokens: `number`,
    },
    extraBody: {
      max_tokens: 4096,
    },
    responseMapping: {
      text: [`content.0.text`, `content.1.text`, `text`, `completion`],
    },
  },
  [`极鑫图片兼容`]: {
    category: `image`,
    requestType: `openai-images`,
    submitPath: `/v1/images/generations`,
    editPath: `/v1/images/edits`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      count: `n`,
      size: `size`,
      aspectRatio: ``,
      responseFormat: ``,
      referenceImage: `image[{index}]`,
    },
    fieldValueTypes: {
      n: `number`,
      size: `string`,
    },
    parameterAdapter: {
      sizeValueMode: `dimension`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      image: [`data.0.url`, `data.0.b64_json`, `data.0.download_url`, `data.0.image_url`, `url`, `image_url`],
    },
  },
  [`极鑫 Grok 图片兼容`]: {
    category: `image`,
    requestType: `openai-images`,
    submitPath: `/v1/images/generations`,
    editPath: `/v1/images/edits`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      count: `n`,
      size: `size`,
      aspectRatio: ``,
      responseFormat: `response_format`,
      referenceImage: `image[{index}]`,
    },
    fieldValueTypes: {
      n: `number`,
      size: `string`,
      response_format: `string`,
    },
    parameterAdapter: {
      sizeValueMode: `dimension`,
      aspectRatioValueMode: `omit`,
      sizeValueMap: {
        [`1024x1024`]: `1024x1024`,
        [`1280x720`]: `1280x720`,
        [`720x1280`]: `720x1280`,
        [`1536x1024`]: `1168x784`,
        [`1024x1536`]: `784x1168`,
        [`1280x960`]: `960x720`,
        [`960x1280`]: `720x960`,
      },
    },
    responseMapping: {
      image: [`data.0.url`, `data.0.b64_json`, `data.0.download_url`, `data.0.image_url`, `url`, `image_url`],
    },
  },
  [`极鑫 Gemini 图片兼容`]: {
    category: `image`,
    requestType: `gemini-generate-content`,
    parameterAdapter: {
      sizeValueMode: `preset`,
      aspectRatioValueMode: `ratio`,
    },
    responseMapping: {
      image: [`candidates.0.content.parts.0.inlineData.data`, `candidates.0.content.parts.0.inline_data.data`, `candidates.0.content.parts.0.fileData.fileUri`, `candidates.0.content.parts.0.file_data.file_uri`, `candidates.0.content.parts.0.text`, `text`],
    },
  },
  [`极鑫视频兼容`]: {
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
      resolutionValueMode: `preset`,
      resolutionValueMap: {
        [`1280x720`]: `720p`,
        [`720x1280`]: `720p`,
        [`1080x720`]: `720p`,
        [`720x1080`]: `720p`,
        [`720x720`]: `720p`,
        [`1920x1080`]: `1080p`,
        [`1080x1920`]: `1080p`,
      },
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`metadata.url`, `data.0.url`, `data.0.video_url`, `output.video_url`, `result.video_url`, `video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
    },
  },
  [`极鑫 Veo/Omni 视频兼容`]: {
    category: `video`,
    requestType: `multipart-video`,
    submitPath: `/v1/videos`,
    pollPath: `/v1/videos/{taskId}`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      resolution: `size`,
      aspectRatio: ``,
      duration: `seconds`,
      referenceImage: `input_reference`,
      referenceVideo: `input_reference`,
    },
    fieldValueTypes: {
      seconds: `number`,
      size: `string`,
    },
    parameterAdapter: {
      resolutionValueMode: `dimension`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
      completedValues: [`completed`, `complete`, `success`, `succeeded`],
    },
  },
  [`极鑫 Grok 视频兼容`]: {
    category: `video`,
    requestType: `multipart-video`,
    submitPath: `/v1/videos`,
    pollPath: `/v1/videos/{taskId}`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      resolution: `size`,
      aspectRatio: ``,
      duration: `seconds`,
      referenceImage: `input_reference`,
    },
    fieldValueTypes: {
      seconds: `number`,
      size: `string`,
    },
    parameterAdapter: {
      resolutionValueMode: `aspect-ratio`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
      completedValues: [`completed`, `complete`, `success`, `succeeded`],
    },
  },
  [`极鑫 Sora 视频兼容`]: {
    category: `video`,
    requestType: `multipart-video`,
    submitPath: `/v1/videos`,
    pollPath: `/v1/videos/{taskId}`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      resolution: `size`,
      aspectRatio: ``,
      duration: `seconds`,
      referenceImage: `input_reference`,
      referenceVideo: `input_reference`,
    },
    fieldValueTypes: {
      seconds: `number`,
      size: `string`,
    },
    parameterAdapter: {
      resolutionValueMode: `dimension`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
      completedValues: [`completed`, `complete`, `success`, `succeeded`],
    },
  },
  [`极鑫通义万相文生视频`]: {
    category: `video`,
    requestType: `multipart-video`,
    submitPath: `/v1/videos`,
    pollPath: `/v1/videos/{taskId}`,
    omitDuration: !1,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      resolution: `size`,
      aspectRatio: ``,
      duration: `seconds`,
      referenceImage: ``,
      referenceVideo: ``,
    },
    fieldValueTypes: {
      seconds: `number`,
      size: `string`,
    },
    parameterAdapter: {
      resolutionValueMode: `aspect-ratio`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
      completedValues: [`completed`, `complete`, `success`, `succeeded`],
    },
  },
  [`极鑫通义万相参考图视频`]: {
    category: `video`,
    requestType: `multipart-video`,
    submitPath: `/v1/videos`,
    pollPath: `/v1/videos/{taskId}`,
    requiresReferenceImage: !0,
    referenceImageMode: `url`,
    referenceVideoMode: `url`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      resolution: `size`,
      aspectRatio: ``,
      duration: `seconds`,
      referenceImage: `input_reference`,
      referenceVideo: `input_reference`,
    },
    fieldValueTypes: {
      seconds: `string`,
      size: `string`,
    },
    parameterAdapter: {
      resolutionValueMode: `aspect-ratio`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
      completedValues: [`completed`, `complete`, `success`, `succeeded`],
    },
  },
  [`极鑫通义万相图生视频`]: {
    category: `video`,
    requestType: `multipart-video`,
    submitPath: `/v1/videos`,
    pollPath: `/v1/videos/{taskId}`,
    requiresReferenceImage: !0,
    referenceImageMode: `url`,
    referenceVideoMode: `url`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      resolution: ``,
      aspectRatio: ``,
      duration: `seconds`,
      referenceImage: `input_reference`,
      referenceVideo: `input_reference`,
    },
    fieldValueTypes: {
      seconds: `string`,
    },
    parameterAdapter: {
      resolutionValueMode: `omit`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
      completedValues: [`completed`, `complete`, `success`, `succeeded`],
    },
  },
  [`极鑫通义万相视频编辑`]: {
    category: `video`,
    requestType: `multipart-video`,
    submitPath: `/v1/videos`,
    pollPath: `/v1/videos/{taskId}`,
    requiresReferenceVideo: !0,
    referenceImageMode: `url`,
    referenceVideoMode: `url`,
    fieldMapping: {
      model: `model`,
      prompt: `prompt`,
      resolution: ``,
      aspectRatio: ``,
      duration: `seconds`,
      referenceImage: `input_reference`,
      referenceVideo: `input_reference`,
    },
    fieldValueTypes: {
      seconds: `string`,
    },
    parameterAdapter: {
      resolutionValueMode: `omit`,
      aspectRatioValueMode: `omit`,
    },
    responseMapping: {
      video: [`video_url`, `data.video_url`, `output.video_url`, `result.video_url`, `url`],
      taskId: [`id`, `task_id`, `data.id`, `data.task_id`],
      status: [`status`, `data.status`, `state`],
      completedValues: [`completed`, `complete`, `success`, `succeeded`],
    },
  },
  [`极鑫 Suno 音乐生成`]: {
    category: `music`,
    requestType: `suno-music`,
    submitPath: `/suno/submit/music`,
    pollPath: `/suno/fetch/{taskId}`,
    fieldMapping: {
      model: `mv`,
      prompt: `gpt_description_prompt`,
      title: `title`,
    },
    responseMapping: {
      audio: [`data.clips.0.audio_url`, `data.clips.0.audioUrl`, `data.0.audio_url`, `data.0.audioUrl`, `audio_url`, `url`],
      taskId: [`data`, `id`, `task_id`, `data.id`, `data.task_id`],
      status: [`data.status`, `status`],
    },
  },
  [`极鑫音频转写兼容`]: {
    category: `audio`,
    requestType: `openai-audio-transcription`,
    submitPath: `/v1/audio/transcriptions`,
    fieldMapping: {
      file: `file`,
      model: `model`,
      prompt: `prompt`,
      responseFormat: `response_format`,
      timestampGranularity: `timestamp_granularities[]`,
    },
    responseMapping: {
      text: [`text`, `data.text`],
      words: `words`,
    },
  },
  [`极鑫 TTS 兼容`]: {
    category: `audio`,
    requestType: `openai-audio-speech`,
    submitPath: `/v1/audio/speech`,
    contentType: `application/json`,
    fieldMapping: {
      model: `model`,
      input: `input`,
      voice: `voice`,
      format: `response_format`,
      speed: `speed`,
      instructions: `instructions`,
      referenceAudio: ``,
    },
    fieldValueTypes: {
      speed: `number`,
    },
  },
};
export const wanjuanBuildJixinModelBindings = (models: any, apiConfigId = WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID) =>
  String(models || ``)
    .split(/[\n,，、]+/)
    .map((model) => model.trim())
    .filter(Boolean)
    .reduce((bindings, model) => ({
      ...bindings,
      [model]: apiConfigId,
    }), {});
export const wanjuanMergeObjectDefaults = (target: any = {}, defaults: any = {}) => ({
  ...(defaults || {}),
  ...(target && typeof target == `object` ? target : {}),
});
export const wanjuanMergeOptionText = (current: any, defaults: any) =>
  wanjuanMergeModelText(current, defaults);
export const wanjuanMergeJixinVideoProtocolDefaults = (target: any = {}, defaults: any = {}) => {
  let result = target && typeof target == `object` ? {
      ...target
    } : {},
    replaceableBindings = new Set([`极鑫视频兼容`, `智创聚合视频统一`, `智创聚合视频 JSON`, `表单视频兼容`, `OpenAI 视频兼容`]);
  Object.entries(defaults || {}).forEach(([model, protocolName]) => {
    let current = result[model];
    if (!current || replaceableBindings.has(current)) result[model] = protocolName;
  });
  return result;
};
export const wanjuanGetJixinDefaultApiConfigId = (settings: any = {}) => {
	  let apiConfigs = Array.isArray(settings.apiConfigs) ? settings.apiConfigs : [],
	    jixinConfig =
	      apiConfigs.find((config) => config?.id === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID) ||
	      apiConfigs[0];
	  return jixinConfig?.id || WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID;
	};
export const wanjuanEnsureJixinApiConfigKey = (settings: any = {}) => {
  let legacyKey = wanjuanFindLegacyJixinApiKey(settings);
  if (!legacyKey) return settings;
  let apiConfigs = Array.isArray(settings.apiConfigs) && settings.apiConfigs.length ?
      settings.apiConfigs :
      [{
        id: WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
        name: `极鑫`,
        url: WANJUAN_JIXIN_DEFAULT_API_URL,
        key: ``,
        protocolFormat: `auto`,
      }],
	    jixinIndex = apiConfigs.findIndex((config) =>
	      config?.id === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID
	    );
  if (jixinIndex < 0 || String(apiConfigs[jixinIndex]?.key || ``).trim()) return settings;
  return {
    ...settings,
    apiConfigs: apiConfigs.map((config, index) =>
      index === jixinIndex ? {
        ...config,
        key: legacyKey,
      } : config
    ),
  };
};
export const wanjuanBuildJixinVideoModelBindings = (apiConfigId = WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID) =>
  wanjuanBuildJixinModelBindings(
    [
      ...WANJUAN_JIXIN_BUILTIN_VIDEO_MODELS,
      ...WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_MODELS,
      ...WANJUAN_JIXIN_BUILTIN_SEEDANCE_MODELS,
      ...WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS,
    ],
    apiConfigId,
  );
export const wanjuanBuildJixinAudioModelBindings = (apiConfigId = WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID) =>
  wanjuanBuildJixinModelBindings(
    [
      ...WANJUAN_JIXIN_BUILTIN_AUDIO_MODELS,
      ...WANJUAN_JIXIN_BUILTIN_MUSIC_MODELS,
    ],
    apiConfigId,
  );
export const wanjuanBuildJixinVideoProtocolBindings = () =>
  ({
    ...WANJUAN_JIXIN_BUILTIN_VIDEO_PROTOCOL_BINDINGS,
  });
export const wanjuanBuildJixinAudioProtocolBindings = () =>
  ({
    ...WANJUAN_JIXIN_BUILTIN_AUDIO_PROTOCOL_BINDINGS,
  });
export const wanjuanApplyJixinBuiltinProtocolPatch = (settings: any = {}) => {
  let nextSettings = {
      ...settings,
      modelProtocolRegistry: {
        ...(settings.modelProtocolRegistry && typeof settings.modelProtocolRegistry == `object` ? settings.modelProtocolRegistry : {}),
        ...WANJUAN_JIXIN_BUILTIN_PROTOCOLS,
      },
      textModelProtocolBindings: wanjuanMergeObjectDefaults(settings.textModelProtocolBindings, WANJUAN_JIXIN_BUILTIN_TEXT_PROTOCOLS),
      imageModelProtocolBindings: wanjuanMergeObjectDefaults(settings.imageModelProtocolBindings, WANJUAN_JIXIN_BUILTIN_IMAGE_PROTOCOLS),
      videoModelProtocolBindings: wanjuanMergeJixinVideoProtocolDefaults(
        settings.videoModelProtocolBindings,
        wanjuanBuildJixinVideoProtocolBindings(),
      ),
      audioModelProtocolBindings: wanjuanMergeObjectDefaults(
        settings.audioModelProtocolBindings,
        wanjuanBuildJixinAudioProtocolBindings(),
      ),
    },
    apiConfigId = wanjuanGetJixinDefaultApiConfigId(nextSettings);
  return {
    ...nextSettings,
    textModelApiBindings: wanjuanMergeObjectDefaults(
      nextSettings.textModelApiBindings,
      wanjuanBuildJixinModelBindings(WANJUAN_JIXIN_BUILTIN_TEXT_MODELS, apiConfigId),
    ),
    imageModelApiBindings: wanjuanMergeObjectDefaults(
      nextSettings.imageModelApiBindings,
      wanjuanBuildJixinModelBindings(WANJUAN_JIXIN_BUILTIN_IMAGE_MODELS, apiConfigId),
    ),
    videoModelApiBindings: wanjuanMergeObjectDefaults(
      nextSettings.videoModelApiBindings,
      wanjuanBuildJixinVideoModelBindings(apiConfigId),
    ),
    audioModelApiBindings: wanjuanMergeObjectDefaults(
      nextSettings.audioModelApiBindings,
      wanjuanBuildJixinAudioModelBindings(apiConfigId),
    ),
  };
};
export const wanjuanApplySeedanceOptionDefaults = (settings: any = {}) => ({
  ...settings,
  seedanceResolutions: wanjuanMergeOptionText(
    settings.seedanceResolutions,
    WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS,
  ),
  seedanceRatios: wanjuanMergeOptionText(
    settings.seedanceRatios,
    WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS,
  ),
});
export const wanjuanHasUserModelConfiguration = (settings: any = {}) => {
  let hasModelText = [
      `textModel`,
      `drawingModel`,
      `videoModel`,
      `audioModel`,
      `ttsMusicModel`,
      `seedanceModel`,
      `tianjiSeedanceModel`,
      `seedanceDurations`,
      `seedanceResolutions`,
      `seedanceRatios`,
      `tongyiWanxiangTextModels`,
      `tongyiWanxiangReferenceImageModels`,
      `tongyiWanxiangImageModels`,
      `tongyiWanxiangEditModels`,
      `tongyiWanxiangDurations`,
      `tongyiWanxiangResolutions`,
      `tongyiWanxiangRatios`,
    ]
      .some((key) => String(settings?.[key] || ``).trim()),
    hasModelBinding = [
      `textModelApiBindings`,
      `textModelProtocolBindings`,
      `imageModelApiBindings`,
      `imageModelProtocolBindings`,
      `videoModelApiBindings`,
      `videoModelProtocolBindings`,
      `audioModelApiBindings`,
      `audioModelProtocolBindings`,
    ].some((key) => settings?.[key] && typeof settings[key] == `object` && Object.keys(settings[key]).length > 0),
    hasStoredGlobalConfig = Array.isArray(settings.storedGlobalConfigs) && settings.storedGlobalConfigs.length > 0,
	    apiConfigs = Array.isArray(settings.apiConfigs) ? settings.apiConfigs : [],
	    hasNonDefaultApiConfig = apiConfigs.some((config) => {
	      return config?.id !== WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID ||
	        String(config?.key || ``).trim();
	    });
  return hasModelText || hasModelBinding || hasStoredGlobalConfig || hasNonDefaultApiConfig;
};
export const wanjuanBuildJixinBuiltinBasePatch = (source: any = {}) => {
  source = wanjuanEnsureJixinApiConfigKey(source);
  let apiConfigs = Array.isArray(source.apiConfigs) && source.apiConfigs.length ?
      source.apiConfigs :
      [{
        id: WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
        name: `极鑫`,
        url: WANJUAN_JIXIN_DEFAULT_API_URL,
        key: ``,
        protocolFormat: `auto`,
      }],
	    jixinConfig = apiConfigs.find((config) => config?.id === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID) ||
	      apiConfigs[0],
    jixinConfigId = jixinConfig?.id || WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
    textModel = wanjuanMergeModelText(source.textModel, WANJUAN_JIXIN_BUILTIN_TEXT_MODELS),
    drawingModel = wanjuanMergeModelText(source.drawingModel, WANJUAN_JIXIN_BUILTIN_IMAGE_MODELS),
    videoModel = wanjuanMergeModelText(source.videoModel, WANJUAN_JIXIN_BUILTIN_VIDEO_MODELS),
    ttsMusicModel = wanjuanMergeModelText(source.ttsMusicModel, WANJUAN_JIXIN_BUILTIN_MUSIC_MODELS),
    audioModel = wanjuanMergeModelText(source.audioModel, WANJUAN_JIXIN_BUILTIN_AUDIO_MODELS),
    textBindings = wanjuanBuildJixinModelBindings(WANJUAN_JIXIN_BUILTIN_TEXT_MODELS, jixinConfigId),
    imageBindings = wanjuanBuildJixinModelBindings(WANJUAN_JIXIN_BUILTIN_IMAGE_MODELS, jixinConfigId),
    videoBindings = wanjuanBuildJixinVideoModelBindings(jixinConfigId),
    audioBindings = wanjuanBuildJixinAudioModelBindings(jixinConfigId),
    musicBindings = wanjuanBuildJixinModelBindings(WANJUAN_JIXIN_BUILTIN_MUSIC_MODELS, jixinConfigId);
  return {
    ...source,
    apiConfigs: apiConfigs.map((config) =>
      config === jixinConfig ? {
	        ...config,
	        id: jixinConfigId,
	        name: config.name || `极鑫`,
	        url: config.id === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID ? WANJUAN_JIXIN_DEFAULT_API_URL : config.url || WANJUAN_JIXIN_DEFAULT_API_URL,
	        protocolFormat: config.protocolFormat || `auto`,
	      } : config,
	    ),
    textApiConfigId: source.textApiConfigId || jixinConfigId,
    imageApiConfigId: source.imageApiConfigId || jixinConfigId,
    videoApiConfigId: source.videoApiConfigId || jixinConfigId,
    audioApiConfigId: source.audioApiConfigId || jixinConfigId,
    textApiUrl: jixinConfigId === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID ? WANJUAN_JIXIN_DEFAULT_API_URL : source.textApiUrl || jixinConfig?.url || WANJUAN_JIXIN_DEFAULT_API_URL,
    imageApiUrl: jixinConfigId === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID ? WANJUAN_JIXIN_DEFAULT_API_URL : source.imageApiUrl || jixinConfig?.url || WANJUAN_JIXIN_DEFAULT_API_URL,
    videoApiUrl: jixinConfigId === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID ? WANJUAN_JIXIN_DEFAULT_API_URL : source.videoApiUrl || jixinConfig?.url || WANJUAN_JIXIN_DEFAULT_API_URL,
    audioApiUrl: jixinConfigId === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID ? WANJUAN_JIXIN_DEFAULT_API_URL : source.audioApiUrl || jixinConfig?.url || WANJUAN_JIXIN_DEFAULT_API_URL,
    textModel,
    drawingModel,
    videoModel,
    audioModel,
    ttsMusicModel,
    tongyiWanxiangTextModels: source.tongyiWanxiangTextModels || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS),
    tongyiWanxiangImageModels: source.tongyiWanxiangImageModels || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_IMAGE_MODELS),
    tongyiWanxiangReferenceImageModels: source.tongyiWanxiangReferenceImageModels || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_REFERENCE_IMAGE_MODELS),
    tongyiWanxiangEditModels: source.tongyiWanxiangEditModels || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_EDIT_MODELS),
    tongyiWanxiangDurations: source.tongyiWanxiangDurations || WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_DURATIONS,
    tongyiWanxiangResolutions: source.tongyiWanxiangResolutions || WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RESOLUTIONS,
    tongyiWanxiangRatios: source.tongyiWanxiangRatios || WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RATIOS,
    seedanceModel: source.seedanceModel || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_SEEDANCE_MODELS),
    tianjiSeedanceModel: source.tianjiSeedanceModel || wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS),
    seedanceDurations: source.seedanceDurations || WANJUAN_JIXIN_BUILTIN_SEEDANCE_DURATIONS,
    seedanceResolutions: wanjuanMergeModelText(source.seedanceResolutions, WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS),
    seedanceRatios: wanjuanMergeModelText(source.seedanceRatios, WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS),
    videoResolutions: source.videoResolutions || `1280x720
720x1280
1920x1080
1080x1920
720x720`,
    videoAspectRatios: source.videoAspectRatios || `16:9
9:16
1:1`,
    modelProtocolRegistry: {
      ...(source.modelProtocolRegistry && typeof source.modelProtocolRegistry == `object` ? source.modelProtocolRegistry : {}),
      ...WANJUAN_JIXIN_BUILTIN_PROTOCOLS,
    },
    textModelApiBindings: wanjuanMergeObjectDefaults(source.textModelApiBindings, textBindings),
    imageModelApiBindings: wanjuanMergeObjectDefaults(source.imageModelApiBindings, imageBindings),
    videoModelApiBindings: wanjuanMergeObjectDefaults(source.videoModelApiBindings, videoBindings),
    audioModelApiBindings: wanjuanMergeObjectDefaults(source.audioModelApiBindings, audioBindings),
    textModelProtocolBindings: wanjuanMergeObjectDefaults(source.textModelProtocolBindings, WANJUAN_JIXIN_BUILTIN_TEXT_PROTOCOLS),
    imageModelProtocolBindings: wanjuanMergeObjectDefaults(source.imageModelProtocolBindings, WANJUAN_JIXIN_BUILTIN_IMAGE_PROTOCOLS),
    videoModelProtocolBindings: wanjuanMergeJixinVideoProtocolDefaults(
      source.videoModelProtocolBindings,
      wanjuanBuildJixinVideoProtocolBindings(),
    ),
    audioModelProtocolBindings: wanjuanMergeObjectDefaults(source.audioModelProtocolBindings, {
      ...wanjuanBuildJixinAudioProtocolBindings(),
    }),
  };
};
export const wanjuanBuildJixinBuiltinStoredGlobalConfig = (config: any) => ({
  id: WANJUAN_JIXIN_BUILTIN_GLOBAL_CONFIG_ID,
  name: `极鑫默认基础配置`,
  description: `内置基础配置 · 填入极鑫令牌后可直接使用`,
  source: `builtin-jixin`,
  apiDocUrl: WANJUAN_JIXIN_DEFAULT_DOC_URL,
  updatedAt: 0,
  config: {
    ...(config || {}),
    configButlerDocUrl: WANJUAN_JIXIN_DEFAULT_DOC_URL,
    configButlerMode: `batch`,
    configButlerTargetApiConfigId: WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
  },
});
export const wanjuanSyncJixinBuiltinStoredGlobalConfig = (settings: any = {}) => {
  let currentConfigs = Array.isArray(settings.storedGlobalConfigs) ? settings.storedGlobalConfigs : [],
    builtinConfig = wanjuanBuildJixinBuiltinStoredGlobalConfig(wanjuanBuildJixinBuiltinBasePatch(settings)),
    found = !1,
    nextConfigs = currentConfigs.map((config) => {
      if (config?.id !== WANJUAN_JIXIN_BUILTIN_GLOBAL_CONFIG_ID) return config;
      found = !0;
      return {
        ...config,
        ...builtinConfig,
        name: config.name || builtinConfig.name,
        description: builtinConfig.description,
        updatedAt: builtinConfig.updatedAt,
      };
    });
  found || nextConfigs.unshift(builtinConfig);
  return {
    ...settings,
    storedGlobalConfigs: nextConfigs,
    activeStoredGlobalConfigId: settings.activeStoredGlobalConfigId || builtinConfig.id,
  };
};
export const WANJUAN_BUILTIN_AGENT_ITEMS = [{
    id: `agent-seedance-prompt-optimizer`,
    name: `seedance提示词优化师`,
    description: `优化提示词、补全风格约束、整理输出结构`,
    icon: `bulb`,
    model: `gpt-5.5`,
    apiConfigId: WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
    temperature: `0.7`,
    outputMode: `prompt`,
    systemPrompt: `你是一个专为 Seedance 视频生成服务的提示词优化智能体。你的任务是把用户的简短想法、画面描述、产品诉求或分镜草稿整理成更适合 Seedance 执行的视频提示词。输出时优先补全主体、场景、动作、镜头运动、光线、构图、风格、时长节奏和负面约束；保留用户原意，不虚构关键事实；最终给出可直接复制到画布视频节点里的提示词。`,
    knowledge: `适合处理文生视频、图生视频、分镜拆分、风格统一、镜头语言补全、Seedance 参数约束整理等任务。`,
    knowledgeFiles: [],
    memoryEnabled: !1,
    memoryBaseUrl: ``,
    memoryApiKey: ``,
    memoryUserId: `default-user`,
    memoryTopK: `6`,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: `agent-video-breakdown`,
    name: `视频拆解师`,
    description: `根据我上传的视频来拆解画面内容`,
    icon: `chat`,
    model: `gemini-3.1-pro-preview`,
    apiConfigId: WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
    temperature: `0.7`,
    outputMode: `chat`,
    systemPrompt: `你是一个视频画面拆解智能体。用户上传视频后，你需要基于可见内容拆解镜头、主体、动作、场景、光线、构图、色彩、运镜、节奏、字幕/文字、关键变化和可复用的生成提示词。不要臆测看不见的信息；如果视频内容不足以判断，要明确说明不确定点。输出应结构清晰，方便用户继续在画布里做复刻、改编、分镜或提示词生成。`,
    knowledge: `适合处理视频参考分析、镜头语言拆解、画面内容归纳、分镜复刻、视频转提示词等任务。`,
    knowledgeFiles: [],
    memoryEnabled: !1,
    memoryBaseUrl: ``,
    memoryApiKey: ``,
    memoryUserId: `default-user`,
    memoryTopK: `6`,
    createdAt: 0,
    updatedAt: 0,
  },
];
export const WANJUAN_BUILTIN_AGENT_CONVERSATIONS = {
  "agent-seedance-prompt-optimizer": [{
    id: `agent-seedance-prompt-optimizer-welcome`,
    role: `assistant`,
    content: `我是“seedance提示词优化师”。把主题、画面想法、参考风格或限制条件发给我，我会整理成更适合 Seedance 的视频提示词。`,
    createdAt: 0,
  }, ],
  "agent-video-breakdown": [{
    id: `agent-video-breakdown-welcome`,
    role: `assistant`,
    content: `我是“视频拆解师”。上传视频或发来视频参考，我会帮你拆解画面内容、镜头节奏和可复用的提示词结构。`,
    createdAt: 0,
  }, ],
};
export const wanjuanCloneBuiltinAgentItems = () =>
  WANJUAN_BUILTIN_AGENT_ITEMS.map((agent) => ({
    ...agent,
    knowledgeFiles: Array.isArray(agent.knowledgeFiles) ? [...agent.knowledgeFiles] : [],
  }));
export const wanjuanCloneBuiltinAgentConversations = () =>
  Object.fromEntries(
    Object.entries(WANJUAN_BUILTIN_AGENT_CONVERSATIONS).map(([agentId, messages]) => [
      agentId,
      (Array.isArray(messages) ? messages : []).map((message) => ({
        ...message
      })),
    ]),
  );
export const wanjuanHasUserAgentConfiguration = (settings: any = {}) =>
  Array.isArray(settings.agents) && settings.agents.length > 0 ||
  settings.agentConversations &&
  typeof settings.agentConversations == `object` &&
  Object.keys(settings.agentConversations).length > 0 ||
  String(settings.selectedAgentId || ``).trim();
