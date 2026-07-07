/** 空画布占位提示（无节点时显示）。自 WanJuanAppCanvas 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanEmptyCanvasPlaceholder({
  createNodeAt,
  screenToFlowPosition,
  wrapperRef,
}: any) {
  return jsx(`div`, {
              className: `absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none`,
              children: jsxs(`div`, {
                className: `flex flex-col items-center pointer-events-auto -translate-y-10`,
                style: {
                  transform: `translateY(-18px)`
                },
                children: [
                  jsxs(`div`, {
                    className: `bg-[#1c1c1c] rounded-full px-5 py-2.5 flex items-center gap-3 mb-10 border border-[#333] shadow-lg`,
                    style: {
                      display: `flex`,
                      alignItems: `center`,
                      gap: 12,
                      minHeight: 44,
                      marginBottom: 34,
                      padding: `10px 22px`,
                      borderRadius: 9999,
                    },
                    children: [
                      jsxs(`svg`, {
                        xmlns: `http://www.w3.org/2000/svg`,
                        width: `18`,
                        height: `18`,
                        viewBox: `0 0 24 24`,
                        fill: `none`,
                        stroke: `currentColor`,
                        strokeWidth: `2`,
                        strokeLinecap: `round`,
                        strokeLinejoin: `round`,
                        className: `text-gray-300`,
                        style: {
                          display: `block`,
                          flex: `0 0 18px`
                        },
                        children: [
                          jsx(`path`, {
                            d: `M3 3v18h18`
                          }),
                          jsx(`path`, {
                            d: `m19 9-5 5-4-4-3 3`
                          }),
                        ],
                      }),
                      jsx(`span`, {
                        className: `text-base font-medium text-gray-200 tracking-wide`,
                        style: {
                          lineHeight: `22px`
                        },
                        children: `右键自由生成你的想象`,
                      }),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `flex items-center gap-4`,
                    style: {
                      display: `flex`,
                      alignItems: `center`,
                      gap: 16
                    },
                    children: [
                      jsxs(`button`, {
                        onClick: () => {
                          let rect = wrapperRef.current?.getBoundingClientRect();
                          createNodeAt(
                            `textNode`,
                            rect ? screenToFlowPosition({
                              x: rect.left + rect.width / 2 - 150,
                              y: rect.top + rect.height / 2,
                            }) : {
                              x: 0,
                              y: 0
                            }, {
                              text: ``
                            },
                          );
                        },
                        className: `flex items-center gap-2 px-6 py-3.5 bg-transparent hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-2xl transition-all text-gray-400 hover:text-gray-200`,
                        style: {
                          display: `inline-flex`,
                          alignItems: `center`,
                          justifyContent: `center`,
                          gap: 8,
                          height: 36,
                          minWidth: 124,
                          padding: `0 18px`,
                          borderRadius: 18,
                          lineHeight: 1,
                          overflow: `hidden`,
                        },
                        children: [
                          jsx(`span`, {
                            className: `text-gray-500 text-lg leading-none`,
                            style: {
                              display: `inline-flex`,
                              alignItems: `center`,
                              justifyContent: `center`,
                              width: 16,
                              height: 16,
                              flex: `0 0 16px`,
                              fontSize: 15,
                              lineHeight: `16px`,
                            },
                            children: `T`,
                          }),
                          jsx(`span`, {
                            className: `text-sm font-medium`,
                            style: {
                              lineHeight: `18px`
                            },
                            children: `文字生成`,
                          }),
                        ],
                      }),
                      jsxs(`button`, {
                        onClick: () => {
                          let rect = wrapperRef.current?.getBoundingClientRect();
                          createNodeAt(
                            `promptNode`,
                            rect ? screenToFlowPosition({
                              x: rect.left + rect.width / 2,
                              y: rect.top + rect.height / 2,
                            }) : {
                              x: 0,
                              y: 0
                            }, {
                              prompt: ``
                            },
                          );
                        },
                        className: `flex items-center gap-2 px-6 py-3.5 bg-transparent hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-2xl transition-all text-gray-400 hover:text-gray-200`,
                        style: {
                          display: `inline-flex`,
                          alignItems: `center`,
                          justifyContent: `center`,
                          gap: 8,
                          height: 36,
                          minWidth: 124,
                          padding: `0 18px`,
                          borderRadius: 18,
                          lineHeight: 1,
                          overflow: `hidden`,
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
                            className: `text-gray-500`,
                            style: {
                              display: `block`,
                              flex: `0 0 16px`
                            },
                            children: [
                              jsx(`rect`, {
                                x: `4`,
                                y: `4`,
                                width: `16`,
                                height: `16`,
                                rx: `2`,
                              }),
                              jsx(`circle`, {
                                cx: `9`,
                                cy: `9`,
                                r: `1.5`,
                              }),
                              jsx(`path`, {
                                d: `m20 15-4-4L5 20`,
                              }),
                            ],
                          }),
                          jsx(`span`, {
                            className: `text-sm font-medium`,
                            style: {
                              lineHeight: `18px`
                            },
                            children: `图片生成`,
                          }),
                        ],
                      }),
                      jsxs(`button`, {
                        onClick: () => {
                          let rect = wrapperRef.current?.getBoundingClientRect();
                          createNodeAt(
                            `videoNode`,
                            rect ? screenToFlowPosition({
                              x: rect.left + rect.width / 2 + 150,
                              y: rect.top + rect.height / 2,
                            }) : {
                              x: 0,
                              y: 0
                            }, {
                              prompt: ``
                            },
                          );
                        },
                        className: `flex items-center gap-2 px-6 py-3.5 bg-transparent hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-2xl transition-all text-gray-400 hover:text-gray-200`,
                        style: {
                          display: `inline-flex`,
                          alignItems: `center`,
                          justifyContent: `center`,
                          gap: 8,
                          height: 36,
                          minWidth: 124,
                          padding: `0 18px`,
                          borderRadius: 18,
                          lineHeight: 1,
                          overflow: `hidden`,
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
                            className: `text-gray-500`,
                            style: {
                              display: `block`,
                              flex: `0 0 16px`
                            },
                            children: [
                              jsx(`rect`, {
                                x: `3`,
                                y: `5`,
                                width: `18`,
                                height: `14`,
                                rx: `2`,
                              }),
                              jsx(`path`, {
                                d: `m10 9 5 3-5 3V9z`,
                              }),
                            ],
                          }),
                          jsx(`span`, {
                            className: `text-sm font-medium`,
                            style: {
                              lineHeight: `18px`
                            },
                            children: `视频生成`,
                          }),
                        ],
                      }),
                      jsxs(`button`, {
                        onClick: () => {
                          let rect = wrapperRef.current?.getBoundingClientRect();
                          createNodeAt(
                            `musicNode`,
                            rect ? screenToFlowPosition({
                              x: rect.left + rect.width / 2 + 300,
                              y: rect.top + rect.height / 2,
                            }) : {
                              x: 0,
                              y: 0
                            }, {
                              mode: `suno`,
                              nodeKind: `music`,
                              prompt: ``
                            },
                          );
                        },
                        className: `flex items-center gap-2 px-6 py-3.5 bg-transparent hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-2xl transition-all text-gray-400 hover:text-gray-200`,
                        style: {
                          display: `inline-flex`,
                          alignItems: `center`,
                          justifyContent: `center`,
                          gap: 8,
                          height: 36,
                          minWidth: 124,
                          padding: `0 18px`,
                          borderRadius: 18,
                          lineHeight: 1,
                          overflow: `hidden`,
                        },
                        children: [
                          jsx(`span`, {
                            className: `text-gray-500 text-lg leading-none`,
                            style: {
                              display: `inline-flex`,
                              alignItems: `center`,
                              justifyContent: `center`,
                              width: 16,
                              height: 16,
                              flex: `0 0 16px`,
                              fontSize: 16,
                              lineHeight: `16px`,
                            },
                            children: `♫`,
                          }),
                          jsx(`span`, {
                            className: `text-sm font-medium`,
                            style: {
                              lineHeight: `18px`
                            },
                            children: `音乐生成`,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            });
}
