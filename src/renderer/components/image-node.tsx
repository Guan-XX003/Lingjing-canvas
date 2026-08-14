/**
 * 图片/媒体素材节点：图片、视频、音频素材的画布节点，支持预览、裁剪入口、替换与下载。（原 bundle 局部名 Me）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useMemo, useRef } from "react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { NodeResizer, Position, useReactFlow } from "@xyflow/react";
import { Crop, Download, FileText, Film, Image, Music, PenLine, ShieldCheck, ZoomIn } from "lucide-react";
import { WanJuanReplaceImageIcon, WanJuanTianjiPortraitReviewIcon } from "../components/icons";
import { WanJuanNodeHandle } from "../components/render-mode";
import { wanjuanBuildProjectAssetBinding, wanjuanGetDroppedFilePath, wanjuanMediaKindFromFile, wanjuanMimeFromMediaKind } from "../lib/project-asset-binding";
import { buildProjectMediaFileUrl, wanjuanClearProjectAssetBindingsFromData } from "../lib/resource";
import { wanjuanBrokenResourceImage } from "../lib/resource-tabs";
import { wanjuanArkAssetBindingMatchesImage } from "../lib/ark-trusted-assets";
import { wanjuanResetTianjiPortraitBindingForImage } from "../lib/tianji-portrait";
import { wanjuanImageEditorSourceFromNodeData } from "../lib/image-editor";

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

export const WanJuanImageNode = reactMemo(({
    id: nodeId,
    data: data,
    selected: selected
  }: any) => {
    let {
      updateNodeData: updateNodeData
    } = useReactFlow(),
      fileInputRef = useRef(null),
      imageUrl = data.imageUrl,
      label = data.label,
      mediaType = useMemo(
        () =>
        imageUrl ?
        data.mediaKind === `video` ||
        imageUrl.startsWith(`data:video/`) ||
        /\.(mp4|webm|ogg|mov)($|\?)/i.test(imageUrl) ||
        /\.(mp4|webm|ogg|mov)$/i.test(String(data.videoName || data.label || ``)) ?
        `video` :
        data.mediaKind === `audio` ||
        imageUrl.startsWith(`data:audio/`) ||
        /\.(mp3|wav|ogg|m4a)($|\?)/i.test(imageUrl) ?
        `audio` :
        data.mediaKind === `text` ||
        imageUrl.startsWith(`data:text/`) ||
        /\.(txt|md|json|csv)($|\?)/i.test(imageUrl) ?
        `text` :
        `image` :
        `empty`,
        [imageUrl, data.mediaKind, data.videoName, data.label],
      );
    // 根治内存膨胀：新生成的 base64 dataURL 立即落盘成本地文件，节点改存 file:// 路径，
    // 释放 JS 内存里的大 base64 字符串。复用 app 现成的 persistProjectAsset。
    // 用 ref 防重入；只处理图片/视频；file://、http、已落盘的不处理。
    let wjPersistRef = useRef(``);
    useEffect(() => {
      if (typeof imageUrl !== `string` || !imageUrl.startsWith(`data:`)) return;
      if (mediaType !== `image` && mediaType !== `video`) return;
      if (wjPersistRef.current === imageUrl) return;
      if (!window.wanjuanDesktop || typeof window.wanjuanDesktop.persistProjectAsset !== `function`) return;
      wjPersistRef.current = imageUrl;
      let cancelled = false;
      (async () => {
        try {
          let result = await window.wanjuanDesktop.persistProjectAsset({
            url: imageUrl,
            projectId: (typeof globalThis !== `undefined` && globalThis.__wanjuanCurrentProjectId) || `default`,
            nodeId: nodeId,
            field: `imageUrl`,
            kind: mediaType === `video` ? `video` : `image`,
            directory: ``,
          });
          if (cancelled || !result?.ok || !result.localPath) return;
          let fileUrl = buildProjectMediaFileUrl(result.localPath);
          updateNodeData(nodeId, {
            ...wanjuanResetTianjiPortraitBindingForImage(data, fileUrl),
            imageUrl: fileUrl,
            thumbnailUrl: result.thumbnailLocalPath ? buildProjectMediaFileUrl(result.thumbnailLocalPath) : fileUrl,
            localPath: result.localPath,
            filePath: result.localPath,
            projectAssetBindings: {
              ...(data.projectAssetBindings || {}),
              imageUrl: wanjuanBuildProjectAssetBinding(result, {
                sourceOrigin: data.sourceOrigin || `external-upload`,
              }),
            },
          });
        } catch {}
      })();
      return () => { cancelled = true; };
	    }, [imageUrl, mediaType, nodeId]);
    let tianjiBindingSourceUrl = String(data.tianjiPortraitBindingSourceUrl || ``).trim(),
      tianjiBindingMatchesImage = !tianjiBindingSourceUrl || tianjiBindingSourceUrl === String(imageUrl || ``).trim(),
      tianjiBindingStatus =
      tianjiBindingMatchesImage &&
      String(data.tianjiPortraitAssetId || ``).trim() &&
      (data.sourceOrigin === `tianji-portrait` || data.source === `tianji-portrait` || data.type === `image/tianji-portrait`) ?
      String(data.tianjiPortraitBindingStatus || ``).trim() : ``,
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
      null,
      arkBindingSourceUrl = String(data.arkTrustedAssetSourceUrl || ``).trim(),
      arkBindingMatchesImage = !arkBindingSourceUrl || arkBindingSourceUrl === String(imageUrl || ``).trim(),
      arkBindingStatus = arkBindingMatchesImage ? (wanjuanArkAssetBindingMatchesImage(data, imageUrl) ? `ready` : String(data.arkTrustedAssetStatus || ``).trim()) : ``,
      arkBindingState =
      arkBindingStatus === `reviewing` ?
      { label: `Ark 审核中`, className: `border-sky-400/40 bg-sky-500/15 text-sky-100` } :
      arkBindingStatus === `ready` ?
      { label: `Ark 可信素材`, className: `border-emerald-400/45 bg-emerald-500/15 text-emerald-100` } :
      arkBindingStatus === `failed` ?
      { label: `Ark 审核失败`, className: `border-red-400/45 bg-red-500/15 text-red-100` } :
      null,
      arkBindingBadge = arkBindingState ?
      jsx(`div`, {
        className: `absolute right-2 top-2 z-20 max-w-[calc(50%-12px)] truncate rounded-md border px-2 py-1 text-[10px] font-medium leading-tight shadow-lg backdrop-blur-md pointer-events-none ${arkBindingState.className}`,
        title: data.arkTrustedAssetMessage || arkBindingState.label,
        children: arkBindingState.label,
      }) :
      null;
    return jsxs(`div`, {
      className: `relative group/node w-full h-full min-w-[120px] min-h-[80px]`,
      children: [
        jsx(NodeResizer, {
          color: `#3b82f6`,
          isVisible: selected,
          minWidth: 120,
          minHeight: 80,
        }),
        jsx(`input`, {
          type: `file`,
          ref: fileInputRef,
          style: {
            display: `none`
          },
          accept: `image/*,video/*,audio/*,text/plain`,
          multiple: !0,
          onChange: (event) => {
            let file = event.target.files?.[0];
            if (!file) return;
            if (file.type.startsWith(`text/`)) {
              let reader = new FileReader();
              ((reader.onload = (event2) => {
                  let text = event2.target?.result || ``;
                  updateNodeData(nodeId, {
                    imageUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(String(text))}`,
                    label: file.name,
                    mediaKind: `text`,
                  });
                }),
                reader.readAsText(file),
                (event.target.value = ``));
              return;
            }
            let mediaKind = wanjuanMediaKindFromFile(file),
              nativePath = wanjuanGetDroppedFilePath(file),
              stableUrl = nativePath ? buildProjectMediaFileUrl(nativePath) : ``,
              applySelectedMedia = (mediaUrl) => {
                updateNodeData(nodeId, {
                  ...wanjuanResetTianjiPortraitBindingForImage(data, mediaUrl),
                  imageUrl: mediaUrl,
                  thumbnailUrl: mediaKind === `image` ? mediaUrl : data.thumbnailUrl,
                  label: file.name,
                  mediaKind,
                  sourceOrigin: data.sourceOrigin || `external-upload`,
                  originalName: file.name,
                  ...(nativePath ? {
                    localPath: nativePath,
                    filePath: nativePath,
                  } : {}),
                  projectAssetBindings: wanjuanClearProjectAssetBindingsFromData(data, [`imageUrl`])?.projectAssetBindings,
                });
              };
            if (stableUrl) applySelectedMedia(stableUrl);
            else {
              let reader = new FileReader();
              ((reader.onload = (event2) => {
                  let dataUrl = event2.target?.result;
                  typeof dataUrl == `string` && dataUrl && applySelectedMedia(dataUrl);
                }),
                reader.readAsDataURL(file));
            }
            (async () => {
              try {
                if (!window.wanjuanDesktop?.persistProjectAsset) return;
                let payload: any = {
                    projectId: (typeof globalThis !== `undefined` && globalThis.__wanjuanCurrentProjectId) || `default`,
                    nodeId,
                    field: `imageUrl`,
                    kind: mediaKind,
                    filename: file.name || `${mediaKind}-${Date.now()}`,
                    mime: wanjuanMimeFromMediaKind(mediaKind, file),
                    size: file.size || 0,
                    directory: ``,
                  };
                nativePath && (payload.localPath = nativePath);
                if (!payload.localPath) return;
                let result = await window.wanjuanDesktop.persistProjectAsset(payload);
                if (!result?.ok || !result.localPath) return;
                let fileUrl = buildProjectMediaFileUrl(result.localPath);
                updateNodeData(nodeId, {
                  ...wanjuanResetTianjiPortraitBindingForImage(data, fileUrl),
                  imageUrl: fileUrl,
                  thumbnailUrl: mediaKind === `image` ?
                    (result.thumbnailLocalPath ? buildProjectMediaFileUrl(result.thumbnailLocalPath) : fileUrl) :
                    data.thumbnailUrl,
                  label: file.name,
                  mediaKind,
                  localPath: result.localPath,
                  filePath: result.localPath,
                  projectAssetBindings: {
                    ...(data.projectAssetBindings || {}),
                    imageUrl: wanjuanBuildProjectAssetBinding(result, {
                      sourceOrigin: data.sourceOrigin || `external-upload`,
                    }),
                  },
                });
              } catch (error) {
                console.warn(`Image node media persist skipped`, error);
              }
            })();
            event.target.value = ``;
          },
			                              }),
	                              jsx(`div`, {
          className: `absolute -top-12 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none group-hover/node:pointer-events-auto nodrag pb-4`,
          children: jsxs(`div`, {
            className: `flex items-center gap-1 px-3 py-2 bg-[#1c1c1c]/90 backdrop-blur-md border border-[#333] rounded-full shadow-lg`,
            children: [
              jsx(`button`, {
                className: `p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-md`,
                title: `上传/替换`,
                onClick: (event) => {
                  (event.stopPropagation(), fileInputRef.current?.click());
                },
                children: jsx(WanJuanReplaceImageIcon, {
                  size: 14
                }),
              }),
              (mediaType === `image` || mediaType === `empty`) &&
              jsxs(Fragment, {
                children: [
                  jsx(`button`, {
                    className: `p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-md`,
                    title: `放大`,
                    onClick: (event) => {
                      (event.stopPropagation(), data.onZoom && data.onZoom(imageUrl));
                    },
                    children: jsx(ZoomIn, {
                      size: 14
                    }),
                  }),
                  jsx(`button`, {
                    className: `p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-md`,
                    title: `裁剪`,
                    onClick: (event) => {
                      (event.stopPropagation(),
                        data.onCrop && data.onCrop(nodeId, data.imageUrl));
                    },
                    children: jsx(Crop, {
                      size: 14
                    }),
                  }),
                  jsx(`button`, {
                    className: `p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-md`,
                    title: `编辑`,
                    onClick: (event) => {
                      (event.stopPropagation(),
                        data.onEdit && data.onEdit(nodeId, wanjuanImageEditorSourceFromNodeData(data)));
                    },
                    children: jsx(PenLine, {
                      size: 14
                    }),
                  }),
                ],
              }),
              mediaType === `video` &&
              jsx(`button`, {
                className: `p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-md`,
                title: `视频编辑`,
                onClick: (event) => {
                  (event.stopPropagation(),
                    data.onVideoEdit && data.onVideoEdit(nodeId, imageUrl, label));
                },
                children: jsx(PenLine, {
                  size: 14
                }),
              }),
              mediaType === `image` &&
              jsx(`button`, {
                className: `p-1.5 text-gray-400 hover:text-cyan-300 hover:bg-[#333] rounded-md`,
                title: `天玑人像审核`,
                onClick: (event) => {
                  (event.stopPropagation(),
                    data.onTianjiPortraitReview && imageUrl && data.onTianjiPortraitReview(imageUrl, {
                      nodeId: nodeId,
                      label: label || data.name || `虚拟人像素材`,
                    }));
                },
                children: jsx(WanJuanTianjiPortraitReviewIcon, {
                  size: 14
                }),
              }),
              mediaType === `image` && data.arkTrustedAssetEnabled === true &&
              jsx(`button`, {
                className: `p-1.5 text-gray-400 hover:text-emerald-300 hover:bg-[#333] rounded-md disabled:cursor-wait disabled:opacity-60`,
                title: arkBindingStatus === `ready` ? `重新进行 Ark 可信素材审核` : `Ark 可信素材审核`,
                disabled: arkBindingStatus === `reviewing`,
                onClick: (event) => {
                  event.stopPropagation();
                  let review = data.onArkTrustedAssetReview && imageUrl && data.onArkTrustedAssetReview(imageUrl, {
                    nodeId,
                    label: label || data.name || `可信参考图`,
                    localPath: data.localPath || data.filePath,
                    filename: data.originalName || label,
                  });
                  review?.catch?.(() => {});
                },
                children: jsx(ShieldCheck, { size: 14 }),
              }),
              jsx(`button`, {
                className: `p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-md`,
                title: `下载`,
                onClick: (event) => {
                  if ((event.stopPropagation(), imageUrl)) {
                    let e = `png`;
                    if (
                      (mediaType === `video` && (e = `mp4`),
                        mediaType === `audio` && (e = `mp3`),
                        mediaType === `text` && (e = `txt`),
                        typeof chrome < `u` && chrome.downloads)
                    )
                      chrome.downloads.download({
                        url: imageUrl,
                        filename: `wanjuan/file-${Date.now()}.${e}`,
                        saveAs: !1,
                      });
                    else {
                      let link = document.createElement(`a`);
                      ((link.href = imageUrl),
                        (link.download = `file-${Date.now()}.${e}`),
                        document.body.appendChild(link),
                        link.click(),
                        document.body.removeChild(link));
                    }
                  }
                },
                children: jsx(Download, {
                  size: 14
                }),
              }),
            ],
          }),
	        }),
	        jsxs(`div`, {
          className: `bg-[#1c1c1c] rounded-xl overflow-hidden border shadow-xl transition-colors w-full h-full flex flex-col ${selected ? `border-blue-500` : `border-[#333]`}`,
          children: [
            jsx(WanJuanNodeHandle, {
              type: `target`,
              position: Position.Left
            }),
            jsxs(`div`, {
              className: `flex justify-center items-center gap-1 text-gray-400 text-[9px] py-1 border-b border-[#2a2a2a] bg-[#222] flex-shrink-0`,
              children: [
                mediaType === `video` ?
                jsx(Film, {
                  size: 9
                }) :
                mediaType === `audio` ?
                jsx(Music, {
                  size: 9
                }) :
                mediaType === `text` ?
                jsx(FileText, {
                  size: 9
                }) :
                jsx(Image, {
                  size: 9
                }),
                jsx(`span`, {
                  className: `truncate max-w-[100px]`,
                  children: label ||
                    (mediaType === `video` ?
                      `视频` :
                      mediaType === `audio` ?
                      `音频` :
                      mediaType === `text` ?
                      `文本文件` :
                      `图片`),
                }),
              ],
            }),
            jsxs(`div`, {
              className: `flex-1 p-0 bg-[#121212] flex items-center justify-center relative overflow-hidden`,
              children: [
                mediaType === `image` &&
                jsx(`img`, {
                  src: data.thumbnailUrl || imageUrl,
                  alt: `Content`,
                  className: `w-full h-full object-contain cursor-pointer`,
                  draggable: !1,
                  loading: `lazy`,
                  decoding: `async`,
                  onError: (event) => {
                    let imageElement = event.currentTarget,
                      fallbackUrl = imageUrl;
                    if (
                      imageElement.dataset.wanjuanImageFallback !== `1` &&
                      data.thumbnailUrl &&
                      fallbackUrl &&
                      data.thumbnailUrl !== fallbackUrl
                    ) {
                      imageElement.dataset.wanjuanImageFallback = `1`;
                      imageElement.src = fallbackUrl;
                      updateNodeData(nodeId, {
                        thumbnailUrl: void 0
                      });
                      return;
                    }
                    imageElement.onerror = null;
                    imageElement.src = wanjuanBrokenResourceImage;
                    imageElement.classList.add(`wanjuan-resource-image-broken`);
                    imageElement.title = `素材图片无法加载，可能是链接已失效或本地文件不可访问`;
                  },
                  onDoubleClick: (event) => {
                    (event.stopPropagation(), data.onZoom && data.onZoom(imageUrl));
                  },
                }),
                mediaType === `video` &&
                jsx(`video`, {
                  src: imageUrl,
                  controls: !0,
                  preload: `none`,
                  poster: data.thumbnailUrl || void 0,
                  className: `w-full h-full object-contain`,
                }),
                mediaType === `audio` &&
                jsxs(`div`, {
                  className: `w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] p-2 gap-2`,
                  children: [
                    jsx(Music, {
                      size: 24,
                      className: `text-blue-500 mb-2`,
                    }),
                    jsx(`audio`, {
                      src: imageUrl,
                      controls: !0,
                      className: `w-full max-w-[200px] h-8`,
                    }),
                  ],
                }),
                mediaType === `text` &&
                jsxs(`div`, {
                  className: `w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] p-2`,
                  children: [
                    jsx(FileText, {
                      size: 24,
                      className: `text-gray-400 mb-2`,
                    }),
                    jsx(`span`, {
                      className: `text-[10px] text-gray-500`,
                      children: `文本/数据文件`,
                    }),
                  ],
                }),
                mediaType === `empty` &&
                jsx(`div`, {
                  className: `text-gray-600 text-[9px] flex flex-col items-center gap-1 p-3`,
                  children: jsx(`span`, {
                    className: `text-center text-gray-500`,
                    children: `空`,
                  }),
                }),
                tianjiBindingBadge,
                arkBindingBadge,
              ],
            }),
            jsx(WanJuanNodeHandle, {
              type: `source`,
              position: Position.Right
            }),
          ],
        }),
      ],
    });
  });
