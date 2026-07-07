// @ts-nocheck
/**
 * useSafeEffect1（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useSafeEffect1(deps: any) {
  const {
    nodes,
    setNodes,
  } = deps;
  useEffect(() => {
      let groupNodes = [],
        isDragging = false;
      for (let node of nodes)
        (node.type === `group` && groupNodes.push(node), node.dragging && (isDragging = true));
      if (groupNodes.length === 0 || isDragging) return;
      let hasChanges = false,
        updatedNodes = [...nodes];
      for (let groupNode of groupNodes) {
        let childNodes = updatedNodes.filter((node) => node.parentId === groupNode.id);
        if (childNodes.length === 0) continue;
        let minX = 1 / 0,
          minY = 1 / 0,
          maxX = -1 / 0,
          maxY = -1 / 0;
        (childNodes.forEach((childNode) => {
            let nodeX = childNode.position.x,
              nodeY = childNode.position.y,
              nodeWidth = childNode.measured?.width || childNode.style?.width || 300,
              nodeHeight = childNode.measured?.height || childNode.style?.height || 200;
            (nodeX < minX && (minX = nodeX),
              nodeY < minY && (minY = nodeY),
              nodeX + nodeWidth > maxX && (maxX = nodeX + nodeWidth),
              nodeY + nodeHeight > maxY && (maxY = nodeY + nodeHeight));
          }),
          (minX -= 40),
          (minY -= 40),
          (maxX += 40),
          (maxY += 40));
        let contentWidth = maxX - minX,
          contentHeight = maxY - minY;
        if (childNodes.some((node) => node.dragging)) {
          let newWidth = Math.max(contentWidth, groupNode.style?.width || 0, maxX),
            newHeight = Math.max(contentHeight, groupNode.style?.height || 0, maxY);
          if (newWidth !== groupNode.style?.width || newHeight !== groupNode.style?.height) {
            hasChanges = true;
            let nodeIndex = updatedNodes.findIndex((node) => node.id === groupNode.id);
            updatedNodes[nodeIndex] = {
              ...groupNode,
              style: {
                ...groupNode.style,
                width: newWidth,
                height: newHeight
              }
            };
          }
        } else if (
          Math.abs(minX) > 1 ||
          Math.abs(minY) > 1 ||
          Math.abs(groupNode.style?.width - contentWidth) > 1 ||
          Math.abs(groupNode.style?.height - contentHeight) > 1
        ) {
          hasChanges = true;
          let nodeIndex = updatedNodes.findIndex((node) => node.id === groupNode.id);
          if (
            ((updatedNodes[nodeIndex] = {
                ...groupNode,
                position: {
                  x: groupNode.position.x + minX,
                  y: groupNode.position.y + minY
                },
                style: {
                  ...groupNode.style,
                  width: contentWidth,
                  height: contentHeight
                },
              }),
              Math.abs(minX) > 1 || Math.abs(minY) > 1)
          )
            for (let index = 0; index < updatedNodes.length; index++)
              updatedNodes[index].parentId === groupNode.id &&
              (updatedNodes[index] = {
                ...updatedNodes[index],
                position: {
                  x: updatedNodes[index].position.x - minX,
                  y: updatedNodes[index].position.y - minY
                },
              });
        }
      }
      if (hasChanges) {
        let timeoutId = setTimeout(() => requestAnimationFrame(() => setNodes(updatedNodes)), 120);
        return () => clearTimeout(timeoutId);
      }
    }, [nodes, setNodes]);
}
