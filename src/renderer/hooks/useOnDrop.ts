// @ts-nocheck
/**
 * onDrop。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";

interface UseOnDropDeps {
  addGeneratedAsset: any;
  createImportedMediaNode: any;
  createNodeAt: any;
  screenToFlowPosition: any;
}

export function useOnDrop(deps: UseOnDropDeps) {
  const {
    addGeneratedAsset,
    createImportedMediaNode,
    createNodeAt,
    screenToFlowPosition,
  } = deps;
  const onDrop = useCallback(
            (event) => {
              event.preventDefault();
              let dropPosition = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY
              });
              if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                Array.from(event.dataTransfer.files).forEach((file, index) => {
                  if (
                    file.type.startsWith(`image/`) ||
                    file.type.startsWith(`video/`) ||
                    file.type.startsWith(`audio/`) ||
                    file.type.startsWith(`text/`)
                  ) {
                    let position = {
                      x: dropPosition.x + index * 50,
                      y: dropPosition.y + index * 50
                    };
                    if (file.type.startsWith(`text/`)) {
                      let fileReader = new FileReader();
                      ((fileReader.onload = (event2) => {
                          let fileResult = event2.target?.result;
                        file.type.startsWith(`text/`) ?
                          createNodeAt(`textNode`, position, {
                            text: fileResult,
                            label: file.name,
                            sourceOrigin: `external-upload`,
                            originalName: file.name,
                          }) :
                          null;
                        addGeneratedAsset?.(fileResult, `text`, file.name, `external-upload`);
	                      }),
                        fileReader.readAsText(file));
                      return;
                    }
                    createImportedMediaNode(file, position);
                  }
                });
                return;
              }
              let droppedText = event.dataTransfer.getData(`text/plain`);
              droppedText &&
                (droppedText.startsWith(`http`) ||
                  droppedText.startsWith(`data:image`) ||
                  droppedText.startsWith(`blob:`) ?
                  createNodeAt(`imageNode`, dropPosition, {
                    imageUrl: droppedText
                  }) :
                  createNodeAt(`textNode`, dropPosition, {
                    text: droppedText
                  }));
            },
            [screenToFlowPosition, createNodeAt],
          );
  return { onDrop };
}
