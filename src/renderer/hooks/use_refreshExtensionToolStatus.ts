// @ts-nocheck
/**
 * refreshExtensionToolStatus。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_refreshExtensionToolStatus(deps: any) {
  const {
    setExtensionToolStatus,
  } = deps;
  const refreshExtensionToolStatus = async (toolName = `deface`) => {
	    try {
	      if (typeof window > `u` || typeof window.wanjuanDesktop?.getExtensionToolStatus != `function`) {
	        setExtensionToolStatus((prev) => ({
	          ...prev,
	          [toolName]: {
	            ok: false,
	            installed: false,
	            error: `拓展工具检测能力不可用，请重启应用`,
	          },
	        }));
	        return;
	      }
	      let toolStatus = await window.wanjuanDesktop.getExtensionToolStatus({ tool: toolName });
	      setExtensionToolStatus((prev) => ({ ...prev, [toolName]: toolStatus }));
	    } catch (error) {
	      setExtensionToolStatus((prev) => ({
	        ...prev,
	        [toolName]: {
	          ok: false,
	          installed: false,
	          error: error?.message || String(error),
	        },
	      }));
	    }
	  };
  return { refreshExtensionToolStatus };
}
