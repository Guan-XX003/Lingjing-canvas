/** 设置-数据管理 标签页。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { WanJuanStorageOptimizationPanel } from "./storage-optimization-panel";
import { Download, ShieldAlert, Trash2, Upload } from "lucide-react";
declare const chrome: any;

export function WanJuanSettingsDataTab({
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
}: any) {
  const handleRemoveLocalUserData = async () => {
    const confirmed = window.confirm(
      `这会永久删除本机上的画布项目、资源索引、API 配置、智能体、工作空间、本地账号会话和应用缓存。\n\n不会删除云端账号，也不会删除下载目录中的导出文件。此操作不可恢复，确定继续吗？`,
    );
    if (!confirmed) return;
    const phrase = await window.wanjuanDesktop?.showInputDialog?.({
      title: `清除本机数据并退出`,
      message: `请输入“删除本机数据”以确认。应用随后会自动退出。`,
      defaultValue: ``,
    });
    if (String(phrase || ``).trim() !== `删除本机数据`) {
      phrase !== null && showToast2(`确认文字不正确，未删除任何数据`);
      return;
    }
    const result = await window.wanjuanDesktop?.removeLocalUserData?.({
      confirmation: `DELETE_WANJUAN_LOCAL_DATA`,
    });
    if (!result?.ok) showToast2(result?.error || `无法安排本机数据清理`);
  };

  return jsx(`div`, {
                        className: `space-y-6 wanjuan-settings-section`,
                        children: jsxs(`div`, {
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
                                        className: `text-orange-500`,
                                        children: `📦`,
                                      }),
                                      ` 项目与备份`,
                                    ],
                                  }),
                                  jsx(`p`, {
                                    className: `text-[11px] text-gray-500 mt-1 wanjuan-settings-help`,
                                    children: `管理项目存储优化、备份导入导出和跨设备迁移。`,
                                  }),
                                ],
                              }),
                            }),
                            jsx(WanJuanStorageOptimizationPanel, {
  cleanStorageOptimization,
  downloadDirectory,
  enableStorageOptimization,
  formatStorageBytes,
  manageStorageOptimizationTrash,
  projects,
  purgeStorageOptimizationTrash,
  refreshStorageOptimizationStatus,
  restoreStorageOptimizationTrash,
  runNextStorageMigration,
  scanStorageOptimization,
  setStorageOptimizationLastResult,
  setStorageOptimizationPaused,
  showStorageOptimizationDetails,
  storageOptimizationBusy,
  storageOptimizationEnabled,
  storageOptimizationLastResult,
  storageOptimizationPaused,
  storageOptimizationStatus,
}),
                            jsxs(`div`, {
                              className: `px-4 pt-4 pb-2 wanjuan-settings-card-body`,
                              children: [
                                jsxs(`p`, {
                                  className: `text-xs text-gray-400 leading-relaxed mb-4 wanjuan-settings-copy`,
                                  children: [
                                    `现在支持按`,
	                                    jsx(`strong`, {
	                                      className: `text-gray-200`,
	                                      children: `设置参数、画布项目、智能体配置`,
	                                    }),
                                    `分别导出导入，也可以继续做完整备份。下方勾选后会按当前所选模块执行。`,
                                    jsx(`br`, {}),
                                    jsx(`span`, {
                                      className: `text-blue-400 mt-1 inline-block`,
                                      children: `• 跨设备迁移时可单独恢复项目`,
                                    }),
                                    jsx(`br`, {}),
                                    jsx(`span`, {
                                      className: `text-green-400`,
                                      children: `• 画布项目导出将包含关联资源存储，不再跳过图片素材`,
                                    }),
                                    jsx(`br`, {}),
	                                    jsx(`span`, {
	                                      className: `text-purple-400`,
	                                      children: `• 设置备份包含 API Key、已储存全局配置、云盘凭据、虚拟人像库、即梦天玑和通义万相配置`,
	                                    }),
                                  ],
                                }),
	                                jsxs(`div`, {
	                                  className: `grid grid-cols-1 md:grid-cols-2 gap-4`,
	                                  children: [
                                    jsxs(`div`, {
                                      className: `rounded-xl border border-[#2d2d2d] bg-[#151515] p-4 space-y-3 wanjuan-settings-subcard`,
                                      children: [
                                        jsxs(`div`, {
                                          className: `flex items-center justify-between gap-3`,
                                          children: [
                                            jsx(`div`, {
                                              className: `text-sm font-bold text-gray-200`,
                                              children: `导出勾选项`,
                                            }),
                                            jsx(`span`, {
                                              className: `text-[11px] text-gray-500`,
                                              children: `${backupExportSelection.filter((item) => [`settings`, `projects`, `agents`].includes(item)).length}/3 已选`,
                                            }),
                                          ],
                                        }),
                                        jsx(`div`, {
                                          className: `space-y-2`,
                                          children: [`settings`, `projects`, `agents`].map((item) =>
                                            jsxs(
                                              `label`, {
                                                className: `flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#1b1b1b] px-3 py-2 text-sm text-gray-300 cursor-pointer hover:border-[#3a3a3a] hover:text-white transition-colors`,
                                                children: [
                                                  jsx(`input`, {
                                                    type: `checkbox`,
                                                    checked: backupExportSelection.includes(item),
                                                    onChange: () =>
                                                      setBackupExportSelection((selection) =>
                                                        selection.includes(item) ?
                                                        selection.filter((item2) => item2 !== item) :
                                                        [...selection, item],
                                                      ),
                                                    className: `h-4 w-4 rounded border-[#444] bg-[#111] text-orange-500 focus:ring-orange-500`,
                                                  }),
                                                  jsx(`span`, {
                                                    className: `font-medium`,
                                                    children: BACKUP_MODULE_LABELS[item],
                                                  }),
                                                ],
                                              },
                                              item,
                                            ),
                                          ),
                                        }),
                                        jsxs(`button`, {
                                          onClick: (event) => {
                                            let selected = backupExportSelection.filter((item) => [`settings`, `projects`, `agents`].includes(item));
                                            (event.preventDefault(),
                                              selected.length ?
                                              openBackupExportDialog(
                                                selected,
                                              ) :
                                              showToast2(`请至少勾选一个导出模块`));
                                          },
                                          className: `w-full flex items-center justify-center gap-2 text-sm bg-[#222] text-gray-300 border border-[#333] py-2.5 rounded-lg hover:bg-[#2a2a2a] hover:text-white hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed wanjuan-settings-button wanjuan-settings-button-block`,
                                          disabled: !backupExportSelection.filter((item) => [`settings`, `projects`, `agents`].includes(item)).length,
                                          children: [
                                            jsx(Upload, {
                                              size: 16,
                                              className: `text-orange-400`,
                                            }),
                                            jsx(`span`, {
                                              className: `font-bold`,
                                              children: `导出当前勾选项`,
	                                    }),
	                                  ],
	                                }),
	                              ],
	                            }),
                                    jsxs(`div`, {
                                      className: `rounded-xl border border-[#2d2d2d] bg-[#151515] p-4 space-y-3 wanjuan-settings-subcard`,
                                      children: [
                                        jsx(`div`, {
                                          className: `text-sm font-bold text-gray-200`,
                                          children: `导入备份`,
                                        }),
                                        jsxs(`div`, {
                                          className: `rounded-lg border border-[#2a2a2a] bg-[#1b1b1b] px-3 py-3 text-sm text-gray-400 leading-6 wanjuan-settings-note`,
                                          children: [
                                            `无需提前勾选导入部分。选择备份文件后，软件会自动识别其中包含的`,
	                                            jsx(`strong`, {
	                                              className: `text-gray-200`,
	                                              children: `设置参数、画布项目、智能体配置`,
	                                            }),
                                            `，并在确认框中展示导入范围。`,
                                            jsx(`br`, {}),
                                            jsx(`span`, {
                                              className: `text-blue-400`,
                                              children: `• 设置参数：覆盖当前配置`,
                                            }),
                                            jsx(`br`, {}),
	                                            jsx(`span`, {
	                                              className: `text-green-400`,
	                                              children: `• 画布项目：新增或合并导入`,
	                                            }),
	                                            jsx(`br`, {}),
	                                            jsx(`span`, {
	                                              className: `text-purple-400`,
	                                              children: `• 智能体配置：新增或合并导入`,
	                                            }),
                                          ],
                                        }),
                                        jsxs(`button`, {
                                          type: `button`,
                                          onClick: handleBackupImportFile,
                                          className: `w-full flex items-center justify-center gap-2 text-sm bg-[#222] text-gray-300 border border-[#333] py-2.5 rounded-lg hover:bg-[#2a2a2a] hover:text-white hover:border-gray-500 transition-all text-center cursor-pointer wanjuan-settings-button wanjuan-settings-button-block`,
                                          children: [
                                            jsx(Download, {
                                              size: 16,
                                              className: `text-blue-400`,
                                            }),
                                            jsx(`span`, {
                                              className: `font-bold`,
                                              children: `选择并识别备份文件`,
                                            }),
		                              ],
		                            }),
		                          ],
		                        }),
		                      ],
		                    }),
		                    jsxs(`div`, {
		                      className: `mt-7 rounded-xl border border-red-500/30 bg-red-500/5 p-4 wanjuan-settings-subcard`,
		                      children: [
		                        jsxs(`div`, {
		                          className: `flex items-start gap-3`,
		                          children: [
		                            jsx(`div`, {
		                              className: `mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400`,
		                              children: jsx(ShieldAlert, { size: 17 }),
		                            }),
		                            jsxs(`div`, {
		                              className: `min-w-0 flex-1`,
		                              children: [
		                                jsx(`div`, {
		                                  className: `text-sm font-bold text-gray-200 wanjuan-settings-card-title`,
		                                  children: `卸载与本机数据`,
		                                }),
		                                jsx(`p`, {
		                                  className: `mt-1 text-xs leading-5 text-gray-500 wanjuan-settings-copy`,
		                                  children: `Windows 从系统卸载时会自动清除本机应用数据。macOS 直接把 App 拖进废纸篓无法触发清理，请先使用下方按钮。云端账号和下载目录中的导出文件不会被删除。`,
		                                }),
		                              ],
		                            }),
		                          ],
		                        }),
		                        jsxs(`button`, {
		                          type: `button`,
		                          onClick: handleRemoveLocalUserData,
		                          className: `mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 wanjuan-settings-button wanjuan-settings-button-block`,
		                          children: [
		                            jsx(Trash2, { size: 16 }),
		                            jsx(`span`, { children: `清除本机数据并退出` }),
		                          ],
		                        }),
		                      ],
		                    }),
			                                jsx(`div`, {
		                                  id: `wanjuan-project-safety-center`,
		                                  className: `overflow-hidden`,
		                                  style: {
		                                    marginTop: 28,
		                                    minHeight: 360
		                                  },
		                                  children: jsxs(`div`, {
		                                    className: `rounded-xl border border-[#3a414c] bg-[#242830] text-sm text-gray-400 wanjuan-settings-subcard overflow-hidden`,
		                                    style: {
		                                      minHeight: 360
		                                    },
		                                    children: [
		                                      jsxs(`div`, {
		                                        className: `flex items-center justify-between gap-4 border-b border-[#343b45] px-4 py-3 bg-[#252a32]`,
		                                        children: [
		                                          jsxs(`div`, {
		                                            children: [
		                                              jsx(`div`, {
		                                                className: `text-sm font-bold text-gray-200 wanjuan-settings-card-title`,
		                                                children: `备份中心`
		                                              }),
		                                              jsx(`div`, {
		                                                className: `mt-1 text-xs text-gray-500 wanjuan-settings-copy`,
		                                                children: `正在同步自动备份与安全快照`
		                                              })
		                                            ]
		                                          }),
		                                          jsx(`div`, {
		                                            className: `h-8 w-20 rounded-full border border-[#4b5563] bg-[#2c333d]`
		                                          })
		                                        ]
		                                      }),
		                                      jsxs(`div`, {
		                                        className: `p-4 space-y-3`,
		                                        children: [
		                                          jsx(`div`, {
		                                            className: `grid grid-cols-3 gap-3`,
		                                            children: [`当前节点`, `当前连线`, `安全快照`].map((props) => jsxs(`div`, {
		                                              className: `rounded-lg border border-[#333b46] bg-[#1f252d] p-3`,
		                                              children: [
		                                                jsx(`div`, {
		                                                  className: `text-[11px] text-gray-500`,
		                                                  children: props
		                                                }),
		                                                jsx(`div`, {
		                                                  className: `mt-2 h-5 w-12 rounded bg-[#303844]`
		                                                })
		                                              ]
		                                            }, props))
		                                          }),
		                                          jsx(`div`, {
		                                            className: `grid grid-cols-2 gap-3`,
		                                            children: [`当前使用项目备份时间`, `全项目备份时间`].map((props) => jsxs(`div`, {
		                                              className: `rounded-lg border border-[#333b46] bg-[#1f252d] p-3`,
		                                              children: [
		                                                jsx(`div`, {
		                                                  className: `text-[11px] text-gray-500`,
		                                                  children: props
		                                                }),
		                                                jsx(`div`, {
		                                                  className: `mt-2 h-8 rounded border border-[#3f4854] bg-[#242b34]`
		                                                })
		                                              ]
		                                            }, props))
		                                          }),
		                                          jsx(`div`, {
		                                            className: `space-y-2`,
		                                            children: [`备份地址`, `安全快照`].map((props) => jsxs(`div`, {
		                                              className: `flex items-center gap-2`,
		                                              children: [
		                                                jsx(`span`, {
		                                                  className: `w-[72px] text-[11px] text-gray-500`,
		                                                  children: props
		                                                }),
		                                                jsx(`div`, {
		                                                  className: `h-8 flex-1 rounded border border-[#333b46] bg-[#1f252d]`
		                                                })
		                                              ]
		                                            }, props))
		                                          }),
		                                          jsx(`div`, {
		                                            className: `grid gap-2`,
		                                            children: [0, 1, 2].map((props) => jsxs(`div`, {
		                                              className: `rounded-lg border border-[#333b46] bg-[#1f252d] px-3 py-2`,
		                                              children: [
		                                                jsx(`div`, {
		                                                  className: `h-4 w-1/3 rounded bg-[#303844]`
		                                                }),
		                                                jsx(`div`, {
		                                                  className: `mt-2 h-3 w-2/3 rounded bg-[#2b333d]`
		                                                })
		                                              ]
		                                            }, props))
		                                          })
		                                        ]
		                                      }),
		                                      jsxs(`div`, {
		                                        className: `flex items-center justify-between gap-3 border-t border-[#343b45] px-4 py-3 bg-[#252a32]`,
		                                        children: [
		                                          jsx(`div`, {
		                                            className: `h-3 w-64 max-w-[60%] rounded bg-[#303844]`
		                                          }),
		                                          jsx(`div`, {
		                                            className: `h-8 w-20 rounded-lg border border-[#4b5563] bg-[#2c333d]`
		                                          })
		                                        ]
		                                      })
		                                    ]
		                                  })
		                                }),
	                              ],
	                            }),
                          ],
                        }),
                      });
}
