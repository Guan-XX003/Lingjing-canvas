/** Stored global configurations switch bindings without deleting unrelated APIs. */
import type { ApiConfig } from "../lib/app-types";
import { mergeGlobalConfigApiConfigs } from "../lib/global-config";

interface UseMergeStoredGlobalApiConfigsDeps {
  apiConfigs: ApiConfig[];
}

export function use_mergeStoredGlobalApiConfigs(deps: UseMergeStoredGlobalApiConfigsDeps) {
  const { apiConfigs } = deps;
  const mergeStoredGlobalApiConfigs = (value) => {
      return mergeGlobalConfigApiConfigs(apiConfigs, value);
    };
  return { mergeStoredGlobalApiConfigs };
}
