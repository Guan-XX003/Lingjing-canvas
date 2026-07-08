// @ts-nocheck
/**
 * removeAgentAttachment。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
import { releaseAgentAttachment } from "../lib/agent";

interface UseRemoveAgentAttachmentDeps {
  setAgentAttachments: SetAny;
}

export function use_removeAgentAttachment(deps: UseRemoveAgentAttachmentDeps) {
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
