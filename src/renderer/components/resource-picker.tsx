/**
 * 素材选择器面板：类型/来源/收藏筛选 + 分页 + 素材卡片预览。
 * wanjuanRenderResourcePreview 渲染单个素材卡片（视频角标、失效占位、图片转视频回退）。
 * （原 bundle 局部名 rt）自 bundle 反混淆迁入，行为保持一致。
 */
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import {
  wanjuanResourceKind,
  wanjuanResourceMatchesFilter,
  wanjuanResourceMediaUrl,
  wanjuanResourcePosterUrl,
} from "../lib/resource";
import {
  wanjuanUseBrokenResourceImage,
  wanjuanCanFallbackImageToVideo,
  wanjuanUseVideoResourceFallback,
  wanjuanRenderResourceFilterTabs,
  wanjuanRenderResourceSourceTabs,
} from "../lib/resource-tabs";

export function wanjuanRenderResourcePreview(resource: any, options: any = {}) {
  let resourceKind = wanjuanResourceKind(resource),
    mediaUrl = wanjuanResourceMediaUrl(resource),
    posterUrl = wanjuanResourcePosterUrl(resource),
    title = String(resource?.pageTitle || resource?.title || resource?.name || resource?.label || `素材`);
  if (resourceKind === `video`)
    return jsxs(`div`, {
      className: `relative w-full h-full bg-black overflow-hidden`,
      children: [
        jsx(`video`, {
          src: mediaUrl,
          poster: posterUrl && posterUrl !== mediaUrl ? posterUrl : void 0,
          className: `w-full h-full object-cover`,
          muted: !0,
          playsInline: !0,
          preload: `metadata`,
        }),
        jsx(`div`, {
          className: `absolute left-1.5 bottom-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] leading-none text-white/90`,
          children: `视频`,
        }),
      ],
    });
  if (resourceKind === `audio`)
    return jsxs(`div`, {
      className: `w-full h-full bg-[#111827] flex flex-col items-center justify-center gap-1.5 p-2 text-center`,
      children: [
        jsx(`div`, {
          className: `h-7 w-7 rounded-full border border-blue-400/35 bg-blue-400/10 text-blue-300 flex items-center justify-center text-sm`,
          children: `♪`,
        }),
        jsx(`div`, {
          className: `max-w-full truncate text-[9px] text-gray-400`,
          title,
          children: title || `音频素材`,
        }),
      ],
    });
  if (resourceKind === `text`)
    return jsx(`div`, {
      className: `p-1.5 text-[9px] leading-snug text-gray-400 break-all overflow-hidden h-full bg-[#171b22]`,
      children: mediaUrl,
    });
  return jsx(`img`, {
    src: posterUrl || mediaUrl,
    className: `w-full h-full object-cover bg-black`,
    onError: (event) => {
      wanjuanCanFallbackImageToVideo(resource, mediaUrl, posterUrl) ?
        wanjuanUseVideoResourceFallback(event, mediaUrl, posterUrl) :
        wanjuanUseBrokenResourceImage(event);
    },
    draggable: options.draggable === !0 ? `true` : void 0,
    onDragStart: options.onDragStart,
  });
}
export function wanjuanRenderResourcePickerHeader({
  title = `选择素材`,
  activeKind,
  onSelectKind,
  activeSource,
  onSelectSource,
  favoriteOnly,
  setFavoriteOnly,
  setPage,
  onClose,
  closeContent = `×`,
}: any) {
  return jsxs(`div`, {
    className: `p-3 border-b border-[#333b46] bg-[#20252c] wanjuan-mention-picker-header`,
    children: [
      jsxs(`div`, {
        className: `flex items-center justify-between gap-3 mb-3`,
        children: [
          jsx(`div`, {
            className: `text-[13px] font-semibold text-gray-100 tracking-normal whitespace-nowrap`,
            children: title,
          }),
          jsx(`button`, {
            className: `h-7 w-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center flex-shrink-0`,
            onClick: onClose,
            children: closeContent,
          }),
        ],
      }),
      jsxs(`div`, {
        className: `w-full flex bg-[#151a22] border border-[#343b46] rounded-lg p-1 wanjuan-mention-picker-tabs`,
        children: wanjuanRenderResourceFilterTabs(activeKind, onSelectKind, setPage),
      }),
      wanjuanRenderResourceSourceTabs(activeSource, onSelectSource, favoriteOnly, setFavoriteOnly, setPage, !0),
    ],
  });
}

export function WanJuanResourcePicker({
  resources,
  onSelect,
  onClose
}: any) {
  let [typeFilter, setTypeFilter] = useState(`all`),
  [resourceSourceFilter, setResourceSourceFilter] = useState(`all`),
  [resourceFavoriteOnly, setResourceFavoriteOnly] = useState(!1),
  [page, setPage] = useState(1),
		  filteredResources = resources.filter((resource) => wanjuanResourceMatchesFilter(resource, typeFilter, resourceSourceFilter, resourceFavoriteOnly)),
    totalPages = Math.ceil(filteredResources.length / 16),
    pageItems = filteredResources.slice((page - 1) * 16, page * 16);
	  return jsxs(`div`, {
	    className: `wanjuan-material-picker w-[380px] bg-[#22272f] border border-[#3a4250] rounded-lg z-[100] flex flex-col overflow-hidden`,
    style: {
      boxShadow: `18px 18px 36px -22px rgba(0,0,0,0.72), 0 8px 18px -14px rgba(0,0,0,0.5)`
    },
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
        onClose,
      }),
      jsx(`div`, {
        className: `p-2 h-48 overflow-y-auto custom-scrollbar`,
        children: filteredResources.length === 0 ?
          jsx(`div`, {
            className: `text-center text-gray-500 text-xs py-10`,
            children: `暂无素材`,
          }) :
          jsx(`div`, {
	            className: `grid grid-cols-4 gap-2`,
            children: pageItems.map((resource) =>
              jsxs(
                `div`, {
	                  className: `aspect-square bg-[#111827] rounded-lg border border-[#333b46] hover:border-blue-500 cursor-pointer overflow-hidden relative group`,
                  onClick: () => onSelect(resource),
                  title: resource.pageTitle || `素材`,
                  children: [
	                    wanjuanRenderResourcePreview(resource),
                    jsx(`div`, {
                      className: `absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity`,
                      children: jsx(`span`, {
                        className: `text-[10px] text-white`,
                        children: `选择`,
                      }),
                    }),
                  ],
                },
                resource.id,
              ),
            ),
          }),
      }),
      totalPages > 1 &&
      jsxs(`div`, {
	        className: `flex items-center justify-between p-2 border-t border-[#333b46] bg-[#20252c]`,
        children: [
          jsx(`button`, {
            disabled: page === 1,
            onClick: () => setPage((prev) => Math.max(1, prev - 1)),
	            className: `text-[10px] px-2.5 py-1 bg-[#2b313a] rounded-md disabled:opacity-30 text-gray-300 hover:bg-[#343b46]`,
            children: `上一页`,
          }),
          jsxs(`span`, {
            className: `text-[10px] text-gray-500`,
            children: [page, ` / `, totalPages],
          }),
          jsx(`button`, {
            disabled: page === totalPages,
            onClick: () => setPage((prev) => Math.min(totalPages, prev + 1)),
	            className: `text-[10px] px-2.5 py-1 bg-[#2b313a] rounded-md disabled:opacity-30 text-gray-300 hover:bg-[#343b46]`,
            children: `下一页`,
          }),
        ],
      }),
    ],
  });
}
