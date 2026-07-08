// @ts-nocheck
/**
 * resolveWanjuanPlayableTaskUrl。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseResolveWanjuanPlayableTaskUrlDeps {
  wanjuanResourceLocalUrlMap: any;
}

export function use_resolveWanjuanPlayableTaskUrl(deps: UseResolveWanjuanPlayableTaskUrlDeps) {
  const {
    wanjuanResourceLocalUrlMap,
  } = deps;
  const resolveWanjuanPlayableTaskUrl = (currentValue, taskValue) => {
	      let current = typeof currentValue == `string` ? currentValue : ``,
	        task = typeof taskValue == `string` ? taskValue : ``,
	        localTaskUrl = task ? wanjuanResourceLocalUrlMap.get(task)?.url || `` : ``;
	      if (localTaskUrl) return localTaskUrl;
	      if (task) return task;
	      return current;
	    };
  return { resolveWanjuanPlayableTaskUrl };
}
