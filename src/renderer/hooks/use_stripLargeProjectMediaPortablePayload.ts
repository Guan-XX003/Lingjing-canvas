// @ts-nocheck
/**
 * stripLargeProjectMediaPortablePayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildProjectMediaFileUrl } from "../lib/resource";
import { isProjectMediaFileBackedBinding } from "../lib/backup";

export function use_stripLargeProjectMediaPortablePayload(deps: any) {
  const {} = deps;
  const stripLargeProjectMediaPortablePayload = (binding, bindingKey, data) => {
                  if (!binding || typeof binding != `object`) return binding;
                  if (!binding.localPath || !isProjectMediaFileBackedBinding(binding, bindingKey, data)) return binding;
                  let {
                    value,
                    portableData,
                    portableDataRef,
                    ...rest
                  } = binding;
                  return {
                    ...rest,
                    valueFormat: `file-url`,
                    sourceSignature: buildProjectMediaFileUrl(binding.localPath) || binding.sourceSignature,
                  };
                };
  return { stripLargeProjectMediaPortablePayload };
}
