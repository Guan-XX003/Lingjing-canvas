// @ts-nocheck
/**
 * deleteCustomNodeTemplate。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
declare const chrome: any;

export function use_deleteCustomNodeTemplate(deps: any) {
  const {
    edges,
    isPluginEnv,
    setEdges,
    showToast2,
  } = deps;
  const deleteCustomNodeTemplate = (templateId) => {
          if (confirm(`确定要删除这个自定义节点模板吗？`)) {
            let updatedTemplates = edges.filter((template) => template.id !== templateId);
            (setEdges(updatedTemplates),
              isPluginEnv && chrome.storage.local.set({
                customNodeTemplates: updatedTemplates
              }),
              showToast2(`已删除自定义节点`));
          }
        };
  return { deleteCustomNodeTemplate };
}
