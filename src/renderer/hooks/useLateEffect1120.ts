// @ts-nocheck
/**
 * useLateEffect1120（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref } from "../lib/app-types";

interface UseLateEffect1120Deps {
  projectId: any;
  projectIdRef: Ref;
}

export function useLateEffect1120(deps: UseLateEffect1120Deps) {
  const {
    projectId,
    projectIdRef,
  } = deps;
  useEffect(() => {
	      projectIdRef.current = projectId;
	      try { globalThis.__wanjuanCurrentProjectId = projectId; } catch {}
	    }, [projectId]);
}
