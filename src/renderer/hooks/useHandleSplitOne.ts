// @ts-nocheck
/**
 * handleSplitOne。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetState, Toast, WjEdge, WjNode } from "../lib/app-types";

interface UseHandleSplitOneDeps {
  getEdges: () => WjEdge[];
  getNodes: () => WjNode[];
  handleCrop: any;
  openImageEditor: any;
  openImagePreview: any;
  setEdges: SetState<WjEdge[]>;
  setNodes: SetState<WjNode[]>;
  showToast: Toast;
}

export function useHandleSplitOne(deps: UseHandleSplitOneDeps) {
  const {
    getEdges,
    getNodes,
    handleCrop,
    openImageEditor,
    openImagePreview,
    setEdges,
    setNodes,
    showToast,
  } = deps;
  const handleSplitOne = useCallback(
      async (nodeId, imageUrl, gridSize, sliceIndex, attemptIndex) => {
          try {
            let imageSrc = imageUrl;
            if (!imageSrc) {
              let incomingEdges = getEdges().filter((edge) => edge.target === nodeId);
              if (incomingEdges.length > 0) {
                let sourceNode = getNodes().find((node) => node.id === incomingEdges[0].source);
                sourceNode && sourceNode.data.imageUrl && (imageSrc = sourceNode.data.imageUrl);
              }
            }
            if (!imageSrc) {
              showToast(`请先连接包含图片的节点`);
              return;
            }
            let image = new Image();
            ((image.crossOrigin = `Anonymous`),
              (image.src = imageSrc),
              await new Promise((resolve, reject) => {
                ((image.onload = resolve),
                  (image.onerror = () => reject(Error(`Failed to load image`))));
              }));
            let naturalWidth = image.naturalWidth,
              naturalHeight = image.naturalHeight;
            if (naturalWidth === 0 || naturalHeight === 0) throw Error(`Image has 0 dimensions`);
            let cellWidth = naturalWidth / gridSize,
              cellHeight = naturalHeight / gridSize,
              rowIndex = Math.floor(sliceIndex / gridSize),
              colIndex = sliceIndex % gridSize,
              canvas = document.createElement(`canvas`);
            ((canvas.width = cellWidth), (canvas.height = cellHeight));
            let ctx = canvas.getContext(`2d`);
            if (!ctx) throw Error(`Failed to get canvas context`);
            ctx.drawImage(image, colIndex * cellWidth, rowIndex * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
            let dataUrl = canvas.toDataURL(`image/png`),
              node = getNodes().find((node2) => node2.id === nodeId),
              baseXPosition = (node?.position.x || 0) + 400,
              newY = (node?.position.y || 0) + 50,
              newNode = {
                id: `split-one-${nodeId}-${sliceIndex}-${Date.now()}`,
                type: `imageNode`,
                position: {
                  x: baseXPosition,
                  y: newY
                },
                style: {
                  width: 224,
                  height: 224
                },
                data: {
                  imageUrl: dataUrl,
                  onCrop: handleCrop,
                  onZoom: openImagePreview,
                  onEdit: openImageEditor,
                  label: attemptIndex,
                },
              };
            (setNodes((prevNodes) => prevNodes.concat(newNode)),
              setEdges((prevEdges) =>
                prevEdges.concat({
                  id: `e-${nodeId}-${newNode.id}`,
                  source: nodeId,
                  target: newNode.id
                }),
              ),
              showToast(`已切出第 ${sliceIndex + 1} 格`));
          } catch (error) {
            (console.error(`Split One Error:`, error), showToast(`切片失败: ${error.message}`));
          }
        },
        [getNodes, setNodes, handleCrop, showToast, getEdges],
    );
  return { handleSplitOne };
}
