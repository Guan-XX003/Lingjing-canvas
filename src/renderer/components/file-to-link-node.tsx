/**
 * 文件转公链节点：把本地文件经 TOS/七牛/自定义公链上传为可分享 URL。
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE } from "../lib/upload-defaults";
import { Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { WanJuanNodeHandle } from "./render-mode";

export const WanJuanFileToLinkNode = reactMemo(({
	        id: id,
	        data: data,
	        selected: selected
	      }: any) => {
	        let {
	          updateNodeData: updateNodeData
	        } = useReactFlow(),
	        sourceNodes = useNodesData(useNodeConnections({
	          handleType: `target`
	        }).map((connection) => connection.source)),
	        mediaSource = useMemo(() => {
	          for (let node of sourceNodes) {
	            let nodeData = node?.data || {};
	            if (nodeData.imageUrl) return {
	              url: nodeData.imageUrl,
	              kind: nodeData.mediaKind === `video` ? `video` : nodeData.mediaKind === `audio` ? `audio` : `image`,
	              filename: nodeData.originalName || nodeData.label || nodeData.videoName || `image-${Date.now()}.png`,
	            };
	            if (nodeData.videoUrl) return {
	              url: nodeData.videoUrl,
	              kind: `video`,
	              filename: nodeData.videoName || nodeData.label || `video-${Date.now()}.mp4`,
	            };
	            if (nodeData.audioUrl) return {
	              url: nodeData.audioUrl,
	              kind: `audio`,
	              filename: nodeData.audioName || nodeData.label || `audio-${Date.now()}.mp3`,
	            };
	            if (typeof nodeData.text == `string` && nodeData.text.trim())
	              return /^https?:\/\//i.test(nodeData.text.trim()) || /^data:/i.test(nodeData.text.trim()) || /^file:\/\//i.test(nodeData.text.trim()) ? {
	                url: nodeData.text.trim(),
	                kind: /\.(mp4|webm|mov|m4v)(\?|$)/i.test(nodeData.text.trim()) ? `video` : /\.(mp3|wav|m4a|aac|ogg)(\?|$)/i.test(nodeData.text.trim()) ? `audio` : `image`,
	                filename: `linked-media-${Date.now()}`,
	              } : {
	                text: nodeData.text,
	                kind: `text`,
	                filename: `text-${Date.now()}.txt`,
	              };
	            if (typeof nodeData.resultData == `string` && nodeData.resultData.trim())
	              return /^https?:\/\//i.test(nodeData.resultData.trim()) || /^data:/i.test(nodeData.resultData.trim()) || /^file:\/\//i.test(nodeData.resultData.trim()) ? {
	                url: nodeData.resultData.trim(),
	                kind: nodeData.customOutputType || `image`,
	                filename: `result-media-${Date.now()}`,
	              } : {
	                text: nodeData.resultData,
	                kind: `text`,
	                filename: `result-${Date.now()}.txt`,
	              };
	          }
	          return null;
	        }, [sourceNodes]),
	        qiniuConfig = data.qiniuConfig || {},
	        tosConfig = data.tosConfig || {},
	        customUploadConfig = data.customPublicUploadConfig || {},
	        initialUploadMode = [`tos`, `qiniu`, `custom`].includes(data.fileToLinkUploadMode) ? data.fileToLinkUploadMode : [`tos`, `qiniu`, `custom`].includes(data.seedanceUploadMode) ? data.seedanceUploadMode : WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE,
	        [uploadMode, setUploadMode] = useState(initialUploadMode),
	        activeUploadMode = uploadMode || initialUploadMode,
	        providerLabel = activeUploadMode === `tos` ? `火山 TOS` : activeUploadMode === `custom` ? `自定义` : `七牛云`,
	        isConfigured = activeUploadMode === `tos` ?
	        String(tosConfig.accessKeyId || tosConfig.accessKey || ``).trim() &&
	        String(tosConfig.secretAccessKey || tosConfig.secretKey || ``).trim() &&
	        String(tosConfig.bucket || ``).trim() &&
	        String(tosConfig.endpoint || ``).trim() :
	        activeUploadMode === `custom` ?
	        /^https?:\/\//i.test(String(customUploadConfig.endpoint || ``).trim()) :
	        String(qiniuConfig.accessKey || qiniuConfig.accessKeyId || ``).trim() &&
	        String(qiniuConfig.secretKey || qiniuConfig.secretAccessKey || ``).trim() &&
	        String(qiniuConfig.bucket || ``).trim() &&
	        String(qiniuConfig.endpoint || ``).trim(),
	        applyUploadMode = (mode) => {
	          !data.loading &&
	          (setUploadMode(mode),
	          updateNodeData(id, {
	            fileToLinkUploadMode: mode,
	            errorMsg: null
	          }));
	        },
	        handleModeSelect = (event, mode) => {
	          event.preventDefault();
	          event.stopPropagation();
	          applyUploadMode(mode);
	        },
	        nodeWidth = Math.max(280, Math.min(900, Number(data.nodeWidth) || 360)),
	        nodeHeight = Math.max(data.resultUrl ? 410 : 300, Math.min(720, Number(data.nodeHeight) || 300)),
	        startResize = (event) => {
	          event.preventDefault();
	          event.stopPropagation();
	          let startX = event.clientX,
	            startY = event.clientY,
	            startWidth = nodeWidth,
	            startHeight = nodeHeight,
	            handleMouseMove = (event2) => {
	              updateNodeData(id, {
	                nodeWidth: Math.max(280, Math.min(900, startWidth + event2.clientX - startX)),
	                nodeHeight: Math.max(280, Math.min(720, startHeight + event2.clientY - startY)),
	              });
	            },
	            handleMouseUp = () => {
	              window.removeEventListener(`mousemove`, handleMouseMove);
	              window.removeEventListener(`mouseup`, handleMouseUp);
	            };
	          window.addEventListener(`mousemove`, handleMouseMove);
	          window.addEventListener(`mouseup`, handleMouseUp);
	        },
	        handleUpload = async () => {
	          if (!mediaSource) {
	            data.onShowToast?.(`请先连接图片、视频、音频或文本节点`);
	            return;
	          }
	          if (!isConfigured || !window.wanjuanDesktop) {
	            data.onShowToast?.(`请先在云盘设置里完善${providerLabel}配置`);
	            updateNodeData(id, {
	              errorMsg: `${providerLabel}配置不完整`,
	              loading: !1
	            });
	            return;
	          }
	          if (activeUploadMode === `tos` && typeof window.wanjuanDesktop.uploadTosMedia != `function` || activeUploadMode === `custom` && typeof window.wanjuanDesktop.uploadCustomPublicMedia != `function` || activeUploadMode === `qiniu` && typeof window.wanjuanDesktop.uploadQiniuMedia != `function`) {
	            data.onShowToast?.(`${providerLabel}上传能力不可用，请重启应用后再试`);
	            updateNodeData(id, {
	              errorMsg: `${providerLabel}上传能力不可用`,
	              loading: !1
	            });
	            return;
	          }
	          updateNodeData(id, {
	            loading: !0,
	            errorMsg: null
	          });
	          try {
	            let uploadResult =
	              activeUploadMode === `tos` ?
	              await window.wanjuanDesktop.uploadTosMedia({
	                ...mediaSource,
	                tos: tosConfig
	              }) :
	              activeUploadMode === `custom` ?
	              await window.wanjuanDesktop.uploadCustomPublicMedia({
	                ...mediaSource,
	                customUpload: customUploadConfig
	              }) :
	              await window.wanjuanDesktop.uploadQiniuMedia({
	                ...mediaSource,
	                qiniu: qiniuConfig
	              });
	            if (!uploadResult?.ok || !uploadResult.url) throw Error(uploadResult?.error || `上传失败`);
	            (updateNodeData(id, {
	              resultUrl: uploadResult.url,
	              text: uploadResult.url,
	              loading: !1,
	              errorMsg: null
	            }), data.onShowToast?.(`${providerLabel}链接已生成`));
	          } catch (error) {
	            console.error(`File to link upload failed`, error);
	            updateNodeData(id, {
	              loading: !1,
	              errorMsg: error?.message || `上传失败`
	            });
	          }
	        };
	        return jsxs(`div`, {
	          className: `relative group/node bg-[#1a1a1a] rounded-xl shadow-2xl border-2 transition-colors overflow-hidden ${selected ? `border-cyan-500` : `border-[#333] hover:border-[#444]`}`,
	          style: {
	            width: nodeWidth,
	            height: nodeHeight
	          },
	          children: [
	            jsx(WanJuanNodeHandle, {
	              type: `target`,
	              position: Position.Left,
	              id: `file-input`,
	              className: `!bg-cyan-500`
	            }),
	            jsxs(`div`, {
	              className: `flex items-center gap-2 p-3 border-b border-[#333] bg-[#222] rounded-t-xl text-gray-300 flex-shrink-0 drag-handle cursor-grab active:cursor-grabbing`,
	              children: [
	                jsx(`span`, {
	                  className: `text-cyan-400 text-sm leading-none`,
	                  children: `🔗`
	                }),
	                jsx(`span`, {
	                  className: `text-xs font-bold`,
	                  children: `图片转链接`,
	                }),
	              ],
	            }),
	            jsxs(`div`, {
	              className: `p-3 space-y-3 h-[calc(100%-42px)] min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar`,
	              children: [
	                jsx(`div`, {
	                  className: `border border-[#333] rounded-lg bg-[#111] min-h-[72px] flex items-center justify-center overflow-hidden`,
	                  style: {
	                    height: 72,
	                    minHeight: 72,
	                    maxHeight: 72,
	                    width: `100%`
	                  },
	                  children: mediaSource ?
	                    mediaSource.kind === `image` && mediaSource.url ?
	                    jsx(`img`, {
	                      src: mediaSource.url,
	                      className: `w-full h-[72px] object-contain`,
	                      style: {
	                        width: `100%`,
	                        height: 72,
	                        maxHeight: 72,
	                        objectFit: `contain`,
	                        display: `block`
	                      },
	                      loading: `lazy`,
	                      decoding: `async`
	                    }) :
	                    jsxs(`div`, {
	                      className: `text-xs text-gray-400 flex flex-col items-center gap-1 px-3 text-center`,
	                      children: [
	                        jsx(`span`, {
	                          className: `text-cyan-400 text-lg leading-none`,
	                          children: mediaSource.kind === `video` ? `▶` : mediaSource.kind === `audio` ? `♫` : `TXT`,
	                        }),
	                        jsx(`span`, {
	                          children: mediaSource.kind === `text` ? `已接收文本内容` : `已接收${mediaSource.kind === `video` ? `视频` : mediaSource.kind === `audio` ? `音频` : `文件`}`,
	                        }),
	                      ],
	                    }) :
	                    jsx(`span`, {
	                      className: `text-[11px] text-gray-600`,
	                      children: `连接图片/文件后生成公网链接`,
	                    }),
	                }),
	                jsxs(`div`, {
	                  className: `grid grid-cols-3 gap-1.5`,
	                  children: [
	                    jsx(`button`, {
	                      type: `button`,
	                      "data-active": activeUploadMode === `tos` ? `true` : `false`,
	                      onPointerDown: (event) => handleModeSelect(event, `tos`),
	                      onMouseDown: (event) => handleModeSelect(event, `tos`),
	                      onClick: (event) => handleModeSelect(event, `tos`),
	                      disabled: data.loading,
	                      className: `h-7 rounded-md border text-[11px] font-semibold transition-colors nodrag nopan wanjuan-file-link-cloud-button ${activeUploadMode === `tos` ? `wanjuan-file-link-cloud-button-active` : ``}`,
	                      style: activeUploadMode === `tos` ? {
	                        background: `rgba(34, 211, 238, 0.14)`,
	                        borderColor: `rgba(103, 232, 249, 0.62)`,
	                        color: `#e0faff`,
	                        boxShadow: `0 0 0 1px rgba(103,232,249,0.28), 0 6px 16px rgba(8,145,178,0.18), inset 0 1px 0 rgba(255,255,255,0.08)`
	                      } : void 0,
	                      children: `火山 TOS`,
	                    }),
	                    jsx(`button`, {
	                      type: `button`,
	                      "data-active": activeUploadMode === `qiniu` ? `true` : `false`,
	                      onPointerDown: (event) => handleModeSelect(event, `qiniu`),
	                      onMouseDown: (event) => handleModeSelect(event, `qiniu`),
	                      onClick: (event) => handleModeSelect(event, `qiniu`),
	                      disabled: data.loading,
	                      className: `h-7 rounded-md border text-[11px] font-semibold transition-colors nodrag nopan wanjuan-file-link-cloud-button ${activeUploadMode === `qiniu` ? `wanjuan-file-link-cloud-button-active` : ``}`,
	                      style: activeUploadMode === `qiniu` ? {
	                        background: `rgba(34, 211, 238, 0.14)`,
	                        borderColor: `rgba(103, 232, 249, 0.62)`,
	                        color: `#e0faff`,
	                        boxShadow: `0 0 0 1px rgba(103,232,249,0.28), 0 6px 16px rgba(8,145,178,0.18), inset 0 1px 0 rgba(255,255,255,0.08)`
	                      } : void 0,
	                      children: `七牛云`,
	                    }),
	                    jsx(`button`, {
	                      type: `button`,
	                      "data-active": activeUploadMode === `custom` ? `true` : `false`,
	                      onPointerDown: (event) => handleModeSelect(event, `custom`),
	                      onMouseDown: (event) => handleModeSelect(event, `custom`),
	                      onClick: (event) => handleModeSelect(event, `custom`),
	                      disabled: data.loading,
	                      className: `h-7 rounded-md border text-[11px] font-semibold transition-colors nodrag nopan wanjuan-file-link-cloud-button ${activeUploadMode === `custom` ? `wanjuan-file-link-cloud-button-active` : ``}`,
	                      style: activeUploadMode === `custom` ? {
	                        background: `rgba(34, 211, 238, 0.14)`,
	                        borderColor: `rgba(103, 232, 249, 0.62)`,
	                        color: `#e0faff`,
	                        boxShadow: `0 0 0 1px rgba(103,232,249,0.28), 0 6px 16px rgba(8,145,178,0.18), inset 0 1px 0 rgba(255,255,255,0.08)`
	                      } : void 0,
	                      children: `自定义`,
	                    }),
	                  ],
	                }),
	                jsx(`button`, {
	                  onClick: handleUpload,
	                  disabled: !mediaSource || data.loading,
	                  className: `w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-sm transition-colors ${mediaSource && !data.loading ? `bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300/80 shadow-cyan-500/20` : `bg-[#222] text-gray-500 border-[#444] cursor-not-allowed`}`,
	                  children: data.loading ? `上传中...` : `生成链接`,
	                }),
	                data.errorMsg &&
	                jsx(`div`, {
	                  className: `text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 break-words`,
	                  children: data.errorMsg,
	                }),
	                data.resultUrl &&
	                jsxs(`div`, {
	                  className: `bg-[#10151c] border border-cyan-500/40 rounded-lg p-2 space-y-2 min-w-0 overflow-hidden`,
	                  children: [
	                    jsxs(`div`, {
	                      className: `flex items-center justify-between gap-2`,
	                      children: [
	                        jsx(`span`, {
	                          className: `text-[11px] text-gray-400`,
	                          children: `生成结果`,
	                        }),
	                        jsx(`button`, {
	                          className: `px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-[11px] text-cyan-200 hover:bg-cyan-500/20 hover:text-white`,
	                          onClick: () => {
	                            navigator.clipboard.writeText(data.resultUrl);
	                            data.onShowToast?.(`链接已复制`);
	                          },
	                          children: `复制`,
	                        }),
	                      ],
	                    }),
	                    jsx(`textarea`, {
	                      readOnly: !0,
	                      value: data.resultUrl,
	                      spellCheck: !1,
	                      className: `w-full h-20 min-h-[64px] max-h-[180px] resize-y bg-[#080d12] border border-[#334155] rounded-md px-2 py-1.5 text-[11px] text-gray-100 font-mono leading-relaxed outline-none focus:border-cyan-400 custom-scrollbar nodrag nopan`,
	                      style: {
	                        height: 108,
	                        minHeight: 88,
	                        maxHeight: 220,
	                        resize: `vertical`
	                      },
	                    }),
	                  ],
	                }),
	              ],
	            }),
	            jsx(`div`, {
	              className: `absolute right-1 bottom-1 w-4 h-4 rounded-sm border-r-2 border-b-2 border-cyan-300/70 cursor-nwse-resize nodrag nopan opacity-70 hover:opacity-100`,
	              title: `拖拽调整节点大小`,
	              onMouseDown: startResize,
	            }),
	            jsx(WanJuanNodeHandle, {
	              type: `source`,
	              position: Position.Right,
	              id: `url`
	            }),
	          ],
	        });
	      });
