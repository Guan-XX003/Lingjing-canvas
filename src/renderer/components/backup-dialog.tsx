/** 备份/导出对话框（backupDialogState）。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { BACKUP_SETTINGS_SECTION_KEYS } from "../lib/app-root-helpers";
declare const chrome: any;

export function WanJuanBackupDialog({
  BACKUP_MODULE_LABELS,
  BACKUP_SETTINGS_SECTION_LABELS,
  agentTheme,
  backupDialogState,
  backupDialogTab,
  backupDialogTheme,
  confirmBackupDialog,
  setBackupDialogState,
  setBackupDialogTab,
}: any) {
  return jsx(`div`, {
          className: `absolute inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm p-6`,
          children: jsxs(`div`, {
            className: `w-full overflow-hidden rounded-xl border border-[#4b5563] bg-[#242830] shadow-[0_24px_70px_rgba(0,0,0,0.48)] flex flex-col`,
            style: {
              width: `min(86vw, 900px)`,
              height: `min(78vh, 640px)`,
              background: backupDialogTheme.panelBg,
              borderColor: backupDialogTheme.border,
              boxShadow: backupDialogTheme.shadow,
              color: backupDialogTheme.textPrimary,
            },
            children: [
              jsxs(`div`, {
                className: `flex items-start justify-between gap-4 border-b border-[#3b424d] px-5 py-4 bg-[#252a32]`,
                style: {
                  background: backupDialogTheme.headerBg,
                  borderBottomColor: backupDialogTheme.mutedBorder
                },
                children: [
                  jsxs(`div`, {
                    children: [
                      jsx(`h3`, {
                        className: `text-base font-semibold tracking-tight text-gray-100`,
                        style: {
                          color: backupDialogTheme.textPrimary
                        },
                        children: backupDialogState.title,
                      }),
                      jsxs(`p`, {
                        className: `mt-2 text-xs leading-5 text-gray-400`,
                        style: {
                          color: backupDialogTheme.textSecondary
                        },
                        children: [
                          backupDialogState.mode === `export` ?
                          `选择本次需要处理的细分内容，列表区域支持独立滚动。` :
                          `已自动识别备份文件中的模块；设置参数会覆盖当前配置，画布项目会新增或合并导入。`,
                          backupDialogState.sourceName ?
                          ` 当前文件：${backupDialogState.sourceName}` :
                          ``,
                        ],
                      }),
                    ],
                  }),
                  jsx(`button`, {
                    type: `button`,
                    onClick: () => setBackupDialogState(null),
                    className: `rounded-lg border border-[#59616d] bg-[#2b3039] px-3 py-1.5 text-xs text-gray-300 hover:bg-[#333945] hover:text-white transition-colors`,
                    style: {
                      minWidth: `58px`,
                      padding: `8px 14px`,
                      background: backupDialogTheme.buttonBg,
                      borderColor: backupDialogTheme.buttonBorder,
                      color: backupDialogTheme.buttonText,
                    },
                    children: `关闭`,
                  }),
                ],
              }),
              jsxs(`div`, {
                className: `flex-1 min-h-0 px-5 py-4 flex flex-col gap-4 overflow-hidden bg-[#22262d]`,
                style: {
                  background: backupDialogTheme.bodyBg
                },
                children: [
                  jsxs(`div`, {
                    className: `flex flex-wrap gap-1.5 flex-shrink-0 rounded-lg border border-[#3f4651] bg-[#1f232a] p-1 w-fit`,
                    style: {
                      background: backupDialogTheme.insetBg,
                      borderColor: backupDialogTheme.mutedBorder
                    },
                    children: [
                      backupDialogState.modules.includes(`projects`) &&
                      jsx(`button`, {
                        type: `button`,
                        onClick: () => setBackupDialogTab(`projects`),
                        className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${backupDialogTab === `projects` ? `border border-blue-400/40 bg-[#2d3748] text-blue-100` : `border border-transparent bg-transparent text-gray-400 hover:text-white hover:bg-[#2a2f38]`}`,
                        style: backupDialogTab === `projects` ?
                          {
                            borderColor: backupDialogTheme.primaryBorder,
                            background: backupDialogTheme.accentBg || agentTheme.accentBg,
                            color: backupDialogTheme.primaryBg,
                          } :
                          {
                            color: backupDialogTheme.textSecondary,
                          },
                        children: `画布项目`,
                      }),
                      backupDialogState.modules.includes(`settings`) &&
                      jsx(`button`, {
                        type: `button`,
                        onClick: () => setBackupDialogTab(`settings`),
                        className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${backupDialogTab === `settings` ? `border border-blue-400/40 bg-[#2d3748] text-blue-100` : `border border-transparent bg-transparent text-gray-400 hover:text-white hover:bg-[#2a2f38]`}`,
                        style: backupDialogTab === `settings` ?
                          {
                            borderColor: backupDialogTheme.primaryBorder,
                            background: backupDialogTheme.accentBg || agentTheme.accentBg,
                            color: backupDialogTheme.primaryBg,
                          } :
                          {
                            color: backupDialogTheme.textSecondary,
                          },
                        children: `设置参数`,
                      }),
                      backupDialogState.modules.includes(`agents`) &&
                      jsx(`button`, {
                        type: `button`,
                        onClick: () => setBackupDialogTab(`agents`),
                        className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${backupDialogTab === `agents` ? `border border-blue-400/40 bg-[#2d3748] text-blue-100` : `border border-transparent bg-transparent text-gray-400 hover:text-white hover:bg-[#2a2f38]`}`,
                        style: backupDialogTab === `agents` ?
                          {
                            borderColor: backupDialogTheme.primaryBorder,
                            background: backupDialogTheme.accentBg || agentTheme.accentBg,
                            color: backupDialogTheme.primaryBg,
                          } :
                          {
                            color: backupDialogTheme.textSecondary,
                          },
                        children: `智能体配置`,
                      }),
                      backupDialogState.modules.includes(`resources`) &&
                      !backupDialogState.modules.includes(`projects`) &&
                      !backupDialogState.modules.includes(`settings`) &&
                      jsx(
                        `span`, {
                          className: `rounded-md border border-[#3f4651] bg-[#2a2f38] px-3 py-1.5 text-xs text-gray-300`,
                          children: BACKUP_MODULE_LABELS[`resources`],
                        },
                      ),
                    ],
                  }),
                  backupDialogTab === `settings` &&
                  backupDialogState.modules.includes(`settings`) &&
                  !!backupDialogState.availableSettingsSections?.length &&
                  jsxs(`div`, {
                    className: `space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden`,
                    children: [
                      jsx(`div`, {
                        className: `text-sm font-semibold text-gray-200 flex items-center justify-between`,
                        style: {
                          color: backupDialogTheme.textPrimary
                        },
                        children: [
                          jsx(`span`, {
                            children: `设置参数`,
                          }),
                          jsxs(`span`, {
                            className: `text-[11px] text-gray-500`,
                            style: {
                              color: backupDialogTheme.textMuted
                            },
                            children: [backupDialogState.settingsSections.length, ` / `, backupDialogState.availableSettingsSections.length, ` 已选`],
                          }),
                        ],
                      }),
                      jsx(`div`, {
                        className: `flex-1 min-h-0 rounded-lg border border-[#4b5563] bg-[#252a32] overflow-hidden`,
                        style: {
                          background: backupDialogTheme.sectionBg,
                          borderColor: backupDialogTheme.border
                        },
                        children: jsx(`div`, {
                          className: `h-full overflow-y-auto custom-scrollbar`,
                          style: {
                            scrollbarGutter: `stable`,
                            overscrollBehavior: `contain`
                          },
                          children: backupDialogState.availableSettingsSections.map((section) =>
                            jsxs(
                              `label`, {
                                className: `group flex items-center gap-3 border-b border-[#3a414c] px-4 py-3 cursor-pointer hover:bg-[#2d333d] transition-colors`,
                                children: [
                                  jsx(`input`, {
                                    type: `checkbox`,
                                    checked: backupDialogState.settingsSections.includes(
                                      section,
                                    ),
                                    onChange: () =>
                                      setBackupDialogState((prev) =>
                                        prev ?
                                        {
                                          ...prev,
                                          settingsSections: prev.settingsSections.includes(
                                              section,
                                            ) ?
                                            prev.settingsSections.filter(
                                              (section2) => section2 !== section,
                                            ) :
                                            [
                                              ...prev.settingsSections,
                                              section,
                                            ],
                                        } :
                                        prev,
                                      ),
                                    className: `h-4 w-4 rounded border-[#4a4f58] bg-[#111317] text-blue-500 focus:ring-blue-500`,
                                  }),
                                  jsx(`div`, {
                                    className: `w-1 self-stretch rounded-full ${backupDialogState.settingsSections.includes(section) ? `bg-blue-400/80` : `bg-transparent`}`,
                                  }),
                                  jsxs(`div`, {
                                    className: `flex-1 min-w-0 flex items-center justify-between gap-4`,
                                    children: [
                                      jsx(`div`, {
                                        className: `truncate text-sm font-medium text-gray-100`,
                                        style: {
                                          color: backupDialogTheme.textPrimary
                                        },
                                        children: BACKUP_SETTINGS_SECTION_LABELS[section] || section,
                                      }),
                                      jsx(`div`, {
                                        className: `text-[11px] text-gray-500 whitespace-nowrap`,
                                        style: {
                                          color: backupDialogTheme.textMuted
                                        },
                                        children: `${(BACKUP_SETTINGS_SECTION_KEYS[section] || []).length || 0} 个配置键`,
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              section,
                            ),
                          ),
                        }),
                      }),
                    ],
                  }),
                  backupDialogTab === `projects` &&
                  backupDialogState.modules.includes(`projects`) &&
                  !!backupDialogState.availableProjects?.length &&
                  jsxs(`div`, {
                    className: `space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden`,
                    children: [
                      jsxs(`div`, {
                        className: `flex items-center justify-between gap-3`,
                        children: [
                          jsx(`div`, {
                            className: `text-sm font-bold text-gray-200`,
                            style: {
                              color: backupDialogTheme.textPrimary
                            },
                            children: `画布项目`,
                          }),
                          jsxs(`div`, {
                            className: `text-[11px] text-gray-500`,
                            style: {
                              color: backupDialogTheme.textMuted
                            },
                            children: [backupDialogState.projectIds.length, ` / `, backupDialogState.availableProjects.length, ` 已选`],
                          }),
                        ],
                      }),
                      jsx(`div`, {
                        className: `flex-1 min-h-0 rounded-lg border border-[#4b5563] bg-[#252a32] overflow-hidden`,
                        style: {
                          background: backupDialogTheme.sectionBg,
                          borderColor: backupDialogTheme.border
                        },
                        children: jsx(`div`, {
                          className: `h-full overflow-y-auto custom-scrollbar`,
                          style: {
                            scrollbarGutter: `stable`,
                            overscrollBehavior: `contain`
                          },
                          children: backupDialogState.availableProjects.map((project, index) =>
                            jsxs(
                              `label`, {
                                className: `group flex gap-3 items-center px-4 py-3 cursor-pointer hover:bg-[#2d333d] transition-colors ${index !== backupDialogState.availableProjects.length - 1 ? `border-b border-[#3a414c]` : ``}`,
                                children: [
                                  jsx(`input`, {
                                    type: `checkbox`,
                                    checked: backupDialogState.projectIds.includes(
                                      project.id,
                                    ),
                                    onChange: () =>
                                      setBackupDialogState((prev) =>
                                        prev ?
                                        {
                                          ...prev,
                                          projectIds: prev.projectIds.includes(
                                              project.id,
                                            ) ?
                                            prev.projectIds.filter(
                                              (projectId) => projectId !== project.id,
                                            ) :
                                            [...prev.projectIds, project.id],
                                        } :
                                        prev,
                                      ),
                                    className: `mt-1 h-4 w-4 rounded border-[#4a4f58] bg-[#111317] text-orange-500 focus:ring-orange-500`,
                                  }),
                                  jsx(`div`, {
                                    className: `w-1 self-stretch rounded-full ${backupDialogState.projectIds.includes(project.id) ? `bg-orange-400/80` : `bg-transparent`}`,
                                  }),
                                  jsxs(`div`, {
                                    className: `flex-1 flex gap-3 min-w-0 items-center`,
                                    children: [
                                      jsx(`div`, {
                                        className: `w-11 h-11 rounded-lg border border-[#3a414c] bg-[#1c2027] overflow-hidden flex-shrink-0 flex items-center justify-center text-base text-gray-600 shadow-inner`,
                                        style: {
                                          background: backupDialogTheme.insetBg,
                                          borderColor: backupDialogTheme.mutedBorder,
                                          color: backupDialogTheme.textMuted,
                                        },
                                        children: project.cover ?
                                          jsx(`img`, {
                                            src: project.cover,
                                            className: `w-full h-full object-cover`,
                                          }) :
                                          `🧩`,
                                      }),
                                      jsxs(`div`, {
                                        className: `min-w-0 space-y-1`,
                                        children: [
                                          jsx(`div`, {
                                            className: `truncate text-sm font-semibold text-gray-100`,
                                            style: {
                                              color: backupDialogTheme.textPrimary
                                            },
                                            children: project.name,
                                          }),
                                          jsx(`div`, {
                                            className: `text-[11px] text-gray-500 truncate`,
                                            style: {
                                              color: backupDialogTheme.textMuted
                                            },
                                            children: project.updatedAt ?
                                              `最近更新 ${new Date(project.updatedAt).toLocaleString()}` :
                                              `未记录更新时间`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              project.id,
                            ),
                          ),
                        }),
                      }),
                    ],
                  }),
                  backupDialogTab === `agents` &&
                  backupDialogState.modules.includes(`agents`) &&
                  !!backupDialogState.availableAgents?.length &&
                  jsxs(`div`, {
                    className: `space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden`,
                    children: [
                      jsxs(`div`, {
                        className: `flex items-center justify-between gap-3`,
                        children: [
                          jsx(`div`, {
                            className: `text-sm font-bold text-gray-200`,
                            style: {
                              color: backupDialogTheme.textPrimary
                            },
                            children: `智能体配置`,
                          }),
                          jsxs(`div`, {
                            className: `text-[11px] text-gray-500`,
                            style: {
                              color: backupDialogTheme.textMuted
                            },
                            children: [backupDialogState.agentIds?.length || 0, ` / `, backupDialogState.availableAgents.length, ` 已选`],
                          }),
                        ],
                      }),
                      jsx(`div`, {
                        className: `flex-1 min-h-0 rounded-lg border border-[#4b5563] bg-[#252a32] overflow-hidden`,
                        style: {
                          background: backupDialogTheme.sectionBg,
                          borderColor: backupDialogTheme.border
                        },
                        children: jsx(`div`, {
                          className: `h-full overflow-y-auto custom-scrollbar`,
                          style: {
                            scrollbarGutter: `stable`,
                            overscrollBehavior: `contain`
                          },
                          children: backupDialogState.availableAgents.map((agent, index) =>
                            jsxs(
                              `label`, {
                                className: `group flex gap-3 items-center px-4 py-3 cursor-pointer hover:bg-[#2d333d] transition-colors ${index !== backupDialogState.availableAgents.length - 1 ? `border-b border-[#3a414c]` : ``}`,
                                children: [
                                  jsx(`input`, {
                                    type: `checkbox`,
                                    checked: backupDialogState.agentIds?.includes(agent.id),
                                    onChange: () =>
                                      setBackupDialogState((prev) =>
                                        prev ?
                                        {
                                          ...prev,
                                          agentIds: (prev.agentIds || []).includes(agent.id) ?
                                            (prev.agentIds || []).filter((agentId) => agentId !== agent.id) :
                                            [...(prev.agentIds || []), agent.id],
                                        } :
                                        prev,
                                      ),
                                    className: `mt-1 h-4 w-4 rounded border-[#4a4f58] bg-[#111317] text-blue-500 focus:ring-blue-500`,
                                  }),
                                  jsx(`div`, {
                                    className: `w-1 self-stretch rounded-full ${backupDialogState.agentIds?.includes(agent.id) ? `bg-blue-400/80` : `bg-transparent`}`,
                                  }),
                                  jsxs(`div`, {
                                    className: `min-w-0 space-y-1`,
                                    children: [
                                      jsx(`div`, {
                                        className: `truncate text-sm font-semibold text-gray-100`,
                                        style: {
                                          color: backupDialogTheme.textPrimary
                                        },
                                        children: agent.name,
                                      }),
                                      jsx(`div`, {
                                        className: `text-[11px] text-gray-500 truncate`,
                                        style: {
                                          color: backupDialogTheme.textMuted
                                        },
                                        children: agent.model ?
                                          `${agent.model}${agent.description ? ` · ${agent.description}` : ``}` :
                                          agent.description || `未绑定模型`,
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              agent.id,
                            ),
                          ),
                        }),
                      }),
                    ],
                  }),
                  false &&
                  jsx(`div`, {
                    className: `rounded-lg border border-[#3f4651] bg-[#252a32] px-4 py-3 text-xs text-gray-400 flex-shrink-0`,
                    children: ``,
                  }),
                ],
              }),
              jsxs(`div`, {
                className: `flex items-center justify-between gap-3 border-t border-[#3b424d] px-5 py-4 bg-[#252a32] flex-shrink-0`,
                style: {
                  background: backupDialogTheme.headerBg,
                  borderTopColor: backupDialogTheme.mutedBorder,
                  padding: `16px 22px`,
                },
                children: [
                  jsxs(`div`, {
                    className: `text-[11px] text-gray-500`,
                    style: {
                      color: backupDialogTheme.textMuted
                    },
                    children: [
                      `当前已选 `,
                      backupDialogState.modules.includes(`settings`) ?
                      backupDialogState.settingsSections?.length || 0 :
                      backupDialogState.modules.includes(`projects`) ?
                      backupDialogState.projectIds?.length || 0 :
                      backupDialogState.modules.includes(`agents`) ?
                      backupDialogState.agentIds?.length || 0 :
                      backupDialogState.modules.includes(`resources`) ?
                      1 :
                      0,
                      ` 项`,
                    ],
                  }),
                  jsxs(`div`, {
                    className: `flex items-center gap-3`,
                    children: [
                      jsx(`button`, {
                        type: `button`,
                        onClick: () => setBackupDialogState(null),
                        className: `rounded-lg border border-[#59616d] bg-[#2b3039] px-4 py-2 text-xs text-gray-300 hover:bg-[#333945] hover:text-white transition-colors`,
                        style: {
                          minWidth: `76px`,
                          padding: `10px 18px`,
                          background: backupDialogTheme.buttonBg,
                          borderColor: backupDialogTheme.buttonBorder,
                          color: backupDialogTheme.buttonText,
                        },
                        children: `取消`,
                      }),
                      jsx(`button`, {
                        type: `button`,
                        onClick: confirmBackupDialog,
                        disabled: (backupDialogState.modules.includes(`settings`) &&
                            backupDialogState.availableSettingsSections?.length > 0 &&
                            !backupDialogState.settingsSections?.length) ||
                          (backupDialogState.modules.includes(`projects`) &&
                            backupDialogState.availableProjects?.length > 0 &&
                            !backupDialogState.projectIds?.length) ||
                          (backupDialogState.modules.includes(`agents`) &&
                            backupDialogState.availableAgents?.length > 0 &&
                            !backupDialogState.agentIds?.length),
                        className: `rounded-lg border border-blue-400/35 bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed`,
                        style: {
                          minWidth: `92px`,
                          padding: `10px 18px`,
                          background: backupDialogTheme.primaryBg,
                          borderColor: backupDialogTheme.primaryBorder,
                          color: backupDialogTheme.primaryText,
                        },
                        children: backupDialogState.mode === `export` ?
                          `确认导出` :
                          `确认导入`,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        });
}
