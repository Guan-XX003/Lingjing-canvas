// @ts-nocheck
/**
 * removeAgentKnowledgeFile。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_removeAgentKnowledgeFile(deps: any) {
  const {
    selectedAgent,
    showToast2,
    updateSelectedAgent,
  } = deps;
  const removeAgentKnowledgeFile = (fileId) => {
            if (!selectedAgent) return;
            updateSelectedAgent({
                knowledgeFiles: (selectedAgent.knowledgeFiles || []).filter(
                  (knowledgeFile) => knowledgeFile.id !== fileId,
                ),
              }),
              showToast2(`已移除知识文件`);
          };
  return { removeAgentKnowledgeFile };
}
