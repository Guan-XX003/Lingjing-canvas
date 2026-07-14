/** 设置-基础 标签页。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { Trash2 } from "lucide-react";
declare const chrome: any;

export function WanJuanSettingsBasicTab({
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
}: any) {
  return jsxs(`div`, {
                        className: `space-y-6 wanjuan-settings-section`,
                        children: [
                          jsxs(`div`, {
                            className: `hidden`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header bg-[#1a1a1a]`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
                                      jsx(`span`, {
                                        className: `text-blue-400`,
                                        children: `👑`,
                                      }),
                                      ` 会员与激活`,
                                    ],
                                  }),
                                  $e.type !== `VIP` &&
                                  jsx(`a`, {
                                    href: `https://test-cyfyd24zfbua.feishu.cn/wiki/JrwVweiryijlX3kZKx5cGvgnnCE?from=from_copylink`,
                                    target: `_blank`,
                                    className: `text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full transition-colors`,
                                    children: `使用指南 & 激活码`,
                                  }),
                                ],
                              }),
                              jsxs(`div`, {
                                className: `px-4 pt-4`,
                                children: [
                                  jsxs(`div`, {
                                    className: `flex items-center gap-3 mb-6`,
                                    children: [
                                      jsx(`span`, {
                                        className: `wanjuan-tier-badge px-3 py-1 rounded-full text-xs font-bold shadow-sm ${$e.type === `VIP` ? `wanjuan-tier-badge-vip` : $e.type === `PRO` ? `wanjuan-tier-badge-pro` : `wanjuan-tier-badge-free`}`,
                                        children: currentLimits.name,
                                      }),
                                      $e.type !== `FREE` &&
                                      jsxs(`span`, {
                                        className: `text-xs text-gray-500 bg-[#222] px-3 py-1 rounded-full border border-[#333]`,
                                        children: [
                                          `有效期至: `,
                                          new Date(
                                            $e.expiry,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      jsxs(`span`, {
                                        className: `text-xs text-gray-500 bg-[#222] px-3 py-1 rounded-full border border-[#333] font-mono select-all`,
                                        children: [`设备ID: `, deviceId],
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-3 gap-3 text-center mb-6`,
                                    children: [
                                      jsxs(`div`, {
                                        className: `text-base font-bold text-gray-200`,
                                        children: [
                                          users.length,
                                          ` `,
                                          jsxs(`span`, {
                                            className: `text-gray-600 text-sm`,
                                            children: [`/ `, currentLimits.accounts],
                                          }),
                                        ],
                                      }),
                                      jsxs(`div`, {
                                        className: `bg-[#121212] p-3 rounded-lg border border-[#222] hover:border-[#333] transition-colors`,
                                        children: [
                                          jsx(`div`, {
                                            className: `text-xs text-gray-500 mb-1`,
                                            children: `预设词数量`,
                                          }),
                                          jsxs(`div`, {
                                            className: `text-base font-bold text-gray-200`,
                                            children: [
                                              presetPrompts.length,
                                              ` `,
                                              jsxs(`span`, {
                                                className: `text-gray-600 text-sm`,
                                                children: [
                                                  `/ `,
                                                  currentLimits.presets,
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      jsxs(`div`, {
                                        className: `bg-[#121212] p-3 rounded-lg border border-[#222] hover:border-[#333] transition-colors`,
                                        children: [
                                          jsx(`div`, {
                                            className: `text-xs text-gray-500 mb-1`,
                                            children: `每日生图/视频`,
                                          }),
                                          jsxs(`div`, {
                                            className: `text-base font-bold text-gray-200`,
                                            children: [
                                              dailyUsageCount,
                                              ` `,
                                              jsxs(`span`, {
                                                className: `text-gray-600 text-sm`,
                                                children: [
                                                  `/ `,
                                                  currentLimits.dailyGenerations,
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `border border-[#333] rounded-lg overflow-hidden transition-all bg-[#121212]`,
                                    children: [
                                      jsxs(`button`, {
                                        onClick: () => setExpanded(!expanded),
                                        className: `w-full flex items-center justify-between p-3 text-sm text-gray-300 hover:bg-[#1a1a1a] transition-colors`,
                                        children: [
                                          jsxs(`span`, {
                                            className: `flex items-center gap-2`,
                                            children: [
                                              jsx(`span`, {
                                                className: `text-blue-400`,
                                                children: `🔑`,
                                              }),
                                              ` 使用激活码升级会员`,
                                            ],
                                          }),
                                          jsx(`span`, {
                                            className: `transform transition-transform text-gray-500 ${expanded ? `rotate-180` : ``}`,
                                            children: `▼`,
                                          }),
                                        ],
                                      }),
                                      expanded &&
                                      jsxs(`div`, {
                                        className: `p-3 pt-0 flex gap-2 border-t border-[#333]`,
                                        children: [
                                          jsx(`input`, {
                                            className: `flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600`,
                                            placeholder: `输入您的激活码`,
                                            value: membershipCode,
                                            onChange: (event) =>
                                              setMembershipCode(event.target.value),
                                          }),
                                          jsx(`button`, {
                                            onClick: handleServerVerify,
                                            className: `bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-500 font-medium transition-colors shadow-sm shadow-blue-900/20`,
                                            children: `激活`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
	                          jsx(`div`, {
	                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
	                            children: jsxs(`div`, {
	                              className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
	                              children: [
	                                jsxs(`div`, {
	                                  children: [
	                                    jsx(`label`, {
	                                      className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                      children: wanjuanT(`界面主题`),
	                                    }),
	                                    jsx(`select`, {
	                                      className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all wanjuan-settings-control`,
	                                      value: normalizeThemeMode(themeMode),
	                                      onChange: (event) => {
	                                        let themeMode2 = normalizeThemeMode(event.target.value);
	                                        setThemeMode(themeMode2);
	                                        try {
	                                          localStorage.setItem(`themeMode`, themeMode2),
	                                            localStorage.setItem(`uiTheme`, themeMode2),
	                                            localStorage.setItem(`theme`, themeMode2),
	                                            localStorage.setItem(`appearanceTheme`, themeMode2);
	                                        } catch {}
	                                        typeof chrome < `u` &&
	                                          chrome.storage &&
	                                          chrome.storage.local &&
	                                          chrome.storage.local.set({
	                                            themeMode: themeMode2,
	                                            uiTheme: themeMode2,
	                                            theme: themeMode2,
	                                            appearanceTheme: themeMode2,
	                                          });
	                                      },
	                                      children: [
	                                        jsx(`option`, {
	                                          value: `dark`,
	                                          children: wanjuanT(`曜石黑`),
	                                        }),
	                                        jsx(`option`, {
	                                          value: `light`,
	                                          children: wanjuanT(`晴空蓝`),
	                                        }),
	                                        jsx(`option`, {
	                                          value: `warm-light`,
	                                          children: wanjuanT(`暖砂白`),
	                                        }),
	                                        jsx(`option`, {
	                                          value: `chrome-rose`,
	                                          children: wanjuanT(`樱雾粉`),
	                                        }),
	                                        jsx(`option`, {
	                                          value: `sage-green`,
	                                          children: wanjuanT(`薄荷绿`),
	                                        }),
	                                        jsx(`option`, {
	                                          value: `graphite`,
	                                          children: wanjuanT(`石墨灰`),
	                                        }),
	                                        jsx(`option`, {
	                                          value: `system`,
	                                          children: wanjuanT(`跟随系统`),
	                                        }),
	                                      ],
	                                    }),
	                                    jsx(`p`, {
	                                      className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
		                                      children: wanjuanT(`切换石墨灰、曜石黑、晴空蓝、暖砂白、樱雾粉、薄荷绿或跟随系统外观，不改变现有布局结构`),
	                                    }),
	                                  ],
	                                }),
	                                jsxs(`div`, {
	                                  children: [
	                                    jsx(`label`, {
	                                      className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                      children: wanjuanT(`语言设置`),
	                                    }),
	                                    jsx(`select`, {
	                                      className: `w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all wanjuan-settings-control`,
	                                      value: appLanguage,
		                                      onChange: (event) => {
		                                        let nextLanguage = event.target.value || `zh-CN`;
		                                        setAppLanguage(nextLanguage);
		                                        globalThis.wanjuanI18nRuntime?.setLanguage?.(nextLanguage);
		                                        try {
		                                          localStorage.setItem(`appLanguage`, nextLanguage),
	                                            localStorage.setItem(`uiLanguage`, nextLanguage);
	                                        } catch {}
	                                        typeof chrome < `u` &&
	                                          chrome.storage &&
	                                          chrome.storage.local &&
	                                          chrome.storage.local.set({
	                                            appLanguage: nextLanguage,
	                                            uiLanguage: nextLanguage,
	                                          });
	                                      },
	                                      children: [
	                                        jsx(`option`, {
	                                          value: `zh-CN`,
	                                          children: `简体中文`,
	                                        }),
	                                        jsx(`option`, {
	                                          value: `zh-TW`,
	                                          children: `繁體中文`,
	                                        }),
	                                        jsx(`option`, {
	                                          value: `en-US`,
	                                          children: `English`,
	                                        }),
	                                      ],
	                                    }),
	                                    jsx(`p`, {
	                                      className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
	                                      children: wanjuanT(`选择界面语言偏好，后续多语言文案将按此设置展示`),
	                                    }),
	                                  ],
	                                }),
	                                jsxs(`div`, {
	                                  children: [
	                                    jsx(`label`, {
	                                      className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                      children: wanjuanT(`关于`),
	                                    }),
	                                    jsxs(`div`, {
	                                      className: `bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 space-y-2 wanjuan-settings-about`,
	                                      children: [
	                                        jsx(`div`, {
	                                          className: `text-sm font-semibold text-gray-100`,
	                                          children: wanjuanT(`版本更新日志`),
	                                        }),
	                                        jsx(`div`, {
	                                          className: `pt-2 border-t border-[#262626] text-[11px] text-gray-500`,
				                                          children: wanjuanT(`1.3.8：修复全局批量配置与极鑫默认配置串供，确保配置切换完整隔离，并增强异步视频任务凭据恢复和状态一致性。`),
	                                        }),
	                                      ],
	                                    }),
	                                  ],
	                                }),
	                                jsxs(`div`, {
	                                  children: [
	                                    jsx(`label`, {
	                                      className: `block text-xs font-bold text-gray-300 mb-2 wanjuan-settings-field-label`,
	                                      children: wanjuanT(`当前版本`),
	                                    }),
                                    jsxs(`div`, {
                                      className: `flex items-center justify-between gap-3 bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 wanjuan-settings-readonly-row`,
                                      children: [
                                        jsx(`span`, {
                                          className: `text-sm font-semibold text-gray-100`,
				                                          children: `1.3.8`,
	                                        }),
	                                        jsxs(`div`, {
	                                          className: `flex items-center gap-2 ml-auto`,
	                                          "data-wanjuan-update-actions": `true`,
	                                          children: [
	                                            jsx(`span`, {
	                                              className: `text-[10px] text-gray-500 whitespace-nowrap`,
	                                              children: wanjuanT(`当前已启用全局统一API配置`),
	                                            }),
	                                            jsx(`button`, {
	                                              type: `button`,
	                                              className: `wanjuan-settings-button wanjuan-update-action-button wanjuan-check-updates-button`,
	                                              "data-wanjuan-check-updates": `true`,
	                                              onClick: async (event) => {
	                                                let button = event.currentTarget;
	                                                if (button.disabled) return;
	                                                button.disabled = true;
	                                                let oldText = button.textContent;
	                                                button.textContent = `检查中…`;
	                                                try {
	                                                  await window.wanjuanDesktop?.checkForUpdates?.();
	                                                } catch (error) {
	                                                  console.warn(`check for updates failed`, error);
	                                                } finally {
	                                                  button.disabled = false;
	                                                  button.textContent = oldText || `检查更新`;
	                                                }
	                                              },
	                                              children: `检查更新`,
	                                            }),
	                                            jsx(`button`, {
	                                              type: `button`,
	                                              className: `wanjuan-settings-button wanjuan-update-action-button wanjuan-official-site-button`,
	                                              "data-wanjuan-official-site": `true`,
	                                              onClick: () => window.open(`https://lingjing.guancn.uk`, `_blank`, `noopener,noreferrer`),
		                                              children: `前往官网`,
		                                            }),
		                                          ],
		                                        }),
	                                      ],
	                                    }),
	                                  ],
	                                }),
		                              ],
		                            }),
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
                                        children: [
                                          `(`,
                                          presetPrompts.length,
                                          `)`,
                                        ],
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
                                    presetPrompts.map((rule, promptIndex) =>
                                      jsxs(
                                        `div`, {
                                          className: `flex gap-3 items-start bg-[#121212] p-3 rounded-lg border border-[#333] hover:border-[#444] transition-colors group/preset wanjuan-settings-list-card`,
                                          children: [
                                            jsx(`div`, {
                                              className: `flex flex-col gap-2 pt-1.5`,
                                              children: jsx(
                                                `input`, {
                                                  type: `checkbox`,
                                                  checked: rule.enabled !== false,
                                                  onChange: (event) =>
                                                    updatePresetField(
                                                      promptIndex,
                                                      `enabled`,
                                                      event.target.checked,
                                                    ),
                                                  className: `cursor-pointer accent-blue-500 w-4 h-4`,
                                                  title: `启用/禁用`,
                                                },
                                              ),
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
                                                          promptIndex,
                                                          `title`,
                                                          event.target.value,
                                                        ),
                                                    }),
                                                    jsxs(
                                                      `select`, {
                                                        className: `text-xs bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-gray-300 focus:border-blue-500 outline-none transition-all w-24 wanjuan-settings-control wanjuan-settings-select`,
                                                        value: rule.type || `all`,
                                                        onChange: (event) =>
                                                          updatePresetField(
                                                            promptIndex,
                                                            `type`,
                                                            event.target
                                                            .value,
                                                          ),
                                                        children: [
                                                          jsx(
                                                            `option`, {
                                                              value: `all`,
                                                              children: `通用`,
                                                            },
                                                          ),
                                                          jsx(
                                                            `option`, {
                                                              value: `text`,
                                                              children: `文本`,
                                                            },
                                                          ),
                                                          jsx(
                                                            `option`, {
                                                              value: `image`,
                                                              children: `生图`,
                                                            },
                                                          ),
                                                          jsx(
                                                            `option`, {
                                                              value: `video`,
                                                              children: `视频`,
                                                            },
                                                          ),
                                                        ],
                                                      },
                                                    ),
                                                  ],
                                                }),
                                                jsx(`textarea`, {
                                                  className: `w-full text-xs bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 resize-none h-16 text-gray-400 focus:border-blue-500 outline-none transition-all wanjuan-settings-control`,
                                                  placeholder: `提示词内容`,
                                                  value: rule.prompt,
                                                  onChange: (event) =>
                                                    updatePresetField(
                                                      promptIndex,
                                                      `prompt`,
                                                      event.target.value,
                                                    ),
                                                }),
                                              ],
                                            }),
                                            jsx(`button`, {
                                              onClick: () => handleRemovePreset(promptIndex),
                                              className: `wanjuan-danger-icon-action text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover/preset:opacity-100`,
                                              children: jsx(Trash2, {
                                                size: 14,
                                              }),
                                            }),
                                          ],
                                        },
                                        promptIndex,
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
