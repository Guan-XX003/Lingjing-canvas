/**
 * 声音克隆节点：基于 Qwen TTS 的声音克隆试听与合成，走桌面端 cloneVoiceWithQwenTts。
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Position, useReactFlow, useNodesData, useNodeConnections } from "@xyflow/react";
import { Download } from "lucide-react";
import { WanJuanNodeHandle, WanJuanUseThrottledNodeDataUpdate } from "./render-mode";
import { buildProjectMediaFileUrl } from "../lib/resource";

export const WanJuanQwenTtsCloneNode = reactMemo(({
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
	            let localMediaUrl = sourceData.localPath || sourceData.filePath ? buildProjectMediaFileUrl(sourceData.localPath || sourceData.filePath) : ``,
	              sourceUrl = sourceData.audioUrl || sourceData.videoUrl || localMediaUrl || sourceData.imageUrl || sourceData.resultData || sourceData.text || ``;
	            if (typeof sourceUrl == `string` && /^(https?:\/\/|file:\/\/|data:audio\/|data:video\/|blob:)/i.test(sourceUrl.trim())) return {
	              url: sourceUrl.trim(),
	              filename: sourceData.audioName || sourceData.videoName || sourceData.label || `reference-${Date.now()}`
	            };
	          }
	          return null;
	        }, [sourceIds]),
	        [prompt, setPrompt] = useState(nodeData.prompt || ``),
	        [refText, setRefText] = useState(nodeData.refText || ``),
	        [outputFormat, setOutputFormat] = useState(nodeData.outputFormat || `mp3`),
	        [authorized, setAuthorized] = useState(nodeData.authorized === !0),
	        [ttsMode, setTtsMode] = useState(nodeData.qwenTtsMode || `clone`),
	        [speaker, setSpeaker] = useState(nodeData.speaker || `Vivian`),
	        [language, setLanguage] = useState(nodeData.language || `Auto`),
	        [instruct, setInstruct] = useState(nodeData.instruct || ``),
	        speakerOptions = [
	          `Vivian`,
	          `Serena`,
	          `Uncle_Fu`,
	          `Dylan`,
	          `Eric`,
	          `Ryan`,
	          `Aiden`,
	          `Ono_Anna`,
	          `Sohee`,
	        ],
	        languageOptions = [`Auto`, `Chinese`, `English`, `Japanese`, `Korean`, `German`, `French`, `Russian`, `Portuguese`, `Spanish`, `Italian`],
	        handleGenerate = async () => {
	          if (!prompt.trim()) {
	            nodeData.onShowToast?.(`请输入要朗读的文本`);
	            return;
	          }
	          if (ttsMode === `clone` && !sourceMedia?.url) {
	            nodeData.onShowToast?.(`请连接一个参考音频或带音频的视频节点`);
	            return;
	          }
	          if (ttsMode === `clone` && !refText.trim()) {
	            nodeData.onShowToast?.(`请输入参考音频原文`);
	            return;
	          }
	          if (ttsMode === `clone` && !authorized) {
	            nodeData.onShowToast?.(`请先勾选确认拥有该声音授权`);
	            return;
	          }
	          if (!window.wanjuanDesktop?.cloneVoiceWithQwenTts) {
	            nodeData.onShowToast?.(`Qwen-TTS 本地克隆能力不可用，请重启应用`);
	            return;
	          }
	          updateNodeData(nodeId, {
	            loading: !0,
	            errorMsg: null
	          });
	          try {
	            let result = await window.wanjuanDesktop.cloneVoiceWithQwenTts({
	              url: sourceMedia?.url,
	              filename: sourceMedia?.filename,
	              mode: ttsMode,
	              text: prompt.trim(),
	              refText: refText.trim(),
	              format: outputFormat,
	              authorized: authorized,
	              speaker: speaker,
	              language: language,
	              instruct: instruct.trim()
	            });
	            if (!result?.ok || !result.url) throw Error(result?.error || `语音生成失败`);
	            (updateNodeData(nodeId, {
	              loading: !1,
	              errorMsg: null,
	              audioUrl: result.url,
	              audioName: result.filename || `qwen-tts-clone.${outputFormat}`,
	              resultData: result.url,
	              text: result.url,
	              mediaKind: `audio`
	            }), nodeData.addTransitResource?.(result.url, `audio`, result.filename || `Qwen-TTS 音频`), nodeData.onShowToast?.(`Qwen-TTS 语音生成完成`));
	          } catch (error) {
	            console.error(`Qwen TTS clone failed`, error);
	            updateNodeData(nodeId, {
	              loading: !1,
	              errorMsg: error?.message || `语音生成失败`
	            });
	          }
	        };
	        useEffect(() => {
	          updateNodeData(nodeId, {
	            prompt: prompt,
	            refText: refText,
	            outputFormat: outputFormat,
	            authorized: authorized,
	            qwenTtsMode: ttsMode,
	            speaker: speaker,
	            language: language,
	            instruct: instruct
	          });
	        }, [nodeId, updateNodeData, prompt, refText, outputFormat, authorized, ttsMode, speaker, language, instruct]);
	        return jsxs(`div`, {
	          className: `w-[340px] bg-[#1a1a1a] rounded-xl shadow-2xl border-2 transition-colors overflow-hidden ${selected ? `border-amber-400` : `border-[#333] hover:border-[#444]`}`,
	          children: [
	            jsx(WanJuanNodeHandle, {
	              type: `target`,
	              position: Position.Left,
	              id: `reference-input`,
	              className: `!bg-amber-500`
	            }),
	            jsxs(`div`, {
	              className: `flex items-center gap-2 p-3 border-b border-[#333] bg-[#222] rounded-t-xl text-gray-300 drag-handle cursor-grab active:cursor-grabbing`,
	              children: [
	                jsx(`span`, {
	                  className: `text-amber-300 text-sm leading-none`,
	                  children: `♫`
	                }),
	                jsx(`span`, {
	                  className: `text-xs font-bold`,
	                  children: `Qwen-TTS 语音生成`
	                }),
	              ],
	            }),
	            jsxs(`div`, {
	              className: `p-3 space-y-3`,
	              children: [
	                jsx(`div`, {
	                  className: `border border-[#333] rounded-lg bg-[#111] min-h-[44px] overflow-hidden flex items-center justify-center`,
	                  children: nodeData.audioUrl ?
	                  jsx(`audio`, {
	                    src: nodeData.audioUrl,
	                    controls: !0,
	                    className: `w-full h-9`
	                  }) :
	                  sourceMedia?.url ?
	                  jsxs(`div`, {
	                    className: `text-xs text-gray-400 flex items-center gap-2`,
	                    children: [
	                      jsx(`span`, {
	                        className: `text-amber-300`,
	                        children: `已接收参考音频`
	                      }),
	                    ],
	                  }) :
	                  jsx(`span`, {
	                    className: `text-[11px] text-gray-600`,
	                    children: ttsMode === `clone` ? `连接音频或带音频的视频作为参考` : `自定义语音模式无需连接参考`
	                  }),
	                }),
	                jsxs(`div`, {
	                  className: `grid grid-cols-2 gap-1.5`,
	                  children: [
	                    [`clone`, `音色克隆`],
	                    [`custom`, `自定义语音`],
	                  ].map(([mode, label]) => jsx(`button`, {
	                    type: `button`,
	                    onClick: () => setTtsMode(mode),
	                    disabled: nodeData.loading,
	                    className: `h-7 rounded-md border text-[11px] font-semibold transition-colors nodrag nopan ${ttsMode === mode ? `bg-amber-500/18 border-amber-300/70 text-amber-50 shadow-sm shadow-amber-500/20` : `bg-[#222] border-[#3a3a3a] text-gray-400 hover:bg-[#2d2d2d]`}`,
	                    children: label
	                  }, mode)),
	                }),
	                jsx(`textarea`, {
	                  value: prompt,
	                  onChange: (event) => setPrompt(event.target.value),
	                  placeholder: `输入要朗读的新文本`,
	                  className: `w-full h-20 bg-[#111] border border-[#333] rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-amber-400 resize-none nodrag nopan`
	                }),
	                ttsMode === `clone` ?
	                jsx(`textarea`, {
	                  value: refText,
	                  onChange: (event) => setRefText(event.target.value),
	                  placeholder: `参考音频原文 ref_text（参考音频里说了什么）`,
	                  className: `w-full h-16 bg-[#111] border border-[#333] rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-amber-400 resize-none nodrag nopan`
	                }) :
	                jsxs(`div`, {
	                  className: `space-y-2`,
	                  children: [
	                    jsxs(`div`, {
	                      className: `grid grid-cols-2 gap-2`,
	                      children: [
	                        jsx(`select`, {
	                          value: speaker,
	                          onChange: (event) => setSpeaker(event.target.value),
	                          className: `h-8 bg-[#111] border border-[#333] rounded-md px-2 text-[11px] text-gray-200 outline-none focus:border-amber-400 nodrag nopan`,
	                          children: speakerOptions.map((speaker2) => jsx(`option`, {
	                            value: speaker2,
	                            children: speaker2
	                          }, speaker2)),
	                        }),
	                        jsx(`select`, {
	                          value: language,
	                          onChange: (event) => setLanguage(event.target.value),
	                          className: `h-8 bg-[#111] border border-[#333] rounded-md px-2 text-[11px] text-gray-200 outline-none focus:border-amber-400 nodrag nopan`,
	                          children: languageOptions.map((language2) => jsx(`option`, {
	                            value: language2,
	                            children: language2
	                          }, language2)),
	                        }),
	                      ],
	                    }),
	                    jsx(`textarea`, {
	                      value: instruct,
	                      onChange: (event) => setInstruct(event.target.value),
	                      placeholder: `情绪/语气指令（可选，如：温柔、开心、有力量感）`,
	                      className: `w-full h-14 bg-[#111] border border-[#333] rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-amber-400 resize-none nodrag nopan`
	                    }),
	                  ],
	                }),
	                jsxs(`div`, {
	                  className: `grid grid-cols-2 gap-1.5`,
	                  children: [
	                    [`mp3`, `MP3`],
	                    [`wav`, `WAV`],
	                  ].map(([format, label]) => jsx(`button`, {
	                    type: `button`,
	                    onClick: () => setOutputFormat(format),
	                    disabled: nodeData.loading,
	                    className: `h-7 rounded-md border text-[11px] font-semibold transition-colors nodrag nopan ${outputFormat === format ? `bg-amber-500/18 border-amber-300/70 text-amber-50 shadow-sm shadow-amber-500/20` : `bg-[#222] border-[#3a3a3a] text-gray-400 hover:bg-[#2d2d2d]`}`,
	                    children: label
	                  }, format)),
	                }),
	                ttsMode === `clone` &&
	                jsxs(`label`, {
	                  className: `flex items-start gap-2 text-[11px] text-gray-300 bg-[#111] border border-[#333] rounded-md px-2 py-2 leading-5`,
	                  children: [
	                    jsx(`input`, {
	                      type: `checkbox`,
	                      checked: authorized,
	                      onChange: (event) => setAuthorized(event.target.checked),
	                      className: `mt-1 nodrag nopan`
	                    }),
	                    jsx(`span`, {
	                      children: `我确认拥有该声音授权`
	                    }),
	                  ],
	                }),
	                jsx(`button`, {
	                  onClick: handleGenerate,
	                  disabled: (ttsMode === `clone` && !sourceMedia?.url) || nodeData.loading,
	                  className: `w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-colors ${(ttsMode !== `clone` || sourceMedia?.url) && !nodeData.loading ? `bg-amber-600 hover:bg-amber-500 text-white border-amber-300/80` : `bg-[#222] text-gray-500 border-[#444] cursor-not-allowed`}`,
	                  children: nodeData.loading ? `生成处理中...` : ttsMode === `clone` ? `开始克隆` : `生成语音`
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
	              id: `audio`
	            }),
	          ],
	        });
	      });
