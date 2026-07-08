/**
 * removeAgentKnowledgeFile。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Toast } from "../lib/app-types";

interface UseRemoveAgentKnowledgeFileDeps {
  selectedAgent: any;
  showToast2: Toast;
  updateSelectedAgent: any;
}

export function use_removeAgentKnowledgeFile(deps: UseRemoveAgentKnowledgeFileDeps) {
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
