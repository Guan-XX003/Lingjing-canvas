// @ts-nocheck
/**
 * addCustomNodeTemplate。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_addCustomNodeTemplate(deps: any) {
  const {
    edges,
    isPluginEnv,
    setEdges,
    showToast2,
  } = deps;
  const addCustomNodeTemplate = (template) => {
          template.id ||= Date.now().toString();
          let updatedTemplates = [...edges, template];
          (setEdges(updatedTemplates),
            isPluginEnv && chrome.storage.local.set({
              customNodeTemplates: updatedTemplates
            }),
            showToast2(`已保存为自定义节点`));
        };
  return { addCustomNodeTemplate };
}
