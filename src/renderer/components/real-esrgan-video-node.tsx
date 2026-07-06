/**
 * 视频超分节点：调用桌面端 Real-ESRGAN 逐帧超分，带任务轮询与进度回写。
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Position, useReactFlow, useNodesData, useNodeConnections } from "@xyflow/react";
import { Download } from "lucide-react";
import { WanJuanNodeHandle, WanJuanUseThrottledNodeDataUpdate } from "./render-mode";
import { buildProjectMediaFileUrl } from "../lib/resource";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

export const WanJuanRealEsrganVideoNode = reactMemo(({
	        id: nodeId,
	        data: nodeData,
	        selected: selected
	      }: any) => {
	        let {
	          updateNodeData: updateNodeData
	        } = useReactFlow(),
	        sourceNodes = useNodesData(useNodeConnections({
	          handleType: `target`
	        }).map((edge) => edge.source)),
	        videoSource = useMemo(() => {
	          for (let sourceNode of sourceNodes) {
	            let nodeData2 = sourceNode?.data || {};
	            let isVideoUrl = (url) => typeof url == `string` && (/^data:video\//i.test(url.trim()) || /\.(mp4|webm|mov|m4v|ogg)($|\?)/i.test(url.trim())),
	              mediaPath = nodeData2.mediaKind === `video` && (nodeData2.localPath || nodeData2.filePath) ? buildProjectMediaFileUrl(nodeData2.localPath || nodeData2.filePath) : ``;
	            if (nodeData2.videoUrl) return {
	              url: nodeData2.videoUrl,
	              filename: nodeData2.videoName || nodeData2.label || `video-${Date.now()}.mp4`
	            };
	            if (nodeData2.imageUrl && (nodeData2.mediaKind === `video` || isVideoUrl(nodeData2.imageUrl) || /\.(mp4|webm|mov|m4v|ogg)$/i.test(String(nodeData2.videoName || nodeData2.label || ``)))) return {
	              url: nodeData2.imageUrl,
	              filename: nodeData2.videoName || nodeData2.label || nodeData2.originalName || `video-${Date.now()}.mp4`
	            };
	            if (mediaPath) return {
	              url: mediaPath,
	              filename: nodeData2.videoName || nodeData2.label || nodeData2.originalName || `video-${Date.now()}.mp4`
	            };
	            if (typeof nodeData2.text == `string` && /^https?:\/\/|^file:\/\/|^data:video\//i.test(nodeData2.text.trim())) return {
	              url: nodeData2.text.trim(),
	              filename: `linked-video-${Date.now()}.mp4`
	            };
	            if (typeof nodeData2.resultData == `string` && /^https?:\/\/|^file:\/\/|^data:video\//i.test(nodeData2.resultData.trim())) return {
	              url: nodeData2.resultData.trim(),
	              filename: `result-video-${Date.now()}.mp4`
	            };
	          }
	          return null;
	        }, [sourceNodes]),
	        upscaleScale = Number(nodeData.upscaleScale || 2) === 4 ? 4 : 2,
	        s = [`realesrgan-x4plus`, `realesrgan-x4plus-anime`, `realesr-animevideov3`].includes(nodeData.upscaleModel) ? nodeData.upscaleModel : `realesrgan-x4plus`,
	        keepAudio = nodeData.keepAudio !== !1,
	        unsubscribeRef = useRef(null),
	        jobIdRef = useRef(null),
	        wanjuanThrottledUpdateNodeData = WanJuanUseThrottledNodeDataUpdate(nodeId, updateNodeData),
	        pollJobStatus = useCallback(async () => {
	          if (!window.wanjuanDesktop?.getRealEsrganJobStatus) return;
	          let jobStatus = await window.wanjuanDesktop.getRealEsrganJobStatus({
	            nodeId: nodeId,
	            jobId: nodeData.realEsrganJobId || jobIdRef.current || void 0
	          }).catch(() => null);
	          if (!jobStatus?.ok) return;
	          if (jobStatus.running) {
	            jobIdRef.current = jobStatus.jobId || jobIdRef.current;
	            wanjuanThrottledUpdateNodeData({
	              loading: !0,
	              realEsrganJobId: jobStatus.jobId || nodeData.realEsrganJobId || jobIdRef.current,
	              realEsrganProgress: jobStatus.percent || 0,
	              realEsrganStage: jobStatus.stage || `后台超分处理中`,
	              realEsrganPaused: !!jobStatus.paused,
	              errorMsg: null
	            });
	          } else if (nodeData.loading && (nodeData.realEsrganJobId || jobIdRef.current)) {
	            updateNodeData(nodeId, {
	              loading: !1,
	              realEsrganJobId: null,
	              realEsrganPaused: !1
	            });
	          }
	        }, [nodeId, wanjuanThrottledUpdateNodeData, updateNodeData, nodeData.loading, nodeData.realEsrganJobId]),
	        togglePause = async () => {
	          let jobId = nodeData.realEsrganJobId || jobIdRef.current;
	          if (!jobId || !window.wanjuanDesktop?.setRealEsrganPaused) return;
	          let nextPaused = !nodeData.realEsrganPaused;
	          updateNodeData(nodeId, {
	            realEsrganPaused: nextPaused
	          });
	          let pauseResult = await window.wanjuanDesktop.setRealEsrganPaused({
	            jobId: jobId,
	            paused: nextPaused
	          });
	          pauseResult?.ok || (updateNodeData(nodeId, {
	            realEsrganPaused: !1,
	            errorMsg: pauseResult?.error || `暂停控制失败`
	            }), nodeData.onShowToast?.(pauseResult?.error || `暂停控制失败`));
	        },
	        handleUpscale = async () => {
	          if (!videoSource?.url) {
	            nodeData.onShowToast?.(`请先连接一个视频节点`);
	            return;
	          }
	          if (!window.wanjuanDesktop?.upscaleVideoWithRealEsrgan) {
	            nodeData.onShowToast?.(`本地视频超分能力不可用，请重启应用`);
	            return;
	          }
	          let jobId = `real-esrgan-${nodeId}-${Date.now()}`;
	          jobIdRef.current = jobId;
	          unsubscribeRef.current?.();
	          unsubscribeRef.current = window.wanjuanDesktop?.onRealEsrganProgress?.(jobId, (progress) => {
	            wanjuanThrottledUpdateNodeData({
	              realEsrganJobId: jobId,
	              realEsrganProgress: progress.percent || 0,
	              realEsrganStage: progress.stage || `处理中`,
	              realEsrganPaused: !!progress.paused
	            });
	          }) || null;
	          updateNodeData(nodeId, {
	            loading: !0,
	            errorMsg: null,
	            realEsrganJobId: jobId,
	            realEsrganProgress: 0,
	            realEsrganStage: `准备中`,
	            realEsrganPaused: !1
	          });
	          try {
	            let upscaleResult = await window.wanjuanDesktop.upscaleVideoWithRealEsrgan({
	              jobId: jobId,
	              nodeId: nodeId,
	              url: videoSource.url,
	              filename: videoSource.filename,
	              scale: upscaleScale,
	              model: s,
	              keepAudio: keepAudio
	            });
	            if (!upscaleResult?.ok || !upscaleResult.url) throw Error(upscaleResult?.error || `视频超分失败`);
	            (updateNodeData(nodeId, {
	              loading: !1,
	              errorMsg: null,
	              videoUrl: upscaleResult.url,
	              videoName: upscaleResult.filename || `Real-ESRGAN超分视频.mp4`,
	              resultData: upscaleResult.url,
	              text: upscaleResult.url,
	              mediaKind: `video`,
	              realEsrganProgress: 100,
	              realEsrganStage: `完成`,
	              realEsrganPaused: !1,
	              realEsrganJobId: null
	            }), nodeData.onShowToast?.(`本地视频超分完成`));
	          } catch (error) {
	            console.error(`Real-ESRGAN upscale failed`, error);
	            updateNodeData(nodeId, {
	              loading: !1,
	              errorMsg: error?.message || `视频超分失败`,
	              realEsrganPaused: !1,
	              realEsrganJobId: null
	            });
	          } finally {
	            unsubscribeRef.current?.();
	            unsubscribeRef.current = null;
	            jobIdRef.current = null;
	          }
	        };
	        useEffect(() => {
	          pollJobStatus();
	          let intervalId = window.setInterval(pollJobStatus, 3000);
	          return () => window.clearInterval(intervalId);
	        }, [pollJobStatus]);
	        return jsxs(`div`, {
	          className: `w-[320px] bg-[#1a1a1a] rounded-xl shadow-2xl border-2 transition-colors overflow-hidden ${selected ? `border-sky-400` : `border-[#333] hover:border-[#444]`}`,
	          children: [
	            jsx(WanJuanNodeHandle, {
	              type: `target`,
	              position: Position.Left,
	              id: `video-input`,
	              className: `!bg-sky-500`
	            }),
	            jsxs(`div`, {
	              className: `flex items-center gap-2 p-3 border-b border-[#333] bg-[#222] rounded-t-xl text-gray-300 drag-handle cursor-grab active:cursor-grabbing`,
	              children: [
	                jsx(`span`, {
	                  className: `text-sky-300 text-sm leading-none`,
	                  children: `⬈`
	                }),
	                jsx(`span`, {
	                  className: `text-xs font-bold`,
	                  children: `本地视频超分`
	                }),
	              ],
	            }),
	            jsxs(`div`, {
	              className: `p-3 space-y-3`,
	              children: [
	                jsx(`div`, {
	                  className: `border border-[#333] rounded-lg bg-[#111] aspect-video overflow-hidden flex items-center justify-center`,
	                  children: nodeData.videoUrl ?
	                  jsx(`video`, {
	                    src: nodeData.videoUrl,
	                    controls: !0,
	                    className: `w-full h-full object-contain`,
	                    preload: `metadata`
	                  }) :
	                  videoSource?.url ?
	                  jsxs(`div`, {
	                    className: `text-xs text-gray-400 flex flex-col items-center gap-1`,
	                    children: [
	                      jsx(`span`, {
	                        className: `text-sky-300 text-lg`,
	                        children: `▶`
	                      }),
	                      jsx(`span`, {
	                        children: `已接收视频`
	                      }),
	                    ],
	                  }) :
	                  jsx(`span`, {
	                    className: `text-[11px] text-gray-600`,
	                    children: `连接视频后进行本地超分增强`
	                  }),
	                }),
	                jsxs(`div`, {
	                  className: `grid grid-cols-2 gap-1.5`,
	                  children: [
	                    [2, `2x`],
	                    [4, `4x`],
	                  ].map(([scaleValue, label]) => jsx(`button`, {
	                    type: `button`,
	                    onClick: () => updateNodeData(nodeId, {
	                      upscaleScale: scaleValue
	                    }),
	                    disabled: nodeData.loading,
	                    className: `h-7 rounded-md border text-[11px] font-semibold transition-colors nodrag nopan ${upscaleScale === scaleValue ? `bg-sky-500/18 border-sky-300/70 text-sky-50 shadow-sm shadow-sky-500/20` : `bg-[#222] border-[#3a3a3a] text-gray-400 hover:bg-[#2d2d2d]`}`,
	                    children: label
	                  }, scaleValue)),
	                }),
	                jsx(`select`, {
	                  value: s,
	                  onChange: (event) => updateNodeData(nodeId, {
	                    upscaleModel: event.target.value
	                  }),
	                  disabled: nodeData.loading,
	                  className: `w-full h-8 bg-[#111] border border-[#333] rounded-md px-2 text-[11px] text-gray-200 outline-none focus:border-sky-400 nodrag nopan`,
	                  children: [
	                    jsx(`option`, {
	                      value: `realesrgan-x4plus`,
	                      children: `写实通用模型`
	                    }),
	                    jsx(`option`, {
	                      value: `realesrgan-x4plus-anime`,
	                      children: `动漫插画模型`
	                    }),
	                    jsx(`option`, {
	                      value: `realesr-animevideov3`,
	                      children: `动漫视频模型`
	                    }),
	                  ],
	                }),
	                jsxs(`label`, {
	                  className: `flex items-center justify-between text-[11px] text-gray-300 bg-[#111] border border-[#333] rounded-md px-2 py-1.5`,
	                  children: [
	                    jsx(`span`, {
	                      children: `保留原视频音频`
	                    }),
	                    jsx(`input`, {
	                      type: `checkbox`,
	                      checked: keepAudio,
	                      onChange: (event) => updateNodeData(nodeId, {
	                        keepAudio: event.target.checked
	                      }),
	                      className: `nodrag nopan`
	                    }),
	                  ],
	                }),
	                nodeData.loading &&
	                jsxs(`div`, {
	                  className: `rounded-lg border border-sky-500/25 bg-sky-500/8 px-2.5 py-2 space-y-1.5`,
	                  children: [
	                    jsxs(`div`, {
	                      className: `flex items-center justify-between gap-2 text-[10px] text-sky-100`,
	                      children: [
	                        jsx(`span`, {
	                          className: `truncate`,
	                          children: nodeData.realEsrganPaused ? `已暂停` : nodeData.realEsrganStage || `超分处理中`
	                        }),
	                        jsx(`span`, {
	                          className: `font-mono text-sky-200`,
	                          children: `${Math.max(0, Math.min(100, Math.round(Number(nodeData.realEsrganProgress || 0))))}%`
	                        }),
	                      ],
	                    }),
	                    jsx(`div`, {
	                      className: `h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/5`,
	                      children: jsx(`div`, {
	                        className: `h-full rounded-full bg-sky-400 transition-[width] duration-300`,
	                        style: {
	                          width: `${Math.max(3, Math.min(100, Math.round(Number(nodeData.realEsrganProgress || 0))))}%`
	                        }
	                      })
	                    }),
	                    jsx(`button`, {
	                      type: `button`,
	                      onClick: togglePause,
	                      className: `w-full h-7 rounded-md border border-sky-300/40 bg-[#111] text-[11px] text-sky-100 hover:bg-sky-500/15 transition-colors nodrag nopan`,
	                      children: nodeData.realEsrganPaused ? `继续处理` : `暂停处理`
	                    }),
	                  ],
	                }),
	                jsx(`button`, {
	                  onClick: handleUpscale,
	                  disabled: !videoSource?.url || nodeData.loading,
	                  className: `w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-colors ${videoSource?.url && !nodeData.loading ? `bg-sky-600 hover:bg-sky-500 text-white border-sky-300/80` : `bg-[#222] text-gray-500 border-[#444] cursor-not-allowed`}`,
	                  children: nodeData.loading ? `超分处理中...` : `开始超分`
	                }),
	                jsx(`div`, {
	                  className: `text-[10px] text-gray-500 leading-4`,
	                  children: `本地处理会占用较多性能，建议先用短视频测试。`
	                }),
	                nodeData.errorMsg &&
	                jsx(`div`, {
	                  className: `text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 break-words`,
	                  children: nodeData.errorMsg
	                }),
	              ],
	            }),
	            jsx(WanJuanNodeHandle, {
	              type: `source`,
	              position: Position.Right,
	              id: `video`
	            }),
	          ],
	        });
	      });
