// @ts-nocheck
/**
 * handleFileChange。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_handleFileChange(deps: any) {
  const {
    createImportedMediaNode,
    createNodeAt,
    menuPosition,
    screenToFlowPosition,
    wrapperRef,
  } = deps;
  const handleFileChange = (event) => {
      !event.target.files ||
        event.target.files.length === 0 ||
        (Array.from(event.target.files).forEach((file, index) => {
            if (!menuPosition) return;
            let position = screenToFlowPosition({
              x: menuPosition.x + (wrapperRef.current?.getBoundingClientRect().left || 0) + index * 50,
              y: menuPosition.y + (wrapperRef.current?.getBoundingClientRect().top || 0) + index * 50,
            });
            if (file.type.startsWith(`text/`)) {
              let reader = new FileReader();
              ((reader.onload = (event2) => {
                  let result = event2.target?.result;
                  (createNodeAt(`textNode`, position, {
                      text: result,
                      label: file.name,
                      sourceOrigin: `external-upload`,
                      originalName: file.name,
                    }, menuPosition.connection),
                    addGeneratedAsset?.(result, `text`, file.name, `external-upload`));
                }),
                reader.readAsText(file));
              return;
            }
            (file.type.startsWith(`image/`) || file.type.startsWith(`video/`) || file.type.startsWith(`audio/`)) &&
              createImportedMediaNode(file, position, menuPosition.connection);
          }),
          (event.target.value = ``));
    };
  return { handleFileChange };
}
