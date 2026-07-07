// @ts-nocheck
/**
 * duplicateSelectedAgent。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";

export function use_duplicateSelectedAgent(deps: any) {
  const {
    selectedAgent,
    setAgentConversations,
    setAgentItems,
    setSelectedAgentId,
    showToast2,
  } = deps;
  const duplicateSelectedAgent = () => {
            if (!selectedAgent) return;
            let clonedAgent = {
              ...selectedAgent,
              id: `agent-${Date.now()}`,
              name: `${selectedAgent.name || `智能体`} 副本`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            (setAgentItems((prevAgents) => [...prevAgents, clonedAgent]),
              setSelectedAgentId(clonedAgent.id),
              setAgentConversations((prevConversations) => ({
                ...prevConversations,
                [clonedAgent.id]: cloneBackupValue(prevConversations[selectedAgent.id] || []).map((message, index) => ({
                  ...message,
                  id: `${clonedAgent.id}-copy-${index}-${Date.now()}`,
                })),
              })),
              showToast2(`已复制智能体`));
          };
  return { duplicateSelectedAgent };
}
