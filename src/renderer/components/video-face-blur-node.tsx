/**
 * 视频人脸打码节点：调用桌面端 blurVideoFaces 对视频做人脸打码，支持下载与素材绑定回写。
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

export const WanJuanVideoFaceBlurNode = reactMemo(({
	        id: nodeId,
	        data: nodeData,
	        selected: selected
	      }: any) => {
	        let {
	          updateNodeData: updateNodeData
	        } = useReactFlow(),
	        sourceIds = useNodesData(useNodeConnections({
	          handleType: `target`
	        }).map((connection) => connection.source)),
	        sourceMedia = useMemo(() => {
	          for (let sourceNode of sourceIds) {
	            let sourceData = sourceNode?.data || {};
	            let isVideoUrl = (url) => typeof url == `string` && (/^data:video\//i.test(url.trim()) || /\.(mp4|webm|mov|m4v|ogg)($|\?)/i.test(url.trim())),
	              mediaUrl = sourceData.mediaKind === `video` && (sourceData.localPath || sourceData.filePath) ? buildProjectMediaFileUrl(sourceData.localPath || sourceData.filePath) : ``;
	            if (sourceData.videoUrl) return {
	              url: sourceData.videoUrl,
	              filename: sourceData.videoName || sourceData.label || `video-${Date.now()}.mp4`
	            };
	            if (sourceData.imageUrl && (sourceData.mediaKind === `video` || isVideoUrl(sourceData.imageUrl) || /\.(mp4|webm|mov|m4v|ogg)$/i.test(String(sourceData.videoName || sourceData.label || ``)))) return {
	              url: sourceData.imageUrl,
	              filename: sourceData.videoName || sourceData.label || sourceData.originalName || `video-${Date.now()}.mp4`
	            };
	            if (mediaUrl) return {
	              url: mediaUrl,
	              filename: sourceData.videoName || sourceData.label || sourceData.originalName || `video-${Date.now()}.mp4`
	            };
	            if (typeof sourceData.text == `string` && /^https?:\/\/|^file:\/\/|^data:video\//i.test(sourceData.text.trim())) return {
	              url: sourceData.text.trim(),
	              filename: `linked-video-${Date.now()}.mp4`
	            };
	            if (typeof sourceData.resultData == `string` && /^https?:\/\/|^file:\/\/|^data:video\//i.test(sourceData.resultData.trim())) return {
	              url: sourceData.resultData.trim(),
	              filename: `result-video-${Date.now()}.mp4`
	            };
	          }
	          return null;
	        }, [sourceIds]),
	        blurMode = [`mosaic`, `blur`, `solid`].includes(nodeData.blurMode) ? nodeData.blurMode : `mosaic`,
	        blurThreshold = Number.isFinite(Number(nodeData.blurThreshold)) ? Number(nodeData.blurThreshold) : 0.3,
	        maskScale = Number.isFinite(Number(nodeData.maskScale)) ? Number(nodeData.maskScale) : 1.3,
	        keepAudio = nodeData.keepAudio !== !1,
	        handleBlur = async () => {
	          if (!sourceMedia?.url) {
	            nodeData.onShowToast?.(`请先连接一个视频节点`);
	            return;
	          }
	          if (!window.wanjuanDesktop?.blurVideoFaces) {
	            nodeData.onShowToast?.(`视频人脸打码能力不可用，请重启应用`);
	            return;
	          }
	          updateNodeData(nodeId, {
	            loading: !0,
	            errorMsg: null
	          });
	          try {
	            let result = await window.wanjuanDesktop.blurVideoFaces({
	              url: sourceMedia.url,
	              filename: sourceMedia.filename,
	              mode: blurMode,
	              threshold: blurThreshold,
	              scale: maskScale,
	              keepAudio: keepAudio
	            });
	            if (!result?.ok || !result.url) throw Error(result?.error || `打码失败`);
	            (updateNodeData(nodeId, {
	              loading: !1,
	              errorMsg: null,
	              videoUrl: result.url,
	              videoName: result.filename || `人脸打码视频.mp4`,
	              localPath: result.localPath || null,
	              filePath: result.localPath || null,
	              resultData: result.url,
	              text: result.url,
	              mediaKind: `video`,
	              projectAssetBindings: result.localPath ? {
	                ...(nodeData.projectAssetBindings || {}),
	                videoUrl: {
	                  kind: `video`,
	                  localPath: result.localPath,
	                  filename: result.filename || `人脸打码视频.mp4`,
	                  mime: result.mime || `video/mp4`,
	                  size: result.size || 0,
	                  field: `videoUrl`,
	                  nodeId: nodeId,
	                },
	              } : nodeData.projectAssetBindings,
	            }), nodeData.addTransitResource?.(result.url, `video`, result.filename || `人脸打码视频.mp4`), nodeData.onShowToast?.(`视频人脸打码完成`));
	          } catch (error) {
	            console.error(`Video face blur failed`, error);
	            updateNodeData(nodeId, {
	              loading: !1,
	              errorMsg: error?.message || `打码失败`
	            });
	          }
	        },
	        handleDownload = async (event) => {
	          if ((event.stopPropagation(), !nodeData.videoUrl)) return;
	          let filename = nodeData.videoName || `人脸打码视频-${Date.now()}.mp4`;
	          try {
	            nodeData.onShowToast?.(`开始下载打码视频...`);
	            if (window.wanjuanDesktop?.saveDownload) {
	              let videoBinding = nodeData.projectAssetBindings?.videoUrl || {},
	                localPath = nodeData.localPath || nodeData.filePath || videoBinding.localPath || ``;
	              let saved = await window.wanjuanDesktop.saveDownload({
	                url: nodeData.videoUrl,
	                localPath: localPath,
	                mime: `video/mp4`,
	                filename: filename
	              });
	              if (saved?.ok) {
	                let savedUrl = saved.path ? buildProjectMediaFileUrl(saved.path) : nodeData.videoUrl;
	                (nodeData.addTransitResource?.(savedUrl, `video`, filename, `face-blur-download`),
	                  nodeData.onShowToast?.(saved.path ? `打码视频已保存：${saved.path}` : `打码视频已保存到下载目录`));
	                return;
	              }
	              if (saved?.canceled) return;
	              throw Error(saved?.error || `保存失败`);
	            }
	            if (typeof chrome < `u` && chrome.downloads) {
	              chrome.downloads.download({
	                url: nodeData.videoUrl,
	                filename: `wanjuan/${filename}`,
	                saveAs: !1
	              });
	              return;
	            }
	            let link = document.createElement(`a`);
	            ((link.href = nodeData.videoUrl),
	              (link.download = filename),
	              document.body.appendChild(link),
	              link.click(),
	              document.body.removeChild(link));
	          } catch (error) {
	            (console.error(`Video face blur download failed`, error),
	              nodeData.onShowToast?.(`下载失败，请重试`),
	              window.open(nodeData.videoUrl, `_blank`));
	          }
	        };
	        return jsxs(`div`, {
	          className: `w-[320px] bg-[#1a1a1a] rounded-xl shadow-2xl border-2 transition-colors overflow-hidden ${selected ? `border-rose-500` : `border-[#333] hover:border-[#444]`}`,
	          children: [
	            jsx(WanJuanNodeHandle, {
	              type: `target`,
	              position: Position.Left,
	              id: `video-input`,
	              className: `!bg-rose-500`
	            }),
	            jsxs(`div`, {
	              className: `flex items-center gap-2 p-3 border-b border-[#333] bg-[#222] rounded-t-xl text-gray-300 drag-handle cursor-grab active:cursor-grabbing`,
	              children: [
	                jsx(`span`, {
	                  className: `text-rose-300 text-sm leading-none`,
	                  children: `▣`
	                }),
	                jsx(`span`, {
	                  className: `text-xs font-bold`,
	                  children: `视频人脸打码`
	                }),
	              ],
	            }),
	            jsxs(`div`, {
	              className: `p-3 space-y-3`,
	              children: [
	                jsxs(`div`, {
	                  className: `relative group/face-blur-preview border border-[#333] rounded-lg bg-[#111] aspect-video overflow-hidden flex items-center justify-center`,
	                  children: [
	                    nodeData.videoUrl ?
	                    jsx(`video`, {
	                      src: nodeData.videoUrl,
	                      controls: !0,
	                      className: `w-full h-full object-contain`,
	                      preload: `metadata`
	                    }) :
	                    sourceMedia?.url ?
	                    jsxs(`div`, {
	                      className: `text-xs text-gray-400 flex flex-col items-center gap-1`,
	                      children: [
	                        jsx(`span`, {
	                          className: `text-rose-300 text-lg`,
	                          children: `▶`
	                        }),
	                        jsx(`span`, {
	                          children: `已接收视频`
	                        }),
	                      ],
	                    }) :
	                    jsx(`span`, {
	                      className: `text-[11px] text-gray-600`,
	                      children: `连接视频后自动追踪人脸打码`
	                    }),
	                    nodeData.videoUrl &&
	                    !nodeData.loading &&
	                    jsx(`button`, {
	                      type: `button`,
	                      onClick: handleDownload,
	                      onMouseDown: (event) => {
	                        (event.preventDefault(), event.stopPropagation());
	                      },
	                      onPointerDown: (event) => {
	                        (event.preventDefault(), event.stopPropagation());
	                      },
	                      title: `下载`,
	                      className: `absolute top-2 right-2 z-20 p-1.5 rounded-md bg-black/65 text-gray-200 border border-white/15 shadow-lg backdrop-blur-sm hover:bg-white/15 hover:text-white transition-colors nodrag nopan`,
	                      children: jsx(Download, {
	                        size: 14
	                      })
	                    }),
	                  ],
	                }),
	                jsxs(`div`, {
	                  className: `grid grid-cols-3 gap-1.5`,
	                  children: [
	                    [`mosaic`, `马赛克`],
	                    [`blur`, `模糊`],
	                    [`solid`, `色块`],
	                  ].map(([mode, label]) => jsx(`button`, {
	                    type: `button`,
	                    onClick: () => updateNodeData(nodeId, {
	                      blurMode: mode
	                    }),
	                    disabled: nodeData.loading,
	                    className: `h-7 rounded-md border text-[11px] font-semibold transition-colors nodrag nopan ${blurMode === mode ? `bg-rose-500/18 border-rose-300/70 text-rose-50 shadow-sm shadow-rose-500/20` : `bg-[#222] border-[#3a3a3a] text-gray-400 hover:bg-[#2d2d2d]`}`,
	                    children: label
	                  }, mode)),
	                }),
	                jsxs(`label`, {
	                  className: `block text-[11px] text-gray-400 space-y-1`,
	                  children: [
	                    jsxs(`div`, {
	                      className: `flex justify-between`,
	                      children: [
	                        jsx(`span`, {
	                          children: `检测阈值`
	                        }),
	                        jsx(`span`, {
	                          children: blurThreshold.toFixed(2)
	                        }),
	                      ],
	                    }),
	                    jsx(`input`, {
	                      type: `range`,
	                      min: `0.05`,
	                      max: `0.9`,
	                      step: `0.05`,
	                      value: blurThreshold,
	                      onChange: (event) => updateNodeData(nodeId, {
	                        blurThreshold: Number(event.target.value)
	                      }),
	                      className: `w-full nodrag nopan`
	                    }),
	                  ],
	                }),
	                jsxs(`label`, {
	                  className: `block text-[11px] text-gray-400 space-y-1`,
	                  children: [
	                    jsxs(`div`, {
	                      className: `flex justify-between`,
	                      children: [
	                        jsx(`span`, {
	                          children: `遮罩范围`
	                        }),
	                        jsx(`span`, {
	                          children: maskScale.toFixed(1)
	                        }),
	                      ],
	                    }),
	                    jsx(`input`, {
	                      type: `range`,
	                      min: `0.8`,
	                      max: `2.2`,
	                      step: `0.1`,
	                      value: maskScale,
	                      onChange: (event) => updateNodeData(nodeId, {
	                        maskScale: Number(event.target.value)
	                      }),
	                      className: `w-full nodrag nopan`
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
	                jsx(`button`, {
	                  onClick: handleBlur,
	                  disabled: !sourceMedia?.url || nodeData.loading,
	                  className: `w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-colors ${sourceMedia?.url && !nodeData.loading ? `bg-rose-600 hover:bg-rose-500 text-white border-rose-300/80` : `bg-[#222] text-gray-500 border-[#444] cursor-not-allowed`}`,
	                  children: nodeData.loading ? `打码处理中...` : `开始打码`
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
