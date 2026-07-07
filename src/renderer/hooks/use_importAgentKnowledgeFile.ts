// @ts-nocheck
/**
 * importAgentKnowledgeFile。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildKnowledgeChunks } from "../lib/agent";

export function use_importAgentKnowledgeFile(deps: any) {
  const {
    selectedAgent,
    showToast2,
    updateSelectedAgent,
  } = deps;
  const importAgentKnowledgeFile = async () => {
            if (!selectedAgent || !window.wanjuanDesktop?.readKnowledgeFile) return;
            try {
              let fileResult = await window.wanjuanDesktop.readKnowledgeFile({
                title: `选择要导入到知识库的文件`,
                maxBytes: 1024 * 1024 * 50,
              });
              if (!fileResult?.ok) {
                fileResult?.canceled || showToast2(fileResult?.error || `导入知识文件失败`);
                return;
              }
              let fileContent = String(fileResult.content || ``)
                .replace(/\r\n/g, `\n`)
                .replace(/\n{3,}/g, `\n\n`)
                .trim(),
                knowledgeChunks = buildKnowledgeChunks(fileContent),
                knowledgeFile = {
                  id: `knowledge-${Date.now()}`,
                  name: fileResult.name || `未命名文件`,
                  path: fileResult.path || ``,
                  size: fileResult.size || 0,
                  content: fileContent,
                  excerpt: fileContent.slice(0, 180),
                  totalChars: fileContent.length,
                  chunks: knowledgeChunks,
                  importedAt: Date.now(),
                };
              updateSelectedAgent({
                  knowledgeFiles: [...(selectedAgent.knowledgeFiles || []), knowledgeFile],
                }),
                showToast2(`知识文件已导入`);
            } catch (error) {
              (console.error(error), showToast2(error?.message || `导入知识文件失败`));
            }
          };
  return { importAgentKnowledgeFile };
}
