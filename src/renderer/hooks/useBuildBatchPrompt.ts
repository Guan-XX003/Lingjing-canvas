// @ts-nocheck
/**
 * buildBatchPrompt。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function useBuildBatchPrompt(deps: any) {
  const {
    basePrompt,
    batchDocText,
    docText,
    fullModelListText,
  } = deps;
  const buildBatchPrompt = (modelName, batchIndex, batchTotal) =>
	                basePrompt
	                .replace(`模型列表：
${fullModelListText}`, `模型列表（第 ${batchIndex + 1}/${batchTotal} 批，仅分析本批模型）：
${modelName.map((modelName2) => `- ${modelName2}`).join(`
`)}`)
	                .replace(`文档摘要：
${docText}`, `文档摘要：
${batchDocText}`);
  return { buildBatchPrompt };
}
