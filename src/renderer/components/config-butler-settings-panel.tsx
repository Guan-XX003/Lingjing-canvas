/** 配置管家设置面板（configButlerExpanded，含预设/代理/单条模式等）。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { WanJuanConfigButlerHelp } from "./config-butler-help";
declare const chrome: any;

export function WanJuanConfigButlerSettingsPanel({
  activeStoredGlobalConfigId,
  apiConfigs,
  applyConfigButlerResult,
  applyStoredGlobalConfig,
  configButlerAgentExpanded,
  configButlerApiKey,
  configButlerApiUrl,
  configButlerBatchItems,
  configButlerBatchLoading,
  configButlerDocUrl,
  configButlerLoading,
  configButlerMode,
  configButlerModel,
  configButlerProtocol,
  configButlerResultText,
  configButlerTargetApiConfigId,
  configButlerTargetCategory,
  configButlerTargetModel,
  extractJsonBlock,
  globalConfigPresetsExpanded,
  runConfigButler,
  runConfigButlerBatch,
  saveStoredGlobalConfigApiDocUrl,
  setActiveStoredGlobalConfigId,
  setConfigButlerAgentExpanded,
  setConfigButlerApiKey,
  setConfigButlerApiUrl,
  setConfigButlerBatchModalOpen,
  setConfigButlerDocUrl,
  setConfigButlerMode,
  setConfigButlerModel,
  setConfigButlerProtocol,
  setConfigButlerResultText,
  setConfigButlerTargetApiConfigId,
  setConfigButlerTargetCategory,
  setConfigButlerTargetModel,
  setGlobalConfigPresetsExpanded,
  setStoredGlobalConfigs,
  showToast2,
  storedGlobalConfigs,
}: any) {
  return jsxs(`div`, {
	                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body wanjuan-config-butler-body`,
	                                children: [
	                                  false &&
	                                  configButlerMode === `batch` &&
	                                  jsxs(`div`, {
	                                    className: `bg-gradient-to-r from-[#14213d] via-[#121826] to-[#23172a] border border-blue-400/55 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(96,165,250,0.12),0_16px_34px_rgba(37,99,235,0.18)]`,
	                                    children: [
	                                      jsxs(`button`, {
	                                        type: `button`,
	                                        onClick: () => setGlobalConfigPresetsExpanded((prev) => !prev),
	                                        className: `w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors`,
	                                        children: [
	                                          jsxs(`span`, {
	                                            className: `flex min-w-0 items-center gap-2`,
	                                            children: [
	                                              jsx(`span`, {
	                                                className: `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-sm text-blue-100 ring-1 ring-blue-300/35`,
	                                                children: `⚙️`,
	                                              }),
	                                              jsxs(`span`, {
	                                                className: `min-w-0`,
	                                                children: [
	                                                  jsxs(`span`, {
	                                                    className: `flex min-w-0 items-center gap-2`,
	                                                    children: [
	                                                      jsx(`span`, {
	                                                        className: `text-sm font-semibold text-white`,
	                                                        children: `已存储全局配置`,
	                                                      }),
	                                                      jsx(`span`, {
	                                                        className: `rounded-full border border-blue-300/35 bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-100`,
	                                                        children: `${(storedGlobalConfigs || []).length || 0} 个`,
	                                                      }),
	                                                    ],
	                                                  }),
	                                                  activeStoredGlobalConfigId &&
	                                                  (storedGlobalConfigs || []).find((config) => config.id === activeStoredGlobalConfigId) &&
	                                                  jsx(`span`, {
	                                                    className: `mt-0.5 block truncate text-[11px] text-blue-100/75`,
	                                                    children: `当前：${(storedGlobalConfigs || []).find((config) => config.id === activeStoredGlobalConfigId)?.name || ``}`,
	                                                  }),
	                                                ],
	                                              }),
	                                            ],
	                                          }),
	                                          jsx(`span`, {
	                                            className: `shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white`,
	                                            children: globalConfigPresetsExpanded ? `收起` : `展开`,
	                                          }),
	                                        ],
	                                      }),
	                                      globalConfigPresetsExpanded &&
	                                      jsxs(`div`, {
	                                        className: `px-4 pb-4 space-y-3 border-t border-blue-300/20 bg-[#10131c]/82`,
	                                        children: [
	                                          jsxs(`div`, {
	                                            className: `grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 pt-3`,
	                                            children: [
	                                              jsx(`select`, {
	                                                className: `w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
	                                                value: activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
	                                                onChange: (event) => {
	                                                  let selectedId = event.target.value,
	                                                    selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === selectedId);
	                                                  setActiveStoredGlobalConfigId(selectedId);
	                                                  selectedConfig && setConfigButlerDocUrl(String(selectedConfig.apiDocUrl || selectedConfig.config?.apiDocUrl || selectedConfig.config?.configButlerDocUrl || ``));
	                                                },
	                                                children: (storedGlobalConfigs || []).length ?
	                                                (storedGlobalConfigs || []).map((config) =>
	                                                  jsx(
	                                                    `option`, {
	                                                      value: config.id,
	                                                      children: config.name,
	                                                    },
	                                                    config.id,
	                                                  ),
	                                                ) :
	                                                jsx(`option`, {
	                                                  value: ``,
	                                                  children: `暂无已存储配置`,
	                                                }),
	                                              }),
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                onClick: () => applyStoredGlobalConfig(activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``)),
	                                                disabled: !(storedGlobalConfigs || []).length,
	                                                className: `px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors`,
	                                                children: `应用配置`,
	                                              }),
	                                            ],
	                                          }),
	                                          jsxs(`div`, {
	                                            className: `grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2`,
	                                            children: [
	                                              jsx(`input`, {
	                                                className: `w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
	                                                value: (() => {
	                                                  let configId = activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
	                                                    selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
	                                                  return String(selectedConfig?.apiDocUrl || selectedConfig?.config?.apiDocUrl || selectedConfig?.config?.configButlerDocUrl || configButlerDocUrl || ``);
	                                                })(),
	                                                onChange: (event) => {
	                                                  let configId = activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
	                                                    newValue = String(event.target.value || ``);
	                                                  setConfigButlerDocUrl(newValue);
	                                                  setStoredGlobalConfigs((prev) =>
	                                                    (prev || []).map((config) =>
	                                                      config.id === configId ? {
	                                                        ...config,
	                                                        apiDocUrl: newValue,
	                                                        config: {
	                                                          ...(config.config || {}),
	                                                          apiDocUrl: newValue,
	                                                          configButlerDocUrl: newValue,
	                                                        },
	                                                      } : config,
	                                                    ),
	                                                  );
	                                                },
	                                                placeholder: `全局配置 API 文档链接，例如 https://dguhm2n0pd.apifox.cn/`,
	                                              }),
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                onClick: () => {
	                                                  let configId = activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
	                                                    selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
	                                                  saveStoredGlobalConfigApiDocUrl(configId, selectedConfig?.apiDocUrl || selectedConfig?.config?.apiDocUrl || selectedConfig?.config?.configButlerDocUrl || configButlerDocUrl || ``);
	                                                },
	                                                disabled: !(storedGlobalConfigs || []).length,
	                                                className: `px-3 py-2 rounded-lg bg-[#222] text-gray-200 text-xs font-medium hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors`,
	                                                children: `保存文档链接`,
	                                              }),
	                                            ],
	                                          }),
	                                          jsx(`div`, {
	                                            className: `text-[11px] text-gray-500`,
	                                            children: `切换会同步模型列表、API 绑定、协议配置和图片/视频参数适配规则；错误查询会优先读取当前已存储配置的 API 文档链接。`,
	                                          }),
	                                        ],
	                                      }),
	                                    ],
	                                  }),
	                                  jsxs(`div`, {
	                                    className: `flex items-center justify-between gap-3 wanjuan-config-butler-agent-summary`,
                                    children: [
                                      jsx(`div`, {
                                        className: `text-[11px] text-gray-500`,
                                        children: `基础智能体设置可按需手动修改，不随全局配置切换变化。`,
                                      }),
                                      jsx(`button`, {
                                        type: `button`,
                                        onClick: () =>
                                          setConfigButlerAgentExpanded(
                                            (event) => !event,
                                          ),
                                        className: `px-3 py-1 rounded-lg border border-[#333] text-xs text-gray-300 hover:bg-[#222] transition-colors`,
                                        children: configButlerAgentExpanded ?
                                          `收起基础智能体设置` :
                                          `展开基础智能体设置`,
                                      }),
                                    ],
                                  }),
                                  configButlerAgentExpanded &&
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-4 gap-3 wanjuan-config-butler-agent-fields`,
                                    children: [
	                                      jsxs(`div`, {
	                                        children: [
	                                          jsx(`label`, {
	                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
                                            children: [
                                              `基础智能体请求地址`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                title: `基础智能体请求地址`,
                                                placement: `below-start`,
                                                children: `填写中转站的 Base URL，一般在 API 文档、接入地址、接口地址里复制。常见格式是 https://xxx.com，不要填模型名，也不要填完整的 /v1/chat/completions。`,
                                              }),
                                            ],
                                          }),
                                          jsx(`input`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerApiUrl,
                                            onChange: (event) =>
                                              setConfigButlerApiUrl(
                                                event.target.value,
                                              ),
                                            placeholder: `https://your-llm-gateway.com`,
                                          }),
                                        ],
                                      }),
	                                      jsxs(`div`, {
	                                        children: [
	                                          jsx(`label`, {
	                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
                                            children: [
                                              `基础智能体 API Key`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                tone: `warning`,
                                                title: `基础智能体 API Key`,
                                                placement: `below-start`,
                                                children: `填写中转站后台生成的 API Key / Token，通常在“API 密钥”“令牌”“Token”页面创建。它只用于配置管家分析文档，不会自动覆盖其他模型配置。`,
                                              }),
                                            ],
                                          }),
                                          jsx(`input`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerApiKey,
                                            onChange: (event) =>
                                              setConfigButlerApiKey(
                                                event.target.value,
                                              ),
                                            placeholder: `sk-...`,
                                          }),
                                        ],
                                      }),
                                      jsxs(`div`, {
                                        children: [
                                          jsx(`label`, {
                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
                                            children: [
                                              `基础智能体协议`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                title: `基础智能体协议`,
                                                placement: `below-start`,
                                                children: `大多数中转站选择 OpenAI。只有服务商明确提供 Gemini 原生接口时再选 Gemini；不确定时选 OpenAI。`,
                                              }),
                                            ],
                                          }),
                                          jsxs(`select`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerProtocol,
                                            onChange: (event) =>
                                              setConfigButlerProtocol(
                                                event.target.value,
                                              ),
                                            children: [
                                              jsx(`option`, {
                                                value: `gemini`,
                                                children: `Gemini`,
                                              }),
                                              jsx(`option`, {
                                                value: `openai`,
                                                children: `OpenAI`,
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      jsxs(`div`, {
                                        children: [
                                          jsx(`label`, {
                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
                                            children: [
                                              `基础智能体模型名`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                title: `基础智能体模型名`,
                                                placement: `below-end`,
                                                children: `配置管家用这个模型阅读 API 文档并生成配置。留空时默认使用 gpt-5.5；如果中转站没有这个模型，就填一个可用的文本或多模态文本模型 ID。`,
                                              }),
                                            ],
                                          }),
                                          jsx(`input`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerModel,
                                            onChange: (event) =>
                                              setConfigButlerModel(
                                                event.target.value,
                                              ),
                                            placeholder: `留空时默认使用 gpt-5.5`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
		                                  jsxs(`div`, {
	                                    className: `flex items-center gap-2 bg-[#121212] border border-[#333] rounded-lg p-1 wanjuan-config-butler-mode-tabs`,
	                                    children: [
	                                      jsx(`button`, {
	                                        type: `button`,
	                                        onClick: () => setConfigButlerMode(`single`),
	                                        className: `wj-mode-tab flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${configButlerMode === `single` ? `wj-mode-tab-active bg-blue-600 text-white` : `text-gray-400 hover:bg-[#222] hover:text-gray-200`}`,
	                                        children: `基础单模型模式`,
	                                      }),
	                                      jsx(`button`, {
	                                        type: `button`,
	                                        onClick: () => setConfigButlerMode(`batch`),
	                                        className: `wj-mode-tab flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${configButlerMode === `batch` ? `wj-mode-tab-active bg-blue-600 text-white` : `text-gray-400 hover:bg-[#222] hover:text-gray-200`}`,
	                                        children: `全局批量模式`,
	                                      }),
	                                    ],
	                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-3 gap-3`,
                                    children: [
                                      jsxs(`div`, {
                                        children: [
                                          jsx(`label`, {
                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
                                            children: [
                                              `API 文档链接`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                tone: `warning`,
                                                title: `API 文档链接`,
                                                placement: `below-start`,
                                                children: `填写中转站的 API 文档链接，不是官网首页。最好是包含模型列表、请求示例、参数说明的页面，例如 Apifox 文档、llms.txt 或 OpenAPI 文档。`,
                                              }),
                                            ],
                                          }),
                                          jsx(`input`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerDocUrl,
                                            onChange: (event) =>
                                              setConfigButlerDocUrl(
                                                event.target.value,
                                              ),
                                            placeholder: `粘贴服务商 API 文档链接`,
                                          }),
                                        ],
                                      }),
	                                      configButlerMode === `single` &&
	                                      jsxs(`div`, {
	                                        children: [
	                                          jsx(`label`, {
	                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
	                                            children: [
                                              `模型类型`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                title: `模型类型`,
                                                placement: `below-start`,
                                                children: `告诉配置管家你要配置哪一类模型。视频生成选视频，图片生成选图片，聊天或多模态理解模型选文本。`,
                                              }),
                                            ],
                                          }),
                                          jsxs(`select`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerTargetCategory,
                                            onChange: (event) =>
                                              setConfigButlerTargetCategory(
                                                event.target.value,
                                              ),
                                            children: [
                                              jsx(`option`, {
                                                value: `text`,
                                                children: `文本`,
                                              }),
                                              jsx(`option`, {
                                                value: `image`,
                                                children: `图片`,
                                              }),
                                              jsx(`option`, {
                                                value: `video`,
                                                children: `视频`,
                                              }),
	                                              jsx(`option`, {
	                                                value: `audio`,
	                                                children: `音频`,
	                                              }),
	                                              jsx(`option`, {
	                                                value: `music`,
	                                                children: `音乐`,
	                                              }),
	                                            ],
                                          }),
                                        ],
                                      }),
	                                      configButlerMode === `single` &&
	                                      jsxs(`div`, {
	                                        children: [
	                                          jsx(`label`, {
	                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
	                                            children: [
                                              `模型名称`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                tone: `warning`,
                                                title: `模型名称`,
                                                placement: `below-start`,
                                                children: `填写中转站里实际调用的模型 ID，需要和请求时传给 API 的 model 字段一致。不要填中文备注名，除非文档里明确就是这个名称。`,
                                              }),
                                            ],
                                          }),
                                          jsx(`input`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerTargetModel,
                                            onChange: (event) =>
                                              setConfigButlerTargetModel(
                                                event.target.value,
                                              ),
                                            placeholder: `填写模型名称`,
                                          }),
                                        ],
                                      }),
                                      jsxs(`div`, {
                                        children: [
                                          jsx(`label`, {
                                            className: `flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2`,
                                            children: [
                                              `目标统一 API 配置`,
                                              jsx(WanJuanConfigButlerHelp, {
                                                title: `目标统一 API 配置`,
                                                placement: `below-start`,
                                                children: `选择这条模型配置要绑定到哪个统一 API。比如要把模型绑定到极鑫，就选择极鑫。`,
                                              }),
                                            ],
                                          }),
                                          jsxs(`select`, {
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                            value: configButlerTargetApiConfigId,
                                            onChange: (event) =>
                                              setConfigButlerTargetApiConfigId(
                                                event.target.value,
                                              ),
                                            children: apiConfigs.map((apiConfig) =>
                                              jsx(
                                                `option`, {
                                                  value: apiConfig.id,
                                                  children: apiConfig.name || apiConfig.url,
                                                },
                                                apiConfig.id,
                                              ),
                                            ),
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `flex gap-3`,
                                    children: [
	                                      jsxs(`span`, {
	                                        className: `inline-flex items-center gap-1.5`,
	                                        children: [
	                                          jsx(`button`, {
	                                            type: `button`,
	                                            onClick: configButlerMode === `batch` ? runConfigButlerBatch : runConfigButler,
	                                            disabled: configButlerMode === `batch` ? configButlerBatchLoading : configButlerLoading,
	                                            className: `px-4 py-2 rounded-lg ${configButlerMode === `batch` ? `bg-blue-600 hover:bg-blue-500` : `bg-emerald-600 hover:bg-emerald-500`} text-white text-xs font-medium disabled:opacity-50 transition-colors`,
	                                            children: configButlerMode === `batch` ?
	                                              configButlerBatchLoading ?
	                                              `扫描分析中...` :
	                                              `扫描并生成批量配置` :
	                                              configButlerLoading ?
	                                              `分析中...` :
	                                              `分析文档并生成配置`,
	                                          }),
	                                          jsx(WanJuanConfigButlerHelp, {
	                                            title: configButlerMode === `batch` ? `扫描并生成批量配置` : `分析文档并生成配置`,
	                                            placement: `above-start`,
	                                            children: configButlerMode === `batch` ?
	                                              `配置管家会读取文档和当前模型列表，批量识别接口路径、协议和参数规则。生成后可在批量结果里检查再应用。` :
	                                              `配置管家会读取文档，并按当前模型类型、模型名称生成一份结构化配置。生成后建议先检查输出，再应用到设置。`,
	                                          }),
	                                        ],
	                                      }),
	                                      configButlerMode === `single` ?
	                                      jsxs(`span`, {
	                                        className: `inline-flex items-center gap-1.5`,
	                                        children: [
	                                          jsx(`button`, {
	                                            type: `button`,
	                                            onClick: () => {
	                                              try {
                                                let jsonBlock = extractJsonBlock(
                                                  configButlerResultText,
                                                );
                                                applyConfigButlerResult(jsonBlock);
                                              } catch (error) {
                                                showToast2(
                                                  `配置管家结果格式不正确：${error.message}`,
                                                );
                                              }
	                                            },
	                                            className: `px-4 py-2 rounded-lg bg-[#222] text-gray-200 text-xs font-medium hover:bg-[#2a2a2a] transition-colors`,
	                                            children: `应用到当前设置`,
	                                          }),
	                                          jsx(WanJuanConfigButlerHelp, {
	                                            tone: `warning`,
	                                            title: `应用到当前设置`,
	                                            placement: `above-start`,
	                                            children: `会把当前生成的配置写入软件设置，影响对应模型后续生成请求。确认模型名、接口路径和参数字段无误后再应用。`,
	                                          }),
	                                        ],
	                                      }) :
	                                      jsx(`button`, {
	                                        type: `button`,
	                                        onClick: () => setConfigButlerBatchModalOpen(true),
	                                        disabled: !configButlerBatchItems.length,
	                                        className: `px-4 py-2 rounded-lg bg-[#222] text-gray-200 text-xs font-medium hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors`,
	                                        children: `查看批量识别结果`,
	                                      }),
                                    ],
                                  }),
	                                  configButlerMode === `single` &&
	                                  jsxs(`div`, {
	                                    children: [
	                                      jsx(`label`, {
	                                        className: `block text-xs font-medium text-gray-500 mb-2`,
	                                        children: `配置管家输出（可手动微调后应用）`,
                                      }),
                                      jsx(`textarea`, {
                                        value: configButlerResultText,
                                        onChange: (event) =>
                                          setConfigButlerResultText(
                                            event.target.value,
                                          ),
                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-xs text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[220px] resize-y font-mono`,
                                        placeholder: `配置管家生成的 JSON 会显示在这里`,
                                      }),
                                    ],
                                  }),
                                ],
                              });
}
