/**
 * saveCanvasState。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Ref, SetAny, Toast } from "../lib/app-types";
declare const chrome: any;

interface UseSaveCanvasStateDeps {
  WanJuanStripRuntimeNodeData: any;
  canvasStateKeyPrefix: any;
  desktopCanvasMirrorPrefix: any;
  edgesRef: Ref;
  externalizeProjectCanvasState: any;
  historyIndexRef: Ref;
  isRestoringRef: Ref;
  localforageModule: any;
  nodesRef: Ref;
  projectIdRef: Ref;
  setHistory: SetAny;
  setHistoryIndex: SetAny;
  shouldFitViewRef: Ref;
  showToast: Toast;
}

export function useSaveCanvasState(deps: UseSaveCanvasStateDeps) {
  const {
    WanJuanStripRuntimeNodeData,
    canvasStateKeyPrefix,
    desktopCanvasMirrorPrefix,
    edgesRef,
    externalizeProjectCanvasState,
    historyIndexRef,
    isRestoringRef,
    localforageModule,
    nodesRef,
    projectIdRef,
    setHistory,
    setHistoryIndex,
    shouldFitViewRef,
    showToast,
  } = deps;
  const saveCanvasState = useCallback(async () => {
	      if (!shouldFitViewRef.current) return;
	      globalThis.__wanjuanLastCanvasActivityAt = Date.now();
	      try {
	        globalThis.__wanjuanProjectSafetyRetryCanvasSave = saveCanvasState;
	      } catch {}
	      let currentProjectId = projectIdRef.current,
	        savedNodes = nodesRef.current,
	        savedEdges = edgesRef.current,
	        storageKey = `${canvasStateKeyPrefix}${currentProjectId}`,
	        canvasState = {
	          nodes: savedNodes
	            .filter((node) => node.id !== `ghost-target`)
	            .map((node) => {
              let nodeData = {
                ...WanJuanStripRuntimeNodeData(node.data || {})
              };
              return (
                Object.keys(nodeData).forEach((key) => {
                  typeof nodeData[key] == `function` && delete nodeData[key];
                }), {
                  ...node,
                  data: nodeData
	                }
	              );
	            }),
	          edges: savedEdges.filter((edge) => edge.id !== `ghost-edge`),
	        };
      if (globalThis.__wanjuanProjectMigrationLocks?.has(currentProjectId)) {
        console.warn(`Canvas save skipped while project migration is active`, currentProjectId);
        return;
      }
      if (globalThis.__wanjuanStorageMaintenanceRunning) {
        console.warn(`Canvas save skipped while storage maintenance is active`, currentProjectId);
        return;
      }
      let mainMigrationLock = await window.wanjuanDesktop?.isProjectMigrationLocked?.({
        projectId: currentProjectId,
        directory: ``,
      });
      if (mainMigrationLock?.locked) {
        console.warn(`Canvas save skipped by main-process migration lock`, currentProjectId);
        return;
      }
      try {
	        (canvasState = await globalThis.prepareProjectMediaStateForPersistence(
	          canvasState,
	          currentProjectId,
	          ``,
	        )),
	        (canvasState = await externalizeProjectCanvasState(canvasState, currentProjectId, {
	          persist: true,
	        }));
	        let safetyResult =
	          globalThis.wanjuanProjectSafety?.beforeCanvasSave ?
	          await globalThis.wanjuanProjectSafety.beforeCanvasSave({
	            projectId: currentProjectId,
	            state: canvasState,
	            previousState: await localforageModule.default.getItem(storageKey),
	          }) :
	          null;
	        if (safetyResult?.block) {
	          console.warn(`Suspicious canvas save blocked`, safetyResult);
	          let promptResult =
	            globalThis.wanjuanProjectSafety?.showBlockedSavePrompt ?
	            globalThis.wanjuanProjectSafety.showBlockedSavePrompt(safetyResult) :
	            null;
	          if (!promptResult?.dismissed) {
	            promptResult ||
	              showToast(safetyResult.message || `已拦截疑似异常保存，上一版画布已保存在安全快照。`);
	            return;
	          }
	        }
          mainMigrationLock = await window.wanjuanDesktop?.isProjectMigrationLocked?.({
            projectId: currentProjectId,
            directory: ``,
          });
          if (mainMigrationLock?.locked) {
            console.warn(`Canvas save cancelled because migration started during persistence`, currentProjectId);
            return;
          }
          if (globalThis.__wanjuanStorageMaintenanceRunning) {
            console.warn(`Canvas save cancelled because storage maintenance started during persistence`, currentProjectId);
            return;
          }
	        await localforageModule.default.setItem(storageKey, canvasState),
          window.wanjuanDesktop?.syncProjectReferences &&
          (await window.wanjuanDesktop.syncProjectReferences({
            projectId: currentProjectId,
            directory: ``,
            references: [...globalThis.collectProjectFileReferences(canvasState)],
            complete: true,
          })),
          typeof chrome < `u` &&
          chrome.storage &&
	          chrome.storage.local &&
	          chrome.storage.local.set({
	            [`${desktopCanvasMirrorPrefix}${currentProjectId}`]: canvasState,
	          });
      } catch (error) {
        console.error(`Save failed`, error);
        if (error.name === `QuotaExceededError` || (error.message && error.message.includes(`quota`))) {
          // localforage(IndexedDB) 配额不足时，兜底写 chrome.storage.local(桌面端为磁盘存储、配额更大)，尽量不丢本次画布
          try {
            typeof chrome < `u` && chrome.storage?.local?.set?.({
              [`${desktopCanvasMirrorPrefix}${currentProjectId}`]: canvasState,
            });
          } catch {}
          globalThis.__wanjuanLastCanvasSaveQuotaError = { projectId: currentProjectId, at: Date.now() };
          showToast(`存储空间不足，无法保存画布。请尝试清理一些不需要的节点或图片。`);
        }
      }
	      isRestoringRef.current ||
	        (setHistory((history2) => {
	            let currentSnapshot = history2[historyIndexRef.current];
	            if (currentSnapshot && currentSnapshot.nodes === savedNodes && currentSnapshot.edges === savedEdges) return history2;
	            let nextHistory = history2.slice(0, historyIndexRef.current + 1);
	            return (
	              nextHistory.push({
	                nodes: savedNodes,
	                edges: savedEdges
	              }),
              nextHistory.length > 15 && nextHistory.shift(),
              nextHistory
            );
          }),
          setHistoryIndex((prevIndex) => {
            let nextIndex = Math.min(prevIndex + 1, 14);
            return ((historyIndexRef.current = nextIndex), nextIndex);
          }));
    }, []);
  return { saveCanvasState };
}
