// @ts-nocheck
/**
 * removeAgentAttachment。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { releaseAgentAttachment } from "../lib/agent";

export function use_removeAgentAttachment(deps: any) {
  const {
    setAgentAttachments,
  } = deps;
  const removeAgentAttachment = (attachmentId) => {
	            setAgentAttachments((attachments) => {
	              let targetAttachment = attachments.find((attachment) => attachment.id === attachmentId);
	              return targetAttachment && releaseAgentAttachment(targetAttachment), attachments.filter((attachment) => attachment.id !== attachmentId);
            });
          };
  return { removeAgentAttachment };
}
