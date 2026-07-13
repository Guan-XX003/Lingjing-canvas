/** WanJuanSettingsSectionA：自 WanJuanAppRoot render 抽出的 JSX 段，props 传入，行为不变。 */
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { agentChatOuterPadding, agentChatRailStyle, agentMessagesScrollStyle, formatAgentAttachmentSize, formatAgentTime, getAgentAttachmentMeta, releaseAgentAttachment, renderAgentAttachmentGlyph, renderAgentIconSurface } from "../lib/agent";
import { renderCopyGlyph } from "../lib/app-root-helpers";
import { WanJuanAgentConfigPanel } from "../components/agent-config-panel";

export function WanJuanSettingsSectionA(props: any) {
  const {
    agentModelOptions,
    apiConfigs,
    importAgentKnowledgeFile,
    removeAgentKnowledgeFile,
    textApiConfigId,
    textModelApiBindings,
    updateSelectedAgent,
    Trash2,
    activeView,
    addAgentReferenceFile,
    agentAttachmentInputRef,
    agentAttachments,
    agentComposer,
    agentConfigOpen,
    agentConversations,
    agentMessagesScrollRef,
    agentSearch,
    agentTheme,
    clearSelectedAgentConversation,
    createAgent,
    deleteSelectedAgent,
    duplicateSelectedAgent,
    filteredAgentItems,
    handleAgentReferenceSelection,
    isLightAgentTheme,
    renderAgentAttachmentPill,
    selectedAgent,
    selectedAgentId,
    selectedAgentMessages,
    sendAgentMessage,
    setAgentAttachments,
    setAgentComposer,
    setAgentConfigOpen,
    setAgentSearch,
    setSelectedAgentId,
    showToast2,
  } = props;
  return jsxs(`div`, {
              className: `absolute inset-0 grid min-w-0 overflow-hidden wanjuan-agent-page ${activeView === `agents` ? `visible z-10` : `invisible -z-10`}`,
              style: {
                gridTemplateColumns: `280px minmax(0, 1fr)`,
                background: agentTheme.pageBg,
              },
              children: [
                jsxs(`div`, {
                  className: `w-[280px] min-w-[280px] max-w-[280px] flex flex-col flex-shrink-0 overflow-hidden`,
                  style: {
                    background: agentTheme.panelBg,
                    borderRight: `1px solid ${agentTheme.panelBorder}`,
                    filter: agentConfigOpen && activeView === `agents` ?
                      `blur(12px)` :
                      `none`,
                    transform: agentConfigOpen && activeView === `agents` ?
                      `scale(0.994)` :
                      `scale(1)`,
                    transformOrigin: `center center`,
                    transition: `filter 180ms ease, transform 180ms ease`,
                  },
                  children: [
                    jsxs(`div`, {
                      className: `h-16 px-4 flex items-center`,
                      style: {
                        borderBottom: `1px solid ${agentTheme.panelMutedBorder}`,
                      },
                      children: [
                        jsxs(`button`, {
                          onClick: createAgent,
                          className: `w-full rounded-xl text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2`,
                          style: {
                            background: isLightAgentTheme ?
                              `linear-gradient(180deg,${agentTheme.accentText},${agentTheme.accentText})` :
                              `linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))`,
                            border: `1px solid ${agentTheme.accentBorder}`,
                            color: isLightAgentTheme ? `#ffffff` : agentTheme.textPrimary,
                            boxShadow: isLightAgentTheme ?
                              `0 10px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.18)` :
                              `0 10px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.08)`,
                          },
                          children: [
                            jsx(`span`, {
                              className: `text-base leading-none`,
                              children: `+`,
                            }),
                            `新建智能体`,
                          ],
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `px-4 pt-4 pb-2`,
                      style: {
                        borderBottom: `1px solid ${agentTheme.panelMutedBorder}`,
                      },
                      children: [
                        jsxs(`div`, {
                          className: `flex items-center gap-2 rounded-xl px-3 py-2`,
                          style: {
                            border: `1px solid ${agentTheme.inputBorder}`,
                            background: agentTheme.inputBg,
                          },
                          children: [
                            jsx(`span`, {
                              className: `flex-shrink-0`,
                              style: {
                                color: agentTheme.textMuted
                              },
                              children: jsxs(`svg`, {
                                width: `14`,
                                height: `14`,
                                viewBox: `0 0 24 24`,
                                fill: `none`,
                                stroke: `currentColor`,
                                strokeWidth: `2`,
                                strokeLinecap: `round`,
                                strokeLinejoin: `round`,
                                children: [
                                  jsx(`circle`, {
                                    cx: `11`,
                                    cy: `11`,
                                    r: `6`,
                                  }),
                                  jsx(`path`, {
                                    d: `m16 16 4 4`,
                                  }),
                                ],
                              }),
                            }),
                            jsx(`input`, {
                              value: agentSearch,
                              onChange: (event) =>
                                setAgentSearch(event.target.value),
                              placeholder: `搜索智能体、模型或关键词...`,
                              className: `w-full min-w-0 bg-transparent text-sm focus:outline-none border-none p-0`,
                              style: {
                                color: agentTheme.inputText,
                              },
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsx(`div`, {
                      className: `px-5 pt-4 text-[10px] uppercase tracking-[0.18em]`,
                      style: {
                        color: agentTheme.textMuted
                      },
                      children: `最近角色`,
                    }),
                    jsx(`div`, {
                      className: `flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-2 custom-scrollbar`,
                      children: filteredAgentItems.length > 0 ?
                        filteredAgentItems.map((agent) =>
                          jsxs(
                            `button`, {
                              onClick: () => setSelectedAgentId(agent.id),
                              className: `wanjuan-agent-role-card ${selectedAgentId === agent.id ? `wanjuan-agent-role-card-active` : ``} group relative w-full text-left rounded-2xl border p-3 transition-colors`,
                              style: selectedAgentId === agent.id ?
                                {
                                  borderColor: isLightAgentTheme ? agentTheme.textMuted : agentTheme.textSecondary,
                                  background: isLightAgentTheme ? agentTheme.panelBorder : agentTheme.textSecondary,
                                  boxShadow: `0 0 0 1px rgba(255,255,255,0.18) inset,0 8px 20px rgba(0,0,0,0.12)`,
                                } :
                                {
                                  borderColor: agentTheme.panelBorder,
                                  background: agentTheme.cardBg,
                                },
                              children: [
                                jsxs(`div`, {
                                  className: `absolute inset-y-3 left-0 w-[3px] rounded-r-full ${selectedAgentId === agent.id ? `bg-transparent` : `bg-transparent group-hover:bg-[#3b4554]`}`,
                                }),
                                jsxs(`div`, {
                                  className: `flex items-start gap-3`,
                                  children: [
                                    jsx(`div`, {
                                      className: `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`,
                                      style: {
                                        border: `1px solid ${selectedAgentId === agent.id ? `rgba(17,24,39,0.28)` : agentTheme.chipBorder}`,
                                        background: selectedAgentId === agent.id ? `rgba(255,255,255,0.22)` : agentTheme.chipBg,
                                        color: selectedAgentId === agent.id ? `#111827` : isLightAgentTheme ? `#56727e` : `#a7c5d0`,
                                      },
                                      children: renderAgentIconSurface(
                                        agent.icon, {
                                          size: 40,
                                          iconSize: 18,
                                          className: `w-10 h-10 rounded-xl flex items-center justify-center`,
                                        },
                                      ),
                                    }),
                                    jsxs(`div`, {
                                      className: `flex-1 min-w-0`,
                                      children: [
                                        jsxs(`div`, {
                                          className: `flex items-center justify-between gap-2`,
                                          children: [
                                            jsx(`div`, {
                                              className: `truncate text-sm font-semibold`,
                                              style: {
                                                color: selectedAgentId === agent.id ? `#111827` : agentTheme.textPrimary,
                                              },
                                              children: agent.name,
                                            }),
                                            jsx(`span`, {
                                              className: `text-[10px] whitespace-nowrap`,
                                              style: {
                                                color: selectedAgentId === agent.id ? `rgba(17,24,39,0.72)` : agentTheme.textMuted,
                                              },
                                              children: formatAgentTime(
                                                (agentConversations[agent.id] || []).slice(-1)[0]
                                                ?.createdAt || agent.updatedAt,
                                              ),
                                            }),
                                          ],
                                        }),
                                        jsx(`div`, {
                                          className: `mt-1 line-clamp-2 text-[11px] leading-5`,
                                          style: {
                                            color: selectedAgentId === agent.id ? `rgba(17,24,39,0.82)` : agentTheme.textSecondary,
                                          },
                                          children: agent.description || `未填写描述`,
                                        }),
                                        jsxs(`div`, {
                                          className: `mt-2 flex items-center gap-2 text-[10px] text-gray-500`,
                                          children: [
                                            jsx(`span`, {
                                              className: `rounded-full px-2 py-0.5 text-[10px]`,
                                              style: selectedAgentId === agent.id ?
                                                {
                                                  border: `1px solid rgba(17,24,39,0.30)`,
                                                  background: `rgba(255,255,255,0.24)`,
                                                  color: `#111827`,
                                                } :
                                                {
                                                  border: `1px solid ${agentTheme.chipBorder}`,
                                                  background: agentTheme.chipBg,
                                                  color: agentTheme.chipText,
                                                },
                                              children: agent.outputMode === `prompt` ?
                                                `提示词` :
                                                agent.outputMode === `node` ?
                                                `节点` :
                                                `对话`,
                                            }),
                                            jsx(`span`, {
                                              className: `truncate max-w-[110px]`,
                                              style: {
                                                color: selectedAgentId === agent.id ? `rgba(17,24,39,0.82)` : agentTheme.textSecondary,
                                              },
                                              children: agent.model || `未绑定模型`,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                jsxs(`div`, {
                                  className: `absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#181f29] pl-2`,
                                  children: [
                                    jsx(`button`, {
                                      onClick: (event) => {
                                        (event.preventDefault(),
                                          event.stopPropagation(),
                                          duplicateSelectedAgent());
                                      },
                                      className: `p-1.5 text-gray-500 hover:text-gray-100 rounded-md hover:bg-[#202734] transition-colors`,
                                      title: `复制智能体`,
                                      children: renderCopyGlyph(14),
                                    }),
                                    jsx(`button`, {
                                      onClick: (event) => {
                                        (event.preventDefault(),
                                          event.stopPropagation(),
                                          setSelectedAgentId(agent.id),
                                          setTimeout(
                                            () => deleteSelectedAgent(),
                                            0,
                                          ));
                                      },
                                      className: `wanjuan-danger-icon-action p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10 transition-colors`,
                                      title: `删除智能体`,
                                      children: jsx(Trash2, {
                                        size: 14,
                                      }),
                                    }),
                                  ],
                                }),
                              ],
                            },
                            agent.id,
                          ),
                        ) :
                        jsxs(`div`, {
                          className: `rounded-2xl border border-dashed px-4 py-8 text-center`,
                          style: {
                            borderColor: agentTheme.panelBorder,
                            background: agentTheme.cardBg,
                          },
                          children: [
                            jsx(`div`, {
                              className: `text-sm font-semibold`,
                              style: {
                                color: agentTheme.textPrimary
                              },
                              children: `没有匹配到智能体`,
                            }),
                            jsx(`div`, {
                              className: `mt-2 text-[11px] leading-5`,
                              style: {
                                color: agentTheme.textSecondary,
                              },
                              children: `可以换个关键词搜索，或者直接新建一个智能体。`,
                            }),
                          ],
                        }),
                    }),
                  ],
                }),
                jsxs(`div`, {
                  className: `flex-1 min-w-0 flex flex-col overflow-hidden`,
                  style: {
                    background: agentTheme.mainBg,
                    filter: agentConfigOpen && activeView === `agents` ?
                      `blur(12px)` :
                      `none`,
                    transform: agentConfigOpen && activeView === `agents` ?
                      `scale(0.994)` :
                      `scale(1)`,
                    transformOrigin: `center center`,
                    transition: `filter 180ms ease, transform 180ms ease`,
                  },
                  children: [
                    jsxs(`div`, {
                      className: `h-16 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-10`,
                      style: {
                        borderBottom: `1px solid ${agentTheme.headerBorder}`,
                        background: agentTheme.headerBg,
                      },
                      children: [
                        jsxs(`div`, {
                          className: `flex items-center gap-4 min-w-0`,
                          children: [
                            jsx(`div`, {
                              className: `w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center`,
                              style: {
                                // 原写死蓝渐变(rgba(138,180,248)),改用 agentTheme 字段按主题取色(graphite=中性灰,dark=蓝)。
                                border: `1px solid ${agentTheme.accentBorder}`,
                                background: agentTheme.accentBg,
                                color: agentTheme.accentText,
                                boxShadow: `0 6px 18px rgba(0,0,0,0.18)`,
                              },
                              children: renderAgentIconSurface(
                                selectedAgent?.icon, {
                                  size: 36,
                                  iconSize: 18,
                                  className: `w-9 h-9 rounded-xl flex items-center justify-center`,
                                },
                              ),
                            }),
                            jsxs(`div`, {
                              className: `min-w-0`,
                              children: [
                                jsxs(`div`, {
                                  className: `text-base font-semibold text-gray-100 truncate flex items-center gap-2`,
                                  children: [
                                    selectedAgent?.name || `未选择智能体`,
                                    jsx(`span`, {
                                      className: `inline-flex w-2 h-2 rounded-full bg-[#9a9ea4]`,
                                    }),
                                  ],
                                }),
                                jsx(`div`, {
                                  className: `text-[11px] text-gray-500 mt-1 truncate`,
                                  children: selectedAgent?.model ?
                                    `基于 ${selectedAgent.model} · ${selectedAgent.description || `已配置角色设定`}` :
                                    selectedAgent?.description ||
                                    `可将这个角色绑定到任意已配置文本模型`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex items-center gap-2 flex-shrink-0 min-w-0`,
                          children: [
                            jsx(`button`, {
                              onClick: () => setAgentConfigOpen(true),
                              className: `inline-flex items-center gap-2 rounded-full border border-[#54565a] bg-[linear-gradient(180deg,rgba(72,74,78,0.82),rgba(56,58,61,0.92))] px-3 py-1.5 text-[11px] text-[#d7dadd] hover:border-[#6a6c70]/60 hover:text-white transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`,
                              title: `编辑智能体配置`,
                              children: `编辑`,
                            }),
                            jsx(`button`, {
                              onClick: clearSelectedAgentConversation,
                              className: `wanjuan-danger-text-action inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-[11px] text-red-200 hover:border-red-300/60 hover:text-red-100 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`,
                              title: `清空当前智能体聊天记录`,
                              children: `清空`,
                            }),
                            jsx(`button`, {
                              onClick: duplicateSelectedAgent,
                              className: `p-2 text-gray-500 hover:text-[#eef0f2] transition-colors rounded-xl hover:bg-[#2e3033] border border-transparent hover:border-[#6a6c70]/40`,
                              title: `复制智能体`,
                              children: renderCopyGlyph(16),
                            }),
                            jsx(`button`, {
                              onClick: deleteSelectedAgent,
                              className: `wanjuan-danger-icon-action p-2 text-red-400 hover:text-red-300 transition-colors rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-400/30`,
                              title: `删除智能体`,
                              children: jsx(Trash2, {
                                size: 16
                              }),
                            }),
                            jsx(`span`, {
                              className: `max-w-[180px] truncate rounded-full px-3 py-1 text-[11px]`,
                              style: {
                                border: `1px solid ${agentTheme.accentBorder}`,
                                background: agentTheme.accentBg,
                                color: agentTheme.accentText,
                              },
                              children: selectedAgent?.model || `未指定`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsx(`div`, {
                      ref: agentMessagesScrollRef,
                      className: `flex-1 overflow-y-auto custom-scrollbar`,
                      style: agentMessagesScrollStyle,
                      children: selectedAgentMessages.length > 0 ?
                        [
                          jsx(
                            `div`, {
                              className: `flex justify-center`,
                              style: agentChatRailStyle,
                              children: jsxs(`span`, {
                                className: `inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] tracking-[0.12em] uppercase`,
                                style: {
                                  border: `1px solid ${agentTheme.accentBorder}`,
                                  background: agentTheme.accentBg,
                                  color: agentTheme.textSecondary,
                                },
                                children: [
                                  jsx(`span`, {
                                    className: `w-1.5 h-1.5 rounded-full bg-[#9a9ea4]/80`,
                                  }),
                                  `当前会话`,
                                ],
                              }),
                            },
                            `agent-session-divider`,
                          ),
                          ...selectedAgentMessages.map((message) =>
                            jsx(
                              `div`, {
                                className: `flex gap-4 ${message.role === `user` ? `justify-end` : `justify-start`}`,
                                style: {
                                  ...agentChatRailStyle,
                                  alignItems: `flex-start`,
                                },
                                children: message.role === `user` ?
                                  jsxs(`div`, {
                                    className: `flex flex-col gap-1.5 items-end w-full`,
                                    children: [
                                      jsxs(`div`, {
                                        className: `flex items-center gap-2 text-[11px]`,
                                        style: {
                                          color: agentTheme.textSecondary,
                                        },
                                        children: [
                                          jsx(`span`, {
                                            children: `当前用户`,
                                          }),
                                          jsx(`span`, {
                                            className: `text-gray-600`,
                                            children: formatAgentTime(
                                              message.createdAt,
                                            ),
                                          }),
                                          jsx(`button`, {
                                            onClick: async () => {
                                              try {
                                                await navigator.clipboard.writeText(
                                                    message.content ||
                                                    ``,
                                                  ),
                                                  showToast2(`已复制消息`);
                                              } catch {
                                                showToast2(`复制失败`);
                                              }
                                            },
                                            className: `inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-0.5 transition-colors hover:border-[#6a6c70]/40 hover:bg-[#2e3033] hover:text-[#eef0f2]`,
                                            children: `复制`,
                                          }),
                                        ],
                                      }),
                                      jsx(`div`, {
                                        className: `text-sm p-4 rounded-2xl rounded-tr-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.12)] max-w-[85%] leading-relaxed whitespace-pre-wrap break-words`,
                                        style: {
                                          border: `1px solid ${agentTheme.accentBorder}`,
                                          background: isLightAgentTheme ?
                                            `linear-gradient(180deg,${agentTheme.accentBg},rgba(255,255,255,0.96))` :
                                            `linear-gradient(180deg,${agentTheme.accentBg},${agentTheme.cardBg})`,
                                          color: agentTheme.textPrimary,
                                        },
                                        children: message.content,
                                      }),
                                      Array.isArray(message.attachments) &&
                                      message.attachments.length > 0 &&
	                                      jsx(`div`, {
	                                        className: `max-w-[85%] flex flex-wrap justify-end gap-2`,
	                                        children: message.attachments.map((attachment) => {
	                                          let attachmentMeta = getAgentAttachmentMeta(attachment),
	                                            sizeLabel = formatAgentAttachmentSize(attachment.size);
	                                          return jsxs(
	                                            `span`, {
	                                              className: `inline-flex max-w-[220px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`,
	                                              style: {
	                                                border: `1px solid ${agentTheme.accentBorder}`,
	                                                background: agentTheme.accentBg,
	                                                color: agentTheme.accentText,
	                                              },
	                                              children: [
	                                                jsx(`span`, {
	                                                  className: `inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg`,
	                                                  style: {
	                                                    background: attachmentMeta.bg,
	                                                    color: attachmentMeta.tint,
	                                                  },
	                                                  children: renderAgentAttachmentGlyph(attachment, {
	                                                    size: 14,
	                                                  }),
	                                                }),
	                                                jsxs(`span`, {
	                                                  className: `min-w-0`,
	                                                  children: [
	                                                    jsx(`span`, {
	                                                      className: `block truncate font-semibold`,
	                                                      title: attachment.name || `参考文件`,
	                                                      children: attachment.name || `参考文件`,
	                                                    }),
	                                                    jsxs(`span`, {
	                                                      className: `block truncate opacity-70`,
	                                                      children: [
	                                                        attachmentMeta.label,
	                                                        sizeLabel ? ` · ${sizeLabel}` : ``,
	                                                      ],
	                                                    }),
	                                                  ],
	                                                }),
	                                              ],
	                                            },
	                                            attachment.id,
	                                          );
	                                        }),
	                                      }),
                                    ],
                                  }) :
                                  jsxs(Fragment, {
                                    children: [
                                      jsx(`div`, {
                                        className: `w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 mt-1 flex items-center justify-center`,
                                        style: {
                                          border: `1px solid ${agentTheme.accentBorder}`,
                                          background: agentTheme.accentBg,
                                          color: agentTheme.accentText,
                                        },
                                        children: renderAgentIconSurface(
                                          selectedAgent?.icon, {
                                            size: 32,
                                            iconSize: 16,
                                            className: `w-8 h-8 rounded-lg flex items-center justify-center`,
                                          },
                                        ),
                                      }),
                                      jsxs(`div`, {
                                        className: `flex flex-col gap-1.5 items-start w-full`,
                                        children: [
                                          jsxs(`div`, {
                                            className: `flex items-center gap-2 text-[10px] text-gray-500`,
                                            children: [
                                              jsx(`span`, {
                                                children: selectedAgent?.name ||
                                                  `智能体`,
                                              }),
                                              jsx(`span`, {
                                                className: `text-gray-600`,
                                                children: formatAgentTime(
                                                  message.createdAt,
                                                ),
                                              }),
                                            ],
                                          }),
                                          jsxs(`div`, {
                                            className: `w-full overflow-hidden rounded-2xl rounded-tl-sm shadow-[0_12px_30px_rgba(0,0,0,0.18)]`,
                                            style: {
                                              border: `1px solid ${agentTheme.bubbleBorder}`,
                                              background: agentTheme.bubbleBg,
                                            },
                                            children: [
                                              jsxs(`div`, {
                                                className: `border-b px-4 py-2.5`,
                                                style: {
                                                  // 原为写死的偏蓝渐变(rgba(138,180,248)/rgba(24,34,53))，对所有主题通用，
                                                  // 导致石墨灰下卡片头部仍偏蓝。改用 agentTheme 字段，按主题取中性/深蓝。
                                                  borderBottom: `1px solid ${agentTheme.headerBorder}`,
                                                  background: agentTheme.composerToolbarBg,
                                                },
                                                children: [
                                                  jsxs(`div`, {
                                                    className: `min-w-0 flex items-start justify-between gap-3`,
                                                    children: [
                                                      jsxs(`div`, {
                                                        className: `min-w-0 flex-1`,
                                                        children: [
                                                          jsx(`div`, {
                                                            className: `text-[15px] font-semibold truncate leading-6`,
                                                            style: {
                                                              color: agentTheme.textPrimary,
                                                            },
                                                            children: selectedAgent?.name ||
                                                              `智能体`,
                                                          }),
                                                          jsx(`div`, {
                                                            className: `text-[10px] truncate leading-5`,
                                                            style: {
                                                              color: agentTheme.textSecondary,
                                                            },
                                                            children: selectedAgent?.model ||
                                                              `未绑定模型`,
                                                          }),
                                                        ],
                                                      }),
                                                      jsx(`span`, {
                                                        className: `inline-flex flex-shrink-0 items-center rounded-full border border-[rgba(150,154,160,0.28)] bg-[rgba(150,154,160,0.14)] px-2 py-0.5 text-[10px] text-[#d7dadd] self-center`,
                                                        children: `结果`,
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              jsx(`div`, {
                                                className: `px-4 py-4 text-sm leading-7 whitespace-pre-wrap break-words`,
                                                style: {
                                                  // 原 dark 分支写死深蓝 rgba(16,24,39)/rgba(14,20,33)，石墨灰也走它→偏蓝。
                                                  // 改用 agentTheme.cardBg（按主题取色：石墨灰=中性灰，曜石黑=深蓝灰）。
                                                  background: isLightAgentTheme ?
                                                    `linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,250,251,0.96))` :
                                                    agentTheme.cardBg,
                                                  color: agentTheme.textPrimary,
                                                },
                                                children: message.content,
                                              }),
                                              jsxs(`div`, {
                                                className: `flex items-center gap-3 border-t px-4 py-2 text-[10px] text-gray-500`,
                                                style: {
                                                  // 原写死深蓝 rgba(20,29,45)/rgba(17,24,38)，石墨灰下偏蓝。改用 agentTheme 字段按主题取色。
                                                  borderTop: `1px solid ${agentTheme.headerBorder}`,
                                                  background: agentTheme.composerToolbarBg,
                                                },
                                                children: [
                                                  jsx(`button`, {
                                                    onClick: async () => {
                                                      try {
                                                        await navigator.clipboard.writeText(
                                                            message.content ||
                                                            ``,
                                                          ),
                                                          showToast2(`已复制回复`);
                                                      } catch {
                                                        showToast2(`复制失败`);
                                                      }
                                                    },
                                                    className: `inline-flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1 transition-colors hover:border-[#6a6c70]/40 hover:bg-[#2e3033] hover:text-[#eef0f2]`,
                                                    children: `复制`,
                                                  }),
                                                  jsx(`button`, {
                                                    onClick: () => {
                                                      setAgentComposer(
                                                          selectedAgentMessages
                                                          .filter(
                                                            (message2) =>
                                                            message2.role ===
                                                            `user`,
                                                          )
                                                          .slice(-1)[0]
                                                          ?.content ||
                                                          ``,
                                                        ),
                                                        showToast2(
                                                          `已载入上一条需求，可重新生成`,
                                                        );
                                                    },
                                                    className: `inline-flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1 transition-colors hover:border-[#6a6c70]/40 hover:bg-[#2e3033] hover:text-[#eef0f2]`,
                                                    children: `重新生成`,
                                                  }),
                                                  jsx(`span`, {
                                                    className: `ml-auto text-[10px] text-gray-600`,
                                                    children: formatAgentTime(
                                                      message.createdAt,
                                                    ),
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                              },
                              message.id,
                            ),
                          ),
                        ] :
                        jsx(`div`, {
                          className: `h-full flex items-center justify-center`,
                          children: jsxs(`div`, {
                            className: `max-w-md text-center`,
                            children: [
                              jsx(`div`, {
                                className: `w-16 h-16 rounded-2xl bg-[linear-gradient(180deg,rgba(120,124,130,0.16),rgba(40,42,45,0.96))] border border-[rgba(150,154,160,0.24)] flex items-center justify-center mx-auto mb-4 text-[#d7dadd] shadow-[0_10px_24px_rgba(0,0,0,0.18)]`,
                                children: renderAgentIconSurface(
                                  selectedAgent?.icon, {
                                    size: 64,
                                    iconSize: 28,
                                    className: `w-16 h-16 rounded-2xl flex items-center justify-center`,
                                  },
                                ),
                              }),
                              jsx(`div`, {
                                className: `text-base font-semibold`,
                                style: {
                                  color: agentTheme.textPrimary
                                },
                                children: `开始和当前智能体对话`,
                              }),
                              jsx(`div`, {
                                className: `mt-2 text-sm leading-6`,
                                style: {
                                  color: agentTheme.textSecondary
                                },
                                children: `你可以输入任务需求、创作目标、风格限制，或者让它帮你整理提示词和结构化输出。`,
                              }),
                            ],
                          }),
                        }),
                    }),
	                    jsxs(`div`, {
	                      className: `px-6 pb-6 pt-2 relative z-20`,
	                      style: {
	                        position: `absolute`,
	                        left: 0,
	                        right: 0,
		                        bottom: `22px`,
	                        zIndex: 30,
	                        paddingLeft: agentChatOuterPadding,
	                        paddingRight: agentChatOuterPadding,
	                        paddingTop: 0,
	                        paddingBottom: 0,
	                        background: `transparent`,
	                        pointerEvents: `none`,
	                      },
	                      children: [
		                        jsxs(`div`, {
		                          className: `-mt-2`,
		                          style: {
		                            ...agentChatRailStyle,
		                            position: `relative`,
		                            pointerEvents: `auto`,
		                          },
	                          children: [
	                            agentAttachments.length > 0 &&
	                            jsx(`div`, {
	                              className: `custom-scrollbar`,
	                              style: {
	                                position: `absolute`,
	                                left: `28px`,
	                                right: `28px`,
	                                top: `-22px`,
	                                zIndex: 12,
	                                display: `flex`,
	                                alignItems: `center`,
	                                gap: `8px`,
	                                minHeight: `48px`,
	                                maxHeight: `52px`,
	                                overflowX: `auto`,
	                                overflowY: `visible`,
	                                padding: `6px 8px 8px 8px`,
	                                pointerEvents: `auto`,
	                              },
	                              children: agentAttachments.map(renderAgentAttachmentPill),
	                            }),
	                            jsxs(`div`, {
			                              className: `flex flex-col transition-all backdrop-blur-2xl overflow-hidden`,
			                              style: {
			                                position: `relative`,
			                                overflow: `hidden`,
			                                borderRadius: `36px`,
			                                background: agentTheme.composerBg,
			                                border: `1px solid ${agentTheme.composerBorder}`,
			                                // 显式限定过渡属性，覆盖 className 的 transition-all。原 transition:all 会把 visibility
			                                // 也纳入过渡：从其他界面切到智能体页(invisible→visible)时 composer 的 visibility 被延迟
			                                // 约 0.15s 才可见，导致输入框先空缺再出现。只过渡视觉属性后，切换即时显示。
			                                transition: `background 150ms ease, border-color 150ms ease, box-shadow 150ms ease`,
			                                boxShadow: isLightAgentTheme ?
			                                  `0 22px 56px rgba(88,72,46,0.18),0 6px 18px rgba(88,72,46,0.08),inset 0 1px 0 rgba(255,255,255,0.72)` :
			                                  `0 26px 70px rgba(0,0,0,0.48),0 8px 20px rgba(0,0,0,0.24),inset 0 1px 0 rgba(255,255,255,0.06)`,
		                              },
                              children: [
                                jsx(`input`, {
                                  ref: agentAttachmentInputRef,
                                  type: `file`,
	                                  accept: `image/*,video/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.json,.rtf,application/pdf,text/plain,text/markdown,application/json`,
                                  multiple: true,
	                                  className: `hidden`,
	                                  onChange: handleAgentReferenceSelection,
	                                }),
		                                false,
		                                jsx(`textarea`, {
		                                  value: agentComposer,
	                                  onChange: (event) =>
	                                    setAgentComposer(event.target.value),
	                                  onKeyDown: (event) => {
	                                    if (event.key === `Enter` && !event.shiftKey && !event.nativeEvent?.isComposing) {
	                                      event.preventDefault();
	                                      sendAgentMessage();
	                                    }
	                                  },
	                                  placeholder: `输入任务需求、项目目标、风格要求，或让智能体为你整理提示词...`,
			                                  className: `w-full bg-transparent border-none text-[15px] resize-none focus:ring-0 leading-8`,
			                                  style: {
			                                    borderRadius: `28px 28px 0 0`,
			                                    padding: `18px 34px 10px 34px`,
			                                    minHeight: `92px`,
			                                    height: `92px`,
			                                    color: agentTheme.textPrimary,
			                                  },
	                                }),
	                                jsxs(`div`, {
	                                  className: `flex min-w-0 items-center justify-between gap-3 px-6 py-4`,
	                                  style: {
		                                    minHeight: `50px`,
		                                    padding: `7px 22px`,
	                                    borderRadius: `0 0 36px 36px`,
	                                    background: agentTheme.composerToolbarBg,
	                                  },
                                  children: [
	                                    jsxs(`div`, {
	                                      className: `flex min-w-0 flex-1 items-center gap-2 flex-wrap`,
	                                      style: {
	                                        flexWrap: `nowrap`,
	                                        overflow: `hidden`,
	                                      },
	                                      children: [
	                                        jsx(`button`, {
	                                          type: `button`,
	                                          onClick: addAgentReferenceFile,
	                                          className: `inline-flex items-center rounded-full border border-[#54565a] bg-[linear-gradient(180deg,rgba(72,74,78,0.82),rgba(56,58,61,0.92))] px-3 py-1.5 text-[11px] text-[#d7dadd] hover:border-[#6a6c70]/60 hover:text-white transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`,
	                                          children: `＋ 参考`,
	                                        }),
	                                        false,
	                                        jsx(`span`, {
	                                          className: `inline-flex items-center rounded-full border border-[#46484c] bg-[#2e3033] px-3 py-1.5 text-[11px] text-[#d7dadd]`,
	                                          children: `对话模式`,
	                                        }),
                                        jsx(`span`, {
                                          className: `inline-flex max-w-[180px] truncate items-center rounded-full border border-[#42444a] bg-[#26282c] px-3 py-1.5 text-[11px] text-[#a6abb2]`,
                                          children: selectedAgent?.model ||
                                            `未指定模型`,
                                        }),
                                        jsx(`span`, {
                                          className: `truncate text-[11px] text-[#75819a]`,
                                          children: `Enter 发送，Shift+Enter 换行`,
                                        }),
                                      ],
                                    }),
                                    jsxs(`div`, {
                                      className: `flex items-center gap-2.5 flex-shrink-0 pl-2`,
                                      children: [
                                        jsx(`button`, {
                                          onClick: () => {
                                            setAgentComposer(``),
                                              setAgentAttachments((attachments) => (
                                                attachments.forEach(releaseAgentAttachment),
                                                []
                                              ));
                                          },
                                          className: `wanjuan-danger-text-action px-4 py-2 rounded-2xl border border-red-400/35 bg-red-500/10 text-xs text-red-200 hover:border-red-300/55 hover:text-red-100 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`,
                                          children: `清空`,
                                        }),
                                        jsxs(`button`, {
                                          onClick: sendAgentMessage,
                                          className: `flex-shrink-0 inline-flex items-center gap-2 rounded-2xl border border-[#83b2ff]/38 bg-[linear-gradient(180deg,rgba(116,167,255,0.98),rgba(59,130,246,0.92))] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 shadow-[0_12px_28px_rgba(59,130,246,0.24),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-[1.04]`,
                                          children: [
                                            jsx(`span`, {
                                              className: `text-xs`,
                                              children: `↑`,
                                            }),
                                            `发送`,
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            jsx(`div`, {
                              className: `mt-4 flex items-center justify-center`,
                              children: jsxs(`div`, {
                                className: `inline-flex items-center gap-2 rounded-full border border-[#3a3c40] bg-[linear-gradient(180deg,rgba(48,50,54,0.8),rgba(38,40,43,0.96))] px-3 py-1.5 text-[10px] text-[#9499a0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`,
                                children: [
                                  jsx(`span`, {
                                    className: `w-1.5 h-1.5 rounded-full bg-[#7fb0ff]`,
                                  }),
                                  `当前对话会调用已绑定文本模型，知识库与本次参考文件会一起发送`,
                                ],
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                agentConfigOpen &&
                jsx(WanJuanAgentConfigPanel, {
  agentModelOptions,
  agentTheme,
  apiConfigs,
  importAgentKnowledgeFile,
  isLightAgentTheme,
  removeAgentKnowledgeFile,
  selectedAgent,
  setAgentConfigOpen,
  textApiConfigId,
  textModelApiBindings,
  updateSelectedAgent,
}),
              ],
            });
}
