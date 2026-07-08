// @ts-nocheck
/**
 * sendToPlugin。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Toast } from "../lib/app-types";
declare const chrome: any;

interface UseSendToPluginDeps {
  isPluginEnv: boolean;
  showToast2: Toast;
}

export function use_sendToPlugin(deps: UseSendToPluginDeps) {
  const {
    isPluginEnv,
    showToast2,
  } = deps;
  const sendToPlugin = async (resource) => {
        if (!isPluginEnv) {
          showToast2(`发送失败：非插件环境`);
          return;
        }
        try {
          showToast2(`正在发送...`);
          let mediaDataUrl = ``,
            mimeType = `image/png`,
            extension = `png`,
            resource2 = typeof resource == `string` ? {
              url: resource,
              type: `image/png`
            } : resource;
          if (resource2.type.startsWith(`image`))
            try {
              let _r = await fetch(resource2.url);
              if (!_r.ok) throw Error(`下载失败: ${_r.status}`);
              let blob = await _r.blob();
              ((mimeType = blob.type || `image/png`),
                (extension = mimeType.split(`/`)[1] || `png`),
                (mediaDataUrl = await new Promise((resolve, reject) => {
                  let fileReader = new FileReader();
                  ((fileReader.onloadend = () => resolve(fileReader.result)),
                    (fileReader.onerror = reject),
                    fileReader.readAsDataURL(blob));
                })));
            } catch {
              let image = new Image();
              ((image.crossOrigin = `Anonymous`),
                (image.src = resource2.url),
                await new Promise((resolve, reject) => {
                  ((image.onload = resolve), (image.onerror = reject));
                }));
              let canvas = document.createElement(`canvas`);
              ((canvas.width = image.width),
                (canvas.height = image.height),
                canvas.getContext(`2d`)?.drawImage(image, 0, 0),
                (mediaDataUrl = canvas.toDataURL(`image/png`)),
                (mimeType = `image/png`),
                (extension = `png`));
            }
          else if (resource2.type.startsWith(`video`)) {
            let _r = await fetch(resource2.url);
            if (!_r.ok) throw Error(`下载失败: ${_r.status}`);
            let blob = await _r.blob();
            ((mimeType = blob.type || `video/mp4`),
              (extension = mimeType.split(`/`)[1] || `mp4`),
              (mediaDataUrl = await new Promise((resolve, reject) => {
                let fileReader = new FileReader();
                ((fileReader.onloadend = () => resolve(fileReader.result)),
                  (fileReader.onerror = reject),
                  fileReader.readAsDataURL(blob));
              })));
          } else {
            showToast2(`暂不支持发送此类型文件`);
            return;
          }
          let [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
          });
          if (!activeTab?.id) {
            showToast2(`未找到活动标签页`);
            return;
          }
          (await chrome.scripting.executeScript({
              target: {
                tabId: activeTab.id
              },
              func: (dataUrl, mimeType2, extension2) => {
                let fileInputs = Array.from(document.querySelectorAll(`input[type="file"]`)),
                  targetInput = fileInputs.find((input) => input.offsetParent !== null) || fileInputs[0];
                if (!targetInput) {
                  alert(`未在当前页面找到可用的文件上传框`);
                  return;
                }
                let parts = dataUrl.split(`,`),
                  binaryString = atob(parts[1]),
                  byteLength = binaryString.length,
                  byteArray = new Uint8Array(byteLength);
                for (; byteLength--;) byteArray[byteLength] = binaryString.charCodeAt(byteLength);
                let uploadFile = new File([byteArray], `upload-${Date.now()}.${extension2}`, {
                    type: mimeType2
                  }),
                  dataTransfer = new DataTransfer();
                dataTransfer.items.add(uploadFile);
                let filesSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  `files`,
                )?.set;
                (filesSetter ? filesSetter.call(targetInput, dataTransfer.files) : (targetInput.files = dataTransfer.files),
                  targetInput.dispatchEvent(new Event(`change`, {
                    bubbles: true
                  })),
                  targetInput.dispatchEvent(new Event(`input`, {
                    bubbles: true
                  })));
                let originalBorder = targetInput.style.border;
                return (
                  (targetInput.style.border = `2px solid #3b82f6`),
                  setTimeout(() => {
                    targetInput.style.border = originalBorder;
                  }, 1e3),
                  true
                );
              },
              args: [mediaDataUrl, mimeType, extension],
            }),
            showToast2(`已发送到左侧网站！`));
        } catch (error) {
          (console.error(error),
            showToast2(`发送失败，请确保左侧有打开的网页，且文件没有过大`));
        }
      };
  return { sendToPlugin };
}
