// @ts-nocheck
/**
 * clearSelectedAgentConversation。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_clearSelectedAgentConversation(deps: any) {
  const {
    agentConversations,
    selectedAgent,
    setAgentConversations,
    showToast2,
  } = deps;
  const clearSelectedAgentConversation = () => {
            if (!selectedAgent) return;
            let conversation = agentConversations[selectedAgent.id] || [];
            if (conversation.length === 0) {
              showToast2(`当前没有聊天记录`);
              return;
            }
            if (!confirm(`确定清空当前智能体的聊天记录吗？`)) return;
            (setAgentConversations((prevConversations) => ({
                ...prevConversations,
                [selectedAgent.id]: [],
              })),
              showToast2(`已清空聊天记录`));
          };
  return { clearSelectedAgentConversation };
}
