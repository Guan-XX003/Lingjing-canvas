// @ts-nocheck
/**
 * useLateEffect1076（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useLateEffect1076(deps: any) {
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
