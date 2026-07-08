// @ts-nocheck
/**
 * extractMem0Results。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseExtractMem0ResultsDeps {
  normalizeMem0MemoryText: any;
}

export function use_extractMem0Results(deps: UseExtractMem0ResultsDeps) {
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
