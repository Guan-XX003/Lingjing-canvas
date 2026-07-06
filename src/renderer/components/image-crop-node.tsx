/**
 * 图片裁剪节点。
 *
 * 基于 react-image-crop 的画布节点：框选区域后经 canvas 导出裁剪结果 dataURL，
 * 写回节点 data.croppedImage。wanjuanCropImageToDataUrl 为核心裁剪工具（原 bundle 局部名 Fe）。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Check, X as CloseIcon } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";

export async function wanjuanCropImageToDataUrl(image: any, cropRegion: any) {
  let canvas = document.createElement(`canvas`),
    scaleX = image.naturalWidth / image.width,
    scaleY = image.naturalHeight / image.height;
  ((canvas.width = cropRegion.width * scaleX), (canvas.height = cropRegion.height * scaleY));
  let context = canvas.getContext(`2d`);
  if (!context) throw Error(`No 2d context`);
  return (
    context.drawImage(
      image,
      cropRegion.x * scaleX,
      cropRegion.y * scaleY,
      cropRegion.width * scaleX,
      cropRegion.height * scaleY,
      0,
      0,
      cropRegion.width * scaleX,
      cropRegion.height * scaleY,
    ),
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(Error(`Canvas is empty`));
          return;
        }
        let reader = new FileReader();
        (reader.readAsDataURL(blob),
          (reader.onloadend = () => {
            resolve(reader.result);
          }));
      }, `image/png`);
    })
  );
}

export function WanJuanImageCropNode({
  id,
  data,
  selected
}: any) {
  let [crop, setCrop] = useState<any>(),
  [completedCrop, setCompletedCrop] = useState<any>(),
  imgRef = useRef(null);
  return jsxs(`div`, {
    className: `relative bg-[#1c1c1c] rounded-xl overflow-hidden border shadow-xl transition-colors ${selected ? `border-blue-500 z-50` : `border-[#333] z-40`}`,
    children: [
      jsxs(`div`, {
        className: `p-2 bg-[#2a2a2a] flex justify-between items-center border-b border-[#333]`,
        children: [
          jsx(`span`, {
            className: `text-xs text-gray-300 ml-2 font-medium`,
            children: `✂️ 裁剪模式`,
          }),
          jsxs(`div`, {
            className: `flex gap-2`,
            children: [
              jsxs(`button`, {
                onClick: async () => {
                  if (completedCrop && imgRef.current && data.onCropComplete && completedCrop.width && completedCrop.height)
                    try {
                      let croppedImage = await wanjuanCropImageToDataUrl(imgRef.current, completedCrop);
                      data.onCropComplete(id, croppedImage);
                    } catch (error) {
                      console.error(`Crop failed`, error);
                    }
                },
                className: `p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-md transition-colors flex items-center gap-1`,
                title: `确认裁剪`,
                children: [
                  jsx(Check, {
                    size: 14
                  }),
                  jsx(`span`, {
                    className: `text-xs`,
                    children: `确认`,
                  }),
                ],
              }),
              jsxs(`button`, {
                onClick: () => {
                  data.onCancel && data.onCancel(id);
                },
                className: `p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors flex items-center gap-1`,
                title: `取消`,
                children: [
                  jsx(CloseIcon, {
                    size: 14
                  }),
                  jsx(`span`, {
                    className: `text-xs`,
                    children: `取消`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      jsx(`div`, {
        className: `p-4 bg-[#121212] min-w-[300px] min-h-[200px] flex items-center justify-center cursor-crosshair nodrag nowheel`,
        onMouseDownCapture: (event) => event.stopPropagation(),
        onTouchStartCapture: (event) => event.stopPropagation(),
        onWheelCapture: (event) => event.stopPropagation(),
        children: jsx(ReactCrop, {
          crop: crop,
          onChange: (crop) => setCrop(crop),
          onComplete: (completedCrop) => setCompletedCrop(completedCrop),
          aspect: undefined,
          minWidth: 10,
          minHeight: 10,
          ruleOfThirds: true,
          className: `max-w-full max-h-full`,
          children: jsx(`img`, {
            ref: imgRef,
            src: data.imageUrl,
            onLoad: (event) => {
              let {
                width,
                height
              } = event.currentTarget;
              setCrop(centerCrop(makeAspectCrop({
                unit: `%`,
                width: 80
              }, width / height, width, height), width, height));
            },
            alt: `Crop me`,
            className: `max-w-[600px] max-h-[600px] object-contain pointer-events-none select-none`,
            draggable: false,
          }),
        }),
      }),
      jsx(Handle, {
        type: `target`,
        position: Position.Left,
        className: `!bg-[#666] !w-4 !h-4 !border-2 !border-[#333]`,
      }),
      jsx(Handle, {
        type: `source`,
        position: Position.Right,
        className: `!bg-[#666] !w-4 !h-4 !border-2 !border-[#333]`,
      }),
    ],
  });
}
