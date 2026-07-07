// @ts-nocheck
/**
 * updateSelectedAgent。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_updateSelectedAgent(deps: any) {
  const {
    selectedAgent,
    setAgentItems,
  } = deps;
  const updateSelectedAgent = (updates) => {
          selectedAgent &&
            setAgentItems((agents) =>
              agents.map((agent) =>
                agent.id === selectedAgent.id ?
                {
                  ...agent,
                  ...updates,
                  updatedAt: Date.now()
                } :
                agent,
              ),
            );
        };
  return { updateSelectedAgent };
}
