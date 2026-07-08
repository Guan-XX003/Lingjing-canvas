/** WanJuanSettingsSectionC：自 WanJuanAppRoot render 抽出的 JSX 段，props 传入，行为不变。 */
import { jsx, jsxs, Fragment } from "react/jsx-runtime";

export function WanJuanSettingsSectionC(props: any) {
  const {
    Copy,
    Download,
    FolderOpen,
    Maximize2,
    Star,
    Trash,
    activeView,
    chrome,
    copyResource,
    currentPage,
    filteredTransitResources,
    handleCleanInvalidResources,
    handleClearUnfavorited,
    handleRemoveTransitResource,
    isPluginEnv,
    resourceCleanupBusy,
    resourceFavoriteOnly,
    resourceSourceFilter,
    resourceTypeFilter,
    setCurrentPage,
    setResourceFavoriteOnly,
    setResourceSourceFilter,
    setResourceTypeFilter,
    setTransitGridCols,
    setWjResourceFullscreen,
    showToast2,
    toggleFavorite,
    transitGridCols,
    transitResourcePageSize,
    transitResourceTotalPages,
    transitResources,
    wanjuanUseBrokenResourceImage,
  } = props;
  return jsxs(`div`, {
              className: `absolute inset-0 flex flex-col bg-[#121212] ${activeView === `transit` ? `visible z-10` : `invisible -z-10`}`,
              children: [
                jsxs(`div`, {
                  className: `wanjuan-resource-toolbar p-3 bg-[#1c1c1c] border-b border-[#333] flex justify-between items-center shadow-sm gap-4`,
                  children: [
                    jsxs(`div`, {
                      className: `flex bg-[#121212] rounded-lg p-1 border border-[#333] wanjuan-resource-filter-group`,
                      children: [
                        jsx(`button`, {
                          className: `px-4 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceTypeFilter === `all` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
                          onClick: () => {
                            (setResourceTypeFilter(`all`), setCurrentPage(1));
                          },
                          children: wanjuanT(`全部`),
                        }),
                        jsx(`button`, {
                          className: `px-4 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceTypeFilter === `image` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
                          onClick: () => {
                            (setResourceTypeFilter(`image`), setCurrentPage(1));
                          },
                          children: wanjuanT(`图片`),
                        }),
                        jsx(`button`, {
                          className: `px-4 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceTypeFilter === `video` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
                          onClick: () => {
                            (setResourceTypeFilter(`video`), setCurrentPage(1));
                          },
                          children: wanjuanT(`视频`),
                        }),
                        jsx(`button`, {
                          className: `px-4 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceTypeFilter === `audio` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
                          onClick: () => {
                            (setResourceTypeFilter(`audio`), setCurrentPage(1));
                          },
                          children: wanjuanT(`音频`),
                        }),
                        jsx(`button`, {
                          className: `px-4 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceTypeFilter === `text` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
                          onClick: () => {
                            (setResourceTypeFilter(`text`), setCurrentPage(1));
                          },
                          children: wanjuanT(`文本`),
                        }),
                      ],
                    }),
	                    jsxs(`div`, {
	                      className: `flex items-center gap-2 flex-1 justify-center max-w-md mx-auto`,
	                      children: [
	                        jsxs(`div`, {
	                          className: `flex bg-[#121212] rounded-lg p-1 border border-[#333] flex-1 wanjuan-resource-filter-group`,
	                          children: [
	                            jsx(`button`, {
	                              className: `flex-1 px-3 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceSourceFilter === `all` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
	                              onClick: () => {
	                                (setResourceSourceFilter(`all`), setCurrentPage(1));
	                              },
	                              children: wanjuanT(`全部来源`),
	                            }),
	                            jsx(`button`, {
	                              className: `flex-1 px-3 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceSourceFilter === `generated` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
	                              onClick: () => {
	                                (setResourceSourceFilter(`generated`), setCurrentPage(1));
	                              },
	                              children: wanjuanT(`AI生成`),
	                            }),
	                            jsx(`button`, {
	                              className: `flex-1 px-3 py-1 text-xs rounded-md transition-colors wanjuan-resource-filter-button ${resourceSourceFilter === `external` ? `bg-[#e5e5e5] text-black font-bold wanjuan-resource-filter-button-active` : `text-gray-400 hover:text-gray-200`}`,
	                              onClick: () => {
	                                (setResourceSourceFilter(`external`), setCurrentPage(1));
	                              },
	                              children: wanjuanT(`外部素材`),
	                            }),
	                          ],
	                        }),
	                        jsx(`button`, {
	                          "aria-pressed": resourceFavoriteOnly,
	                          "data-active": resourceFavoriteOnly ? `true` : undefined,
	                          className: `wanjuan-resource-favorite-filter w-8 h-8 rounded-lg transition-colors inline-flex items-center justify-center text-sm ${resourceFavoriteOnly ? `wanjuan-resource-favorite-filter-active` : ``}`,
	                          title: resourceFavoriteOnly ? wanjuanT(`显示全部收藏筛选`) : wanjuanT(`只看收藏`),
	                          onClick: () => {
	                            (setResourceFavoriteOnly((prev) => !prev), setCurrentPage(1));
	                          },
	                          children: resourceFavoriteOnly ? `★` : `☆`,
	                        }),
	                      ],
	                    }),
                    jsxs(`div`, {
                      className: `flex items-center gap-4`,
                      children: [
                        jsxs(`div`, {
                          className: `flex items-center gap-2 hidden md:flex`,
                          children: [
                            jsx(`span`, {
                              className: `text-xs text-gray-500`,
                              children: wanjuanT(`显示大小`),
                            }),
                            jsx(`input`, {
                              type: `range`,
                              min: `2`,
                              max: `8`,
                              step: `1`,
                              value: transitGridCols,
                              onChange: (event) => {
                                let gridCols = parseInt(event.target.value);
                                (setTransitGridCols(gridCols),
                                  isPluginEnv &&
                                  chrome.storage.local.set({
                                    transitGridCols: gridCols,
                                  }));
                              },
                              className: `w-24 accent-white bg-gray-600 h-1.5 rounded-lg appearance-none cursor-pointer`,
                            }),
                          ],
                        }),
                        jsxs(`button`, {
                          onClick: () => {
                            typeof chrome < `u` && chrome.downloads ?
                              chrome.downloads.showDefaultFolder() :
                              showToast2(`当前环境不支持打开下载目录`);
                          },
                          className: `flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#333] border border-[#333] rounded px-3 py-1.5 text-gray-300 hover:text-white transition-colors`,
                          title: wanjuanT(`打开下载目录`),
                          children: [
                            jsx(FolderOpen, {
                              size: 14
                            }),
                            jsx(`span`, {
                              className: `text-xs`,
                              children: wanjuanT(`下载目录`),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                jsxs(`div`, {
                  className: `wanjuan-resource-main flex-1 overflow-y-auto p-3 flex flex-col`,
                  children: [
                    transitResources.length === 0 &&
                    jsxs(`div`, {
                      className: `wanjuan-resource-empty text-center text-gray-500 py-20 text-sm flex flex-col items-center`,
                      children: [
                        jsx(`div`, {
                          className: `text-4xl mb-3 opacity-50`,
                          children: `📦`,
                        }),
                        jsx(`p`, {
                          children: wanjuanT(`暂无资源`)
                        }),
                        jsxs(`p`, {
                          className: `text-xs mt-2 text-gray-600`,
                          children: [
                            `在网页图片/视频上点击右键`,
                            jsx(`br`, {}),
                            `选择"发送到资源"`,
                          ],
                        }),
                      ],
                    }),
                    transitResources.length > 0 &&
                    filteredTransitResources.length === 0 &&
                    jsxs(`div`, {
                      className: `wanjuan-resource-empty-filter text-center text-gray-500 py-20 text-sm flex flex-col items-center`,
                      children: [
                        jsx(`div`, {
                          className: `text-3xl mb-3 opacity-40`,
                          children: `⌕`,
                        }),
                        jsx(`p`, {
                          children: wanjuanT(`当前筛选没有资源`)
                        }),
                        jsx(`p`, {
                          className: `text-xs mt-2 text-gray-600`,
                          children: `可以切换类型、来源或取消收藏筛选`,
                        }),
                      ],
                    }),
                    jsx(`div`, {
                      className: `wanjuan-resource-grid grid gap-3 flex-1 content-start`,
                      style: {
                        gridTemplateColumns: `repeat(${transitGridCols}, minmax(0, 1fr))`,
                      },
                      children: filteredTransitResources
                        .slice((currentPage - 1) * transitResourcePageSize, currentPage * transitResourcePageSize)
                        .map((resource) =>
                          jsxs(
                            `div`, {
                              className: `wanjuan-resource-card bg-[#1c1c1c] rounded-lg border border-[#333] shadow-sm overflow-hidden group relative flex flex-col aspect-square hover:border-gray-500 transition-colors`,
                              children: [
                                jsxs(`div`, {
                                  className: `wanjuan-resource-card-preview flex-1 bg-[#121212] relative flex items-center justify-center overflow-hidden`,
                                  children: [
                                    resource.type.startsWith(`video`) ?
                                    jsx(`video`, {
                                      src: resource.url,
                                      className: `w-full h-full object-contain`,
                                      controls: true,
                                    }) :
                                    resource.type.startsWith(`audio`) ?
                                    jsxs(`div`, {
                                      className: `wanjuan-resource-audio-preview w-full h-full flex flex-col items-center justify-center gap-3 p-4`,
                                      children: [
                                        jsx(`div`, {
                                          className: `wanjuan-resource-audio-icon`,
                                          children: `♪`,
                                        }),
                                        jsx(`div`, {
                                          className: `text-xs text-gray-400 max-w-full truncate`,
                                          title: resource.pageTitle || `音频资源`,
                                          children: resource.pageTitle || `音频资源`,
                                        }),
                                        jsx(`audio`, {
                                          src: resource.url,
                                          controls: true,
                                          className: `w-full`,
                                        }),
                                      ],
                                    }) :
                                    resource.type === `text` ?
                                    jsx(`div`, {
                                      className: `p-2 text-xs text-gray-400 overflow-y-auto w-full h-full break-all bg-[#1a1a1a]`,
                                      children: resource.url,
                                    }) :
                                    jsx(`img`, {
                                      src: resource.thumbnailUrl || resource.url,
                                      className: `w-full h-full object-cover cursor-grab active:cursor-grabbing`,
                                      onError: wanjuanUseBrokenResourceImage,
                                      draggable: `true`,
                                      onDragStart: (event) => {
                                        (event.dataTransfer.setData(
                                            `text/plain`,
                                            resource.url,
                                          ),
                                          event.dataTransfer.setData(
                                            `text/html`,
                                            `<img src="${resource.url}" />`,
                                          ));
                                      },
                                    }),
                                    jsxs(`div`, {
                                      className: `wanjuan-resource-card-actions absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1 shadow-md`,
                                      children: [
                                        !resource.type.startsWith(`text`) &&
                                        !resource.type.startsWith(`audio`) &&
                                        jsx(`button`, {
                                          onClick: (event) => {
                                            (event.stopPropagation(), setWjResourceFullscreen(resource));
                                          },
                                          className: `p-1.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded`,
                                          title: resource.type.startsWith(`video`) ? `全屏播放` : `全屏查看`,
                                          children: jsx(Maximize2, {
                                            size: 14,
                                          }),
                                        }),
                                        !resource.type.startsWith(`text`) &&
                                        jsx(`button`, {
                                          onClick: (event) => {
                                            event.stopPropagation();
                                            let mediaType = resource.type.startsWith(`video`) ?
                                              `video-${Date.now()}.mp4` :
                                              resource.type.startsWith(`audio`) ?
                                              `audio-${Date.now()}.${resource.type.includes(`wav`) ? `wav` : resource.type.includes(`ogg`) ? `ogg` : resource.type.includes(`mp4`) ? `m4a` : `mp3`}` :
                                              `image-${Date.now()}.png`;
                                            typeof chrome < `u` &&
                                              chrome.downloads ?
                                              (showToast2(`开始下载...`),
                                                chrome.downloads.download({
                                                    url: resource.url,
                                                    filename: mediaType,
                                                    mime: resource.type,
                                                  },
                                                  () => showToast2(`已保存到下载目录`),
                                                )) :
                                              showToast2(`当前环境不支持直接下载`);
                                          },
                                          className: `p-1.5 text-gray-700 hover:text-black hover:bg-gray-200 rounded`,
                                          title: `下载`,
                                          children: jsx(Download, {
                                            size: 14,
                                          }),
                                        }),
                                        jsx(`button`, {
                                          onClick: () => copyResource(resource),
                                          className: `p-1.5 text-gray-700 hover:text-black hover:bg-gray-200 rounded`,
                                          title: `复制`,
                                          children: jsx(Copy, {
                                            size: 14,
                                          }),
                                        }),
                                        jsx(`button`, {
                                          onClick: () => handleRemoveTransitResource(resource.id),
                                          className: `wanjuan-danger-icon-action p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded`,
                                          title: `删除`,
                                          children: jsx(Trash, {
                                            size: 14,
                                          }),
                                        }),
                                        jsx(`button`, {
                                          onClick: (event) => {
                                            (event.stopPropagation(), toggleFavorite(resource.id));
                                          },
                                          className: `wanjuan-resource-card-favorite p-1.5 rounded transition-colors ${resource.isFavorite ? `wanjuan-resource-card-favorite-active` : ``}`,
                                          title: resource.isFavorite ?
                                            `取消收藏` :
                                            `收藏`,
                                          children: jsx(Star, {
                                            size: 14,
                                            fill: resource.isFavorite ?
                                              `currentColor` :
                                              `none`,
                                          }),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                jsxs(`div`, {
                                  className: `wanjuan-resource-card-footer h-8 p-1.5 bg-[#1c1c1c] border-t border-[#333] flex items-center justify-between text-[10px] text-gray-500`,
                                  children: [
                                    jsx(`div`, {
                                      className: `truncate flex-1 mr-2`,
                                      title: resource.pageTitle,
                                      children: resource.type === `text` ?
                                        `📝 文本片段` :
                                        resource.type.startsWith(`audio`) ?
                                        `🎧 ${resource.pageTitle || `音频资源`}` :
                                        resource.pageTitle,
                                    }),
                                    jsxs(`div`, {
                                      className: `text-gray-600 flex-shrink-0`,
                                      children: [
                                        new Date(resource.timestamp).getHours(),
                                        `:`,
                                        new Date(resource.timestamp)
                                        .getMinutes()
                                        .toString()
                                        .padStart(2, `0`),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            },
                            resource.id,
                          ),
                        ),
                    }),
                    jsxs(`div`, {
                      className: `wanjuan-resource-footer flex justify-between items-center mt-4 pt-4 border-t border-[#333]`,
                      children: [
                        jsxs(`div`, {
	                          className: `text-sm font-bold text-gray-200`,
	                          children: [wanjuanT(`资源`), ` (`, filteredTransitResources.length, `)`],
                        }),
                        (() => {
	                          let totalPages = transitResourceTotalPages;
                          return totalPages <= 1 ?
                            jsx(`div`, {
                              className: `flex-1`
                            }) :
                            jsxs(`div`, {
                              className: `flex justify-center items-center gap-4 flex-1`,
                              children: [
                                jsx(`button`, {
                                  disabled: currentPage === 1,
                                  onClick: () =>
                                    setCurrentPage((prev) => Math.max(1, prev - 1)),
                                  className: `px-3 py-1 bg-[#2a2a2a] text-gray-300 rounded text-xs hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed`,
                                  children: `上一页`,
                                }),
                                jsxs(`span`, {
                                  className: `text-xs text-gray-500`,
                                  children: [currentPage, ` / `, totalPages],
                                }),
                                jsx(`button`, {
                                  disabled: currentPage === totalPages,
                                  onClick: () =>
                                    setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
                                  className: `px-3 py-1 bg-[#2a2a2a] text-gray-300 rounded text-xs hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed`,
                                  children: `下一页`,
                                }),
                              ],
                            });
                        })(),
                        jsxs(`div`, {
                          className: `flex items-center gap-2`,
                          children: [
                            jsxs(`button`, {
                              onClick: handleCleanInvalidResources,
                              disabled: resourceCleanupBusy,
                              className: `wanjuan-danger-text-action text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/40 whitespace-nowrap flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait`,
                              children: [
                                jsx(Trash, {
                                  size: 12
                                }),
                                resourceCleanupBusy ? wanjuanT(`检查中...`) : wanjuanT(`清理失效素材`),
                              ],
                            }),
                            jsxs(`button`, {
                              onClick: handleClearUnfavorited,
                              className: `wanjuan-danger-text-action text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded hover:bg-[#333] transition-colors border border-transparent hover:border-red-900/50 whitespace-nowrap flex items-center gap-1`,
                              children: [
                                jsx(Trash, {
                                  size: 12
                                }),
                                wanjuanT(`清空全部`),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            });
}
