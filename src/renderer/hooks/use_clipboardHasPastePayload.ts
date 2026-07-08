// @ts-nocheck
/**
 * clipboardHasPastePayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseClipboardHasPastePayloadDeps {}

export function use_clipboardHasPastePayload(deps: UseClipboardHasPastePayloadDeps) {
  const {} = deps;
  const clipboardHasPastePayload = async () => {
			      let text = await navigator.clipboard?.readText?.().catch(() => ``);
			      if (text && text.trim()) return true;
			      let items = await navigator.clipboard?.read?.().catch(() => []);
			      return Array.isArray(items) && items.some((item) =>
			        Array.from(item.types || []).some((type) => /^image\//i.test(type) || type === `text/plain`),
			      );
			    };
  return { clipboardHasPastePayload };
}
