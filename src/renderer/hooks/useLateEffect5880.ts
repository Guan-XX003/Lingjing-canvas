// @ts-nocheck
/**
 * useLateEffect5880（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useLateEffect5880(deps: any) {
  const {
    agentMessagesScrollRef,
    selectedAgentId,
    selectedAgentMessages,
  } = deps;
  useEffect(() => {
          let scrollContainer = agentMessagesScrollRef.current;
          if (!scrollContainer) return;
          let animationFrameId = requestAnimationFrame(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          });
          return () => cancelAnimationFrame(animationFrameId);
        }, [selectedAgentId, selectedAgentMessages]);
}
