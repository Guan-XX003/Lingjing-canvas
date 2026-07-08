// @ts-nocheck
/**
 * saveUsers。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
declare const chrome: any;

interface UseSaveUsersDeps {
  isPluginEnv: boolean;
  setUsers: SetAny;
  users: any;
}

export function use_saveUsers(deps: UseSaveUsersDeps) {
  const {
    isPluginEnv,
    setUsers,
    users,
  } = deps;
  const saveUsers = (users2) => {
      if (
        (setUsers(users2), typeof chrome > `u` || !chrome.storage || !chrome.storage.local)
      ) {
        (console.warn(`Chrome Storage API is not available.`),
          isPluginEnv &&
          alert(`保存失败：未检测到 Chrome Storage API。请检查插件权限。`));
        return;
      }
      try {
        chrome.storage.local.set({
          users: users2
        }, () => {
          if (chrome.runtime.lastError) {
            let errorMessage = chrome.runtime.lastError.message || `未知错误`;
            (console.error(`Storage save failed:`, errorMessage),
              errorMessage.includes(`QUOTA_BYTES`) ?
              alert(`保存失败：存储空间已满。请尝试删除一些旧账号。`) :
              alert(`保存失败: ` + errorMessage));
          }
        });
      } catch (error) {
        (console.error(`Save exception:`, error), alert(`保存发生异常: ` + error));
      }
    };
  return { saveUsers };
}
