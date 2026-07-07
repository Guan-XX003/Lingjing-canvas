// @ts-nocheck
/** WanJuanSettingsSectionB：自 WanJuanAppRoot render 抽出的 JSX 段，props 传入，行为不变。 */
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { WANJUAN_JIXIN_DEFAULT_API_URL } from "../lib/jixin-catalog";
import { WanJuanAudioModelSettingsPanel } from "../components/audio-model-settings-panel";
import { WanJuanConfigButlerBatchModal } from "../components/config-butler-batch-modal";
import { WanJuanConfigButlerSettingsPanel } from "../components/config-butler-settings-panel";
import { WanJuanGlobalConfigPresetsPanel } from "../components/global-config-presets-panel";
import { WanJuanImageModelSettingsPanel } from "../components/image-model-settings-panel";
import { WanJuanSeedanceSettingsPanel } from "../components/seedance-settings-panel";
import { WanJuanSettingsApiConfigSection } from "../components/settings-api-config-section";
import { WanJuanSettingsBasicTab } from "../components/settings-basic-tab";
import { WanJuanSettingsCloudTab } from "../components/settings-cloud-tab";
import { WanJuanSettingsDataTab } from "../components/settings-data-tab";
import { WanJuanSettingsExtensionsTab } from "../components/settings-extensions-tab";
import { WanJuanSettingsGenerationTab } from "../components/settings-generation-tab";
import { WanJuanTextModelSettingsPanel } from "../components/text-model-settings-panel";
import { WanJuanTongyiModelsSection } from "../components/tongyi-models-section";
import { WanJuanTtsMusicSettingsPanel } from "../components/tts-music-settings-panel";
import { WanJuanVideoModelSettingsPanel } from "../components/video-model-settings-panel";

export function WanJuanSettingsSectionB(props: any) {
  const {
    activeSettingsTab,
    activeStoredGlobalConfigId,
    activeView,
    allAdvancedModelSettingsExpanded,
    audioModelSettingsExpanded,
    configButlerBatchModalOpen,
    configButlerExpanded,
    globalConfigPresetsExpanded,
    imageModelSettingsExpanded,
    seedanceSettingsExpanded,
    setActiveSettingsTab,
    setAllAdvancedModelSettings,
    setAudioModelSettingsExpanded,
    setConfigButlerExpanded,
    setGlobalConfigPresetsExpanded,
    setImageModelSettingsExpanded,
    setSeedanceSettingsExpanded,
    setTextModelSettingsExpanded,
    setTtsMusicSettingsExpanded,
    setVideoModelSettingsExpanded,
    storedGlobalConfigs,
    textModelSettingsExpanded,
    tianjiSeedanceSettingsMode,
    ttsMusicSettingsExpanded,
    updateInfo,
    videoModelSettingsExpanded,
  } = props;
  return jsxs(`div`, {
              className: `absolute inset-0 flex bg-[#121212] overflow-hidden wanjuan-settings-page ${activeView === `settings` ? `visible z-10` : `invisible -z-10`}`,
              children: [
                jsxs(`div`, {
                  className: `w-48 bg-[#1a1a1a] border-r border-[#333] flex flex-col p-3 z-10 flex-shrink-0 wanjuan-settings-sidebar`,
                  children: [
                    jsx(`div`, {
                      className: `text-[10px] text-gray-500 font-bold px-3 py-2 mb-1 uppercase tracking-wider wanjuan-settings-sidebar-title`,
	                      children: wanjuanT(`设置菜单`),
                    }),
                    jsx(`div`, {
                      className: `text-[10px] text-gray-600 font-semibold px-3 pt-1 pb-1 uppercase tracking-wider wanjuan-settings-sidebar-group`,
                      children: `模型服务`,
                    }),
                    jsxs(`button`, {
                      onClick: () => setActiveSettingsTab(`oneStop`),
                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1.5 flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `oneStop` ? `wanjuan-settings-nav-item-active bg-[#252525] text-emerald-300 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
                      children: [
                        jsx(`span`, {
                          className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-one-stop`,
                          children: `🌐`,
                        }),
                        ` 一站式中心`,
                      ],
                    }),
                    jsxs(`button`, {
                      onClick: () => setActiveSettingsTab(`api`),
                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1.5 flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `api` ? `wanjuan-settings-nav-item-active bg-[#252525] text-cyan-300 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
                      children: [
                        jsx(`span`, {
                          className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-api`,
                          children: `🔐`,
                        }),
	                        ` API 配置`,
                      ],
                    }),
                    jsxs(`button`, {
                      onClick: () => setActiveSettingsTab(`models`),
                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1.5 flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `models` ? `wanjuan-settings-nav-item-active bg-[#252525] text-purple-400 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
                      children: [
                        jsx(`span`, {
                          className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-models`,
                          children: `🧠`,
                        }),
	                        ` 模型配置`,
                      ],
                    }),
                    jsxs(`button`, {
                      onClick: () => setActiveSettingsTab(`cloud`),
                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1.5 flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `cloud` ? `wanjuan-settings-nav-item-active bg-[#252525] text-cyan-400 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
                      children: [jsx(`span`, {
                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-cloud`,
                        children: `☁️`
	                      }), ` 上传与直链`],
                    }),
	                    jsx(`div`, {
	                      className: `text-[10px] text-gray-600 font-semibold px-3 pt-3 pb-1 uppercase tracking-wider wanjuan-settings-sidebar-group`,
	                      children: `运行`,
	                    }),
	                    jsxs(`button`, {
	                      onClick: () => setActiveSettingsTab(`generation`),
	                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1.5 flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `generation` ? `wanjuan-settings-nav-item-active bg-[#252525] text-green-400 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
	                      children: [jsx(`span`, {
	                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-generation`,
	                        children: `✨`
		                      }), ` 生成与下载`],
	                    }),
	                    jsxs(`button`, {
	                      onClick: () => setActiveSettingsTab(`extensions`),
	                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1.5 flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `extensions` ? `wanjuan-settings-nav-item-active bg-[#252525] text-rose-300 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
	                      children: [jsx(`span`, {
	                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-extensions`,
	                        children: `🧩`
		                      }), ` 本地工具`],
	                    }),
	                    jsx(`div`, {
	                      className: `text-[10px] text-gray-600 font-semibold px-3 pt-3 pb-1 uppercase tracking-wider wanjuan-settings-sidebar-group`,
	                      children: `数据`,
	                    }),
	                    jsxs(`button`, {
	                      onClick: () => setActiveSettingsTab(`data`),
                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `data` ? `wanjuan-settings-nav-item-active bg-[#252525] text-orange-400 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
                      children: [jsx(`span`, {
                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-data`,
                        children: `🗄️`,
	                      }), ` 项目与备份`],
                    }),
                    jsx(`div`, {
                      className: `text-[10px] text-gray-600 font-semibold px-3 pt-3 pb-1 uppercase tracking-wider wanjuan-settings-sidebar-group`,
                      children: `基础`,
                    }),
                    jsxs(`button`, {
                      onClick: () => setActiveSettingsTab(`basic`),
                      className: `text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 wanjuan-settings-nav-item ${activeSettingsTab === `basic` ? `wanjuan-settings-nav-item-active bg-[#252525] text-blue-400 font-bold border border-[#333] shadow-sm` : `text-gray-300 hover:bg-[#222] hover:text-gray-100 border border-transparent`}`,
                      children: [jsx(`span`, {
                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-basic`,
                        children: `🪄`,
	                      }), ` 外观与通用`],
                    }),
                  ],
                }),
		                jsx(`div`, {
		                  className: `flex-1 overflow-y-auto p-6 relative pb-24 custom-scrollbar bg-[#121212] wanjuan-settings-content`,
		                  children: jsxs(`div`, {
		                    className: `${activeSettingsTab === `oneStop` ? `max-w-none` : `max-w-4xl mx-auto`} flex flex-col gap-6 wanjuan-settings-content-inner`,
		                    children: [
	                      updateInfo?.hasUpdate &&
                      jsxs(`div`, {
                        className: `bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4 rounded-xl border border-blue-500/30 mb-4 flex justify-between items-center shadow-lg`,
                        children: [
                          jsxs(`div`, {
                            children: [
                              jsxs(`h3`, {
                                className: `font-bold text-blue-400 flex items-center gap-2`,
                                children: [`🚀 发现新版本 v`, updateInfo.version],
                              }),
                              jsx(`p`, {
                                className: `text-xs text-gray-400 mt-1`,
                                children: updateInfo.changelog ||
                                  `修复了一些已知问题，优化了使用体验。`,
                              }),
                            ],
                          }),
                          jsx(`a`, {
                            href: updateInfo.downloadUrl || `#`,
                            target: `_blank`,
                            className: `bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20 whitespace-nowrap ml-4 transition-transform hover:scale-105`,
                            children: `立即更新`,
                          }),
                        ],
                      }),
                      activeSettingsTab === `basic` &&
                      jsx(WanJuanSettingsBasicTab, {
  $e,
  appLanguage,
  currentLimits,
  dailyUsageCount,
  deviceId,
  expanded,
  handleAddPreset,
  handleRemovePreset,
  handleServerVerify,
  membershipCode,
  normalizeThemeMode,
  presetPrompts,
  setAppLanguage,
  setExpanded,
  setMembershipCode,
  setThemeMode,
  themeMode,
  updatePresetField,
  users,
  wanjuanT,
}),
                      activeSettingsTab === `oneStop` &&
                      jsxs(`div`, {
                        className: `space-y-4 wanjuan-settings-section`,
                        children: [
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center gap-3 p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`div`, {
                                    children: [
                                      jsxs(`h2`, {
                                        className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                        children: [
                                          jsx(`span`, {
                                            className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-one-stop`,
                                            children: `🌐`,
                                          }),
                                          ` 一站式中心`,
                                        ],
                                      }),
                                      jsx(`p`, {
                                        className: `text-[11px] text-gray-500 mt-1 wanjuan-settings-help`,
                                        children: `在应用内打开 jixing.guancn.uk，集中管理模型服务相关能力。`,
                                      }),
                                    ],
                                  }),
                                  jsx(`a`, {
                                    href: WANJUAN_JIXIN_DEFAULT_API_URL,
                                    target: `_blank`,
                                    rel: `noreferrer`,
                                    className: `px-3 py-2 rounded-lg border border-[#333] bg-[#222] text-xs text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors whitespace-nowrap`,
                                    children: `外部打开`,
                                  }),
                                ],
                              }),
                              jsx(`div`, {
                                className: `bg-[#0f0f0f]`,
                                style: {
                                  height: `calc(100vh - 220px)`,
                                  minHeight: 600,
                                },
                                children: jsx(`webview`, {
                                  src: WANJUAN_JIXIN_DEFAULT_API_URL,
                                  className: `w-full h-full bg-white`,
                                  allowpopups: `true`,
                                  partition: `persist:wanjuan-one-stop-center`,
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                      activeSettingsTab === `cloud` &&
                      jsx(WanJuanSettingsCloudTab, {
  applyLitterboxUploadPreset,
  customPublicUploadConfig,
  customUploadConfigExpanded,
  qiniuConfig,
  qiniuJsonImportOpen,
  qiniuJsonImportText,
  qiniuUploadConfigExpanded,
  seedanceUploadMode,
  setCustomPublicUploadConfig,
  setCustomUploadConfigExpanded,
  setQiniuConfig,
  setQiniuJsonImportOpen,
  setQiniuJsonImportText,
  setQiniuUploadConfigExpanded,
  setSeedanceUploadMode,
  setShowQiniuSecretKey,
  setShowTosSecretKey,
  setTosConfig,
  setTosUploadConfigExpanded,
  showQiniuSecretKey,
  showToast2,
  showTosSecretKey,
  tosConfig,
  tosUploadConfigExpanded,
}),
                      activeSettingsTab === `generation` &&
                      jsx(WanJuanSettingsGenerationTab, {
  $e,
  applyPerformanceProfile,
  autoDownloadGeneratedResults,
  currentLimits,
  downloadDirectory,
  handleAddPreset,
  handleRemovePreset,
  layeredRunConcurrencyOptions,
  layeredRunMaxConcurrency,
  maxPollingDuration,
  performanceProfile,
  pollingInterval,
  presetPrompts,
  setAutoDownloadGeneratedResults,
  setDownloadDirectory,
  setLayeredRunConcurrencyOptions,
  setLayeredRunMaxConcurrency,
  setMaxPollingDuration,
  setPollingInterval,
  updatePresetField,
}),
	                      activeSettingsTab === `extensions` &&
	                      jsx(WanJuanSettingsExtensionsTab, {
  extensionToolInstalling,
  extensionToolStatus,
  formatExtensionToolError,
  importExtensionToolPack,
  installExtensionTool,
  refreshExtensionToolStatus,
}),
	                      (activeSettingsTab === `api` || activeSettingsTab === `models`) &&
                      jsxs(`div`, {
                        className: `space-y-6 wanjuan-settings-section`,
                        children: [
                          activeSettingsTab === `models` &&
                          jsx(`div`, {
                            className: `flex justify-end`,
                            children: jsx(`button`, {
                              type: `button`,
                              onClick: () =>
                                setAllAdvancedModelSettings(
                                  !allAdvancedModelSettingsExpanded,
                                ),
                              className: `px-3 py-2 rounded-lg border border-[#333] bg-[#1a1a1a] text-xs text-gray-300 hover:bg-[#222] hover:text-white transition-colors wanjuan-settings-advanced-toggle ${allAdvancedModelSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                              children: allAdvancedModelSettingsExpanded ?
                                `收起高级设置` :
                                `展开全部高级设置`,
                            }),
                          }),
                          activeSettingsTab === `api` &&
                          jsx(WanJuanSettingsApiConfigSection, {
  apiConfigs,
  resetJixinDefaultConfiguration,
  setApiConfigs,
}),
                          activeSettingsTab === `api` &&
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card wanjuan-stored-global-config-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center gap-3 p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`div`, {
                                    className: `min-w-0`,
                                    children: [
                                      jsxs(`h2`, {
                                        className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                        children: [
                                          jsx(`span`, {
                                            className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-api`,
                                            children: `🗂️`,
                                          }),
                                          ` 已存储统一全局配置`,
                                          jsx(`span`, {
                                            className: `rounded-full border px-2 py-0.5 text-[10px] font-medium wanjuan-stored-global-config-count`,
                                            children: `${(storedGlobalConfigs || []).length || 0} 个`,
                                          }),
                                        ],
                                      }),
                                      jsx(`p`, {
                                        className: `text-[11px] text-gray-500 mt-1 wanjuan-settings-help truncate`,
                                        children: activeStoredGlobalConfigId &&
                                          (storedGlobalConfigs || []).find((config) => config.id === activeStoredGlobalConfigId) ?
                                          `当前：${(storedGlobalConfigs || []).find((config) => config.id === activeStoredGlobalConfigId)?.name || ``}` :
                                          `保存并切换整套模型列表、API 绑定、协议配置和接口文档链接。`,
                                      }),
                                    ],
                                  }),
                                  jsx(`button`, {
                                    type: `button`,
                                    onClick: () => setGlobalConfigPresetsExpanded((prev) => !prev),
                                    className: `shrink-0 px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${globalConfigPresetsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                                    children: globalConfigPresetsExpanded ? `收起` : `展开`,
                                  }),
                                ],
                              }),
                              globalConfigPresetsExpanded &&
                              jsx(WanJuanGlobalConfigPresetsPanel, {
  activeStoredGlobalConfigId,
  applyStoredGlobalConfig,
  configButlerDocUrl,
  saveStoredGlobalConfigApiDocUrl,
  setActiveStoredGlobalConfigId,
  setConfigButlerDocUrl,
  setStoredGlobalConfigs,
  storedGlobalConfigs,
}),
                            ],
                          }),
                          false,
	                          activeSettingsTab === `api` &&
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
                                      jsx(`span`, {
                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-butler`,
                                        children: `🤖`,
                                      }),
                                      ` 配置管家`,
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `flex items-center gap-3`,
                                    children: [
                                      jsx(`div`, {
                                        className: `text-[10px] text-gray-500 hidden md:block`,
                                        children: `给文档、模型，并选择统一 API 配置，自动识别并应用模型配置`,
                                      }),
                                      jsx(`button`, {
                                        type: `button`,
                                        onClick: () =>
                                          setConfigButlerExpanded(
                                            !configButlerExpanded,
                                          ),
                                        className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${configButlerExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                                        children: configButlerExpanded ?
                                          `收起` :
                                          `展开`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              configButlerExpanded &&
                              jsx(WanJuanConfigButlerSettingsPanel, {
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
}),
                            ],
                          }),
                          activeSettingsTab === `models` &&
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
                                      jsx(`span`, {
                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-text-model`,
                                        children: `📝`,
                                      }),
                                      ` 文本大模型`,
                                    ],
                                  }),
                                  jsx(`button`, {
                                    type: `button`,
                                    onClick: () => setTextModelSettingsExpanded(!textModelSettingsExpanded),
                                    className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${textModelSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                                    children: textModelSettingsExpanded ? `收起` : `展开`,
                                  }),
                                ],
                              }),
                              textModelSettingsExpanded &&
                              jsx(WanJuanTextModelSettingsPanel, {
  _e,
  apiConfigs,
  setTextModelApiBindings,
  textModelApiBindings,
  textModels,
}),
                            ],
                          }),
                          activeSettingsTab === `models` &&
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
                                      jsx(`span`, {
                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-image-model`,
                                        children: `🎨`,
                                      }),
                                      ` 图像大模型`,
                                    ],
                                  }),
                                  jsx(`button`, {
                                    type: `button`,
                                    onClick: () => setImageModelSettingsExpanded(!imageModelSettingsExpanded),
                                    className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${imageModelSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                                    children: imageModelSettingsExpanded ? `收起` : `展开`,
                                  }),
                                ],
                              }),
                              imageModelSettingsExpanded &&
                              jsx(WanJuanImageModelSettingsPanel, {
  apiConfigs,
  imageCompatResolutions,
  imageModelApiBindings,
  imageModels,
  setImageCompatResolutions,
  setImageModelApiBindings,
  setImageModels,
}),
                            ],
                          }),
                          activeSettingsTab === `models` &&
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
                                      jsx(`span`, {
                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-video-model`,
                                        children: `🎬`,
                                      }),
                                      ` 视频大模型`,
                                    ],
                                  }),
                                  jsx(`button`, {
                                    type: `button`,
                                    onClick: () => setVideoModelSettingsExpanded(!videoModelSettingsExpanded),
                                    className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${videoModelSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                                    children: videoModelSettingsExpanded ? `收起` : `展开`,
                                  }),
                                ],
                              }),
                              videoModelSettingsExpanded &&
                              jsx(WanJuanVideoModelSettingsPanel, {
  apiConfigs,
  setVideoAspectRatios,
  setVideoDurations,
  setVideoModelApiBindings,
  setVideoModels,
  setVideoResolutions,
  videoAspectRatios,
  videoDurations,
  videoModelApiBindings,
  videoModels,
  videoResolutions,
}),
                            ],
                          }),
                          activeSettingsTab === `models` &&
                          jsx(WanJuanTongyiModelsSection, {
  apiConfigs,
  setTongyiWanxiangDurations,
  setTongyiWanxiangEditModels,
  setTongyiWanxiangImageModels,
  setTongyiWanxiangRatios,
  setTongyiWanxiangReferenceImageModels,
  setTongyiWanxiangResolutions,
  setTongyiWanxiangSettingsExpanded,
  setTongyiWanxiangTextModels,
  setVideoModelApiBindings,
  tongyiWanxiangDurations,
  tongyiWanxiangEditModels,
  tongyiWanxiangImageModels,
  tongyiWanxiangRatios,
  tongyiWanxiangReferenceImageModels,
  tongyiWanxiangResolutions,
  tongyiWanxiangSettingsExpanded,
  tongyiWanxiangTextModels,
  videoModelApiBindings,
}),
                          activeSettingsTab === `models` &&
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card wanjuan-seedance-settings-card ${tianjiSeedanceSettingsMode === `tianji` ? `wanjuan-tianji-mode-active` : ``}`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
	                                      jsx(`span`, {
	                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-seedance`,
	                                        children: `🎞️`,
	                                      }),
	                                      ` 即梦节点`,
	                                    ],
	                                  }),
                                  jsxs(`div`, {
                                    className: `flex items-center gap-3`,
                                    children: [
                                      jsx(`div`, {
                                        className: `text-[10px] text-gray-500 hidden md:block`,
                                        children: `火山方舟 / 智创聚合专用`,
                                      }),
                                      jsx(`button`, {
                                        type: `button`,
                                        onClick: () =>
                                          setSeedanceSettingsExpanded(
                                            !seedanceSettingsExpanded,
                                          ),
                                        className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${seedanceSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                                        children: seedanceSettingsExpanded ?
                                          `收起` :
                                          `展开`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              seedanceSettingsExpanded &&
	                              jsx(WanJuanSeedanceSettingsPanel, {
  apiConfigs,
  applyTianjiSeedanceSettingsMode,
  editSeedancePortrait,
  handleSeedancePortraitFile,
  removeSeedancePortrait,
  resetSeedancePortraitForm,
  saveSeedancePortraitForm,
  seedanceDurations,
  seedanceEnableWebSearch,
  seedanceGenerateAudio,
  seedanceModel,
  seedancePortraitEditingId,
  seedancePortraitFileInputRef,
  seedancePortraitForm,
  seedancePortraitLibraryExpanded,
  seedanceRatios,
  seedanceResolutions,
  seedanceVirtualPortraits,
  seedanceWatermark,
  setSeedanceDurations,
  setSeedanceEnableWebSearch,
  setSeedanceGenerateAudio,
  setSeedanceModel,
  setSeedancePortraitForm,
  setSeedancePortraitLibraryExpanded,
  setSeedanceRatios,
  setSeedanceResolutions,
  setSeedanceWatermark,
  setTianjiSeedanceModel,
  setVideoModelApiBindings,
  tianjiSeedanceModel,
  tianjiSeedanceSettingsMode,
  videoModelApiBindings,
}),
                            ],
                          }),
                          activeSettingsTab === `models` &&
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
                                      jsx(`span`, {
                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-audio-model`,
                                        children: `🎙️`,
                                      }),
                                      ` 音频大模型`,
                                    ],
                                  }),
	                                  jsx(`button`, {
	                                    type: `button`,
	                                    onClick: () => setAudioModelSettingsExpanded(!audioModelSettingsExpanded),
	                                    className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${audioModelSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
	                                    children: audioModelSettingsExpanded ? `收起` : `展开`,
	                                  }),
                                ],
                              }),
	                              audioModelSettingsExpanded &&
	                              jsx(WanJuanAudioModelSettingsPanel, {
  apiConfigs,
  audioModelApiBindings,
  audioModels,
  setAudioModelApiBindings,
  setAudioModels,
}),
	                            ],
	                          }),
	                          configButlerBatchModalOpen &&
	                          jsx(WanJuanConfigButlerBatchModal, {
  applyConfigButlerBatchResults,
  configButlerBatchActiveCategory,
  configButlerBatchItems,
  setConfigButlerBatchActiveCategory,
  setConfigButlerBatchItems,
  setConfigButlerBatchModalOpen,
}),
	                          activeSettingsTab === `models` &&
	                          jsxs(`div`, {
	                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
	                            children: [
	                              jsxs(`div`, {
	                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
	                                children: [
	                                  jsxs(`h2`, {
	                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
	                                    children: [
	                                      jsx(`span`, {
	                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-tts-model`,
	                                        children: `🎵`,
	                                      }),
			                                      ` 音乐大模型`,
		                                    ],
		                                  }),
		                                  jsx(`button`, {
	                                    type: `button`,
	                                    onClick: () => setTtsMusicSettingsExpanded(!ttsMusicSettingsExpanded),
	                                    className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${ttsMusicSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
	                                    children: ttsMusicSettingsExpanded ? `收起` : `展开`,
	                                  }),
	                                ],
	                              }),
	                              ttsMusicSettingsExpanded &&
	                              jsx(WanJuanTtsMusicSettingsPanel, {
  apiConfigs,
  audioModelApiBindings,
  setAudioModelApiBindings,
  setTtsMusicModel,
  ttsMusicModel,
}),
	                            ],
	                          }),
	                        ],
	                      }),
                      activeSettingsTab === `data` &&
                      jsx(WanJuanSettingsDataTab, {
  BACKUP_MODULE_LABELS,
  backupExportSelection,
  cleanStorageOptimization,
  downloadDirectory,
  enableStorageOptimization,
  formatStorageBytes,
  handleBackupImportFile,
  manageStorageOptimizationTrash,
  openBackupExportDialog,
  projects,
  purgeStorageOptimizationTrash,
  refreshStorageOptimizationStatus,
  restoreStorageOptimizationTrash,
  runNextStorageMigration,
  scanStorageOptimization,
  setBackupExportSelection,
  setStorageOptimizationLastResult,
  setStorageOptimizationPaused,
  showStorageOptimizationDetails,
  showToast2,
  storageOptimizationBusy,
  storageOptimizationEnabled,
  storageOptimizationLastResult,
  storageOptimizationPaused,
  storageOptimizationStatus,
}),
                    ],
                  }),
                }),
              ],
            });
}
