// @ts-nocheck
/**
 * autoLayout。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";

export function useAutoLayout(deps: any) {
  const {
    dagreModule,
    edgesRef,
    fitView,
    nodesRef,
    setNodes,
    showToast,
  } = deps;
  const autoLayout = useCallback(() => {
      let dagreGraph = new dagreModule.default.graphlib.Graph({
        compound: true
      });
      (dagreGraph.setDefaultEdgeLabel(() => ({})),
        dagreGraph.setGraph({
          rankdir: `LR`,
          nodesep: 100,
          ranksep: 200
        }));
      let nodes2 = nodesRef.current,
        edges2 = edgesRef.current;
      (nodes2.forEach((node) => {
          (dagreGraph.setNode(node.id, {
              width: node.measured?.width || 300,
              height: node.measured?.height || 200,
            }),
            node.parentId && dagreGraph.setParent(node.id, node.parentId));
        }),
        edges2.forEach((edge) => {
          dagreGraph.setEdge(edge.source, edge.target);
        }),
        dagreModule.default.layout(dagreGraph),
        setNodes((nodes3) =>
          nodes3.map((node) => {
            let layoutNode = dagreGraph.node(node.id);
            if (!layoutNode) return node;
            let posX = layoutNode.x - layoutNode.width / 2,
              posY = layoutNode.y - layoutNode.height / 2;
            if (node.parentId) {
              let parentNode = dagreGraph.node(node.parentId);
              parentNode && ((posX -= parentNode.x - parentNode.width / 2), (posY -= parentNode.y - parentNode.height / 2));
            }
            return {
              ...node,
              position: {
                x: posX,
                y: posY
              },
              style: node.type === `group` ?
                {
                  ...node.style,
                  width: layoutNode.width,
                  height: layoutNode.height
                } :
                node.style,
            };
          }),
        ),
        showToast(`已自动排版`),
        setTimeout(() => fitView({
          padding: 0.2,
          duration: 800
        }), 100));
    }, [setNodes, fitView, showToast]);
  return { autoLayout };
}
