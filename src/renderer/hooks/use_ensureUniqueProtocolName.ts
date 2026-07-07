// @ts-nocheck
/**
 * ensureUniqueProtocolName。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_ensureUniqueProtocolName(deps: any) {
  const {
    modelProtocolRegistry,
  } = deps;
  const ensureUniqueProtocolName = (baseName) => {
      let protocolName = String(baseName || ``).trim() || `自定义协议`;
      if (!modelProtocolRegistry?.[protocolName]) return protocolName;
      let suffix = 2,
        candidateName = `${protocolName}（${suffix}）`;
      for (; modelProtocolRegistry?.[candidateName];)((suffix += 1), (candidateName = `${protocolName}（${suffix}）`));
      return candidateName;
    };
  return { ensureUniqueProtocolName };
}
