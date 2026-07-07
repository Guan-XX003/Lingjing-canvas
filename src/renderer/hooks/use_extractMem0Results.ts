// @ts-nocheck
/**
 * extractMem0Results。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_extractMem0Results(deps: any) {
  const {
    normalizeMem0MemoryText,
  } = deps;
  const extractMem0Results = (data) => {
          let results = Array.isArray(data) ?
            data :
            Array.isArray(data?.results) ?
            data.results :
            Array.isArray(data?.memories) ?
            data.memories :
            Array.isArray(data?.data?.results) ?
            data.data.results :
            Array.isArray(data?.data?.memories) ?
            data.data.memories :
            [];
          return results.map(normalizeMem0MemoryText).filter(Boolean);
        };
  return { extractMem0Results };
}
