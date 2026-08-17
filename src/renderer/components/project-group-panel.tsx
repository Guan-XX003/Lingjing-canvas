/** 项目分组管理面板（projectGroupPanelOpen）。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
import { useEffect } from "react";
declare const chrome: any;

export function WanJuanProjectGroupPanel({
  activeProjectId,
  confirmProjectGroupRename,
  createProjectGroup,
  deleteProjectGroup,
  editingProjectGroupId,
  editingProjectGroupName,
  groupedProjectSections,
  moveProjectToGroup,
  persistProjectGroups,
  projectGroupDraft,
  projectGroupList,
  projectGroupSearch,
  projects,
  renameProjectGroup,
  setActiveProjectId,
  setEditingProjectGroupId,
  setEditingProjectGroupName,
  setProjectGroupDraft,
  setProjectGroupPanelOpen,
  setProjectGroupSearch,
  ungroupedProjectList,
}: any) {
  const projectGroupT = (text: string) => (globalThis as any).wanjuanI18nRuntime?.t?.(text) || text;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === `Escape`) setProjectGroupPanelOpen(false);
    };
    window.addEventListener(`keydown`, handleKeyDown);
    return () => window.removeEventListener(`keydown`, handleKeyDown);
  }, [setProjectGroupPanelOpen]);

  return jsx(`div`, {
                  className: `wanjuan-project-group-overlay bg-[#05070b]/88 flex items-center justify-center`,
                  role: `presentation`,
                  onMouseDown: (event) => {
                    if (event.target === event.currentTarget) setProjectGroupPanelOpen(false);
                  },
                  style: {
                    position: `fixed`,
                    inset: 0,
                    zIndex: 2000,
                    padding: `24px`,
                    backgroundColor: `rgba(5, 7, 11, 0.88)`
                  },
                  children: jsxs(`div`, {
                    className: `wanjuan-project-group-dialog bg-[#161a20] rounded-xl border border-[#6b7280] shadow-[0_24px_80px_rgba(0,0,0,0.72)] w-[720px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-48px)] min-h-0 flex flex-col overflow-hidden`,
                    role: `dialog`,
                    "aria-modal": `true`,
                    "aria-labelledby": `wanjuan-project-group-title`,
                    style: {
                      backgroundColor: `#161a20`,
                      borderColor: `#6b7280`,
                      boxShadow: `0 24px 80px rgba(0,0,0,0.72)`,
                      width: `720px`,
                      maxWidth: `calc(100vw - 48px)`,
                      maxHeight: `calc(100vh - 48px)`
                    },
                    children: [
                      jsxs(`div`, {
                        className: `wanjuan-project-group-dialog-header shrink-0 px-4 py-3 border-b border-[#3a4048] flex items-center justify-between`,
                        children: [
                          jsxs(`div`, {
                            className: `flex flex-col`,
                            children: [
                              jsx(`h3`, {
                                id: `wanjuan-project-group-title`,
                                className: `text-gray-100 text-sm font-bold`,
                                children: projectGroupT(`项目分组`),
                              }),
                              jsx(`span`, {
                                className: `text-[11px] text-gray-500`,
                                children: projectGroupT(`给项目选择分组，旧项目会保留在未分组`),
                              }),
                            ],
                          }),
                          jsx(`button`, {
                            onClick: () => setProjectGroupPanelOpen(false),
                            className: `text-gray-400 hover:text-white leading-none p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400`,
                            title: projectGroupT(`关闭`),
                            "aria-label": projectGroupT(`关闭`),
                            children: jsx(X, { size: 18, "aria-hidden": `true` }),
                          }),
                        ],
                      }),
                      jsxs(`div`, {
                        className: `wanjuan-project-group-dialog-form shrink-0 p-3 border-b border-[#3a4048] grid grid-cols-[1fr_1fr_auto] gap-2`,
                        children: [
                          jsx(`input`, {
                            value: projectGroupSearch,
                            onChange: (event) => setProjectGroupSearch(event.target.value),
                            placeholder: projectGroupT(`搜索项目`),
                            className: `wanjuan-project-group-input bg-[#181b20] border border-[#3a4048] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500`,
                          }),
                          jsx(`input`, {
                            value: projectGroupDraft,
                            onChange: (event) => setProjectGroupDraft(event.target.value),
                            onKeyDown: (event) => {
                              event.key === `Enter` && createProjectGroup();
                            },
                            placeholder: projectGroupT(`新分组名称`),
                            className: `wanjuan-project-group-input bg-[#181b20] border border-[#3a4048] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500`,
                          }),
                          jsx(`button`, {
                            onClick: createProjectGroup,
                            className: `wanjuan-project-group-primary bg-blue-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-500`,
                            children: projectGroupT(`新建分组`),
                          }),
                        ],
                      }),
                      jsxs(`div`, {
                        className: `wanjuan-project-group-dialog-body flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 custom-scrollbar`,
                        style: {
                          minHeight: 0,
                          overscrollBehavior: `contain`,
                        },
                        children: [
                          jsxs(`div`, {
                            className: `wanjuan-project-group-section rounded-lg border border-[#4b5563] bg-[#11151b] overflow-hidden`,
                            style: {
                              backgroundColor: `#11151b`,
                              borderColor: `#4b5563`
                            },
                            children: [
                              jsxs(`div`, {
                                className: `wanjuan-project-group-section-header px-3 py-2 bg-[#242a33] flex items-center justify-between`,
                                style: {
                                  backgroundColor: `#242a33`
                                },
                                children: [
                                  jsx(`span`, {
                                    className: `text-xs font-semibold text-gray-200`,
                                    children: projectGroupT(`未分组`),
                                  }),
                                  jsx(`span`, {
                                    className: `text-[10px] text-gray-500`,
                                    children: projectGroupT(`${ungroupedProjectList.length} 个项目`),
                                  }),
                                ],
                              }),
                              ungroupedProjectList.length === 0 ?
                              jsx(`div`, {
                                className: `px-3 py-3 text-xs text-gray-500`,
                                children: projectGroupT(`没有未分组项目`),
                              }) :
                              ungroupedProjectList.map((project) =>
                                jsxs(`div`, {
                                  className: `wanjuan-project-group-row px-3 py-2 border-t border-[#343b46] bg-[#11151b] flex items-center gap-3`,
                                  style: {
                                    backgroundColor: `#11151b`,
                                    borderColor: `#343b46`
                                  },
                                  children: [
                                    jsx(`button`, {
                                      onClick: () => {
                                        (setActiveProjectId(project.id), setProjectGroupPanelOpen(false));
                                      },
                                      className: `flex-1 text-left text-xs truncate ${project.id === activeProjectId ? `text-blue-300 font-semibold` : `text-gray-200 hover:text-white`}`,
                                      title: project.name,
                                      children: project.name,
                                    }),
                                    jsxs(`select`, {
                                      value: project.groupId || ``,
                                      onChange: (event) => moveProjectToGroup(project.id, event.target.value),
                                      className: `wanjuan-project-group-select w-36 bg-[#15181d] border border-[#3a4048] rounded px-2 py-1 text-[11px] text-gray-300 outline-none`,
                                      title: projectGroupT(`移动到分组`),
                                      children: [
                                        jsx(`option`, {
                                          value: ``,
                                          children: projectGroupT(`未分组`),
                                        }),
                                        projectGroupList.map((group) =>
                                          jsx(`option`, {
                                            value: group.id,
                                            children: group.name,
                                          }, group.id),
                                        ),
                                      ],
                                    }),
                                  ],
                                }, project.id),
                              ),
                            ],
                          }),
                          groupedProjectSections.map((group) =>
                            jsxs(`div`, {
                              className: `wanjuan-project-group-section rounded-lg border border-[#4b5563] bg-[#11151b] overflow-hidden`,
                              style: {
                                backgroundColor: `#11151b`,
                                borderColor: `#4b5563`
                              },
                              children: [
                                jsxs(`div`, {
                                  className: `wanjuan-project-group-section-header px-3 py-2 bg-[#242a33] flex items-center gap-2`,
                                  style: {
                                    backgroundColor: `#242a33`
                                  },
                                  children: [
                                    jsx(`button`, {
                                      onClick: () =>
                                        persistProjectGroups(projectGroupList.map((group2) => group2.id === group.id ? {
                                          ...group2,
                                          collapsed: !group2.collapsed
                                        } : group2)),
                                      className: `text-gray-400 hover:text-white text-xs w-4`,
                                      title: group.collapsed ? projectGroupT(`展开分组`) : projectGroupT(`折叠分组`),
                                      children: group.collapsed ? `›` : `⌄`,
                                    }),
                                    editingProjectGroupId === group.id ?
                                    jsx(`input`, {
                                      value: editingProjectGroupName,
                                      onChange: (event) => setEditingProjectGroupName(event.target.value),
                                      onKeyDown: (event) => {
                                        event.key === `Enter` && confirmProjectGroupRename();
                                        event.key === `Escape` &&
                                          (setEditingProjectGroupId(null),
                                            setEditingProjectGroupName(``));
                                      },
                                      className: `wanjuan-project-group-input flex-1 min-w-0 bg-[#15181d] border border-blue-500/60 rounded px-2 py-1 text-xs text-gray-100 outline-none`,
                                      autoFocus: true,
                                    }) :
                                    jsx(`span`, {
                                      className: `flex-1 text-xs font-semibold text-gray-200 truncate`,
                                      title: group.name,
                                      children: group.name,
                                    }),
                                    jsx(`span`, {
                                      className: `text-[10px] text-gray-500`,
                                      children: projectGroupT(`${group.projects.length} 个项目`),
                                    }),
                                    editingProjectGroupId === group.id ?
                                    jsx(`button`, {
                                      onClick: confirmProjectGroupRename,
                                      className: `text-[10px] text-blue-300 hover:text-blue-200`,
                                      children: projectGroupT(`保存`),
                                    }) :
                                    jsx(`button`, {
                                      onClick: () => renameProjectGroup(group.id),
                                      className: `text-[10px] text-gray-500 hover:text-blue-300`,
                                      children: projectGroupT(`重命名`),
                                    }),
                                    editingProjectGroupId === group.id &&
                                    jsx(`button`, {
                                      onClick: () => {
                                        (setEditingProjectGroupId(null),
                                          setEditingProjectGroupName(``));
                                      },
                                      className: `text-[10px] text-gray-500 hover:text-white`,
                                      children: projectGroupT(`取消`),
                                    }),
                                    jsx(`button`, {
                                      onClick: () => deleteProjectGroup(group.id),
                                      className: `text-[10px] text-red-400 hover:text-red-300`,
                                      children: projectGroupT(`删除`),
                                    }),
                                  ],
                                }),
                                !group.collapsed &&
                                (group.projects.length === 0 ?
                                  jsx(`div`, {
                                    className: `px-3 py-3 text-xs text-gray-500`,
                                    children: projectGroupT(`暂无项目`),
                                  }) :
                                  group.projects.map((project) =>
                                    jsxs(`div`, {
                                      className: `wanjuan-project-group-row px-3 py-2 border-t border-[#343b46] bg-[#11151b] flex items-center gap-3`,
                                      style: {
                                        backgroundColor: `#11151b`,
                                        borderColor: `#343b46`
                                      },
                                      children: [
                                        jsx(`button`, {
                                          onClick: () => {
                                            (setActiveProjectId(project.id), setProjectGroupPanelOpen(false));
                                          },
                                          className: `flex-1 text-left text-xs truncate ${project.id === activeProjectId ? `text-blue-300 font-semibold` : `text-gray-200 hover:text-white`}`,
                                          title: project.name,
                                          children: project.name,
                                        }),
                                        jsxs(`select`, {
                                          value: project.groupId || ``,
                                          onChange: (event) => moveProjectToGroup(project.id, event.target.value),
                                          className: `wanjuan-project-group-select w-36 bg-[#15181d] border border-[#3a4048] rounded px-2 py-1 text-[11px] text-gray-300 outline-none`,
                                          title: projectGroupT(`移动到分组`),
                                          children: [
                                            jsx(`option`, {
                                              value: ``,
                                              children: projectGroupT(`未分组`),
                                            }),
                                            projectGroupList.map((group2) =>
                                              jsx(`option`, {
                                                value: group2.id,
                                                children: group2.name,
                                              }, group2.id),
                                            ),
                                          ],
                                        }),
                                      ],
                                    }, project.id),
                                  )),
                              ],
                            }, group.id),
                          ),
                        ],
                      }),
                    ],
                  }),
                });
}
