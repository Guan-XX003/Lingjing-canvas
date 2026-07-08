// @ts-nocheck
/**
 * deleteCustomNodeTemplate。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetState, Toast, WjEdge } from "../lib/app-types";
declare const chrome: any;

interface UseDeleteCustomNodeTemplateDeps {
  edges: WjEdge[];
  isPluginEnv: boolean;
  setEdges: SetState<WjEdge[]>;
  showToast2: Toast;
}

export function use_deleteCustomNodeTemplate(deps: UseDeleteCustomNodeTemplateDeps) {
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
