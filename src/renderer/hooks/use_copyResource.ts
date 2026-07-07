// @ts-nocheck
/**
 * copyResource。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_copyResource(deps: any) {
  const {
    showToast2,
  } = deps;
  const copyResource = async (resource) => {
          try {
            if (resource.type === `text`)
              (await navigator.clipboard.writeText(resource.url), showToast2(`文本已复制！`));
            else if (resource.type.startsWith(`image`))
              try {
                let image = new Image();
                ((image.crossOrigin = `Anonymous`),
                  (image.src = resource.url),
                  await new Promise((resolve, reject) => {
                    ((image.onload = resolve), (image.onerror = reject));
                  }));
                let canvas = document.createElement(`canvas`);
                ((canvas.width = image.width),
                  (canvas.height = image.height),
                  canvas.getContext(`2d`)?.drawImage(image, 0, 0),
                  canvas.toBlob(async (blob) => {
                    if (blob)
                      try {
                        let clipboardItem = new ClipboardItem({
                          "image/png": blob
                        });
                        (await navigator.clipboard.write([clipboardItem]),
                          showToast2(`图片已复制到剪贴板！`));
                      } catch (error) {
                        (console.error(`Clipboard write failed:`, error),
                          await navigator.clipboard.writeText(resource.url),
                          showToast2(`图片链接已复制（直接复制图片失败）`));
                      }
                  }, `image/png`));
              } catch (error) {
                (console.error(`Failed to process image:`, error),
                  await navigator.clipboard.writeText(resource.url),
                  showToast2(`图片链接已复制（直接复制图片失败）`));
              }
            else(await navigator.clipboard.writeText(resource.url), showToast2(`链接已复制！`));
          } catch (error) {
            console.error(`Copy failed:`, error);
          }
        };
  return { copyResource };
}
