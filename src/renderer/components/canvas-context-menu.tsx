/** 画布右键上下文菜单（menuPosition）：节点/选区/资源子菜单等全部操作。自 WanJuanAppCanvas 抽出，props 传入，行为不变。 */
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Copy, ImageIcon, LayoutGrid, Link2, ListPlus, Mic, MonitorPlay, Puzzle, Trash2, Type, Upload } from "lucide-react";
import { TongyiWanxiangLogo } from "./icons";
import { WanJuanResourcePicker } from "./resource-picker";
import { wanjuanResourceKind } from "../lib/resource";
import { wanjuanCollectNodeReferenceMedia } from "../lib/reference-media";
declare const chrome: any;

export function WanJuanCanvasContextMenu({
  addGridSplitNode,
  contextToolGroupsOpen,
  copyNodeImage,
  copySelectedNodes,
  createNodeAt,
  customNodeTemplates,
  deleteCustomNode,
  fileInputRef,
  groupSelectedNodes,
  handleCopySelected,
  handleDeleteSelected,
  isResourceSubmenuOpen,
  layeredRunDownstream,
  menuPosition,
  nodes,
  resources,
  runNodeChain,
  screenToFlowPosition,
  setContextToolGroupsOpen,
  setMenuPosition,
  setMultiConnectIds,
  setResourceSubmenuOpen,
  setResourceSubmenuOpenAlt,
  showToast,
  ungroupNode,
  wrapperRef,
}: any) {
  return jsx(`div`, {
              style: menuPosition.menuOrigin === `bottom` ? {
                left: menuPosition.x,
                bottom: menuPosition.menuBottom
              } : {
                top: menuPosition.y,
                left: menuPosition.x
              },
              className: `absolute z-50 bg-[#2a2a2a] border border-[#333] rounded-lg shadow-xl p-1 flex flex-col min-w-[140px] wanjuan-context-menu`,
              "data-wanjuan-context-menu": `true`,
              onClick: (event) => event.stopPropagation(),
              children: menuPosition.type === `canvas` || menuPosition.type === `connection` ?
                jsxs(Fragment, {
                  children: [
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `textNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {
                            text: ``
                          },
                          menuPosition.connection,
                        ),
                      children: [
                        jsx(Type, {
                          size: 16,
                          className: `text-green-500`,
                        }),
	                        jsx(`span`, {
	                          children: `文本节点`
	                        }),
	                        jsx(`span`, {
	                          className: `wanjuan-context-shortcut`,
	                          children: `⌘T`
	                        }),
	                      ],
	                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `promptNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {
                            prompt: ``
                          },
                          menuPosition.connection,
                        ),
                      children: [
                        jsx(ImageIcon, {
                          size: 16,
                          className: `text-blue-400`,
                        }),
	                        jsx(`span`, {
	                          children: `生图节点`
	                        }),
	                        jsx(`span`, {
	                          className: `wanjuan-context-shortcut`,
	                          children: `⌘I`
	                        }),
	                      ],
	                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `videoNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {
                            prompt: ``
                          },
                          menuPosition.connection,
                        ),
                      children: [
                        jsx(MonitorPlay, {
                          size: 16,
                          className: `text-purple-400`,
                        }),
	                        jsx(`span`, {
	                          children: `视频节点`
	                        }),
	                        jsx(`span`, {
	                          className: `wanjuan-context-shortcut`,
	                          children: `⌘V`
	                        }),
	                      ],
	                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `seedanceNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {
                            prompt: ``
                          },
                          menuPosition.connection,
                        ),
                      children: [
                        jsx(`svg`, {
                          xmlns: `http://www.w3.org/2000/svg`,
                          width: `16`,
                          height: `16`,
                          viewBox: `0 0 24 24`,
                          fill: `currentColor`,
                          className: `text-blue-500 flex-shrink-0`,
                          children: jsx(`path`, {
                            d: `M12 2.8l2.75 6.45L21.2 12l-6.45 2.75L12 21.2l-2.75-6.45L2.8 12l6.45-2.75L12 2.8z`,
                          }),
                        }),
	                        jsx(`span`, {
	                          children: `即梦节点`,
	                        }),
	                        jsx(`span`, {
	                          className: `wanjuan-context-shortcut`,
	                          children: `⌘J`
	                        }),
	                      ],
	                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `tongyiWanxiangNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {
                            prompt: ``
                          },
                          menuPosition.connection,
                        ),
                      children: [
                        jsx(TongyiWanxiangLogo, {
                          size: 16,
                          className: `text-purple-500 flex-shrink-0`,
                        }),
	                        jsx(`span`, {
	                          children: `通义万相`,
	                        }),
	                        jsx(`span`, {
	                          className: `wanjuan-context-shortcut`,
	                          children: `⌘W`
	                        }),
	                      ],
	                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `audioNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {},
                          menuPosition.connection,
                        ),
                      children: [
                        jsx(Mic, {
                          size: 16,
                          className: `text-yellow-500`,
                        }),
                        jsx(`span`, {
                          children: `音频节点`
                        }),
                      ],
                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `musicNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {
                            mode: `suno`,
                            nodeKind: `music`,
                            prompt: ``,
                          },
                          menuPosition.connection,
                        ),
                      children: [
	                        jsx(`span`, {
	                          className: `text-orange-400 text-base leading-none flex items-center justify-center`,
	                          style: {
	                            width: 16,
	                            height: 16,
	                            flex: `0 0 16px`
	                          },
	                          children: `♫`
	                        }),
                        jsx(`span`, {
                          children: `音乐节点`
                        }),
                      ],
                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () =>
                        createNodeAt(
                          `customNode`,
                          screenToFlowPosition({
                            x: menuPosition.x +
                              (wrapperRef.current?.getBoundingClientRect().left ||
                                0),
                            y: menuPosition.y +
                              (wrapperRef.current?.getBoundingClientRect().top ||
                                0),
                          }), {},
                          menuPosition.connection,
                        ),
                      children: [
                        jsx(Puzzle, {
                          size: 16,
                          className: `text-pink-400`,
                        }),
                        jsx(`span`, {
                          children: `万能节点`
                        }),
                      ],
                    }),
                    customNodeTemplates &&
                    customNodeTemplates.length > 0 &&
                    jsxs(`div`, {
                      className: `relative group/custom`,
                      children: [
                        jsx(`button`, {
                          className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item justify-between`,
                          onClick: (event) => event.stopPropagation(),
                          children: jsxs(`span`, {
                            className: `flex items-center gap-2`,
                            children: [
                              jsx(Puzzle, {
                                size: 16,
                                className: `text-pink-400`,
                              }),
                              jsx(`span`, {
                                children: `自定义 >`,
                              }),
                            ],
                          }),
                        }),
                        jsx(`div`, {
                          className: `absolute left-full top-0 ml-1 bg-[#2a2a2a] border border-[#333] rounded-lg shadow-xl p-1 min-w-[140px] hidden group-hover/custom:block z-50 before:content-[''] before:absolute before:-left-4 before:top-0 before:w-4 before:h-full wanjuan-context-submenu`,
                          children: customNodeTemplates.map((item) =>
                            jsxs(
                              `div`, {
                                className: `group/item flex items-center justify-between hover:bg-[#333] rounded wanjuan-context-menu-row`,
                                children: [
                                  jsx(`button`, {
                                    className: `text-left px-3 py-2 text-sm text-gray-300 hover:text-white flex-1 wanjuan-context-menu-item-plain`,
                                    onClick: (event) => {
                                      event.stopPropagation();
                                      let variables = item.config?.variables || {};
                                      (createNodeAt(
                                          `customNode`,
                                          screenToFlowPosition({
                                            x: menuPosition.x +
                                              (wrapperRef.current?.getBoundingClientRect()
                                                .left || 0) +
                                              150,
                                            y: menuPosition.y +
                                              (wrapperRef.current?.getBoundingClientRect()
                                                .top || 0),
                                          }), {
                                            label: item.name,
                                            config: item.config,
                                            configMode: false,
                                            variables: variables,
                                          },
                                          menuPosition.connection,
                                        ),
                                        setMenuPosition(null));
                                    },
                                    children: item.name,
                                  }),
                                  jsx(`button`, {
                                    className: `p-1.5 text-red-400 hover:text-red-300 opacity-0 group-hover/item:opacity-100 transition-opacity wanjuan-context-menu-icon-action wanjuan-context-menu-item-danger`,
                                    onClick: (event) => {
                                      (event.stopPropagation(),
                                        window.confirm(
                                          `确定要删除自定义节点 "${item.name}" 吗？`,
                                        ) && deleteCustomNode?.(item.id));
                                    },
                                    title: `删除`,
                                    children: jsx(Trash2, {
                                      size: 14,
                                    }),
                                  }),
                                ],
                              },
                              item.id,
                            ),
                          ),
                        }),
                      ],
                    }),
	                    jsx(`div`, {
	                      className: `wanjuan-context-menu-separator h-[1px] bg-[#333] my-1`,
	                    }),
			                    jsxs(`div`, {
			                      className: `relative rounded wanjuan-context-flyout-group`,
		                      children: [
		                        jsxs(`button`, {
		                          type: `button`,
		                          onClick: (event) => {
		                            (event.stopPropagation(),
		                              setContextToolGroupsOpen((prev) =>
		                                prev.format ? {
		                                  format: false,
		                                  tools: false,
		                                  extensions: false,
		                                } : {
		                                  format: true,
		                                  tools: false,
		                                  extensions: false,
		                                },
		                              ));
		                          },
		                          className: `w-full list-none cursor-pointer select-none px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center justify-between gap-2 wanjuan-context-menu-item`,
	                          children: [
	                            jsxs(`span`, {
	                              className: `flex items-center gap-2`,
	                              children: [
	                                jsx(ListPlus, {
	                                  size: 16,
	                                  className: `text-orange-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `格式转换`,
	                                }),
	                              ],
	                            }),
		                            jsxs(`span`, {
		                              className: `text-[12px] text-gray-300 font-bold leading-none w-4 text-center`,
		                              children: [
		                                `▶`,
		                              ],
		                            }),
	                          ],
	                        }),
		                        contextToolGroupsOpen.format &&
		                        jsxs(`div`, {
	                          className: `absolute left-full top-0 ml-2 min-w-[168px] rounded-lg border border-[#333] bg-[#252525] p-1 shadow-2xl space-y-1 z-[70] wanjuan-context-flyout-panel`,
	                          children: [
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () =>
	                                createNodeAt(
	                                  `textConcatNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                ),
	                              children: [
	                                jsx(ListPlus, {
	                                  size: 16,
	                                  className: `text-green-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `文本拼接`
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () =>
	                                createNodeAt(
	                                  `urlToImageNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                ),
	                              children: [
	                                jsx(Link2, {
	                                  size: 16,
	                                  className: `text-blue-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `网址转图片`
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () =>
	                                createNodeAt(
	                                  `fileToLinkNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                ),
	                              children: [
	                                jsxs(`svg`, {
	                                  xmlns: `http://www.w3.org/2000/svg`,
	                                  width: `16`,
	                                  height: `16`,
	                                  viewBox: `0 0 24 24`,
	                                  fill: `none`,
	                                  stroke: `currentColor`,
		                                  strokeWidth: `2`,
		                                  strokeLinecap: `round`,
		                                  strokeLinejoin: `round`,
		                                  className: `text-orange-400`,
		                                  children: [
		                                    jsx(`rect`, {
		                                      x: `3`,
		                                      y: `5`,
		                                      width: `12`,
		                                      height: `14`,
		                                      rx: `2`,
		                                    }),
		                                    jsx(`circle`, {
		                                      cx: `7.5`,
		                                      cy: `9.5`,
		                                      r: `1.2`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M3 16l3.2-3.2a1.8 1.8 0 0 1 2.6 0L15 19`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M14 3h7v7`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M21 3l-9 9`,
		                                    }),
		                                  ],
		                                }),
	                                jsx(`span`, {
	                                  children: `图片转网址`
	                                }),
	                              ],
	                            }),
	                          ],
	                        }),
	                      ],
	                    }),
			                    jsxs(`div`, {
			                      className: `relative rounded wanjuan-context-flyout-group`,
		                      children: [
		                        jsxs(`button`, {
		                          type: `button`,
		                          onClick: (event) => {
		                            (event.stopPropagation(),
		                              setContextToolGroupsOpen((prev) =>
		                                prev.tools ? {
		                                  format: false,
		                                  tools: false,
		                                  extensions: false,
		                                } : {
		                                  format: false,
		                                  tools: true,
		                                  extensions: false,
		                                },
		                              ));
		                          },
		                          className: `w-full list-none cursor-pointer select-none px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center justify-between gap-2 wanjuan-context-menu-item`,
	                          children: [
	                            jsxs(`span`, {
	                              className: `flex items-center gap-2`,
	                              children: [
		                                jsxs(`svg`, {
		                                  xmlns: `http://www.w3.org/2000/svg`,
		                                  width: `16`,
		                                  height: `16`,
		                                  viewBox: `0 0 24 24`,
		                                  fill: `none`,
		                                  stroke: `currentColor`,
		                                  strokeWidth: `2`,
		                                  strokeLinecap: `round`,
		                                  strokeLinejoin: `round`,
		                                  className: `text-green-400`,
		                                  children: [
		                                    jsx(`rect`, {
		                                      x: `4`,
		                                      y: `7`,
		                                      width: `16`,
		                                      height: `12`,
		                                      rx: `2`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M8 12h8`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M12 10v4`,
		                                    }),
		                                  ],
		                                }),
	                                jsx(`span`, {
	                                  children: `常用工具`,
	                                }),
	                              ],
	                            }),
		                            jsxs(`span`, {
		                              className: `text-[12px] text-gray-300 font-bold leading-none w-4 text-center`,
		                              children: [
		                                `▶`,
		                              ],
		                            }),
	                          ],
	                        }),
		                        contextToolGroupsOpen.tools &&
		                        jsxs(`div`, {
	                          className: `absolute left-full top-0 ml-2 min-w-[168px] rounded-lg border border-[#333] bg-[#252525] p-1 shadow-2xl space-y-1 z-[70] wanjuan-context-flyout-panel`,
	                          children: [
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () =>
	                                createNodeAt(
	                                  `gridMergeNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                ),
	                              children: [
	                                jsx(Puzzle, {
	                                  size: 16,
	                                  className: `text-green-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `九宫格拼图`
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () =>
	                                createNodeAt(
	                                  `gridSplitNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                ),
	                              children: [
	                                jsx(LayoutGrid, {
	                                  size: 16,
	                                  className: `text-orange-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `九宫格切分`
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () =>
	                                createNodeAt(
	                                  `videoExtractNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                ),
	                              children: [
	                                jsx(MonitorPlay, {
	                                  size: 16,
	                                  className: `text-purple-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `视频抽帧`
	                                }),
	                              ],
	                            }),
	                          ],
	                        }),
	                      ],
	                    }),
			                    jsxs(`div`, {
			                      className: `relative rounded wanjuan-context-flyout-group`,
		                      children: [
		                        jsxs(`button`, {
		                          type: `button`,
		                          onClick: (event) => {
		                            (event.stopPropagation(),
		                              setContextToolGroupsOpen((prev) =>
		                                prev.extensions ? {
		                                  format: false,
		                                  tools: false,
		                                  extensions: false,
		                                } : {
		                                  format: false,
		                                  tools: false,
		                                  extensions: true,
		                                },
		                              ));
		                          },
		                          className: `w-full list-none cursor-pointer select-none px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center justify-between gap-2 wanjuan-context-menu-item`,
	                          children: [
	                            jsxs(`span`, {
	                              className: `flex items-center gap-2`,
	                              children: [
		                                jsxs(`svg`, {
		                                  xmlns: `http://www.w3.org/2000/svg`,
		                                  width: `16`,
		                                  height: `16`,
		                                  viewBox: `0 0 24 24`,
		                                  fill: `none`,
		                                  stroke: `currentColor`,
		                                  strokeWidth: `2`,
		                                  strokeLinecap: `round`,
		                                  strokeLinejoin: `round`,
		                                  className: `text-pink-400`,
		                                  children: [
		                                    jsx(`path`, {
		                                      d: `M12 2v4`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M12 18v4`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M4.93 4.93l2.83 2.83`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M16.24 16.24l2.83 2.83`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M2 12h4`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M18 12h4`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M4.93 19.07l2.83-2.83`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M16.24 7.76l2.83-2.83`,
		                                    }),
		                                    jsx(`path`, {
		                                      d: `M10 9h4v6h-4z`,
		                                    }),
		                                  ],
		                                }),
	                                jsx(`span`, {
	                                  children: `拓展功能`,
	                                }),
	                              ],
	                            }),
		                            jsxs(`span`, {
		                              className: `text-[12px] text-gray-300 font-bold leading-none w-4 text-center`,
		                              children: [
		                                `▶`,
		                              ],
		                            }),
	                          ],
	                        }),
		                        contextToolGroupsOpen.extensions &&
		                        jsxs(`div`, {
	                          className: `absolute left-full top-0 ml-2 min-w-[188px] rounded-lg border border-[#333] bg-[#252525] p-1 shadow-2xl space-y-1 z-[70] wanjuan-context-flyout-panel`,
	                          children: [
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () => {
	                                createNodeAt(
	                                  `videoFaceBlurNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                );
	                                setMenuPosition(null);
	                              },
	                              children: [
	                                jsxs(`svg`, {
	                                  xmlns: `http://www.w3.org/2000/svg`,
	                                  width: `16`,
	                                  height: `16`,
	                                  viewBox: `0 0 24 24`,
	                                  fill: `none`,
	                                  stroke: `currentColor`,
	                                  strokeWidth: `2`,
	                                  strokeLinecap: `round`,
	                                  strokeLinejoin: `round`,
	                                  className: `text-red-400`,
	                                  children: [
	                                    jsx(`rect`, {
	                                      x: `3`,
	                                      y: `5`,
	                                      width: `18`,
	                                      height: `14`,
	                                      rx: `2`,
	                                    }),
	                                    jsx(`circle`, {
	                                      cx: `12`,
	                                      cy: `11`,
	                                      r: `2.2`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M8.5 16c.8-2 2-3 3.5-3s2.7 1 3.5 3`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M7 17 17 7`,
	                                    }),
	                                  ],
	                                }),
	                                jsx(`span`, {
	                                  children: `视频人脸打码`
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () => {
	                                createNodeAt(
	                                  `qwenTtsCloneNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                );
	                                setMenuPosition(null);
	                              },
	                              children: [
	                                jsxs(`svg`, {
	                                  xmlns: `http://www.w3.org/2000/svg`,
	                                  width: `16`,
	                                  height: `16`,
	                                  viewBox: `0 0 24 24`,
	                                  fill: `none`,
	                                  stroke: `currentColor`,
	                                  strokeWidth: `2`,
	                                  strokeLinecap: `round`,
	                                  strokeLinejoin: `round`,
	                                  className: `text-yellow-400`,
	                                  children: [
	                                    jsx(`path`, {
	                                      d: `M12 3v18`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M8 7v10`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M16 7v10`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M4 10v4`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M20 10v4`,
	                                    }),
	                                  ],
	                                }),
	                                jsx(`span`, {
	                                  children: `Qwen-TTS 语音生成`
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () => {
	                                createNodeAt(
	                                  `realEsrganVideoNode`,
	                                  screenToFlowPosition({
	                                    x: menuPosition.x +
	                                      (wrapperRef.current?.getBoundingClientRect().left ||
	                                        0),
	                                    y: menuPosition.y +
	                                      (wrapperRef.current?.getBoundingClientRect().top ||
	                                        0),
	                                  }), {},
	                                  menuPosition.connection,
	                                );
	                                setMenuPosition(null);
	                              },
	                              children: [
	                                jsxs(`svg`, {
	                                  xmlns: `http://www.w3.org/2000/svg`,
	                                  width: `16`,
	                                  height: `16`,
	                                  viewBox: `0 0 24 24`,
	                                  fill: `none`,
	                                  stroke: `currentColor`,
	                                  strokeWidth: `2`,
	                                  strokeLinecap: `round`,
	                                  strokeLinejoin: `round`,
	                                  className: `text-blue-400`,
	                                  children: [
	                                    jsx(`path`, {
	                                      d: `M4 17h16`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M7 14l5-5 5 5`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M12 9v10`,
	                                    }),
	                                    jsx(`rect`, {
	                                      x: `4`,
	                                      y: `4`,
	                                      width: `16`,
	                                      height: `6`,
	                                      rx: `1.5`,
	                                    }),
	                                  ],
	                                }),
	                                jsx(`span`, {
	                                  children: `本地视频超分`
	                                }),
	                              ],
	                            }),
	                          ],
	                        }),
	                      ],
	                    }),
                    jsx(`div`, {
                      className: `wanjuan-context-menu-separator h-[1px] bg-[#333] my-1`,
                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: () => fileInputRef.current?.click(),
                      children: [
                        jsx(Upload, {
                          size: 16,
                          className: `text-green-400`,
                        }),
                        jsx(`span`, {
                          children: `上传文件`
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `relative`,
                      children: [
                        jsxs(`button`, {
                          className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item justify-between`,
                          onClick: (event) => {
                            event.stopPropagation();
                            let nextValue = !isResourceSubmenuOpen;
                            (setResourceSubmenuOpenAlt(nextValue), setResourceSubmenuOpen(nextValue));
                          },
                          children: [
                            jsxs(`span`, {
                              className: `flex items-center gap-2`,
                              children: [
                                jsx(ImageIcon, {
                                  size: 16,
                                  className: `text-blue-400`,
                                }),
                                jsx(`span`, {
                                  children: `选择素材`,
                                }),
                              ],
                            }),
                            jsx(`span`, {
                              className: `text-[10px] text-gray-500`,
                              children: `▶`,
                            }),
                          ],
                        }),
                        isResourceSubmenuOpen &&
                        jsx(`div`, {
                          className: `absolute left-full top-0 ml-1 z-50 wanjuan-context-submenu wanjuan-resource-submenu`,
                          style: {
                            clipPath: `inset(-80px -80px -80px 0)`
                          },
                          onClick: (event) => event.stopPropagation(),
                          children: jsx(WanJuanResourcePicker, {
                            resources: resources,
                            onSelect: (resource) => {
                              let position = screenToFlowPosition({
                                x: menuPosition.x +
                                  (wrapperRef.current?.getBoundingClientRect()
                                    .left || 0) +
                                  200,
                                y: menuPosition.y +
                                  (wrapperRef.current?.getBoundingClientRect()
                                    .top || 0),
                              });
	                              (wanjuanResourceKind(resource) === `text` ?
	                                createNodeAt(
	                                  `textNode`,
                                  position, {
                                    text: resource.url,
                                    label: resource.pageTitle || `文本素材`,
                                  },
                                  undefined,
                                ) :
		                                wanjuanResourceKind(resource) === `video` ?
		                                createNodeAt(
	                                  `imageNode`,
	                                  position, {
	                                    imageUrl: resource.url,
	                                    label: resource.pageTitle || resource.originalName || resource.filename || `视频素材`,
	                                    originalName: resource.originalName || resource.filename || resource.pageTitle || `视频素材`,
	                                    sourceOrigin: `external-upload`,
	                                    mediaKind: `video`,
	                                  },
	                                  undefined,
	                                ) :
	                                wanjuanResourceKind(resource) === `audio` ?
	                                createNodeAt(
                                  `audioNode`,
                                  position, {
                                    audioUrl: resource.url,
                                    audioName: resource.pageTitle || `音频素材`,
                                  },
                                  undefined,
                                ) :
                                createNodeAt(
                                  `imageNode`,
                                  position, {
                                    imageUrl: resource.url,
                                    label: resource.pageTitle || `图片素材`,
                                  },
                                  undefined,
                                ),
                                setResourceSubmenuOpen(false),
                                setResourceSubmenuOpenAlt(false),
                                setMenuPosition(null));
                            },
                            onClose: () => {
                              (setResourceSubmenuOpen(false), setResourceSubmenuOpenAlt(false));
                            },
                          }),
                        }),
                      ],
                    }),
                    jsxs(`button`, {
                      className: `w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white rounded flex items-center gap-2 wanjuan-context-menu-item`,
                      onClick: handleCopySelected,
                      children: [
                        jsx(Copy, {
                          size: 16,
                          className: `text-purple-400`,
                        }),
                        jsx(`span`, {
                          children: `复制画布`
                        }),
                      ],
                    }),
                  ],
                }) :
                (() => {
	                  let node = nodes.find((node2) => node2.id === menuPosition?.nodeId),
	                    selectedNodes = nodes.filter((node2) => node2.selected),
		                    media = node ? wanjuanCollectNodeReferenceMedia(node) : {
		                      images: [],
		                      videos: []
		                    },
	                    canShowImageActions = !!node &&
		                    media.videos.length === 0 &&
		                    node.data?.mediaKind !== `video` &&
	                    (node.type === `imageNode` ||
	                      node.type === `promptNode` ||
		                      media.images.length > 0),
	                    isVideoNode = !!node &&
	                    (node.type === `videoNode` ||
	                      node.type === `seedanceNode` ||
	                      node.type === `tongyiWanxiangNode` ||
	                      node.type === `videoFaceBlurNode` ||
	                      node.data?.mediaKind === `video` ||
		                      media.videos.length > 0),
	                    canShowMediaActions = canShowImageActions || isVideoNode;
                  return selectedNodes.length > 1 &&
                    (node?.selected || menuPosition?.type === `selection`) ?
                    jsxs(Fragment, {
                      children: [
                        jsxs(`button`, {
                          className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
                          onClick: (event) => {
                            (event.stopPropagation(), copySelectedNodes(), setMenuPosition(null));
                          },
                          children: [
                            jsx(Copy, {
                              size: 16,
                              className: `text-gray-400`,
                            }),
                            jsxs(`span`, {
                              children: [`复制 (`, selectedNodes.length, `)`],
                            }),
                          ],
                        }),
                        jsxs(`button`, {
                          className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
                          onClick: (event) => {
                            (event.stopPropagation(), groupSelectedNodes(), setMenuPosition(null));
                          },
                          children: [
                            jsx(LayoutGrid, {
                              size: 16,
                              className: `text-gray-400`,
                            }),
                            jsx(`span`, {
                              children: `组合`
                            }),
                          ],
                        }),
                        jsxs(`button`, {
                          className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
                          onClick: (event) => {
                            (event.stopPropagation(),
                              setMultiConnectIds(selectedNodes.map((node2) => node2.id)),
                              showToast(`请点击要连接到的目标节点`),
                              setMenuPosition(null));
                          },
                          children: [
                            jsxs(`svg`, {
                              xmlns: `http://www.w3.org/2000/svg`,
                              width: `16`,
                              height: `16`,
                              viewBox: `0 0 24 24`,
                              fill: `none`,
                              stroke: `currentColor`,
                              strokeWidth: `2`,
                              strokeLinecap: `round`,
                              strokeLinejoin: `round`,
                              className: `text-blue-400`,
                              children: [
                                jsx(`path`, {
                                  d: `M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71`,
                                }),
                                jsx(`path`, {
                                  d: `M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71`,
                                }),
                              ],
                            }),
                            jsx(`span`, {
                              children: `多项连接`,
                            }),
                          ],
                        }),
                        jsx(`div`, {
                          className: `wanjuan-context-menu-separator h-[1px] bg-[#333] my-1`,
                        }),
                        jsxs(`button`, {
                          className: `text-left px-3 py-2 text-sm text-red-400 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item-danger`,
                          onClick: (event) => {
                            (event.stopPropagation(), handleDeleteSelected(), setMenuPosition(null));
                          },
                          children: [
                            jsx(Trash2, {
                              size: 16,
                              className: `text-red-400`,
                            }),
                            jsx(`span`, {
                              children: `删除`
                            }),
                          ],
                        }),
                      ],
                    }) :
                    jsxs(Fragment, {
                      children: [
	                        false &&
	                        node?.type === `group` &&
	                        jsxs(Fragment, {
                          children: [
	                        false &&
	                        false &&
				                        node &&
				                        jsxs(`button`, {
                              className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
                              onClick: (event) => {
                                (event.stopPropagation(),
                                  menuPosition?.nodeId && ungroupNode(menuPosition.nodeId),
                                  setMenuPosition(null));
                              },
                              children: [
                                jsx(LayoutGrid, {
                                  size: 16,
                                  className: `text-gray-400`,
                                }),
                                jsx(`span`, {
                                  children: `取消编组`,
                                }),
                              ],
                            }),
                            jsx(`div`, {
                              className: `wanjuan-context-menu-separator h-[1px] bg-[#333] my-1`,
                            }),
                          ],
                        }),
				                        node &&
				                        jsxs(`button`, {
	                          className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                          onClick: () => {
	                            (menuPosition?.nodeId && layeredRunDownstream(menuPosition.nodeId), setMenuPosition(null));
                          },
                          children: [
                            jsx(`svg`, {
                              xmlns: `http://www.w3.org/2000/svg`,
                              width: `16`,
                              height: `16`,
                              viewBox: `0 0 24 24`,
                              fill: `none`,
                              stroke: `currentColor`,
                              strokeWidth: `2`,
                              strokeLinecap: `round`,
                              strokeLinejoin: `round`,
                              className: `text-green-400`,
                              children: jsx(`polygon`, {
                                points: `5 3 19 12 5 21 5 3`,
                              }),
                            }),
                            jsx(`span`, {
                              children: `按层级运行后续节点`,
                            }),
                          ],
                        }),
			                        canShowMediaActions &&
			                        jsxs(`button`, {
	                          className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                          onClick: () => {
	                            (menuPosition?.nodeId && runNodeChain(menuPosition.nodeId), setMenuPosition(null));
                          },
                          children: [
                            jsx(`svg`, {
                              xmlns: `http://www.w3.org/2000/svg`,
                              width: `16`,
                              height: `16`,
                              viewBox: `0 0 24 24`,
                              fill: `none`,
                              stroke: `currentColor`,
                              strokeWidth: `2`,
                              strokeLinecap: `round`,
                              strokeLinejoin: `round`,
                              className: `text-blue-400`,
                              children: jsx(`path`, {
                                d: `M4 6h16M4 12h16M4 18h16`,
                              }),
                            }),
                            jsx(`span`, {
	                              children: `按顺序运行后续节点`,
                            }),
                          ],
                        }),
				                        node &&
				                        jsx(`div`, {
                          className: `wanjuan-context-menu-separator h-[1px] bg-[#333] my-1`,
                        }),
	                        !isVideoNode &&
	                        jsxs(`button`, {
	                          className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                          onClick: copySelectedNodes,
                          children: [
                            jsx(Copy, {
                              size: 16,
                              className: `text-gray-400`,
                            }),
                            jsx(`span`, {
                              children: `复制节点`,
                            }),
                          ],
                        }),
		                        isVideoNode &&
	                        jsxs(Fragment, {
	                          children: [
	                            jsxs(`button`, {
	                              className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () => {
	                                if (!node) return;
	                                (createNodeAt(
	                                  `videoExtractNode`,
	                                  {
	                                    x: node.position.x + (node.measured?.width || node.style?.width || 320) + 60,
	                                    y: node.position.y,
	                                  }, {},
	                                  {
	                                    source: node.id,
	                                    sourceHandle: null
	                                  },
	                                ), setMenuPosition(null));
	                              },
	                              children: [
	                                jsx(MonitorPlay, {
	                                  size: 16,
	                                  className: `text-gray-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `视频抽帧`,
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () => {
                                if (!node) return;
                                (createNodeAt(
                                  `videoFaceBlurNode`,
                                  {
                                    x: node.position.x + (node.measured?.width || node.style?.width || 320) + 60,
                                    y: node.position.y,
                                  }, {},
                                  {
                                    source: node.id,
                                    sourceHandle: null
                                  },
                                ), setMenuPosition(null));
                              },
                              children: [
                                jsx(MonitorPlay, {
                                  size: 16,
                                  className: `text-red-400`,
                                }),
                                jsx(`span`, {
	                                  children: `视频人脸打码`,
	                                }),
	                              ],
	                            }),
	                            jsx(`div`, {
	                              className: `wanjuan-context-menu-separator h-[1px] bg-[#333] my-1`,
	                            }),
	                            jsxs(`button`, {
	                              className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: copySelectedNodes,
	                              children: [
	                                jsx(Copy, {
	                                  size: 16,
	                                  className: `text-gray-400`,
	                                }),
	                                jsx(`span`, {
	                                  children: `复制节点`,
	                                }),
	                              ],
	                            }),
	                          ],
		                        }),
		                        canShowImageActions &&
	                        jsxs(Fragment, {
                          children: [
	                            jsxs(`button`, {
	                              className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: copyNodeImage,
	                              children: [
	                                jsx(ImageIcon, {
                                  size: 16,
                                  className: `text-gray-400`,
                                }),
                                jsx(`span`, {
	                                  children: `复制图片`,
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: () => {
	                                if (!node) return;
	                                (createNodeAt(
	                                  `fileToLinkNode`,
	                                  {
	                                    x: node.position.x + (node.measured?.width || node.style?.width || 240) + 60,
	                                    y: node.position.y,
	                                  }, {},
	                                  {
	                                    source: node.id,
	                                    sourceHandle: null
	                                  },
	                                ), setMenuPosition(null));
	                              },
	                              children: [
	                                jsxs(`svg`, {
	                                  xmlns: `http://www.w3.org/2000/svg`,
	                                  width: `16`,
	                                  height: `16`,
	                                  viewBox: `0 0 24 24`,
	                                  fill: `none`,
	                                  stroke: `currentColor`,
	                                  strokeWidth: `2`,
	                                  strokeLinecap: `round`,
	                                  strokeLinejoin: `round`,
	                                  className: `text-blue-400`,
	                                  children: [
	                                    jsx(`path`, {
	                                      d: `M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71`,
	                                    }),
	                                    jsx(`path`, {
	                                      d: `M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71`,
	                                    }),
	                                  ],
	                                }),
	                                jsx(`span`, {
	                                  children: `图片转链接`,
	                                }),
	                              ],
	                            }),
	                            jsxs(`button`, {
	                              className: `text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item`,
	                              onClick: addGridSplitNode,
                              children: [
                                jsx(LayoutGrid, {
                                  size: 16,
                                  className: `text-gray-400`,
                                }),
                                jsx(`span`, {
                                  children: `九宫格切分`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`button`, {
                          className: `text-left px-3 py-2 text-sm text-red-400 hover:bg-[#333] rounded flex items-center gap-2 wanjuan-context-menu-item-danger`,
                          onClick: handleDeleteSelected,
                          children: [
                            jsx(Trash2, {
                              size: 16,
                              className: `text-red-400`,
                            }),
                            jsx(`span`, {
                              children: `删除`
                            }),
                          ],
                        }),
                      ],
                    });
                })(),
            });
}
