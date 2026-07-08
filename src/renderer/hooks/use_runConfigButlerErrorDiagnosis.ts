// @ts-nocheck
/**
 * runConfigButlerErrorDiagnosis。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig, Bindings, Ref, SetAny } from "../lib/app-types";
import { buildConfigButlerToolContext, buildLocalConfigButlerErrorDiagnosis, formatConfigButlerToolContext, inferButlerCategoryFromModelName, normalizeButlerBaseUrl, normalizeConfigButlerDiagnosis, normalizeModelCategory, validateAndRepairConfigButlerResult } from "../lib/config-butler";
import { extractJsonBlock } from "../lib/app-utils";
import { fetchDocAsPlainText } from "../lib/app-root-helpers";

interface UseRunConfigButlerErrorDiagnosisDeps {
  activeStoredGlobalConfigId: any;
  apiConfigs: ApiConfig[];
  audioModelProtocolBindings: Bindings;
  callConfigButlerModel: any;
  configButlerDocUrl: any;
  configButlerErrorAssistantInFlightRef: Ref;
  imageModelProtocolBindings: Bindings;
  modelProtocolRegistry: Bindings;
  setConfigButlerErrorAssistant: SetAny;
  storedGlobalConfigs: any;
  textModelProtocolBindings: Bindings;
  videoModelProtocolBindings: Bindings;
}

export function use_runConfigButlerErrorDiagnosis(deps: UseRunConfigButlerErrorDiagnosisDeps) {
  const {
    activeStoredGlobalConfigId,
    apiConfigs,
    audioModelProtocolBindings,
    callConfigButlerModel,
    configButlerDocUrl,
    configButlerErrorAssistantInFlightRef,
    imageModelProtocolBindings,
    modelProtocolRegistry,
    setConfigButlerErrorAssistant,
    storedGlobalConfigs,
    textModelProtocolBindings,
    videoModelProtocolBindings,
  } = deps;
  const runConfigButlerErrorDiagnosis = async (diagnosisContext, diagnosisOptions) => {
		              let task = diagnosisContext?.task || {},
		                modelCategory = normalizeModelCategory(task.type || task.customOutputType) || inferButlerCategoryFromModelName(task.modelName || ``),
		                protocolDefinition =
		                task.apiConfigId ?
		                apiConfigs.find((item) => item.id === task.apiConfigId) :
		                apiConfigs.find((item) => normalizeButlerBaseUrl(item.url).toLowerCase() === normalizeButlerBaseUrl(task.apiBaseUrl || ``).toLowerCase()),
		                protocolCategory = modelCategory === `text` ?
		                textModelProtocolBindings?.[task.modelName] :
		                modelCategory === `image` ?
		                imageModelProtocolBindings?.[task.modelName] :
		                modelCategory === `video` ?
		                videoModelProtocolBindings?.[task.modelName] :
		                modelCategory === `audio` || modelCategory === `music` || modelCategory === `tts-music` ?
		                audioModelProtocolBindings?.[task.modelName] :
		                ``,
		                protocolConfig = protocolCategory ? modelProtocolRegistry?.[protocolCategory] : null,
		                requestId = `` + Date.now();
		              setConfigButlerErrorAssistant({
		                ...diagnosisContext,
		                id: requestId,
		                status: `checking`,
			                title: `配置管家正在排查最新失败`,
		                diagnosis: null,
		              });
		              try {
		                let promptText = ``,
		                  suggestedConfig = null,
		                  activeGlobalConfig = (storedGlobalConfigs || []).find((item) => item.id === activeStoredGlobalConfigId),
		                  apiDocUrl = String(activeGlobalConfig?.apiDocUrl || activeGlobalConfig?.config?.apiDocUrl || activeGlobalConfig?.config?.configButlerDocUrl || configButlerDocUrl || ``).trim();
		                if (apiDocUrl) {
		                  promptText = await Promise.race([
		                    fetchDocAsPlainText(apiDocUrl),
		                    new Promise((resolvePromise) => setTimeout(() => resolvePromise(``), 6e4)),
		                  ]);
		                  suggestedConfig = buildConfigButlerToolContext(promptText, apiDocUrl, {
		                    modelName: task.modelName,
		                    category: modelCategory,
		                    apiUrl: task.apiBaseUrl || protocolDefinition?.url || ``,
		                  });
		                }
			                let systemPrompt = `你是万卷灵境的配置管家故障诊断器。用户手动点击错误查询，需要排查任务清单中最新一次失败任务。

请基于任务上下文、当前软件协议配置、错误信息、API 文档摘要和万卷灵境工作流判断原因。
只输出 JSON，不要解释。字段：
{
  "classification": "upstream" | "request_config" | "model_code" | "unknown",
  "confidence": 0-1,
  "summary": "一句话结论",
  "evidence": ["证据1", "证据2"],
  "suggestedFix": "具体修复办法",
  "shouldApplyPatch": true/false,
  "suggestedProtocol": {
    "name": "可选协议名",
    "config": {}
  }
}

判断规则：
- 如果错误主要是 500/502/503/504/429、上游超时、通道繁忙，且请求路径/字段与文档一致，classification=upstream，只报告结果，不建议应用修复。
- 如果路径、请求体字段、字段类型、异步轮询路径、任务 ID 映射、图片/视频分辨率和比例映射与文档不一致，classification=request_config，并给出 suggestedProtocol。
- 如果软件当前工作流缺少必要数据或节点代码层面无法表达文档要求，classification=model_code，并说明需要改哪里。
- 如果任务上下文 requestProfile.submitUrl 已经是 http/https 完整 URL，而错误信息里只引用 POST /xxx 路径，不要误判为前端没有拼接 baseUrl；这通常是上游对 endpoint/平台路由不接受，优先按 request_config 或 upstream 判断。
- 只有当 suggestedProtocol.config 能实际改变 submitPath/pollPath/字段映射/字段类型时，shouldApplyPatch 才能为 true；如果只是需要修改软件源码，不要给应用修复。
- suggestedProtocol.config 必须是万卷灵境可用协议配置，包含 category/requestType/submitPath/pollPath/fieldMapping/fieldValueTypes/parameterAdapter/responseMapping 等必要字段。

任务上下文：
${JSON.stringify({
  taskId: task.id,
  projectId: task.projectId,
  nodeId: task.nodeId,
  category: modelCategory,
  modelName: task.modelName,
  apiBaseUrl: task.apiBaseUrl || protocolDefinition?.url || ``,
  apiConfigName: protocolDefinition?.name || ``,
  prompt: task.prompt,
  requestProfile: task.requestProfile || {},
  errorMsg: task.errorMsg,
}, null, 2)}

当前绑定协议名：${protocolCategory || `未绑定`}
当前协议配置：
${JSON.stringify(protocolConfig || task.requestProfile || {}, null, 2)}

工具解析结果：
${suggestedConfig ? formatConfigButlerToolContext(suggestedConfig) : `未配置或未读取 API 文档`}

API 文档摘要：
${String(promptText || ``).slice(0, 5e4)}`;
		                let diagnosisRaw = await Promise.race([
		                    callConfigButlerModel(systemPrompt),
		                    new Promise((resolvePromise, rejectPromise) => setTimeout(() => rejectPromise(Error(`配置管家诊断超时，已切换本地规则诊断`)), 12e4)),
		                  ]),
		                  jsonBlock = extractJsonBlock(diagnosisRaw),
		                  suggestedConfigFromModel = jsonBlock?.suggestedProtocol?.config ?
		                  validateAndRepairConfigButlerResult({
		                    modelName: task.modelName,
		                    category: modelCategory,
		                    protocol: jsonBlock.suggestedProtocol,
		                  }, {
		                    modelName: task.modelName,
		                    category: modelCategory,
		                    apiUrl: task.apiBaseUrl || protocolDefinition?.url || ``,
		                    toolContext: suggestedConfig,
		                  }) :
		                  null,
			                  repairedDiagnosis = {
			                    classification: jsonBlock.classification || `unknown`,
			                    confidence: Number(jsonBlock.confidence) || 0,
			                    summary: jsonBlock.summary || `诊断完成`,
			                    evidence: Array.isArray(jsonBlock.evidence) ? jsonBlock.evidence.slice(0, 5) : [],
			                    suggestedFix: jsonBlock.suggestedFix || ``,
			                    shouldApplyPatch: jsonBlock.shouldApplyPatch === true,
			                    suggestedProtocol: suggestedConfigFromModel?.protocol || jsonBlock.suggestedProtocol || null,
			                  };
			                repairedDiagnosis = normalizeConfigButlerDiagnosis(repairedDiagnosis, task, suggestedConfig, protocolConfig);
			                setConfigButlerErrorAssistant((prevAssistant) =>
			                  prevAssistant?.id === requestId ? {
		                    ...prevAssistant,
		                    status: `ready`,
		                    diagnosis: repairedDiagnosis,
		                  } : prevAssistant,
		                );
		              } catch (error) {
			                let localDiagnosis = normalizeConfigButlerDiagnosis(buildLocalConfigButlerErrorDiagnosis(task, error?.message || error), task, null, protocolConfig);
		                setConfigButlerErrorAssistant((prevAssistant) =>
		                  prevAssistant?.id === requestId ? {
		                    ...prevAssistant,
		                    status: `ready`,
		                    diagnosis: localDiagnosis,
		                    diagnosticError: error?.message || String(error),
		                  } : prevAssistant,
		                );
		              } finally {
		                configButlerErrorAssistantInFlightRef.current.delete(diagnosisOptions);
		              }
		            };
  return { runConfigButlerErrorDiagnosis };
}
