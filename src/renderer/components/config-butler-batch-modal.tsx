/** 配置管家批量弹窗。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { configButlerCategoryOptions, normalizeModelCategory } from "../lib/config-butler";
declare const chrome: any;

export function WanJuanConfigButlerBatchModal({
  applyConfigButlerBatchResults,
  configButlerBatchActiveCategory,
  configButlerBatchItems,
  setConfigButlerBatchActiveCategory,
  setConfigButlerBatchItems,
  setConfigButlerBatchModalOpen,
}: any) {
  return jsx(`div`, {
				                            style: {
				                              position: `fixed`,
				                              top: -260,
				                              right: -260,
				                              bottom: -260,
				                              left: -260,
				                              zIndex: 2147483647,
				                              background: `#0b0c0e`,
				                              display: `flex`,
				                              alignItems: `flex-start`,
				                              justifyContent: `center`,
				                              padding: `346px 288px 288px`,
				                              boxSizing: `border-box`
				                            },
		                            children: jsxs(`div`, {
		                              className: `bg-[#181818] border border-[#333] rounded-xl shadow-2xl text-gray-200`,
		                              style: {
		                                width: `min(1080px, calc(100vw - 56px))`,
			                                maxHeight: `calc(100vh - 114px)`,
		                                display: `flex`,
		                                flexDirection: `column`,
		                                overflow: `hidden`
	                              },
	                              children: [
	                                jsxs(`div`, {
		                                  className: `flex items-center justify-between gap-4 p-4 border-b border-[#2a2a2a] bg-[#181818]`,
	                                  children: [
	                                    jsxs(`div`, {
	                                      children: [
	                                        jsx(`div`, {
	                                          className: `text-sm font-semibold text-gray-100`,
	                                          children: `全局批量模式识别结果`,
	                                        }),
	                                        jsx(`div`, {
	                                          className: `text-[11px] text-gray-500 mt-1`,
	                                          children: `确认分类、删除不需要的模型后再导入。`,
	                                        }),
	                                      ],
	                                    }),
	                                    jsx(`button`, {
	                                      type: `button`,
	                                      onClick: () => setConfigButlerBatchModalOpen(false),
	                                      className: `px-3 py-1.5 rounded-lg bg-[#222] text-xs text-gray-300 hover:bg-[#2a2a2a] transition-colors`,
	                                      children: `关闭`,
	                                    }),
	                                  ],
	                                }),
		                                jsxs(`div`, {
		                                  className: `flex flex-1 min-h-0`,
		                                  style: {
		                                    minHeight: 420
		                                  },
		                                  children: [
		                                    jsxs(`div`, {
			                                      className: `w-44 shrink-0 border-r border-[#2a2a2a] bg-[#141414] p-3`,
		                                      children: [
		                                        jsx(`div`, {
		                                          className: `text-[11px] text-gray-500 mb-3`,
		                                          children: `设置菜单`,
		                                        }),
		                                        jsx(`div`, {
		                                          className: `space-y-2`,
		                                          children: configButlerCategoryOptions.map((category) => {
		                                            let filteredItems = configButlerBatchItems.filter(
		                                              (item) => normalizeModelCategory(item.category) === category.value,
		                                            ).length;
		                                            return jsxs(
		                                              `button`, {
		                                                type: `button`,
		                                                onClick: () => setConfigButlerBatchActiveCategory(category.value),
		                                                className: `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${configButlerBatchActiveCategory === category.value ? `bg-blue-600 text-white` : `bg-[#1d1d1d] text-gray-400 hover:bg-[#252525] hover:text-gray-200`}`,
		                                                children: [
		                                                  jsx(`span`, {
		                                                    className: `truncate`,
		                                                    children: category.label.replace(`模型`, ``),
		                                                  }),
		                                                  jsx(`span`, {
		                                                    className: `text-[10px] opacity-70`,
		                                                    children: filteredItems,
		                                                  }),
		                                                ],
		                                              },
		                                              category.value,
		                                            );
		                                          }),
		                                        }),
		                                      ],
		                                    }),
		                                    jsxs(`div`, {
			                                      className: `flex-1 min-w-0 flex flex-col bg-[#181818]`,
		                                      children: [
		                                        jsxs(`div`, {
		                                          className: `flex items-center justify-between gap-3 px-4 py-3 border-b border-[#2a2a2a] bg-[#1b1b1b]`,
		                                          children: [
		                                            jsx(`div`, {
		                                              className: `text-sm font-semibold text-gray-100`,
	                            children: `模型分类`,
		                                            }),
		                                            jsx(`div`, {
		                                              className: `text-[11px] text-gray-500`,
		                                              children: `${(configButlerCategoryOptions.find((category) => category.value === configButlerBatchActiveCategory) || configButlerCategoryOptions[0]).label} · ${configButlerBatchItems.filter((item) => normalizeModelCategory(item.category) === configButlerBatchActiveCategory).length} 个`,
		                                            }),
		                                          ],
		                                        }),
		                                        jsx(`div`, {
		                                          className: `flex-1 overflow-y-auto p-4`,
		                                          children: (() => {
		                                            let filteredItems = configButlerBatchItems.filter(
		                                              (item) => normalizeModelCategory(item.category) === configButlerBatchActiveCategory,
		                                            );
		                                            return filteredItems.length ?
		                                              jsx(`div`, {
		                                                className: `border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#121212]`,
		                                                children: jsx(`div`, {
		                                                  className: `divide-y divide-[#242424]`,
		                                                  children: filteredItems.map((item) =>
		                                                    jsxs(
		                                                      `div`, {
		                                                        className: `flex flex-col md:flex-row gap-2 md:items-center px-3 py-2`,
		                                                        children: [
		                                                          jsxs(`div`, {
		                                                            className: `flex-1 min-w-0`,
		                                                            children: [
		                                                              jsx(`div`, {
		                                                                className: `text-xs text-gray-200 truncate`,
		                                                                title: item.modelName,
		                                                                children: item.modelName,
		                                                              }),
		                                                              item.notes &&
		                                                              jsx(`div`, {
		                                                                className: `text-[10px] text-gray-500 truncate mt-0.5`,
		                                                                title: item.notes,
		                                                                children: item.notes,
		                                                              }),
		                                                            ],
		                                                          }),
		                                                          jsxs(`select`, {
		                                                            className: `w-full md:w-44 bg-[#1a1a1a] border border-[#333] text-gray-300 text-xs px-2 py-1.5 rounded-lg outline-none focus:border-blue-500 hover:bg-[#222] transition-colors`,
		                                                            value: item.category,
		                                                            onChange: (event) => {
		                                                              let value = event.target.value;
		                                                              (setConfigButlerBatchItems((items) =>
		                                                                  items.map((item2) =>
		                                                                    item2.id === item.id ?
		                                                                    {
		                                                                      ...item2,
		                                                                      category: value
		                                                                    } :
		                                                                    item2,
		                                                                  ),
		                                                                ),
		                                                                setConfigButlerBatchActiveCategory(value));
		                                                            },
		                                                            children: configButlerCategoryOptions.map((props) =>
		                                                              jsx(
		                                                                `option`, {
		                                                                  value: props.value,
		                                                                  children: props.label,
		                                                                },
		                                                                props.value,
		                                                              ),
		                                                            ),
		                                                          }),
		                                                          jsx(`button`, {
		                                                            type: `button`,
		                                                            onClick: () =>
		                                                              setConfigButlerBatchItems((items) =>
		                                                                items.filter((item2) => item2.id !== item.id),
		                                                              ),
		                                                            className: `px-3 py-1.5 rounded-lg border border-[#3a2a2a] text-xs text-red-300 hover:bg-[#2a1717] transition-colors`,
		                                                            children: `删除`,
		                                                          }),
		                                                        ],
		                                                      },
		                                                      item.id,
		                                                    ),
		                                                  ),
		                                                }),
		                                              }) :
		                                              jsx(`div`, {
		                                                className: `h-full min-h-[260px] flex items-center justify-center rounded-lg border border-dashed border-[#333] text-xs text-gray-600`,
		                                                children: `这个分类下暂无模型`,
		                                              });
		                                          })(),
		                                        }),
		                                      ],
		                                    }),
		                                  ],
		                                }),
	                                jsxs(`div`, {
	                                  className: `flex items-center justify-between gap-3 p-4 border-t border-[#2a2a2a] bg-[#151515]`,
	                                  children: [
	                                    jsx(`div`, {
	                                      className: `text-[11px] text-gray-500`,
	                                      children: `当前将保存为新全局配置：${configButlerBatchItems.length} 个模型`,
	                                    }),
	                                    jsxs(`div`, {
	                                      className: `flex items-center gap-2`,
	                                      children: [
	                                        jsx(`button`, {
	                                          type: `button`,
	                                          onClick: () => setConfigButlerBatchModalOpen(false),
	                                          className: `px-4 py-2 rounded-lg bg-[#222] text-xs text-gray-300 hover:bg-[#2a2a2a] transition-colors`,
	                                          children: `取消`,
	                                        }),
	                                        jsx(`button`, {
	                                          type: `button`,
	                                          onClick: applyConfigButlerBatchResults,
	                                          disabled: !configButlerBatchItems.length,
	                                          className: `px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors`,
		                                          children: `保存并切换`,
	                                        }),
	                                      ],
	                                    }),
	                                  ],
	                                }),
	                              ],
	                            }),
	                          });
}
