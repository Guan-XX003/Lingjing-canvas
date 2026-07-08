/**
 * storeAgentLongTermMemory。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { getMem0Headers } from "../lib/app-root-helpers";

interface UseStoreAgentLongTermMemoryDeps {
  normalizeMem0BaseUrl: any;
}

export function use_storeAgentLongTermMemory(deps: UseStoreAgentLongTermMemoryDeps) {
  const {
    normalizeMem0BaseUrl,
  } = deps;
  const storeAgentLongTermMemory = async (agent, userMessage, assistantMessage) => {
          if (!agent?.memoryEnabled) return;
          let baseUrl = normalizeMem0BaseUrl(agent.memoryBaseUrl || ``);
          if (!baseUrl || !String(userMessage || ``).trim() || !String(assistantMessage || ``).trim()) return;
          let userId = String(agent.memoryUserId || `default-user`).trim() || `default-user`,
            agentId = String(agent.id || `agent-default`).trim() || `agent-default`,
            headers = getMem0Headers(agent.memoryApiKey),
            response = await fetch(`${baseUrl}/memories`, {
              method: `POST`,
              headers: headers,
              body: JSON.stringify({
                messages: [{
                    role: `user`,
                    content: String(userMessage || ``)
                  },
                  {
                    role: `assistant`,
                    content: String(assistantMessage || ``)
                  },
                ],
                user_id: userId,
                agent_id: agentId,
                metadata: {
                  source: `wanjuan-agent`,
                  agent_name: agent.name || ``,
                },
              }),
            });
          if (!response.ok) throw Error(`Mem0 记忆写入失败：${response.status}`);
        };
  return { storeAgentLongTermMemory };
}
