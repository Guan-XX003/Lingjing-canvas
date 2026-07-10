/**
 * 视频抽帧节点：按帧数/时间点抽取视频关键帧，输出可逐帧连线的图片组。（原 bundle 局部名 Je）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { NodeResizer, Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { CircleAlert, CirclePlay, Copy, Film, Image, RefreshCw, Settings2, Upload } from "lucide-react";
import { WanJuanNodeHandle, WanJuanUseThrottledNodeDataUpdate } from "./render-mode";
import { buildProjectMediaFileUrl } from "../lib/resource";

export const WanJuanVideoExtractNode = reactMemo(({
      id: nodeId,
      data: data,
      selected: selected
    }: any) => {
      let {
        updateNodeData: updateNodeData,
        getNodes: getNodes,
        getEdges: getEdges
      } = useReactFlow(),
        wanjuanThrottledUpdateNodeData = WanJuanUseThrottledNodeDataUpdate(nodeId, updateNodeData),
        nodeData = data,
        fileInputRef = useRef(null),
        [uploadedFile, setUploadedFile] = useState(null),
        [showMenu, setShowMenu] = useState(!1),
        [mode, setMode] = useState(data.mode || `count`),
        [intervalSec, setIntervalSec] = useState(data.intervalSec || 2),
        [_, setFrameCount] = useState(data.frameCount || 9),
        [sensitivity, setSensitivity] = useState(data.sensitivity || 30),
        [framePage, setFramePage] = useState(0),
        frameGridViewportRef = useRef<HTMLDivElement | null>(null),
        [frameGridSize, setFrameGridSize] = useState({ width: 0, height: 0 }),
        [frameGridScrollTop, setFrameGridScrollTop] = useState(0),
        [hiddenIndices] = useState(data.hiddenIndices || []);
      useEffect(() => {
        updateNodeData(nodeId, {
          mode: mode,
          intervalSec: intervalSec,
          frameCount: _,
          sensitivity: sensitivity,
          hiddenIndices: hiddenIndices,
        });
      }, [mode, intervalSec, _, sensitivity, hiddenIndices, nodeId, updateNodeData]);
      let connections = useNodeConnections({
          handleType: `target`
        }),
        sourceConnections = useNodeConnections({
          handleType: `source`
        }),
        sourceData = useNodesData(useMemo(() => connections.map((connection) => connection.source), [connections])),
        lastVideoUrlRef = useRef(``);
      (useEffect(() => {
          if (uploadedFile) return;
          let sourceNodes = Array.isArray(sourceData) ? sourceData : sourceData ? [sourceData] : [],
            videoUrl = ``;
          for (let sourceNode of sourceNodes)
            if (sourceNode?.data) {
              if (sourceNode.data.videoUrl && typeof sourceNode.data.videoUrl == `string`) {
                videoUrl = sourceNode.data.videoUrl;
                break;
              }
              if (sourceNode.data.imageUrl && typeof sourceNode.data.imageUrl == `string`) {
                let imageUrl = sourceNode.data.imageUrl;
                if (
                  imageUrl.startsWith(`data:video/`) ||
                  /\.(mp4|webm|mov|ogg)($|\?)/i.test(imageUrl)
                ) {
                  videoUrl = imageUrl;
                  break;
                }
              }
              if (sourceNode.data.text && typeof sourceNode.data.text == `string`) {
                let urlMatch = sourceNode.data.text.match(
                  /(https?:\/\/[^\s"'`<>]+)|(data:(audio|video)\/[^\s"']+)/i,
                );
                if (urlMatch) {
                  videoUrl = urlMatch[0];
                  break;
                }
              }
            }
          if (videoUrl && videoUrl !== lastVideoUrlRef.current) {
            lastVideoUrlRef.current = videoUrl;
            let videoName = `connected_video.mp4`;
            if (videoUrl.startsWith(`data:video/`)) videoName = `base64_video.mp4`;
            else
              try {
                let parsedUrl = new URL(videoUrl),
                  fileName = parsedUrl.pathname.split(`/`).pop();
                videoName = fileName && fileName.includes(`.`) ? fileName + parsedUrl.search : videoUrl;
              } catch {
                videoName = videoUrl;
              }
            updateNodeData(nodeId, {
              videoUrl: videoUrl,
              videoName: videoName,
              errorMessage: void 0
            });
          } else
            !videoUrl &&
            lastVideoUrlRef.current &&
            ((lastVideoUrlRef.current = ``),
              uploadedFile || updateNodeData(nodeId, {
                videoUrl: void 0,
                videoName: void 0
              }));
        }, [sourceData, uploadedFile, nodeId, updateNodeData]),
        useEffect(() => {
          updateNodeData(nodeId, {
            onExtractFrames: extractFrames
          });
        }, [uploadedFile, mode, intervalSec, _, sensitivity]));
      let handleFileChange = (event) => {
          let file = event.target.files?.[0];
          if (!file) return;
          setUploadedFile(file);
          let objectUrl = URL.createObjectURL(file);
          ((nodeData.videoUrl = objectUrl),
            (nodeData.videoName = file.name),
            updateNodeData(nodeId, {
              videoUrl: objectUrl,
              videoName: file.name,
              errorMessage: void 0,
              extractedImages: void 0,
              progress: 0,
            }),
            (event.target.value = ``));
        },
        extractFrames = async () => {
            let videoSrc = ``;
            if (uploadedFile) videoSrc = URL.createObjectURL(uploadedFile);
            else {
              let edges = getEdges(),
                nodes = getNodes(),
                incomingEdges = edges.filter((edge: any) => edge.target === nodeId);
              for (let edge of incomingEdges) {
                let sourceNode = nodes.find((node: any) => node.id === edge.source);
                if (sourceNode) {
                  if (sourceNode.data.videoUrl && typeof sourceNode.data.videoUrl == `string`) {
                    let videoUrl = sourceNode.data.videoUrl;
                    if (
                      videoUrl.startsWith(`data:audio/`) ||
                      videoUrl.startsWith(`data:video/`) ||
                      /\.(mp3|wav|ogg|m4a|mp4|webm|mov)($|\?)/i.test(videoUrl)
                    ) {
                      videoSrc = videoUrl;
                      break;
                    }
                  }
                  if (sourceNode.data.imageUrl && typeof sourceNode.data.imageUrl == `string`) {
                    let imageUrl = sourceNode.data.imageUrl;
                    if (
                      imageUrl.startsWith(`data:video/`) ||
                      /\.(mp4|webm|mov|ogg)($|\?)/i.test(imageUrl)
                    ) {
                      videoSrc = imageUrl;
                      break;
                    }
                  }
                  if (sourceNode.data.text && typeof sourceNode.data.text == `string`) {
                    let urlMatch = sourceNode.data.text.match(
                      /(https?:\/\/[^\s"'`<>]+)|(data:(audio|video)\/[^\s"']+)/i,
                    );
                    if (urlMatch) {
                      videoSrc = urlMatch[0];
                      break;
                    }
                  }
                }
              }
            }
            if (!videoSrc) {
              nodeData.onShowToast?.(`请先上传视频或连接包含视频的节点`);
              return;
            }
            updateNodeData(nodeId, {
              loading: !0,
              errorMessage: void 0,
              progress: 0,
              extractedImages: [],
            });
            try {
              let videoEl = document.createElement(`video`);
              ((videoEl.src = videoSrc),
                (videoEl.crossOrigin = `anonymous`),
                (videoEl.muted = !0),
                (videoEl.playsInline = !0),
                await new Promise((resolve: any, reject: any) => {
                  ((videoEl.onloadedmetadata = resolve), (videoEl.onerror = reject));
                }));
              let duration = videoEl.duration;
              if (!duration || isNaN(duration) || duration === 1 / 0) throw Error(`无法获取视频时长`);
              let canvas = document.createElement(`canvas`),
                ctx = canvas.getContext(`2d`, {
                  willReadFrequently: !0
                });
              if (!ctx) throw Error(`Canvas 2D ctx not supported`);
              let width = videoEl.videoWidth,
                height = videoEl.videoHeight;
              ((width > 800 || height > 800) &&
                (width > height ?
                  ((height = Math.round((height * 800) / width)), (width = 800)) :
                  ((width = Math.round((width * 800) / height)), (height = 800))),
                (canvas.width = width),
                (canvas.height = height));
              let persistCapturedFrame = async (dataUrl, frameIndex) => {
                  if (!window.wanjuanDesktop?.persistProjectAsset) return dataUrl;
                  try {
                    let persisted = await window.wanjuanDesktop.persistProjectAsset({
                      url: dataUrl,
                      projectId: globalThis.__wanjuanCurrentProjectId || `default`,
                      nodeId,
                      field: `extracted-frame-${frameIndex}`,
                      kind: `image`,
                      filename: `frame-${String(frameIndex + 1).padStart(4, `0`)}.jpg`,
                      mime: `image/jpeg`,
                      directory: ``,
                    });
                    return persisted?.ok && persisted.localPath ? buildProjectMediaFileUrl(persisted.localPath) : dataUrl;
                  } catch {
                    return dataUrl;
                  }
                },
                captureFrame = async (time) =>
                new Promise((resolve: any) => {
                  let onSeeked = () => {
                    (videoEl.removeEventListener(`seeked`, onSeeked),
                      ctx.drawImage(videoEl, 0, 0, width, height),
                      resolve(canvas.toDataURL(`image/jpeg`, 0.8)));
                  };
                  (videoEl.addEventListener(`seeked`, onSeeked), (videoEl.currentTime = time));
                }),
                timestamps = [];
              if (mode === `count`) {
                let count = Math.max(1, _),
                  step = duration / (count + 1);
                for (let index = 1; index <= count; index++) timestamps.push(index * step);
              } else if (mode === `interval`) {
                let interval = Math.max(0.5, intervalSec);
                for (let time = interval; time < duration; time += interval) timestamps.push(time);
              } else if (mode === `smart`) {
                let sampleCanvas = document.createElement(`canvas`);
                ((sampleCanvas.width = 16), (sampleCanvas.height = 16));
                let sampleCtx = sampleCanvas.getContext(`2d`, {
                  willReadFrequently: !0
                });
                if (!sampleCtx) throw Error(`Canvas 2D ctx not supported`);
                let sampleFrame = async (time) =>
                  new Promise((resolve: any) => {
                    let onSeeked = () => {
                      (videoEl.removeEventListener(`seeked`, onSeeked),
                        sampleCtx.drawImage(videoEl, 0, 0, 16, 16),
                        resolve(sampleCtx.getImageData(0, 0, 16, 16).data));
                    };
                    (videoEl.addEventListener(`seeked`, onSeeked), (videoEl.currentTime = time));
                  }),
                  prevFrameData: any = null,
                  threshold = 195840 * (0.01 + 0.24 * ((100 - sensitivity) / 100) ** 2);
                for (let time = 0.5; time < duration; time += 0.5) {
                  wanjuanThrottledUpdateNodeData({
                    progress: Math.round((time / duration) * 50)
                  });
                  let frameData: any = await sampleFrame(time);
                  if (prevFrameData) {
                    let diff = 0;
                    for (let pixelIndex = 0; pixelIndex < frameData.length; pixelIndex += 4)
                      ((diff += Math.abs(frameData[pixelIndex] - prevFrameData[pixelIndex])),
                        (diff += Math.abs(frameData[pixelIndex + 1] - prevFrameData[pixelIndex + 1])),
                        (diff += Math.abs(frameData[pixelIndex + 2] - prevFrameData[pixelIndex + 2])));
                    if (diff > threshold) {
                      (timestamps.push(time), (time += 1), (prevFrameData = await sampleFrame(time)));
                      continue;
                    }
                  }
                  prevFrameData = frameData;
                }
              }
              timestamps.length === 0 && mode === `smart` && timestamps.push(duration / 2);
              let frames = [];
              for (let frameIndex = 0; frameIndex < timestamps.length; frameIndex++) {
                wanjuanThrottledUpdateNodeData({
                  progress: 50 + Math.round((frameIndex / timestamps.length) * 50)
                });
                let capturedFrame = await captureFrame(timestamps[frameIndex]),
                  frame = await persistCapturedFrame(capturedFrame, frameIndex);
                (frames.push(frame), wanjuanThrottledUpdateNodeData({
                  extractedImages: [...frames]
                }));
              }
              (updateNodeData(nodeId, {
                  loading: !1,
                  progress: 100,
                  allExtractedImages: frames,
                  extractedImages: frames,
                  hiddenIndices: [],
                  imageUrl: void 0,
                }),
                nodeData.onShowToast?.(`抽帧完成！共提取 ${frames.length} 张图片`),
                (videoEl.src = ``),
                videoEl.load());
            } catch (error) {
              (console.error(`Frame extraction failed:`, error),
                updateNodeData(nodeId, {
                  loading: !1,
                  errorMessage: error.message || `抽帧失败，可能是视频格式或跨域限制`,
                }));
            }
          },
          handleCopy = async (event) => {
            if (
              (event.stopPropagation(),
                !nodeData.extractedImages || nodeData.extractedImages.length === 0)
            ) {
              nodeData.onShowToast?.(`没有提取出的图片可复制`);
              return;
            }
            try {
              let clipboardData = {
                  type: `canvas-clipboard-images`,
                  images: nodeData.extractedImages,
                },
                json = JSON.stringify(clipboardData);
              try {
                await navigator.clipboard.writeText(json);
              } catch {
                localStorage.setItem(`canvas-clipboard`, json);
              }
              nodeData.onShowToast?.(`已复制 ${nodeData.extractedImages.length} 张图片`);
            } catch {
              nodeData.onShowToast?.(`复制失败`);
            }
          };
      let allFrames = Array.isArray(nodeData.allExtractedImages) ? nodeData.allExtractedImages : [],
        framePageSize = 60,
        framePageCount = Math.max(1, Math.ceil(allFrames.length / framePageSize)),
        safeFramePage = Math.min(framePage, framePageCount - 1),
        visibleFrameEntries = allFrames
          .map((imageSrc, index) => ({ imageSrc, index }))
          .filter((entry) => !hiddenIndices.includes(entry.index))
          .slice(safeFramePage * framePageSize, (safeFramePage + 1) * framePageSize),
        frameGridGap = 8,
        frameGridColumns = Math.max(1, Math.floor((Math.max(90, frameGridSize.width) + frameGridGap) / 98)),
        frameGridCellWidth = Math.max(72, (Math.max(90, frameGridSize.width) - frameGridGap * (frameGridColumns - 1)) / frameGridColumns),
        frameGridCellHeight = frameGridCellWidth * 9 / 16,
        frameGridRowHeight = frameGridCellHeight + frameGridGap,
        frameGridRowCount = Math.ceil(visibleFrameEntries.length / frameGridColumns),
        frameGridStartRow = Math.max(0, Math.floor(frameGridScrollTop / frameGridRowHeight) - 2),
        frameGridEndRow = Math.min(frameGridRowCount, Math.ceil((frameGridScrollTop + Math.max(120, frameGridSize.height)) / frameGridRowHeight) + 2),
        virtualFrameEntries = visibleFrameEntries.slice(frameGridStartRow * frameGridColumns, frameGridEndRow * frameGridColumns),
        renderedFrameIndices = new Set(virtualFrameEntries.map((entry) => entry.index)),
        connectedFrameIndices = Array.from(new Set(sourceConnections
          .map((connection) => String(connection.sourceHandle || ``).match(/^frame-(\d+)$/)?.[1])
          .filter((index): index is string => index !== void 0)
          .map(Number))),
        hiddenConnectedFrameIndices = connectedFrameIndices.filter((index) => !renderedFrameIndices.has(index));
      useEffect(() => {
        const viewport = frameGridViewportRef.current;
        if (!viewport) return;
        const updateSize = () => setFrameGridSize({ width: viewport.clientWidth, height: viewport.clientHeight });
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(viewport);
        return () => observer.disconnect();
      }, [safeFramePage, allFrames.length]);
      useEffect(() => {
        const viewport = frameGridViewportRef.current;
        if (!viewport) return;
        viewport.scrollTop = 0;
        setFrameGridScrollTop(0);
      }, [safeFramePage]);
      return jsxs(`div`, {
        className: `relative group/node w-full h-full min-w-[280px] min-h-[220px]`,
        children: [
          jsx(NodeResizer, {
            color: `#3b82f6`,
            isVisible: !!selected,
            minWidth: 280,
            minHeight: 220,
          }),
          jsxs(`div`, {
            className: `w-full h-full bg-[#1c1c1c] rounded-xl overflow-hidden border shadow-xl flex flex-col ${selected ? `border-blue-500` : `border-[#333]`}`,
            children: [
              jsx(WanJuanNodeHandle, {
                type: `target`,
                position: Position.Left
              }),
              jsxs(`div`, {
                className: `flex justify-between items-center px-3 py-2 border-b border-[#2a2a2a] bg-[#222] flex-shrink-0 drag-handle cursor-move`,
                children: [
                  jsxs(`div`, {
                    className: `flex items-center gap-2 text-gray-300`,
                    children: [
                      jsx(Film, {
                        size: 14,
                        className: `text-purple-400`
                      }),
                      jsx(`span`, {
                        className: `text-xs font-medium`,
                        children: `视频抽帧`,
                      }),
                    ],
                  }),
                  jsx(`div`, {
                    className: `flex items-center gap-1 nodrag`,
                    children: nodeData.allExtractedImages &&
                      nodeData.allExtractedImages.length > 0 &&
                      jsxs(`button`, {
                        onClick: (event) => handleCopy(event),
                        className: `text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333] transition-colors`,
                        children: [jsx(Copy, {
                          size: 12
                        }), ` 复制全部`],
                      }),
                  }),
                ],
              }),
              jsx(`input`, {
                type: `file`,
                ref: fileInputRef,
                style: {
                  display: `none`
                },
                accept: `video/*`,
                onChange: handleFileChange,
              }),
              jsxs(`div`, {
                className: `flex-1 flex flex-col overflow-hidden relative`,
                children: [
                  jsx(`div`, {
                    className: `flex-1 bg-[#111] p-2 overflow-hidden relative border-b border-[#2a2a2a]`,
                    children: nodeData.errorMessage ?
                      jsxs(`div`, {
                        className: `flex flex-col items-center justify-center h-full gap-2 text-red-400 p-4 text-center`,
                        children: [
                          jsx(CircleAlert, {
                            size: 24
                          }),
                          jsx(`span`, {
                            className: `text-xs break-words`,
                            children: nodeData.errorMessage,
                          }),
                        ],
                      }) :
                      nodeData.allExtractedImages && nodeData.allExtractedImages.length > 0 ?
                      jsxs(`div`, {
                        className: `flex flex-col h-full gap-2`,
                        children: [
                          jsxs(`div`, {
                            className: `flex justify-between items-center px-1`,
                            children: [
                              jsx(`span`, {
                                className: `text-[10px] text-gray-400`,
                                children: `已提取 ${nodeData.allExtractedImages.length} 帧 (当前生效 ${nodeData.extractedImages?.length || 0} 帧)`,
                              }),
                              framePageCount > 1 && jsxs(`div`, {
                                className: `flex items-center gap-1 text-[9px] text-gray-500`,
                                children: [
                                  jsx(`button`, {
                                    type: `button`,
                                    disabled: safeFramePage <= 0,
                                    onClick: (event) => { event.stopPropagation(); setFramePage(Math.max(0, safeFramePage - 1)); },
                                    className: `px-1.5 py-0.5 rounded border border-[#444] disabled:opacity-40`,
                                    children: `上一页`,
                                  }),
                                  jsx(`span`, { children: `${safeFramePage + 1}/${framePageCount}` }),
                                  jsx(`button`, {
                                    type: `button`,
                                    disabled: safeFramePage >= framePageCount - 1,
                                    onClick: (event) => { event.stopPropagation(); setFramePage(Math.min(framePageCount - 1, safeFramePage + 1)); },
                                    className: `px-1.5 py-0.5 rounded border border-[#444] disabled:opacity-40`,
                                    children: `下一页`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          jsx(`div`, {
                            ref: frameGridViewportRef,
                            className: `flex-1 min-h-0 overflow-y-auto custom-scrollbar`,
                            onScroll: (event) => setFrameGridScrollTop(event.currentTarget.scrollTop),
                            children: jsx(`div`, {
                              className: `relative w-full`,
                              style: { height: `${Math.max(1, frameGridRowCount * frameGridRowHeight - frameGridGap)}px` },
                              children: virtualFrameEntries.map(({ imageSrc, index }, virtualIndex) => {
                                const pageIndex = frameGridStartRow * frameGridColumns + virtualIndex,
                                  row = Math.floor(pageIndex / frameGridColumns),
                                  column = pageIndex % frameGridColumns;
                                return jsxs(
                                `div`, {
                                  className: `aspect-video bg-black rounded border relative group/img border-[#333]`,
                                  style: {
                                    position: `absolute`,
                                    left: `${column * (frameGridCellWidth + frameGridGap)}px`,
                                    top: `${row * frameGridRowHeight}px`,
                                    width: `${frameGridCellWidth}px`,
                                    height: `${frameGridCellHeight}px`,
                                  },
                                  children: [
                                    jsx(WanJuanNodeHandle, {
                                      type: `source`,
                                      position: Position.Right,
                                      id: `frame-${index}`,
                                      variant: `small`,
                                    }),
                                    jsx(`img`, {
                                      src: imageSrc,
                                      className: `w-full h-full object-cover`,
                                    }),
                                    jsx(`div`, {
                                      className: `absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3`,
                                      children: jsx(`button`, {
                                        onClick: (event) => {
                                          event.stopPropagation();
                                          try {
                                            let clipboardData = {
                                                type: `canvas-clipboard-images`,
                                                images: [imageSrc],
                                              },
                                              json = JSON.stringify(clipboardData);
                                            try {
                                              navigator.clipboard.writeText(
                                                json,
                                              );
                                            } catch {
                                              localStorage.setItem(
                                                `canvas-clipboard`,
                                                json,
                                              );
                                            }
                                            nodeData.onShowToast?.(
                                              `已复制当前帧，请在空白处粘贴 (Ctrl+V)`,
                                            );
                                          } catch {
                                            nodeData.onShowToast?.(`复制失败`);
                                          }
                                        },
                                        className: `p-2 bg-[#222] hover:bg-[#333] rounded-full text-gray-300 hover:text-blue-400 transition-colors`,
                                        title: `复制为新节点 (Ctrl+V粘贴)`,
                                        children: jsx(Copy, {
                                          size: 16,
                                        }),
                                      }),
                                    }),
                                  ],
                                },
                                index,
                              );
                              }),
                            }),
                          }),
                        ],
                      }) :
                      jsx(`div`, {
                        className: `flex items-center justify-center h-full`,
                        children: nodeData.loading ?
                          jsxs(`div`, {
                            className: `flex flex-col items-center gap-2`,
                            children: [
                              jsx(RefreshCw, {
                                size: 20,
                                className: `animate-spin text-purple-500`,
                              }),
                              jsxs(`span`, {
                                className: `text-xs text-gray-400`,
                                children: [`正在处理... `, nodeData.progress, `%`],
                              }),
                              jsx(`div`, {
                                className: `w-32 h-1 bg-[#333] rounded-full overflow-hidden`,
                                children: jsx(`div`, {
                                  className: `h-full bg-purple-500 transition-all duration-300`,
                                  style: {
                                    width: `${nodeData.progress}%`
                                  },
                                }),
                              }),
                            ],
                          }) :
                          jsx(`span`, {
                            className: `text-xs text-gray-600`,
                            children: `等待提取`,
                          }),
                      }),
                  }),
                  jsxs(`div`, {
                    className: `p-3 bg-[#1a1a1a] flex flex-col gap-3 nodrag border-t border-[#2a2a2a]`,
                    children: [
                      nodeData.videoUrl ?
                      jsxs(`div`, {
                        className: `w-full flex items-center justify-between bg-[#111] rounded px-3 py-2 border border-[#333]`,
                        children: [
                          jsxs(`div`, {
                            className: `flex items-center gap-2 overflow-hidden`,
                            children: [
                              jsx(CirclePlay, {
                                size: 14,
                                className: `text-blue-400 flex-shrink-0`,
                              }),
                              jsx(`span`, {
                                className: `text-xs text-gray-300 truncate`,
                                title: nodeData.videoName,
                                children: nodeData.videoName || `已连接视频`,
                              }),
                            ],
                          }),
                          jsx(`button`, {
                            onClick: () => fileInputRef.current?.click(),
                            className: `text-[10px] text-gray-500 hover:text-white flex-shrink-0 ml-2`,
                            children: `替换`,
                          }),
                        ],
                      }) :
                      jsxs(`div`, {
                        onClick: () => fileInputRef.current?.click(),
                        className: `w-full py-4 rounded-lg border border-dashed border-[#444] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#666] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors`,
                        children: [
                          jsx(Upload, {
                            size: 16,
                            className: `text-gray-500`,
                          }),
                          jsx(`span`, {
                            className: `text-[10px] text-gray-500`,
                            children: `点击上传视频或连接含视频的节点`,
                          }),
                        ],
                      }),
                      showMenu &&
                      jsxs(`div`, {
                        className: `flex flex-col gap-3 bg-[#111] border border-[#333] rounded p-3 mt-1`,
                        children: [
                          jsxs(`div`, {
                            className: `flex flex-col gap-1.5`,
                            children: [
                              jsx(`label`, {
                                className: `text-[10px] text-gray-400`,
                                children: `抽帧模式`,
                              }),
                              jsxs(`select`, {
                                value: mode,
                                onChange: (event) => setMode(event.target.value),
                                className: `w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-blue-500`,
                                children: [
                                  jsx(`option`, {
                                    value: `count`,
                                    children: `固定数量 (均匀分布)`,
                                  }),
                                  jsx(`option`, {
                                    value: `interval`,
                                    children: `等距抽帧 (间隔秒数)`,
                                  }),
                                  jsx(`option`, {
                                    value: `smart`,
                                    children: `智能转场检测`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          mode === `count` &&
                          jsxs(`div`, {
                            className: `flex flex-col gap-1.5`,
                            children: [
                              jsx(`label`, {
                                className: `text-[10px] text-gray-400`,
                                children: `提取总张数`,
                              }),
                              jsx(`input`, {
                                type: `number`,
                                min: `1`,
                                max: `100`,
                                value: _,
                                onChange: (event) => setFrameCount(Number(event.target.value)),
                                className: `w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-blue-500`,
                              }),
                            ],
                          }),
                          mode === `interval` &&
                          jsxs(`div`, {
                            className: `flex flex-col gap-1.5`,
                            children: [
                              jsx(`label`, {
                                className: `text-[10px] text-gray-400`,
                                children: `间隔秒数 (秒)`,
                              }),
                              jsx(`input`, {
                                type: `number`,
                                min: `0.5`,
                                max: `3600`,
                                step: `0.5`,
                                value: intervalSec,
                                onChange: (event) => setIntervalSec(Number(event.target.value)),
                                className: `w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-blue-500`,
                              }),
                            ],
                          }),
                          mode === `smart` &&
                          jsxs(`div`, {
                            className: `flex flex-col gap-1.5`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between`,
                                children: [
                                  jsx(`label`, {
                                    className: `text-[10px] text-gray-400`,
                                    children: `检测敏感度`,
                                  }),
                                  jsx(`span`, {
                                    className: `text-[10px] text-gray-500`,
                                    children: sensitivity,
                                  }),
                                ],
                              }),
                              jsx(`input`, {
                                type: `range`,
                                min: `1`,
                                max: `100`,
                                value: sensitivity,
                                onChange: (event) => setSensitivity(Number(event.target.value)),
                                className: `w-full accent-blue-500`,
                              }),
                              jsx(`span`, {
                                className: `text-[9px] text-gray-600`,
                                children: `数值越高越容易触发截图`,
                              }),
                            ],
                          }),
                        ],
                      }),
                      jsxs(`div`, {
                        className: `flex justify-between items-center mt-1`,
                        children: [
                          jsxs(`button`, {
                            className: `p-1.5 rounded flex items-center gap-1 transition-colors ${showMenu ? `text-blue-400 bg-[#333]` : `text-gray-400 hover:bg-[#333]`}`,
                            onClick: () => setShowMenu(!showMenu),
                            title: `参数配置`,
                            children: [
                              jsx(Settings2, {
                                size: 14
                              }),
                              jsx(`span`, {
                                className: `text-[10px]`,
                                children: showMenu ? `收起配置` : `配置`,
                              }),
                            ],
                          }),
                          jsxs(`button`, {
                            className: `px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all ${!nodeData.videoUrl || nodeData.loading ? `bg-[#2a2a2a] text-gray-500 cursor-not-allowed` : `bg-white text-black hover:bg-gray-200 shadow-lg`}`,
                            onClick: (event) => {
                              (event.stopPropagation(),
                                nodeData.videoUrl && !nodeData.loading ?
                                extractFrames() :
                                nodeData.videoUrl ||
                                nodeData.onShowToast?.(`请先上传或连接视频`));
                            },
                            children: [
                              nodeData.loading ? `正在处理...` : `开始处理`,
                              jsx(Image, {
                                size: 14
                              }),
                            ],
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
                id: `main-output`,
              }),
            ],
          }),
          ...hiddenConnectedFrameIndices.map((index, anchorIndex) =>
            jsx(`div`, {
              className: `absolute right-0 w-px h-px opacity-0 pointer-events-none`,
              style: { top: `${Math.min(90, 10 + anchorIndex * 5)}%` },
              children: jsx(WanJuanNodeHandle, {
                type: `source`,
                position: Position.Right,
                id: `frame-${index}`,
                variant: `small`,
              }),
            }, `connected-frame-anchor-${index}`),
          ),
        ],
      });
    });
