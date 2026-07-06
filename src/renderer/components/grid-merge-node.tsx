/**
 * 网格合并节点：把多张输入图按网格拼合为一张大图（canvas 合成）。（原 bundle 局部名 Re）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position, useNodeConnections, useNodesData, useReactFlow, useUpdateNodeInternals } from "@xyflow/react";
import { Download, LayoutGrid, RefreshCw } from "lucide-react";
import { WanJuanNodeHandle } from "./render-mode";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

export const WanJuanGridMergeNode = reactMemo(({
    id: nodeId,
    data: nodeData,
    selected: isSelected
  }: any) => {
    let [gridSize, setGridSize] = useState(3),
    [imageSize, setImageSize] = useState(512),
    [aspectRatio, setAspectRatio] = useState(`1:1`),
    [mergedImageUrl, setMergedImageUrl] = useState(null),
    [isMerging, setIsMerging] = useState(!1),
    [titlePattern, setTitlePattern] = useState(nodeData.titlePattern || `#{num}`),
    [isAutoSize, _] = useState(!0),
    [images, setImages] = useState([]),
    b = useUpdateNodeInternals(), {
      updateNodeData: updateNodeData
    } = useReactFlow();
    useEffect(() => {
      b(nodeId);
    }, [gridSize, nodeId, b]);
    let targetEdges = useNodeConnections({
        handleType: `target`
      }),
      sourceNodes = useNodesData(targetEdges.map((edge) => edge.source));
    return (
      useEffect(() => {
        let gridCells = Array(gridSize * gridSize).fill(null),
          slotIndex = 0,
          sourceNodesList = sourceNodes ? (Array.isArray(sourceNodes) ? sourceNodes : [sourceNodes]) : [];
        for (let edge of targetEdges) {
          let targetHandle = edge.targetHandle,
            sourceData = sourceNodesList.find((node) => node.id === edge.source)?.data;
          if (targetHandle === `default` || !targetHandle) {
            if (sourceData?.extractedImages) {
              let extractedImages: any = sourceData.extractedImages;
              for (let image of extractedImages) {
                for (; slotIndex < gridCells.length && gridCells[slotIndex] !== null;) slotIndex++;
                slotIndex < gridCells.length && (gridCells[slotIndex] = image);
              }
            } else if (sourceData?.imageUrl) {
              for (; slotIndex < gridCells.length && gridCells[slotIndex] !== null;) slotIndex++;
              slotIndex < gridCells.length && (gridCells[slotIndex] = sourceData.imageUrl);
            }
          } else if (targetHandle && targetHandle.startsWith(`cell-`)) {
            let cellIndex = parseInt(targetHandle.replace(`cell-`, ``), 10);
            if (cellIndex >= 0 && cellIndex < gridSize * gridSize) {
              if (sourceData?.imageUrl) gridCells[cellIndex] = sourceData.imageUrl;
              else if (sourceData?.extractedImages) {
                let extractedImages: any = sourceData.extractedImages;
                extractedImages.length > 0 && (gridCells[cellIndex] = extractedImages[0]);
              }
            }
          }
        }
        setImages(gridCells);
      }, [targetEdges, sourceNodes, gridSize]),
      jsxs(`div`, {
        className: `relative bg-[#1c1c1c] rounded-xl border shadow-xl transition-colors min-w-[300px] flex flex-col ${isSelected ? `border-blue-500` : `border-[#333]`}`,
        children: [
          jsx(WanJuanNodeHandle, {
            type: `target`,
            id: `default`,
            position: Position.Left,
            className: `!w-4 !h-4 z-50`,
            style: {
              top: `15px`
            },
          }),
          mergedImageUrl &&
          jsxs(`div`, {
            className: `relative w-full rounded-t-xl overflow-hidden bg-black flex items-center justify-center min-h-[150px] border-b border-[#333]`,
            children: [
              jsx(`img`, {
                src: mergedImageUrl,
                alt: `Merged`,
                className: `max-w-full max-h-[300px] object-contain block`,
              }),
              jsx(WanJuanNodeHandle, {
                type: `source`,
                position: Position.Right
              }),
            ],
          }),
          jsxs(`div`, {
            className: `flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] bg-[#222] ${mergedImageUrl ? `` : `rounded-t-xl`}`,
            children: [
              jsxs(`div`, {
                className: `flex items-center gap-2 text-gray-300 text-xs font-medium`,
                children: [
                  jsx(LayoutGrid, {
                    size: 14
                  }),
                  jsx(`span`, {
                    children: `九宫格拼图`
                  }),
                ],
              }),
              mergedImageUrl &&
              jsx(`button`, {
                onClick: (event) => {
                  if ((event.stopPropagation(), mergedImageUrl))
                    if (typeof chrome < `u` && chrome.downloads)
                      chrome.downloads.download({
                        url: mergedImageUrl,
                        filename: `wanjuan/merged-grid-${Date.now()}.png`,
                        saveAs: !1,
                      });
                    else {
                      let link = document.createElement(`a`);
                      ((link.href = mergedImageUrl),
                        (link.download = `merged-grid-${Date.now()}.png`),
                        document.body.appendChild(link),
                        link.click(),
                        document.body.removeChild(link));
                    }
                },
                className: `text-gray-400 hover:text-white nodrag`,
                children: jsx(Download, {
                  size: 14
                }),
              }),
            ],
          }),
          jsxs(`div`, {
            className: `p-3 space-y-3 bg-[#1a1a1a] rounded-b-xl relative drag-handle`,
            children: [
              jsxs(`div`, {
                className: `bg-[#121212] rounded border border-[#333] min-h-[150px] flex items-center justify-center relative overflow-hidden nodrag`,
                children: [
                  jsx(`div`, {
                    className: `grid w-full h-full p-2 gap-1 opacity-50`,
                    style: {
                      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    },
                    children: Array.from({
                      length: gridSize * gridSize
                    }).map((e, cellIndex) =>
                      jsxs(
                        `div`, {
                          className: `border border-[#333] border-dashed rounded-[2px] flex flex-col items-center justify-center min-h-[40px] bg-[#1a1a1a] relative overflow-hidden group/cell`,
                          children: [
                            images[cellIndex] ?
                            jsx(`img`, {
                              src: images[cellIndex],
                              className: `absolute inset-0 w-full h-full object-cover`,
                            }) :
                            jsxs(`span`, {
                              className: `text-[10px] text-[#555]`,
                              children: [`图 `, cellIndex + 1],
                            }),
                            jsx(Handle, {
                              type: `target`,
                              position: Position.Left,
                              id: `cell-${cellIndex}`,
                              className: `!opacity-0 group-hover/cell:!opacity-100 !w-1.5 !h-1.5 !bg-blue-500 !border-[1px] !border-white !rounded-full transition-opacity cursor-crosshair z-[100]`,
                              style: {
                                top: `50%`,
                                left: `50%`,
                                transform: `translate(-50%, -50%)`,
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
                  isMerging &&
                  jsx(`div`, {
                    className: `absolute inset-0 bg-black/50 flex items-center justify-center`,
                    children: jsx(RefreshCw, {
                      className: `animate-spin text-white`,
                    }),
                  }),
                ],
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
                        className: `bg-[#2a2a2a] text-gray-300 text-xs rounded px-2 py-1 border border-[#333] outline-none flex-1`,
                        title: `网格行列数`,
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
                      jsxs(`select`, {
                        value: isAutoSize ? `auto` : imageSize,
                        onChange: (event) => {
                          let selectedValue = event.target.value;
                          selectedValue === `auto` ? _(!0) : (_(!1), setImageSize(Number(selectedValue)));
                        },
                        className: `bg-[#2a2a2a] text-gray-300 text-xs rounded px-2 py-1 border border-[#333] outline-none flex-1`,
                        title: `单格尺寸 (像素)`,
                        children: [
                          jsx(`option`, {
                            value: `auto`,
                            children: `自适应`,
                          }),
                          jsx(`option`, {
                            value: 256,
                            children: `256px`,
                          }),
                          jsx(`option`, {
                            value: 512,
                            children: `512px`,
                          }),
                          jsx(`option`, {
                            value: 1024,
                            children: `1024px`,
                          }),
                          jsx(`option`, {
                            value: 2048,
                            children: `2048px`,
                          }),
                        ],
                      }),
                      jsxs(`select`, {
                        value: aspectRatio,
                        onChange: (event) => setAspectRatio(event.target.value),
                        className: `bg-[#2a2a2a] text-gray-300 text-xs rounded px-2 py-1 border border-[#333] outline-none flex-1`,
                        title: `比例`,
                        disabled: isAutoSize,
                        style: {
                          opacity: isAutoSize ? 0.5 : 1
                        },
                        children: [
                          jsx(`option`, {
                            value: `1:1`,
                            children: `1:1`,
                          }),
                          jsx(`option`, {
                            value: `16:9`,
                            children: `16:9`,
                          }),
                          jsx(`option`, {
                            value: `4:3`,
                            children: `4:3`,
                          }),
                          jsx(`option`, {
                            value: `3:4`,
                            children: `3:4`,
                          }),
                          jsx(`option`, {
                            value: `9:16`,
                            children: `9:16`,
                          }),
                        ],
                      }),
                      jsx(`button`, {
                        onClick: async () => {
                          if (targetEdges.length !== 0) {
                            setIsMerging(!0);
                            try {
                              let imageUrls = images,
                                loadedImages: any[] = await Promise.all(
                                  imageUrls.map(async (imageUrl) => {
                                    if (!imageUrl) return null;
                                    let image = new Image();
                                    return (
                                      (image.crossOrigin = `anonymous`),
                                      (image.src = imageUrl),
                                      new Promise((resolve) => {
                                        ((image.onload = () => resolve(image)),
                                          (image.onerror = () => {
                                            let image2 = new Image();
                                            ((image2.src = imageUrl),
                                              (image2.onload = () => resolve(image2)),
                                              (image2.onerror = () => resolve(null)));
                                          }));
                                      })
                                    );
                                  }),
                                ),
                                cellWidth = imageSize,
                                cellHeight = imageSize;
                              if (isAutoSize && loadedImages.find((image) => image !== null)) {
                                let firstImage = loadedImages.find((image) => image !== null);
                                firstImage && ((cellWidth = firstImage.width), (cellHeight = firstImage.height));
                              } else {
                                let [aspectWidth, aspectHeight] = aspectRatio.split(`:`).map(Number),
                                  ratio = aspectWidth / aspectHeight;
                                cellHeight = Math.round(imageSize / ratio);
                              }
                              let canvas = document.createElement(`canvas`);
                              ((canvas.width = cellWidth * gridSize), (canvas.height = cellHeight * gridSize));
                              let ctx = canvas.getContext(`2d`);
                              if (ctx) {
                                ((ctx.fillStyle = `#000`),
                                  ctx.fillRect(0, 0, canvas.width, canvas.height),
                                  loadedImages.forEach((image, cellIndex) => {
                                    if (cellIndex >= gridSize * gridSize) return;
                                    let row = Math.floor(cellIndex / gridSize),
                                      col = cellIndex % gridSize;
                                    image && ctx.drawImage(image, col * cellWidth, row * cellHeight, cellWidth, cellHeight);
                                    let label = titlePattern.trim() ?
                                      titlePattern.replace(`{num}`, (cellIndex + 1).toString()) :
                                      ``;
                                    if (label) {
                                      let fontSize = Math.max(20, cellWidth * 0.08);
                                      ctx.font = `bold ${fontSize}px sans-serif`;
                                      let textWidth = ctx.measureText(label).width,
                                        paddingX = fontSize * 0.6,
                                        boxHeight = fontSize + fontSize * 0.4 * 2,
                                        boxWidth = textWidth + paddingX * 2,
                                        cellX = col * cellWidth,
                                        cellY = row * cellHeight,
                                        margin = cellWidth * 0.03;
                                      ctx.fillStyle = `rgba(0, 0, 0, 0.75)`;
                                      let drawX = cellX + margin,
                                        drawY = cellY + margin;
                                      (ctx.beginPath(),
                                        typeof ctx.roundRect == `function` ?
                                        ctx.roundRect(drawX, drawY, boxWidth, boxHeight, 8) :
                                        ctx.rect(drawX, drawY, boxWidth, boxHeight),
                                        ctx.fill(),
                                        (ctx.fillStyle = `#fff`),
                                        (ctx.textBaseline = `middle`),
                                        (ctx.textAlign = `center`),
                                        ctx.fillText(
                                          label,
                                          drawX + boxWidth / 2,
                                          drawY + boxHeight / 2 + 2,
                                        ));
                                    }
                                  }));
                                let dataUrl = canvas.toDataURL(`image/png`);
                                (setMergedImageUrl(dataUrl), updateNodeData(nodeId, {
                                  imageUrl: dataUrl
                                }), b(nodeId));
                              }
                            } catch (error) {
                              console.error(`Merge failed`, error);
                            } finally {
                              setIsMerging(!1);
                            }
                          }
                        },
                        disabled: targetEdges.length === 0,
                        className: `flex-1 py-1 rounded text-xs transition-colors ${targetEdges.length > 0 ? `bg-blue-600 text-white hover:bg-blue-500` : `bg-[#333] text-gray-500 cursor-not-allowed`}`,
                        children: `开始合成`,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          jsx(WanJuanNodeHandle, {
            type: `source`,
            position: Position.Right,
            id: `batch-output`,
          }),
        ],
      })
    );
  });
