/**
 * useLateEffect1076（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { WjNode } from "../lib/app-types";

interface UseLateEffect1076Deps {
  fitView: any;
  nodes: WjNode[];
  shouldFitView: any;
}

export function useLateEffect1076(deps: UseLateEffect1076Deps) {
  const {
    fitView,
    nodes,
    shouldFitView,
  } = deps;
  useEffect(() => {
      if (shouldFitView && nodes.length > 0) {
        let _t = setTimeout(() => {
          fitView({
            padding: 0.2,
            duration: 800
          });
        }, 100);
        return () => clearTimeout(_t);
      }
    }, [shouldFitView, fitView]);
}
