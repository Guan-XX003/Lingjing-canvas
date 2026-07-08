/**
 * readChromeStorage。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

interface UseReadChromeStorageDeps {}

export function use_readChromeStorage(deps: UseReadChromeStorageDeps) {
  const {} = deps;
  const readChromeStorage = (keys) =>
	        new Promise((resolve) => {
	          try {
	            typeof chrome < `u` && chrome.storage?.local ?
	              chrome.storage.local.get(keys, (result) => resolve(result || {})) :
	              resolve({});
	          } catch {
	            resolve({});
	          }
	        });
  return { readChromeStorage };
}
