/** 配置管家错误诊断助手浮层。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanConfigButlerErrorAssistant({
  applyConfigButlerErrorAssistantFix,
  applyConfigButlerManualProtocolFix,
  configButlerErrorAssistant,
  configButlerManualProblemPart,
  configButlerManualProtocolName,
  configButlerManualProtocolOpen,
  configButlerManualProtocolText,
  configButlerRepairHistory,
  configButlerRepairHistoryOpen,
  configErrorAssistantTheme,
  openConfigButlerManualProblemFields,
  rollbackConfigButlerRepair,
  setConfigButlerErrorAssistant,
  setConfigButlerErrorAssistantMinimized,
  setConfigButlerManualProblemPart,
  setConfigButlerManualProtocolName,
  setConfigButlerManualProtocolOpen,
  setConfigButlerManualProtocolText,
  setConfigButlerRepairHistoryOpen,
}: any) {
  return jsxs(`div`, {
	                  className: `fixed right-4 top-[132px] z-[90] w-[360px] max-w-[calc(100vw-32px)] rounded-lg border overflow-hidden wanjuan-config-error-assistant`,
                  style: {
                    position: `fixed`,
                    right: `16px`,
	                    top: `132px`,
                    zIndex: 9999,
                    width: `360px`,
                    maxWidth: `calc(100vw - 32px)`,
                    background: configErrorAssistantTheme.panelBg,
                    border: `1px solid ${configErrorAssistantTheme.border}`,
                    opacity: 1,
                    backdropFilter: `none`,
                    boxShadow: configErrorAssistantTheme.shadow,
                    color: configErrorAssistantTheme.textPrimary,
                    WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                  },
                  children: [
                    jsx(`style`, {
                      children: `.wanjuan-config-error-assistant,.wanjuan-config-error-assistant *{box-sizing:border-box}.wanjuan-config-error-assistant-action{cursor:pointer;user-select:none}.wanjuan-config-error-assistant-action:hover{filter:brightness(1.04)}`,
                    }),
                    jsxs(`div`, {
                      className: `flex items-start justify-between gap-3 border-b px-3 py-2`,
                      style: {
                        background: configErrorAssistantTheme.headerBg,
                        borderBottom: `1px solid ${configErrorAssistantTheme.border}`,
                      },
                      children: [
                        jsxs(`div`, {
                          className: `flex flex-col gap-0.5`,
                          children: [
                            jsx(`div`, {
                              className: `text-xs font-bold text-cyan-100`,
                              style: {
                                color: configErrorAssistantTheme.textPrimary,
                                WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                              },
                              children: `配置管家错误查询`,
                            }),
                            jsx(`div`, {
                              className: `text-[10px] text-gray-400`,
                              style: {
                                color: configErrorAssistantTheme.textSecondary,
                                WebkitTextFillColor: configErrorAssistantTheme.textSecondary,
                              },
	                              children: configButlerErrorAssistant.status === `checking` ?
	                                configButlerErrorAssistant.manualScan ?
	                                `正在扫描最新失败任务` :
	                                `正在对照文档和协议配置` :
	                                configButlerErrorAssistant.status === `applied` ?
	                                `修复已应用` :
	                                `最新失败诊断结果`,
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex items-center gap-1`,
                          children: [
                            jsx(`div`, {
                              onClick: () => setConfigButlerErrorAssistantMinimized(true),
                              role: `button`,
                              tabIndex: 0,
                              className: `wanjuan-config-error-assistant-action rounded px-2 py-1 text-[11px]`,
                              style: {
                                border: `1px solid ${configErrorAssistantTheme.buttonBorder}`,
                                background: configErrorAssistantTheme.buttonBg,
                                backgroundImage: `none`,
                                color: configErrorAssistantTheme.buttonText,
                                WebkitTextFillColor: configErrorAssistantTheme.buttonText,
                              },
                              title: `最小化`,
                              children: `最小化`,
                            }),
                            jsx(`div`, {
                              onClick: () => {
                                setConfigButlerErrorAssistantMinimized(false);
                                setConfigButlerErrorAssistant(null);
                              },
                              role: `button`,
                              tabIndex: 0,
                              className: `wanjuan-config-error-assistant-action rounded px-2 py-1 text-[11px]`,
                              style: {
                                border: `1px solid ${configErrorAssistantTheme.buttonBorder}`,
                                background: configErrorAssistantTheme.buttonBg,
                                backgroundImage: `none`,
                                color: configErrorAssistantTheme.buttonText,
                                WebkitTextFillColor: configErrorAssistantTheme.buttonText,
                              },
                              title: `关闭`,
                              children: `关闭`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex flex-col gap-2 px-3 py-3 text-xs`,
                      style: {
                        background: configErrorAssistantTheme.bodyBg,
                        color: configErrorAssistantTheme.textPrimary,
                        WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                      },
                      children: [
                        jsxs(`div`, {
                          className: `rounded border border-white/10 bg-black/20 p-2 text-[11px] text-gray-300`,
                          style: {
                            background: configErrorAssistantTheme.cardBg,
                            border: `1px solid ${configErrorAssistantTheme.border}`,
                            color: configErrorAssistantTheme.textSecondary,
                            WebkitTextFillColor: configErrorAssistantTheme.textSecondary,
                          },
                          children: [
                            jsx(`div`, {
                              className: `font-semibold text-gray-200 truncate`,
                              style: {
                                color: configErrorAssistantTheme.textPrimary,
                                WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                              },
                              title: configButlerErrorAssistant.task?.modelName || ``,
                              children: configButlerErrorAssistant.task?.modelName || `未知模型`,
                            }),
                            jsx(`div`, {
                              className: `mt-1 text-red-300 break-words`,
                              style: {
                                color: configErrorAssistantTheme.dangerText,
                                WebkitTextFillColor: configErrorAssistantTheme.dangerText,
                              },
                              children: configButlerErrorAssistant.task?.errorMsg || `未知错误`,
                            }),
                          ],
                        }),
                        configButlerErrorAssistant.status === `checking` ?
                        jsx(`div`, {
                          className: `rounded border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-100`,
                          style: {
                            background: configErrorAssistantTheme.accentBg,
                            border: `1px solid ${configErrorAssistantTheme.accentBorder}`,
                            color: configErrorAssistantTheme.accentText,
                            WebkitTextFillColor: configErrorAssistantTheme.accentText,
	                          },
	                          children: configButlerErrorAssistant.manualScan ?
	                            `正在读取任务清单里的最新失败记录...` :
	                            `正在读取 API 文档、当前模型协议和任务错误信息...`,
                        }) :
                        configButlerErrorAssistant.diagnosis &&
                        jsxs(Fragment, {
                          children: [
                            jsxs(`div`, {
                              className: `flex items-center justify-between gap-2`,
                              children: [
                                jsx(`span`, {
                                  className: `rounded px-2 py-0.5 text-[10px] ${configButlerErrorAssistant.diagnosis.classification === `upstream` ? `bg-amber-500/20 text-amber-200` : configButlerErrorAssistant.diagnosis.classification === `request_config` ? `bg-red-500/20 text-red-200` : configButlerErrorAssistant.diagnosis.classification === `model_code` ? `bg-purple-500/20 text-purple-200` : `bg-gray-500/20 text-gray-200`}`,
                                  style: {
                                    backgroundColor: configButlerErrorAssistant.diagnosis.classification === `upstream` ? configErrorAssistantTheme.accentBg : configButlerErrorAssistant.diagnosis.classification === `request_config` ? configErrorAssistantTheme.dangerBg : configButlerErrorAssistant.diagnosis.classification === `model_code` ? configErrorAssistantTheme.accentBg : configErrorAssistantTheme.cardBg,
                                    color: configButlerErrorAssistant.diagnosis.classification === `request_config` ? configErrorAssistantTheme.dangerText : configErrorAssistantTheme.accentText,
                                    WebkitTextFillColor: configButlerErrorAssistant.diagnosis.classification === `request_config` ? configErrorAssistantTheme.dangerText : configErrorAssistantTheme.accentText,
                                  },
                                  children: configButlerErrorAssistant.diagnosis.classification === `upstream` ?
                                    `上游中转站` :
                                    configButlerErrorAssistant.diagnosis.classification === `request_config` ?
                                    `请求配置问题` :
                                    configButlerErrorAssistant.diagnosis.classification === `model_code` ?
                                    `代码适配问题` :
                                    `原因不确定`,
                                }),
                                jsx(`span`, {
                                  className: `text-[10px] text-gray-500`,
                                  style: {
                                    color: configErrorAssistantTheme.textMuted,
                                    WebkitTextFillColor: configErrorAssistantTheme.textMuted,
                                  },
                                  children: `置信度 ${Math.round((Number(configButlerErrorAssistant.diagnosis.confidence) || 0) * 100)}%`,
                                }),
                              ],
                            }),
                            jsx(`div`, {
                              className: `leading-relaxed text-gray-200`,
                              style: {
                                color: configErrorAssistantTheme.textPrimary,
                                WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                              },
                              children: configButlerErrorAssistant.diagnosis.summary || `诊断完成`,
                            }),
                            configButlerErrorAssistant.diagnosis.evidence?.length > 0 &&
                            jsx(`div`, {
                              className: `max-h-24 overflow-y-auto rounded border border-white/10 bg-black/20 p-2 text-[11px] text-gray-400 custom-scrollbar`,
                              style: {
                                background: configErrorAssistantTheme.cardBg,
                                border: `1px solid ${configErrorAssistantTheme.border}`,
                                color: configErrorAssistantTheme.textSecondary,
                                WebkitTextFillColor: configErrorAssistantTheme.textSecondary,
                              },
                              children: configButlerErrorAssistant.diagnosis.evidence.slice(0, 4).map((props, evidenceIndex) =>
                                jsx(`div`, {
                                  className: `break-words`,
                                  children: `· ${props}`,
                                }, evidenceIndex),
                              ),
                            }),
                            configButlerErrorAssistant.diagnosis.suggestedFix &&
                            jsx(`div`, {
                              className: `rounded border border-white/10 bg-[#10151c] p-2 text-[11px] leading-relaxed text-gray-300`,
                              style: {
                                background: configErrorAssistantTheme.cardBg,
                                border: `1px solid ${configErrorAssistantTheme.border}`,
                                color: configErrorAssistantTheme.textPrimary,
                                WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                              },
                              children: configButlerErrorAssistant.diagnosis.suggestedFix,
                            }),
                            configButlerErrorAssistant.status === `applied` &&
                            jsx(`div`, {
                              className: `rounded border border-green-500/20 bg-green-500/10 p-2 text-[11px] text-green-200`,
                              style: {
                                background: configErrorAssistantTheme.successBg,
                                border: `1px solid ${configErrorAssistantTheme.mutedBorder}`,
                                color: configErrorAssistantTheme.successText,
                                WebkitTextFillColor: configErrorAssistantTheme.successText,
                              },
                              children: `修复已写入模型协议配置。请重新运行该节点验证。`,
                            }),
                            configButlerManualProtocolOpen &&
                            jsxs(`div`, {
                              className: `rounded border p-2 text-[11px]`,
                              style: {
                                background: configErrorAssistantTheme.cardBg,
                                border: `1px solid ${configErrorAssistantTheme.border}`,
                                color: configErrorAssistantTheme.textSecondary,
                                WebkitTextFillColor: configErrorAssistantTheme.textSecondary,
                              },
                              children: [
                                jsxs(`div`, {
                                  className: `mb-2 flex items-center justify-between gap-2`,
                                  children: [
                                    jsx(`div`, {
                                      className: `font-semibold`,
                                      style: {
                                        color: configErrorAssistantTheme.textPrimary,
                                        WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                                      },
                                      children: `问题字段`,
                                    }),
                                    jsx(`div`, {
                                      onClick: () => setConfigButlerManualProtocolOpen(false),
                                      role: `button`,
                                      tabIndex: 0,
                                      className: `wanjuan-config-error-assistant-action rounded px-2 py-1`,
                                      style: {
                                        border: `1px solid ${configErrorAssistantTheme.buttonBorder}`,
                                        background: configErrorAssistantTheme.buttonBg,
                                        color: configErrorAssistantTheme.buttonText,
                                        WebkitTextFillColor: configErrorAssistantTheme.buttonText,
                                      },
                                      children: `收起`,
                                    }),
                                  ],
                                }),
                                jsxs(`div`, {
                                  className: `mb-2 grid grid-cols-3 gap-1`,
                                  children: [
                                    [`submit`, `创建`],
                                    [`poll`, `查询`],
                                    [`content`, `获取结果`],
                                  ].map((entry) =>
                                    jsx(`div`, {
                                      onClick: () => setConfigButlerManualProblemPart(entry[0]),
                                      role: `button`,
                                      tabIndex: 0,
                                      className: `wanjuan-config-error-assistant-action rounded px-2 py-1 text-center`,
                                      style: {
                                        border: `1px solid ${configButlerManualProblemPart === entry[0] ? configErrorAssistantTheme.accentBorder : configErrorAssistantTheme.buttonBorder}`,
                                        background: configButlerManualProblemPart === entry[0] ? configErrorAssistantTheme.accentBg : configErrorAssistantTheme.buttonBg,
                                        color: configButlerManualProblemPart === entry[0] ? configErrorAssistantTheme.accentText : configErrorAssistantTheme.buttonText,
                                        WebkitTextFillColor: configButlerManualProblemPart === entry[0] ? configErrorAssistantTheme.accentText : configErrorAssistantTheme.buttonText,
                                      },
                                      children: entry[1],
                                    }, entry[0]),
                                  ),
                                }),
                                jsx(`div`, {
                                  className: `mb-2 rounded border px-2 py-1 leading-relaxed`,
                                  style: {
                                    border: `1px solid ${configErrorAssistantTheme.mutedBorder}`,
                                    color: configErrorAssistantTheme.textMuted,
                                    WebkitTextFillColor: configErrorAssistantTheme.textMuted,
                                  },
                                  children: configButlerManualProblemPart === `submit` ?
                                    `创建主要改 requestType、submitPath、fieldMapping、fieldValueTypes、extraBody 和 responseMapping。` :
                                    configButlerManualProblemPart === `poll` ?
                                    `查询主要改 pollPath、responseMapping、状态字段和任务 ID 占位符 {taskId}。` :
                                    `获取结果主要改 contentPath、responseMapping 里视频/图片/音频结果地址的解析字段。`,
                                }),
                                jsx(`input`, {
                                  value: configButlerManualProtocolName,
                                  onChange: (event) => setConfigButlerManualProtocolName(event.target.value),
                                  className: `mb-2 w-full rounded border px-2 py-1 text-[11px] outline-none`,
                                  style: {
                                    background: configErrorAssistantTheme.bodyBg,
                                    border: `1px solid ${configErrorAssistantTheme.border}`,
                                    color: configErrorAssistantTheme.textPrimary,
                                    WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                                  },
                                  placeholder: `协议名称`,
                                }),
                                jsx(`textarea`, {
                                  value: configButlerManualProtocolText,
                                  onChange: (event) => setConfigButlerManualProtocolText(event.target.value),
                                  className: `h-40 w-full resize-y rounded border px-2 py-1 font-mono text-[10px] leading-relaxed outline-none custom-scrollbar`,
                                  style: {
                                    background: configErrorAssistantTheme.bodyBg,
                                    border: `1px solid ${configErrorAssistantTheme.border}`,
                                    color: configErrorAssistantTheme.textPrimary,
                                    WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                                  },
                                  spellCheck: false,
                                }),
                                jsx(`div`, {
                                  onClick: applyConfigButlerManualProtocolFix,
                                  role: `button`,
                                  tabIndex: 0,
                                  className: `wanjuan-config-error-assistant-action mt-2 rounded px-3 py-1.5 text-center font-semibold`,
                                  style: {
                                    background: configErrorAssistantTheme.primaryBg,
                                    border: `1px solid ${configErrorAssistantTheme.accentBorder}`,
                                    color: configErrorAssistantTheme.primaryText,
                                    WebkitTextFillColor: configErrorAssistantTheme.primaryText,
                                  },
                                  children: `应用手动修复`,
                                }),
                              ],
                            }),
                            configButlerRepairHistoryOpen &&
                            jsx(`div`, {
                              className: `max-h-36 overflow-y-auto rounded border p-2 text-[11px] custom-scrollbar`,
                              style: {
                                background: configErrorAssistantTheme.cardBg,
                                border: `1px solid ${configErrorAssistantTheme.border}`,
                                color: configErrorAssistantTheme.textSecondary,
                                WebkitTextFillColor: configErrorAssistantTheme.textSecondary,
                              },
                              children: (configButlerRepairHistory || []).length ?
                              (configButlerRepairHistory || []).slice(0, 8).map((model) =>
                                jsxs(`div`, {
                                  className: `flex items-start justify-between gap-2 border-b py-1 last:border-b-0`,
                                  style: {
                                    borderColor: configErrorAssistantTheme.mutedBorder,
                                  },
                                  children: [
                                    jsxs(`div`, {
                                      className: `min-w-0`,
                                      children: [
                                        jsx(`div`, {
                                          className: `truncate font-semibold`,
                                          style: {
                                            color: configErrorAssistantTheme.textPrimary,
                                            WebkitTextFillColor: configErrorAssistantTheme.textPrimary,
                                          },
                                          title: model.modelName || ``,
                                          children: model.modelName || `未知模型`,
                                        }),
                                        jsx(`div`, {
                                          className: `truncate`,
                                          children: `${model.globalConfigName || `当前配置`} · ${model.category || `unknown`} · ${model.rolledBackAt ? `已撤回` : new Date(model.createdAt || Date.now()).toLocaleString()}`,
                                        }),
                                      ],
                                    }),
                                    model.rolledBackAt ?
                                    jsx(`span`, {
                                      className: `shrink-0 rounded px-2 py-1`,
                                      style: {
                                        color: configErrorAssistantTheme.textMuted,
                                        WebkitTextFillColor: configErrorAssistantTheme.textMuted,
                                      },
                                      children: `已撤回`,
                                    }) :
                                    jsx(`div`, {
                                      onClick: () => rollbackConfigButlerRepair(model.id),
                                      role: `button`,
                                      tabIndex: 0,
                                      className: `wanjuan-config-error-assistant-action shrink-0 rounded px-2 py-1`,
                                      style: {
                                        border: `1px solid ${configErrorAssistantTheme.buttonBorder}`,
                                        background: configErrorAssistantTheme.buttonBg,
                                        color: configErrorAssistantTheme.buttonText,
                                        WebkitTextFillColor: configErrorAssistantTheme.buttonText,
                                      },
                                      children: `撤回`,
                                    }),
                                  ],
                                }, model.id),
                              ) :
                              jsx(`div`, {
	                                children: `还没有配置管家修复记录`,
                              }),
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex justify-end gap-2 pt-1`,
                          children: [
                            configButlerErrorAssistant.diagnosis &&
                            configButlerErrorAssistant.status !== `checking` &&
                            jsx(`div`, {
                              onClick: openConfigButlerManualProblemFields,
                              role: `button`,
                              tabIndex: 0,
                              className: `wanjuan-config-error-assistant-action rounded px-3 py-1.5 text-[11px]`,
                              style: {
                                border: `1px solid ${configErrorAssistantTheme.buttonBorder}`,
                                background: configButlerManualProtocolOpen ? configErrorAssistantTheme.accentBg : configErrorAssistantTheme.buttonBg,
                                color: configButlerManualProtocolOpen ? configErrorAssistantTheme.accentText : configErrorAssistantTheme.buttonText,
                                WebkitTextFillColor: configButlerManualProtocolOpen ? configErrorAssistantTheme.accentText : configErrorAssistantTheme.buttonText,
                              },
                              title: `打开当前失败模型的创建、查询和获取结果协议字段`,
                              children: configButlerManualProtocolOpen ? `刷新字段` : `问题字段`,
                            }),
                            jsx(`div`, {
                              onClick: () => setConfigButlerRepairHistoryOpen(!configButlerRepairHistoryOpen),
                              role: `button`,
                              tabIndex: 0,
                              className: `wanjuan-config-error-assistant-action rounded px-3 py-1.5 text-[11px]`,
                              style: {
                                border: `1px solid ${configErrorAssistantTheme.buttonBorder}`,
                                background: configButlerRepairHistoryOpen ? configErrorAssistantTheme.accentBg : configErrorAssistantTheme.buttonBg,
                                color: configButlerRepairHistoryOpen ? configErrorAssistantTheme.accentText : configErrorAssistantTheme.buttonText,
                                WebkitTextFillColor: configButlerRepairHistoryOpen ? configErrorAssistantTheme.accentText : configErrorAssistantTheme.buttonText,
                              },
                              children: `修复记录`,
                            }),
                            jsx(`div`, {
                              onClick: () => setConfigButlerErrorAssistant(null),
                              role: `button`,
                              tabIndex: 0,
                              className: `wanjuan-config-error-assistant-action rounded px-3 py-1.5 text-[11px]`,
                              style: {
                                border: `1px solid ${configErrorAssistantTheme.buttonBorder}`,
                                background: configErrorAssistantTheme.buttonBg,
                                backgroundImage: `none`,
                                color: configErrorAssistantTheme.buttonText,
                                WebkitTextFillColor: configErrorAssistantTheme.buttonText,
                              },
                              children: `稍后处理`,
                            }),
                            configButlerErrorAssistant.diagnosis?.shouldApplyPatch === true &&
                            configButlerErrorAssistant.diagnosis?.suggestedProtocol?.config &&
                            configButlerErrorAssistant.diagnosis?.suggestedProtocol?.config?.requestType !== `custom` &&
                            configButlerErrorAssistant.status !== `applied` &&
                            [`request_config`, `model_code`].includes(configButlerErrorAssistant.diagnosis.classification) &&
                            jsx(`div`, {
                              onClick: applyConfigButlerErrorAssistantFix,
                              role: `button`,
                              tabIndex: 0,
                              className: `wanjuan-config-error-assistant-action rounded px-3 py-1.5 text-[11px] font-semibold`,
                              style: {
                                background: configErrorAssistantTheme.primaryBg,
                                border: `1px solid ${configErrorAssistantTheme.accentBorder}`,
                                color: configErrorAssistantTheme.primaryText,
                                WebkitTextFillColor: configErrorAssistantTheme.primaryText,
                              },
                              children: `应用修复`,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                });
}
