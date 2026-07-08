/**
 * createImageNode。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetAny } from "../lib/app-types";

interface UseCreateImageNodeDeps {
  getNodes: () => any[];
  handleCrop: any;
  openImageEditor: any;
  openImagePreview: any;
  setEdges: SetAny;
  setNodes: SetAny;
}

export function useCreateImageNode(deps: UseCreateImageNodeDeps) {
  const {
    getNodes,
    handleCrop,
    openImageEditor,
    openImagePreview,
    setEdges,
    setNodes,
  } = deps;
  const createImageNode = useCallback(
	      (sourceNodeId, imageUrl) => {
	        let sourceNode = getNodes().find((node) => node.id === sourceNodeId);
	        if (sourceNode) {
	          if (!imageUrl) return;
	          let imageNodeId = `image-${Date.now()}`,
	            imageNode = {
	              id: imageNodeId,
	              type: `imageNode`,
              position: {
                x: sourceNode.position.x - 400,
                y: sourceNode.position.y
              },
              style: {
                width: 224,
                height: 224
	              },
	              data: {
	                imageUrl: imageUrl,
	                onCrop: handleCrop,
	                onZoom: openImagePreview,
	                onEdit: openImageEditor,
	              },
	            };
	          setNodes((prevNodes) => prevNodes.concat(imageNode));
	          let newEdge = {
	            id: `e-${imageNodeId}-${sourceNodeId}`,
            source: imageNodeId,
	            target: sourceNodeId
	          };
	          setEdges((prevEdges) => prevEdges.concat(newEdge));
	        }
	      },
	      [getNodes, setNodes, setEdges, handleCrop, openImagePreview, openImageEditor],
	    );
  return { createImageNode };
}
