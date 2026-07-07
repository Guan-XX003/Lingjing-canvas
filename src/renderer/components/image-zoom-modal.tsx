/**
 * 图片缩放查看模态框：滚轮缩放、拖拽平移、双击复位、Esc 关闭。
 * （原 bundle 局部名 it，别名 WjImageZoomModal）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

export const WjImageZoomModal = ({
  imageUrl: imageUrl,
  onClose: onClose
}: any) => {
  let [scale, setScale] = useState(1),
  [offset, setOffset] = useState({
    x: 0,
    y: 0
  }),
  [dragging, setDragging] = useState(!1),
  isDragging = useRef(!1),
    dragStart = useRef({
      x: 0,
      y: 0
    });
  useEffect(() => {
    let handleKeydown = (event) => {
      event.key === `Escape` && onClose();
    };
    return (
      window.addEventListener(`keydown`, handleKeydown),
      () => window.removeEventListener(`keydown`, handleKeydown)
    );
  }, [onClose]);
  let handleWheel = (event) => {
      (event.preventDefault(), event.stopPropagation());
      let delta = event.deltaY * -0.002;
      setScale((prev) => Math.min(Math.max(0.1, prev + delta), 10));
    },
    handlePointerDown = (event) => {
      ((isDragging.current = !0), setDragging(!0), (dragStart.current = {
        x: event.clientX,
        y: event.clientY
      }));
    },
    handlePointerMove = (event) => {
      if (!isDragging.current) return;
      let deltaX = event.clientX - dragStart.current.x,
        deltaY = event.clientY - dragStart.current.y;
      (setOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        })),
        (dragStart.current = {
          x: event.clientX,
          y: event.clientY
        }));
    },
    handlePointerUp = () => {
      ((isDragging.current = !1), setDragging(!1));
    };
  return jsxs(`div`, {
    className: `fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 overflow-hidden`,
    style: {
      position: `fixed`,
      inset: 0,
      zIndex: 2147483647,
      display: `flex`,
      alignItems: `center`,
      justifyContent: `center`,
      overflow: `hidden`,
      background: `rgba(0,0,0,0.92)`,
      pointerEvents: `auto`,
      WebkitAppRegion: `no-drag`,
    },
    onClick: (event) => {
      event.target === event.currentTarget && onClose();
    },
    onWheel: handleWheel,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerUp,
    children: [
      jsx(`button`, {
        className: `absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full transition-colors z-[10000]`,
        type: `button`,
        title: `关闭`,
        "aria-label": `关闭`,
        style: {
          position: `fixed`,
          top: `18px`,
          right: `18px`,
          width: `48px`,
          height: `48px`,
          borderRadius: `9999px`,
          border: `1px solid rgba(255,255,255,0.14)`,
          background: `rgba(17,24,39,0.72)`,
          color: `#fff`,
          display: `inline-flex`,
          alignItems: `center`,
          justifyContent: `center`,
          padding: 0,
          cursor: `pointer`,
          zIndex: 2147483647,
          pointerEvents: `auto`,
          WebkitAppRegion: `no-drag`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.35)`,
        },
        onPointerDown: (event) => {
          event.stopPropagation();
        },
        onClick: (event) => {
          (event.stopPropagation(), onClose());
        },
        children: jsxs(`svg`, {
          xmlns: `http://www.w3.org/2000/svg`,
          width: `32`,
          height: `32`,
          viewBox: `0 0 24 24`,
          fill: `none`,
          stroke: `currentColor`,
          strokeWidth: `2`,
          strokeLinecap: `round`,
          strokeLinejoin: `round`,
          children: [
            jsx(`path`, {
              d: `M18 6 6 18`
            }),
            jsx(`path`, {
              d: `m6 6 12 12`
            }),
          ],
        }),
      }),
      jsxs(`div`, {
        className: `wanjuan-image-zoom-toolbar`,
        style: {
          position: `fixed`,
          left: `50%`,
          bottom: `22px`,
          transform: `translateX(-50%)`,
          zIndex: 2147483647,
          display: `flex`,
          alignItems: `center`,
          gap: `8px`,
          padding: `8px 10px`,
          borderRadius: `9999px`,
          border: `1px solid rgba(255,255,255,0.14)`,
          background: `rgba(17,24,39,0.72)`,
          color: `#fff`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.35)`,
          pointerEvents: `auto`,
          WebkitAppRegion: `no-drag`,
        },
        onPointerDown: (event) => event.stopPropagation(),
        onClick: (event) => event.stopPropagation(),
        children: [
          jsx(`button`, {
            type: `button`,
            title: `缩小`,
            onClick: () => setScale((prev) => Math.max(0.1, prev - 0.2)),
            style: {
              width: `30px`,
              height: `30px`,
              borderRadius: `9999px`,
              border: `1px solid rgba(255,255,255,0.16)`,
              background: `rgba(255,255,255,0.08)`,
              color: `#fff`,
              cursor: `pointer`,
              fontSize: `18px`,
              lineHeight: `28px`,
            },
            children: `-`,
          }),
          jsx(`button`, {
            type: `button`,
            title: `重置缩放`,
            onClick: () => {
              (setScale(1), setOffset({
                x: 0,
                y: 0
              }));
            },
            style: {
              minWidth: `58px`,
              height: `30px`,
              borderRadius: `9999px`,
              border: `1px solid rgba(255,255,255,0.16)`,
              background: `rgba(255,255,255,0.08)`,
              color: `#fff`,
              cursor: `pointer`,
              fontSize: `12px`,
              fontVariantNumeric: `tabular-nums`,
            },
            children: `${Math.round(scale * 100)}%`,
          }),
          jsx(`button`, {
            type: `button`,
            title: `放大`,
            onClick: () => setScale((prev) => Math.min(10, prev + 0.2)),
            style: {
              width: `30px`,
              height: `30px`,
              borderRadius: `9999px`,
              border: `1px solid rgba(255,255,255,0.16)`,
              background: `rgba(255,255,255,0.08)`,
              color: `#fff`,
              cursor: `pointer`,
              fontSize: `18px`,
              lineHeight: `28px`,
            },
            children: `+`,
          }),
        ],
      }),
      jsx(`div`, {
        className: `cursor-grab active:cursor-grabbing w-full h-full flex items-center justify-center`,
        style: {
          width: `100%`,
          height: `100%`,
          display: `flex`,
          alignItems: `center`,
          justifyContent: `center`,
          cursor: dragging ? `grabbing` : `grab`,
          userSelect: `none`,
          touchAction: `none`,
          WebkitAppRegion: `no-drag`,
        },
        onPointerDown: handlePointerDown,
        onClick: (event) => event.stopPropagation(),
        onDoubleClick: (event) => {
          (event.stopPropagation(),
            setScale(1),
            setOffset({
              x: 0,
              y: 0
            }));
        },
        children: jsx(`img`, {
          src: imageUrl,
          alt: `Zoomed Content`,
          className: `max-w-none max-h-none object-contain pointer-events-none`,
          style: {
            maxWidth: `94vw`,
            maxHeight: `88vh`,
            objectFit: `contain`,
            pointerEvents: `none`,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? `none` : `transform 0.1s ease-out`,
            transformOrigin: `center center`,
          },
          draggable: !1,
        }),
      }),
    ],
  });
};
