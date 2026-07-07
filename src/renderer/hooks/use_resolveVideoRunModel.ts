// @ts-nocheck
/**
 * resolveVideoRunModel。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_resolveVideoRunModel(deps: any) {
  const {} = deps;
  const resolveVideoRunModel = (nodeData = {}, nodeType = ``) => {
	      let modelText =
	          nodeType === `seedanceNode` ?
	          nodeData.seedanceMode === `tianji` ?
	          nodeData.tianjiSeedanceModel || nodeData.videoModel :
	          nodeData.seedanceModel || nodeData.videoModel :
	          nodeData.videoModel,
	        currentModel =
	          nodeType === `seedanceNode` ?
	          nodeData.seedanceMode === `tianji` ?
	          nodeData.tianjiSelectedModel || nodeData.selectedModel :
	          nodeData.seedanceSelectedModel || nodeData.selectedModel :
	          nodeData.selectedModel;
	      return currentModel ?
	        currentModel :
	        modelText ?
	        String(modelText)
	        .split(
	          `
		`,
	        )[0]
	        .trim() :
	        undefined;
	    };
  return { resolveVideoRunModel };
}
