// @ts-nocheck
/** WanJuanSettingsSectionD：自 WanJuanAppRoot render 抽出的 JSX 段，props 传入，行为不变。 */
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { WanJuanConfigButlerErrorAssistant } from "../components/config-butler-error-assistant";
import { WanJuanGlobalTasksPanel } from "../components/global-tasks-panel";
import { WanJuanProjectGroupPanel } from "../components/project-group-panel";
import { WanJuanProjectMenu } from "../components/project-menu";
import { WanJuanRenameProjectDialog } from "../components/rename-project-dialog";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

const WANJUAN_BEGINNER_GUIDE_URL =
  "https://kcn07wr6x9xu.feishu.cn/docx/JcmqdxcI9oSt9yxEatscvioEnHn";
const WANJUAN_BEGINNER_GUIDE_OPENED_KEY = "wanjuan.beginnerGuideOpened.v1";

export function WanJuanSettingsSectionD(props: any) {
  const {
    ConfirmRenameProject,
    applyConfigButlerManualProtocolFix,
    canManualRecoverImageTask,
    canManuallyRefreshGlobalTask,
    configButlerManualProblemPart,
    configButlerManualProtocolName,
    configButlerManualProtocolOpen,
    configButlerManualProtocolText,
    configButlerRepairHistory,
    configButlerRepairHistoryOpen,
    configErrorAssistantTheme,
    confirmProjectGroupRename,
    createProjectGroup,
    deleteProjectGroup,
    editingProjectGroupId,
    editingProjectGroupName,
    groupedProjectSections,
    handleCreateProject,
    handleManualRecoverImageTask,
    moveProjectToGroup,
    newProjectGroupId,
    newProjectName,
    openConfigButlerManualProblemFields,
    persistProjectGroups,
    projectGroupDraft,
    projectGroupList,
    projectGroupSearch,
    refreshGlobalTask,
    renameProjectGroup,
    renameProjectName,
    rollbackConfigButlerRepair,
    setConfigButlerErrorAssistant,
    setConfigButlerErrorAssistantMinimized,
    setConfigButlerManualProblemPart,
    setConfigButlerManualProtocolName,
    setConfigButlerManualProtocolOpen,
    setConfigButlerManualProtocolText,
    setConfigButlerRepairHistoryOpen,
    setEditingProjectGroupId,
    setEditingProjectGroupName,
    setNewProjectName,
    setProjectGroupDraft,
    setProjectGroupSearch,
    setRenameProjectId,
    setRenameProjectName,
    ungroupedProjectList,
    applyConfigButlerErrorAssistantFix,
    $e,
    Trash2,
    VtRenameProject,
    WanJuanCanvasShell,
    activeProjectId,
    activeView,
    addCustomNodeTemplate,
    addTransitResource,
    apiConfigs,
    arkTrustedAssetConfig,
    audioApiKey,
    audioApiUrl,
    audioModelApiBindings,
    audioModelProtocolBindings,
    audioModels,
    configButlerErrorAssistant,
    configButlerErrorAssistantMinimized,
    customPublicUploadConfig,
    deleteCustomNodeTemplate,
    edges,
    getUnreadSystemNotifications,
    globalTasks,
    handleDeleteProject,
    imageApiKey,
    imageApiUrl,
    imageCompatResolutions,
    imageModelApiBindings,
    imageModelProtocolBindings,
    imageModels,
    isOpen,
    layeredRunConcurrencyOptions,
    layeredRunMaxConcurrency,
    maxPollingDuration,
    modelProtocolRegistry,
    newProjectIds,
    openSystemNotificationPanel,
    pollingInterval,
    presetPrompts,
    projectGroupIds,
    projectGroupPanelOpen,
    projectGroupedSectionsAll,
    projectMenuOpen,
    projectStorageLabel,
    projectUngroupedAll,
    projects,
    qiniuConfig,
    renameProjectId,
    runManualConfigButlerErrorQuery,
    runStorageMigrationForProject,
    seedanceDurations,
    seedanceEnableWebSearch,
    seedanceGenerateAudio,
    seedanceModel,
    seedanceRatios,
    seedanceResolutions,
    seedanceUploadMode,
    seedanceVirtualPortraits,
    seedanceWatermark,
    sendToPlugin,
    setArkTrustedAssetConfig,
    setActiveProjectId,
    setIsOpen,
    setNewProjectGroupId,
    setNewProjectIds,
    setProjectGroupPanelOpen,
    setProjectMenuOpen,
    settingsNotificationChecking,
    showToast2,
    textApiKey,
    textApiUrl,
    textModelApiBindings,
    textModelProtocolBindings,
    textModels,
    tianjiSeedanceModel,
    tongyiWanxiangDurations,
    tongyiWanxiangEditModels,
    tongyiWanxiangImageModels,
    tongyiWanxiangRatios,
    tongyiWanxiangReferenceImageModels,
    tongyiWanxiangResolutions,
    tongyiWanxiangTextModels,
    tosConfig,
    transitResources,
    ttsMusicModel,
    updateGlobalTasks,
    videoApiKey,
    videoApiUrl,
    videoAspectRatios,
    videoDurations,
    videoModelApiBindings,
    videoModelProtocolBindings,
    videoModelRequestProfilesText,
    videoModels,
    videoResolutions,
  } = props;
  const [beginnerGuideUnseen, setBeginnerGuideUnseen] = useState(() => {
    try {
      return window.localStorage.getItem(WANJUAN_BEGINNER_GUIDE_OPENED_KEY) !== `1`;
    } catch {
      return true;
    }
  });
  const [beginnerGuideCoachmarkVisible, setBeginnerGuideCoachmarkVisible] = useState(beginnerGuideUnseen);

  useEffect(() => {
    if (!beginnerGuideUnseen || !beginnerGuideCoachmarkVisible) return;
    const timer = window.setTimeout(() => setBeginnerGuideCoachmarkVisible(false), 10000);
    return () => window.clearTimeout(timer);
  }, [beginnerGuideCoachmarkVisible, beginnerGuideUnseen]);

  const openBeginnerGuide = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      let opened = false;
      if (window.wanjuanDesktop?.openExternal) {
        const result = await window.wanjuanDesktop.openExternal(WANJUAN_BEGINNER_GUIDE_URL);
        opened = result?.ok === true;
      } else {
        window.open(WANJUAN_BEGINNER_GUIDE_URL, `_blank`, `noopener,noreferrer`);
        opened = true;
      }
      if (!opened) {
        showToast2?.(`无法打开新手操作手册，请稍后重试`);
        return;
      }
      try {
        window.localStorage.setItem(WANJUAN_BEGINNER_GUIDE_OPENED_KEY, `1`);
      } catch {}
      setBeginnerGuideUnseen(false);
      setBeginnerGuideCoachmarkVisible(false);
    } catch (error) {
      showToast2?.(`无法打开新手操作手册：${error?.message || error}`);
    }
  };

  return jsxs(`div`, {
              className: `absolute inset-0 w-full h-full bg-[#121212] flex flex-col ${activeView === `canvas` ? `visible z-10` : `invisible -z-10`}`,
              children: [
                jsxs(`div`, {
                  className: `bg-[#1c1c1c] border-b border-[#333] px-4 py-2 flex items-center justify-between z-20 relative`,
                  children: [
                    jsxs(`div`, {
                      className: `flex items-center gap-2`,
                      children: [
                        jsx(`button`, {
                          type: `button`,
                          onClick: () => VtRenameProject(activeProjectId),
                          className: `bg-[#2a2a2a] text-gray-100 text-xs rounded px-3 py-1 border border-[#444] hover:border-blue-500 hover:text-blue-300 w-40 truncate text-left`,
                          title: `点击重命名项目`,
                          children: projects.find((project) => project.id === activeProjectId)?.name ||
                            `未命名项目`,
                        }),
                        jsx(`select`, {
                          value: activeProjectId,
                          onChange: (event) => setActiveProjectId(event.target.value),
                          className: `bg-[#2a2a2a] text-gray-200 text-xs rounded px-3 py-1 border border-[#333] outline-none w-40`,
                          title: `切换项目`,
                          children: [
                            projectUngroupedAll.length > 0 &&
                            jsx(`optgroup`, {
                              label: `未分组`,
                              children: projectUngroupedAll.map((option) =>
                                jsx(
                                  `option`, {
                                    value: option.id,
                                    children: option.name
                                  },
                                  option.id,
                                ),
                              ),
                            }, `ungrouped`),
                            ...projectGroupedSectionsAll
                            .filter((group) => group.projects.length > 0)
                            .map((group) =>
                              jsx(`optgroup`, {
                                label: `${group.name} (${group.projects.length})`,
                                children: group.projects.map((project) =>
                                  jsx(
                                    `option`, {
                                      value: project.id,
                                      children: project.name
                                    },
                                    project.id,
                                  ),
                                ),
                              }, group.id),
                            ),
                          ],
                        }),
                        jsx(`button`, {
                          onClick: () => setProjectGroupPanelOpen(true),
                          className: `bg-[#2a2a2a] text-gray-300 text-xs rounded px-2 py-1 border border-[#333] hover:border-blue-500 hover:text-blue-300`,
                          title: `项目分组管理`,
                          children: `分组`,
                        }),
                        jsx(`button`, {
                          onClick: () => runStorageMigrationForProject(activeProjectId, false),
                          className: `bg-[#2a2a2a] text-gray-300 text-[10px] rounded px-2 py-1 border border-[#333] hover:border-blue-500 hover:text-blue-300`,
                          title: projects.find((project) => project.id === activeProjectId)?.storageDetail || `优先优化此项目`,
                          children: projectStorageLabel(projects.find((project) => project.id === activeProjectId)),
                        }),
                        jsx(`button`, {
                          onClick: () => {
                            let activeProject = projects.find((project) => project.id === activeProjectId),
                              currentProjectGroupId = activeProject?.groupId || ``;
                            setNewProjectGroupId(projectGroupIds.has(currentProjectGroupId) ? currentProjectGroupId : ``);
                            setProjectMenuOpen(true);
                          },
                          className: `text-gray-400 hover:text-white p-1`,
                          title: `新建项目`,
                          children: `+`,
                        }),
                        projects.length > 1 &&
                        jsx(`button`, {
                          onClick: () => handleDeleteProject(activeProjectId),
                          className: `wanjuan-canvas-model-toolbar-icon is-delete text-red-400 hover:text-red-300 p-1`,
                          title: `删除当前项目`,
                          children: jsx(Trash2, {
                            size: 16
                          }),
                        }),
                      ],
                    }),
	                    jsx(`div`, {
	                      className: `flex items-center gap-2`,
	                      children: [
	                        jsxs(`div`, {
	                          className: `wanjuan-beginner-guide-anchor`,
	                          children: [
	                            jsxs(`button`, {
	                              type: `button`,
	                              className: `wanjuan-topbar-notification-button wanjuan-beginner-guide-button ${beginnerGuideUnseen ? `is-unseen` : ``}`,
	                              title: `新手操作手册`,
	                              "aria-label": `打开新手操作手册`,
	                              onClick: openBeginnerGuide,
	                              children: [
	                                jsx(BookOpen, {
	                                  size: 18,
	                                  "aria-hidden": `true`,
	                                }),
	                                beginnerGuideUnseen && jsx(`span`, {
	                                  className: `wanjuan-beginner-guide-dot`,
	                                  "aria-hidden": `true`,
	                                }),
	                              ],
	                            }),
	                            beginnerGuideCoachmarkVisible &&
	                            jsxs(`div`, {
	                              className: `wanjuan-beginner-guide-coachmark`,
	                              role: `status`,
	                              "aria-live": `polite`,
	                              children: [
	                                jsx(`strong`, {
	                                  children: `第一次使用？从这里开始`,
	                                }),
	                                jsx(`span`, {
	                                  children: `查看模型配置和画布操作手册`,
	                                }),
	                              ],
	                            }),
	                          ],
	                        }),
	                        jsxs(`button`, {
	                          type: `button`,
	                          className: `wanjuan-topbar-notification-button`,
	                          title: `系统通知与公告`,
	                          "aria-label": `系统通知与公告`,
	                          disabled: settingsNotificationChecking,
	                          onClick: async (event) => {
	                            event.preventDefault();
	                            event.stopPropagation();
	                            if (settingsNotificationChecking) return;
	                            await openSystemNotificationPanel();
	                          },
	                          children: [
	                            jsxs(`svg`, {
	                              xmlns: `http://www.w3.org/2000/svg`,
	                              viewBox: `0 0 24 24`,
	                              fill: `none`,
	                              stroke: `currentColor`,
	                              strokeWidth: `2`,
	                              strokeLinecap: `round`,
	                              strokeLinejoin: `round`,
	                              "aria-hidden": `true`,
	                              children: [
	                                jsx(`path`, {
	                                  d: `M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8`,
	                                }),
	                                jsx(`path`, {
	                                  d: `M13.73 21a2 2 0 0 1-3.46 0`,
	                                }),
	                              ],
	                            }),
	                            getUnreadSystemNotifications().length > 0 &&
	                            jsx(`span`, {
	                              className: `wanjuan-topbar-notification-dot`,
	                              "aria-hidden": `true`,
	                            }),
	                          ],
	                        }),
	                        jsxs(`button`, {
	                          onClick: runManualConfigButlerErrorQuery,
	                          className: `bg-transparent text-white border border-white pl-3 pr-8 py-1 rounded text-xs hover:bg-white/10 transition-colors flex items-center gap-1 relative`,
	                          title: `手动查询任务清单中最新一次失败任务的错误原因`,
                          style: {
                            height: `30px`,
                            minWidth: `92px`,
                          },
                          children: [
                            jsx(`span`, {
                              className: `font-bold`,
                              children: wanjuanT(`错误查询`),
                            }),
                            jsxs(`svg`, {
                              xmlns: `http://www.w3.org/2000/svg`,
                              viewBox: `0 0 24 24`,
                              fill: `none`,
                              strokeLinecap: `round`,
                              strokeLinejoin: `round`,
                              style: {
                                position: `absolute`,
                                right: `10px`,
                                top: `50%`,
                                width: `16px`,
                                height: `16px`,
                                transform: `translateY(-50%)`,
                                color: configButlerErrorAssistant?.status === `checking` && configButlerErrorAssistantMinimized ? `#ef4444` : `#60a5fa`,
                              },
                              children: [
                                jsx(`path`, {
                                  d: `M4 10h16`,
                                  stroke: `currentColor`,
                                  strokeWidth: `2`,
                                }),
                                jsx(`path`, {
                                  d: `M7 10l1.4-4.2A2 2 0 0 1 10.3 4h3.4a2 2 0 0 1 1.9 1.8L17 10`,
                                  stroke: `currentColor`,
                                  strokeWidth: `2`,
                                }),
                                jsx(`path`, {
                                  d: `M6 10v3a6 6 0 0 0 12 0v-3`,
                                  stroke: `currentColor`,
                                  strokeWidth: `2`,
                                }),
                                jsx(`path`, {
                                  d: `M9 14h.01M15 14h.01`,
                                  stroke: `currentColor`,
                                  strokeWidth: `2.4`,
                                }),
                                jsx(`path`, {
                                  d: `M10 18h4`,
                                  stroke: `currentColor`,
                                  strokeWidth: `2`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`button`, {
                          onClick: () => setIsOpen(!isOpen),
                          className: `bg-transparent text-white border border-white pl-3 pr-8 py-1 rounded text-xs hover:bg-white/10 transition-colors flex items-center gap-1 relative`,
                          style: {
                            height: `30px`,
                            minWidth: `92px`,
                          },
                          children: [
                            jsx(`span`, {
                              className: `font-bold`,
                              children: wanjuanT(`任务清单`),
                            }),
                            globalTasks.filter(
                              (task) =>
                              task.status === `running` ||
                              task.status === `pending`,
                            ).length > 0 &&
                            jsx(`span`, {
                              className: `absolute rounded-full bg-red-500 animate-pulse`,
                              style: {
                                right: `14px`,
                                top: `50%`,
                                width: `8px`,
                                height: `8px`,
                                transform: `translateY(-50%)`,
                              },
                            }),
                          ],
                        }),
                      ],
                    }),
                    isOpen &&
	                    jsx(WanJuanGlobalTasksPanel, {
  canManualRecoverImageTask,
  canManuallyRefreshGlobalTask,
  globalTasks,
  handleManualRecoverImageTask,
  refreshGlobalTask,
  setIsOpen,
  updateGlobalTasks,
}),
                  ],
                }),
                configButlerErrorAssistant &&
                !configButlerErrorAssistantMinimized &&
                jsx(WanJuanConfigButlerErrorAssistant, {
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
}),
                jsx(`div`, {
                  className: `flex-1 relative`,
                  children: jsx(
                    WanJuanCanvasShell, {
                      appLanguage: (globalThis as any).wanjuanI18nRuntime?.getLanguage?.() || `zh-CN`,
                      projectId: activeProjectId,
                      textApiUrl: textApiUrl,
                      textApiKey: textApiKey,
                      imageApiUrl: imageApiUrl,
                      imageApiKey: imageApiKey,
                      videoApiUrl: videoApiUrl,
                      videoApiKey: videoApiKey,
	                      audioApiUrl: audioApiUrl,
	                      audioApiKey: audioApiKey,
	                      textModel: textModels,
	                      drawingModel: imageModels,
	                      imageCompatResolutions: imageCompatResolutions,
	                      videoModel: videoModels,
                      videoDurations: videoDurations,
                      videoResolutions: videoResolutions,
                      videoAspectRatios: videoAspectRatios,
                      videoModelRequestProfiles: videoModelRequestProfilesText,
                      seedanceModel: seedanceModel,
                      tianjiSeedanceModel: tianjiSeedanceModel,
                      seedanceDurations: seedanceDurations,
                      seedanceResolutions: seedanceResolutions,
                      seedanceRatios: seedanceRatios,
                      seedanceGenerateAudio: seedanceGenerateAudio,
                      seedanceWatermark: seedanceWatermark,
                      seedanceEnableWebSearch: seedanceEnableWebSearch,
                      seedanceVirtualPortraits: seedanceVirtualPortraits,
                      tongyiWanxiangTextModels: tongyiWanxiangTextModels,
                      tongyiWanxiangReferenceImageModels: tongyiWanxiangReferenceImageModels,
                      tongyiWanxiangImageModels: tongyiWanxiangImageModels,
                      tongyiWanxiangEditModels: tongyiWanxiangEditModels,
                      tongyiWanxiangDurations: tongyiWanxiangDurations,
                      tongyiWanxiangResolutions: tongyiWanxiangResolutions,
                      tongyiWanxiangRatios: tongyiWanxiangRatios,
                      seedanceUploadMode: seedanceUploadMode,
                      tosConfig: tosConfig,
	                      customPublicUploadConfig: customPublicUploadConfig,
	                      qiniuConfig: qiniuConfig,
	                      initialEmptyProject: newProjectIds.includes(activeProjectId),
	                      onInitialEmptyProjectReady: (value) =>
	                        setNewProjectIds((prev) => prev.filter((item) => item !== value)),
	                      audioModel: audioModels,
                      ttsMusicModel: ttsMusicModel,
                      showToast: showToast2,
                      transitResources: transitResources,
                      addTransitResource: addTransitResource,
                      presetPrompts: presetPrompts,
                      membership: $e,
                      globalTasks: globalTasks,
                      updateGlobalTasks: updateGlobalTasks,
                      onSendToActiveTab: sendToPlugin,
                      customNodeTemplates: edges,
                      onAddCustomNodeTemplate: addCustomNodeTemplate,
                      onDeleteCustomNodeTemplate: deleteCustomNodeTemplate,
                      apiConfigs: apiConfigs,
                      arkTrustedAssetConfig: arkTrustedAssetConfig,
                      setArkTrustedAssetConfig: setArkTrustedAssetConfig,
                      modelProtocolRegistry: modelProtocolRegistry,
                      textModelApiBindings: textModelApiBindings,
                      textModelProtocolBindings: textModelProtocolBindings,
                      imageModelApiBindings: imageModelApiBindings,
	                      imageModelProtocolBindings: imageModelProtocolBindings,
	                      videoModelProtocolBindings: videoModelProtocolBindings,
	                      videoModelApiBindings: videoModelApiBindings,
	                      audioModelProtocolBindings: audioModelProtocolBindings,
	                      audioModelApiBindings: audioModelApiBindings,
	                      seedanceUploadMode: seedanceUploadMode,
                      tosConfig: tosConfig,
                      customPublicUploadConfig: customPublicUploadConfig,
                      qiniuConfig: qiniuConfig,
                      globalPollingInterval: pollingInterval,
                      globalMaxPollingDuration: maxPollingDuration,
                      layeredRunConcurrencyOptions: layeredRunConcurrencyOptions,
                      layeredRunMaxConcurrency: layeredRunMaxConcurrency,
                    },
                    activeProjectId,
                  ),
                }),
                projectGroupPanelOpen &&
                jsx(WanJuanProjectGroupPanel, {
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
}),
                projectMenuOpen &&
                jsx(WanJuanProjectMenu, {
  handleCreateProject,
  newProjectGroupId,
  newProjectName,
  projectGroupList,
  setNewProjectGroupId,
  setNewProjectName,
  setProjectMenuOpen,
}),
                renameProjectId &&
                jsx(WanJuanRenameProjectDialog, {
  ConfirmRenameProject,
  renameProjectName,
  setRenameProjectId,
  setRenameProjectName,
}),
              ],
            });
}
