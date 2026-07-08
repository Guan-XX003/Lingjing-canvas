// @ts-nocheck
/**
 * normalizeMem0MemoryText。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseNormalizeMem0MemoryTextDeps {}

export function use_normalizeMem0MemoryText(deps: UseNormalizeMem0MemoryTextDeps) {
  const {} = deps;
  const normalizeMem0MemoryText = (value) => {
          if (!value) return ``;
          if (typeof value == `string`) return value.trim();
          if (typeof value?.memory == `string`) return value.memory.trim();
          if (typeof value?.text == `string`) return value.text.trim();
          if (typeof value?.content == `string`) return value.content.trim();
          if (typeof value?.data?.memory == `string`) return value.data.memory.trim();
          return ``;
        };
  return { normalizeMem0MemoryText };
}
