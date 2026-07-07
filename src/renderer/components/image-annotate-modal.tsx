/**
 * 图片涂鸦标注编辑器：画笔/形状/取色/文字，导出标注后的图片。（原 bundle 局部名 nt）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs } from "react/jsx-runtime";
import ReactCrop from "react-image-crop";
import { Check, Circle, Crop, Hash, Pencil, Pipette, Square, Trash2, Type, Undo, X as CloseX } from "lucide-react";

export function WanJuanImageAnnotateModal({
  imageUrl,
  initialTool,
  onSave,
  onClose
}: any) {
  let canvasRef = useRef(null),
    containerRef = useRef(null),
    [tool, setTool] = useState(initialTool || `pencil`),
    [color, setColor] = useState(`#ff0000`),
    [brushSize, setBrushSize] = useState(3),
    [isDrawing, setIsDrawing] = useState(false),
    [history, setHistory] = useState<any[]>([]),
    [startPoint, setStartPoint] = useState<any>({ x: 0, y: 0 }),
    [numberCounter, setNumberCounter] = useState(1),
    [textInput, setTextInput] = useState({
      visible: false,
      x: 0,
      y: 0,
      text: ``,
      clientX: 0,
      clientY: 0,
    }),
    textInputRef = useRef(null),
    [crop, setCrop] = useState(),
    [completedCrop, setCompletedCrop] = useState<any>(null),
    originalImageRef = useRef(null),
    [zoomLevel, setZoomLevel] = useState(1),
    [editorSize, setEditorSize] = useState({
      width: 1,
      height: 1
    });
  useEffect(() => {
    let canvas = canvasRef.current,
      ctx = canvas?.getContext(`2d`);
    if (!canvas || !ctx) return;
    let img = new Image();
    ((img.crossOrigin = `Anonymous`),
      (img.onload = () => {
        ((canvas.width = img.naturalWidth),
          (canvas.height = img.naturalHeight),
          setEditorSize({
            width: Math.max(1, img.naturalWidth),
            height: Math.max(1, img.naturalHeight),
          }),
          setZoomLevel(1),
          ctx.drawImage(img, 0, 0),
          (originalImageRef.current = img),
          setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]));
      }),
      (img.src = imageUrl));
  }, [imageUrl]);
  let pushHistory = () => {
      let canvas = canvasRef.current,
        ctx = canvas?.getContext(`2d`);
      !canvas || !ctx || setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    },
    zoomEditor = (delta) => {
      setZoomLevel((prev) => {
        let next = Number((prev + delta).toFixed(2));
        return Math.min(8, Math.max(0.1, next));
      });
    },
    undo = () => {
      if (history.length <= 1) return;
      let canvas = canvasRef.current,
        ctx = canvas?.getContext(`2d`);
      if (!canvas || !ctx) return;
      let newHistory = history.slice(0, -1);
      setHistory(newHistory);
      let prevImage = newHistory[newHistory.length - 1];
      ((canvas.width = prevImage.width),
        (canvas.height = prevImage.height),
        setEditorSize({
          width: Math.max(1, prevImage.width),
          height: Math.max(1, prevImage.height)
        }),
        ctx.putImageData(prevImage, 0, 0));
    },
    getCanvasCoords = (event: any): any => {
      let canvas = canvasRef.current;
      if (!canvas) return {
        x: 0,
        y: 0
      };
      let rect = canvas.getBoundingClientRect(),
        scaleX = canvas.width / rect.width,
        scaleY = canvas.height / rect.height,
        clientX,
        clientY;
      return (
        `touches` in event ?
        ((clientX = event.touches[0].clientX), (clientY = event.touches[0].clientY)) :
        ((clientX = event.clientX), (clientY = event.clientY)), {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        }
      );
    },
    handlePointerDown = (event: any) => {
      let {
        x: canvasX,
        y: canvasY
      } = getCanvasCoords(event),
        canvas = canvasRef.current,
        ctx = canvas?.getContext(`2d`);
      if (!(!canvas || !ctx)) {
        if (tool === `eyedropper`) {
          let pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
          (setColor(
              `#` +
              (
                `000000` + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)
              ).slice(-6),
            ),
            setTool(`pencil`));
          return;
        }
        if (tool === `text`) {
          textInput.visible && textInput.text.trim() && commitText();
          let clientX, clientY;
          `touches` in event
            ?
            ((clientX = event.touches[0].clientX), (clientY = event.touches[0].clientY)) :
            ((clientX = event.clientX), (clientY = event.clientY));
          let inputX = clientX,
            inputY = clientY;
          if (containerRef.current) {
            let rect = containerRef.current.getBoundingClientRect();
            ((inputX = clientX - rect.left + containerRef.current.scrollLeft),
              (inputY = clientY - rect.top + containerRef.current.scrollTop));
          }
          (setTextInput({
              visible: true,
              x: canvasX,
              y: canvasY,
              text: ``,
              clientX: inputX,
              clientY: inputY
            }),
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 0));
          return;
        }
        (setIsDrawing(true),
          setStartPoint({
            x: canvasX,
            y: canvasY
          }),
          tool === `pencil` ?
          (ctx.beginPath(),
            ctx.moveTo(canvasX, canvasY),
            (ctx.strokeStyle = color),
            (ctx.lineWidth = brushSize),
            (ctx.lineCap = `round`),
            (ctx.lineJoin = `round`)) :
          tool === `number` ?
          (pushHistory(),
            ctx.beginPath(),
            ctx.arc(canvasX, canvasY, Math.max(15, brushSize * 3), 0, 2 * Math.PI),
            (ctx.fillStyle = color),
            ctx.fill(),
            (ctx.fillStyle = `#ffffff`),
            (ctx.font = `bold ${Math.max(16, brushSize * 3)}px sans-serif`),
            (ctx.textAlign = `center`),
            (ctx.textBaseline = `middle`),
            ctx.fillText(numberCounter.toString(), canvasX, canvasY + 1),
            setNumberCounter((prev) => prev + 1),
            setIsDrawing(false)) :
          pushHistory());
      }
    },
    commitText = () => {
      if (!textInput.visible || !textInput.text.trim()) {
        setTextInput((prev) => ({
          ...prev,
          visible: false,
          text: ``
        }));
        return;
      }
      let canvas = canvasRef.current,
        ctx = canvas?.getContext(`2d`);
      !canvas ||
        !ctx ||
        (pushHistory(),
          (ctx.fillStyle = color),
          (ctx.font = `bold ${Math.max(20, brushSize * 5)}px sans-serif`),
          (ctx.textAlign = `left`),
          (ctx.textBaseline = `top`),
          ctx.fillText(textInput.text, textInput.x, textInput.y + 4),
          setTextInput({
            visible: false,
            x: 0,
            y: 0,
            text: ``,
            clientX: 0,
            clientY: 0
          }));
    },
    handlePointerMove = (event) => {
      if (!isDrawing) return;
      let {
        x: canvasX,
        y: canvasY
      } = getCanvasCoords(event),
        canvas = canvasRef.current,
        ctx = canvas?.getContext(`2d`);
      if (!(!canvas || !ctx)) {
        if (tool === `pencil`)(ctx.lineTo(canvasX, canvasY), ctx.stroke());
        else if (tool === `square` || tool === `circle`) {
          if (
            (history.length > 0 && ctx.putImageData(history[history.length - 1], 0, 0),
              ctx.beginPath(),
              (ctx.strokeStyle = color),
              (ctx.lineWidth = brushSize),
              tool === `square`)
          )
            ctx.rect(startPoint.x, startPoint.y, canvasX - startPoint.x, canvasY - startPoint.y);
          else if (tool === `circle`) {
            let radius = Math.sqrt((canvasX - startPoint.x) ** 2 + (canvasY - startPoint.y) ** 2);
            ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          }
          ctx.stroke();
        }
      }
    },
    handlePointerUp = () => {
      isDrawing && (setIsDrawing(false), tool === `pencil` && pushHistory());
    };
  return createPortal(
    jsxs(`div`, {
      className: `fixed inset-0 z-[9999] flex flex-col bg-[#121212] select-none`,
      children: [
        jsxs(`div`, {
          className: `flex items-center justify-between p-3 bg-[#1c1c1c] border-b border-[#333]`,
          children: [
            jsxs(`div`, {
              className: `flex items-center gap-2`,
              children: [
                jsx(`span`, {
                  className: `text-white font-medium mr-4`,
                  children: `图片编辑`,
                }),
                jsxs(`div`, {
                  className: `flex items-center bg-[#2a2a2a] rounded-lg p-1`,
                  children: [
                    jsx(`button`, {
                      className: `p-2 rounded ${tool === `pencil` ? `bg-blue-500 text-white` : `text-gray-400 hover:text-white`}`,
                      onClick: () => setTool(`pencil`),
                      title: `画笔`,
                      children: jsx(Pencil, {
                        size: 16
                      }),
                    }),
                    jsx(`button`, {
                      className: `p-2 rounded ${tool === `text` ? `bg-blue-500 text-white` : `text-gray-400 hover:text-white`}`,
                      onClick: () => setTool(`text`),
                      title: `文字`,
                      children: jsx(Type, {
                        size: 16
                      }),
                    }),
                    jsx(`button`, {
                      className: `p-2 rounded ${tool === `square` ? `bg-blue-500 text-white` : `text-gray-400 hover:text-white`}`,
                      onClick: () => setTool(`square`),
                      title: `方框`,
                      children: jsx(Square, {
                        size: 16
                      }),
                    }),
                    jsx(`button`, {
                      className: `p-2 rounded ${tool === `circle` ? `bg-blue-500 text-white` : `text-gray-400 hover:text-white`}`,
                      onClick: () => setTool(`circle`),
                      title: `圆框`,
                      children: jsx(Circle, {
                        size: 16
                      }),
                    }),
                    jsx(`button`, {
                      className: `p-2 rounded ${tool === `number` ? `bg-blue-500 text-white` : `text-gray-400 hover:text-white`}`,
                      onClick: () => setTool(`number`),
                      title: `序号标记`,
                      children: jsx(Hash, {
                        size: 16
                      }),
                    }),
                    jsx(`button`, {
                      className: `p-2 rounded ${tool === `eyedropper` ? `bg-blue-500 text-white` : `text-gray-400 hover:text-white`}`,
                      onClick: () => setTool(`eyedropper`),
                      title: `吸管取色`,
                      children: jsx(Pipette, {
                        size: 16
                      }),
                    }),
                    jsx(`button`, {
                      className: `p-2 rounded ${tool === `crop` ? `bg-blue-500 text-white` : `text-gray-400 hover:text-white`}`,
                      onClick: () => setTool(`crop`),
                      title: `裁剪`,
                      children: jsx(Crop, {
                        size: 16
                      }),
                    }),
                  ],
                }),
                jsx(`div`, {
                  className: `h-6 w-[1px] bg-[#444] mx-2`
                }),
                jsx(`input`, {
                  type: `color`,
                  value: color,
                  onChange: (event) => setColor(event.target.value),
                  className: `w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0`,
                }),
                jsx(`input`, {
                  type: `range`,
                  min: `1`,
                  max: `20`,
                  value: brushSize,
                  onChange: (event) => setBrushSize(parseInt(event.target.value)),
                  className: `w-24 accent-blue-500 ml-2`,
                  title: `粗细: ${brushSize}px`,
                }),
                jsx(`div`, {
                  className: `h-6 w-[1px] bg-[#444] mx-2`
                }),
                jsx(`button`, {
                  className: `p-2 rounded text-gray-400 hover:text-white hover:bg-[#333]`,
                  onClick: () => zoomEditor(-0.1),
                  title: `缩小`,
                  children: `－`,
                }),
                jsx(`div`, {
                  className: `text-xs text-gray-400 min-w-[54px] text-center`,
                  children: `${Math.round(zoomLevel * 100)}%`,
                }),
                jsx(`button`, {
                  className: `p-2 rounded text-gray-400 hover:text-white hover:bg-[#333]`,
                  onClick: () => zoomEditor(0.1),
                  title: `放大`,
                  children: `＋`,
                }),
                jsx(`button`, {
                  className: `px-2 py-1 rounded text-[11px] text-gray-400 hover:text-white hover:bg-[#333]`,
                  onClick: () => setZoomLevel(1),
                  title: `重置缩放`,
                  children: `100%`,
                }),
                jsx(`div`, {
                  className: `h-6 w-[1px] bg-[#444] mx-2`
                }),
                jsx(`button`, {
                  className: `p-2 rounded text-gray-400 hover:text-white hover:bg-[#333] ${history.length <= 1 ? `opacity-50 cursor-not-allowed` : ``}`,
                  onClick: undo,
                  disabled: history.length <= 1,
                  title: `撤销`,
                  children: jsx(Undo, {
                    size: 16
                  }),
                }),
                jsx(`button`, {
                  className: `p-2 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10`,
                  onClick: () => {
                    let canvas = canvasRef.current,
                      ctx = canvas?.getContext(`2d`);
                    !canvas ||
                      !ctx ||
                      !originalImageRef.current ||
                      ((canvas.width = originalImageRef.current.naturalWidth),
                        (canvas.height = originalImageRef.current.naturalHeight),
                        setEditorSize({
                          width: Math.max(1, originalImageRef.current.naturalWidth),
                          height: Math.max(1, originalImageRef.current.naturalHeight),
                        }),
                        ctx.clearRect(0, 0, canvas.width, canvas.height),
                        ctx.drawImage(originalImageRef.current, 0, 0),
                        pushHistory(),
                        setNumberCounter(1),
                        setZoomLevel(1));
                  },
                  title: `清空涂鸦`,
                  children: jsx(Trash2, {
                    size: 16
                  }),
                }),
              ],
            }),
            jsxs(`div`, {
              className: `flex items-center gap-2`,
              children: [
                tool === `crop` &&
                jsxs(`button`, {
                  onClick: () => {
                    if (completedCrop && canvasRef.current) {
                      let canvas = canvasRef.current,
                        ctx = canvas.getContext(`2d`);
                      if (!ctx) return;
                      let rect = canvas.getBoundingClientRect(),
                        scaleX = canvas.width / rect.width,
                        scaleY = canvas.height / rect.height,
                        cropX = completedCrop.x * scaleX,
                        cropY = completedCrop.y * scaleY,
                        cropWidth = completedCrop.width * scaleX,
                        cropHeight = completedCrop.height * scaleY;
                      if (cropWidth === 0 || cropHeight === 0) return;
                      let croppedData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);
                      (pushHistory(),
                        (canvas.width = cropWidth),
                        (canvas.height = cropHeight),
                        setEditorSize({
                          width: Math.max(1, cropWidth),
                          height: Math.max(1, cropHeight),
                        }),
                        ctx.putImageData(croppedData, 0, 0),
                        pushHistory(),
                        setCrop(undefined),
                        setCompletedCrop(undefined),
                        setZoomLevel(1),
                        setTool(`pencil`));
                    }
                  },
                  className: `px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-1 text-sm font-medium mr-2`,
                  children: [jsx(Check, {
                    size: 16
                  }), `确认裁剪`],
                }),
                jsxs(`button`, {
                  onClick: onClose,
                  className: `px-3 py-1.5 rounded-lg text-gray-300 hover:bg-[#333] transition-colors flex items-center gap-1 text-sm`,
                  children: [jsx(CloseX, {
                    size: 16
                  }), `取消`],
                }),
                jsxs(`button`, {
                  onClick: () => {
                    canvasRef.current && onSave(canvasRef.current.toDataURL(`image/png`));
                  },
                  className: `px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1 text-sm font-medium`,
                  children: [jsx(Check, {
                    size: 16
                  }), `保存`],
                }),
              ],
            }),
          ],
        }),
        jsxs(`div`, {
          ref: containerRef,
          className: `flex-1 overflow-auto flex items-center justify-center bg-[#0a0a0a] p-4 relative`,
          onWheel: (event) => {
            if (!(event.ctrlKey || event.metaKey)) return;
            (event.preventDefault(), zoomEditor(event.deltaY < 0 ? 0.1 : -0.1));
          },
          children: [
            jsx(`div`, {
              className: `relative shrink-0`,
              style: {
                width: `${Math.max(1, editorSize.width * zoomLevel)}px`,
                height: `${Math.max(1, editorSize.height * zoomLevel)}px`,
              },
              children: jsx(ReactCrop, {
                crop: crop,
                onChange: (nextCrop) => setCrop(nextCrop),
                onComplete: (completed) => setCompletedCrop(completed),
                className: `w-full h-full`,
                disabled: tool !== `crop`,
                style: {
                  display: `flex`,
                  alignItems: `center`,
                  justifyContent: `center`,
                },
                children: jsx(`canvas`, {
                  ref: canvasRef,
                  onMouseDown: tool === `crop` ? undefined : handlePointerDown,
                  onMouseMove: tool === `crop` ? undefined : handlePointerMove,
                  onMouseUp: tool === `crop` ? undefined : handlePointerUp,
                  onMouseLeave: tool === `crop` ? undefined : handlePointerUp,
                  onTouchStart: tool === `crop` ? undefined : handlePointerDown,
                  onTouchMove: tool === `crop` ? undefined : handlePointerMove,
                  onTouchEnd: tool === `crop` ? undefined : handlePointerUp,
                  className: `w-full h-full block shadow-2xl bg-white ${tool === `eyedropper` ? `cursor-crosshair` : tool === `text` ? `cursor-text` : tool === `crop` ? `cursor-default` : `cursor-crosshair`}`,
                  style: {
                    touchAction: `none`
                  },
                }),
              }),
            }),
            textInput.visible &&
            jsx(`input`, {
              ref: textInputRef,
              type: `text`,
              value: textInput.text,
              onChange: (event) => setTextInput((prev) => ({
                ...prev,
                text: event.target.value
              })),
              onKeyDown: (event) => {
                event.key === `Enter` && commitText();
              },
              onBlur: commitText,
              style: {
                position: `absolute`,
                left: textInput.clientX,
                top: textInput.clientY,
                color: color,
                fontSize: `${Math.max(20, brushSize * 5)}px`,
                fontWeight: `bold`,
                background: `transparent`,
                border: `1px dashed #666`,
                outline: `none`,
                padding: 0,
                margin: 0,
                zIndex: 1e4,
                minWidth: `20px`,
                transform: `translateY(-2px)`,
                lineHeight: 1,
              },
              placeholder: `输入文字...`,
            }),
          ],
        }),
      ],
    }),
    document.body,
  );
}
