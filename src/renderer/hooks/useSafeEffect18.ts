// @ts-nocheck
/**
 * useSafeEffect18（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetState, WjEdge, WjNode } from "../lib/app-types";

interface UseSafeEffect18Deps {
  e: any;
  addKeyboardNode: any;
  autoLayout: any;
  clipboardHasPastePayload: any;
  copySelectedNodes: any;
  groupSelectedNodes: any;
  handlePaste: any;
  menuPosition: any;
  nodesRef: Ref<WjNode[]>;
  redo: any;
  setEdges: SetState<WjEdge[]>;
  setNodes: SetState<WjNode[]>;
  stopGeneration: any;
}

export function useSafeEffect18(deps: UseSafeEffect18Deps) {
  const {
    $e,
    addKeyboardNode,
    autoLayout,
    clipboardHasPastePayload,
    copySelectedNodes,
    groupSelectedNodes,
    handlePaste,
    menuPosition,
    nodesRef,
    redo,
    setEdges,
    setNodes,
    stopGeneration,
  } = deps;
  useEffect(() => {
      let guard = (event) => {
          let targetElement = event.target;
          return !!(
            document.activeElement?.isContentEditable ||
            targetElement?.closest?.(`input, textarea, select, [contenteditable="true"]`) ||
            nodesRef.current.some((node) => node.dragging)
          );
        },
	        handleKeyDown = async (event) => {
	          let fullscreenElement =
	            document.fullscreenElement ||
	            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;
          if (
            event.key === `Escape` &&
            (fullscreenElement ||
              window.screenTop === 0 ||
              window.screenY === 0)
          )
            return;
	          let shortcutKey = String(event.key || ``).toLowerCase(),
	            isPlainCommand = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
	          if ((event.ctrlKey || event.metaKey) && event.key === `z`) {
	            if (guard(event)) return;
	            (event.preventDefault(), event.shiftKey ? redo() : $e());
	          } else if ((event.ctrlKey || event.metaKey) && event.key === `y`) {
	            if (guard(event)) return;
	            (event.preventDefault(), redo());
	          }
	          else if (isPlainCommand && [`t`, `i`, `v`, `j`].includes(shortcutKey)) {
	            if (guard(event) || event.repeat) return;
	            event.preventDefault();
	            if (shortcutKey === `v` && await clipboardHasPastePayload()) {
	              handlePaste();
	              return;
	            }
		            shortcutKey === `t` ?
		              addKeyboardNode(`textNode`, {
		                text: ``
		              }) :
		              shortcutKey === `i` ?
		              addKeyboardNode(`promptNode`, {
		                prompt: ``
		              }) :
		              shortcutKey === `v` ?
		              addKeyboardNode(`videoNode`, {
		                prompt: ``
		              }) :
		              addKeyboardNode(`seedanceNode`, {
		                prompt: ``
		              });
	          }
	          else if ((event.ctrlKey || event.metaKey) && event.key === `c`) {
	            if (guard(event)) return;
	            copySelectedNodes();
          } else if ((event.ctrlKey || event.metaKey) && event.key === `g`) {
            if (guard(event)) return;
            (event.preventDefault(), groupSelectedNodes());
          } else if ((event.ctrlKey || event.metaKey) && event.key === `l`) {
            if (guard(event)) return;
            (event.preventDefault(), autoLayout());
          } else if (event.key === `Backspace` || event.key === `Delete`) {
            if (guard(event)) return;
            let selectedNodeIds = nodesRef.current.filter((node) => node.selected).map((node) => node.id);
            selectedNodeIds.length > 0 &&
              (event.preventDefault(),
                selectedNodeIds.forEach((nodeId) => stopGeneration(nodeId, {
                  silent: true
                })),
                setNodes((nodes2) => nodes2.filter((node) => !selectedNodeIds.includes(node.id))),
                setEdges((edges2) =>
                  edges2.filter((edge) => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)),
                ));
          }
        },
        handlePaste2 = (event) => {
          if (guard(event)) return;
          let clipboardText = event.clipboardData?.getData(`text/plain`);
          if (clipboardText && clipboardText.trim())
            try {
              let parsedData = JSON.parse(clipboardText.trim());
              if (parsedData && parsedData.type === `canvas-clipboard-nodes`) {
                (event.preventDefault(), handlePaste(undefined, undefined, clipboardText.trim()));
                return;
              }
            } catch {}
            (event.preventDefault(), handlePaste());
        };
      return (
        window.addEventListener(`keydown`, handleKeyDown),
        window.addEventListener(`paste`, handlePaste2),
        () => {
          (window.removeEventListener(`keydown`, handleKeyDown),
            window.removeEventListener(`paste`, handlePaste2));
        }
      );
	    }, [$e, redo, handlePaste, copySelectedNodes, groupSelectedNodes, autoLayout, stopGeneration, setNodes, setEdges, menuPosition]);
}
