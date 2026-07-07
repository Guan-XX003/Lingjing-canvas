/**
 * 提示词节点：多段提示词编辑、提及素材、上传参考图并向下游节点输出。（原 bundle 局部名 Ne）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { parseSeedanceList } from "../lib/model-binding";
import localforage from "localforage";
import { NodeResizer, Position, useNodeConnections, useNodesData, useNodesState, useReactFlow } from "@xyflow/react";
import { ArrowUp, CircleAlert, Crop, Download, PenLine, RefreshCw, Square, Type, Upload, ZoomIn } from "lucide-react";
import { WanJuanTianjiPortraitReviewIcon } from "../components/icons";
import { WanJuanNodeHandle } from "../components/render-mode";
import { wanjuanRenderResourcePickerHeader, wanjuanRenderResourcePreview } from "../components/resource-picker";
import { wanjuanClearMentionPickerPosition, wanjuanMentionRangeFromPicker, wanjuanReplaceMentionToken, wanjuanShouldShowMentionPicker } from "../lib/mention";
import { WanJuanGetPreferredModel, WanJuanShouldAutoPreferredModel, WanJuanUseFavoriteModels } from "../lib/model-favorites";
import { WanJuanParseModelList, WanJuanSameModelId } from "../lib/model-id";
import { wanjuanResourceInList, wanjuanResourceKind, wanjuanResourceMatchesFilter } from "../lib/resource";
import { wanjuanUseBrokenResourceImage } from "../lib/resource-tabs";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

export const WanJuanPromptNode = reactMemo(({
    id: nodeId,
    data: data,
    selected: selected
  }: any) => {
    let {
      updateNodeData: updateNodeData,
      setEdges: setEdges
    } = useReactFlow(),
      [prompt, setPrompt] = useState(data.prompt || ``),
      [aspectRatio, setAspectRatio] = useState(data.aspectRatio || `Auto`),
      [imageSize, setImageSize] = useState(data.imageSize || `1K`),
      [imageSizeMode, setImageSizeMode] = useState(data.imageSizeMode || `quality`),
      [imageResolution, setImageResolution] = useState(data.imageResolution || ``),
      [f, m] = useState(!1),
      dropdownRef = useRef(null),
	      [g, _] = useState(!1),
	      [page, setPage] = useState(1),
	      [typeFilter, setTypeFilter] = useState(`all`),
	      [resourceSourceFilter, setResourceSourceFilter] = useState(`generated`),
	      [resourceFavoriteOnly, setResourceFavoriteOnly] = useState(!1),
	      [resources, setResources] = useState([]),
      [isDropdownOpen, setDropdownOpen] = useState(!1),
      dropdownRef2 = useRef(null),
      [isMenuOpen, setMenuOpen] = useState(!1),
      menuRef = useRef(null),
      [isExpanded, setExpanded] = useState(data.expanded === void 0 ? !1 : data.expanded),
      [selectedContextResources, setSelectedContextResources] = useState(data.selectedContextResources || []),
      [selectedModel, te] = useState(() =>
        WanJuanGetPreferredModel(data.drawingModel, data.selectedModel || ``, void 0, {
          manual: data.wanjuanModelManual === !0,
          auto: data.wanjuanModelAuto === !0,
        }),
	      ),
	      presetPrompts = data.presetPrompts || [],
	      wanjuanSelectedReferenceSourceIds = Array.isArray(data.wanjuanSelectedReferenceSourceIds) ? data.wanjuanSelectedReferenceSourceIds : [],
	      favoriteModels = WanJuanUseFavoriteModels(),
	      wanjuanModelManualRef = useRef(data.wanjuanModelManual === !0),
	      fileInputRef = useRef(null),
	      wanjuanImageCompatResolutionOptions = (data.imageCompatResolutions ?
	        parseSeedanceList(data.imageCompatResolutions) :
	        [
	          `1024x1024`,
	          `1280x720`,
	          `720x1280`,
	          `2048x2048`,
	          `2560x1440`,
	          `1440x2560`,
	          `3840x2160`,
	          `2160x3840`,
	        ]).map((url) => String(url || ``).trim()).filter((e) => /^\d{2,5}x\d{2,5}$/i.test(e)),
      wanjuanActiveImageResolution =
        imageResolution && wanjuanImageCompatResolutionOptions.includes(imageResolution) ?
        imageResolution :
        wanjuanImageCompatResolutionOptions[0] || `2560x1440`;
    let applyPreferredImageModel = (favoritesOverride = favoriteModels.favorites) => {
      if (!data.drawingModel) return;
      let currentModel = selectedModel || data.selectedModel || ``;
      if (!WanJuanShouldAutoPreferredModel(data.drawingModel, currentModel, {
          manual: wanjuanModelManualRef.current || data.wanjuanModelManual === !0,
          auto: data.wanjuanModelAuto === !0,
        })) return;
      let nextModel = WanJuanGetPreferredModel(data.drawingModel, currentModel, favoritesOverride, {
        auto: !0
      });
      nextModel &&
        !WanJuanSameModelId(nextModel, currentModel) &&
        ((wanjuanModelManualRef.current = !1),
          useNodesState(nextModel),
          updateNodeData(nodeId, {
            selectedModel: nextModel,
            wanjuanModelAuto: !0,
            wanjuanModelManual: !1
          }));
    };
    (useEffect(() => {
        (setPrompt(data.prompt || ``),
          setAspectRatio(data.aspectRatio || `Auto`),
	          setImageSize(data.imageSize || `1K`),
	          setImageSizeMode(data.imageSizeMode || `quality`),
	          setImageResolution(data.imageResolution || ``),
          data.selectedModel && useNodesState(data.selectedModel),
          data.selectedContextResources && setSelectedContextResources(data.selectedContextResources));
      }, [
        data.prompt,
        data.aspectRatio,
	        data.imageSize,
	        data.imageSizeMode,
	        data.imageResolution,
	        data.imageCompatResolutions,
        data.selectedModel,
        data.selectedContextResources,
      ]),
      useEffect(() => {
        applyPreferredImageModel();
      }, [data.drawingModel, selectedModel, data.wanjuanModelAuto, data.wanjuanModelManual, favoriteModels.favorites, nodeId, updateNodeData]),
      useEffect(() => {
        let handleClickOutside = (event) => {
          (dropdownRef.current && !dropdownRef.current.contains(event.target) && m(!1),
            dropdownRef2.current && !dropdownRef2.current.contains(event.target) && setDropdownOpen(!1),
            menuRef.current && !menuRef.current.contains(event.target) && setMenuOpen(!1));
        };
        return (
          (f || isDropdownOpen || isMenuOpen) && document.addEventListener(`mousedown`, handleClickOutside, !0),
          () => {
            document.removeEventListener(`mousedown`, handleClickOutside, !0);
          }
        );
      }, [f, isDropdownOpen, isMenuOpen]),
      useEffect(() => {
        g &&
          localforage
          .getItem(`transitResources`)
          .then((resources2) => {
            resources2 && Array.isArray(resources2) && resources2.length > 0 ?
              setResources(resources2) :
              typeof chrome < `u` &&
              chrome.storage &&
              chrome.storage.local.get([`transitResources`], (payload) => {
                payload.transitResources && setResources(payload.transitResources);
              });
          })
          .catch((error) => {
            (console.error(`Failed to fetch resources from localforage`, error),
              typeof chrome < `u` &&
              chrome.storage &&
              chrome.storage.local.get([`transitResources`], (payload) => {
                payload.transitResources && setResources(payload.transitResources);
              }));
          });
      }, [g]));
    let ie = useNodeConnections({
        handleType: `target`
      }),
      sources = useNodesData(useMemo(() => ie.map((edge: any) => edge.source), [ie])),
      extractedResources = (() => {
        if (!sources) return {
          images: [],
          texts: []
        };
        let sourceNodes = Array.isArray(sources) ? sources : [sources],
          images = [],
          texts = [],
          processedSourceIds = new Set();
        return (
          sourceNodes.forEach((node: any) => {
            if (!node || processedSourceIds.has(node.id)) return; // 同源多条边只处理一次，避免重复/键冲突
            processedSourceIds.add(node.id);
            if (
              (node?.data?.imageUrl && images.push({
	                  id: node.id,
	                  sourceId: node.id,
	                  url: node.data.imageUrl
	                }),
                node?.type === `videoExtractNode` && node?.data?.extractedImages)
            ) {
              let frameEdges = ie.filter((edge2) => edge2.source === node?.id && edge2.sourceHandle && edge2.sourceHandle.startsWith(`frame-`));
              if (frameEdges.length)
                frameEdges.forEach((edge) => { // 遍历该源的每一条 frame 边，而非只取第一条
                  let frameIndex = parseInt(edge.sourceHandle.replace(`frame-`, ``), 10);
                  if (!(node.data.hiddenIndices || []).includes(frameIndex)) {
                    let extractedImages = node.data.allExtractedImages;
	                    extractedImages && extractedImages[frameIndex] && images.push({
	                      id: `${node.id}-ext-${frameIndex}`,
	                      sourceId: node.id,
	                      url: extractedImages[frameIndex]
	                    });
                  }
                });
              else
                node.data.extractedImages.forEach((extractedImage, index) => {
	                  images.push({
	                    id: `${node.id}-ext-${index}`,
	                    sourceId: node.id,
	                    url: extractedImage
	                  });
                });
            }
	            (node?.type === `textNode` || node?.type === `promptNode`) &&
	              node?.data?.text &&
	              !node?.data?.imageUrl &&
	              !node?.data?.videoUrl &&
	              !node?.data?.audioUrl &&
	              ![`image`, `video`, `audio`].includes(node?.data?.mediaKind) &&
	              texts.push({
                id: node.id,
                label: node?.type === `audioNode` ?
                  `音频结果` :
                  node.data.label || `文本节点`,
                text: node.data.text,
              });
          }), {
            images: images,
            texts: texts
          }
        );
      })(),
      toggleExpanded = () => {
        setExpanded(!isExpanded);
      },
      imageUrl = data.imageUrl,
      ce = data.loading,
      le = data.errorMessage,
      tianjiBindingStatus = String(data.tianjiPortraitBindingStatus || (data.tianjiPortraitAssetId ? `ready` : ``)).trim(),
      tianjiBindingState =
      tianjiBindingStatus === `reviewing` ?
      {
        label: `审核中`,
        className: `border-sky-400/40 bg-sky-500/15 text-sky-100`,
      } :
      tianjiBindingStatus === `ready` ?
      {
        label: `已绑定天玑素材`,
        className: `border-emerald-400/45 bg-emerald-500/15 text-emerald-100`,
      } :
      tianjiBindingStatus === `pending` ?
      {
        label: `等待素材库刷新`,
        className: `border-amber-400/45 bg-amber-500/15 text-amber-100`,
      } :
      tianjiBindingStatus === `failed` ?
      {
        label: `绑定失败/需手动从人像库选择`,
        className: `border-red-400/45 bg-red-500/15 text-red-100`,
      } :
      null,
      tianjiBindingBadge = tianjiBindingState ?
      jsx(`div`, {
        className: `absolute left-2 bottom-2 z-20 max-w-[calc(100%-16px)] truncate rounded-md border px-2 py-1 text-[10px] font-medium leading-tight shadow-lg backdrop-blur-md pointer-events-none ${tianjiBindingState.className}`,
        title: data.tianjiPortraitBindingMessage || tianjiBindingState.label,
        children: tianjiBindingState.label,
      }) :
      null;
    return jsxs(`div`, {
      className: `flex flex-col items-center group/node transition-all w-full h-full min-w-[160px] min-h-[160px] ${selected ? `z-50` : `z-10`}`,
      children: [
        jsx(NodeResizer, {
          color: `#3b82f6`,
          isVisible: selected,
          minWidth: 160,
          minHeight: 160,
        }),
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
	            let fileReader = new FileReader();
	            ((fileReader.onload = (event2) => {
	                let dataUrl = event2.target?.result;
	                data.onAddImage && data.onAddImage(nodeId, dataUrl);
	              }),
	              fileReader.readAsDataURL(file),
	              (event.target.value = ``));
	          },
	        }),
        jsxs(`div`, {
	          className: `relative bg-[#1c1c1c] rounded-xl overflow-visible border shadow-xl transition-all cursor-pointer group/image w-full flex-1 flex flex-col ${ce ? `wanjuan-loading-node-frame` : ``}
	          ${selected ? `border-blue-500 shadow-blue-500/20` : `border-[#333] hover:border-gray-500`}
	        `,
          onClick: toggleExpanded,
          children: [
            imageUrl &&
            !ce &&
            jsxs(`div`, {
              className: `absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover/image:opacity-100 transition-opacity z-20 nodrag`,
              children: [
                jsx(`button`, {
                  className: `p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors`,
                  title: `放大`,
                  onClick: (event) => {
                    (event.stopPropagation(), data.onZoom && data.onZoom(imageUrl));
                  },
                  children: jsx(ZoomIn, {
                    size: 14
                  }),
                }),
                jsx(`button`, {
                  className: `p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors`,
                  title: `裁剪`,
                  onClick: (event) => {
                    (event.stopPropagation(), data.onCrop && data.onCrop(nodeId, imageUrl));
                  },
                  children: jsx(Crop, {
                    size: 14
                  }),
                }),
                jsx(`button`, {
                  className: `p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors`,
                  title: `编辑`,
                  onClick: (event) => {
                    (event.stopPropagation(), data.onEdit && data.onEdit(nodeId, imageUrl));
                  },
                  children: jsx(PenLine, {
                    size: 14
                  }),
                }),
                jsx(`button`, {
                  className: `p-1.5 text-gray-300 hover:text-cyan-300 hover:bg-white/10 rounded-md transition-colors`,
                  title: `天玑人像审核`,
                  onClick: (event) => {
                    (event.stopPropagation(),
                      data.onTianjiPortraitReview && data.onTianjiPortraitReview(imageUrl, {
                        nodeId: nodeId,
                        label: data.label || `生图结果`,
                      }));
                  },
                  children: jsx(WanJuanTianjiPortraitReviewIcon, {
                    size: 14
                  }),
                }),
                jsx(`button`, {
                  className: `p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors`,
                  title: `下载`,
                  onClick: (event) => {
                    if ((event.stopPropagation(), imageUrl))
                      if (typeof chrome < `u` && chrome.downloads)
                        chrome.downloads.download({
                          url: imageUrl,
                          filename: `wanjuan/generated-${Date.now()}.png`,
                          saveAs: !1,
                        });
                      else {
                        let link = document.createElement(`a`);
                        ((link.href = imageUrl),
                          (link.download = `generated-${Date.now()}.png`),
                          document.body.appendChild(link),
                          link.click(),
                          document.body.removeChild(link));
                      }
                  },
                  children: jsx(Download, {
                    size: 14
                  }),
                }),
              ],
            }),
            jsx(WanJuanNodeHandle, {
              type: `target`,
              position: Position.Left
            }),
            jsxs(`div`, {
              className: `flex items-center justify-center relative w-full h-full rounded-xl overflow-hidden ${imageUrl ? `` : `bg-[#121212]`}`,
              children: [
	                imageUrl &&
	                jsx(`img`, {
	                  src: imageUrl,
	                  alt: `Generated Content`,
	                  className: `max-w-full w-full h-full object-contain block ${ce ? `opacity-50 blur-sm` : ``}`,
	                  draggable: !1,
	                  onError: wanjuanUseBrokenResourceImage,
	                  onDoubleClick: (event) => {
                    (event.stopPropagation(), data.onZoom && data.onZoom(imageUrl));
                  },
                }),
                ce &&
                jsxs(`div`, {
                  className: `absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 z-10 overflow-hidden bg-[#121212]`,
                  children: [
                    (extractedResources.images[0] || imageUrl) &&
                    jsx(`div`, {
                      className: `absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110`,
                      style: {
                        backgroundImage: `url(${imageUrl || extractedResources.images[0]})`,
                      },
                    }),
	                    jsxs(`div`, {
                      className: `relative z-10 flex flex-col items-center gap-2`,
                      children: [
                        jsx(RefreshCw, {
                          className: `w-8 h-8 animate-spin text-blue-500`,
                        }),
                        jsx(`span`, {
                          className: `text-xs font-mono tracking-wider text-blue-400`,
                          children: `生成中...`,
                        }),
                        jsxs(`button`, {
                          onClick: (event) => {
                            (event.stopPropagation(), data.onStop && data.onStop(nodeId));
                          },
                          className: `mt-2 bg-[#222]/80 hover:bg-[#333] border border-[#444] text-gray-400 hover:text-gray-200 px-3 py-1 rounded-full text-[10px] flex items-center gap-1.5 transition-colors backdrop-blur-sm`,
                          children: [
                            jsx(Square, {
                              size: 10,
                              fill: `currentColor`,
                            }),
                            `停止`,
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                le &&
                !ce &&
                jsxs(`div`, {
                  className: `absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 z-10 bg-[#1a1a1a] p-4 text-center`,
                  children: [
                    jsx(CircleAlert, {
                      size: 32
                    }),
                    jsx(`div`, {
                      className: `text-xs font-medium max-w-full break-words`,
                      children: le,
                    }),
                    jsx(`button`, {
                      className: `text-[10px] bg-[#333] hover:bg-[#444] text-gray-300 px-3 py-1 rounded-full border border-gray-600 transition-colors`,
                      onClick: (event) => {
                        event.stopPropagation();
                      },
                      children: `请检查设置或重试`,
                    }),
                  ],
                }),
                !imageUrl &&
                !ce &&
                !le &&
                jsxs(`div`, {
                  className: `flex flex-col items-center justify-center gap-3 absolute inset-0 bg-[#151515] group-hover/image:bg-[#1a1a1a] transition-colors`,
                  children: [
                    jsxs(`div`, {
                      className: `w-16 h-16 rounded-2xl bg-[#222] border-2 border-dashed border-[#333] group-hover/image:border-blue-500/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#2a2a2a] transition-all`,
                      onClick: (event) => {
                        (event.stopPropagation(), fileInputRef.current?.click());
                      },
                      children: [
                        jsx(Upload, {
                          size: 20,
                          className: `text-gray-500 group-hover/image:text-blue-500 transition-colors`,
                        }),
                        jsx(`span`, {
                          className: `text-[9px] text-gray-500 font-medium`,
                          children: `上传`,
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex flex-col items-center gap-1`,
                      children: [
                        jsx(`span`, {
                          className: `text-gray-500 text-xs font-medium`,
                          children: `空节点`,
                        }),
                        jsx(`span`, {
                          className: `text-gray-600 text-[10px]`,
                          children: `点击配置`,
                        }),
                      ],
                    }),
                  ],
                }),
                tianjiBindingBadge,
                jsx(`div`, {
                  className: `absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none`,
                }),
              ],
            }),
            jsx(WanJuanNodeHandle, {
              type: `source`,
              position: Position.Right
            }),
          ],
        }),
        jsx(`div`, {
          className: `absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1c1c1c] rounded-2xl border border-[#333] shadow-2xl w-[500px] transition-all duration-300 origin-top z-50 wanjuan-node-config-panel
          ${isExpanded ? `opacity-100 scale-100 p-4 overflow-visible` : `opacity-0 scale-95 pointer-events-none h-0 p-0 border-0 overflow-hidden`}
        `,
          onClick: (event) => event.stopPropagation(),
          children: jsxs(`div`, {
            className: `space-y-3`,
            children: [
              jsxs(`div`, {
                className: `flex flex-col gap-2 mb-2`,
                children: [
                  (extractedResources.images.length > 0 || extractedResources.texts.length > 0 || selectedContextResources.length > 0) &&
                  jsxs(`div`, {
                    className: `flex flex-wrap gap-2 mb-1`,
                    children: [
                      extractedResources.images.map((resource: any, index) =>
                        jsxs(
                          `div`, {
                            className: `w-10 h-10 rounded-md overflow-hidden border border-[#444] relative group bg-black ${wanjuanSelectedReferenceSourceIds.includes(resource.sourceId || resource.id) ? `wanjuan-reference-thumb-active` : ``}`,
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
                                    setEdges((edges) =>
                                      edges.filter(
                                        (edge) =>
                                        !(
	                                          edge.target === nodeId &&
	                                          edge.source === (resource.sourceId || resource.id)
	                                        ),
                                      ),
                                    ));
                                },
                                children: jsx(`span`, {
                                  className: `text-red-50 text-[10px] leading-none px-0.5`,
                                  children: `×`,
                                }),
                              }),
                            ],
                          },
                          `img-${index}`,
                        ),
                      ),
                      selectedContextResources
                      .filter((resource: any) => !wanjuanResourceInList(resource, extractedResources.images))
                      .map((resource: any, index) =>
                        jsxs(
                          `div`, {
                            className: `w-10 h-10 rounded-md overflow-hidden border border-blue-500/50 relative group bg-black`,
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
                                  size: 12,
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
                                  className: `text-red-50 text-[10px] leading-none px-0.5`,
                                  children: `×`,
                                }),
                              }),
                            ],
                          },
                          `ctx-${index}`,
                        ),
                      ),
                      extractedResources.texts.map((resource: any, index) =>
                        jsxs(
                          `div`, {
                            className: `h-8 px-2 bg-[#2a2a2a] border border-[#444] rounded flex items-center gap-1 text-[10px] text-gray-300 hover:bg-[#333] hover:border-blue-500 hover:text-blue-400 transition-colors cursor-help group/text`,
                            title: resource.text,
                            children: [
                              jsx(Type, {
                                size: 10
                              }),
                              jsx(`span`, {
                                className: `max-w-[80px] truncate`,
                                children: resource.label,
                              }),
                            ],
                          },
                          `txt-${index}`,
                        ),
                      ),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `flex items-start gap-2`,
                    children: [
                      extractedResources.images.length === 0 &&
                      jsxs(`div`, {
                        className: `w-10 h-10 rounded-md border border-dashed border-[#444] flex flex-col items-center justify-center text-gray-600 bg-[#151515] hover:bg-[#222] hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors flex-shrink-0 wanjuan-node-upload-trigger`,
                        onClick: () => fileInputRef.current?.click(),
                        title: `上传参考图`,
                        children: [
                          jsx(Upload, {
                            size: 12
                          }),
                          jsx(`span`, {
                            className: `text-[8px] scale-90`,
                            children: `上传`,
                          }),
                        ],
                      }),
	                      jsxs(`div`, {
	                        className: `flex-1 nodrag relative`,
	                        style: {
	                          zIndex: 1
	                        },
                        children: [
                          jsx(`textarea`, {
                            className: `w-full h-20 bg-transparent text-[15px] text-gray-200 resize-y min-h-[80px] outline-none leading-relaxed placeholder-gray-600 font-sans custom-scrollbar nodrag wanjuan-video-prompt-textarea`,
                            placeholder: `描述你想要的画面 (输入 @ 调出素材)...`,
                            value: prompt,
	                            onChange: (event) => {
	                              let value = event.target.value;
	                              (setPrompt(value),
	                                updateNodeData(nodeId, {
	                                  prompt: value
	                                }),
	                                wanjuanShouldShowMentionPicker(event.currentTarget) ?
	                                _(!0) :
	                                _(!1));
	                            },
                            autoFocus: isExpanded,
                            onWheel: (event) => event.stopPropagation(),
	                          }),
	                          g &&
	                          jsxs(`div`, {
                            className: `wanjuan-mention-picker absolute top-full left-0 mt-1 w-[380px] bg-[#22272f] border border-[#3a4250] rounded-lg shadow-2xl z-[100] flex flex-col overflow-hidden nopan`,
                            onWheel: (event) => event.stopPropagation(),
                            onClick: (event) => event.stopPropagation(),
                            children: [
                              wanjuanRenderResourcePickerHeader({
                                activeKind: typeFilter,
                                onSelectKind: setTypeFilter,
                                activeSource: resourceSourceFilter,
                                onSelectSource: setResourceSourceFilter,
                                favoriteOnly: resourceFavoriteOnly,
                                setFavoriteOnly: setResourceFavoriteOnly,
                                setPage,
                                onClose: () => _(!1),
                              }),
                              jsx(`div`, {
	                                className: `p-2 h-48 overflow-y-auto custom-scrollbar wanjuan-node-scroll-area wanjuan-mention-picker-list`,
                                children: (() => {
		                                  let filteredResources = resources.filter((resource: any) => wanjuanResourceMatchesFilter(resource, typeFilter, resourceSourceFilter, resourceFavoriteOnly));
                                  return filteredResources.length === 0 ?
                                    jsx(`div`, {
                                      className: `text-center text-gray-500 text-xs py-10`,
                                      children: `暂无素材`,
                                    }) :
                                    jsx(`div`, {
	                                      className: `grid grid-cols-4 gap-2`,
                                      children: filteredResources
                                        .slice((page - 1) * 16, page * 16)
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
                                                (_(!1), wanjuanClearMentionPickerPosition(event.currentTarget));
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
	                                let filteredCount = resources.filter((resource: any) => wanjuanResourceMatchesFilter(resource, typeFilter, resourceSourceFilter, resourceFavoriteOnly)).length,
                                  totalPages = Math.ceil(filteredCount / 16);
                                return totalPages <= 1 ?
                                  null :
                                  jsxs(`div`, {
	                                    className: `flex items-center justify-between p-2 border-t border-[#333b46] bg-[#20252c]`,
                                    children: [
                                      jsx(`button`, {
                                        disabled: page === 1,
                                        onClick: () =>
                                          setPage((prevPage) => Math.max(1, prevPage - 1)),
	                                        className: `text-[10px] px-2.5 py-1 bg-[#2b313a] rounded-md disabled:opacity-30 text-gray-300 hover:bg-[#343b46]`,
                                        children: `上一页`,
                                      }),
                                      jsxs(`span`, {
                                        className: `text-[10px] text-gray-500`,
                                        children: [page, ` / `, totalPages],
                                      }),
                                      jsx(`button`, {
                                        disabled: page === totalPages,
                                        onClick: () =>
                                          setPage((prevPage) => Math.min(totalPages, prevPage + 1)),
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
                className: `flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a] nodrag`,
                children: [
                  jsxs(`div`, {
                    className: `flex items-center gap-1.5 overflow-visible`,
                    children: [
                      jsxs(`div`, {
                        className: `relative nodrag`,
                        ref: dropdownRef,
                        children: [
                          jsxs(`button`, {
                            className: `flex items-center gap-1.5 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer`,
                            onClick: (event) => {
                              (event.stopPropagation(), m(!f));
                            },
                            children: [
                              jsx(`div`, {
                                className: `w-2.5 h-3 border border-current rounded-[2px]`,
                              }),
		                              jsxs(`span`, {
		                                children: imageSizeMode === `resolution` ?
		                                  [wanjuanActiveImageResolution] :
		                                  [aspectRatio, ` · `, imageSize]
		                              }),
                            ],
                          }),
                          f &&
	                          jsxs(`div`, {
	                            className: `absolute bottom-full left-0 mb-1 w-64 bg-[#222] border border-[#333] rounded-lg shadow-xl p-3 z-50 flex flex-col gap-3`,
	                            onClick: (event) => event.stopPropagation(),
	                            children: [
	                              jsx(`div`, {
	                                className: `flex bg-[#111] rounded-md p-0.5`,
	                                children: [
	                                  [`quality`, `普通`],
	                                  [`resolution`, `兼容`],
	                                ].map(([sizeMode, label]) =>
	                                  jsx(
	                                    `button`, {
	                                      className: `flex-1 py-1 text-[11px] rounded transition-colors ${imageSizeMode === sizeMode ? `bg-blue-600 text-white` : `text-gray-400 hover:bg-[#2a2a2a]`}`,
	                                      onClick: () => {
	                                        (setImageSizeMode(sizeMode), sizeMode === `resolution` && !imageResolution && setImageResolution(wanjuanActiveImageResolution), updateNodeData(nodeId, {
	                                          imageSizeMode: sizeMode,
	                                          ...(sizeMode === `resolution` ? {
	                                            imageResolution: wanjuanActiveImageResolution
	                                          } : {}),
	                                        }));
	                                      },
	                                      children: label,
	                                    },
	                                    sizeMode,
	                                  ),
	                                ),
	                              }),
			                              imageSizeMode === `quality` ?
			                              jsxs(`div`, {
		                                children: [
		                                  jsx(`div`, {
		                                    className: `text-[10px] text-gray-500 mb-2`,
                                    children: `画质`,
                                  }),
                                  jsx(`div`, {
                                    className: `flex gap-1.5`,
                                    children: [`1K`, `2K`, `4K`].map((imageSize2) =>
                                      jsx(
                                        `button`, {
                                          className: `flex-1 py-1.5 text-[11px] rounded-md border transition-colors wanjuan-node-popover-option ${imageSize === imageSize2 ? `bg-blue-600 border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1a1a1a] border-transparent text-gray-400 hover:bg-[#2a2a2a]`}`,
                                          onClick: () => {
                                            (setImageSize(imageSize2), updateNodeData(nodeId, {
                                              imageSize: imageSize2
                                            }));
                                          },
                                          children: imageSize2,
                                        },
                                        imageSize2,
                                      ),
	                                    ),
	                                  }),
	                                ],
		                              }) :
		                              jsxs(`div`, {
	                                children: [
	                                  jsx(`div`, {
	                                    className: `text-[10px] text-gray-500 mb-2`,
	                                    children: `分辨率`,
	                                  }),
	                                  jsx(`div`, {
	                                    className: `flex flex-wrap gap-1.5`,
	                                    children: wanjuanImageCompatResolutionOptions.length ?
	                                      wanjuanImageCompatResolutionOptions.map((resolution) =>
	                                        jsx(
	                                          `button`, {
	                                            className: `px-2.5 py-1.5 text-[11px] rounded-md border transition-colors wanjuan-node-popover-option ${wanjuanActiveImageResolution === resolution ? `bg-blue-600 border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1a1a1a] border-transparent text-gray-400 hover:bg-[#2a2a2a]`}`,
	                                            onClick: () => {
	                                              (setImageResolution(resolution), updateNodeData(nodeId, {
	                                                imageSizeMode: `resolution`,
	                                                imageResolution: resolution
	                                              }));
	                                            },
	                                            children: resolution,
	                                          },
	                                          resolution,
	                                        ),
	                                      ) :
		                                      jsx(`div`, {
		                                        className: `text-[11px] text-gray-500`,
		                                        children: `请先在设置里填写兼容分辨率`,
			                                      }),
			                                  }),
			                                ],
			                              }),
			                              imageSizeMode === `quality` &&
			                              jsxs(`div`, {
		                                children: [
		                                  jsx(`div`, {
		                                    className: `text-[10px] text-gray-500 mb-2`,
		                                    children: `比例`,
                                  }),
                                  jsx(`div`, {
                                    className: `flex flex-wrap gap-1.5`,
                                    children: [
                                      `Auto`,
                                      `21:9`,
                                      `16:9`,
                                      `3:2`,
                                      `4:3`,
                                      `1:1`,
                                      `3:4`,
                                      `2:3`,
                                      `9:16`,
                                    ].map((aspectRatio2) =>
                                      jsx(
                                        `button`, {
                                          className: `px-3 py-1.5 text-[11px] rounded-md border transition-colors wanjuan-node-popover-option ${aspectRatio === aspectRatio2 ? `bg-blue-600 border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1a1a1a] border-transparent text-gray-400 hover:bg-[#2a2a2a]`}`,
                                          onClick: () => {
                                            (setAspectRatio(aspectRatio2), updateNodeData(nodeId, {
                                              aspectRatio: aspectRatio2
                                            }));
                                          },
                                          children: aspectRatio2,
                                        },
                                        aspectRatio2,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      !!(
                        data.drawingModel &&
                        data.drawingModel
                        .split(
                          `
`,
                        )
                        .filter((text) => text.trim() !== ``).length >= 1
                      ) &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: dropdownRef2,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] flex-shrink-0 mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[100px] wanjuan-node-picker-trigger`,
                            onClick: (event) => {
                              (event.stopPropagation(), setDropdownOpen(!isDropdownOpen));
                            },
                            title: `选择模型`,
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: selectedModel || `选择模型`,
                            }),
                          }),
                          isDropdownOpen &&
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
                              favoriteModels.sortModels(WanJuanParseModelList(data.drawingModel))
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
                                      (useNodesState(model),
                                        updateNodeData(nodeId, {
                                          selectedModel: model,
                                          wanjuanModelAuto: !1,
                                          wanjuanModelManual: !0
                                        }),
                                        (wanjuanModelManualRef.current = !0),
                                        setDropdownOpen(!1));
                                    },
                                    title: model,
                                    children: [jsx(`span`, {
                                      className: `flex-1 min-w-0 break-words`,
                                      children: model
                                    }), jsx(`span`, {
                                      className: `wanjuan-model-favorite-star flex-shrink-0 text-base leading-none ${favoriteModels.isFavorite(model) ? `wanjuan-model-favorite-star-active` : ``}`,
                                      onClick: (event) => {
                                        (event.stopPropagation(),
                                          applyPreferredImageModel(favoriteModels.toggleFavorite(model)));
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
                        (preset) =>
                        preset.enabled !== !1 &&
                        (preset.type === `image` || preset.type === `all` || !preset.type),
                      ).length > 0 &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: menuRef,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] flex-shrink-0 mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[80px] wanjuan-node-picker-trigger`,
                            onClick: (event) => {
                              (event.stopPropagation(), setMenuOpen(!isMenuOpen));
                            },
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: `预设词`,
                            }),
                          }),
                          isMenuOpen &&
                          jsxs(`div`, {
                            className: `absolute bottom-full left-0 mb-1 bg-[#222] border border-[#333] rounded-lg shadow-xl p-2 z-50 flex flex-col gap-1 custom-scrollbar`,
                            style: {
                              width: 320,
                              maxWidth: `calc(100vw - 32px)`,
                              maxHeight: 320,
                              overflowY: `auto`,
                              overflowX: `hidden`,
                            },
                            onClick: (event) => event.stopPropagation(),
                            children: [
                              jsx(`div`, {
                                className: `text-[10px] text-gray-500 mb-1 px-1`,
                                children: `预设词`,
                              }),
                              presetPrompts.filter(
                                (preset) =>
                                preset.enabled !== !1 &&
                                (preset.type === `image` ||
                                  preset.type === `all` ||
                                  !preset.type),
                              ).map((preset, index) =>
                                jsx(
                                  `button`, {
                                    className: `text-left px-2 py-1.5 text-[11px] rounded-md transition-colors truncate text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`,
                                    onClick: () => {
                                      let combinedPrompt = prompt ?
                                        `${prompt}, ${preset.prompt}` :
                                        preset.prompt;
                                      (setPrompt(combinedPrompt), updateNodeData(nodeId, {
                                        prompt: combinedPrompt
                                      }), setMenuOpen(!1));
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
                  jsx(`div`, {
                    className: `flex items-center gap-3 flex-shrink-0 ml-2`,
                    children: ce ?
                      jsxs(`div`, {
                        className: `flex items-center bg-red-500/10 rounded-full p-1 pl-3 border border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer group/btn`,
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
                        className: `flex items-center bg-[#2a2a2a] rounded-full p-1 pl-3 border border-[#333] hover:border-gray-500 transition-colors cursor-pointer group/btn`,
                        onClick: (event) => {
                          if (
                            (event.stopPropagation(),
                              !prompt.trim() &&
                              extractedResources.images.length === 0 &&
                              extractedResources.texts.length === 0)
                          ) {
                            data.onShowToast &&
                              data.onShowToast(`请输入提示词或连接参考节点`);
                            return;
                          }
                          data.onGenerate && data.onGenerate(nodeId, prompt, `1024x1024`, selectedModel);
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
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  });
