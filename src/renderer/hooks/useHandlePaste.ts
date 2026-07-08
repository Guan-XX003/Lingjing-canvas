// @ts-nocheck
/**
 * handlePaste。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Ref, SetAny, SetState, Toast, WjEdge, WjNode } from "../lib/app-types";
import { wanjuanCloneNodeDataForClipboard } from "../lib/video-task";

interface UseHandlePasteDeps {
  createNodeAt: any;
  generateImage: any;
  generateText: any;
  handleCrop: any;
  menuPosition: any;
  openImagePreview: any;
  projectIdRef: Ref;
  screenToFlowPosition: any;
  setEdges: SetState<WjEdge[]>;
  setMenuPosition: SetAny;
  setNodes: SetState<WjNode[]>;
  showToast: Toast;
  wrapperRef: Ref;
}

export function useHandlePaste(deps: UseHandlePasteDeps) {
  const {
    createNodeAt,
    generateImage,
    generateText,
    handleCrop,
    menuPosition,
    openImagePreview,
    projectIdRef,
    screenToFlowPosition,
    setEdges,
    setMenuPosition,
    setNodes,
    showToast,
    wrapperRef,
  } = deps;
  const handlePaste = useCallback(
      async (inputPosition, inputConnection, text) => {
          let position = inputPosition,
            connection = inputConnection || menuPosition?.connection;
          if (
            (!position &&
              menuPosition &&
              (position = screenToFlowPosition({
                x: menuPosition.x + (wrapperRef.current?.getBoundingClientRect().left || 0),
                y: menuPosition.y + (wrapperRef.current?.getBoundingClientRect().top || 0),
              })),
              !position)
          ) {
            let rect = wrapperRef.current?.getBoundingClientRect();
            position = rect ?
              screenToFlowPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
              }) :
              {
                x: 0,
                y: 0
              };
          }
          try {
            let clipboardText = text || (await navigator.clipboard.readText().catch(() => ``));
            if (clipboardText && clipboardText.trim())
              try {
                let clipboardData = JSON.parse(clipboardText.trim());
                if (clipboardData && clipboardData.type === `canvas-clipboard-nodes`) {
                  let {
                    nodes: nodes2,
                    edges: edges2,
                    referenceEdges: referenceEdges,
                    sourceProjectId: sourceProjectId
                  } = clipboardData;
                  if (!nodes2 || nodes2.length === 0) return;
                  let minX = Math.min(...nodes2.map((node) => node.position.x)),
                    minY = Math.min(...nodes2.map((node) => node.position.y)),
                    maxX = Math.max(
                      ...nodes2.map((node) => node.position.x + (node.measured?.width || 300)),
                    ),
                    maxY = Math.max(
                      ...nodes2.map((node) => node.position.y + (node.measured?.height || 300)),
                    ),
                    centerX = (minX + maxX) / 2,
                    centerY = (minY + maxY) / 2,
                    idMap = new Map(),
                    newNodes = nodes2.map((node) => {
                      let newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                      idMap.set(node.id, newId);
		                    let clonedData = wanjuanCloneNodeDataForClipboard(node.data);
		                      return {
		                        ...node,
	                        id: newId,
                        position: {
                          x: position.x + (node.position.x - centerX),
                          y: position.y + (node.position.y - centerY),
                        },
                        selected: true,
                        data: clonedData,
                      };
                    }),
	                    newEdges = (edges2 || []).map((edge) => ({
	                      ...edge,
	                      id: `e-${idMap.get(edge.source)}-${idMap.get(edge.target)}`,
	                      source: idMap.get(edge.source),
	                      target: idMap.get(edge.target),
	                      selected: true,
	                      type: `custom`,
	                    })).filter((edge) => edge.source && edge.target),
	                    remappedReferenceEdges =
	                    sourceProjectId &&
	                    projectIdRef.current &&
	                    sourceProjectId === projectIdRef.current ?
	                    (referenceEdges || []).map((edge) => ({
	                      ...edge,
	                      id: `e-${edge.source}-${idMap.get(edge.target)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
	                      target: idMap.get(edge.target),
	                      selected: true,
	                      type: `custom`,
	                    })).filter((edge) => edge.source && edge.target) :
	                    [];
	                  if (
	                    (setNodes((nodes3) => nodes3.map((item) => ({
	                        ...item,
	                        selected: false
	                      })).concat(newNodes)),
	                      setEdges((item) => item.map((edge) => ({
	                        ...edge,
	                        selected: false
	                      })).concat(newEdges, remappedReferenceEdges)),
                      connection && newNodes.length > 0)
                  ) {
                    let leftmostNode = newNodes.reduce((acc, node) =>
                        acc.position.x < node.position.x ? acc : node,
                      ),
                      newEdge = {
                        id: `e-${connection.source}-${leftmostNode.id}`,
                        source: connection.source,
                        sourceHandle: connection.sourceHandle,
                        target: leftmostNode.id,
                        targetHandle: null,
                        type: `custom`,
                      };
                    setEdges((edges3) => edges3.concat(newEdge));
                  }
                  (setMenuPosition(null), showToast(`已粘贴 ${newNodes.length} 个节点`));
                  return;
                } else if (clipboardData && clipboardData.type === `canvas-clipboard-images`) {
                  let {
                    images: images
                  } = clipboardData;
                  if (!images || images.length === 0) return;
                  let imageNodes = images.map((imageUrl, index) => {
                    let column = index % 6,
                      row = Math.floor(index / 6);
                    return {
                      id: `imageNode-${Date.now()}-${index}`,
                      type: `imageNode`,
                      position: {
                        x: position.x + column * 150,
                        y: position.y + row * 150
                      },
                      data: {
                        imageUrl: imageUrl,
                        label: `提取帧 ${index + 1}`
                      },
                      selected: true,
                      style: {
                        width: 120,
                        height: 120
                      },
                    };
                  });
                  (setNodes((nodes2) => nodes2.map((node) => ({
                      ...node,
                      selected: false
                    })).concat(imageNodes)),
                    setMenuPosition(null),
                    showToast(`已粘贴 ${images.length} 张提取的图片`));
                  return;
                }
              } catch {
                let storedData = localStorage.getItem(`canvas-clipboard`);
                if (storedData)
                  try {
                    let clipboardData = JSON.parse(storedData);
                    if (clipboardData && clipboardData.type === `canvas-clipboard-images`) {
                      let {
                        images: images
                      } = clipboardData;
                      if (images && images.length > 0) {
                        let imageNodes = images.map((imageUrl, index) => {
                          let column = index % 6,
                            row = Math.floor(index / 6);
                          return {
                            id: `imageNode-${Date.now()}-${index}`,
                            type: `imageNode`,
                            position: {
                              x: position.x + column * 150,
                              y: position.y + row * 150
                            },
                            data: {
                              imageUrl: imageUrl,
                              label: `提取帧 ${index + 1}`
                            },
                            selected: true,
                            style: {
                              width: 120,
                              height: 120
                            },
                          };
                        });
                        (setNodes((currentNodes) =>
                            currentNodes.map((node) => ({
                              ...node,
                              selected: false
                            })).concat(imageNodes),
                          ),
                          setMenuPosition(null),
                          showToast(`已粘贴 ${images.length} 张提取的图片`));
                        return;
                      }
                    }
                  } catch {}
              }
          } catch (error) {
            console.error(`Failed to read clipboard text`, error);
          }
          try {
            let clipboardItems = await navigator.clipboard.read().catch(() => []);
            if (clipboardItems && clipboardItems.length > 0)
              for (let clipboardItem of clipboardItems) {
                if (clipboardItem.types.some((mimeType) => mimeType.startsWith(`image/`))) {
                  let blob = await clipboardItem.getType(
                      clipboardItem.types.find((mimeType) => mimeType.startsWith(`image/`)),
                    ),
                    reader = new FileReader();
                  ((reader.onload = (event) => {
                      let dataUrl = event.target?.result;
                      createNodeAt(`imageNode`, position, {
                        imageUrl: dataUrl
                      }, connection);
                    }),
                    reader.readAsDataURL(blob),
                    setMenuPosition(null));
                  return;
                }
                if (clipboardItem.types.includes(`text/plain`)) {
                  let clipboardText = await (await clipboardItem.getType(`text/plain`)).text();
                  if (clipboardText && clipboardText.trim()) {
                    try {
                      let clipboardData = JSON.parse(clipboardText);
                      if (clipboardData && clipboardData.type === `canvas-clipboard-nodes`) return;
                    } catch {}
                    (createNodeAt(`textNode`, position, {
                        text: clipboardText.trim(),
                        expanded: false
                      }, connection),
                      setMenuPosition(null));
                    return;
                  }
                }
              }
          } catch (error) {
            console.error(`Failed to read clipboard contents: `, error);
          }
          (!menuPosition && !text ?
            showToast(`无法读取剪贴板或格式不支持，请尝试使用 Ctrl+V 快捷键`) :
            menuPosition && !text && showToast(`读取剪贴板失败，请使用 Ctrl+V 快捷键粘贴`),
            setMenuPosition(null));
        },
        [menuPosition, screenToFlowPosition, generateImage, generateText, handleCrop, openImagePreview, setNodes, setEdges, showToast],
    );
  return { handlePaste };
}
