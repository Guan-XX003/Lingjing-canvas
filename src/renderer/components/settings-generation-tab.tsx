/** 设置-生成参数 标签页。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { WANJUAN_PERFORMANCE_PROFILE_PRESETS, WanJuanPerformanceProfileList } from "../lib/performance-profile";
import { Trash2 } from "lucide-react";
declare const chrome: any;

export function WanJuanSettingsGenerationTab({
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
}: any) {
  return jsxs(`div`, {
                        className: `space-y-6 wanjuan-settings-section`,
                        children: [
                          jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsx(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: jsxs(`div`, {
                                  children: [
                                    jsxs(`h2`, {
                                      className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                      children: [
                                        jsx(`span`, {
                                          className: `text-green-400`,
                                          children: `▶`,
                                        }),
                                        ` 生成与下载`,
                                      ],
                                    }),
                                    jsx(`p`, {
                                      className: `text-[11px] text-gray-500 mt-1 wanjuan-settings-help`,
                                      children: `管理异步轮询、任务并发和生成结果下载位置。`,
                                    }),
                                  ],
                                }),
                              }),
                              jsxs(`div`, {
                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
	                                children: [
	                                  jsx(`div`, {
	                                    className: `wanjuan-performance-panel`,
	                                    "data-wanjuan-performance-panel": `true`,
	                                    children: jsxs(`div`, {
	                                      children: [
	                                        jsxs(`div`, {
	                                          className: `wanjuan-performance-header`,
	                                          children: [
	                                            jsxs(`div`, {
	                                              children: [
	                                                jsx(`div`, {
	                                                  className: `wanjuan-performance-title`,
	                                                  children: `性能 / 渲染档位`,
	                                                }),
	                                                jsx(`div`, {
	                                                  className: `wanjuan-performance-subtitle`,
	                                                  children: `全局默认设置；会同步到下面的并发设置，不做隐藏保护。`,
	                                                }),
	                                              ],
	                                            }),
	                                            jsx(`div`, {
	                                              className: `wanjuan-performance-current`,
	                                              children: WANJUAN_PERFORMANCE_PROFILE_PRESETS[performanceProfile]?.label || `均衡`,
	                                            }),
	                                          ],
	                                        }),
	                                        jsx(`div`, {
	                                          className: `wanjuan-performance-options`,
	                                          children: WanJuanPerformanceProfileList.map((profileKey) => {
	                                            let preset = WANJUAN_PERFORMANCE_PROFILE_PRESETS[profileKey];
	                                            return jsxs(`button`, {
	                                              type: `button`,
	                                              className: performanceProfile === profileKey ? `active` : ``,
	                                              "data-profile": profileKey,
	                                              "aria-pressed": performanceProfile === profileKey ? `true` : `false`,
	                                              onClick: () => applyPerformanceProfile(profileKey),
	                                              children: [
	                                                jsx(`strong`, {
	                                                  children: preset.label,
	                                                }),
	                                                jsx(`span`, {
	                                                  children: preset.description,
	                                                }),
	                                              ],
	                                            }, profileKey);
	                                          }),
	                                        }),
	                                        jsxs(`div`, {
	                                          className: `wanjuan-performance-details`,
	                                          children: [
	                                            `层级并发 `,
	                                            performanceProfile === `custom` ? layeredRunMaxConcurrency : WANJUAN_PERFORMANCE_PROFILE_PRESETS[performanceProfile]?.layeredRunMaxConcurrency || layeredRunMaxConcurrency,
	                                            ` · AI生成队列 `,
	                                            WANJUAN_PERFORMANCE_PROFILE_PRESETS[performanceProfile]?.aiGenerateLimit || 3,
	                                            ` · 聊天队列 `,
	                                            WANJUAN_PERFORMANCE_PROFILE_PRESETS[performanceProfile]?.aiChatLimit || 2,
	                                            ` · 轮询 `,
	                                            WANJUAN_PERFORMANCE_PROFILE_PRESETS[performanceProfile]?.aiPollLimit || 2,
	                                          ],
	                                        }),
	                                      ],
	                                    }),
	                                  }),
                                  jsxs(`div`, {
	                                    children: [
	                                      jsxs(`label`, {
	                                        className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                        children: [
	                                          `全局异步轮询间隔: `,
	                                          jsxs(`span`, {
	                                            className: `text-blue-400`,
	                                            children: [pollingInterval / 1e3, ` 秒`],
	                                          }),
	                                        ],
	                                      }),
	                                      jsx(`div`, {
	                                        className: `flex gap-4 items-center`,
	                                        children: jsx(`input`, {
	                                          type: `range`,
	                                          className: `flex-1 accent-blue-500`,
	                                          value: pollingInterval,
	                                          min: 1e3,
	                                          max: 1e4,
	                                          step: 500,
	                                          onChange: (event) =>
	                                            setPollingInterval(Number(event.target.value)),
	                                        }),
	                                      }),
	                                      jsx(`p`, {
	                                        className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
	                                        children: `设置万能节点异步查询请求的时间间隔，建议 3 秒 (3000ms) 以上`,
	                                      }),
	                                    ],
	                                  }),
			                                  jsxs(`div`, {
		                                    children: [
	                                      jsxs(`label`, {
	                                        className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                        children: [
	                                          `全局异步轮询最大时长: `,
	                                          jsxs(`span`, {
	                                            className: `text-blue-400`,
	                                            children: [maxPollingDuration, ` 秒`],
	                                          }),
	                                          ` (`,
	                                          Math.round(maxPollingDuration / 60),
	                                          ` 分钟)`,
	                                        ],
	                                      }),
	                                      jsx(`div`, {
	                                        className: `flex gap-4 items-center`,
	                                        children: jsx(`input`, {
	                                          type: `range`,
	                                          className: `flex-1 accent-blue-500`,
	                                          value: maxPollingDuration,
	                                          min: 60,
	                                          max: 3600,
	                                          step: 60,
	                                          onChange: (event) =>
	                                            setMaxPollingDuration(Number(event.target.value)),
	                                        }),
	                                      }),
	                                      jsx(`p`, {
	                                        className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
	                                        children: `仅用于兼容旧配置；视频和异步任务会持续查询，直到完成、失败、手动停止、删除节点或关闭应用`,
	                                      }),
	                                    ],
	                                  }),
	                                  jsxs(`div`, {
	                                    children: [
	                                      jsx(`label`, {
	                                        className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                        children: `文件下载地址`,
	                                      }),
	                                      jsxs(`div`, {
	                                        className: `flex gap-2`,
	                                        children: [
	                                          jsx(`input`, {
	                                            className: `flex-1 bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all wanjuan-settings-control`,
	                                            value: downloadDirectory,
	                                            readOnly: true,
	                                            placeholder: `默认保存到“下载/万卷灵境”`,
	                                          }),
	                                          jsx(`button`, {
	                                            type: `button`,
	                                            className: `px-3 py-2 rounded-lg bg-[#222] border border-[#333] text-xs text-gray-200 hover:bg-[#2a2a2a] transition-colors whitespace-nowrap wanjuan-settings-button`,
	                                            onClick: async () => {
	                                              let result =
	                                                await window.wanjuanDesktop?.chooseDownloadDirectory?.();
	                                              result?.ok &&
	                                                result.path &&
	                                                setDownloadDirectory(result.path);
	                                            },
	                                            children: `选择文件夹`,
	                                          }),
	                                          jsx(`button`, {
	                                            type: `button`,
	                                            className: `px-3 py-2 rounded-lg bg-[#222] border border-[#333] text-xs text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] transition-colors whitespace-nowrap wanjuan-settings-button wanjuan-settings-button-muted`,
	                                            onClick: async () => {
	                                              let result =
	                                                await window.wanjuanDesktop?.getDefaultDownloadDirectory?.();
	                                              result?.ok &&
	                                                result.path &&
	                                                setDownloadDirectory(result.path);
	                                            },
	                                            children: `默认`,
	                                          }),
	                                        ],
	                                      }),
	                                      jsx(`p`, {
	                                        className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
	                                        children: `节点下载按钮会直接保存到此文件夹，不再跳转浏览器。留空时使用系统下载目录下的“万卷灵境”文件夹。`,
	                                      }),
	                                      jsxs(`div`, {
	                                        className: `wanjuan-auto-download-row`,
	                                        "data-wanjuan-auto-download-row": `true`,
	                                        "data-wanjuan-native": `true`,
	                                        children: [
	                                          jsxs(`div`, {
	                                            className: `wanjuan-auto-download-copy`,
	                                            children: [
	                                              jsx(`div`, {
	                                                className: `wanjuan-auto-download-title`,
	                                                children: `生成结果自动下载`,
	                                              }),
	                                              jsx(`div`, {
	                                                className: `wanjuan-auto-download-desc`,
	                                                children: `开启后，图片、视频、音频生成完成会自动保存到上面的文件夹。`,
	                                              }),
	                                            ],
	                                          }),
	                                          jsxs(`button`, {
	                                            type: `button`,
	                                            className: `wanjuan-auto-download-switch`,
	                                            role: `switch`,
	                                            "aria-label": `生成结果自动下载`,
	                                            "aria-checked": autoDownloadGeneratedResults ? `true` : `false`,
	                                            onClick: () => {
	                                              let nextEnabled = !autoDownloadGeneratedResults;
	                                              setAutoDownloadGeneratedResults(nextEnabled);
	                                              try {
	                                                window.dispatchEvent(new CustomEvent(`wanjuan:auto-download-setting-changed`, {
	                                                  detail: {
	                                                    enabled: nextEnabled,
	                                                  },
	                                                }));
	                                              } catch {}
	                                            },
	                                            children: [
	                                              jsx(`span`, {
	                                                className: `wanjuan-auto-download-knob`,
	                                              }),
	                                              jsx(`span`, {
	                                                className: `wanjuan-auto-download-state`,
	                                                "data-wanjuan-auto-download-state": `true`,
	                                                children: autoDownloadGeneratedResults ? `已开启` : `已关闭`,
	                                              }),
	                                              jsx(`input`, {
	                                                type: `checkbox`,
	                                                checked: autoDownloadGeneratedResults,
	                                                readOnly: true,
	                                                "data-wanjuan-auto-download-toggle": `true`,
	                                              }),
	                                            ],
	                                          }),
	                                        ],
	                                      }),
	                                    ],
	                                  }),
	                                  jsxs(`div`, {
	                                    children: [
	                                      jsx(`label`, {
	                                        className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                        children: `按层级运行最大并发数选项 (换行分隔)`,
	                                      }),
                                      jsx(`textarea`, {
                                        value: layeredRunConcurrencyOptions,
                                        onChange: (event) => {
                                          (setLayeredRunConcurrencyOptions(
                                              event.target.value,
                                            ),
                                            event.target.value
                                            .split(/\r?\n/)
                                            .map((item) =>
                                              Number(item.trim()),
                                            )
                                            .filter(
                                              (value) =>
                                              Number.isFinite(value) &&
                                              value > 0,
                                            )
                                            .includes(
                                              Number(
                                                layeredRunMaxConcurrency,
                                              ),
                                            ) ||
                                            setLayeredRunMaxConcurrency(
                                              Number(
                                                event.target.value
                                                .split(/\r?\n/)
                                                .map((item) =>
                                                  item.trim(),
                                                )
                                                .find(Boolean),
                                              ) || 1,
                                            ));
                                        },
                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
                                        placeholder: `2
3
5`,
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
                                        children: `默认最大并发数`,
                                      }),
                                      jsx(`div`, {
                                        className: `flex flex-wrap gap-2 bg-[#121212] border border-[#333] rounded-lg p-3`,
                                        children: layeredRunConcurrencyOptions
                                          .split(/\r?\n/)
                                          .map((item) =>
                                            Number(item.trim()),
                                          )
                                          .filter(
                                            (value, index, array) =>
                                            Number.isFinite(value) &&
                                            value > 0 &&
                                            array.indexOf(value) === index,
                                          )
                                          .map((option) =>
                                            jsx(
                                              `button`, {
                                                type: `button`,
                                                onClick: () =>
                                                  setLayeredRunMaxConcurrency(
                                                    option,
                                                  ),
                                                className: `px-3 py-1.5 rounded-lg text-xs border transition-colors ${Number(layeredRunMaxConcurrency) === option ? `bg-green-500/20 text-green-300 border-green-500/40` : `bg-[#1a1a1a] text-gray-400 border-[#333] hover:text-gray-200 hover:bg-[#222]`}`,
                                                children: `${option} 并发`,
                                              },
                                              option,
                                            ),
                                          ),
                                      }),
	                                      jsx(`p`, {
	                                        className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
	                                        children: `右键菜单中的“按层级运行后续节点”会使用这里选中的最大并发数。同一层节点按依赖满足情况并发运行，失败分支不会继续向下触发。`,
	                                      }),
	                                    ],
	                                  }),
	                                ],
	                              }),
	                            ],
		                          }),
		                          false &&
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
                                        className: `text-yellow-500`,
                                        children: `✨`,
                                      }),
                                      ` 预设提示词`,
                                      jsxs(`span`, {
                                        className: `text-xs text-gray-500 font-normal ml-2 bg-[#222] px-2 py-0.5 rounded-full`,
                                        children: [`(`, presetPrompts.length, `)`],
                                      }),
				                                ],
				                                  }),
				                                  jsx(`button`, {
                                    onClick: handleAddPreset,
                                    className: `text-xs px-3 py-1.5 rounded-lg transition-colors bg-[#222] text-gray-300 hover:bg-[#2a2a2a] hover:text-blue-400 wanjuan-settings-button`,
                                    disabled: false,
                                    title: `添加预设`,
                                    children: `+ 添加新预设`,
                                  }),
				                                ],
				                              }),
                              jsx(`div`, {
                                className: `px-4 pt-4`,
                                children: jsxs(`div`, {
                                  className: `space-y-3 custom-scrollbar`,
                                  children: [
                                    presetPrompts.map((rule, index) =>
                                      jsxs(
                                        `div`, {
                                          className: `flex gap-3 items-start bg-[#121212] p-3 rounded-lg border border-[#333] hover:border-[#444] transition-colors group/preset wanjuan-settings-list-card`,
                                          children: [
                                            jsx(`div`, {
                                              className: `flex flex-col gap-2 pt-1.5`,
                                              children: jsx(`input`, {
                                                type: `checkbox`,
                                                checked: rule.enabled !== false,
                                                onChange: (event) =>
                                                  updatePresetField(
                                                    index,
                                                    `enabled`,
                                                    event.target.checked,
                                                  ),
                                                className: `cursor-pointer accent-blue-500 w-4 h-4`,
                                                title: `启用/禁用`,
                                              }),
                                            }),
                                            jsxs(`div`, {
                                              className: `flex-1 space-y-2`,
                                              children: [
                                                jsxs(`div`, {
                                                  className: `flex gap-2`,
                                                  children: [
                                                    jsx(`input`, {
                                                      className: `w-full text-xs bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-gray-300 focus:border-blue-500 outline-none transition-all wanjuan-settings-control`,
                                                      placeholder: `标题`,
                                                      value: rule.title,
                                                      onChange: (event) =>
                                                        updatePresetField(
                                                          index,
                                                          `title`,
                                                          event.target.value,
                                                        ),
                                                    }),
                                                    jsxs(`select`, {
                                                      className: `text-xs bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-gray-300 focus:border-blue-500 outline-none transition-all w-24 wanjuan-settings-control wanjuan-settings-select`,
                                                      value: rule.type || `all`,
                                                      onChange: (event) =>
                                                        updatePresetField(
                                                          index,
                                                          `type`,
                                                          event.target.value,
                                                        ),
                                                      children: [
                                                        jsx(`option`, {
                                                          value: `all`,
                                                          children: `通用`,
                                                        }),
                                                        jsx(`option`, {
                                                          value: `text`,
                                                          children: `文本`,
                                                        }),
                                                        jsx(`option`, {
                                                          value: `image`,
                                                          children: `生图`,
                                                        }),
                                                        jsx(`option`, {
                                                          value: `video`,
                                                          children: `视频`,
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                                jsx(`textarea`, {
                                                  className: `w-full text-xs bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 resize-none h-16 text-gray-400 focus:border-blue-500 outline-none transition-all wanjuan-settings-control`,
                                                  placeholder: `提示词内容`,
                                                  value: rule.prompt,
                                                  onChange: (event) =>
                                                    updatePresetField(
                                                      index,
                                                      `prompt`,
                                                      event.target.value,
                                                    ),
                                                }),
                                              ],
                                            }),
                                            jsx(`button`, {
                                              onClick: () => handleRemovePreset(index),
                                              className: `wanjuan-danger-icon-action text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover/preset:opacity-100`,
                                              children: jsx(Trash2, {
                                                size: 14,
                                              }),
                                            }),
                                          ],
                                        },
                                        index,
                                      ),
                                    ),
                                    false &&
                                    presetPrompts.length >= currentLimits.presets &&
                                    $e.type !== `VIP` &&
                                    jsx(`div`, {
                                      className: `text-xs text-center text-gray-500 mt-4 bg-[#222] p-2 rounded-lg`,
                                      children: `已达当前版本预设上限，请升级会员`,
                                    }),
                                  ],
                                }),
                              }),
                            ],
                          }),
	                        ],
	                      });
}
