/**
 * 文本节点：可编辑文本卡片，支持复制/展开收起/重新生成。（原 bundle 局部名 Pe）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import localforage from "localforage";
import { Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { ArrowUp, CircleAlert, Copy, Maximize2, Minimize2, Pen, RefreshCw, Square, Type, Upload } from "lucide-react";
import { WanJuanNodeHandle } from "../components/render-mode";
import { wanjuanRenderResourcePickerHeader, wanjuanRenderResourcePreview } from "../components/resource-picker";
import { wanjuanClearMentionPickerPosition, wanjuanMentionRangeFromPicker, wanjuanReplaceMentionToken, wanjuanShouldShowMentionPicker } from "../lib/mention";
import { WanJuanGetPreferredModel, WanJuanShouldAutoPreferredModel, WanJuanUseFavoriteModels } from "../lib/model-favorites";
import { WanJuanParseModelList, WanJuanSameModelId } from "../lib/model-id";
import { wanjuanResourceInList, wanjuanResourceKind, wanjuanResourceMatchesFilter } from "../lib/resource";
import { wanjuanUseBrokenResourceImage } from "../lib/resource-tabs";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

export const WanJuanTextNode = reactMemo(({
    id: nodeId,
    data: data,
    selected: selected
  }: any) => {
    let {
      updateNodeData: updateNodeData,
      setEdges: setEdges
    } = useReactFlow(),
      [prompt, setPrompt] = useState(data.prompt || ``),
      [text, setText] = useState(data.text || ``),
      [autoSplit, setAutoSplit] = useState(data.autoSplit || !1),
      [isExpanded, setExpanded] = useState(data.expanded === void 0 ? !0 : data.expanded),
      [selectedContextResources, setSelectedContextResources] = useState(data.selectedContextResources || []),
      [label, setLabel] = useState(data.label || `文本生成`),
      presetPrompts = data.presetPrompts || [],
      wanjuanSelectedReferenceSourceIds = Array.isArray(data.wanjuanSelectedReferenceSourceIds) ? data.wanjuanSelectedReferenceSourceIds : [],
      [isEditing, setIsEditing] = useState(!1),
      [selectedModel, setSelectedModel] = useState(() =>
        WanJuanGetPreferredModel(data.textModel, data.selectedModel || ``, void 0, {
          manual: data.wanjuanModelManual === !0,
          auto: data.wanjuanModelAuto === !0,
        }),
      ),
      favoriteModels = WanJuanUseFavoriteModels(),
      wanjuanModelManualRef = useRef(data.wanjuanModelManual === !0),
      fileInputRef = useRef(null),
      [isModelMenuOpen, setIsModelMenuOpen] = useState(!1),
      modelMenuRef = useRef(null),
	      [isMentionPickerOpen, setIsMentionPickerOpen] = useState(!1),
	      [currentPage, setCurrentPage] = useState(1),
	      [resourceTypeFilter, te] = useState(`all`),
	      [resourceSourceFilter, setResourceSourceFilter] = useState(`generated`),
	      [resourceFavoriteOnly, setResourceFavoriteOnly] = useState(!1),
      [resources, setResources] = useState([]),
      [ie, setIsPresetMenuOpen] = useState(!1),
      presetMenuRef = useRef(null);
    let applyPreferredTextModel = (favoritesOverride = favoriteModels.favorites) => {
      if (!data.textModel) return;
      let currentModel = selectedModel || data.selectedModel || ``;
      if (!WanJuanShouldAutoPreferredModel(data.textModel, currentModel, {
          manual: wanjuanModelManualRef.current || data.wanjuanModelManual === !0,
          auto: data.wanjuanModelAuto === !0,
        })) return;
      let nextModel = WanJuanGetPreferredModel(data.textModel, currentModel, favoritesOverride, {
        auto: !0
      });
      nextModel &&
        !WanJuanSameModelId(nextModel, currentModel) &&
        ((wanjuanModelManualRef.current = !1),
          setSelectedModel(nextModel),
          updateNodeData(nodeId, {
            selectedModel: nextModel,
            wanjuanModelAuto: !0,
            wanjuanModelManual: !1
          }));
    };
    (useEffect(() => {
        isMentionPickerOpen &&
          localforage
          .getItem(`transitResources`)
          .then((storedResources) => {
            storedResources && Array.isArray(storedResources) && storedResources.length > 0 ?
              setResources(storedResources) :
              typeof chrome < `u` &&
              chrome.storage &&
              chrome.storage.local.get([`transitResources`], (storedData) => {
                storedData.transitResources && setResources(storedData.transitResources);
              });
          })
          .catch((error) => {
            console.error(`Failed to fetch resources from localforage`, error);
          });
      }, [isMentionPickerOpen]),
      useEffect(() => {
        let handleClickOutside = (event) => {
          (modelMenuRef.current && !modelMenuRef.current.contains(event.target) && setIsModelMenuOpen(!1),
            presetMenuRef.current && !presetMenuRef.current.contains(event.target) && setIsPresetMenuOpen(!1));
        };
        return (
          (isModelMenuOpen || ie) && document.addEventListener(`mousedown`, handleClickOutside, !0),
          () => {
            document.removeEventListener(`mousedown`, handleClickOutside, !0);
          }
        );
      }, [isModelMenuOpen, ie]),
      useEffect(() => {
        (setPrompt(data.prompt || ``),
          data.text !== void 0 && setText(data.text),
          data.label !== void 0 && setLabel(data.label),
          data.selectedModel && setSelectedModel(data.selectedModel),
          data.selectedContextResources && setSelectedContextResources(data.selectedContextResources));
      }, [
        data.prompt,
        data.text,
        data.label,
        data.selectedModel,
        data.selectedContextResources,
      ]),
      useEffect(() => {
        applyPreferredTextModel();
      }, [data.textModel, selectedModel, data.wanjuanModelAuto, data.wanjuanModelManual, favoriteModels.favorites, nodeId, updateNodeData]));
    let connections = useNodeConnections({
        handleType: `target`
      }),
      oe = useNodesData(useMemo(() => connections.map((connection) => connection.source), [connections])),
      connectedContent = (() => {
        if (!oe) return {
          images: [],
          texts: []
        };
        let sourceList = Array.isArray(oe) ? oe : [oe],
          images = [],
          texts = [],
          processedSourceIds = new Set();
        return (
          sourceList.forEach((sourceNode: any) => {
            if (!sourceNode || processedSourceIds.has(sourceNode.id)) return; // 同源多条边只处理一次
            processedSourceIds.add(sourceNode.id);
            if (
              (sourceNode?.data?.imageUrl &&
                typeof sourceNode.data.imageUrl == `string` &&
                (sourceNode.data.imageUrl.startsWith(`http`) ||
                  sourceNode.data.imageUrl.startsWith(`data:`)) &&
                images.push({
	                  id: sourceNode.id,
	                  sourceId: sourceNode.id,
	                  url: sourceNode.data.imageUrl
	                }),
                sourceNode?.type === `videoExtractNode` && sourceNode?.data?.extractedImages)
            ) {
              let frameConnections = connections.filter((connection) => connection.source === sourceNode?.id && connection.sourceHandle && connection.sourceHandle.startsWith(`frame-`));
              if (frameConnections.length)
                frameConnections.forEach((matchedConnection) => { // 遍历该源每条 frame 边
                  let frameIndex = parseInt(matchedConnection.sourceHandle.replace(`frame-`, ``), 10);
                  if (!(sourceNode.data.hiddenIndices || []).includes(frameIndex)) {
                    let extractedImages = sourceNode.data.allExtractedImages;
	                    extractedImages && extractedImages[frameIndex] && images.push({
	                      id: `${sourceNode.id}-ext-${frameIndex}`,
	                      sourceId: sourceNode.id,
	                      url: extractedImages[frameIndex]
	                    });
                  }
                });
              else
                sourceNode.data.extractedImages.forEach((n, index) => {
	                  images.push({
	                    id: `${sourceNode.id}-ext-${index}`,
	                    sourceId: sourceNode.id,
	                    url: n
	                  });
                });
            }
	            (sourceNode?.type === `textNode` || sourceNode?.type === `promptNode`) &&
	              sourceNode?.data?.text &&
	              !sourceNode?.data?.imageUrl &&
	              !sourceNode?.data?.videoUrl &&
	              !sourceNode?.data?.audioUrl &&
	              ![`image`, `video`, `audio`].includes(sourceNode?.data?.mediaKind) &&
	              texts.push({
                id: sourceNode.id,
                label: sourceNode?.type === `audioNode` ?
                  `音频结果` :
                  sourceNode.data.label || `文本节点`,
                text: sourceNode.data.text,
              });
          }), {
            images: images,
            texts: texts
          }
        );
      })(),
      ce = data.loading,
      le = data.errorMessage,
      fontSize = data.fontSize || 14;
    return jsxs(`div`, {
      className: `flex flex-col items-center group/node transition-all ${selected ? `z-50` : `z-10`}`,
      children: [
        jsx(`input`, {
          type: `file`,
          ref: fileInputRef,
          style: {
            display: `none`
          },
          accept: `image/*`,
	          onChange: (event) => {
	            let file = event.target.files?.[0];
	            if (!file) return;
	            let reader = new FileReader();
	            ((reader.onload = (event2) => {
	                let dataUrl = event2.target?.result;
	                data.onAddImage && data.onAddImage(nodeId, dataUrl);
	              }),
	              reader.readAsDataURL(file),
	              (event.target.value = ``));
	          },
	        }),
        jsxs(`div`, {
	          className: `relative bg-[#1c1c1c] rounded-xl border shadow-xl transition-all flex flex-col ${ce ? `wanjuan-loading-node-frame` : ``}
	          ${selected ? `border-blue-500 shadow-blue-500/20` : `border-[#333] hover:border-gray-500`}
	        `,
          style: {
            width: `420px`,
            minHeight: `240px`
          },
          onDoubleClick: (event) => {
            event.target instanceof HTMLButtonElement ||
              event.target instanceof HTMLInputElement ||
              event.target instanceof HTMLTextAreaElement ||
              setExpanded(!isExpanded);
          },
          children: [
            jsxs(`div`, {
              className: `flex items-center justify-between px-3 py-2 bg-[#222] border-b border-[#2a2a2a] drag-handle group/header rounded-t-xl`,
              children: [
                jsxs(`div`, {
                  className: `flex items-center gap-2 flex-1 min-w-0`,
                  children: [
                    jsx(`span`, {
                      className: `text-gray-400`,
                      children: `📄`,
                    }),
                    isEditing ?
                    jsx(`input`, {
                      className: `bg-[#1a1a1a] text-xs font-bold text-white outline-none w-full border border-blue-500 rounded px-1 transition-colors nodrag`,
                      value: label,
                      onChange: (event) => {
                        (setLabel(event.target.value),
                          updateNodeData(nodeId, {
                            label: event.target.value
                          }));
                      },
                      onBlur: () => setIsEditing(!1),
                      onKeyDown: (event) => {
                        event.key === `Enter` && setIsEditing(!1);
                      },
                      autoFocus: !0,
                      placeholder: `文本生成`,
                    }) :
                    jsxs(`div`, {
                      className: `flex items-center gap-1 overflow-hidden`,
                      children: [
                        jsx(`span`, {
                          className: `text-xs font-bold text-gray-300 truncate select-none`,
                          children: label || `文本生成`,
                        }),
                        jsx(`button`, {
                          className: `p-1 text-gray-500 hover:text-white opacity-0 group-hover/header:opacity-100 transition-opacity nodrag`,
                          onClick: (event) => {
                            (event.stopPropagation(), setIsEditing(!0));
                          },
                          title: `修改名称`,
                          children: jsx(Pen, {
                            size: 10
                          }),
                        }),
                      ],
                    }),
                    ce &&
                    jsx(RefreshCw, {
                      size: 12,
                      className: `animate-spin text-blue-500 flex-shrink-0 ml-1`,
                    }),
                  ],
                }),
                jsxs(`div`, {
                  className: `flex items-center gap-1 ml-2`,
                  children: [
                    jsx(`button`, {
                      className: `p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors`,
                      onClick: (event) => {
                        (event.stopPropagation(),
                          navigator.clipboard.writeText(text),
                          data.onShowToast && data.onShowToast(`已复制文本`));
                      },
                      title: `复制文本`,
                      children: jsx(Copy, {
                        size: 12
                      }),
                    }),
                    jsx(`button`, {
                      className: `p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors`,
                      onClick: () => setExpanded(!isExpanded),
                      title: isExpanded ? `收起输入` : `展开输入`,
                      children: isExpanded ?
                        jsx(Minimize2, {
                          size: 12
                        }) :
                        jsx(Maximize2, {
                          size: 12
                        }),
                    }),
                  ],
                }),
              ],
            }),
            jsxs(`div`, {
              className: `flex-1 p-3 overflow-y-auto bg-[#1a1a1a] custom-scrollbar relative drag-handle nopan rounded-b-xl flex flex-col min-h-0`,
              onWheel: (event) => event.stopPropagation(),
              children: [
                ce ?
                jsxs(`div`, {
                  className: `absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 bg-[#1a1a1a]/80 backdrop-blur-sm z-10`,
                  children: [
                    jsx(RefreshCw, {
                      className: `w-6 h-6 animate-spin text-blue-500`,
                    }),
                    jsx(`span`, {
                      className: `text-xs`,
                      children: `思考中...`,
                    }),
                    jsxs(`button`, {
                      onClick: (event) => {
                        (event.stopPropagation(), data.onStop && data.onStop(nodeId));
                      },
                      className: `mt-2 bg-[#222]/80 hover:bg-[#333] border border-[#444] text-gray-400 hover:text-gray-200 px-3 py-1 rounded-full text-[10px] flex items-center gap-1.5 transition-colors backdrop-blur-sm nodrag`,
                      children: [
                        jsx(Square, {
                          size: 10,
                          fill: `currentColor`
                        }),
                        `停止`,
                      ],
                    }),
                  ],
                }) :
                null,
                le ?
                jsxs(`div`, {
                  className: `text-red-400 text-xs p-2 border border-red-500/30 rounded bg-red-500/10 flex items-start gap-2`,
                  children: [
                    jsx(CircleAlert, {
                      size: 14,
                      className: `mt-0.5 flex-shrink-0`,
                    }),
                    jsx(`span`, {
                      className: `break-all`,
                      children: le,
                    }),
                  ],
                }) :
                jsx(`textarea`, {
                  className: `w-full min-h-[220px] bg-transparent resize-y outline-none font-sans leading-relaxed custom-scrollbar nodrag`,
                  style: {
                    fontSize: `${fontSize}px`,
                    color: `#a1a1aa`
                  },
                  placeholder: `等待生成...`,
                  value: text,
                  onChange: (event) => {
                    (setText(event.target.value), updateNodeData(nodeId, {
                      text: event.target.value
                    }));
                  },
                  onWheel: (event) => event.stopPropagation(),
                }),
              ],
            }),
            jsx(WanJuanNodeHandle, {
              type: `target`,
              position: Position.Left
            }),
            jsx(WanJuanNodeHandle, {
              type: `source`,
              position: Position.Right
            }),
          ],
        }),
        isExpanded && jsx(`div`, {
          className: `absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1c1c1c] rounded-xl border border-[#333] shadow-2xl w-[420px] transition-all duration-300 origin-top z-50 wanjuan-node-config-panel
          opacity-100 scale-100 p-3 overflow-visible
        `,
          onClick: (event) => event.stopPropagation(),
          children: jsxs(`div`, {
            className: `space-y-3`,
            children: [
              jsxs(`div`, {
                className: `flex flex-col gap-2`,
                children: [
                  (connectedContent.images.length > 0 || connectedContent.texts.length > 0 || selectedContextResources.length > 0) &&
                  jsxs(`div`, {
                    className: `flex flex-wrap gap-2 mb-1`,
                    children: [
                      connectedContent.images.map((resource: any, index) =>
                        jsxs(
                          `div`, {
                            className: `w-8 h-8 rounded overflow-hidden border border-[#444] relative group bg-black ${wanjuanSelectedReferenceSourceIds.includes(resource.sourceId || resource.id) ? `wanjuan-reference-thumb-active` : ``}`,
                            title: `连线图片`,
                            children: [
	                              jsx(`img`, {
	                                src: resource.thumbnailUrl || resource.url,
	                                alt: `Ref`,
	                                className: `w-full h-full object-cover`,
	                                onError: wanjuanUseBrokenResourceImage,
	                              }),
                              jsx(`div`, {
                                className: `wanjuan-danger-icon-action absolute top-0 right-0 p-0.5 bg-red-600/90 hover:bg-red-500 rounded-bl-md cursor-pointer opacity-0 group-hover:opacity-100 transition-all`,
                                onClick: (event) => {
                                  (event.stopPropagation(),
                                    setEdges((prev) =>
                                      prev.filter(
                                        (edge) =>
                                        !(
	                                          edge.target === nodeId &&
	                                          edge.source === (resource.sourceId || resource.id)
	                                        ),
                                      ),
                                    ));
                                },
                                children: jsx(`span`, {
                                  className: `text-red-50 text-[8px]`,
                                  children: `×`,
                                }),
                              }),
                            ],
                          },
                          `img-${index}`,
                        ),
                      ),
                      selectedContextResources
                      .filter((resource: any) => !wanjuanResourceInList(resource, connectedContent.images))
                      .map((resource: any, index) =>
                        jsxs(
                          `div`, {
                            className: `w-8 h-8 rounded overflow-hidden border border-blue-500/50 relative group bg-black`,
                            title: `通过 @ 选中的素材`,
                            children: [
	                              resource.type.startsWith(`image`) ?
	                              jsx(`img`, {
	                                src: resource.thumbnailUrl || resource.url,
	                                className: `w-full h-full object-cover opacity-80`,
	                                onError: wanjuanUseBrokenResourceImage,
	                              }) :
                              resource.type.startsWith(`video`) ?
                              jsx(`video`, {
                                src: resource.url,
                                className: `w-full h-full object-cover opacity-80`,
                              }) :
                              jsx(`div`, {
                                className: `w-full h-full bg-[#222] flex items-center justify-center p-1`,
                                children: jsx(Type, {
                                  size: 10,
                                  className: `text-gray-400`,
                                }),
                              }),
                              jsx(`div`, {
                                className: `absolute inset-0 bg-blue-500/10 pointer-events-none`,
                              }),
                              jsx(`div`, {
                                className: `wanjuan-danger-icon-action absolute top-0 right-0 p-0.5 bg-red-600/90 hover:bg-red-500 rounded-bl-md cursor-pointer opacity-0 group-hover:opacity-100 transition-all`,
                                onClick: (event) => {
                                  event.stopPropagation();
                                  let updatedResources = selectedContextResources.filter((e, index2) => index2 !== index);
                                  (setSelectedContextResources(updatedResources),
                                    updateNodeData(nodeId, {
                                      selectedContextResources: updatedResources
                                    }));
                                },
                                children: jsx(`span`, {
                                  className: `text-red-50 text-[8px]`,
                                  children: `×`,
                                }),
                              }),
                            ],
                          },
                          `ctx-${index}`,
                        ),
                      ),
                      connectedContent.texts.map((e, t) =>
                        jsxs(
                          `div`, {
                            className: `h-8 px-2 bg-[#2a2a2a] border border-[#444] rounded flex items-center gap-1 text-[10px] text-gray-300 hover:bg-[#333] hover:border-blue-500 hover:text-blue-400 transition-colors cursor-help group/text`,
                            title: e.text,
                            children: [
                              jsx(Type, {
                                size: 10
                              }),
                              jsx(`span`, {
                                className: `max-w-[60px] truncate`,
                                children: e.label,
                              }),
                            ],
                          },
                          `txt-${t}`,
                        ),
                      ),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `flex items-start gap-2`,
                    children: [
                      jsxs(`div`, {
                        className: `flex-1 relative`,
                        children: [
                          jsx(`textarea`, {
                            className: `w-full h-24 bg-[#121212] border border-[#333] rounded p-2 text-xs text-gray-200 resize-y outline-none focus:border-blue-500 custom-scrollbar nodrag nopan min-h-[60px]`,
                            placeholder: `输入提示词以开展你的任务`,
                            value: prompt,
	                            onChange: (event) => {
	                              let value = event.target.value;
	                              (setPrompt(value),
	                                updateNodeData(nodeId, {
	                                  prompt: value
	                                }),
	                                wanjuanShouldShowMentionPicker(event.currentTarget) ?
	                                setIsMentionPickerOpen(!0) :
	                                setIsMentionPickerOpen(!1));
	                            },
                            onWheel: (event) => event.stopPropagation(),
                          }),
                          isMentionPickerOpen &&
                          jsxs(`div`, {
			                            className: `wanjuan-mention-picker absolute top-full left-0 mt-1 w-[380px] bg-[#22272f] border border-[#3a4250] rounded-lg shadow-2xl z-[100] flex flex-col overflow-hidden`,
                            onClick: (event) => event.stopPropagation(),
                            children: [
                              wanjuanRenderResourcePickerHeader({
                                activeKind: resourceTypeFilter,
                                onSelectKind: te,
                                activeSource: resourceSourceFilter,
                                onSelectSource: setResourceSourceFilter,
                                favoriteOnly: resourceFavoriteOnly,
                                setFavoriteOnly: setResourceFavoriteOnly,
                                setPage: setCurrentPage,
                                onClose: () => setIsMentionPickerOpen(!1),
                              }),
                              jsx(`div`, {
                                className: `p-2 h-48 overflow-y-auto custom-scrollbar wanjuan-node-scroll-area wanjuan-mention-picker-list`,
                                children: (() => {
		                                  let filteredResources = resources.filter((resource: any) => wanjuanResourceMatchesFilter(resource, resourceTypeFilter, resourceSourceFilter, resourceFavoriteOnly));
                                  return filteredResources.length === 0 ?
                                    jsx(`div`, {
                                      className: `text-center text-gray-500 text-xs py-10`,
                                      children: `暂无素材`,
                                    }) :
                                    jsx(`div`, {
	                                      className: `grid grid-cols-4 gap-2`,
                                      children: filteredResources
                                        .slice((currentPage - 1) * 16, currentPage * 16)
                                        .map((resource: any) =>
                                          jsxs(
                                            `div`, {
	                                              className: `aspect-square bg-[#111827] rounded-lg border border-[#333b46] hover:border-blue-500 cursor-pointer overflow-hidden relative group wanjuan-mention-picker-item`,
	                                              onClick: (event) => {
	                                                let mentionRange = wanjuanMentionRangeFromPicker(event.currentTarget, prompt),
	                                                  updatedPrompt = wanjuanReplaceMentionToken(prompt, mentionRange);
		                                                if (wanjuanResourceKind(resource) === `text`) {
	                                                  let updatedPrompt2 = wanjuanReplaceMentionToken(prompt, mentionRange, resource.url || ``);
	                                                  (setPrompt(updatedPrompt2),
	                                                    updateNodeData(nodeId, {
	                                                      prompt: updatedPrompt2
	                                                    }));
	                                                } else {
	                                                  let updatedResources = [...selectedContextResources, resource];
	                                                  (setSelectedContextResources(updatedResources),
	                                                    updateNodeData(nodeId, {
	                                                      selectedContextResources: updatedResources,
	                                                    }),
	                                                    setPrompt(updatedPrompt),
	                                                    updateNodeData(nodeId, {
	                                                      prompt: updatedPrompt
	                                                    }));
	                                                }
                                                (setIsMentionPickerOpen(!1), wanjuanClearMentionPickerPosition(event.currentTarget));
                                              },
                                              children: [
		                                                wanjuanRenderResourcePreview(resource),
                                                jsx(`div`, {
                                                  className: `absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity`,
                                                  children: jsx(
                                                    `span`, {
                                                      className: `text-[10px] text-white`,
                                                      children: `选择`,
                                                    },
                                                  ),
                                                }),
                                              ],
                                            },
                                            resource.id,
                                          ),
                                        ),
                                    });
                                })(),
                              }),
                              (() => {
	                                let filteredResources = resources.filter((resource: any) => wanjuanResourceMatchesFilter(resource, resourceTypeFilter, resourceSourceFilter, resourceFavoriteOnly)).length,
                                  totalPages = Math.ceil(filteredResources / 16);
                                return totalPages <= 1 ?
                                  null :
                                  jsxs(`div`, {
	                                    className: `flex items-center justify-between p-2 border-t border-[#333b46] bg-[#20252c]`,
                                    children: [
                                      jsx(`button`, {
                                        disabled: currentPage === 1,
                                        onClick: () =>
                                          setCurrentPage((prev) => Math.max(1, prev - 1)),
	                                        className: `text-[10px] px-2.5 py-1 bg-[#2b313a] rounded-md disabled:opacity-30 text-gray-300 hover:bg-[#343b46]`,
                                        children: `上一页`,
                                      }),
                                      jsxs(`span`, {
                                        className: `text-[10px] text-gray-500`,
                                        children: [currentPage, ` / `, totalPages],
                                      }),
                                      jsx(`button`, {
                                        disabled: currentPage === totalPages,
                                        onClick: () =>
                                          setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
	                                        className: `text-[10px] px-2.5 py-1 bg-[#2b313a] rounded-md disabled:opacity-30 text-gray-300 hover:bg-[#343b46]`,
                                        children: `下一页`,
                                      }),
                                    ],
                                  });
                              })(),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              jsxs(`div`, {
                className: `flex items-center justify-between pt-2 border-t border-[#2a2a2a]`,
                children: [
                  jsxs(`div`, {
                    className: `flex items-center gap-1.5`,
                    children: [
                      jsxs(`label`, {
                        className: `flex items-center gap-1.5 cursor-pointer h-6 px-2 text-[11px] text-gray-400 hover:text-gray-200 select-none bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded transition-colors`,
                        children: [
                          jsx(`input`, {
                            type: `checkbox`,
                            checked: autoSplit,
                            onChange: (event) => {
                              (setAutoSplit(event.target.checked),
                                updateNodeData(nodeId, {
                                  autoSplit: event.target.checked
                                }));
                            },
                            className: `accent-blue-500 rounded sm:w-3 sm:h-3`,
                          }),
                          `自动拆分`,
                        ],
                      }),
                      !!(
                        data.textModel &&
                        data.textModel
                        .split(
                          `
`,
                        )
                        .filter((e) => e.trim() !== ``).length >= 1
                      ) &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: modelMenuRef,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[140px] wanjuan-node-picker-trigger`,
                            onClick: (event) => {
                              (event.stopPropagation(), setIsModelMenuOpen(!isModelMenuOpen));
                            },
                            title: `选择模型`,
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: selectedModel || `选择模型`,
                            }),
                          }),
                          isModelMenuOpen &&
                          jsxs(`div`, {
                            className: `absolute bottom-full left-0 mb-1 bg-[#222] border border-[#333] rounded-lg shadow-xl p-2 z-[9999] flex flex-col gap-1 overflow-y-auto custom-scrollbar nopan`,
                            style: {
                              width: 320,
                              maxWidth: `calc(100vw - 32px)`,
                              maxHeight: 320,
                              overflowY: `auto`,
                              overflowX: `hidden`,
                              scrollbarGutter: `stable`,
                              overscrollBehavior: `contain`,
                            },
                            onWheel: (event) => event.stopPropagation(),
                            onClick: (event) => event.stopPropagation(),
                            children: [
                              jsx(`div`, {
                                className: `text-[10px] text-gray-500 mb-1 px-1`,
                                children: `模型`,
                              }),
                              favoriteModels.sortModels(WanJuanParseModelList(data.textModel))
                              .map((model, index) =>
                                jsxs(
                                  `button`, {
                                    className: `wanjuan-node-model-option w-full text-left px-2 py-2 text-[12px] rounded-md transition-colors flex items-center gap-2 ${selectedModel === model ? `wanjuan-node-model-option-active bg-blue-600 text-white` : `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                    style: {
                                      width: `100%`,
                                      minHeight: 38,
                                      lineHeight: `18px`,
	                                      whiteSpace: `normal`,
	                                      wordBreak: `break-word`,
	                                      overflowWrap: `anywhere`,
	                                      boxSizing: `border-box`,
	                                      border: selectedModel === model ? `1px solid currentColor` : `1px solid transparent`,
	                                    },
                                    onClick: () => {
                                      (setSelectedModel(model),
                                        updateNodeData(nodeId, {
                                          selectedModel: model,
                                          wanjuanModelAuto: !1,
                                          wanjuanModelManual: !0
                                        }),
                                        (wanjuanModelManualRef.current = !0),
                                        setIsModelMenuOpen(!1));
                                    },
                                    title: model,
                                    children: [jsx(`span`, {
                                      className: `flex-1 min-w-0 break-words`,
                                      children: model
                                    }), jsx(`span`, {
                                      className: `wanjuan-model-favorite-star flex-shrink-0 text-base leading-none ${favoriteModels.isFavorite(model) ? `wanjuan-model-favorite-star-active` : ``}`,
                                      onClick: (event) => {
                                        (event.stopPropagation(),
                                          applyPreferredTextModel(favoriteModels.toggleFavorite(model)));
                                      },
                                      title: favoriteModels.isFavorite(model) ? `取消收藏` : `收藏并置顶`,
                                      children: favoriteModels.isFavorite(model) ? `★` : `☆`
                                    })],
                                  },
                                  index,
                                ),
                              ),
                            ],
                          }),
                        ],
                      }),
                      presetPrompts.filter(
                        (model) =>
                        model.enabled !== !1 &&
                        (model.type === `text` || model.type === `all` || !model.type),
                      ).length > 0 &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: presetMenuRef,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[80px] wanjuan-node-picker-trigger`,
                            onClick: (event) => {
                              (event.stopPropagation(), setIsPresetMenuOpen(!ie));
                            },
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: `预设词`,
                            }),
                          }),
                          ie &&
                          jsxs(`div`, {
                            className: `absolute bottom-full left-0 mb-1 w-48 bg-[#222] border border-[#333] rounded-lg shadow-xl p-2 z-50 flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar nopan`,
                            onWheel: (event) => event.stopPropagation(),
                            onClick: (event) => event.stopPropagation(),
                            children: [
                              jsx(`div`, {
                                className: `text-[10px] text-gray-500 mb-1 px-1`,
                                children: `预设词`,
                              }),
                              presetPrompts.filter(
                                (model) =>
                                model.enabled !== !1 &&
                                (model.type === `text` ||
                                  model.type === `all` ||
                                  !model.type),
                              ).map((preset, index) =>
                                jsx(
                                  `button`, {
                                    className: `text-left px-2 py-1.5 text-[11px] rounded-md transition-colors truncate text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`,
                                    onClick: () => {
                                      let updatedPrompt = prompt ?
                                        `${prompt}, ${preset.prompt}` :
                                        preset.prompt;
                                      (setPrompt(updatedPrompt), updateNodeData(nodeId, {
                                        prompt: updatedPrompt
                                      }), setIsPresetMenuOpen(!1));
                                    },
                                    title: preset.title,
                                    children: preset.title,
                                  },
                                  index,
                                ),
                              ),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  ce ?
                  jsxs(`div`, {
                    className: `flex items-center bg-red-500/10 rounded-full p-1 pl-3 border border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer group/btn flex-shrink-0 ml-2`,
                    onClick: (event) => {
                      (event.stopPropagation(), data.onStop && data.onStop(nodeId));
                    },
                    children: [
                      jsx(`div`, {
                        className: `flex items-center gap-1 mr-3 text-xs text-red-400 group-hover/btn:text-red-300`,
                        children: `停止`,
                      }),
                      jsx(`button`, {
                        className: `bg-red-500/20 text-red-400 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors`,
                        children: jsx(Square, {
                          size: 10,
                          fill: `currentColor`,
                        }),
                      }),
                    ],
                  }) :
                  jsxs(`div`, {
                    className: `flex items-center bg-[#2a2a2a] rounded-full p-1 pl-3 border border-[#333] hover:border-gray-500 transition-colors cursor-pointer group/btn flex-shrink-0 ml-2`,
                    onClick: (event) => {
                      (event.stopPropagation(),
                        data.onGenerateText && data.onGenerateText(nodeId, prompt, autoSplit, selectedModel));
                    },
                    children: [
                      jsx(`div`, {
                        className: `flex items-center gap-1 mr-3 text-xs text-gray-300 group-hover/btn:text-white`,
                        children: `生成`,
                      }),
                      jsx(`button`, {
                        className: `bg-white text-black w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors`,
                        children: jsx(ArrowUp, {
                          size: 14,
                          strokeWidth: 3,
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  });
