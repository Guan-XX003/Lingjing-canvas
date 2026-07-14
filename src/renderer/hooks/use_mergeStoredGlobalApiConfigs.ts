/** Stored global configurations replace the active API snapshot in full. */
import type { ApiConfig } from "../lib/app-types";
import { replaceGlobalConfigApiConfigs } from "../lib/global-config";

interface UseMergeStoredGlobalApiConfigsDeps {
  apiConfigs: ApiConfig[];
}

export function use_mergeStoredGlobalApiConfigs(_deps: UseMergeStoredGlobalApiConfigsDeps) {
  const mergeStoredGlobalApiConfigs = (value) => {
      return replaceGlobalConfigApiConfigs(value);
    };
  return { mergeStoredGlobalApiConfigs };
}
