// @ts-nocheck —— 逐字搬出;缺失依赖已tsc解析补齐,仅跳过loose-JS严格类型检查以保持行为不变。
/**
 * groupSelectedNodes。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";

export function useGroupNodes(deps: any) {
  const {
    nodesRef,
    setNodes,
    showToast,
  } = deps;
  const groupSelectedNodes = useCallback(() => {
      let selectedNodes = nodesRef.current.filter((node) => node.selected && node.type !== `group`);
      if (selectedNodes.length < 2) {
        showToast(`请至少选择两个节点进行打组`);
        return;
      }
      let minX = Math.min(...selectedNodes.map((node) => node.position.x)),
        minY = Math.min(...selectedNodes.map((node) => node.position.y)),
        maxX = Math.max(
          ...selectedNodes.map((node) => node.position.x + (node.measured?.width || 300)),
        ),
        maxY = Math.max(
          ...selectedNodes.map((node) => node.position.y + (node.measured?.height || 200)),
        ),
        groupId = `group-${Date.now()}`,
        groupNode = {
          id: groupId,
          type: `group`,
          position: {
            x: minX - 40,
            y: minY - 40
          },
          style: {
            width: maxX - minX + 80,
            height: maxY - minY + 80,
            backgroundColor: `rgba(90, 60, 120, 0.05)`,
            border: `1px dashed rgba(155, 130, 194, 0.5)`,
            borderRadius: `8px`,
          },
          data: {
            label: `未命名分组`
          },
          zIndex: -1,
        };
      (setNodes((nodes2) => [
          groupNode,
          ...nodes2.map((node) =>
            selectedNodes.some((node2) => node2.id === node.id) ?
            {
              ...node,
              parentId: groupId,
              position: {
                x: node.position.x - (minX - 40),
                y: node.position.y - (minY - 40),
              },
              selected: false,
            } :
            node,
          ),
        ]),
        showToast(`打组成功`));
    }, [setNodes, showToast]);
  return { groupSelectedNodes };
}
