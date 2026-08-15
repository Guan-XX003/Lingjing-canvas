// @ts-nocheck
/**
 * runConfigButlerBatch。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { buildConfigButlerToolContext, configButlerCategoryOptions, formatConfigButlerToolContext, inferButlerCategoryFromModelName, normalizeButlerBatchItems, normalizeModelCategory, probeButlerProtocol, scanButlerTargetModels, specializeConfigButlerToolContext } from "../lib/config-butler";
import { extractJsonBlock } from "../lib/app-utils";
import { fetchDocAsPlainText } from "../lib/app-root-helpers";

interface UseRunConfigButlerBatchDeps {
  applyConfigButlerBatchResults: any;
  callConfigButlerModel: any;
  configButlerDocUrl: any;
  getSelectedButlerTargetApiConfig: any;
  setConfigButlerBatchActiveCategory: SetAny;
  setConfigButlerBatchItems: SetAny;
  setConfigButlerBatchLoading: SetAny;
  setConfigButlerBatchModalOpen: SetAny;
  setConfigButlerResultText: SetAny;
  showToast2: Toast;
}

export function useRunConfigButlerBatch(deps: UseRunConfigButlerBatchDeps) {
  const {
    applyConfigButlerBatchResults,
    callConfigButlerModel,
    configButlerDocUrl,
    getSelectedButlerTargetApiConfig,
    setConfigButlerBatchActiveCategory,
    setConfigButlerBatchItems,
    setConfigButlerBatchLoading,
    setConfigButlerBatchModalOpen,
    setConfigButlerResultText,
    showToast2,
  } = deps;
  const runConfigButlerBatch = async (options = {}) => {
	          try {
	            let docUrlForBatch = String(options.docUrl || configButlerDocUrl || ``).trim();
	            if (!docUrlForBatch) throw Error(`请填写 API 文档链接`);
	            let targetApiConfig = options.apiConfig || getSelectedButlerTargetApiConfig();
	            if (!targetApiConfig || !String(targetApiConfig.url || ``).trim() || !String(targetApiConfig.key || ``).trim())
	              throw Error(`请先选择一个已填写 base URL 和 API Key 的统一 API 配置`);
	            setConfigButlerBatchLoading(true);
	            let scannedModels = Array.isArray(options.models) && options.models.length ?
	              options.models :
	              await scanButlerTargetModels({ apiConfig: targetApiConfig }),
	              docText = await fetchDocAsPlainText(docUrlForBatch),
	              toolContext = buildConfigButlerToolContext(docText, docUrlForBatch, {
	                apiUrl: String(targetApiConfig.url || ``).trim(),
	              }),
	              basePrompt = `你是“配置管家”的全局批量模式，负责根据 API 文档和模型列表，为每个模型生成可直接应用到StarCanvas的结构化配置。

请阅读文档摘要，并对下面模型列表逐个判断类型和请求协议。输出严格 JSON，不要解释。

要求：
1. models 必须尽量覆盖给出的全部模型。每个模型输出 modelName、category、apiConfig、protocol、notes。
2. category 只能是 text、image、video、audio、music；TTS、语音合成、配音、转写统一归为 audio；Suno、音乐生成、歌词、歌曲拼接统一归为 music。
3. protocol.config 至少包含 category 和 requestType；requestType 优先使用工具预解析推断值，其次使用 gemini-generate-content、openai-chat、openai-responses、openai-images、gpt-image-2-async、vectorengine-image-generation、ark-image-generation、openai-video、multipart-video、json-video、seedance-json、openai-audio-transcription、openai-audio-speech、suno-music。
4. 必须生成节点可执行配置，不要只描述文档。请按模型类型补充 submitPath、pollPath、contentPath、fieldMapping、fieldValueTypes、extraBody、responseMapping 等必要字段。
5. 如果文档显示字段值必须是字符串，请明确写入 fieldValueTypes；视频模型尤其注意 seconds、duration、resolution、size 的字段名和类型。若文档写明固定时长或固定尺寸，不要臆造 duration/seconds/size 字段；把对应 fieldMapping 设为空字符串或写 omitDuration/parameterAdapter。
6. 异步视频任务占位符统一使用 "{taskId}"。如果文档没有某个可选字段，请把对应 fieldMapping 设为空字符串，应用会跳过该字段。
7. 图片/视频尺寸差异必须写 parameterAdapter。sizeValueMode/resolutionValueMode 可用 dimension、preset、aspect-ratio、quality、omit；aspectRatioValueMode 可用 ratio、dimension、preset、omit。图片模型文档要求真实尺寸（如 2560x1440）时用 sizeValueMode=dimension；文档要求 1K/2K + aspect_ratio 时用 sizeValueMode=preset 且 aspectRatioValueMode=ratio。只接受 720x1280 时用 dimension 并把 aspectRatioValueMode 设为 omit；接受 1K + 9:16 时用 sizeValueMode=preset 且 aspectRatioValueMode=ratio。
8. 工具预解析结果来自 OpenAPI/Swagger、curl 示例和本地 dry-run 校验，优先级高于纯文本猜测；但如果同一文档同时出现多个视频任务端点，例如 POST /v1/video/generations 与 POST /v1/videos，必须根据模型名、接口标题、示例 curl、路径语义分别生成协议和模型绑定，不要把同一类模型全部合并到一个 endpoint。普通、逆向、pro、fast、portrait、landscape、gif、hd、4k 等后缀都可能代表不同链路或参数约束。
9. 对每个生成的协议做自检：dry-run 字段必须只包含文档明确支持的字段；submitPath/pollPath/contentPath 必须与该模型对应的接口示例一致；未出现在文档里的字段要省略，不能因为 UI 有该参数就发送。
10. apiConfig.name 给出适合作为统一 API 配置名称的建议。

输出结构：
{
  "models": [
    {
      "modelName": "...",
      "category": "image",
      "apiConfig": { "name": "..." },
      "protocol": {
        "name": "OpenAI 图片原生",
        "config": {
          "category": "image",
          "requestType": "openai-images",
          "submitPath": "/v1/images/generations",
          "fieldValueTypes": {}
        }
      },
      "notes": "..."
    }
  ]
}

目标请求地址：${String(targetApiConfig.url || ``).trim()}
文档链接：${docUrlForBatch}

工具预解析结果：
${formatConfigButlerToolContext(toolContext)}

模型列表：
${scannedModels.map((modelName) => `- ${modelName}`).join(`
`)}

文档摘要：
${docText}`;
		            let batchDocText = docText.length > 5e4 ? `${docText.slice(0, 5e4)}

[文档过长，配置管家已截断剩余 ${docText.length - 5e4} 字符；结构化端点和 curl 示例已保留在工具预解析结果中。]` : docText,
		              fullModelListText = scannedModels.map((modelName) => `- ${modelName}`).join(`
`),
		              buildModelToolHints = (modelNames) => modelNames.map((modelName) => {
		                let category = inferButlerCategoryFromModelName(modelName),
		                  itemContext = specializeConfigButlerToolContext(toolContext, {
		                    modelName: modelName,
		                    category: category,
		                    apiUrl: String(targetApiConfig.url || ``).trim(),
		                  });
		                return `- ${modelName}: category=${category}, requestType候选=${itemContext?.inferredRequestType || `custom`}`;
		              }).join(`\n`),
		              batchChunks = [];
	            for (let chunkStart = 0; chunkStart < scannedModels.length; chunkStart += 25) batchChunks.push(scannedModels.slice(chunkStart, chunkStart + 25));
	            let batchItems = [],
	              batchRawResults = [],
	              batchFailedChunks = [],
		              buildBatchPrompt = ((modelName, batchIndex, batchTotal) =>
		                basePrompt
		                .replace(`模型列表：
${fullModelListText}`, `模型列表（第 ${batchIndex + 1}/${batchTotal} 批，仅分析本批模型）：
${modelName.map((modelName2) => `- ${modelName2}`).join(`
`)}`)
		                .replace(`工具预解析结果：
${formatConfigButlerToolContext(toolContext)}`, `工具预解析结果：
${formatConfigButlerToolContext(toolContext)}

逐模型工具候选（仅用于缩小范围，最终仍以对应端点和请求示例为准）：
${buildModelToolHints(modelName)}`)
		                .replace(`文档摘要：
${docText}`, `文档摘要：
${batchDocText}`));
	            for (let batchIndex = 0; batchIndex < batchChunks.length; batchIndex++) {
	              let chunkModels = batchChunks[batchIndex],
	                batchResult = null;
		            if (options.enableLiveProbe === true) try {
	                showToast2(`配置管家正在分析第 ${batchIndex + 1}/${batchChunks.length} 批模型`);
	                let responseText = await callConfigButlerModel(buildBatchPrompt(chunkModels, batchIndex, batchChunks.length), options.butlerConfig || {});
	                batchResult = extractJsonBlock(responseText);
	                batchRawResults.push({
	                  batch: batchIndex + 1,
	                  result: batchResult,
	                });
	              } catch (error) {
	                console.warn(`Config butler batch chunk failed`, batchIndex + 1, error);
	                batchFailedChunks.push({
	                  batch: batchIndex + 1,
	                  models: chunkModels,
	                  error: error?.message || String(error),
	                });
	                batchResult = {
	                  models: []
	                };
	              }
	              batchItems.push(...normalizeButlerBatchItems(batchResult, chunkModels, {
	                apiUrl: String(targetApiConfig.url || ``).trim(),
	                toolContext: toolContext,
	              }));
	            }
	            let rawBatchResult = {
	                models: batchItems,
	                batches: batchRawResults,
	                failedChunks: batchFailedChunks,
	              },
	              normalizedBatchItems = normalizeButlerBatchItems(rawBatchResult, scannedModels, {
	                apiUrl: String(targetApiConfig.url || ``).trim(),
	                toolContext: toolContext,
	              });
	            if (!normalizedBatchItems.length) throw Error(`未识别到可导入的模型配置`);
	            // 真实探活校验 + 自动修协议：对同步类(text/image)按 requestType+submitPath 去重，每组探一个代表，
	            // 探到参数不被接受就把该组所有模型协议 fieldMapping 里的坏参数设空 → 数据驱动修复，无需代码硬编码。
	            try {
	              let probeApiUrl = String(targetApiConfig.url || ``).trim(),
	                probeApiKey = String(targetApiConfig.key || ``).trim(),
	                probeGroups = new Map();
	              for (let item of normalizedBatchItems) {
	                let cat = normalizeModelCategory(item.category);
	                if (cat !== `text` && cat !== `image`) continue;
	                let cfg = item.protocol?.config || {}, groupKey = `${cat}|${cfg.requestType || ``}|${cfg.submitPath || ``}`;
	                if (!probeGroups.has(groupKey)) probeGroups.set(groupKey, []);
	                probeGroups.get(groupKey).push(item);
	              }
	              if (probeGroups.size && probeApiUrl && probeApiKey) {
	                showToast2(`配置管家正在真实探活校验 ${probeGroups.size} 组接口…`);
	                let fixedCount = 0;
	                for (let [, groupItems] of probeGroups) {
	                  let rep = groupItems[0];
	                  let probeResult = await probeButlerProtocol(rep.protocol?.config || {}, { modelName: rep.modelName, category: rep.category }, probeApiUrl, probeApiKey).catch(() => null);
	                  if (probeResult?.probed && !probeResult.ok && probeResult.errorType === `unknown_parameter` && probeResult.unknownParameter) {
	                    let badParam = probeResult.unknownParameter;
	                    for (let item of groupItems) {
	                      let cfg = item.protocol?.config; if (!cfg) continue;
	                      let fieldMapping = cfg.fieldMapping && typeof cfg.fieldMapping == `object` ? { ...cfg.fieldMapping } : {}, touched = false;
	                      for (let internalKey of Object.keys(fieldMapping)) { if (fieldMapping[internalKey] === badParam) { fieldMapping[internalKey] = ``; touched = true; } }
	                      if (badParam === `response_format`) { fieldMapping.responseFormat = ``; touched = true; }
	                      if (touched) {
	                        item.protocol.config = { ...cfg, fieldMapping: fieldMapping };
	                        item.notes = `${item.notes || ``}${item.notes ? `；` : ``}探活修复：该接口不接受 ${badParam}，已在协议中跳过该参数`;
	                        fixedCount += 1;
	                      }
	                    }
	                  } else if (probeResult?.probed && !probeResult.ok && probeResult.suggestion) {
	                    rep.notes = `${rep.notes || ``}${rep.notes ? `；` : ``}探活提示：${probeResult.suggestion}`;
	                  }
	                }
	                fixedCount && showToast2(`探活已自动修复 ${fixedCount} 个模型的协议参数`);
	              }
	            } catch (probeError) { console.warn(`Config butler probe skipped`, probeError); }
		            if (options.autoApply && options.allowUnreviewedApply === true && normalizedBatchItems.every((item) => item.enabled !== false && item.validation?.ok !== false && item.inferenceSource !== `fallback`)) {
	              setConfigButlerBatchItems(normalizedBatchItems);
	              let applyResult = applyConfigButlerBatchResults({
	                items: normalizedBatchItems,
	                apiConfig: targetApiConfig,
	                docUrl: docUrlForBatch,
	                silentToast: options.silentToast,
	              });
	              setConfigButlerBatchModalOpen(false);
	              return {
	                items: normalizedBatchItems,
	                applyResult: applyResult,
	                scannedModels: scannedModels,
	                failedChunks: batchFailedChunks,
	              };
	            }
	            (setConfigButlerBatchItems(normalizedBatchItems),
	              setConfigButlerBatchActiveCategory(
	                (configButlerCategoryOptions.find((categoryOption) =>
	                  normalizedBatchItems.some((item) => normalizeModelCategory(item.category) === categoryOption.value),
	                ) || configButlerCategoryOptions[0]).value,
	              ),
	              setConfigButlerResultText(JSON.stringify({
	                ...rawBatchResult,
	                models: normalizedBatchItems,
	                toolContext: toolContext,
	              }, null, 2)),
	              setConfigButlerBatchModalOpen(true),
		              showToast2(options.autoApply ?
		                `已识别 ${normalizedBatchItems.length} 个模型，其中有未验证或兜底配置，请确认后导入` :
		                `已识别 ${normalizedBatchItems.length} 个模型，请确认后导入`));
	            return {
	              items: normalizedBatchItems,
	              scannedModels: scannedModels,
	              failedChunks: batchFailedChunks,
	            };
	          } catch (error) {
	            (console.error(`Config butler batch failed`, error),
	              showToast2(`批量配置分析失败：${error.message}`));
	          } finally {
	            setConfigButlerBatchLoading(false);
	          }
	        };
  return { runConfigButlerBatch };
}
