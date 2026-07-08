/**
 * updateGlobalTasks。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
import { compactGlobalTasks } from "../lib/app-root-helpers";
declare const chrome: any;

interface UseUpdateGlobalTasksDeps {
  isPluginEnv: boolean;
  setGlobalTasks: SetAny;
  globalTasks: any;
}

export function use_updateGlobalTasks(deps: UseUpdateGlobalTasksDeps) {
  const {
    isPluginEnv,
    setGlobalTasks,
    globalTasks,
  } = deps;
  const updateGlobalTasks = (updater) => {
		              setGlobalTasks((prevTasks) => {
		                let nextTasks = compactGlobalTasks(updater(prevTasks));
			                // 防抖持久化：不再每次更新都同步写 chrome.storage（原写在 updater 内→StrictMode 双写且无节流，自动刷新每 tick 触发）
			                clearTimeout(globalThis.__wanjuanGlobalTasksPersistTimer);
			                globalThis.__wanjuanGlobalTasksPersistTimer = setTimeout(() => {
			                  isPluginEnv && chrome.storage.local.set({ globalTasks: nextTasks });
			                }, 400);
			                return nextTasks;
              });
            };
  return { updateGlobalTasks };
}
