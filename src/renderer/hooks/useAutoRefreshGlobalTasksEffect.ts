// @ts-nocheck
/**
 * useAutoRefreshGlobalTasksEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref } from "../lib/app-types";

interface UseAutoRefreshGlobalTasksEffectDeps {
  wanjuanAutoRefreshGlobalTaskRefreshRef: Ref;
  wanjuanAutoRefreshGlobalTasksBusyRef: Ref;
  wanjuanAutoRefreshGlobalTasksRef: Ref;
}

export function useAutoRefreshGlobalTasksEffect(deps: UseAutoRefreshGlobalTasksEffectDeps) {
  const {
    wanjuanAutoRefreshGlobalTaskRefreshRef,
    wanjuanAutoRefreshGlobalTasksBusyRef,
    wanjuanAutoRefreshGlobalTasksRef,
  } = deps;
  useEffect(() => {
	                let refreshActiveGlobalTasks = () => {
	                  if (wanjuanAutoRefreshGlobalTasksBusyRef.current) return;
	                  let activeTasks = (wanjuanAutoRefreshGlobalTasksRef.current || [])
	                    .filter((task) => {
	                      if (!task || task.stoppedByUser || !task.id) return false;
	                      if (task.status !== `running` && task.status !== `pending`) return false;
	                      let provider = String(task.provider || ``).toLowerCase(),
	                        outputType = String(task.type || task.customOutputType || ``).toLowerCase(),
	                        modelName = String(task.modelName || ``).toLowerCase();
	                      return outputType === `video` ||
	                        provider === `seedance` ||
	                        provider === `tongyi-wanxiang` ||
	                        /seedance|doubao|wanx|wan\d|tongyi/.test(modelName) ||
	                        (outputType === `image` && (task.remoteTaskId || task.requestProfile?.requestType === `gpt-image-2-async`)) ||
	                        (outputType === `audio` && (task.remoteTaskId || provider === `suno`));
	                    })
	                    .sort((taskA, taskB) => (taskB.createdAt || 0) - (taskA.createdAt || 0))
	                    .slice(0, 5);
	                  if (!activeTasks.length) return;
	                  wanjuanAutoRefreshGlobalTasksBusyRef.current = true;
	                  (async () => {
	                    try {
	                      for (let task of activeTasks) await wanjuanAutoRefreshGlobalTaskRefreshRef.current?.(task, {
	                        silent: true
	                      });
	                    } finally {
	                      wanjuanAutoRefreshGlobalTasksBusyRef.current = false;
	                    }
	                  })();
	                };
	                let intervalId = window.setInterval(refreshActiveGlobalTasks, 7e3),
	                  timeoutId = window.setTimeout(refreshActiveGlobalTasks, 1200);
	                return () => {
	                  window.clearInterval(intervalId);
	                  window.clearTimeout(timeoutId);
	                };
	              }, []);
}
