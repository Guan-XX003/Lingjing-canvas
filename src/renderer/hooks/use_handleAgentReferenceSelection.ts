// @ts-nocheck
/**
 * handleAgentReferenceSelection。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_handleAgentReferenceSelection(deps: any) {
  const {
    setAgentAttachments,
    showToast2,
  } = deps;
  const handleAgentReferenceSelection = (event) => {
	            let files = Array.from(event.target?.files || []),
	              skippedCount = 0,
	              newAttachments = files
	              .map((file) => {
	                let fileType = String(file?.type || ``).toLowerCase(),
	                  fileName = String(file?.name || ``).toLowerCase(),
	                  attachmentKind = fileType.startsWith(`image/`) ?
	                  `image` :
	                  fileType.startsWith(`video/`) ?
	                  `video` :
	                  fileType.startsWith(`text/`) ||
	                  /pdf|word|document|sheet|presentation|markdown|csv|json/.test(fileType) ||
	                  /\.(pdf|txt|md|docx?|xlsx?|pptx?|csv|json|rtf)$/i.test(fileName) ?
	                  `document` :
	                  ``;
	                return attachmentKind ?
	                  {
	                    id: `agent-attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
	                    name: file.name || `参考文件`,
	                    mime: file.type || (attachmentKind === `video` ? `video/mp4` : attachmentKind === `image` ? `image/png` : `application/octet-stream`),
			                    size: file.size || 0,
			                    type: attachmentKind,
			                    file: file,
			                    url: URL.createObjectURL(file),
		                    uploadProgress: 12,
		                    uploadStatus: `uploading`,
		                  } :
		                  ((skippedCount += 1), null);
	              })
	              .filter(Boolean);
	            newAttachments.length > 0 &&
	              (setAgentAttachments((prevAttachments) => [...prevAttachments, ...newAttachments].slice(0, 6)),
	                window.setTimeout(() => {
	                  setAgentAttachments((prevAttachments) =>
	                    prevAttachments.map((attachment) =>
	                      newAttachments.some((newAttachment) => newAttachment.id === attachment.id) ? {
	                        ...attachment,
	                        uploadProgress: 100,
	                        uploadStatus: `ready`,
	                      } : attachment,
	                    ),
	                  );
	                }, 450),
	                showToast2(`已添加 ${newAttachments.length} 个参考文件`)),
	              skippedCount > 0 && showToast2(`已跳过 ${skippedCount} 个不支持的文件，目前支持图片、视频和常见文档`),
              event.target && (event.target.value = ``);
          };
  return { handleAgentReferenceSelection };
}
