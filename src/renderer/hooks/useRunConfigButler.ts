// @ts-nocheck
/**
 * runConfigButler。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildConfigButlerToolContext, formatConfigButlerToolContext, validateAndRepairConfigButlerResult } from "../lib/config-butler";
import { extractJsonBlock } from "../lib/app-utils";
import { fetchDocAsPlainText } from "../lib/app-root-helpers";

export function useRunConfigButler(deps: any) {
  const {
    callConfigButlerModel,
    configButlerDocUrl,
    configButlerTargetCategory,
    configButlerTargetModel,
    getSelectedButlerTargetApiConfig,
    setConfigButlerLoading,
    setConfigButlerResultText,
    showToast2,
  } = deps;
  const runConfigButler = async () => {
          try {
            if (!configButlerDocUrl.trim() || !configButlerTargetModel.trim())
              throw Error(`请填写 API 文档链接和模型名称`);
            let targetApiConfig = getSelectedButlerTargetApiConfig();
            if (!targetApiConfig || !String(targetApiConfig.url || ``).trim() || !String(targetApiConfig.key || ``).trim())
              throw Error(`请先选择一个已填写 base URL 和 API Key 的统一 API 配置`);
            setConfigButlerLoading(true);
            let docText = await fetchDocAsPlainText(configButlerDocUrl.trim()),
              toolContext = buildConfigButlerToolContext(docText, configButlerDocUrl.trim(), {
                modelName: configButlerTargetModel.trim(),
                category: configButlerTargetCategory,
                apiUrl: String(targetApiConfig.url || ``).trim(),
              }),
              prompt = `你是“配置管家”，负责根据 API 文档为模型生成可直接应用的结构化配置。

请阅读下面的文档摘要，并结合给定模型名称、目标请求地址，输出严格 JSON，不要输出解释。

	要求：
	1. 协议名称必须使用官方格式命名，不要用渠道网站命名，例如“Gemini 图片原生”“OpenAI 图片原生”“Ark 图片原生”“OpenAI Chat 原生”“MiniMax 视频原生”。
		2. category 只能是 text、image、video、audio、music 之一，并优先与用户指定的模型类型保持一致；TTS、语音合成、配音、转写统一使用 audio；Suno、音乐生成、歌词、歌曲拼接统一使用 music。
		3. protocol.config 至少包含 category 和 requestType；requestType 优先使用工具预解析推断值，其次使用这些标准值之一：gemini-generate-content、openai-chat、openai-responses、openai-images、gpt-image-2-async、vectorengine-image-generation、ark-image-generation、openai-video、multipart-video、json-video、seedance-json、openai-audio-transcription、openai-audio-speech、suno-music；如有必要可补 submitPath、pollPath、fieldMapping、fieldValueTypes、authType、contentType、responseMapping。
	4. 如果文档中的请求示例或参数表显示字段类型有要求，请明确写进 fieldValueTypes，例如 { "seconds": "string" }。不要默认把所有数字字段都当 number。
		5. 必须生成“节点可执行”的配置，而不是只描述文档。按模型类型输出节点会实际使用的字段：
		   - text：submitPath、authType、contentType、headers/extraHeaders、fieldMapping(model/messages/prompt/input/temperature/responseFormat)、fieldValueTypes、extraBody、responseMapping.text。
		   - image：submitPath、editPath、fieldMapping(model/prompt/count/size/aspectRatio/responseFormat/referenceImage)、fieldValueTypes、extraBody、useAspectRatioAsSize、parameterAdapter、responseMapping.image。
		   - video：submitPath、pollPath、contentPath、fieldMapping(model/prompt/resolution/aspectRatio/duration/referenceImage/referenceVideo)、fieldValueTypes、extraBody、referenceImageMode、referenceImageAsArray、referenceImageItemShape、useAspectRatioAsSize、parameterAdapter、responseMapping.video。
		   - audio：submitPath、fieldMapping(model/file/input/voice/format/referenceAudio)、fieldValueTypes、extraBody、responseMapping.text 或 responseMapping.audio。
		   - music：Suno 类补充 submitPath、pollPath、fieldMapping(prompt/title/model/clip_id)、fieldValueTypes、extraBody、responseMapping.audio 和 responseMapping.taskId。
		6. 视频模型尤其注意 seconds / duration / resolution / size 的字段名和字段类型；如果文档示例里是字符串，就按字符串输出。若文档写明固定时长或固定尺寸，不要臆造 duration/seconds/size 字段；把对应 fieldMapping 设为空字符串或写 omitDuration/parameterAdapter。异步视频的任务占位符必须使用画布兼容写法 "{taskId}"；如果文档写 {video_id}、{task_id} 或 {id}，输出时统一改成 {taskId}。OpenAI Sora 兼容接口如果文档写 POST /v1/videos、GET /v1/videos/{id}、GET /v1/videos/{id}/content，则 submitPath/pollPath/contentPath 必须分别使用这些路径并把占位符写成 {taskId}；但如果同一文档还有 POST /v1/video/generations 等其他任务端点，必须按模型名、接口标题和 curl 示例拆成不同协议，不能强行统一到 /v1/videos。
			7. 视频节点界面可能同时有“分辨率”和“比例”，但请求体只能发送文档明确支持的字段；如果文档没有某个字段，请把对应 fieldMapping 设为空字符串，例如 "aspectRatio": "" 或 "resolution": ""，应用会跳过该字段。若文档要求把比例 9:16/16:9 写入 size 字段，请设置 "useAspectRatioAsSize": true 或 "fieldMapping": { "aspectRatio": "size", "size": "size" }。
		8. 图片/视频尺寸差异必须写 parameterAdapter。sizeValueMode/resolutionValueMode 可用 dimension、preset、aspect-ratio、quality、omit；aspectRatioValueMode 可用 ratio、dimension、preset、omit。图片模型文档要求真实尺寸（如 2560x1440）时用 sizeValueMode=dimension；文档要求 1K/2K + aspect_ratio 时用 sizeValueMode=preset 且 aspectRatioValueMode=ratio。只接受 720x1280 时用 dimension 并把 aspectRatioValueMode 设为 omit；接受 1K + 9:16 时用 sizeValueMode=preset 且 aspectRatioValueMode=ratio。
		9. 工具预解析结果来自 OpenAPI/Swagger、curl 示例和本地 dry-run 校验，优先级高于纯文本猜测；如果同一模型类型下出现多条 endpoint，必须以目标模型名为准选择最匹配接口。普通、逆向、pro、fast、portrait、landscape、gif、hd、4k 等后缀都可能代表不同链路或参数约束。
		10. 对输出做自检：dry-run 字段必须只包含文档明确支持的字段；submitPath/pollPath/contentPath 必须与该模型对应的接口示例一致；未出现在文档里的字段要省略，不能因为 UI 有该参数就发送。
		11. apiConfig.name 给出一个适合作为统一 API 配置名称的建议。
		12. 结果必须是一个 JSON 对象，结构如下：
{
  "modelName": "...",
  "category": "image",
  "apiConfig": { "name": "..." },
  "protocol": {
    "name": "Ark 图片原生",
    "config": {
      "category": "image",
      "requestType": "ark-image-generation",
      "submitPath": "/api/v3/images/generations",
      "fieldValueTypes": {}
    }
  },
  "notes": "..."
}

模型名称：${configButlerTargetModel.trim()}
模型类型：${configButlerTargetCategory}
目标请求地址：${String(targetApiConfig.url || ``).trim()}
文档链接：${configButlerDocUrl.trim()}

工具预解析结果：
${formatConfigButlerToolContext(toolContext)}

文档摘要：
${docText}`;
            let responseText = await callConfigButlerModel(prompt),
              repairedConfig = validateAndRepairConfigButlerResult(extractJsonBlock(responseText), {
                modelName: configButlerTargetModel.trim(),
                category: configButlerTargetCategory,
                apiUrl: String(targetApiConfig.url || ``).trim(),
                toolContext: toolContext,
              });
            setConfigButlerResultText(JSON.stringify({
              ...repairedConfig,
              toolContext: toolContext,
            }, null, 2));
          } catch (error) {
            (console.error(`Config butler failed`, error),
              showToast2(`配置管家分析失败：${error.message}`));
          } finally {
            setConfigButlerLoading(false);
          }
        };
  return { runConfigButler };
}
