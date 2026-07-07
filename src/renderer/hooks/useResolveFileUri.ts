// @ts-nocheck
/**
 * resolveFileUri。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE } from "../lib/upload-defaults";
import { mediaUrlToDataUrl } from "../lib/reference-media";
import { readAgentAttachmentFileAsDataUrl } from "../lib/agent";

export function useResolveFileUri(deps: any) {
  const {
    customPublicUploadConfig,
    isNonVideoUrl,
    isPublicUrl,
    qiniuConfig,
    seedanceUploadMode,
    tosConfig,
  } = deps;
  const resolveFileUri = async (attachment) => {
	                  let mediaUrl = String(attachment?.url || ``).trim();
	                  if (!mediaUrl) return ``;
	                  if (/^blob:/i.test(mediaUrl)) {
		                    if (Number(attachment?.size || 0) > 0 && Number(attachment?.size || 0) < 1024)
		                      throw Error(`参考视频文件过小或无效，请重新选择真实视频文件`);
			                    let dataUrl = await (attachment?.file ? readAgentAttachmentFileAsDataUrl(attachment) : mediaUrlToDataUrl(mediaUrl));
			                    if (/^data:/i.test(dataUrl)) {
		                      let mimeType = /^video\//i.test(String(attachment?.mime || ``).trim()) ?
		                        String(attachment?.mime || ``).trim() :
		                        `video/mp4`,
		                        dataUrlMatch = dataUrl.match(/^data:([^;,]*)(;base64)?,(.*)$/s);
		                      mediaUrl = dataUrlMatch && !/^video\//i.test(dataUrlMatch[1] || ``) ?
		                        `data:${mimeType}${dataUrlMatch[2] || `;base64`},${dataUrlMatch[3] || ``}` :
		                        dataUrl;
		                    } else mediaUrl = String(attachment?.url || ``).trim();
		                  }
	                  if (/^https?:\/\//i.test(mediaUrl) && isPublicUrl(mediaUrl) && isNonVideoUrl(mediaUrl)) return mediaUrl;
	                  let uploadMode = seedanceUploadMode || WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE;
	                  try {
                    let uploadResult =
                      uploadMode === `tos` &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadTosMedia == `function` ?
                      await window.wanjuanDesktop.uploadTosMedia({
                        url: mediaUrl,
                        kind: `video`,
                        mime: attachment?.mime || `video/mp4`,
                        filename: attachment?.name || `agent-video-${Date.now()}.mp4`,
                        tos: tosConfig || {},
                      }) :
                      uploadMode === `custom` &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadCustomPublicMedia ==
                      `function` ?
                      await window.wanjuanDesktop.uploadCustomPublicMedia({
                        url: mediaUrl,
                        kind: `video`,
                        mime: attachment?.mime || `video/mp4`,
                        filename: attachment?.name || `agent-video-${Date.now()}.mp4`,
                        customUpload: customPublicUploadConfig || {},
                      }) :
                      uploadMode === `qiniu` &&
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadQiniuMedia ==
                      `function` ?
                      await window.wanjuanDesktop.uploadQiniuMedia({
                        url: mediaUrl,
                        kind: `video`,
                        mime: attachment?.mime || `video/mp4`,
                        filename: attachment?.name || `agent-video-${Date.now()}.mp4`,
                        qiniu: qiniuConfig || {},
                      }) :
                      window.wanjuanDesktop &&
                      typeof window.wanjuanDesktop.uploadPublicMedia == `function` ?
                      await window.wanjuanDesktop.uploadPublicMedia({
                        url: mediaUrl,
                        kind: `video`,
                        mime: attachment?.mime || `video/mp4`,
                        filename: attachment?.name || `agent-video-${Date.now()}.mp4`,
                      }) :
                      null;
	                    if (uploadResult?.ok === false) throw Error(uploadResult?.error || `上传服务没有返回可用地址`);
	                    return /^https?:\/\//i.test(uploadResult?.url || ``) && isPublicUrl(uploadResult.url) ?
	                      uploadResult.url :
                      /^https?:\/\//i.test(mediaUrl) && isPublicUrl(mediaUrl) ?
                      mediaUrl :
                      ``;
                  } catch (error) {
	                    throw Error(`参考视频上传失败，未发送到模型：${error?.message || error}`);
	                  }
	                };
  return { resolveFileUri };
}
