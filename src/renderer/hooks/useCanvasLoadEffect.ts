/**
 * useCanvasLoadEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetAny } from "../lib/app-types";
import { WANJUAN_STARTER_EDGES, wanjuanIsDefaultStarterCanvas } from "../components/canvas-node-registry";
import { WanJuanTtsMusicTaskAudioUrl } from "../components/audio-nodes";
import { wanjuanClearProjectAssetBindingsFromData } from "../lib/resource";
import { wanjuanNewestNodeTask, wanjuanTaskUsesSeedanceSlot, wanjuanVideoTaskCanAttachToNode, wanjuanVideoTaskMatchesNodeByPrompt } from "../lib/video-task";
declare const chrome: any;

interface UseCanvasLoadEffectDeps {
  GlobalTasks: any;
  LoadOnceRef: Ref;
  abortControllersRef: Ref;
  canvasStateKeyPrefix: any;
  desktopCanvasMirrorPrefix: any;
  hydrateProjectAssetContainer: any;
  initialEmptyProject: any;
  localforageModule: any;
  onInitialEmptyProjectReady: any;
  projectId: any;
  projectIdRef: Ref;
  resolveWanjuanPlayableTaskUrl: any;
  setEdges: SetAny;
  setNodes: SetAny;
  setShouldFitView: SetAny;
  shouldFitViewRef: Ref;
}

export function useCanvasLoadEffect(deps: UseCanvasLoadEffectDeps) {
  const {
    GlobalTasks,
    LoadOnceRef,
    abortControllersRef,
    canvasStateKeyPrefix,
    desktopCanvasMirrorPrefix,
    hydrateProjectAssetContainer,
    initialEmptyProject,
    localforageModule,
    onInitialEmptyProjectReady,
    projectId,
    projectIdRef,
    resolveWanjuanPlayableTaskUrl,
    setEdges,
    setNodes,
    setShouldFitView,
    shouldFitViewRef,
  } = deps;
  useEffect(() => {
      let __wjLoadToken = (globalThis.__wanjuanCanvasLoadToken = (globalThis.__wanjuanCanvasLoadToken || 0) + 1),
        guardedSetNodes = (v) => { (__wjLoadToken === globalThis.__wanjuanCanvasLoadToken) && setNodes(v); },
        guardedSetEdges = (v) => { (__wjLoadToken === globalThis.__wanjuanCanvasLoadToken) && setEdges(v); };
      ((shouldFitViewRef.current = false),
        setShouldFitView(false),
        (async () => {
          let storageKey = `${canvasStateKeyPrefix}${projectId}`;
          if (initialEmptyProject) {
            (guardedSetNodes([]), guardedSetEdges(WANJUAN_STARTER_EDGES));
            try {
              await localforageModule.default.removeItem(storageKey);
              localStorage.removeItem(storageKey);
              typeof chrome < `u` &&
              chrome.storage &&
              chrome.storage.local &&
              chrome.storage.local.remove(`${desktopCanvasMirrorPrefix}${storageKey.slice(canvasStateKeyPrefix.length)}`);
            } catch (error) {
              console.warn(`清理新项目画布缓存失败`, error);
	            } finally {
	              setTimeout(() => {
	                (setShouldFitView(true), (shouldFitViewRef.current = true), (LoadOnceRef.current = true));
	                typeof onInitialEmptyProjectReady == `function` &&
	                  onInitialEmptyProjectReady(projectId);
	              }, 80);
	            }
	            return;
	          }
          try {
            let storedState = await localforageModule.default.getItem(storageKey);
            if (!storedState) {
              let rawValue = localStorage.getItem(storageKey);
              rawValue && ((storedState = JSON.parse(rawValue)), await localforageModule.default.setItem(storageKey, storedState));
            }
            if (
              !storedState &&
              typeof chrome < `u` &&
              chrome.storage &&
              chrome.storage.local
            ) {
              let mirroredState = await new Promise((resolve) => {
                chrome.storage.local.get([`${desktopCanvasMirrorPrefix}${storageKey.slice(canvasStateKeyPrefix.length)}`], (items) =>
                  resolve(items?.[`${desktopCanvasMirrorPrefix}${storageKey.slice(canvasStateKeyPrefix.length)}`]),
                );
              });
              mirroredState && ((storedState = mirroredState), await localforageModule.default.setItem(storageKey, mirroredState));
            }
            if (
              storedState &&
              typeof chrome < `u` &&
              chrome.storage &&
              chrome.storage.local
            )
              chrome.storage.local.set({
                [`${desktopCanvasMirrorPrefix}${storageKey.slice(canvasStateKeyPrefix.length)}`]: storedState,
              });
            if (storedState) {
              let {
                nodes: nodes2,
                edges: edges2
              } = storedState,
              bindingMap = new Map();
              if (Array.isArray(nodes2)) {
                let nodeIdSet = new Set();
                nodes2 = nodes2
                  .filter((node) => {
                    if (!node || typeof node != `object` || !node.id) return false;
                    nodeIdSet.add(node.id);
                    return true;
                  })
                  .map((node, index) => ({
                    ...node,
                    position: {
                      x: Number.isFinite(Number(node.position?.x)) ? Number(node.position.x) : 80 + index * 24,
                      y: Number.isFinite(Number(node.position?.y)) ? Number(node.position.y) : 80 + index * 24,
                    },
                    data: node.data && typeof node.data == `object` ? node.data : {},
                  }));
                Array.isArray(edges2) &&
                  (edges2 = edges2.filter((edge) => edge && typeof edge == `object` && nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)));
              }
              if (Array.isArray(nodes2) && window.wanjuanDesktop?.checkProjectAssets)
                try {
                  let assetPaths = [
                      ...new Set(
                        nodes2.flatMap((node) => globalThis.collectProjectMediaBindingPaths(node)),
                      ),
                    ],
                    checkResult = await window.wanjuanDesktop.checkProjectAssets(assetPaths);
                  Array.isArray(checkResult?.assets) &&
                    (bindingMap = new Map(
                      checkResult.assets.map((asset) => [asset.path, asset.exists !== false]),
                    ));
                } catch (error) {
                  console.warn(`Project asset check skipped`, error);
                }
	                wanjuanIsDefaultStarterCanvas(nodes2, edges2) && ((nodes2 = []), (edges2 = []));
	                (nodes2 && nodes2.length > 0 ?
	                  guardedSetNodes(
	                    await Promise.all(
                      nodes2.map(async (node) => {
                        let hydratedNode = await hydrateProjectAssetContainer(node),
                          taskId = hydratedNode.data?.seedanceTaskId || hydratedNode.data?.taskId;
                        let activeTask = taskId ?
                          (GlobalTasks || []).find((task) => task.id === taskId) :
                          (GlobalTasks || [])
                          .filter((task) => task.id && task.nodeId && task.nodeId === hydratedNode.id)
                          .sort((task, taskA) => (taskA.createdAt || 0) - (task.createdAt || 0))[0];
                        let newerNodeTask = wanjuanNewestNodeTask(GlobalTasks || [], hydratedNode, projectIdRef.current, activeTask);
                        newerNodeTask && (activeTask = newerNodeTask);
                        let invalidVideoTaskBinding = false;
                        if (activeTask && !wanjuanVideoTaskCanAttachToNode(activeTask, hydratedNode, projectIdRef.current))
                          ((activeTask = null), (invalidVideoTaskBinding = true));
                        if (!activeTask && !taskId) {
                          let promptText = String(hydratedNode.data?.prompt || ``).trim();
                          activeTask =
                            promptText && !hydratedNode.data?.videoUrl ?
                            (GlobalTasks || [])
                            .filter((task) => wanjuanVideoTaskMatchesNodeByPrompt(task, hydratedNode, promptText, projectIdRef.current))
                            .sort((taskB, taskA) => (taskA.createdAt || 0) - (taskB.createdAt || 0))[0] :
                            null;
                        }
                        invalidVideoTaskBinding &&
                          (hydratedNode.type === `seedanceNode` || hydratedNode.type === `tongyiWanxiangNode`) &&
	                          (hydratedNode = {
	                            ...hydratedNode,
	                            data: {
	                              ...wanjuanClearProjectAssetBindingsFromData(hydratedNode.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                              taskId: undefined,
	                              seedanceTaskId: undefined,
                              videoUrl: undefined,
                              thumbnailUrl: undefined,
                              resultData: undefined,
                              loading: false,
                              progress: 0,
                            },
                          });
                        if (
                          activeTask &&
                          !activeTask.stoppedByUser &&
                          (activeTask.status === `pending` ||
                            activeTask.status === `running`)
                        )
	                          hydratedNode = {
	                            ...hydratedNode,
	                            data: {
	                              ...wanjuanClearProjectAssetBindingsFromData(hydratedNode.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                              taskId: wanjuanTaskUsesSeedanceSlot(activeTask, hydratedNode) ? undefined : activeTask.id,
	                              seedanceTaskId: wanjuanTaskUsesSeedanceSlot(activeTask, hydratedNode) ? activeTask.id : undefined,
	                              tianjiExecuteId: activeTask.provider === `tianji-seedance` ? activeTask.id : hydratedNode.data.tianjiExecuteId,
	                              videoUrl: undefined,
	                              thumbnailUrl: undefined,
	                              resultData: undefined,
	                              loading: true,
	                              progress: activeTask.progress || hydratedNode.data.progress || 0,
                              errorMessage: undefined,
                            },
                          };
                        else if (activeTask?.status === `completed`)
                          hydratedNode = {
                            ...hydratedNode,
                            data: {
                              ...hydratedNode.data,
                              taskId: wanjuanTaskUsesSeedanceSlot(activeTask, hydratedNode) ? undefined : activeTask.id,
                              seedanceTaskId: wanjuanTaskUsesSeedanceSlot(activeTask, hydratedNode) ? activeTask.id : undefined,
                              tianjiExecuteId: activeTask.provider === `tianji-seedance` ? activeTask.id : hydratedNode.data.tianjiExecuteId,
                              resultData: activeTask.customResultData || hydratedNode.data.resultData,
                              text: activeTask.customOutputType === `text` ?
                                activeTask.customResultData || hydratedNode.data.text :
                                hydratedNode.data.text,
                              imageUrl: activeTask.customOutputType === `image` ?
                                activeTask.customResultData || activeTask.resultUrl || hydratedNode.data.imageUrl :
                                hydratedNode.data.imageUrl,
	                              videoUrl: resolveWanjuanPlayableTaskUrl(hydratedNode.data.videoUrl, activeTask.resultUrl),
                              audioUrl: activeTask.customOutputType === `audio` ?
                                WanJuanTtsMusicTaskAudioUrl(activeTask) || hydratedNode.data.audioUrl :
                                hydratedNode.data.audioUrl,
                              thumbnailUrl: activeTask.thumbnailUrl || hydratedNode.data.thumbnailUrl,
                              loading: false,
                              progress: 100,
                              errorMessage: undefined,
                            },
                          };
                        else if (activeTask?.status === `failed`)
                          hydratedNode = {
                            ...hydratedNode,
                            data: {
                              ...hydratedNode.data,
                              taskId: wanjuanTaskUsesSeedanceSlot(activeTask, hydratedNode) ? undefined : activeTask.id,
                              seedanceTaskId: wanjuanTaskUsesSeedanceSlot(activeTask, hydratedNode) ? activeTask.id : undefined,
                              tianjiExecuteId: activeTask.provider === `tianji-seedance` ? activeTask.id : hydratedNode.data.tianjiExecuteId,
                              loading: false,
                              errorMessage: activeTask.errorMsg ||
                                hydratedNode.data.errorMessage ||
                                `视频生成失败`,
                            },
                          };
                        hydratedNode.data?.loading &&
                          !activeTask &&
                          !LoadOnceRef.current &&
                          !abortControllersRef.current.has(hydratedNode.id) &&
	                          (hydratedNode = {
	                            ...hydratedNode,
	                            data: {
	                              ...wanjuanClearProjectAssetBindingsFromData(hydratedNode.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
	                              loading: false,
	                              errorMessage: hydratedNode.data.errorMessage ||
                                `任务状态待确认，请在任务清单刷新或重新生成`,
                            },
                          });
                        hydratedNode = globalThis.applyProjectMediaBindingsToNode(hydratedNode, bindingMap);
                        return hydratedNode;
                      }),
                    ),
	                  ) :
                  guardedSetNodes([]),
	                  edges2 && guardedSetEdges(edges2));
	            } else(guardedSetNodes([]), guardedSetEdges(WANJUAN_STARTER_EDGES));
	          } catch (error) {
            (console.error(`Failed to load canvas state`, error), guardedSetNodes([]), guardedSetEdges(WANJUAN_STARTER_EDGES));
	          } finally {
            setTimeout(() => {
              (setShouldFitView(true), (shouldFitViewRef.current = true), (LoadOnceRef.current = true));
            }, 300);
          }
        })());
	    }, [projectId, setNodes, setEdges, initialEmptyProject]);
}
