/**
 * createAgent。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Bindings, SetAny, Toast } from "../lib/app-types";

interface UseCreateAgentDeps {
  agentModelOptions: any;
  setAgentConversations: SetAny;
  setAgentItems: SetAny;
  setSelectedAgentId: SetAny;
  showToast2: Toast;
  textApiConfigId: any;
  textModelApiBindings: Bindings;
  textModels: any;
}

export function use_createAgent(deps: UseCreateAgentDeps) {
  const {
    agentModelOptions,
    setAgentConversations,
    setAgentItems,
    setSelectedAgentId,
    showToast2,
    textApiConfigId,
    textModelApiBindings,
    textModels,
  } = deps;
  const createAgent = () => {
            let defaultModel =
              agentModelOptions[0] || textModels.split(/\r?\n/).map((item) => item.trim()).find(Boolean) || ``,
              newAgent = {
                id: `agent-${Date.now()}`,
                name: `新智能体`,
                description: `未命名角色`,
                icon: `bot`,
                model: defaultModel,
                apiConfigId: textModelApiBindings?.[defaultModel] || textApiConfigId || ``,
                temperature: `0.7`,
                outputMode: `chat`,
                systemPrompt: `请根据角色设定和知识库内容完成用户任务。`,
                knowledge: ``,
                knowledgeFiles: [],
                memoryEnabled: false,
                memoryBaseUrl: ``,
                memoryApiKey: ``,
                memoryUserId: `default-user`,
                memoryTopK: `6`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
            (setAgentItems((prevAgents) => [...prevAgents, newAgent]),
              setSelectedAgentId(newAgent.id),
              setAgentConversations((prevConversations) => ({
                ...prevConversations,
                [newAgent.id]: [{
                  id: `${newAgent.id}-welcome`,
                  role: `assistant`,
                  content: `新的智能体已创建。请完善它的角色、模型、提示词和知识库摘要。`,
                  createdAt: Date.now(),
                }, ],
              })),
              showToast2(`已创建智能体`));
          };
  return { createAgent };
}
