// @ts-nocheck
/**
 * addCustomNodeTemplate。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetState, Toast, WjEdge } from "../lib/app-types";
declare const chrome: any;

interface UseAddCustomNodeTemplateDeps {
  edges: WjEdge[];
  isPluginEnv: boolean;
  setEdges: SetState<WjEdge[]>;
  showToast2: Toast;
}

export function use_addCustomNodeTemplate(deps: UseAddCustomNodeTemplateDeps) {
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
