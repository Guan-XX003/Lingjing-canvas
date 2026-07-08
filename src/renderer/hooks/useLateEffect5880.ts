/**
 * useLateEffect5880（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref } from "../lib/app-types";

interface UseLateEffect5880Deps {
  agentMessagesScrollRef: Ref;
  selectedAgentId: any;
  selectedAgentMessages: any;
}

export function useLateEffect5880(deps: UseLateEffect5880Deps) {
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
