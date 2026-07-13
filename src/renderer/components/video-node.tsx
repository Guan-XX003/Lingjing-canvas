/**
 * 视频生成节点：Seedance / 通义万相 / 通用视频三类 provider 的统一画布节点。
 * 覆盖模型选择（含收藏偏好）、提示词提及、参考素材、天玑人像、提交与任务展示。
 * （原 bundle 局部名 We）自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { NodeResizer, Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { ArrowUp, CircleAlert, CirclePlay, Download, Film, Maximize2, RefreshCw, Square, Trash2, Type, Upload, X as CloseX } from "lucide-react";
import localforage from "localforage";
import { WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE } from "../lib/upload-defaults";
import { useWanJuanMediaBudget } from "../lib/media-budget";
import { TongyiWanxiangLogo } from "./icons";
import { wanjuanClearMentionPickerPosition, wanjuanDeleteMentionTokenAsUnit, wanjuanFormatMentionToken, wanjuanLegacyMentionToken, wanjuanMentionRangeFromPicker, wanjuanReplaceMentionToken, wanjuanShouldShowMentionPicker } from "../lib/mention";
import { parseSeedanceList } from "../lib/model-binding";
import { WanJuanGetPreferredModel, WanJuanShouldAutoPreferredModel, WanJuanUseFavoriteModels } from "../lib/model-favorites";
import { WanJuanNormalizeModelId, WanJuanParseModelList, WanJuanSameModelId } from "../lib/model-id";
import { wanjuanResourceInList, wanjuanResourceKind, wanjuanResourceMatchesFilter, wanjuanResourceSameIdentity } from "../lib/resource";
import { wanjuanUseBrokenResourceImage } from "../lib/resource-tabs";
import { wanjuanNormalizeSeedanceVirtualPortraits, wanjuanPortableSeedancePortraitPreview, wanjuanSeedanceAssetUrl, wanjuanSeedancePortraitToResource } from "../lib/seedance";
import { wanjuanGetSyncedTianjiSeedanceConfig } from "../lib/tianji-api";
import { wanjuanTianjiFlattenPortraitAssets, wanjuanTianjiRefreshPortraitAssets, wanjuanTianjiResolvePortraitAssetForNodeData } from "../lib/tianji-assets";
import { wanjuanNormalizeTianjiPortraitAssets, wanjuanTianjiPortraitToResource } from "../lib/tianji-portrait";
import { normalizeVideoAspectRatioValue } from "../lib/video-aspect-ratio";
import { wanjuanResolveVideoParameterMode, wanjuanVideoParameterModeLabel } from "../lib/video-parameter-mode";
import { WanJuanConfigButlerHelp } from "./config-butler-help";
import { WanJuanNodeHandle } from "./render-mode";
import { wanjuanRenderResourcePickerHeader, wanjuanRenderResourcePreview } from "./resource-picker";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

/** 通用视频 provider 的尺寸预设（label 为画幅比例，value 为像素尺寸）。（原 bundle 局部名 Z） */
const WANJUAN_VIDEO_SIZE_PRESETS = [{
      label: `16:9`,
      value: `1280x720`
    },
    {
      label: `9:16`,
      value: `720x1280`
    },
    {
      label: `3:2`,
      value: `1080x720`
    },
    {
      label: `2:3`,
      value: `720x1080`
    },
    {
      label: `1:1`,
      value: `720x720`
    },
  ];

export const WanJuanVideoNode = reactMemo(({
    id: nodeId,
    data: nodeData,
    selected: selected
  }: any) => {
    let {
      updateNodeData: updateNodeData,
      setEdges: setEdges,
      setNodes: setVideoNodes
    } = useReactFlow(),
      data = nodeData,
      wanjuanSelectedReferenceSourceIds = Array.isArray(data.wanjuanSelectedReferenceSourceIds) ? data.wanjuanSelectedReferenceSourceIds : [],
      isSeedanceOrWanxiang = data.seedanceNode === !0 || data.tongyiWanxiangNode === !0,
      isTongyiWanxiang = data.tongyiWanxiangNode === !0,
      tongyiWanxiangMode = data.tongyiWanxiangMode || `text-to-video`,
      seedanceUploadModeValue = data.seedanceUploadMode || WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE,
      seedanceModeValue = data.seedanceMode === `tianji` ? `tianji` : `official`,
      parseSeedanceList = (listText) =>
      String(listText || ``)
      .split(/[\s,，、]+/)
      .map((item: any) => item.trim())
      .filter((listText2) => listText2 !== ``),
      tongyiWanxiangModeOptions = [{
          value: `text-to-video`,
          label: `文生视频`,
        },
        {
          value: `reference-image-to-video`,
          label: `参考图生视频`,
        },
        {
          value: `image-to-video`,
          label: `图生视频`,
        },
        {
          value: `video-edit`,
          label: `视频编辑`,
        },
      ],
      tongyiWanxiangModeLabel =
      tongyiWanxiangMode === `reference-image-to-video` ?
      `参考图生视频` :
      tongyiWanxiangMode === `image-to-video` ?
      `图生视频` :
      tongyiWanxiangMode === `video-edit` ?
      `视频编辑` :
      `文生视频`,
      getTongyiWanxiangModelText = (taskType) =>
      taskType === `reference-image-to-video` ?
      data.tongyiWanxiangReferenceImageModels || `` :
      taskType === `image-to-video` ?
      data.tongyiWanxiangImageModels || `` :
      taskType === `video-edit` ?
      data.tongyiWanxiangEditModels || `` :
      data.tongyiWanxiangTextModels || ``,
      currentTongyiWanxiangModelText = getTongyiWanxiangModelText(
        tongyiWanxiangMode,
      ),
      currentTongyiWanxiangModels = parseSeedanceList(
        currentTongyiWanxiangModelText,
      ),
	      activeVideoModelText =
	      isSeedanceOrWanxiang && !isTongyiWanxiang && seedanceModeValue === `tianji` ?
	      data.tianjiSeedanceModel || data.videoModel || `` :
	      isSeedanceOrWanxiang && !isTongyiWanxiang ?
	      data.seedanceModel || data.videoModel || `` :
	      data.videoModel || ``,
	      activeVideoSelectedModel =
	      isSeedanceOrWanxiang && !isTongyiWanxiang && seedanceModeValue === `tianji` ?
	      data.tianjiSelectedModel || data.selectedModel || `` :
	      isSeedanceOrWanxiang && !isTongyiWanxiang ?
	      data.seedanceSelectedModel || data.selectedModel || `` :
	      data.selectedModel || ``,
	      activeVideoModelManual =
	      isSeedanceOrWanxiang && !isTongyiWanxiang && seedanceModeValue === `tianji` ?
	      data.tianjiModelManual === !0 || (!data.tianjiSelectedModel && data.wanjuanModelManual === !0) :
	      isSeedanceOrWanxiang && !isTongyiWanxiang ?
	      data.seedanceModelManual === !0 || (!data.seedanceSelectedModel && data.wanjuanModelManual === !0) :
	      data.wanjuanModelManual === !0,
      videoDurationOptions = parseSeedanceList(
        data.videoDurations || (isSeedanceOrWanxiang ? `10 15` : `10
		15`),
      ),
      firstVideoDuration = videoDurationOptions[0] || `10`,
      seedanceResolutionOptions = parseSeedanceList(
        isTongyiWanxiang ?
        data.tongyiWanxiangResolutions || `720P 1080P` :
        data.seedanceResolutions || `720p 1080p`,
      )
      .map((value) => ({
        label: value,
        value: value
      })),
      firstSeedanceResolution =
      seedanceResolutionOptions[0]?.value ||
      (isTongyiWanxiang ? `720P` : `720p`),
      [prompt, setPrompt] = useState(data.prompt || ``),
      [size, setSize] = useState(
        isSeedanceOrWanxiang ? data.size || `16:9` : String(data.size || `1280x720`).trim(),
      ),
      [selectedAspectRatio, setSelectedAspectRatio] = useState(
        normalizeVideoAspectRatioValue(
          data.selectedAspectRatio || data.videoAspectRatio,
          data.size || `1280x720`,
        ),
      ),
      [selectedSeconds, setSelectedSeconds] = useState(
        data.selectedSeconds && videoDurationOptions.includes(data.selectedSeconds) ?
        data.selectedSeconds :
        firstVideoDuration,
      ),
	      [seedanceResolution, setSeedanceResolution] = useState(
	        data.selectedResolution &&
	        seedanceResolutionOptions.some(
	          (resolution) => resolution.value === data.selectedResolution,
	        ) ?
        data.selectedResolution :
        firstSeedanceResolution,
	      ),
	      [selectedVideoQuality, setSelectedVideoQuality] = useState(data.selectedVideoQuality || data.selectedQuality || data.selectedResolution || `720P`),
	      [selectedModel, _] = useState(() =>
	        WanJuanGetPreferredModel(activeVideoModelText, activeVideoSelectedModel || ``, void 0, {
	          manual: activeVideoModelManual,
	          auto: data.wanjuanModelAuto === !0,
	        }),
	      ),
      seedanceApiOptions = Array.isArray(data.apiConfigs) ?
      data.apiConfigs.filter((apiConfig) => apiConfig && apiConfig.id) :
      [],
      [seedanceApiConfigId, setSeedanceApiConfigId] = useState(
        isSeedanceOrWanxiang ?
        data.selectedApiConfigId ||
        data.videoModelApiBindings?.[
          data.selectedModel ||
          (activeVideoModelText &&
            activeVideoModelText
            .split(
              `
`,
            )[0]
            .trim()) ||
          ``
        ] ||
        data.apiConfigId ||
        `` :
        ``,
      ),
      [seedanceApiMenuOpen, setSeedanceApiMenuOpen] = useState(!1),
	      seedanceApiMenuRef = useRef(null),
	      [isFullscreen, setIsFullscreen] = useState(!1),
	      [isHovered, setIsHovered] = useState(!1),
	      [videoPreviewReady, setVideoPreviewReady] = useState(!1),
	      [videoPlaybackError, setVideoPlaybackError] = useState(``),
	      fileInputRef = useRef(null),
      [w, T] = useState(!1),
      O = useRef(null),
      favoriteModels = WanJuanUseFavoriteModels(),
	      wanjuanModelManualRef = useRef(activeVideoModelManual),
      [k, j] = useState(!1),
      M = useRef(null),
      [menuOpen, setMenuOpen] = useState(!1),
      menuRef = useRef(null),
	      [isMentionPickerOpen, setIsMentionPickerOpen] = useState(!1),
	      [currentPage, setCurrentPage] = useState(1),
	      [resourceTypeFilter, setResourceTypeFilter] = useState(`all`),
	      [resourceSourceFilter, setResourceSourceFilter] = useState(`generated`),
	      [resourceFavoriteOnly, setResourceFavoriteOnly] = useState(!1),
	      [transitResources, setTransitResources] = useState([]),
      [selectedContextResources, setSelectedContextResources] = useState(data.selectedContextResources || []),
      [seedancePortraitPickerOpen, setSeedancePortraitPickerOpen] = useState(!1),
      seedancePortraitPickerRef = useRef(null),
	      [tianjiNodePortraitAssets, setTianjiNodePortraitAssets] = useState([]),
	      [tianjiPortraitPickerRefreshing, setTianjiPortraitPickerRefreshing] = useState(!1),
	      [seedancePortraitPickerPage, setSeedancePortraitPickerPage] = useState(1),
	      [tianjiPortraitPickerReachedEnd, setTianjiPortraitPickerReachedEnd] = useState(!1),
	      [tianjiPortraitPickerTotalCount, setTianjiPortraitPickerTotalCount] = useState(0),
	      seedanceNodeVirtualPortraits = wanjuanNormalizeSeedanceVirtualPortraits(data.seedanceVirtualPortraits || []);
	    const shouldRenderVideo = !!data.videoUrl && (data.wanjuanRenderMode === `full` || isHovered || selected);
	    const wanjuanVideoMedia = useWanJuanMediaBudget(`video`, nodeId, shouldRenderVideo);
	    useEffect(() => setVideoPreviewReady(!1), [data.videoUrl]);
	    let applyPreferredVideoModel = (favoritesOverride = favoriteModels.favorites) => {
	      if (!activeVideoModelText) return;
	      let currentModel = selectedModel || activeVideoSelectedModel || ``;
	      if (!WanJuanShouldAutoPreferredModel(activeVideoModelText, currentModel, {
	          manual: wanjuanModelManualRef.current || activeVideoModelManual,
	          auto: data.wanjuanModelAuto === !0,
	        })) return;
	      let nextModel = WanJuanGetPreferredModel(activeVideoModelText, currentModel, favoritesOverride, {
	        auto: !0
	      });
	      nextModel &&
	        !WanJuanSameModelId(nextModel, currentModel) &&
	        ((wanjuanModelManualRef.current = !1),
	          _(nextModel),
	          updateNodeData(nodeId, {
	            selectedModel: nextModel,
	            ...(isSeedanceOrWanxiang && !isTongyiWanxiang && seedanceModeValue === `tianji` ? {
	              tianjiSelectedModel: nextModel
	            } : {}),
	            ...(isSeedanceOrWanxiang && !isTongyiWanxiang && seedanceModeValue !== `tianji` ? {
	              seedanceSelectedModel: nextModel
	            } : {}),
	            wanjuanModelAuto: !0,
	            wanjuanModelManual: !1
	          }));
	    };
    let resolvePendingTianjiPortraitNodes = (assetsPayload, {
      showToastResolved: showToastResolved = !1
    } = {}) => {
      let usableAssets = wanjuanTianjiFlattenPortraitAssets(assetsPayload);
      if (!usableAssets.length) return 0;
      let resolvedCount = 0;
      setVideoNodes((nodes) =>
        nodes.map((node: any) => {
          if (node?.data?.tianjiPortraitBindingStatus !== `pending`) return node;
          let resolved = wanjuanTianjiResolvePortraitAssetForNodeData(node.data, usableAssets);
          if (!resolved?.assetId) return node;
          resolvedCount += 1;
          return {
            ...node,
            data: {
              ...node.data,
              tianjiPortraitAssetId: resolved.assetId,
              tianjiPortraitGroupType: resolved.groupType || node.data.tianjiPortraitGroupType || `AIGC`,
              tianjiPortraitPreviewUrl: resolved.imageUrl || node.data.tianjiPortraitPreviewUrl || node.data.imageUrl,
              isTianjiPortrait: !0,
              sourceOrigin: `tianji-portrait`,
              tianjiPortraitBindingStatus: `ready`,
              tianjiPortraitBindingMessage: `已自动绑定天玑素材库最终人像 ID`,
              tianjiPortraitBoundAt: Date.now(),
            },
          };
        }),
      );
      resolvedCount > 0 &&
        showToastResolved &&
        data.onShowToast?.(`已自动绑定 ${resolvedCount} 个等待中的天玑人像素材`);
      return resolvedCount;
    };
    (useEffect(() => {
        if (data.selectedContextResources) {
          let nextContextResources = isSeedanceOrWanxiang ?
            data.selectedContextResources.filter(
              (resource) =>
              !(
                resource?.isSeedanceVirtualPortrait ||
                resource?.seedanceAssetId ||
                resource?.source === `seedance-virtual-portrait` ||
                resource?.sourceOrigin === `seedance-virtual-portrait`
              ),
            ) :
            data.selectedContextResources;
          (setSelectedContextResources(nextContextResources),
            isSeedanceOrWanxiang &&
            nextContextResources.length !== data.selectedContextResources.length &&
            updateNodeData(nodeId, {
              selectedContextResources: nextContextResources
            }));
        }
      }, [data.selectedContextResources, isSeedanceOrWanxiang, nodeId, updateNodeData]),
      useEffect(() => {
        if (!isSeedanceOrWanxiang || seedanceModeValue !== `tianji`) return;
        let cancelled = !1,
          applyTianjiPortraitAssets = (stored) => {
            if (cancelled) return;
	            setTianjiNodePortraitAssets(wanjuanNormalizeTianjiPortraitAssets(stored?.tianjiSeedanceAssets || {}));
	            resolvePendingTianjiPortraitNodes(stored?.tianjiSeedanceAssets || {});
	            setTianjiPortraitPickerReachedEnd(!1);
	            setTianjiPortraitPickerTotalCount(0);
	          };
        if (typeof chrome < `u` && chrome.storage?.local) {
          chrome.storage.local.get([`tianjiSeedanceAssets`], applyTianjiPortraitAssets);
          let handleStorageChange = (changes, areaName) => {
            areaName === `local` &&
              changes?.tianjiSeedanceAssets &&
              applyTianjiPortraitAssets({
                tianjiSeedanceAssets: changes.tianjiSeedanceAssets.newValue
              });
          };
          chrome.storage.onChanged?.addListener?.(handleStorageChange);
          return () => {
            cancelled = !0;
            chrome.storage.onChanged?.removeListener?.(handleStorageChange);
          };
        }
        applyTianjiPortraitAssets({});
        return () => {
          cancelled = !0;
        };
      }, [isSeedanceOrWanxiang, seedanceModeValue, seedancePortraitPickerOpen]),
      useEffect(() => {
        if (!isSeedanceOrWanxiang) {
          seedanceApiConfigId !== `` && setSeedanceApiConfigId(``);
          return;
        }
        let resolvedApiConfigId =
          data.selectedApiConfigId ||
          data.videoModelApiBindings?.[selectedModel] ||
          data.apiConfigId ||
          ``;
        resolvedApiConfigId !== seedanceApiConfigId && setSeedanceApiConfigId(resolvedApiConfigId);
      }, [
        isSeedanceOrWanxiang,
        data.selectedApiConfigId,
        data.apiConfigId,
        data.videoModelApiBindings,
        selectedModel,
        seedanceApiConfigId,
      ]),
      useEffect(() => {
        isMentionPickerOpen &&
          Promise.resolve({ default: localforage })
            .then((mod: any) => {
              mod.default
                .getItem(`transitResources`)
                .then((storedResources) => {
                  storedResources && Array.isArray(storedResources) && storedResources.length > 0 ?
                    setTransitResources(storedResources) :
                    typeof chrome < `u` &&
                    chrome.storage &&
                    chrome.storage.local.get(
                      [`transitResources`],
                      (payload) => {
                        payload.transitResources && setTransitResources(payload.transitResources);
                      },
                    );
                })
                .catch((error) => {
                  (console.error(
                      `Failed to fetch resources from localforage`,
                      error,
                    ),
                    typeof chrome < `u` &&
                    chrome.storage &&
                    chrome.storage.local.get(
                      [`transitResources`],
                      (payload) => {
                        payload.transitResources && setTransitResources(payload.transitResources);
                      },
                    ));
                });
            });
      }, [isMentionPickerOpen]),
      useEffect(() => {
        let handleClickOutside = (event) => {
          (seedanceApiMenuRef.current &&
            !seedanceApiMenuRef.current.contains(event.target) &&
            setSeedanceApiMenuOpen(!1),
            O.current && !O.current.contains(event.target) && T(!1),
            M.current && !M.current.contains(event.target) && j(!1),
            menuRef.current && !menuRef.current.contains(event.target) && setMenuOpen(!1),
            seedancePortraitPickerRef.current &&
            !seedancePortraitPickerRef.current.contains(event.target) &&
            setSeedancePortraitPickerOpen(!1));
        };
        return (
          (seedanceApiMenuOpen || w || k || menuOpen || seedancePortraitPickerOpen) &&
          document.addEventListener(`mousedown`, handleClickOutside, !0),
          () => {
            document.removeEventListener(`mousedown`, handleClickOutside, !0);
          }
        );
      }, [seedanceApiMenuOpen, w, k, menuOpen, seedancePortraitPickerOpen]));
    (useEffect(() => {
      if (!isFullscreen) return;
      let handleKeyDown = (event) => {
        event.key === `Escape` && setIsFullscreen(!1);
      };
      return (
        document.addEventListener(`keydown`, handleKeyDown, !0),
        () => document.removeEventListener(`keydown`, handleKeyDown, !0)
      );
    }, [isFullscreen]));
    let selectedVideoProtocolName = data.videoModelProtocolBindings?.[selectedModel] || ``,
      selectedVideoProtocol = selectedVideoProtocolName && data.modelProtocolRegistry?.[selectedVideoProtocolName] && typeof data.modelProtocolRegistry[selectedVideoProtocolName] === `object` ? data.modelProtocolRegistry[selectedVideoProtocolName] : {},
      inferredVideoParameterMode = wanjuanResolveVideoParameterMode(selectedVideoProtocol),
      videoParameterMode = isSeedanceOrWanxiang ? `ratio-quality` : data.videoParameterMode || inferredVideoParameterMode,
      videoParameterModeOptions = [
        { value: `ratio-quality`, label: `比例与清晰度` },
        { value: `exact-resolution`, label: `精确分辨率` },
      ],
      videoQualityOptions = (Array.isArray(selectedVideoProtocol?.parameterOptions?.qualities) ? selectedVideoProtocol.parameterOptions.qualities : [`480P`, `720P`, `1080P`]).map((quality) => ({ label: String(quality), value: String(quality) })),
      qualityModelVariants = selectedVideoProtocol?.qualityModelVariants && typeof selectedVideoProtocol.qualityModelVariants === `object` ? selectedVideoProtocol.qualityModelVariants : {},
      videoResolutionOptions = data.videoResolutions ?
      parseSeedanceList(data.videoResolutions).map((value) => ({
        label: value,
        value: value,
      })) :
      WANJUAN_VIDEO_SIZE_PRESETS.map((option) => ({
        label: option.value,
        value: option.value
      })),
      videoAspectRatioOptions = (
        data.videoAspectRatios ?
        parseSeedanceList(data.videoAspectRatios) :
        [`16:9`, `9:16`, `1:1`, `3:2`, `2:3`]
      ).map((aspectRatio) => ({
        label: aspectRatio,
        value: normalizeVideoAspectRatioValue(aspectRatio, size)
      })),
      seedanceBoundApiConfigId =
      isSeedanceOrWanxiang && selectedModel && data.videoModelApiBindings ? data.videoModelApiBindings[selectedModel] || `` : ``,
      seedanceBoundApiConfig = seedanceApiOptions.find(
        (apiConfig) => apiConfig.id === seedanceBoundApiConfigId,
      ),
      seedanceActiveApiConfig = seedanceApiOptions.find(
        (apiConfig) => apiConfig.id === (seedanceApiConfigId || seedanceBoundApiConfigId),
      ),
      seedanceApiButtonLabel = seedanceActiveApiConfig ?
      seedanceActiveApiConfig.name ||
      seedanceActiveApiConfig.label ||
      seedanceActiveApiConfig.id :
      `跟随模型`,
      [isExpanded, setIsExpanded] = useState(!data.videoUrl),
      connections = useNodeConnections({
        handleType: `target`
      }),
      sourceNodesData = useNodesData(useMemo(() => connections.map((connection) => connection.source), [connections])),
      contextResources = (() => {
        if (!sourceNodesData) return {
          images: [],
          videos: [],
          audios: [],
          texts: []
        };
        let sourceNodes = Array.isArray(sourceNodesData) ? sourceNodesData : [sourceNodesData],
          images = [],
          videoRefs = [],
          audioRefs = [],
          seedanceResources = [],
          nodeEntries = [],
          processedSourceIds = new Set();
        return (
          sourceNodes.forEach((node: any) => {
            if (!node || processedSourceIds.has(node.id)) return; // 同源多条边只处理一次
            processedSourceIds.add(node.id);
            if (
              (node?.data?.imageUrl &&
                ((node.data.imageUrl.startsWith(`data:video/`) ||
                    /\.(mp4|webm|mov|ogg)($|\?)/i.test(node.data.imageUrl)) ?
	                  (videoRefs.push({
	                      id: node.id,
	                      sourceId: node.id,
	                      url: node.data.imageUrl,
                      label: node.data.label || `视频节点`,
                    }),
	                    seedanceResources.push({
	                      id: node.id,
	                      sourceId: node.id,
	                      url: node.data.imageUrl,
                      label: node.data.label || `视频节点`,
                      kind: `video`,
                    })) :
	                  (images.push({
	                      id: node.id,
	                      sourceId: node.id,
	                      url: node.data.imageUrl,
                      label: node.data.label || `图片节点`,
                    }),
	                    seedanceResources.push({
	                      id: node.id,
	                      sourceId: node.id,
	                      url: node.data.imageUrl,
                      label: node.data.label || `图片节点`,
                      kind: `image`,
                    }))),
                node?.data?.videoUrl &&
	                (videoRefs.push({
	                    id: node.id,
	                    sourceId: node.id,
	                    url: node.data.videoUrl,
                    label: node.data.label || `视频节点`,
                  }),
	                  seedanceResources.push({
	                    id: node.id,
	                    sourceId: node.id,
	                    url: node.data.videoUrl,
                    label: node.data.label || `视频节点`,
                    kind: `video`,
                  })),
                node?.data?.audioUrl &&
	                (audioRefs.push({
	                    id: node.id,
	                    sourceId: node.id,
	                    url: node.data.audioUrl,
                    label: node.data.label || `音频节点`,
                  }),
	                  seedanceResources.push({
	                    id: node.id,
	                    sourceId: node.id,
	                    url: node.data.audioUrl,
                    label: node.data.label || `音频节点`,
                    kind: `audio`,
                  })),
                node?.type === `videoExtractNode` && node?.data?.extractedImages)
            ) {
              let frameConnections = connections.filter((connection) => connection.source === node?.id && connection.sourceHandle && connection.sourceHandle.startsWith(`frame-`));
              if (frameConnections.length)
                frameConnections.forEach((frameConnection) => {
                let frameIndex = parseInt(frameConnection.sourceHandle.replace(`frame-`, ``), 10);
                if (!(node.data.hiddenIndices || []).includes(frameIndex)) {
                  let extractedImages = node.data.allExtractedImages;
                  extractedImages &&
                    extractedImages[frameIndex] &&
	                    (images.push({
	                        id: `${node.id}-ext-${frameIndex}`,
	                        sourceId: node.id,
	                        url: extractedImages[frameIndex]
                      }),
	                      seedanceResources.push({
	                        id: `${node.id}-ext-${frameIndex}`,
	                        sourceId: node.id,
	                        url: extractedImages[frameIndex],
                        label: `抽帧图片`,
                        kind: `image`,
                      }));
                }
                });
              else
                node.data.extractedImages.forEach((n, index) => {
	                  (images.push({
	                      id: `${node.id}-ext-${index}`,
	                      sourceId: node.id,
	                      url: n
                    }),
	                    seedanceResources.push({
	                      id: `${node.id}-ext-${index}`,
	                      sourceId: node.id,
	                      url: n,
	                      label: `抽帧图片`,
	                      kind: `image`,
	                    }));
	                });
            }
	            (node?.type === `textNode` || node?.type === `promptNode`) &&
	              node?.data?.text &&
	              !node?.data?.imageUrl &&
	              !node?.data?.videoUrl &&
	              !node?.data?.audioUrl &&
	              ![`image`, `video`, `audio`].includes(node?.data?.mediaKind) &&
	              nodeEntries.push({
                id: node.id,
                label: node?.type === `audioNode` ?
                  `音频结果` :
                  node.data.label || `文本节点`,
                text: node.data.text,
              });
          }), {
            images: images,
            videos: videoRefs,
            audios: audioRefs,
            texts: nodeEntries,
            resources: seedanceResources,
          }
        );
      })(),
	      seedanceMentionResources = (() => {
	        let typeCounts = {
	            image: 0,
	            video: 0,
	            audio: 0
          },
          labelResource = (kind, resource) => (
            (typeCounts[kind] += 1), {
              ...resource,
              type: kind,
              label: resource.label ||
                `${kind === `image` ? `图片` : kind === `video` ? `视频` : `音频`}${typeCounts[kind]}`,
              mention: wanjuanFormatMentionToken(`${kind === `image` ? `图片` : kind === `video` ? `视频` : `音频`}${typeCounts[kind]}`),
              sourceKind: `generated`,
            }
          ),
          allResources = contextResources.resources || [
            ...contextResources.images.map((image) => ({
              ...image,
              kind: `image`
            })),
            ...contextResources.videos.map((video) => ({
              ...video,
              kind: `video`
            })),
            ...contextResources.audios.map((audio) => ({
              ...audio,
              kind: `audio`
            })),
	          ];
	        return allResources.reduce((result, resource) => {
	          if (wanjuanResourceInList(resource, result)) return result;
	          result.push(labelResource(resource.kind || `image`, resource));
	          return result;
	        }, []);
	      })(),
	      seedanceMentionPickerResources = seedanceMentionResources;
	    let seedancePortraitPickerIsTianji = seedanceModeValue === `tianji`,
	      seedancePortraitPickerTitle = seedancePortraitPickerIsTianji ? `天玑人像库` : `虚拟人像库`,
	      seedancePortraitPickerItems = seedancePortraitPickerIsTianji ? tianjiNodePortraitAssets : seedanceNodeVirtualPortraits;
	    let seedancePortraitPickerPageSize = 10,
	      seedancePortraitPickerLoadedPages = Math.max(1, Math.ceil(seedancePortraitPickerItems.length / seedancePortraitPickerPageSize)),
	      seedancePortraitPickerRemotePages =
	      seedancePortraitPickerIsTianji && tianjiPortraitPickerTotalCount ?
	      Math.max(1, Math.ceil(tianjiPortraitPickerTotalCount / seedancePortraitPickerPageSize)) :
	      0,
	      seedancePortraitPickerTotalPages = seedancePortraitPickerRemotePages || seedancePortraitPickerLoadedPages,
	      seedancePortraitPickerCurrentPage = Math.min(Math.max(seedancePortraitPickerPage, 1), seedancePortraitPickerTotalPages),
	      seedancePortraitPickerVisibleItems = seedancePortraitPickerItems.slice(
	        (seedancePortraitPickerCurrentPage - 1) * seedancePortraitPickerPageSize,
	        seedancePortraitPickerCurrentPage * seedancePortraitPickerPageSize,
	      ),
	      seedancePortraitPickerCanTryNextPage =
	      seedancePortraitPickerIsTianji &&
	      (seedancePortraitPickerRemotePages ?
	        seedancePortraitPickerCurrentPage < seedancePortraitPickerRemotePages :
	        seedancePortraitPickerVisibleItems.length === seedancePortraitPickerPageSize && tianjiPortraitPickerReachedEnd !== !0);
    let loadTianjiPortraitPickerPage = async (pageNumber, { showLoadingToast: showLoadingToast = !0 } = {}) => {
      if (!seedancePortraitPickerIsTianji || tianjiPortraitPickerRefreshing) return 0;
      try {
        setTianjiPortraitPickerRefreshing(!0);
        showLoadingToast && data.onShowToast?.(`正在加载天玑人像第 ${pageNumber} 页...`);
        let config = await wanjuanGetSyncedTianjiSeedanceConfig(),
          refresh = await wanjuanTianjiRefreshPortraitAssets(config, {
            preferredType: `AIGC`,
            retries: pageNumber === 1 ? 1 : 0,
            delayMs: 1200,
            pageNumber: pageNumber,
            pageSize: seedancePortraitPickerPageSize,
          }),
	          nextAssets = wanjuanNormalizeTianjiPortraitAssets(refresh?.assets || {}),
	          nextTotalCount = refresh?.aigcTotal || 0;
	        (setTianjiNodePortraitAssets(nextAssets),
	          resolvePendingTianjiPortraitNodes(refresh?.assets || {}, {
	            showToastResolved: !0
	          }),
	          setTianjiPortraitPickerTotalCount((current) => nextTotalCount || (pageNumber > 1 ? current : 0)),
	          setTianjiPortraitPickerReachedEnd(nextTotalCount ? pageNumber >= Math.ceil(nextTotalCount / seedancePortraitPickerPageSize) : (refresh?.aigcCount || 0) < seedancePortraitPickerPageSize),
	          refresh?.aigcCount > 0 && setSeedancePortraitPickerPage(pageNumber));
        return refresh?.aigcCount || 0;
      } catch (error) {
        (console.error(`Load Tianji portrait page failed`, error),
          data.onShowToast?.(`加载天玑人像失败：${error?.message || error}`));
        return 0;
      } finally {
        setTianjiPortraitPickerRefreshing(!1);
      }
    };
    let refreshTianjiPortraitPicker = async () => {
      if (!seedancePortraitPickerIsTianji || tianjiPortraitPickerRefreshing) return;
      data.onShowToast?.(`正在刷新天玑人像库...`);
      let loadedCount = await loadTianjiPortraitPickerPage(1, {
        showLoadingToast: !1
      });
      loadedCount > 0 && data.onShowToast?.(`天玑人像库已刷新：第 1 页 ${loadedCount} 个素材`);
    };
    (useEffect(() => {
        data.prompt !== void 0 && data.prompt !== prompt && setPrompt(data.prompt);
      }, [data.prompt]),
      useEffect(() => {
        data.size !== void 0 &&
          data.size !== size &&
          setSize(isSeedanceOrWanxiang ? data.size : String(data.size || `1280x720`).trim());
      }, [data.size]),
      useEffect(() => {
        let normalizedAspectRatio = normalizeVideoAspectRatioValue(
          data.selectedAspectRatio || selectedAspectRatio,
          data.size || size,
        );
        normalizedAspectRatio !== selectedAspectRatio && setSelectedAspectRatio(normalizedAspectRatio);
      }, [data.selectedAspectRatio, data.size, size, selectedAspectRatio]),
      useEffect(() => {
        seedancePortraitPickerPage !== seedancePortraitPickerCurrentPage &&
          setSeedancePortraitPickerPage(seedancePortraitPickerCurrentPage);
      }, [seedancePortraitPickerCurrentPage, seedancePortraitPickerPage]),
      useEffect(() => {
        let sizeOptions = data.videoResolutions ?
          parseSeedanceList(data.videoResolutions) :
          [];
        let currentSize = String(data.size || ``).trim();
        if (sizeOptions.length > 0 && (!data.size || !sizeOptions.includes(currentSize))) {
          let firstSize = sizeOptions[0];
          size !== firstSize && (setSize(firstSize), updateNodeData(nodeId, {
            size: firstSize
          }));
        }
      }, [data.videoResolutions, data.size, size, nodeId, updateNodeData]),
	      useEffect(() => {
	        applyPreferredVideoModel();
	      }, [activeVideoModelText, activeVideoSelectedModel, activeVideoModelManual, selectedModel, data.wanjuanModelAuto, favoriteModels.favorites, nodeId, updateNodeData]),
	      useEffect(() => {
	        let nextSelectedModel = WanJuanGetPreferredModel(activeVideoModelText, activeVideoSelectedModel || ``, favoriteModels.favorites, {
	          manual: activeVideoModelManual,
	          auto: data.wanjuanModelAuto === !0
	        });
	        nextSelectedModel && nextSelectedModel !== selectedModel && _(nextSelectedModel);
	        wanjuanModelManualRef.current = activeVideoModelManual;
	      }, [activeVideoModelText, activeVideoSelectedModel, activeVideoModelManual, data.wanjuanModelAuto, favoriteModels.favorites, selectedModel]),
      useEffect(() => {
        if (
          videoDurationOptions.length > 0 &&
          (!data.selectedSeconds || !videoDurationOptions.includes(data.selectedSeconds))
        ) {
          let defaultDuration = firstVideoDuration;
          selectedSeconds !== defaultDuration && setSelectedSeconds(defaultDuration);
          updateNodeData(nodeId, {
            selectedSeconds: defaultDuration
          });
        }
      }, [
        data.videoDurations,
        data.selectedSeconds,
        videoDurationOptions,
        firstVideoDuration,
        selectedSeconds,
        nodeId,
        updateNodeData,
      ]),
      useEffect(() => {
        data.selectedSeconds &&
          videoDurationOptions.includes(data.selectedSeconds) &&
          data.selectedSeconds !== selectedSeconds &&
          setSelectedSeconds(data.selectedSeconds);
      }, [data.selectedSeconds, videoDurationOptions, selectedSeconds]),
      useEffect(() => {
        if (isSeedanceOrWanxiang && seedanceResolutionOptions.length > 0) {
          let currentResolution = data.selectedResolution;
          if (!currentResolution || !seedanceResolutionOptions.some((option) => option.value === currentResolution)) {
            let defaultResolution = firstSeedanceResolution;
            seedanceResolution !== defaultResolution && setSeedanceResolution(defaultResolution);
            updateNodeData(nodeId, {
              selectedResolution: defaultResolution
            });
          }
        }
      }, [
        isSeedanceOrWanxiang,
        data.seedanceResolutions,
        data.selectedResolution,
        seedanceResolutionOptions,
        firstSeedanceResolution,
        seedanceResolution,
        nodeId,
        updateNodeData,
      ]),
      useEffect(() => {
        isSeedanceOrWanxiang &&
          data.selectedResolution &&
          seedanceResolutionOptions.some(
            (option) => option.value === data.selectedResolution,
          ) &&
          data.selectedResolution !== seedanceResolution &&
          setSeedanceResolution(data.selectedResolution);
      }, [
        isSeedanceOrWanxiang,
        data.selectedResolution,
        seedanceResolutionOptions,
        seedanceResolution,
      ]),
	      useEffect(() => {
	        setVideoPlaybackError(``);
	      }, [data.videoUrl]),
	      useEffect(() => {
	        data.videoUrl && !data.loading && setIsExpanded(!1);
	      }, [data.videoUrl, data.loading]));
    let handleGenerate = () => {
      if (!prompt.trim() && contextResources.images.length === 0 && contextResources.texts.length === 0) {
        data.onShowToast?.(`请输入提示词或连接参考节点`);
        return;
      }
      let requestResolution = isSeedanceOrWanxiang ? String(size || `16:9`).trim() || `16:9` : videoParameterMode === `exact-resolution` ? String(size || `1280x720`).trim() : selectedVideoQuality || String(size || `1280x720`).trim(),
        requestAspectRatio = isSeedanceOrWanxiang ? String(size || `16:9`).trim() || `16:9` : selectedAspectRatio;
      data.onGenerateVideo?.(
        nodeId,
        prompt,
        requestResolution,
        selectedModel,
        String(selectedSeconds || firstVideoDuration).split(/[\s,，、]+/)[0]?.trim() ||
        firstVideoDuration,
        isSeedanceOrWanxiang && seedanceModeValue !== `tianji` ? seedanceApiConfigId || void 0 : void 0,
        requestAspectRatio,
      );
    };
    let addSeedanceVirtualPortraitToNode = (portrait, index = 0) => {
      let portraitResource = wanjuanSeedancePortraitToResource(portrait, index);
      if (!portraitResource) {
        data.onShowToast?.(`虚拟人像缺少 Asset ID`);
        return;
      }
      setSeedancePortraitPickerOpen(!1);
      let seedancePortraitImageNodeId = `seedance-portrait-image-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      setVideoNodes((nodes) => {
        let currentNode = nodes.find((resource: any) => resource.id === nodeId),
          currentPosition = currentNode?.position || {
            x: 0,
            y: 0
          },
          baseX = Number(currentPosition.x),
          baseY = Number(currentPosition.y);
        Number.isFinite(baseX) || (baseX = 0);
        Number.isFinite(baseY) || (baseY = 0);
        return nodes.concat({
          id: seedancePortraitImageNodeId,
          type: `imageNode`,
          position: {
            x: baseX - 360,
            y: baseY + 20
          },
          style: {
            width: 224,
            height: 224
          },
          data: {
            imageUrl: portraitResource.previewUrl || portraitResource.thumbnailUrl || ``,
            label: portraitResource.name || portraitResource.label || `虚拟人像`,
            seedanceAssetId: portraitResource.seedanceAssetId,
            virtualPortraitId: portraitResource.virtualPortraitId,
            isSeedanceVirtualPortrait: !0,
            sourceOrigin: `seedance-virtual-portrait`,
          },
        });
      });
      setEdges((edges) =>
        edges.some((edge: any) => edge.source === seedancePortraitImageNodeId && edge.target === nodeId) ?
        edges :
        edges.concat({
          id: `e-${seedancePortraitImageNodeId}-${nodeId}`,
          source: seedancePortraitImageNodeId,
          target: nodeId,
        }),
      );
      data.onShowToast?.(`已添加虚拟人像参考`);
    };
    let addTianjiPortraitToNode = async (portrait, index = 0) => {
      if (portrait?.localUploaded) {
        data.onShowToast?.(`这张人像还没有从天玑素材库返回，请稍后刷新素材列表后再选择`);
        return;
      }
      let tianjiAssetStatus = String(portrait?.status || ``).trim().toLowerCase();
      if (tianjiAssetStatus && ![`active`, `success`, `succeeded`, `completed`, `complete`, `done`].includes(tianjiAssetStatus)) {
        data.onShowToast?.(tianjiAssetStatus === `failed` || tianjiAssetStatus === `fail` || tianjiAssetStatus === `error` ? `这张天玑人像处理失败，请在设置中查看详情或重新上传` : `这张天玑人像还在预处理，请稍后刷新素材列表`);
        return;
      }
      let resource = wanjuanTianjiPortraitToResource(portrait, index);
      if (!resource) {
        data.onShowToast?.(`天玑人像缺少可用图片 URL，请先在设置中刷新素材`);
        return;
      }
      setSeedancePortraitPickerOpen(!1);
      let displayImageUrl = resource.previewUrl || resource.thumbnailUrl || resource.url || ``;
      try {
        displayImageUrl = await wanjuanPortableSeedancePortraitPreview(displayImageUrl) || displayImageUrl;
      } catch (error) {
        console.warn(`Tianji portrait preview portable fallback`, error);
      }
      let tianjiPortraitImageNodeId = `tianji-portrait-image-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      setVideoNodes((nodes) => {
        let currentNode = nodes.find((node: any) => node.id === nodeId),
          currentPosition = currentNode?.position || {
            x: 0,
            y: 0
          },
          baseX = Number(currentPosition.x),
          baseY = Number(currentPosition.y);
        Number.isFinite(baseX) || (baseX = 0);
        Number.isFinite(baseY) || (baseY = 0);
        return nodes.concat({
          id: tianjiPortraitImageNodeId,
          type: `imageNode`,
          position: {
            x: baseX - 360,
            y: baseY + 20
          },
          style: {
            width: 224,
            height: 224
          },
          data: {
            imageUrl: displayImageUrl || resource.url,
            thumbnailUrl: displayImageUrl || void 0,
            tianjiPortraitPreviewUrl: resource.url,
            label: resource.name || resource.label || `天玑人像`,
            tianjiPortraitAssetId: resource.tianjiPortraitAssetId,
            tianjiPortraitGroupType: resource.groupType,
            isTianjiPortrait: !0,
            sourceOrigin: `tianji-portrait`,
          },
        });
      });
      setEdges((edges) =>
        edges.some((edge: any) => edge.source === tianjiPortraitImageNodeId && edge.target === nodeId) ?
        edges :
        edges.concat({
          id: `e-${tianjiPortraitImageNodeId}-${nodeId}`,
          source: tianjiPortraitImageNodeId,
          target: nodeId,
        }),
      );
      data.onShowToast?.(`已添加天玑人像参考`);
    };
    let peAspectRatio = (() => {
      if (data.videoAspectRatio) return data.videoAspectRatio;
      let ratioMatch = String(size || data.size || ``).trim().match(
        /^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/,
      );
      if (!ratioMatch) return;
      let width = Number(ratioMatch[1]),
        height = Number(ratioMatch[2]);
      return width > 0 && height > 0 ? `${width} / ${height}` : void 0;
    })();
    let seedanceModeToggle =
	      isSeedanceOrWanxiang && !isTongyiWanxiang ?
	      jsxs(`div`, {
	        className: `mb-2 nodrag flex w-full items-center wanjuan-seedance-mode-switch`,
	        onClick: (event) => event.stopPropagation(),
	        children: [
	          jsxs(`div`, {
	            className: `grid w-full grid-cols-2 gap-1.5 rounded-md bg-transparent`,
	            children: [
		              jsxs(`button`, {
		                type: `button`,
		                className: `h-8 min-w-0 rounded-md border px-2 text-[12px] font-semibold leading-none transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${seedanceModeValue === `official` ? `border-blue-300 bg-blue-600 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.22),0_6px_14px_rgba(37,99,235,0.22)]` : `border-[#515762] bg-[#202226] text-gray-300 hover:border-[#6b7280] hover:bg-[#2a2d33] hover:text-gray-100`}`,
		                onClick: (event) => {
		                  let modeModelText = data.seedanceModel || data.videoModel || ``,
		                    modeCurrentModel = data.seedanceSelectedModel || (seedanceModeValue === `official` ? selectedModel : ``) || ``,
		                    modeManual = data.seedanceModelManual === !0,
		                    modeSelectedModel = WanJuanGetPreferredModel(modeModelText, modeCurrentModel, favoriteModels.favorites, {
		                      manual: modeManual,
		                      auto: !modeManual
		                    });
		                  (event.stopPropagation(),
		                    modeSelectedModel && _(modeSelectedModel),
		                    (wanjuanModelManualRef.current = modeManual),
		                    updateNodeData(nodeId, {
		                      seedanceMode: `official`,
		                      videoModel: modeModelText,
		                      selectedModel: modeSelectedModel,
		                      seedanceSelectedModel: modeSelectedModel,
		                      wanjuanModelAuto: !modeManual,
		                      wanjuanModelManual: modeManual,
		                    }));
		                },
	                children: [
	                  seedanceModeValue === `official` &&
	                  jsx(`span`, {
	                    className: `h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_6px_rgba(147,197,253,0.65)]`,
	                  }),
	                  jsx(`span`, {
	                    children: `官方兼容`,
	                  }),
	                ],
	              }),
			              jsxs(`div`, {
			                className: `relative min-w-0`,
			                children: [
			                  jsxs(`button`, {
			                    type: `button`,
			                    className: `h-8 w-full min-w-0 rounded-md border px-2 pr-7 text-[12px] font-semibold leading-none transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${seedanceModeValue === `tianji` ? `border-blue-300 bg-blue-600 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.22),0_6px_14px_rgba(37,99,235,0.22)]` : `border-[#515762] bg-[#202226] text-gray-300 hover:border-[#6b7280] hover:bg-[#2a2d33] hover:text-gray-100`}`,
			                    onClick: (event) => {
			                      let modeModelText = data.tianjiSeedanceModel || data.videoModel || ``,
			                        modeCurrentModel = data.tianjiSelectedModel || (seedanceModeValue === `tianji` ? selectedModel : ``) || ``,
			                        modeManual = data.tianjiModelManual === !0,
			                        modeSelectedModel = WanJuanGetPreferredModel(modeModelText, modeCurrentModel, favoriteModels.favorites, {
			                          manual: modeManual,
			                          auto: !modeManual
			                        });
			                      (event.stopPropagation(),
			                        modeSelectedModel && _(modeSelectedModel),
			                        (wanjuanModelManualRef.current = modeManual),
			                        updateNodeData(nodeId, {
			                          seedanceMode: `tianji`,
			                          tianjiSeedanceGenerationMode: `reference-media`,
			                          videoModel: modeModelText,
			                          selectedModel: modeSelectedModel,
			                          tianjiSelectedModel: modeSelectedModel,
			                          wanjuanModelAuto: !modeManual,
			                          wanjuanModelManual: modeManual,
			                        }));
			                    },
			                    children: [
			                      seedanceModeValue === `tianji` &&
			                      jsx(`span`, {
			                        className: `h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_6px_rgba(147,197,253,0.65)]`,
			                      }),
			                      jsx(`span`, {
			                        children: `天玑真人`,
			                      }),
			                    ],
			                  }),
			                  jsx(`span`, {
			                    className: `wanjuan-seedance-tianji-help nodrag`,
			                    onClick: (event) => event.stopPropagation(),
			                    onMouseDown: (event) => event.stopPropagation(),
			                    children: jsx(WanJuanConfigButlerHelp, {
			                      tone: `info`,
			                      placement: `above-end`,
			                      title: `天玑模式说明`,
			                      children: jsxs(Fragment, {
			                        children: [
			                          `1. 天玑模式最多支持 4 张参考图片、2 个参考视频、1 个参考音频。`,
			                          jsx(`br`, {}),
			                          `2. 使用真人图片生成时，需要先在图片节点完成天玑人像审核；如果图片中没有人物正面或脸部，可以不用审核，直接连接作为参考。`,
			                          jsx(`br`, {}),
			                          `3. 如果图片节点的天玑人像审核回绑 ID 失败，可以在天玑人像库刷新素材，选择已审核完成的人像图片使用。`,
			                        ],
			                      }),
			                    }),
			                  }),
			                ],
			              }),
	            ],
	          }),
	        ],
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
	          className: `relative bg-[#1c1c1c] rounded-xl overflow-hidden border shadow-xl transition-all cursor-pointer group/display w-full flex-1 flex flex-col ${data.loading ? `wanjuan-loading-node-frame` : ``}
	            ${selected ? `border-blue-500 shadow-blue-500/20` : `border-[#333] hover:border-gray-500`}
	        `,
          onMouseEnter: () => { setIsHovered(!0); wanjuanVideoMedia.activate(); },
          onMouseLeave: () => setIsHovered(!1),
          onClick: () => setIsExpanded(!isExpanded),
          children: [
            jsxs(`div`, {
              className: `flex justify-center items-center gap-1 text-gray-400 text-[10px] py-1 border-b border-[#2a2a2a] bg-[#222] flex-shrink-0 drag-handle relative z-20`,
              children: [
                isTongyiWanxiang ?
                jsx(TongyiWanxiangLogo, {
                  size: 11,
                  className: `text-purple-400`,
                }) :
                jsx(Film, {
                  size: 10,
                  className: `text-blue-500`
                }),
                jsx(`span`, {
                  className: `truncate max-w-[150px]`,
                  children: isTongyiWanxiang ? `通义万相` : isSeedanceOrWanxiang ? `即梦节点` : `视频生成`,
                }),
                isTongyiWanxiang &&
                jsx(`span`, {
                  className: `px-1.5 py-0.5 rounded bg-black/30 text-[9px] text-purple-200 border border-purple-500/20 leading-none`,
                  children: tongyiWanxiangModeLabel,
                }),
              ],
            }),
            jsxs(`div`, {
              className: `flex items-center justify-center relative w-full flex-1 min-h-0 overflow-hidden ${data.videoUrl ? `` : `bg-[#121212]`}`,
              style: data.videoUrl ? {
                minHeight: 0
              } : {
                aspectRatio: peAspectRatio || `16 / 9`
              },
              children: [
                data.videoUrl && (!shouldRenderVideo || !wanjuanVideoMedia.enabled) &&
                (data.thumbnailUrl ?
                  jsx(`img`, {
                    src: data.thumbnailUrl,
                    alt: `视频预览`,
                    loading: `lazy`,
                    decoding: `async`,
                    draggable: !1,
                    className: `max-w-full w-full h-full object-cover object-bottom block`,
                  }) :
                  jsxs(`div`, {
                    className: `wanjuan-video-poster-fallback absolute inset-0`,
                    children: [
                      jsx(CirclePlay, { size: 30 }),
                      jsx(`span`, { children: `视频结果` }),
                      jsx(`small`, { children: `悬停预览` }),
                    ],
                  })),
                data.videoUrl && shouldRenderVideo && wanjuanVideoMedia.enabled &&
                jsxs(Fragment, {
                  children: [
                    !videoPreviewReady && !data.thumbnailUrl &&
                    jsxs(`div`, {
                      className: `wanjuan-video-poster-fallback absolute inset-0 z-[1] pointer-events-none`,
                      children: [
                        jsx(CirclePlay, { size: 30 }),
                        jsx(`span`, { children: `视频结果` }),
                        jsx(`small`, { children: `正在载入预览` }),
                      ],
                    }),
                    jsx(`video`, {
                      src: data.videoUrl,
                      poster: data.thumbnailUrl,
                      preload: `metadata`,
                      className: `max-w-full w-full h-full object-cover object-bottom block ${data.loading ? `opacity-50 blur-sm` : ``}`,
                      controls: isHovered,
	                      autoPlay: !1,
	                      muted: !1,
	                      onLoadedMetadata: (event) => {
	                        setVideoPlaybackError(``);
	                        let videoWidth = event.currentTarget.videoWidth,
                          videoHeight = event.currentTarget.videoHeight;
                        if (isSeedanceOrWanxiang && videoWidth > 0 && videoHeight > 0) {
                          let aspectRatio = videoWidth / videoHeight,
                            nodeWidth,
                            nodeHeight,
                            heightPadding = 24,
                            ratioMatch = String(size || data.selectedAspectRatio || data.size || ``).trim().match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
                          if (ratioMatch) {
                            let width = Number(ratioMatch[1]),
                              height = Number(ratioMatch[2]);
                            width > 0 && height > 0 && (aspectRatio = width / height);
                          }
                          (aspectRatio >= 1 ?
                            ((nodeWidth = Math.min(520, Math.max(320, 360 * aspectRatio))),
                              (nodeHeight = nodeWidth / aspectRatio)) :
                            ((nodeHeight = 420), (nodeWidth = nodeHeight * aspectRatio)),
                            updateNodeData(nodeId, {
                              videoAspectRatio: `${videoWidth} / ${videoHeight}`,
                              videoNaturalWidth: videoWidth,
                              videoNaturalHeight: videoHeight,
                            }),
                            setVideoNodes?.((nodes) =>
                              nodes.map((node: any) =>
                                node.id === nodeId ?
                                {
                                  ...node,
                                  style: {
                                    ...node.style,
                                    width: Math.round(nodeWidth),
                                    height: Math.round(nodeHeight + heightPadding),
                                  },
                                } :
                                node,
                              ),
                            ));
                        }
	                      },
	                      onLoadedData: () => setVideoPreviewReady(!0),
	                      onError: () => {
	                        setVideoPreviewReady(!1);
	                        setVideoPlaybackError(`视频文件不可播放，可能是本地文件丢失、下载未完成，或接口返回了网页登录页。`);
	                      },
	                      onMouseEnter: () => setIsHovered(!0),
                      onMouseLeave: () => setIsHovered(!1),
                      onClick: (event) => event.stopPropagation(),
	                    }),
	                    videoPlaybackError &&
	                    !data.loading &&
	                    jsxs(`div`, {
	                      className: `absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/72 px-6 text-center pointer-events-none`,
	                      children: [
	                        jsx(`div`, {
	                          className: `text-xs font-semibold text-red-200`,
	                          children: `视频结果失效`
	                        }),
	                        jsx(`div`, {
	                          className: `max-w-[260px] text-[11px] leading-relaxed text-red-100/80`,
	                          children: videoPlaybackError
	                        }),
	                      ],
	                    }),
	                    !isHovered &&
	                    !data.loading &&
	                    !videoPlaybackError &&
	                    jsx(`div`, {
                      className: `wanjuan-video-play-overlay pointer-events-none`,
                      children: jsx(`div`, {
                        className: `wanjuan-video-play-button`,
                        children: jsx(CirclePlay, {
                          className: `text-white/80 w-6 h-6`,
                        }),
                      }),
                    }),
                    !data.loading &&
                    jsxs(`div`, {
                      className: `absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover/display:opacity-100 transition-opacity z-20 nodrag`,
                      children: [
                        jsx(`button`, {
                          className: `p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors`,
                          title: `全屏播放`,
                          onClick: (event) => {
                            (event.stopPropagation(), setIsFullscreen(!0));
                          },
                          children: jsx(Maximize2, {
                            size: 14
                          }),
                        }),
                        jsx(`button`, {
                          className: `p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors`,
                          title: `下载`,
                          onClick: async (event) => {
                            if ((event.stopPropagation(), data.videoUrl))
                              try {
                                if (
                                  (data.onShowToast?.(`开始下载视频...`),
                                    typeof chrome < `u` && chrome.downloads)
                                )
                                  chrome.downloads.download({
                                    url: data.videoUrl,
                                    filename: `wanjuan/video-${Date.now()}.mp4`,
                                    saveAs: !1,
                                  });
                                else {
                                  let _r = await fetch(data.videoUrl);
                                  if (!_r.ok) throw Error(`下载失败: ${_r.status}`);
                                  let blob = await _r.blob(),
                                    objectUrl = window.URL.createObjectURL(blob),
                                    link = document.createElement(`a`);
                                  ((link.href = objectUrl),
                                    (link.download = `video-${Date.now()}.mp4`),
                                    document.body.appendChild(link),
                                    link.click(),
                                    window.URL.revokeObjectURL(objectUrl),
                                    document.body.removeChild(link));
                                }
                              } catch (error) {
                                (console.error(`Download failed:`, error),
                                  data.onShowToast?.(`下载失败，请重试`),
                                  window.open(data.videoUrl, `_blank`));
                              }
                          },
                          children: jsx(Download, {
                            size: 14
                          }),
                        }),
                        data.onDelete &&
                        jsx(`button`, {
                          className: `p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors`,
                          title: `删除`,
                          onClick: (event) => {
                            (event.stopPropagation(), data.onDelete?.());
                          },
                          children: jsx(Trash2, {
                            size: 14
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                data.loading &&
                jsxs(`div`, {
                  className: `absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 z-10 overflow-hidden bg-[#121212]`,
                  children: [
                    (contextResources.images[0] || data.thumbnailUrl) &&
                    jsx(`div`, {
                      className: `absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110`,
                      style: {
                        backgroundImage: `url(${data.thumbnailUrl || contextResources.images[0].url})`,
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
                          children: data.loadingText ||
                            (!data.progress || data.progress === 0 ?
                            `排队中...` :
                            `生成中... ${data.progress}%`),
                        }),
                        jsxs(`button`, {
                          onClick: (event) => {
                            (event.stopPropagation(), data.onStop?.(nodeId));
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
                !data.videoUrl &&
                !data.loading &&
                !data.errorMessage &&
                jsxs(`div`, {
                  className: `flex flex-col items-center justify-center gap-3 absolute inset-0 bg-[#151515] group-hover/display:bg-[#1a1a1a] transition-colors`,
                  children: [
                    jsxs(`div`, {
                      className: `w-16 h-16 rounded-2xl bg-[#222] border-2 border-dashed border-[#333] group-hover/display:border-blue-500/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#2a2a2a] transition-all`,
                      onClick: (event) => {
                        (event.stopPropagation(), fileInputRef.current?.click());
                      },
                      children: [
                        jsx(Upload, {
                          size: 20,
                          className: `text-gray-500 group-hover/display:text-blue-500 transition-colors`,
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
                          children: `点击配置参数`,
                        }),
                      ],
                    }),
                  ],
                }),
                data.errorMessage &&
                !data.loading &&
                jsxs(`div`, {
                  className: `absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 z-10 bg-[#1a1a1a] p-4 text-center`,
                  children: [
                    jsx(CircleAlert, {
                      size: 32
                    }),
                    jsx(`div`, {
                      className: `text-xs font-medium max-w-full break-words`,
                      children: data.errorMessage,
                    }),
                  ],
                }),
              ],
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
        isExpanded && jsx(`div`, {
          className: `absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1c1c1c] rounded-2xl border border-[#333] shadow-2xl w-[500px] transition-all duration-300 origin-top z-50 wanjuan-node-config-panel
          opacity-100 scale-100 p-4 overflow-visible
        `,
          onClick: (event) => event.stopPropagation(),
          children: jsxs(`div`, {
            className: `space-y-3`,
            children: [
              jsxs(`div`, {
                className: `flex flex-col gap-2 mb-2`,
                children: [
                  (contextResources.images.length > 0 ||
                    contextResources.videos.length > 0 ||
                    contextResources.audios.length > 0 ||
                    contextResources.texts.length > 0 ||
                    selectedContextResources.length > 0) &&
                  jsxs(`div`, {
                    className: `flex flex-wrap gap-2 mb-1`,
                    children: [
                      contextResources.images.map((resource: any, index) =>
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
                                    setEdges((prevEdges) =>
                                      prevEdges.filter(
                                        (edge) =>
                                        !(
	                                          edge.target === nodeId &&
	                                          edge.source === (resource.sourceId || resource.id)
	                                        ),
                                      ),
                                    ));
                                },
                                children: jsx(CloseX, {
                                  size: 10,
                                  className: `text-red-50`,
                                }),
                              }),
                            ],
                          },
                          `img-${index}`,
                        ),
                      ),
                      contextResources.videos.map((resource: any, index) =>
                        jsx(
                          `div`, {
                            className: `w-10 h-10 rounded-md overflow-hidden border border-purple-500/50 relative group bg-black`,
                            title: `连线视频`,
                            children: jsx(`video`, {
                              src: resource.url,
                              className: `w-full h-full object-cover opacity-80`,
                            }),
                          },
                          `vid-${index}`,
                        ),
                      ),
                      contextResources.audios.map((e, index) =>
                        jsxs(
                          `div`, {
                            className: `w-10 h-10 rounded-md overflow-hidden border border-emerald-500/50 relative group bg-[#222] flex items-center justify-center`,
                            title: `连线音频`,
                            children: [
                              jsx(Type, {
                                size: 14,
                                className: `text-emerald-300`,
                              }),
                              jsx(`span`, {
                                className: `absolute bottom-0 left-0 right-0 text-[8px] text-center text-emerald-200 bg-black/50`,
                                children: `音频`,
                              }),
                            ],
                          },
                          `aud-${index}`,
                        ),
                      ),
                      selectedContextResources
                      .filter((resource: any) => !wanjuanResourceInList(resource, contextResources.resources || contextResources.images))
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
                                children: jsx(CloseX, {
                                  size: 10,
                                  className: `text-red-50`,
                                }),
                              }),
                            ],
                          },
                          `ctx-${index}`,
                        ),
                      ),
                      contextResources.texts.map((item: any, index) =>
                        jsxs(
                          `div`, {
                            className: `h-8 px-2 bg-[#2a2a2a] border border-[#444] rounded flex items-center gap-1 text-[10px] text-gray-300 hover:bg-[#333] hover:border-blue-500 hover:text-blue-400 transition-colors cursor-help group/text`,
                            title: item.text,
                            children: [
                              jsx(Type, {
                                size: 10
                              }),
                              jsx(`span`, {
                                className: `max-w-[80px] truncate`,
                                children: item.label,
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
	                      jsxs(`div`, {
	                        className: `flex-1 nodrag relative flex flex-col`,
	                        children: [
	                          seedanceModeToggle,
	                          jsx(`textarea`, {
	                            className: `block w-full h-20 bg-transparent text-[15px] text-gray-200 resize-y min-h-[80px] outline-none leading-relaxed placeholder-gray-600 font-sans custom-scrollbar nodrag wanjuan-video-prompt-textarea`,
                            placeholder: isSeedanceOrWanxiang && !isTongyiWanxiang ?
                              `描述视频，可输入 @图片1 / @视频1 / @音频1 调用多参...` :
                              `输入提示词以开展你的任务`,
		                            value: prompt,
		                            onChange: (event) => {
	                              let value = event.target.value;
	                              (setPrompt(value),
	                                updateNodeData(nodeId, {
	                                  prompt: value
	                                }));
	                              wanjuanShouldShowMentionPicker(event.currentTarget) ?
	                                (setSeedanceApiMenuOpen(!1), T(!1), j(!1), setMenuOpen(!1), setSeedancePortraitPickerOpen(!1), setIsMentionPickerOpen(!0)) :
	                                setIsMentionPickerOpen(!1);
		                            },
	                            onKeyDown: (event) => {
	                              let deletionResult = wanjuanDeleteMentionTokenAsUnit(event, (value) => {
	                                (setPrompt(value),
	                                  updateNodeData(nodeId, {
	                                    prompt: value
	                                  }),
	                                  setIsMentionPickerOpen(!1));
	                              });
	                              if (deletionResult !== null) return;
	                              event.key === `Enter` &&
	                                (event.ctrlKey || event.metaKey) &&
	                                handleGenerate();
                            },
                            autoFocus: isExpanded,
                            onWheel: (event) => event.stopPropagation(),
		                          }),
		                          false &&
		                          isSeedanceOrWanxiang &&
		                          seedanceApiOptions.length > 0 &&
	                          jsxs(`div`, {
	                            className: `absolute top-2 right-2 nodrag flex items-center wanjuan-seedance-api-picker wanjuan-seedance-api-picker-in-prompt`,
	                            style: {
	                              zIndex: seedanceApiMenuOpen ? 12000 : 2
	                            },
	                            ref: seedanceApiMenuRef,
                            children: [
                              jsx(`button`, {
                                className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[120px] wanjuan-node-picker-trigger wanjuan-seedance-api-trigger`,
	                                onClick: (event) => {
	                                  let nextOpen = !seedanceApiMenuOpen;
	                                  (event.stopPropagation(),
	                                    setSeedanceApiMenuOpen(nextOpen),
	                                    nextOpen && (setIsMentionPickerOpen(!1), T(!1), j(!1), setMenuOpen(!1), setSeedancePortraitPickerOpen(!1)));
	                                },
                                title: `选择 API 配置`,
                                children: jsx(`span`, {
                                  className: `truncate`,
                                  children: seedanceApiButtonLabel,
                                }),
                              }),
                              seedanceApiMenuOpen &&
	                              jsxs(`div`, {
	                                className: `absolute top-full right-0 mt-1 w-56 bg-[#222] border border-[#333] rounded-lg shadow-xl p-2 z-50 flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar wanjuan-seedance-api-menu`,
	                                style: {
	                                  zIndex: 12001
	                                },
	                                onClick: (event) => event.stopPropagation(),
                                children: [
                                  jsx(`div`, {
                                    className: `text-[10px] text-gray-500 mb-1 px-1`,
                                    children: `API 配置`,
                                  }),
                                  jsx(`button`, {
                                    className: `text-left px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceApiConfigId ? `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200` : `bg-blue-500 text-white wanjuan-node-popover-option-active`}`,
                                    onClick: () => {
                                      (setSeedanceApiConfigId(``),
                                        updateNodeData(nodeId, {
                                          selectedApiConfigId: void 0,
                                          apiConfigId: void 0,
                                        }),
                                        setSeedanceApiMenuOpen(!1));
                                    },
                                    children: seedanceBoundApiConfig ?
                                      `跟随模型绑定 · ${seedanceBoundApiConfig.name || seedanceBoundApiConfig.label || seedanceBoundApiConfig.id}` :
                                      `跟随模型绑定`,
                                  }),
                                  seedanceApiOptions.map((apiConfig) =>
                                    jsx(
                                      `button`, {
                                        className: `text-left px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceApiConfigId === apiConfig.id ? `bg-blue-500 text-white wanjuan-node-popover-option-active` : `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                        onClick: () => {
                                          (setSeedanceApiConfigId(apiConfig.id),
                                            updateNodeData(nodeId, {
                                              selectedApiConfigId: apiConfig.id,
                                              apiConfigId: apiConfig.id,
                                            }),
                                            setSeedanceApiMenuOpen(!1));
                                        },
                                        title: apiConfig.name || apiConfig.label || apiConfig.url || apiConfig.id,
                                        children: apiConfig.name || apiConfig.label || apiConfig.url || apiConfig.id,
                                      },
                                      apiConfig.id,
                                    ),
                                  ),
                                ],
                              }),
                            ],
                          }),
                          isMentionPickerOpen &&
                          jsxs(`div`, {
			                            className: `wanjuan-mention-picker absolute top-full left-0 mt-1 w-[380px] bg-[#22272f] border border-[#3a4250] rounded-lg shadow-2xl z-[100] flex flex-col overflow-hidden h-[320px] nopan`,
                            onWheel: (event) => event.stopPropagation(),
                            onClick: (event) => event.stopPropagation(),
                            children: [
                              wanjuanRenderResourcePickerHeader({
                                activeKind: resourceTypeFilter,
                                onSelectKind: setResourceTypeFilter,
                                activeSource: resourceSourceFilter,
                                onSelectSource: setResourceSourceFilter,
                                favoriteOnly: resourceFavoriteOnly,
                                setFavoriteOnly: setResourceFavoriteOnly,
                                setPage: setCurrentPage,
                                onClose: () => setIsMentionPickerOpen(!1),
                                closeContent: jsx(CloseX, { size: 12 }),
                              }),
                              jsx(`div`, {
                                className: `p-2 flex-1 overflow-y-auto wanjuan-node-scroll-area wanjuan-mention-picker-list`,
                                children: (() => {
			                                  let filteredResources = (isSeedanceOrWanxiang ? seedanceMentionPickerResources : transitResources).filter((resource: any) => wanjuanResourceMatchesFilter(resource, resourceTypeFilter, resourceSourceFilter, resourceFavoriteOnly));
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
                                              onMouseDown: (event) =>
                                                event.preventDefault(),
	                                              onClick: (event) => {
		                                                let mentionRange = wanjuanMentionRangeFromPicker(event.currentTarget, prompt),
		                                                  prefix = mentionRange ? prompt.substring(0, mentionRange.start) : prompt,
		                                                  suffix = mentionRange ? prompt.substring(mentionRange.end) : ``,
		                                                  replacedPrompt = wanjuanReplaceMentionToken(prompt, mentionRange);
	                                                wanjuanClearMentionPickerPosition(event.currentTarget);
				                                                if (isSeedanceOrWanxiang && wanjuanResourceKind(resource) !== `text`) {
			                                                  let seedanceKind = wanjuanResourceKind(resource),
			                                                    seedanceMentionLabel = resource.mention || `${seedanceKind === `video` ? `视频` : seedanceKind === `audio` ? `音频` : `图片`}${selectedContextResources.filter((resource2) => wanjuanResourceKind(resource2) === seedanceKind).length + 1}`,
			                                                    mentionToken = wanjuanFormatMentionToken(seedanceMentionLabel),
			                                                    newPrompt = `${prefix}${mentionToken}${suffix}`,
		                                                    updatedResources = [
	                                                      ...selectedContextResources.filter(
	                                                        (item) =>
	                                                        item.mention !==
	                                                        mentionToken &&
	                                                        wanjuanLegacyMentionToken(item.mention) !==
	                                                        wanjuanLegacyMentionToken(mentionToken) &&
	                                                        !wanjuanResourceSameIdentity(item, resource),
                                                      ),
                                                      {
	                                                        ...resource,
	                                                        type: seedanceKind,
	                                                        mention: mentionToken
	                                                      },
                                                    ];
                                                  (setSelectedContextResources(updatedResources),
                                                    updateNodeData(nodeId, {
                                                      selectedContextResources: updatedResources,
                                                      prompt: newPrompt,
                                                    }),
                                                    setPrompt(newPrompt),
                                                    setIsMentionPickerOpen(!1));
                                                  return;
	                                                }
		                                                if (wanjuanResourceKind(resource) === `text`) {
	                                                  let newPrompt = wanjuanReplaceMentionToken(prompt, mentionRange, resource.url || ``);
                                                  (setPrompt(newPrompt),
                                                    updateNodeData(nodeId, {
                                                      prompt: newPrompt
                                                    }));
                                                } else {
                                                  let updatedResources = [...selectedContextResources, resource];
                                                  (setSelectedContextResources(updatedResources),
                                                    updateNodeData(nodeId, {
                                                      selectedContextResources: updatedResources,
                                                    }),
                                                    setPrompt(replacedPrompt),
                                                    updateNodeData(nodeId, {
                                                      prompt: replacedPrompt
                                                    }));
                                                }
                                                setIsMentionPickerOpen(!1);
                                              },
                                              children: [
		                                                wanjuanRenderResourcePreview(resource),
                                                isSeedanceOrWanxiang &&
                                                resource.mention &&
                                                jsx(`div`, {
                                                  className: `absolute left-0 right-0 bottom-0 bg-black/70 text-[9px] text-cyan-200 text-center truncate px-1`,
                                                  children: resource.mention,
                                                }),
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
		                                let filteredResources = (isSeedanceOrWanxiang ? seedanceMentionPickerResources : transitResources).filter((resource: any) => wanjuanResourceMatchesFilter(resource, resourceTypeFilter, resourceSourceFilter, resourceFavoriteOnly)).length,
                                  totalPages = Math.ceil(filteredResources / 16);
                                return totalPages <= 1 ?
                                  null :
                                  jsxs(`div`, {
	                                    className: `flex items-center justify-between p-2 border-t border-[#333b46] bg-[#20252c]`,
                                    children: [
                                      jsx(`button`, {
                                        disabled: currentPage === 1,
                                        onClick: () =>
                                          setCurrentPage((prevPage) => Math.max(1, prevPage - 1)),
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
                                          setCurrentPage((prevPage) => Math.min(totalPages, prevPage + 1)),
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
		                className: `wanjuan-video-node-toolbar relative z-20 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2a2a2a] nodrag`,
		                style: {
		                  zIndex: 10000
		                },
	                children: [
	                  jsxs(`div`, {
	                    className: `wanjuan-video-node-toolbar-options flex flex-wrap items-center gap-1.5 min-w-0 flex-1 overflow-visible`,
                    children: [
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: menuRef,
                        children: [
                          jsxs(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[120px] wanjuan-node-picker-trigger`,
	                            onClick: (event) => {
	                              (event.stopPropagation(), setSeedanceApiMenuOpen(!1), setIsMentionPickerOpen(!1), T(!1), j(!1), setSeedancePortraitPickerOpen(!1), setMenuOpen(!menuOpen));
	                            },
	                            title: isSeedanceOrWanxiang ? `选择比例和时长` : `${wanjuanVideoParameterModeLabel(videoParameterMode)}参数`,
                            children: [
                              jsx(Square, {
                                size: 12,
                                className: `opacity-70`,
                              }),
                              jsxs(`span`, {
                                className: `truncate`,
	                                children: isSeedanceOrWanxiang ?
                                  [
                                    size || `16:9`,
                                    ` · `,
	                                    seedanceResolution ||
                                    firstSeedanceResolution,
                                    ` · `,
                                    String(selectedSeconds || firstVideoDuration).trim().toLowerCase() === `auto` ?
                                    `auto` :
                                    `${selectedSeconds || firstVideoDuration}s`,
	                                  ] : videoParameterMode === `ratio-quality` ?
	                                  [selectedAspectRatio, ` · `, selectedVideoQuality, ` · `, `${selectedSeconds || firstVideoDuration}s`] :
	                                  videoParameterMode === `follow-source` ?
	                                  [wanjuanVideoParameterModeLabel(videoParameterMode), Object.keys(qualityModelVariants).length ? ` · ${selectedVideoQuality}` : ``, ` · ${selectedSeconds || firstVideoDuration}s`] :
	                                  [
	                                    String(size || `1280x720`).trim(),
	                                    ` · `,
                                    String(selectedSeconds || firstVideoDuration).trim().toLowerCase() === `auto` ?
                                    `auto` :
                                    `${selectedSeconds || firstVideoDuration}s`,
                                  ],
                              }),
                            ],
                          }),
                          menuOpen &&
	                          jsxs(`div`, {
	                            className: `absolute bottom-full left-0 mb-1 w-48 bg-[#222] border border-[#333] rounded-lg shadow-xl p-3 z-50 flex flex-col gap-3 max-h-64 overflow-y-auto custom-scrollbar`,
	                            style: {
	                              zIndex: 13000
	                            },
	                            onClick: (event) => event.stopPropagation(),
	                            children: [
	                              !isSeedanceOrWanxiang &&
	                              jsxs(`div`, {
	                                children: [
	                                  jsx(`div`, { className: `text-[10px] text-gray-500 mb-2 px-1`, children: `参数方式` }),
	                                  jsx(`div`, {
	                                    className: `grid grid-cols-1 gap-1.5`,
	                                    children: videoParameterModeOptions.map((modeOption) => jsx(`button`, {
	                                      className: `px-3 py-1.5 text-[11px] rounded-md border transition-colors wanjuan-node-popover-option ${videoParameterMode === modeOption.value ? `bg-blue-600 border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] border-[#333] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
	                                      onClick: () => updateNodeData(nodeId, { videoParameterMode: modeOption.value }),
	                                      children: modeOption.label,
	                                    }, modeOption.value)),
	                                  }),
	                                ],
	                              }),
	                              isTongyiWanxiang &&
	                              jsxs(`div`, {
	                                children: [
	                                  jsx(`div`, {
	                                    className: `text-[10px] text-gray-500 mb-2 px-1`,
                                    children: `模式`,
                                  }),
                                  jsx(`div`, {
                                    className: `flex flex-wrap gap-1.5`,
                                    children: tongyiWanxiangModeOptions.map(
                                      (modeOption) =>
                                      jsx(
                                        `button`, {
                                          className: `px-3 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${tongyiWanxiangMode === modeOption.value ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                          onClick: () => {
                                            let modelText = getTongyiWanxiangModelText(modeOption.value),
                                              modeModelAuto = WanJuanShouldAutoPreferredModel(modelText, selectedModel || data.selectedModel || ``, {
                                                manual: wanjuanModelManualRef.current || data.wanjuanModelManual === !0,
                                                auto: data.wanjuanModelAuto === !0,
                                              }),
                                              firstModel = WanJuanGetPreferredModel(modelText, selectedModel || data.selectedModel || ``, favoriteModels.favorites, {
                                                manual: !modeModelAuto && (wanjuanModelManualRef.current || data.wanjuanModelManual === !0),
                                                auto: modeModelAuto,
                                              });
                                            wanjuanModelManualRef.current = !modeModelAuto && (wanjuanModelManualRef.current || data.wanjuanModelManual === !0);
                                            (updateNodeData(nodeId, {
                                                tongyiWanxiangMode: modeOption.value,
                                                videoModel: modelText,
                                                selectedModel: firstModel,
                                                wanjuanModelAuto: modeModelAuto,
                                                wanjuanModelManual: !modeModelAuto && wanjuanModelManualRef.current,
                                              }),
                                              firstModel && _(firstModel),
                                              setMenuOpen(!1));
                                          },
                                          children: modeOption.label,
                                        },
                                        modeOption.value,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
	                              (isSeedanceOrWanxiang || videoParameterMode === `exact-resolution`) && jsxs(`div`, {
	                                children: [
	                                  jsx(`div`, {
	                                    className: `text-[10px] text-gray-500 mb-2 px-1`,
		                                    children: isSeedanceOrWanxiang ? `比例` : `精确分辨率`,
                                  }),
                                  jsx(`div`, {
                                    className: `flex flex-wrap gap-1.5`,
                                    children: videoResolutionOptions.map(
                                      (sizeOption) =>
                                      jsx(
                                        `button`, {
                                          className: `px-3 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${size === sizeOption.value ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                          onClick: () => {
                                            (setSize(sizeOption.value),
                                              updateNodeData(nodeId, {
                                                size: sizeOption.value
                                              }));
                                          },
                                          children: sizeOption.label || sizeOption.value,
                                        },
                                        sizeOption.value,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
	                              !isSeedanceOrWanxiang && videoParameterMode === `ratio-quality` &&
                              videoAspectRatioOptions.length > 0 &&
                              jsxs(`div`, {
                                children: [
                                  jsx(`div`, {
                                    className: `text-[10px] text-gray-500 mb-2 px-1`,
                                    children: `比例`,
                                  }),
                                  jsx(`div`, {
                                    className: `flex flex-wrap gap-1.5`,
                                    children: videoAspectRatioOptions.map(
                                      (ratioOption) =>
                                      jsx(
                                        `button`, {
                                          className: `px-3 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${selectedAspectRatio === ratioOption.value ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                          onClick: () => {
                                            (setSelectedAspectRatio(
                                                ratioOption.value,
                                              ),
                                              updateNodeData(nodeId, {
                                                selectedAspectRatio: ratioOption.value,
                                              }));
                                          },
                                          children: ratioOption.label || ratioOption.value,
                                        },
                                        ratioOption.value,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
	                              !isSeedanceOrWanxiang && (videoParameterMode === `ratio-quality` || (videoParameterMode === `follow-source` && Object.keys(qualityModelVariants).length > 0)) &&
	                              videoQualityOptions.length > 0 && jsxs(`div`, {
	                                children: [
	                                  jsx(`div`, { className: `text-[10px] text-gray-500 mb-2 px-1`, children: `清晰度` }),
	                                  jsx(`div`, {
	                                    className: `flex flex-wrap gap-1.5`,
	                                    children: videoQualityOptions.map((qualityOption) => jsx(`button`, {
	                                      className: `px-3 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${selectedVideoQuality === qualityOption.value ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
	                                      onClick: () => {
	                                        let variantModel = qualityModelVariants[qualityOption.value];
	                                        setSelectedVideoQuality(qualityOption.value);
	                                        variantModel && (_(variantModel), (wanjuanModelManualRef.current = true));
	                                        updateNodeData(nodeId, { selectedVideoQuality: qualityOption.value, ...(variantModel ? { selectedModel: variantModel, wanjuanModelManual: true, wanjuanModelAuto: false } : {}) });
	                                      },
	                                      children: qualityOption.label,
	                                    }, qualityOption.value)),
	                                  }),
	                                ],
	                              }),
	                              isSeedanceOrWanxiang &&
                              seedanceResolutionOptions.length > 0 &&
                              jsxs(`div`, {
                                children: [
                                  jsx(`div`, {
                                    className: `text-[10px] text-gray-500 mb-2 px-1`,
                                    children: `分辨率`,
                                  }),
                                  jsx(`div`, {
                                    className: `flex flex-wrap gap-1.5`,
                                    children: seedanceResolutionOptions.map(
                                      (resolutionOption) =>
                                      jsx(
                                        `button`, {
                                          className: `px-3 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceResolution === resolutionOption.value ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                          onClick: () => {
                                            (setSeedanceResolution(
                                                resolutionOption.value,
                                              ),
                                              updateNodeData(nodeId, {
                                                selectedResolution: resolutionOption.value,
                                              }));
                                          },
                                          children: resolutionOption.label || resolutionOption.value,
                                        },
                                        resolutionOption.value,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                              videoDurationOptions.length > 0 &&
                              jsxs(`div`, {
                                children: [
                                  jsx(`div`, {
                                    className: `text-[10px] text-gray-500 mb-2 px-1`,
                                    children: `时长 (秒)`,
                                  }),
                                  jsx(`div`, {
                                    className: `flex flex-wrap gap-1.5`,
                                    children: videoDurationOptions
                                      .map((seconds, index) =>
                                        jsxs(
                                          `button`, {
                                            className: `px-3 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${selectedSeconds === seconds ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                            onClick: () => {
                                              (setSelectedSeconds(seconds),
                                                updateNodeData(nodeId, {
                                                  selectedSeconds: seconds,
                                                }));
                                            },
                                            children: String(seconds || ``).trim().toLowerCase() === `auto` ? seconds : [seconds, `s`],
                                          },
                                          index,
                                        ),
                                      ),
                                  }),
                                ],
                              }),
                              isSeedanceOrWanxiang &&
                              jsxs(`div`, {
                                children: [
                                  jsx(`div`, {
                                    className: `text-[10px] text-gray-500 mb-2 px-1`,
                                    children: `参考视频上传`,
                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-4 gap-1.5`,
                                    children: [
                                      jsx(`button`, {
                                        className: `px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceUploadModeValue === `public` ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                        onClick: () =>
                                          updateNodeData(nodeId, {
                                            seedanceUploadMode: `public`,
                                          }),
                                        children: `临时链接`,
                                      }),
                                      jsx(`button`, {
                                        className: `px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceUploadModeValue === `tos` ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                        onClick: () =>
                                          updateNodeData(nodeId, {
                                            seedanceUploadMode: `tos`,
                                          }),
                                        children: `火山 TOS`,
                                      }),
                                      jsx(`button`, {
                                        className: `px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceUploadModeValue === `custom` ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                        onClick: () =>
                                          updateNodeData(nodeId, {
                                            seedanceUploadMode: `custom`,
                                          }),
                                        children: `自定义`,
                                      }),
                                      jsx(`button`, {
                                        className: `px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceUploadModeValue === `qiniu` ? `bg-blue-600 border border-blue-400 text-white wanjuan-node-popover-option-active` : `bg-[#1c1c1c] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                        onClick: () =>
                                          updateNodeData(nodeId, {
                                            seedanceUploadMode: `qiniu`,
                                          }),
                                        children: `七牛云`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      isSeedanceOrWanxiang && !isTongyiWanxiang &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: seedancePortraitPickerRef,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[120px] wanjuan-node-picker-trigger`,
	                            onClick: (event) => {
	                              let nextOpen = !seedancePortraitPickerOpen;
	                              (event.stopPropagation(),
	                                setSeedanceApiMenuOpen(!1),
	                                setIsMentionPickerOpen(!1),
	                                T(!1),
	                                j(!1),
	                                setMenuOpen(!1),
	                                setSeedancePortraitPickerOpen(nextOpen));
	                            },
                            title: `选择${seedancePortraitPickerTitle}`,
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: seedancePortraitPickerTitle,
                            }),
                          }),
                          seedancePortraitPickerOpen &&
	                          jsxs(`div`, {
	                            className: `wanjuan-mention-picker absolute bottom-full left-0 mb-1 w-72 bg-[#222] border border-[#333] rounded-lg shadow-2xl z-[9999] flex flex-col overflow-hidden max-h-[320px] nopan`,
	                            style: {
	                              zIndex: 13000
	                            },
	                            onClick: (event) => event.stopPropagation(),
                            onWheel: (event) => event.stopPropagation(),
                            children: [
                              jsxs(`div`, {
                                className: `flex items-center justify-between p-2 border-b border-[#333] bg-[#1a1a1a]`,
                                children: [
                                  jsxs(`div`, {
                                    className: `text-xs text-gray-300 font-bold flex items-center gap-2`,
                                    children: [
                                      jsx(`span`, {
                                        children: seedancePortraitPickerTitle,
                                      }),
                                      jsxs(`span`, {
                                        className: `text-[10px] text-gray-500 font-normal`,
                                        children: [seedancePortraitPickerItems.length, ` 个`],
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `flex items-center gap-1`,
                                    children: [
                                      seedancePortraitPickerIsTianji &&
                                      jsx(`button`, {
                                        type: `button`,
                                        disabled: tianjiPortraitPickerRefreshing,
                                        onClick: (event) => {
                                          (event.preventDefault(), event.stopPropagation(), refreshTianjiPortraitPicker());
                                        },
                                        className: `h-6 px-2 rounded-md border border-[#333] bg-[#202020] text-[10px] text-gray-300 hover:text-white hover:border-cyan-500 hover:bg-[#263238] disabled:opacity-60 disabled:cursor-not-allowed transition-colors`,
                                        children: tianjiPortraitPickerRefreshing ? `刷新中` : `刷新素材`,
                                      }),
                                      jsx(`button`, {
                                        onClick: () => setSeedancePortraitPickerOpen(!1),
                                        className: `text-gray-500 hover:text-white p-1`,
                                        children: jsx(CloseX, {
                                          size: 12
                                        }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              jsx(`div`, {
                                className: `p-2 flex-1 overflow-y-auto wanjuan-node-scroll-area wanjuan-mention-picker-list`,
                                children: seedancePortraitPickerItems.length === 0 ?
                                  jsx(`div`, {
                                    className: `text-center text-gray-500 text-xs py-10 px-3`,
                                    children: seedancePortraitPickerIsTianji ? `暂无天玑人像，请先在设置中上传或刷新素材` : `暂无虚拟人像，请先在设置中添加`,
                                  }) :
                                  jsxs(`div`, {
                                    className: `flex flex-col gap-2`,
                                    children: [
                                      jsx(`div`, {
                                        className: `grid grid-cols-3 gap-2`,
                                        children: seedancePortraitPickerVisibleItems.map((portrait, index) => {
                                          let absoluteIndex = (seedancePortraitPickerCurrentPage - 1) * seedancePortraitPickerPageSize + index;
                                          return jsxs(
                                            `div`, {
                                              className: `aspect-square bg-[#111] rounded border ${seedancePortraitPickerIsTianji && portrait.localUploaded ? `border-dashed border-[#444] opacity-60 cursor-not-allowed` : `border-[#333] hover:border-cyan-500 cursor-pointer`} overflow-hidden relative group wanjuan-mention-picker-item`,
                                              title: seedancePortraitPickerIsTianji ? `${portrait.name || `天玑人像`} · ${portrait.localUploaded ? `待天玑素材库返回` : portrait.imageUrl || ``}` : `${portrait.name || `虚拟人像`} · ${wanjuanSeedanceAssetUrl(portrait.assetId)}`,
                                              onMouseDown: (event) => event.preventDefault(),
                                              onClick: () => seedancePortraitPickerIsTianji ? addTianjiPortraitToNode(portrait, absoluteIndex) : addSeedanceVirtualPortraitToNode(portrait, absoluteIndex),
                                              children: [
                                                (portrait.previewUrl || portrait.imageUrl) ?
                                                jsx(`img`, {
                                                  src: portrait.previewUrl || portrait.imageUrl,
                                                  className: `w-full h-full object-cover`,
                                                  onError: wanjuanUseBrokenResourceImage,
                                                }) :
                                                jsx(`div`, {
                                                  className: `w-full h-full bg-[#151515] flex items-center justify-center p-1 text-[9px] text-gray-500 text-center`,
                                                  children: `无预览`,
                                                }),
                                                jsx(`div`, {
                                                  className: `absolute left-0 right-0 bottom-0 bg-black/75 text-[9px] text-cyan-100 text-center truncate px-1`,
                                                  children: portrait.localUploaded ? `待刷新 · ${portrait.name || portrait.assetId || portrait.portraitAssetId}` : portrait.name || portrait.assetId || portrait.portraitAssetId,
                                                }),
                                                jsx(`div`, {
                                                  className: `absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity`,
                                                  children: jsx(`span`, {
                                                    className: `text-[10px] text-white`,
                                                    children: portrait.localUploaded ? `待刷新` : `选择`,
                                                  }),
                                                }),
                                              ],
                                            },
                                            portrait.id || portrait.assetId || absoluteIndex,
                                          );
                                        }),
                                      }),
                                      (seedancePortraitPickerItems.length > seedancePortraitPickerPageSize || seedancePortraitPickerCanTryNextPage) &&
                                      jsxs(`div`, {
                                        className: `flex items-center justify-between gap-2 border-t border-[#333] pt-2 text-[10px] text-gray-400`,
                                        children: [
                                          jsx(`button`, {
                                            type: `button`,
                                            disabled: seedancePortraitPickerCurrentPage <= 1,
                                            onClick: (event) => {
                                              (event.preventDefault(), event.stopPropagation(), setSeedancePortraitPickerPage((page) => Math.max(1, page - 1)));
                                            },
                                            className: `h-6 min-w-[54px] px-2 rounded-md border border-[#333] bg-[#202020] text-[10px] text-gray-300 hover:text-white hover:border-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`,
                                            children: `上一页`,
                                          }),
                                          jsxs(`span`, {
                                            className: `min-w-[52px] text-center tabular-nums`,
                                            children: [
                                              seedancePortraitPickerCurrentPage,
                                              ` / `,
                                              seedancePortraitPickerCurrentPage >= seedancePortraitPickerTotalPages && seedancePortraitPickerCanTryNextPage ?
                                              `?` :
                                              seedancePortraitPickerTotalPages,
                                            ],
                                          }),
                                          jsx(`button`, {
                                            type: `button`,
                                            disabled: tianjiPortraitPickerRefreshing || seedancePortraitPickerCurrentPage >= seedancePortraitPickerTotalPages && !seedancePortraitPickerCanTryNextPage,
	                                            onClick: async (event) => {
	                                              event.preventDefault();
	                                              event.stopPropagation();
	                                              let nextPage = seedancePortraitPickerCurrentPage + 1;
	                                              if (nextPage <= seedancePortraitPickerLoadedPages) {
	                                                setSeedancePortraitPickerPage(nextPage);
	                                                return;
	                                              }
                                              let loadedCount = await loadTianjiPortraitPickerPage(nextPage);
                                              if (!loadedCount) {
                                                setTianjiPortraitPickerReachedEnd(!0);
                                                data.onShowToast?.(`天玑人像第 ${nextPage} 页暂无素材`);
                                              }
                                            },
                                            className: `h-6 min-w-[54px] px-2 rounded-md border border-[#333] bg-[#202020] text-[10px] text-gray-300 hover:text-white hover:border-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`,
                                            children: tianjiPortraitPickerRefreshing ? `加载中` : `下一页`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                              }),
                            ],
                          }),
                        ],
                      }),
                      !!(
                        activeVideoModelText &&
                        activeVideoModelText
                        .split(
                          `
`,
                        )
                        .filter((text) => text.trim() !== ``).length >= 1
                      ) &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: O,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `wanjuan-theme-control flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[100px] wanjuan-node-picker-trigger`,
	                            onClick: (event) => {
	                              (event.stopPropagation(), setSeedanceApiMenuOpen(!1), setIsMentionPickerOpen(!1), j(!1), setMenuOpen(!1), setSeedancePortraitPickerOpen(!1), T(!w));
	                            },
                            title: `选择模型`,
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: selectedModel || `选择模型`,
                            }),
                          }),
                          w &&
	                          jsxs(`div`, {
	                            className: `wanjuan-theme-popover absolute bottom-full left-0 mb-1 bg-[#222] border border-[#333] rounded-lg shadow-xl p-2 z-[9999] flex flex-col gap-1 wanjuan-video-model-scroll`,
	                            style: {
	                              zIndex: 13000,
	                              width: 320,
                              maxWidth: `calc(100vw - 32px)`,
                              maxHeight: 280,
                              overflowY: `scroll`,
                              overflowX: `hidden`,
                              scrollbarGutter: `stable`,
                              overscrollBehavior: `contain`,
                            },
                            onClick: (event) => event.stopPropagation(),
                            onWheelCapture: (event) => {
                              (event.preventDefault(),
                                event.stopPropagation(),
                                (event.currentTarget.scrollTop += event.deltaY));
                            },
                            onWheel: (event) => event.stopPropagation(),
                            children: [
                              jsx(`div`, {
                                className: `wanjuan-theme-muted text-[10px] text-gray-500 mb-1 px-1`,
                                children: `模型`,
                              }),
                              favoriteModels.sortModels(WanJuanParseModelList(activeVideoModelText))
                              .map((model, index) =>
                                jsxs(
                                  `button`, {
	                                    className: `wanjuan-theme-option w-full text-left px-2 py-2 text-[12px] rounded-md transition-colors flex items-center gap-2 ${WanJuanNormalizeModelId(selectedModel || data.selectedModel) === WanJuanNormalizeModelId(model) ? `wanjuan-theme-option-active bg-blue-600 text-white` : `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                    style: {
                                      minHeight: 44,
                                      lineHeight: `20px`,
                                      whiteSpace: `normal`,
	                                      overflow: `visible`,
	                                      wordBreak: `break-word`,
	                                      overflowWrap: `anywhere`,
		                                      boxSizing: `border-box`,
		                                      border: WanJuanNormalizeModelId(selectedModel || data.selectedModel) === WanJuanNormalizeModelId(model) ? `1px solid currentColor` : `1px solid transparent`,
	                                    },
	                                    onClick: () => {
	                                      let modelProtocolName = data.videoModelProtocolBindings?.[model] || ``,
	                                        modelProtocol = modelProtocolName && data.modelProtocolRegistry?.[modelProtocolName] && typeof data.modelProtocolRegistry[modelProtocolName] === `object` ? data.modelProtocolRegistry[modelProtocolName] : {},
	                                        modelParameterMode = wanjuanResolveVideoParameterMode(modelProtocol),
	                                        modelQualityVariants = modelProtocol?.qualityModelVariants && typeof modelProtocol.qualityModelVariants === `object` ? modelProtocol.qualityModelVariants : {},
	                                        matchedQuality = Object.entries(modelQualityVariants).find(([, variantModel]) => WanJuanSameModelId(String(variantModel || ``), model))?.[0] || ``;
	                                      (matchedQuality && setSelectedVideoQuality(matchedQuality),
	                                        _(model),
	                                        updateNodeData(nodeId, {
	                                          selectedModel: model,
	                                          videoParameterMode: modelParameterMode,
	                                          ...(matchedQuality ? { selectedVideoQuality: matchedQuality } : {}),
	                                          ...(isSeedanceOrWanxiang && !isTongyiWanxiang && seedanceModeValue === `tianji` ? {
	                                            tianjiSelectedModel: model,
	                                            tianjiModelManual: !0
	                                          } : {}),
	                                          ...(isSeedanceOrWanxiang && !isTongyiWanxiang && seedanceModeValue !== `tianji` ? {
	                                            seedanceSelectedModel: model,
	                                            seedanceModelManual: !0
	                                          } : {}),
	                                          wanjuanModelAuto: !1,
	                                          wanjuanModelManual: !0
	                                        }),
                                        (wanjuanModelManualRef.current = !0),
                                        T(!1));
                                    },
                                    title: model,
                                    children: [jsx(`span`, {
                                      className: `flex-1 min-w-0 break-words`,
                                      children: model
                                    }), jsx(`span`, {
                                      className: `wanjuan-model-favorite-star flex-shrink-0 text-base leading-none ${favoriteModels.isFavorite(model) ? `wanjuan-model-favorite-star-active` : ``}`,
                                      onClick: (event) => {
                                        (event.stopPropagation(),
                                          applyPreferredVideoModel(favoriteModels.toggleFavorite(model)));
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
                      false &&
                      isSeedanceOrWanxiang &&
                      seedanceApiOptions.length > 0 &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center wanjuan-seedance-api-picker`,
                        ref: seedanceApiMenuRef,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[120px] wanjuan-node-picker-trigger wanjuan-seedance-api-trigger`,
                            onClick: (event) => {
                              (event.stopPropagation(),
                                setSeedanceApiMenuOpen(!seedanceApiMenuOpen));
                            },
                            title: `选择 API 配置`,
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: seedanceApiButtonLabel,
                            }),
                          }),
                          seedanceApiMenuOpen &&
                          jsxs(`div`, {
                            className: `absolute bottom-full left-0 mb-1 w-56 bg-[#222] border border-[#333] rounded-lg shadow-xl p-2 z-50 flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar wanjuan-seedance-api-menu`,
                            onClick: (event) => event.stopPropagation(),
                            children: [
                              jsx(`div`, {
                                className: `text-[10px] text-gray-500 mb-1 px-1`,
                                children: `API 配置`,
                              }),
                              jsx(`button`, {
                                className: `text-left px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceApiConfigId ? `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200` : `bg-blue-500 text-white wanjuan-node-popover-option-active`}`,
                                onClick: () => {
                                  (setSeedanceApiConfigId(``),
                                    updateNodeData(nodeId, {
                                      selectedApiConfigId: void 0,
                                      apiConfigId: void 0,
                                    }),
                                    setSeedanceApiMenuOpen(!1));
                                },
                                children: seedanceBoundApiConfig ?
                                  `跟随模型绑定 · ${seedanceBoundApiConfig.name || seedanceBoundApiConfig.label || seedanceBoundApiConfig.id}` :
                                  `跟随模型绑定`,
                              }),
                              seedanceApiOptions.map((apiConfig) =>
                                jsx(
                                  `button`, {
                                    className: `text-left px-2 py-1.5 text-[11px] rounded-md transition-colors wanjuan-node-popover-option ${seedanceApiConfigId === apiConfig.id ? `bg-blue-500 text-white wanjuan-node-popover-option-active` : `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                                    onClick: () => {
                                      (setSeedanceApiConfigId(apiConfig.id),
                                        updateNodeData(nodeId, {
                                          selectedApiConfigId: apiConfig.id,
                                          apiConfigId: apiConfig.id,
                                        }),
                                        setSeedanceApiMenuOpen(!1));
                                    },
                                    title: apiConfig.name || apiConfig.label || apiConfig.url || apiConfig.id,
                                    children: apiConfig.name || apiConfig.label || apiConfig.url || apiConfig.id,
                                  },
                                  apiConfig.id,
                                ),
                              ),
                            ],
                          }),
                        ],
                      }),
                      (isSeedanceOrWanxiang ||
                        (data.presetPrompts || []).filter(
                          (apiConfig) =>
                          apiConfig.enabled !== !1 &&
                          (apiConfig.type === `video` || apiConfig.type === `all` || !apiConfig.type),
                        ).length > 0) &&
                      jsxs(`div`, {
                        className: `relative nodrag flex items-center`,
                        ref: M,
                        children: [
                          jsx(`div`, {
                            className: `w-[1px] h-3 bg-[#444] mr-1.5`,
                          }),
                          jsx(`button`, {
                            className: `flex items-center gap-1 h-6 px-2 bg-transparent hover:bg-[#2a2a2a] border border-transparent hover:border-[#333] rounded text-[11px] text-gray-300 transition-colors cursor-pointer max-w-[80px] wanjuan-node-picker-trigger`,
	                            onClick: (event) => {
	                              (event.stopPropagation(), setSeedanceApiMenuOpen(!1), setIsMentionPickerOpen(!1), T(!1), setMenuOpen(!1), setSeedancePortraitPickerOpen(!1), j(!k));
	                            },
                            children: jsx(`span`, {
                              className: `truncate`,
                              children: `预设`,
                            }),
                          }),
                          k &&
	                          jsxs(`div`, {
	                            className: `absolute bottom-full left-0 mb-1 w-56 bg-[#222] border border-[#333] rounded-lg shadow-xl p-2 z-50 flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar`,
	                            style: {
	                              zIndex: 13000
	                            },
	                            onClick: (event) => event.stopPropagation(),
                            children: [
                              jsx(`div`, {
                                className: `text-[10px] text-gray-500 mb-1 px-1`,
                                children: `预设`,
                              }),
                              isSeedanceOrWanxiang &&
                              jsx(`button`, {
                                className: `wanjuan-node-preset-save-button text-left px-2 py-2 text-[11px] rounded-md transition-colors`,
                                onClick: () => {
                                  (window.dispatchEvent(new CustomEvent(`wanjuan:workspace-save-node-template`, {
                                      detail: {
                                        nodeId
                                      }
                                    })),
                                    j(!1));
                                },
                                children: `保存当前为模板`,
                              }),
                              isSeedanceOrWanxiang &&
                              (data.presetPrompts || []).filter(
                                (apiConfig) =>
                                apiConfig.enabled !== !1 &&
                                (apiConfig.type === `video` ||
                                  apiConfig.type === `all` ||
                                  !apiConfig.type),
                              ).length > 0 &&
                              jsx(`div`, {
                                className: `mt-1 pt-2 border-t border-[#333] text-[10px] text-gray-500 px-1`,
                                children: `功能提示词`,
                              }),
                              (data.presetPrompts || [])
                              .filter(
                                (apiConfig) =>
                                apiConfig.enabled !== !1 &&
                                (apiConfig.type === `video` ||
                                  apiConfig.type === `all` ||
                                  !apiConfig.type),
                              )
                              .map((item: any, t) =>
                                jsx(
                                  `button`, {
                                    className: `text-left px-2 py-1.5 text-[11px] rounded-md transition-colors truncate text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`,
                                    onClick: () => {
                                      let combinedPrompt = prompt ?
                                        `${prompt}, ${item.prompt}` :
                                        item.prompt;
                                      (setPrompt(combinedPrompt), updateNodeData(nodeId, {
                                        prompt: combinedPrompt
                                      }), j(!1));
                                    },
                                    title: item.title,
                                    children: item.title,
                                  },
                                  t,
                                ),
                              ),
                              (data.presetPrompts || []).filter(
                                  (apiConfig) =>
                                  apiConfig.enabled !== !1 &&
                                  (apiConfig.type === `video` ||
                                    apiConfig.type === `all` ||
                                    !apiConfig.type),
                                ).length === 0 &&
                              jsx(`div`, {
                                className: `px-2 py-2 text-[11px] text-gray-500`,
                                children: `暂无功能提示词`,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
	                  }),
	                  jsx(`div`, {
	                    className: `wanjuan-video-node-toolbar-action flex items-center gap-3 flex-shrink-0 ml-auto`,
                    children: data.loading ?
                      jsxs(`div`, {
                        className: `flex items-center bg-red-500/10 rounded-full p-1 pl-3 border border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer group/btn`,
                        onClick: (event) => {
                          (event.stopPropagation(), data.onStop?.(nodeId));
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
                              (event.stopPropagation(), handleGenerate());
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
        isFullscreen &&
        data.videoUrl &&
        createPortal(
          jsxs(`div`, {
            className: `wanjuan-video-fullscreen-modal fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md nodrag nopan`,
            style: {
              position: `fixed`,
              inset: 0,
              zIndex: 2147483647,
              display: `flex`,
              alignItems: `center`,
              justifyContent: `center`,
              background: `rgba(0,0,0,0.96)`,
              pointerEvents: `auto`,
              WebkitAppRegion: `no-drag`,
            },
            onMouseDown: (event) => {
              event.target === event.currentTarget && setIsFullscreen(!1);
            },
            onClick: () => setIsFullscreen(!1),
            children: [
              jsx(`button`, {
                className: `absolute top-6 right-6 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors nodrag nopan pointer-events-auto cursor-pointer`,
                style: {
                  position: `absolute`,
                  top: `24px`,
                  right: `24px`,
                  zIndex: 2147483647,
                  width: `56px`,
                  height: `56px`,
                  display: `flex`,
                  alignItems: `center`,
                  justifyContent: `center`,
                  borderRadius: `999px`,
                  background: `rgba(31,41,55,0.9)`,
                  border: `0`,
                  color: `rgba(255,255,255,0.9)`,
                  pointerEvents: `auto`,
                  WebkitAppRegion: `no-drag`,
                },
                type: `button`,
                title: `关闭`,
                "aria-label": `关闭全屏播放`,
                onMouseDown: (event) => {
                  (event.preventDefault(), event.stopPropagation(), setIsFullscreen(!1));
                },
                onClick: (event) => {
                  (event.preventDefault(), event.stopPropagation(), setIsFullscreen(!1));
                },
                children: jsx(CloseX, {
                  size: 32
                }),
              }),
              jsx(`video`, {
                src: data.videoUrl,
                className: `max-w-[95vw] max-h-[95vh] object-contain shadow-2xl rounded-lg outline-none nodrag nopan`,
                style: {
                  maxWidth: `95vw`,
                  maxHeight: `95vh`,
                  objectFit: `contain`,
                  WebkitAppRegion: `no-drag`,
                },
                controls: !0,
                autoPlay: !0,
                onMouseDown: (event) => event.stopPropagation(),
                onClick: (event) => event.stopPropagation(),
              }),
            ],
          }),
          document.body,
        ),
      ],
    });
  });
