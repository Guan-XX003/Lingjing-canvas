/**
 * handleSplit。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { SetAny, Toast } from "../lib/app-types";

interface UseHandleSplitDeps {
  getEdges: () => any[];
  getNodes: () => any[];
  handleCrop: any;
  openImageEditor: any;
  openImagePreview: any;
  setEdges: SetAny;
  setNodes: SetAny;
  showToast: Toast;
}

export function useHandleSplit(deps: UseHandleSplitDeps) {
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
  const handleSplit = useCallback(
      async (nodeId, imageUrl, gridSize, idTemplate = `id{num}`) => {
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
            let tileWidth = naturalWidth / gridSize,
              tileHeight = naturalHeight / gridSize,
              canvas = document.createElement(`canvas`);
            ((canvas.width = tileWidth), (canvas.height = tileHeight));
            let context = canvas.getContext(`2d`);
            if (!context) throw Error(`Failed to get canvas context`);
            let sourceNode = getNodes().find((node) => node.id === nodeId),
              baseX = sourceNode?.position.x ?? 100,
              baseY = sourceNode?.position.y ?? 100,
              startX = baseX + 400,
              startY = baseY,
              collectedNodes = [];
            for (let row = 0; row < gridSize; row++)
              for (let col = 0; col < gridSize; col++) {
                (context.clearRect(0, 0, tileWidth, tileHeight),
                  context.drawImage(image, col * tileWidth, row * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight));
                let dataUrl = canvas.toDataURL(`image/png`),
                  tileNumber = row * gridSize + col + 1,
                  label = idTemplate.replace(`{num}`, tileNumber.toString());
                collectedNodes.push({
                  id: `split-${nodeId}-${row}-${col}-${Date.now()}`,
                  type: `imageNode`,
                  position: {
                    x: startX + col * 350,
                    y: startY + row * 350
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
                    label: label,
                  },
                });
              }
            setNodes((prevNodes) => prevNodes.concat(collectedNodes));
            let newEdges = collectedNodes.map((node) => ({
              id: `e-${nodeId}-${node.id}`,
              source: nodeId,
              target: node.id,
            }));
            (setEdges((prevEdges) => prevEdges.concat(newEdges)), showToast(`已生成 ${gridSize * gridSize} 张切片`));
          } catch (error) {
            (console.error(`Split Error:`, error), showToast(`切片失败: ${error.message}`));
          }
        },
        [getNodes, setNodes, handleCrop, showToast, getEdges],
    );
  return { handleSplit };
}
