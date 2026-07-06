/**
 * 网格拆分节点：把一张图按行列切成网格并输出各切片。（原 bundle 局部名 Le）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { ArrowUp, Check, LayoutGrid } from "lucide-react";
import { WanJuanNodeHandle } from "./render-mode";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

export const WanJuanGridSplitNode = reactMemo(({
    id: nodeId,
    data: nodeData,
    selected: isSelected
  }: any) => {
    let [gridSize, setGridSize] = useState(3),
    [titlePattern, setTitlePattern] = useState(nodeData.titlePattern || `#{num}`),
    sourceNodes = useNodesData(useNodeConnections({
        handleType: `target`
      }).map((edge) => edge.source)), {
        updateNodeData: updateNodeData
      } = useReactFlow(),
      imageUrl = nodeData.imageUrl;
    if (!imageUrl && sourceNodes) {
      let sourceNode = (Array.isArray(sourceNodes) ? sourceNodes : [sourceNodes]).find((node) => node?.data?.imageUrl);
      sourceNode && (imageUrl = sourceNode.data.imageUrl);
    }
    useEffect(() => {
      if (!imageUrl) {
        updateNodeData(nodeId, {
          extractedImages: [],
          gridSize: gridSize
        });
        return;
      }
      (async () => {
        try {
          let image = new Image();
          ((image.crossOrigin = `anonymous`),
            (image.src = imageUrl),
            await new Promise((resolve) => {
              ((image.onload = resolve),
                (image.onerror = () => {
                  let image2 = new Image();
                  ((image2.src = imageUrl),
                    (image2.onload = () => resolve(null)),
                    (image2.onerror = () => resolve(null)));
                }));
            }));
          let extractedImages = [],
            cellWidth = image.width / gridSize,
            cellHeight = image.height / gridSize;
          for (let cellIndex = 0; cellIndex < gridSize * gridSize; cellIndex++) {
            let row = Math.floor(cellIndex / gridSize),
              col = cellIndex % gridSize,
              canvas = document.createElement(`canvas`);
            ((canvas.width = cellWidth), (canvas.height = cellHeight));
            let ctx = canvas.getContext(`2d`);
            ctx
              ?
              (ctx.drawImage(image, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight),
                extractedImages.push(canvas.toDataURL(`image/png`))) :
              extractedImages.push(null);
          }
          updateNodeData(nodeId, {
            extractedImages: extractedImages,
            gridSize: gridSize
          });
        } catch (error) {
          console.error(`Failed to pre-crop images:`, error);
        }
      })();
    }, [imageUrl, gridSize, nodeId, updateNodeData]);
    let handleSplit = (event) => {
        (event.stopPropagation(), nodeData.onSplit && imageUrl && nodeData.onSplit(nodeId, imageUrl, gridSize, titlePattern));
      },
      handleSplitOne = (cellIndex) => {
        if (nodeData.onSplitOne && imageUrl) {
          let title = titlePattern.replace(`{num}`, (cellIndex + 1).toString());
          nodeData.onSplitOne(nodeId, imageUrl, gridSize, cellIndex, title);
        }
      },
      sourceEdges = useNodeConnections({
        handleType: `source`
      }),
      connectedCells = new Set(
        sourceEdges
        .filter((edge) => edge.sourceHandle?.startsWith(`cell-`))
        .map((edge) => parseInt(edge.sourceHandle.replace(`cell-`, ``), 10)),
      );
    return jsxs(`div`, {
      className: `relative bg-[#1c1c1c] rounded-xl border shadow-xl transition-colors w-[220px] ${isSelected ? `border-blue-500` : `border-[#333]`}`,
      children: [
        jsx(WanJuanNodeHandle, {
          type: `target`,
          position: Position.Left,
          variant: `small`
        }),
        jsx(WanJuanNodeHandle, {
          type: `source`,
          position: Position.Right,
          id: `batch`,
          variant: `small`,
        }),
        jsx(`div`, {
          className: `flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] bg-[#222]`,
          children: jsxs(`div`, {
            className: `flex items-center gap-2 text-gray-300 text-xs font-medium`,
            children: [
              jsx(LayoutGrid, {
                size: 14
              }),
              jsx(`span`, {
                children: `九宫格切分`
              }),
            ],
          }),
        }),
        jsxs(`div`, {
          className: `p-3 space-y-3 relative z-10 bg-[#1c1c1c]`,
          children: [
            imageUrl ?
            jsx(`div`, {
              className: `relative group cursor-pointer w-full`,
              children: jsxs(`div`, {
                className: `relative w-full rounded bg-black/50 overflow-hidden shadow-inner`,
                children: [
                  jsx(`img`, {
                    src: imageUrl,
                    alt: `Source`,
                    className: `w-full h-auto block opacity-80`,
                  }),
                  jsx(`div`, {
                    className: `absolute inset-0 grid gap-[2px] bg-[#1c1c1c]/20 p-[1px]`,
                    style: {
                      gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                      gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                    },
                    children: Array.from({
                      length: gridSize * gridSize
                    }).map((e, cellIndex) =>
                      jsxs(
                        `div`, {
                          className: `border border-white/20 hover:bg-blue-500/40 hover:border-blue-400 active:bg-blue-500/60 transition-all cursor-pointer nodrag bg-transparent rounded-[1px] relative group/cell`,
                          onClick: (event) => {
                            (event.stopPropagation(), handleSplitOne(cellIndex));
                          },
                          title: `点击切出: ${titlePattern.replace(`{num}`, (cellIndex + 1).toString())}`,
                          children: [
                            jsx(`span`, {
                              className: `absolute top-0.5 left-0.5 text-[8px] text-white/90 bg-black/50 px-1 rounded-sm font-mono pointer-events-none scale-75 origin-top-left backdrop-blur-[1px]`,
                              children: cellIndex + 1,
                            }),
                            connectedCells.has(cellIndex) &&
                            jsx(`div`, {
                              className: `absolute inset-0 flex items-center justify-center pointer-events-none`,
                              children: jsx(Check, {
                                size: 16,
                                className: `text-green-500 drop-shadow-md bg-black/30 rounded-full p-0.5`,
                              }),
                            }),
                            jsx(Handle, {
                              type: `source`,
                              position: Position.Right,
                              id: `cell-${cellIndex}`,
                              className: `!opacity-0 group-hover/cell:!opacity-100 !w-1.5 !h-1.5 !bg-blue-500 !border-[1px] !border-white !rounded-full transition-opacity cursor-crosshair z-[100]`,
                              style: {
                                top: `50%`,
                                left: `50%`,
                                transform: `translate(-50%, -50%)`,
                                right: `auto`,
                                minWidth: `6px`,
                                minHeight: `6px`,
                              },
                            }),
                          ],
                        },
                        cellIndex,
                      ),
                    ),
                  }),
                ],
              }),
            }) :
            jsx(`div`, {
              className: `h-24 flex flex-col items-center justify-center text-gray-600 bg-[#151515] rounded border border-dashed border-[#333]`,
              children: jsx(`span`, {
                className: `text-xs`,
                children: `请连接图片`,
              }),
            }),
            jsxs(`div`, {
              className: `space-y-2 nodrag`,
              children: [
                jsx(`div`, {
                  className: `flex items-center gap-2`,
                  children: jsx(`input`, {
                    className: `flex-1 bg-[#2a2a2a] text-gray-300 text-xs rounded px-2 py-1 border border-[#333] outline-none`,
                    placeholder: `标题: #{num}`,
                    value: titlePattern,
                    onChange: (event) => {
                      (setTitlePattern(event.target.value), (nodeData.titlePattern = event.target.value));
                    },
                  }),
                }),
                jsxs(`div`, {
                  className: `flex items-center justify-between gap-2`,
                  children: [
                    jsxs(`select`, {
                      value: gridSize,
                      onChange: (event) => setGridSize(Number(event.target.value)),
                      className: `bg-[#2a2a2a] text-gray-300 text-xs rounded px-2 py-1 border border-[#333] outline-none w-16`,
                      children: [
                        jsx(`option`, {
                          value: 2,
                          children: `2x2`
                        }),
                        jsx(`option`, {
                          value: 3,
                          children: `3x3`
                        }),
                        jsx(`option`, {
                          value: 4,
                          children: `4x4`
                        }),
                        jsx(`option`, {
                          value: 5,
                          children: `5x5`
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex-1 flex items-center justify-between bg-[#2a2a2a] rounded-full p-1 pl-3 border border-[#333] transition-colors cursor-pointer group/btn
                        ${imageUrl ? `hover:border-gray-500` : `opacity-50 cursor-not-allowed`}
                    `,
                      onClick: imageUrl ? handleSplit : void 0,
                      children: [
                        jsx(`span`, {
                          className: `text-xs text-gray-300 group-hover/btn:text-white`,
                          children: `生成切片`,
                        }),
                        jsx(`button`, {
                          className: `bg-white text-black w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors`,
                          children: jsx(ArrowUp, {
                            size: 14,
                            strokeWidth: 3
                          }),
                        }),
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
  });
