/**
 * 节点引用媒体收集工具。
 *
 * 判定本地媒体路径、归一化引用媒体 URL、把节点的图片/视频引用推入集合、
 * 提取节点文本值（wanjuanNodeTextValue，原 Ye）、收集节点全部引用媒体
 * （wanjuanCollectNodeReferenceMedia，原 Xe），以及任意媒体 URL 转 dataURL。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { jsx, jsxs } from "react/jsx-runtime";
import { localPathFromProjectFileUrl } from "../lib/project-asset-binding";
import { buildProjectMediaFileUrl, wanjuanResourceMediaUrl } from "../lib/resource";

export const wanjuanLooksLikeLocalMediaPath = (value) => {
      let text = String(value || ``).trim();
      return !!(
        text &&
        (/^\/(?:Users|Volumes|private|var|tmp|opt|home)\//i.test(text) ||
          /^[A-Za-z]:[\\/]/.test(text) ||
          /^\\\\[^\\]+\\/.test(text) ||
          /^\/\/[^/]+\//.test(text))
      );
    };
export const wanjuanNormalizeReferenceMediaUrl = (value, kindHint = ``) => {
      let rawValue =
        value && typeof value == `object` ?
        wanjuanResourceMediaUrl(value) ||
          value.url ||
          value.localPath ||
          value.path ||
          value.imageUrl ||
          value.videoUrl ||
          value.thumbnailUrl ||
          `` :
        value;
      let mediaUrl = String(rawValue || ``).trim();
      if (!mediaUrl) return ``;
      if (/^(https?:|data:|blob:|file:)/i.test(mediaUrl)) return mediaUrl;
      if (wanjuanLooksLikeLocalMediaPath(mediaUrl)) return buildProjectMediaFileUrl(mediaUrl) || mediaUrl;
      return mediaUrl;
    };
export const wanjuanPushReferenceMediaUrl = (images, videos, value, kindHint = ``) => {
      let mediaUrl = wanjuanNormalizeReferenceMediaUrl(value, kindHint);
      if (!mediaUrl) return;
      let kind = String(kindHint || ``).toLowerCase();
      if (
        kind === `video` ||
        /^data:video\//i.test(mediaUrl) ||
        /\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv|ogg)(?:$|[?#])/i.test(mediaUrl)
      )
        videos.push(mediaUrl);
      else images.push(mediaUrl);
    };
export const wanjuanNodeTextValue = (node) =>
    node?.data ?
    node.data.text === void 0 ?
    node.data.prompt === void 0 ?
    node.data.resultData === void 0 ?
    node.data.label !== void 0 && node.type !== `imageNode` ?
    String(node.data.label) :
    `` :
    typeof node.data.resultData == `object` ?
    JSON.stringify(node.data.resultData, null, 2) :
    String(node.data.resultData) :
    String(node.data.prompt) :
    String(node.data.text) :
    ``;
export const wanjuanCollectNodeReferenceMedia = (node, handleId?) => {
      let images = [],
        videos = [];
      if (!node?.data) return {
        images: images,
        videos: videos
      };
      wanjuanPushReferenceMediaUrl(images, videos, node.data.imageUrl || node.data.mediaUrl || node.data.localPath || node.data.filePath || node.data.path, node.data.mediaKind);
      if (node.type === `customNode` && node.data.resultData) {
        let resultData = node.data.resultData;
        node.data.config?.outputType === `image` &&
          (Array.isArray(resultData) ?
            resultData.forEach((item: any) => {
              typeof item == `string` && wanjuanPushReferenceMediaUrl(images, videos, item, `image`);
            }) :
            typeof resultData == `string` && wanjuanPushReferenceMediaUrl(images, videos, resultData, `image`));
      }
      if (node.type === `videoExtractNode` && node.data.extractedImages)
        if (handleId && handleId.startsWith(`frame-`)) {
          let frameIndex = parseInt(handleId.replace(`frame-`, ``), 10);
          if (!(node.data.hiddenIndices || []).includes(frameIndex)) {
            let allExtractedImages = node.data.allExtractedImages;
            allExtractedImages && allExtractedImages[frameIndex] && wanjuanPushReferenceMediaUrl(images, videos, allExtractedImages[frameIndex], `image`);
          }
        } else node.data.extractedImages.forEach((node2) => wanjuanPushReferenceMediaUrl(images, videos, node2, `image`));
      if (
        node.type === `gridSplitNode` &&
        node.data.imageUrl &&
        handleId &&
        handleId.startsWith(`cell-`)
      ) {
        let cellIndex = parseInt(handleId.replace(`cell-`, ``), 10);
        node.data.extractedImages &&
          Array.isArray(node.data.extractedImages) &&
          node.data.extractedImages[cellIndex] &&
          wanjuanPushReferenceMediaUrl(images, videos, node.data.extractedImages[cellIndex], `image`);
      }
      return (
        node.type === `gridMergeNode` && node.data.imageUrl && wanjuanPushReferenceMediaUrl(images, videos, node.data.imageUrl, `image`),
        node.data.videoUrl && wanjuanPushReferenceMediaUrl(images, videos, node.data.videoUrl, `video`), {
          images: images,
          videos: videos
        }
      );
    };
export const mediaUrlToDataUrl = async (url) => {
	        url = wanjuanNormalizeReferenceMediaUrl(url);
	        if (url.startsWith(`data:`)) return url;
	        if (
	          (/^file:\/\//i.test(url) || wanjuanLooksLikeLocalMediaPath(url)) &&
	          window.wanjuanDesktop &&
	          typeof window.wanjuanDesktop.readLocalFileAsDataUrl == `function`
	        )
	          try {
	            let result = await window.wanjuanDesktop.readLocalFileAsDataUrl({
	              url: url,
	              localPath: localPathFromProjectFileUrl(url) || (wanjuanLooksLikeLocalMediaPath(url) ? url : ``),
	            });
	            if (result?.ok && result.dataUrl) return result.dataUrl;
	          } catch (error) {
	            console.warn(`Failed to read local media:`, url, error);
	          }
	        try {
          let _r = await fetch(url);
          if (!_r.ok) throw Error(`下载失败: ${_r.status}`);
          let blob = await _r.blob();
          return new Promise((resolve: any, reject: any) => {
            let reader = new FileReader();
            ((reader.onloadend = () => {
                let result = reader.result;
                resolve(result);
              }),
              (reader.onerror = reject),
              reader.readAsDataURL(blob));
          });
        } catch (error) {
          return (console.warn(`Failed to convert URL to Base64:`, url, error), url);
        }
      };
export const wanjuanMediaUrlToDataUrl = mediaUrlToDataUrl;
