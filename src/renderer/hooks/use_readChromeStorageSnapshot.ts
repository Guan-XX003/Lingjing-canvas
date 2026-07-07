// @ts-nocheck
/**
 * readChromeStorageSnapshot。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_readChromeStorageSnapshot(deps: any) {
  const {} = deps;
  const readChromeStorageSnapshot = (keys = null) =>
                      new Promise((resolve, reject) => {
                        if (!(typeof chrome < `u` && chrome.storage && chrome.storage.local)) {
                          reject(Error(`Chrome Storage API 不可用`));
                          return;
                        }
                        chrome.storage.local.get(Array.isArray(keys) ? keys : null, (items) => {
                          chrome.runtime?.lastError ?
                            reject(Error(chrome.runtime.lastError.message)) :
                            resolve(items || {});
                        });
                      });
  return { readChromeStorageSnapshot };
}
