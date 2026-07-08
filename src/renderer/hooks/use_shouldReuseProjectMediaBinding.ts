// @ts-nocheck
/**
 * shouldReuseProjectMediaBinding。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildProjectMediaFileUrl } from "../lib/resource";

interface UseShouldReuseProjectMediaBindingDeps {}

export function use_shouldReuseProjectMediaBinding(deps: UseShouldReuseProjectMediaBindingDeps) {
  const {} = deps;
  const shouldReuseProjectMediaBinding = (binding, signature) => {
                  if (!binding || typeof binding != `object` || typeof signature != `string` || !signature) return false;
                  if (binding.sourceSignature === signature) return true;
                  if (binding.localPath && buildProjectMediaFileUrl(binding.localPath) === signature) return true;
                  return false;
                };
  return { shouldReuseProjectMediaBinding };
}
