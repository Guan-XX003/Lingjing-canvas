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
import { CanvasNode } from "./types";
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
export const wanjuanNodeTextValue = (node: CanvasNode) =>
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
export const wanjuanCollectNodeReferenceMedia = (node: CanvasNode, handleId?: string) => {
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

/** 复用 app 的「参考媒体转公网直链」上传配置（自定义直链 / 火山 TOS / 七牛 / litterbox 临时） */
export interface WanjuanPublicUploadConfigs {
  uploadMode?: string;
  tosConfig?: any;
  qiniuConfig?: any;
  customPublicUploadConfig?: any;
}

/**
 * 把一个（可能是本地的）媒体 URL 上传成公网直链，供需要公网 URL 的接口（如 Suno 翻唱参考音频）复用。
 * 走 window.wanjuanDesktop 上传：按 uploadMode 主选（custom/tos/qiniu），失败回退 litterbox 临时链。
 * kind 支持 audio/image/video。返回公网 URL；无桌面上传能力或全部失败则抛错。
 */
export const wanjuanUploadMediaToPublicUrl = async (
  url: string,
  kind: "audio" | "image" | "video",
  configs: WanjuanPublicUploadConfigs = {},
  desktop: any = (typeof window !== "undefined" ? (window as any).wanjuanDesktop : undefined),
  onStatus?: (msg: string) => void,
): Promise<string> => {
  if (!desktop) throw new Error("需要桌面端上传服务（当前环境无法把本地文件转公网直链）");
  // 归一化本地形态：裸路径（含 Windows 盘符 C:\ / 反斜杠）先转成 file:// URL，并附 localPath，
  // 避免主进程把 `C:\..` 当作 URL scheme 解析（对齐 mediaUrlToDataUrl 的成熟契约）。
  let src = String(url || "");
  let localPath: string | undefined;
  if (/^file:/i.test(src)) {
    localPath = localPathFromProjectFileUrl(src) || undefined;
  } else if (wanjuanLooksLikeLocalMediaPath(src)) {
    const fileUrl = buildProjectMediaFileUrl(src) || src;
    localPath = localPathFromProjectFileUrl(fileUrl) || undefined;
    src = fileUrl;
  }
  const mode = configs.uploadMode || "public";
  const filename = `suno-reference-${kind}-${Date.now()}`;
  const mediaPayload = (extra: Record<string, any>) => ({ url: src, localPath, kind, filename, ...extra });
  const tos = configs.tosConfig || {};
  const qiniu = configs.qiniuConfig || {};
  const custom = configs.customPublicUploadConfig || {};
  const s = (v: any) => String(v || "").trim();
  const hasTos = !!(s(tos.accessKeyId || tos.accessKey) && s(tos.secretAccessKey || tos.secretKey) && s(tos.bucket));
  const hasQiniu = !!(s(qiniu.accessKey || qiniu.accessKeyId) && s(qiniu.secretKey || qiniu.secretAccessKey) && s(qiniu.bucket) && s(qiniu.endpoint));
  const hasCustom = !!(s(custom.uploadUrl || custom.endpoint || custom.url) || s(custom.putUrl));

  const tryCustom = async () => {
    if (typeof desktop.uploadCustomPublicMedia !== "function") throw new Error("无自定义公网直链上传能力");
    onStatus?.("上传参考音频到自定义公网直链…");
    const r = await desktop.uploadCustomPublicMedia(mediaPayload({ customUpload: custom }));
    if (r?.ok && r.url) return r.url as string;
    throw new Error(r?.error || "自定义公网直链上传失败");
  };
  const tryTos = async () => {
    if (typeof desktop.uploadTosMedia !== "function") throw new Error("无火山 TOS 上传能力");
    onStatus?.("上传参考音频到火山 TOS…");
    const r = await desktop.uploadTosMedia(mediaPayload({ tos }));
    if (r?.ok && r.url) return r.url as string;
    throw new Error(r?.error || "火山 TOS 上传失败");
  };
  const tryQiniu = async () => {
    if (typeof desktop.uploadQiniuMedia !== "function") throw new Error("无七牛云上传能力");
    onStatus?.("上传参考音频到七牛云…");
    const r = await desktop.uploadQiniuMedia(mediaPayload({ qiniu }));
    if (r?.ok && r.url) return r.url as string;
    throw new Error(r?.error || "七牛云上传失败");
  };
  const tryPublic = async () => {
    if (typeof desktop.uploadPublicMedia !== "function") throw new Error("无公网临时链接上传能力");
    onStatus?.("上传参考音频到公网临时链接…");
    const r = await desktop.uploadPublicMedia(mediaPayload({}));
    if (r?.ok && r.url) return r.url as string;
    throw new Error(r?.error || "公网临时链接上传失败");
  };

  // 主选（按 uploadMode）→ 其它已配置 → litterbox 临时兜底（去重）
  const chain: Array<() => Promise<string>> = [];
  if (mode === "custom" && hasCustom) chain.push(tryCustom);
  else if (mode === "tos" && hasTos) chain.push(tryTos);
  else if (mode === "qiniu" && hasQiniu) chain.push(tryQiniu);
  if (hasCustom && !chain.includes(tryCustom)) chain.push(tryCustom);
  if (hasTos && !chain.includes(tryTos)) chain.push(tryTos);
  if (hasQiniu && !chain.includes(tryQiniu)) chain.push(tryQiniu);
  chain.push(tryPublic);

  let lastErr: any;
  for (const fn of chain) {
    try { return await fn(); } catch (e) { lastErr = e; }
  }
  throw new Error(`参考音频转公网直链失败：${lastErr?.message || lastErr}`);
};
