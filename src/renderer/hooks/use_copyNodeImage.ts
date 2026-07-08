/**
 * copyNodeImage。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast, WjNode } from "../lib/app-types";
import { wanjuanCollectNodeReferenceMedia } from "../lib/reference-media";

interface UseCopyNodeImageDeps {
  menuPosition: any;
  nodes: WjNode[];
  setMenuPosition: SetAny;
  showToast: Toast;
}

export function use_copyNodeImage(deps: UseCopyNodeImageDeps) {
  const {
    menuPosition,
    nodes,
    setMenuPosition,
    showToast,
  } = deps;
  const copyNodeImage = async () => {
            if (menuPosition?.nodeId) {
              let targetNode = nodes.find((node) => node.id === menuPosition.nodeId),
                imageUrl = targetNode ? wanjuanCollectNodeReferenceMedia(targetNode).images[0] : ``;
              if (targetNode && imageUrl)
                try {
                  let imageUrl2 = imageUrl,
                    image = new Image();
                  ((image.crossOrigin = `anonymous`),
                    (image.src = imageUrl2),
                    await new Promise((resolve, reject) => {
                      ((image.onload = resolve), (image.onerror = reject));
                    }));
                  let canvas = document.createElement(`canvas`);
                  ((canvas.width = image.width), (canvas.height = image.height));
                  let context = canvas.getContext(`2d`);
                  if (!context) throw Error(`Could not get canvas context`);
                  (context.drawImage(image, 0, 0),
                    canvas.toBlob(async (blob) => {
                      if (blob)
                        try {
                          (await navigator.clipboard.write([
                              new ClipboardItem({
                                "image/png": blob
                              }),
                            ]),
                            showToast(`图片已复制，可前往其他AI平台粘贴`));
                        } catch (error) {
                          (console.error(`Clipboard write failed:`, error),
                            showToast(`写入剪贴板失败，请检查浏览器权限`));
                        }
                    }, `image/png`));
                } catch (error) {
                  console.error(`Canvas copy failed, trying fetch fallback:`, error);
                  try {
                    let imageUrl2 = imageUrl,
                      blob = await (await fetch(imageUrl2)).blob();
                    if (blob.type !== `image/png`)
                      throw Error(`Image is not PNG, cannot copy via fetch fallback`);
                    (await navigator.clipboard.write([
                        new ClipboardItem({
                          "image/png": blob
                        }),
                      ]),
                      showToast(`图片已复制，可前往其他AI平台粘贴`));
                  } catch (error2) {
                    (console.error(`Fallback copy failed:`, error2),
                      showToast(`复制图片失败，可能因跨域或格式限制`));
                  }
                }
              else showToast(`节点没有图片`);
            }
            setMenuPosition(null);
          };
  return { copyNodeImage };
}
