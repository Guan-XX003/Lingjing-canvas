/** 全局任务面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { RefreshCw, Trash } from "lucide-react";
declare const chrome: any;

export function WanJuanGlobalTasksPanel({
  canManualRecoverImageTask,
  canManuallyRefreshGlobalTask,
  globalTasks,
  handleManualRecoverImageTask,
  refreshGlobalTask,
  setIsOpen,
  updateGlobalTasks,
}: any) {
  return jsxs(`div`, {
	                      className: `absolute top-full right-0 w-80 bg-[#1c1c1c] border-l border-[#333] shadow-2xl z-50 flex flex-col h-[calc(100vh-112px)] max-h-[calc(100vh-112px)] min-h-0 animate-slide-left wanjuan-task-drawer`,
                      children: [
                        jsxs(`div`, {
                          className: `p-3 border-b border-[#333] flex justify-between items-center bg-[#252525] wanjuan-task-drawer-header`,
                          children: [
                            jsx(`h3`, {
                              className: `text-sm font-bold text-gray-200`,
                              children: `全局任务清单`,
                            }),
                            jsxs(`div`, {
                              className: `flex items-center gap-2`,
                              children: [
                                jsx(`button`, {
                                  onClick: () =>
                                    updateGlobalTasks((tasks) =>
                                      tasks.filter(
                                        (task) =>
                                        task.status !== `completed` &&
                                        task.status !== `failed`,
                                      ),
                                    ),
                                  className: `text-[10px] text-red-400 hover:text-red-300 wanjuan-task-drawer-action`,
                                  title: `清除已完成和失败的任务`,
                                  children: `清空已结束`,
                                }),
                                jsx(`button`, {
                                  onClick: () => setIsOpen(false),
                                  className: `text-gray-400 hover:text-white wanjuan-task-drawer-action`,
                                  children: `✕`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsx(`div`, {
                          className: `flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar wanjuan-task-drawer-list`,
                          children: globalTasks.length === 0 ?
                            jsx(`div`, {
                              className: `text-center text-gray-500 text-xs py-10 wanjuan-task-drawer-empty`,
                              children: `暂无任务`,
                            }) :
	                            [...globalTasks]
	                            .sort((taskA, taskB) => (taskB?.createdAt || 0) - (taskA?.createdAt || 0))
	                            .map((task) =>
                              jsxs(
                                `div`, {
                                  className: `bg-[#2a2a2a] rounded p-2 border border-[#333] relative group flex flex-col gap-1 wanjuan-task-card`,
                                  children: [
                                    jsxs(`div`, {
                                      className: `flex justify-between items-start`,
                                      children: [
                                        jsx(`div`, {
                                          className: `text-xs font-bold text-gray-200 truncate pr-4 wanjuan-task-card-title`,
                                          title: task.prompt ||
                                            `未命名任务`,
                                          children: `${String(task.provider || ``).toLowerCase() === `seedance` || String(task.modelName || ``).toLowerCase().includes(`seedance`) ? `即梦` : String(task.provider || ``).toLowerCase() === `tongyi-wanxiang` || String(task.modelName || ``).toLowerCase().includes(`wan2.`) || String(task.modelName || ``).toLowerCase().includes(`wanx`) ? `通义` : String(task.type || task.customOutputType || ``).toLowerCase() === `image` || task.customOutputType === `image` ? `图像` : String(task.type || task.customOutputType || ``).toLowerCase() === `video` || task.customOutputType === `video` ? `视频` : String(task.type || task.customOutputType || ``).toLowerCase() === `audio` || task.customOutputType === `audio` ? `音频` : String(task.type || task.customOutputType || ``).toLowerCase() === `text` || task.customOutputType === `text` ? `文本` : `任务`} · ${task.prompt ? task.prompt : `任务: ${task.id.substring(0, 8)}...`}`,
                                        }),
                                        jsxs(`div`, {
	                                          className: `flex items-center gap-1`,
	                                          children: [
		                                            canManualRecoverImageTask(task) &&
			                                            jsx(`button`, {
			                                              onClick: () => handleManualRecoverImageTask(task),
			                                              className: `text-[10px] text-amber-300 hover:text-amber-200 rounded px-1.5 py-0.5 min-w-[34px] whitespace-nowrap border border-amber-400/30 hover:bg-amber-400/10 wanjuan-task-card-icon-action is-manual-recover`,
			                                              title: `手动拉回图片结果`,
			                                              children: `拉回`,
			                                            }),
		                                            (task.status ===
		                                              `running` ||
		                                              task.status ===
	                                              `pending` ||
	                                              task.status ===
	                                              `failed` ||
	                                              task.status ===
	                                              `completed`) &&
	                                            jsx(`button`, {
	                                              onClick: () =>
	                                                canManuallyRefreshGlobalTask(task) && refreshGlobalTask(task),
	                                              disabled: !canManuallyRefreshGlobalTask(task),
	                                              className: canManuallyRefreshGlobalTask(task) ? `text-blue-400 hover:text-blue-300 wanjuan-task-card-icon-action is-refresh` : `text-gray-600 cursor-not-allowed wanjuan-task-card-icon-action is-disabled`,
	                                              title: canManuallyRefreshGlobalTask(task) ? `刷新状态` : `当前任务状态不可刷新`,
	                                              children: jsx(RefreshCw, {
                                                size: 12,
                                              }),
                                            }),
                                            jsx(`button`, {
                                              onClick: () =>
                                                updateGlobalTasks((tasks) =>
                                                  tasks.filter(
                                                    (task2) =>
                                                    task2.id !== task.id,
                                                  ),
                                                ),
                                              className: `text-red-400 hover:text-red-300 wanjuan-task-card-icon-action is-delete`,
                                              title: `删除记录`,
                                              children: jsx(
                                                Trash, {
                                                  size: 12
                                                },
                                              ),
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    jsxs(`div`, {
                                      className: `flex justify-between items-center text-[10px]`,
                                      children: [
                                        jsx(`span`, {
                                          className: `text-gray-500 wanjuan-task-card-time`,
                                          children: new Date(
                                            task.createdAt,
                                          ).toLocaleTimeString(),
                                        }),
                                        jsx(`span`, {
                                          className: `px-1.5 rounded wanjuan-task-status ${task.status === `completed` ? `is-completed bg-green-500/20 text-green-400` : task.status === `failed` ? `is-failed bg-red-500/20 text-red-400` : `is-running bg-blue-500/20 text-blue-400`}`,
                                          children: task.status === `completed` ?
                                            `已完成` :
	                                            task.status ===
	                                            `failed` ?
	                                            `失败` :
		                                            !task.progress || task.progress === 0 ?
		                                            (task.status === `pending` ? `排队中` : `生成中`) :
		                                            `${task.progress}%`,
	                                        }),
                                      ],
                                    }),
                                    task.errorMsg &&
                                    jsx(`div`, {
                                      className: `text-[10px] text-red-400 break-words wanjuan-task-error`,
                                      children: task.errorMsg,
                                    }),
                                    task.status === `completed` &&
                                    jsxs(`div`, {
                                      className: `mt-1 flex items-center gap-2 rounded border border-green-500/20 bg-green-500/10 px-2 py-2 text-[11px] text-green-300 wanjuan-task-complete-note`,
                                      children: [
                                        jsx(`span`, {
                                          className: `inline-block h-1.5 w-1.5 rounded-full bg-green-400`,
                                        }),
                                        jsx(`span`, {
                                          children: task.resultUrl || task.customResultData ?
                                            `结果已生成，点击刷新可重新同步到节点` :
                                            `任务已完成，点击刷新可重新拉取结果`,
                                        }),
                                      ],
                                    }),
                                  ],
                                },
                                task.id,
                              ),
	                            ),
                        }),
                      ],
                    });
}
