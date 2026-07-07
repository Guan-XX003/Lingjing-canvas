/** 设置-扩展工具 标签页。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanSettingsExtensionsTab({
  extensionToolInstalling,
  extensionToolStatus,
  formatExtensionToolError,
  importExtensionToolPack,
  installExtensionTool,
  refreshExtensionToolStatus,
}: any) {
  return jsxs(`div`, {
		                        className: `space-y-6 wanjuan-settings-section`,
	                        children: [
	                          jsxs(`div`, {
	                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
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
		                                            className: `text-rose-300`,
		                                            children: `🧩`,
		                                          }),
		                                          ` 本地工具`,
		                                        ],
		                                      }),
		                                      jsx(`p`, {
		                                        className: `text-[11px] text-gray-500 mt-1 wanjuan-settings-help`,
		                                        children: `管理需要安装在本机的媒体处理能力，例如打码、声音克隆和视频超分。`,
		                                      }),
		                                    ],
		                                  }),
		                                  jsx(`button`, {
		                                    type: `button`,
		                                    disabled: !!extensionToolInstalling.toolpack,
		                                    onClick: importExtensionToolPack,
		                                    className: `shrink-0 min-h-9 px-3 py-2 rounded-lg text-xs leading-4 font-bold border transition-all whitespace-nowrap ${extensionToolInstalling.toolpack ? `bg-[#222] text-gray-500 border-[#333] cursor-wait` : `bg-sky-600/15 text-sky-200 border-sky-500/35 hover:bg-sky-600/25 hover:text-white`}`,
		                                    children: extensionToolInstalling.toolpack ? `导入中` : `导入离线工具包`,
		                                  }),
		                                ],
		                              }),
		                              jsxs(`div`, {
	                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
	                                children: [
	                                  jsx(`p`, {
	                                    className: `text-xs text-gray-500 leading-6 wanjuan-settings-help`,
		                                    children: `Deface 会随正式版安装包提供；Qwen-TTS 语音生成作为官方可选离线包导入，在线安装保留为备用方式。`,
	                                  }),
		                                  jsxs(`div`, {
		                                    className: `rounded-lg border border-[#333] bg-[#121212] p-4`,
	                                    children: [
		                                      jsxs(`div`, {
		                                        className: `grid grid-cols-[minmax(0,1fr)_112px] items-start gap-4`,
	                                        children: [
		                                          jsxs(`div`, {
		                                            className: `min-w-0 pr-1`,
	                                            children: [
		                                              jsxs(`div`, {
		                                                className: `flex flex-wrap items-center gap-2`,
	                                                children: [
	                                                  jsx(`span`, {
	                                                    className: `text-lg`,
	                                                    children: `🎭`,
	                                                  }),
	                                                  jsx(`h3`, {
	                                                    className: `text-sm font-bold text-gray-200`,
	                                                    children: `Deface - 视频人脸打码`,
	                                                  }),
	                                                  jsx(`button`, {
	                                                    type: `button`,
	                                                    title: `查看 Deface GitHub 项目介绍`,
	                                                    "aria-label": `查看 Deface GitHub 项目介绍`,
	                                                    onClick: () => window.wanjuanDesktop?.openExternal?.(`https://github.com/ORB-HD/deface`) || window.open(`https://github.com/ORB-HD/deface`, `_blank`),
	                                                    className: `w-6 h-6 inline-flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#1b1b1b] text-[13px] text-gray-300 hover:text-white hover:bg-[#252525] hover:border-sky-500/45 transition-all`,
	                                                    children: `📄`,
	                                                  }),
	                                                  jsx(`span`, {
	                                                    className: `px-2 py-0.5 rounded-full text-[10px] border ${extensionToolStatus.deface?.installed ? `border-emerald-500/40 bg-emerald-500/10 text-emerald-300` : `border-gray-600 bg-[#1a1a1a] text-gray-400`}`,
	                                                    children: extensionToolStatus.deface?.installed ? `已安装` : extensionToolInstalling.deface ? `安装中` : `未安装`,
	                                                  }),
	                                                ],
	                                              }),
	                                              jsx(`p`, {
	                                                className: `mt-2 text-xs text-gray-500 leading-6`,
	                                                children: `用于“视频人脸打码”节点的本地视频匿名化处理。正式版会优先调用随包内置 Deface；缺失时仍可导入工具包或在线安装修复。`,
	                                              }),
		                                              jsxs(`div`, {
		                                                className: `mt-3 max-h-24 overflow-y-auto rounded-lg border border-[#2a2f38] bg-[#0d1015] px-3 py-2 text-[11px] text-gray-400 leading-5 font-mono whitespace-pre-wrap break-all custom-scrollbar`,
	                                                children: [
	                                                  `来源：github.com/ORB-HD/deface`,
	                                                  extensionToolStatus.deface?.command ?
	                                                  jsxs(Fragment, {
	                                                    children: [
	                                                      jsx(`br`, {}),
	                                                      `路径：`,
	                                                      extensionToolStatus.deface.command,
	                                                    ],
	                                                  }) :
	                                                  null,
	                                                  extensionToolStatus.deface?.version ?
	                                                  jsxs(Fragment, {
	                                                    children: [
	                                                      jsx(`br`, {}),
	                                                      `版本：`,
	                                                      extensionToolStatus.deface.version,
	                                                    ],
	                                                  }) :
	                                                  null,
	                                                ],
	                                              }),
	                                              extensionToolStatus.deface?.error &&
	                                              !extensionToolStatus.deface?.installed &&
	                                              jsx(`div`, {
	                                                className: `mt-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200 leading-5 break-words`,
	                                                children: formatExtensionToolError(extensionToolStatus.deface),
	                                              }),
	                                            ],
	                                          }),
		                                          jsxs(`div`, {
		                                            className: `flex w-[112px] flex-col gap-2 shrink-0`,
	                                            children: [
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                onClick: () => refreshExtensionToolStatus(`deface`),
		                                                className: `w-full min-h-9 px-2 py-2 rounded-lg text-xs leading-4 font-bold bg-[#222] text-gray-300 border border-[#333] hover:bg-[#2a2a2a] hover:text-white transition-all whitespace-normal text-center`,
	                                                children: `检测状态`,
	                                              }),
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                disabled: !!extensionToolInstalling.deface,
	                                                onClick: () => installExtensionTool(`deface`),
		                                                className: `w-full min-h-9 px-2 py-2 rounded-lg text-xs leading-4 font-bold border transition-all whitespace-normal text-center ${extensionToolInstalling.deface ? `bg-[#222] text-gray-500 border-[#333] cursor-wait` : extensionToolStatus.deface?.installed ? `bg-emerald-600/15 text-emerald-200 border-emerald-500/35 hover:bg-emerald-600/25` : `bg-rose-600 text-white border-rose-400/50 hover:bg-rose-500 shadow-lg shadow-rose-950/30`}`,
		                                                children: extensionToolInstalling.deface ? `正在安装` : extensionToolStatus.deface?.installed ? `重装/更新` : `安装`,
	                                              }),
	                                            ],
	                                          }),
	                                        ],
	                                      }),
	                                    ],
	                                  }),
		                                  jsxs(`div`, {
		                                    className: `rounded-lg border border-[#333] bg-[#121212] p-4`,
	                                    children: [
		                                      jsxs(`div`, {
		                                        className: `grid grid-cols-[minmax(0,1fr)_112px] items-start gap-4`,
	                                        children: [
		                                          jsxs(`div`, {
		                                            className: `min-w-0 pr-1`,
	                                            children: [
		                                              jsxs(`div`, {
		                                                className: `flex flex-wrap items-center gap-2`,
	                                                children: [
	                                                  jsx(`span`, {
	                                                    className: `text-lg`,
	                                                    children: `🎙`,
	                                                  }),
	                                                  jsx(`h3`, {
	                                                    className: `text-sm font-bold text-gray-200`,
	                                                    children: `Qwen-TTS - 本地语音生成`,
	                                                  }),
	                                                  jsx(`button`, {
	                                                    type: `button`,
	                                                    title: `查看 Qwen-TTS GitHub 项目介绍`,
	                                                    "aria-label": `查看 Qwen-TTS GitHub 项目介绍`,
	                                                    onClick: () => window.wanjuanDesktop?.openExternal?.(`https://github.com/daliusd/qtts`) || window.open(`https://github.com/daliusd/qtts`, `_blank`),
	                                                    className: `w-6 h-6 inline-flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#1b1b1b] text-[13px] text-gray-300 hover:text-white hover:bg-[#252525] hover:border-sky-500/45 transition-all`,
	                                                    children: `📄`,
	                                                  }),
	                                                  jsx(`span`, {
	                                                    className: `px-2 py-0.5 rounded-full text-[10px] border ${extensionToolStatus[`qwen-tts`]?.installed ? `border-emerald-500/40 bg-emerald-500/10 text-emerald-300` : `border-gray-600 bg-[#1a1a1a] text-gray-400`}`,
	                                                    children: extensionToolStatus[`qwen-tts`]?.installed ? `已安装` : extensionToolInstalling[`qwen-tts`] ? `安装中` : `未安装`,
	                                                  }),
	                                                ],
	                                              }),
	                                              jsx(`p`, {
	                                                className: `mt-2 text-xs text-gray-500 leading-6`,
	                                                children: `用于“Qwen-TTS 语音生成”节点的本地语音生成，支持参考音色克隆和预设自定义语音两种模式。该能力通过官方可选离线包启用，不放进常规安装包。`,
	                                              }),
		                                              jsxs(`div`, {
		                                                className: `mt-3 max-h-24 overflow-y-auto rounded-lg border border-[#2a2f38] bg-[#0d1015] px-3 py-2 text-[11px] text-gray-400 leading-5 font-mono whitespace-pre-wrap break-all custom-scrollbar`,
	                                                children: [
	                                                  `来源：github.com/daliusd/qtts`,
	                                                  extensionToolStatus[`qwen-tts`]?.command ?
	                                                  jsxs(Fragment, {
	                                                    children: [
	                                                      jsx(`br`, {}),
	                                                      `路径：`,
	                                                      extensionToolStatus[`qwen-tts`].command,
	                                                    ],
	                                                  }) :
	                                                  null,
	                                                  extensionToolStatus[`qwen-tts`]?.version ?
	                                                  jsxs(Fragment, {
	                                                    children: [
	                                                      jsx(`br`, {}),
	                                                      `版本：`,
	                                                      extensionToolStatus[`qwen-tts`].version,
	                                                    ],
	                                                  }) :
	                                                  null,
	                                                ],
	                                              }),
	                                              extensionToolStatus[`qwen-tts`]?.error &&
	                                              !extensionToolStatus[`qwen-tts`]?.installed &&
	                                              jsx(`div`, {
	                                                className: `mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 leading-5 break-words`,
	                                                children: formatExtensionToolError(extensionToolStatus[`qwen-tts`]),
	                                              }),
	                                            ],
	                                          }),
		                                          jsxs(`div`, {
		                                            className: `flex w-[112px] flex-col gap-2 shrink-0`,
	                                            children: [
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                onClick: () => refreshExtensionToolStatus(`qwen-tts`),
		                                                className: `w-full min-h-9 px-2 py-2 rounded-lg text-xs leading-4 font-bold bg-[#222] text-gray-300 border border-[#333] hover:bg-[#2a2a2a] hover:text-white transition-all whitespace-normal text-center`,
	                                                children: `检测状态`,
	                                              }),
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                disabled: !!extensionToolInstalling[`qwen-tts`],
	                                                onClick: () => installExtensionTool(`qwen-tts`),
		                                                className: `w-full min-h-9 px-2 py-2 rounded-lg text-xs leading-4 font-bold border transition-all whitespace-normal text-center ${extensionToolInstalling[`qwen-tts`] ? `bg-[#222] text-gray-500 border-[#333] cursor-wait` : extensionToolStatus[`qwen-tts`]?.installed ? `bg-emerald-600/15 text-emerald-200 border-emerald-500/35 hover:bg-emerald-600/25` : `bg-amber-600 text-white border-amber-400/50 hover:bg-amber-500 shadow-lg shadow-amber-950/30`}`,
		                                                children: extensionToolInstalling[`qwen-tts`] ? `正在安装` : extensionToolStatus[`qwen-tts`]?.installed ? `重装/更新` : `安装`,
	                                              }),
	                                            ],
	                                          }),
	                                        ],
	                                      }),
	                                    ],
	                                  }),
		                                  jsxs(`div`, {
		                                    className: `rounded-lg border border-[#333] bg-[#121212] p-4`,
	                                    children: [
		                                      jsxs(`div`, {
		                                        className: `grid grid-cols-[minmax(0,1fr)_112px] items-start gap-4`,
	                                        children: [
		                                          jsxs(`div`, {
		                                            className: `min-w-0 pr-1`,
	                                            children: [
		                                              jsxs(`div`, {
		                                                className: `flex flex-wrap items-center gap-2`,
	                                                children: [
	                                                  jsx(`span`, {
	                                                    className: `text-lg`,
	                                                    children: `🎞`,
	                                                  }),
	                                                  jsx(`h3`, {
	                                                    className: `text-sm font-bold text-gray-200`,
	                                                    children: `Real-ESRGAN - 本地视频超分`,
	                                                  }),
	                                                  jsx(`button`, {
	                                                    type: `button`,
	                                                    title: `查看 Real-ESRGAN GitHub 项目介绍`,
	                                                    "aria-label": `查看 Real-ESRGAN GitHub 项目介绍`,
	                                                    onClick: () => window.wanjuanDesktop?.openExternal?.(`https://github.com/xinntao/Real-ESRGAN`) || window.open(`https://github.com/xinntao/Real-ESRGAN`, `_blank`),
	                                                    className: `w-6 h-6 inline-flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#1b1b1b] text-[13px] text-gray-300 hover:text-white hover:bg-[#252525] hover:border-sky-500/45 transition-all`,
	                                                    children: `📄`,
	                                                  }),
	                                                  jsx(`span`, {
	                                                    className: `px-2 py-0.5 rounded-full text-[10px] border ${extensionToolStatus[`real-esrgan`]?.installed ? `border-emerald-500/40 bg-emerald-500/10 text-emerald-300` : `border-gray-600 bg-[#1a1a1a] text-gray-400`}`,
	                                                    children: extensionToolStatus[`real-esrgan`]?.installed ? `已安装` : extensionToolInstalling[`real-esrgan`] ? `安装中` : `未安装`,
	                                                  }),
	                                                ],
	                                              }),
	                                              jsx(`p`, {
	                                                className: `mt-2 text-xs text-gray-500 leading-6`,
	                                                children: `用于“本地视频超分”节点的本机视频清晰度增强。安装后会调用官方 NCNN Vulkan 便携版，并通过 ffmpeg 拆帧与合成视频。`,
	                                              }),
		                                              jsxs(`div`, {
		                                                className: `mt-3 max-h-24 overflow-y-auto rounded-lg border border-[#2a2f38] bg-[#0d1015] px-3 py-2 text-[11px] text-gray-400 leading-5 font-mono whitespace-pre-wrap break-all custom-scrollbar`,
	                                                children: [
	                                                  `来源：github.com/xinntao/Real-ESRGAN/releases`,
	                                                  extensionToolStatus[`real-esrgan`]?.command ?
	                                                  jsxs(Fragment, {
	                                                    children: [
	                                                      jsx(`br`, {}),
	                                                      `路径：`,
	                                                      extensionToolStatus[`real-esrgan`].command,
	                                                    ],
	                                                  }) :
	                                                  null,
	                                                  extensionToolStatus[`real-esrgan`]?.version ?
	                                                  jsxs(Fragment, {
	                                                    children: [
	                                                      jsx(`br`, {}),
	                                                      `版本：`,
	                                                      extensionToolStatus[`real-esrgan`].version,
	                                                    ],
	                                                  }) :
	                                                  null,
	                                                ],
	                                              }),
	                                              extensionToolStatus[`real-esrgan`]?.error &&
	                                              !extensionToolStatus[`real-esrgan`]?.installed &&
	                                              jsx(`div`, {
	                                                className: `mt-3 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-100 leading-5 break-words`,
	                                                children: formatExtensionToolError(extensionToolStatus[`real-esrgan`]),
	                                              }),
	                                            ],
	                                          }),
		                                          jsxs(`div`, {
		                                            className: `flex w-[112px] flex-col gap-2 shrink-0`,
	                                            children: [
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                onClick: () => refreshExtensionToolStatus(`real-esrgan`),
		                                                className: `w-full min-h-9 px-2 py-2 rounded-lg text-xs leading-4 font-bold bg-[#222] text-gray-300 border border-[#333] hover:bg-[#2a2a2a] hover:text-white transition-all whitespace-normal text-center`,
	                                                children: `检测状态`,
	                                              }),
	                                              jsx(`button`, {
	                                                type: `button`,
	                                                disabled: !!extensionToolInstalling[`real-esrgan`],
	                                                onClick: () => installExtensionTool(`real-esrgan`),
		                                                className: `w-full min-h-9 px-2 py-2 rounded-lg text-xs leading-4 font-bold border transition-all whitespace-normal text-center ${extensionToolInstalling[`real-esrgan`] ? `bg-[#222] text-gray-500 border-[#333] cursor-wait` : extensionToolStatus[`real-esrgan`]?.installed ? `bg-emerald-600/15 text-emerald-200 border-emerald-500/35 hover:bg-emerald-600/25` : `bg-sky-600 text-white border-sky-400/50 hover:bg-sky-500 shadow-lg shadow-sky-950/30`}`,
		                                                children: extensionToolInstalling[`real-esrgan`] ? `正在安装` : extensionToolStatus[`real-esrgan`]?.installed ? `重装/更新` : `安装`,
	                                              }),
	                                            ],
	                                          }),
	                                        ],
	                                      }),
	                                    ],
	                                  }),
	                                ],
		                              }),
	                            ],
	                          }),
	                        ],
	                      });
}
