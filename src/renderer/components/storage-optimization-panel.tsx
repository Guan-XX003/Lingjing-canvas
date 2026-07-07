/**
 * 存储优化设置面板：扫描/清理/迁移/回收站管理/暂停开关。
 * 自 WanJuanAppRoot 抽出为子组件，依赖通过 props 传入，行为不变。
 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanStorageOptimizationPanel({
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
}: any) {
  return jsxs(`div`, {
          className: `mx-4 mt-4 rounded-xl border border-[#3a414c] bg-[#171a1f] p-4 space-y-4 wanjuan-settings-subcard wanjuan-storage-optimization-card`,
          children: [
            jsxs(`div`, {
              className: `flex items-start justify-between gap-4`,
              children: [
                jsxs(`div`, {
                  children: [
                    jsx(`div`, {
                      className: `text-sm font-bold text-gray-100`,
                      children: `存储优化`,
                    }),
                    jsx(`div`, {
                      className: `mt-1 text-xs text-gray-500`,
                      children: storageOptimizationEnabled ? storageOptimizationPaused ? `已暂停自动迁移` : globalThis.__wanjuanStorageMigrationRunning ? `正在迁移项目` : `已启用，等待空闲迁移` : `未启用，现有存储行为保持不变`,
                    }),
                  ],
                }),
                !storageOptimizationEnabled ?
                jsx(`button`, {
                  onClick: enableStorageOptimization,
                  className: `rounded-lg border border-blue-500/50 bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500`,
                  children: `启用存储优化`,
                }) :
                jsx(`button`, {
                  onClick: () => {
                    let next = !storageOptimizationPaused;
                    (setStorageOptimizationPaused(next),
                      chrome.storage.local.set({
                        storageOptimizationPaused: next
                      }),
                      setStorageOptimizationLastResult(next ? `已暂停自动迁移` : `已继续自动迁移`));
                  },
                  className: `rounded-lg border border-[#444] bg-[#252a31] px-3 py-2 text-xs text-gray-200 hover:border-blue-500`,
                  children: storageOptimizationPaused ? `继续自动迁移` : `暂停自动迁移`,
                }),
              ],
            }),
            jsxs(`div`, {
              className: `grid grid-cols-2 md:grid-cols-4 gap-2`,
              children: [
                [`媒体池占用`, formatStorageBytes(storageOptimizationStatus?.blobBytes)],
                [`媒体文件`, `${storageOptimizationStatus?.blobCount || 0} 个`],
                [`回收区`, formatStorageBytes(storageOptimizationStatus?.trashBytes)],
                [`已优化项目`, `${projects.filter((project) => project.storageStatus === `optimized`).length}/${projects.length}`],
              ].map((item) => jsxs(`div`, {
                className: `rounded-lg border border-[#303640] bg-[#20242a] p-3`,
                children: [
                  jsx(`div`, {
                    className: `text-[10px] text-gray-500`,
                    children: item[0],
                  }),
                  jsx(`div`, {
                    className: `mt-1 text-xs font-semibold text-gray-200`,
                    children: item[1],
                  }),
                ],
              }, item[0])),
            }),
            jsx(`div`, {
              className: `truncate text-[11px] text-gray-500`,
              title: storageOptimizationStatus?.libraryPath || downloadDirectory,
              children: `媒体库：${storageOptimizationStatus?.libraryPath || downloadDirectory || `默认下载目录`}`,
            }),
            jsx(`div`, {
              className: `text-[11px] text-gray-400`,
              children: storageOptimizationLastResult || `尚无迁移、扫描或恢复记录`,
            }),
            jsxs(`div`, {
              className: `flex flex-wrap gap-2`,
              children: [
                jsx(`button`, {
                  onClick: () => runNextStorageMigration(false),
                  disabled: !storageOptimizationEnabled || storageOptimizationBusy,
                  className: `rounded-lg border border-[#444] px-3 py-1.5 text-xs text-gray-200 hover:border-blue-500 disabled:opacity-40`,
                  children: `立即处理下一个项目`,
                }),
                jsx(`button`, {
                  onClick: scanStorageOptimization,
                  disabled: storageOptimizationBusy,
                  className: `rounded-lg border border-[#444] px-3 py-1.5 text-xs text-gray-200 hover:border-blue-500 disabled:opacity-40`,
                  children: `扫描可释放空间`,
                }),
                jsx(`button`, {
                  onClick: cleanStorageOptimization,
                  disabled: !storageOptimizationEnabled || storageOptimizationBusy,
                  className: `rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/10 disabled:opacity-40`,
                  children: `清理未引用媒体`,
                }),
                jsx(`button`, {
                  onClick: manageStorageOptimizationTrash,
                  className: `rounded-lg border border-[#444] px-3 py-1.5 text-xs text-gray-200 hover:border-green-500`,
                  children: `管理回收区`,
                }),
                jsx(`button`, {
                  onClick: restoreStorageOptimizationTrash,
                  className: `rounded-lg border border-[#444] px-3 py-1.5 text-xs text-gray-200 hover:border-green-500`,
                  children: `恢复回收区`,
                }),
                jsx(`button`, {
                  onClick: purgeStorageOptimizationTrash,
                  className: `wanjuan-danger-text-action rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10`,
                  children: `永久删除过期文件`,
                }),
                jsx(`button`, {
                  onClick: refreshStorageOptimizationStatus,
                  className: `rounded-lg border border-[#444] px-3 py-1.5 text-xs text-gray-400 hover:text-white`,
                  children: `刷新状态`,
                }),
                jsx(`button`, {
                  onClick: showStorageOptimizationDetails,
                  className: `rounded-lg border border-[#444] px-3 py-1.5 text-xs text-gray-400 hover:text-white`,
                  children: `查看详细记录`,
                }),
              ],
            }),
          ],
        });
}
