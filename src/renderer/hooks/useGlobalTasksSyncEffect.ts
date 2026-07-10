/**
 * useGlobalTasksSyncEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { GlobalTask, Ref, SetState, WjNode } from "../lib/app-types";
import { WanJuanTtsMusicTaskAudioUrl } from "../components/audio-nodes";
import { indexGlobalTasks } from "../lib/global-tasks";
import { wanjuanClearProjectAssetBindingsFromData } from "../lib/resource";
import { wanjuanNewestNodeTask, wanjuanTaskUsesSeedanceSlot, wanjuanVideoTaskCanAttachToNode, wanjuanVideoTaskMatchesNodeByPrompt } from "../lib/video-task";

interface UseGlobalTasksSyncEffectDeps {
  GlobalTasks: GlobalTask[];
  projectIdRef: Ref;
  resolveWanjuanPlayableTaskUrl: any;
  setNodes: SetState<WjNode[]>;
  shouldFitView: any;
}

export function useGlobalTasksSyncEffect(deps: UseGlobalTasksSyncEffectDeps) {
  const {
    GlobalTasks,
    projectIdRef,
    resolveWanjuanPlayableTaskUrl,
    setNodes,
    shouldFitView,
  } = deps;
  const taskIndex = useMemo(() => indexGlobalTasks(GlobalTasks), [GlobalTasks]);
  useEffect(() => {
      if (!shouldFitView || !Array.isArray(GlobalTasks) || GlobalTasks.length === 0) return;
      setNodes((nodes2) => {
            let changed = false,
          updatedNodes = nodes2.map((node) => {
            const projectKey = projectIdRef.current || `default`;
            const nodeTasks = taskIndex.byNode.get(`${projectKey}::${node.id}`) || [];
            let taskId = node.data?.seedanceTaskId || node.data?.taskId;
            if (!taskId && node.data?.loading && (node.type === `seedanceNode` || node.type === `tongyiWanxiangNode` || node.type === `videoNode`))
              return node;
            let matchedTask = taskId ? taskIndex.byId.get(taskId) : nodeTasks[0];
            let newerNodeTask = wanjuanNewestNodeTask(nodeTasks, node, projectIdRef.current, matchedTask);
            newerNodeTask && (matchedTask = newerNodeTask);
            let taskWasReset = false;
            if (matchedTask && !wanjuanVideoTaskCanAttachToNode(matchedTask, node, projectIdRef.current))
              ((matchedTask = null), (taskWasReset = true));
            if (!matchedTask && !taskId) {
              let promptText = String(node.data?.prompt || ``).trim();
              matchedTask = promptText && !node.data?.videoUrl ?
                (taskIndex.byPrompt.get(`${projectKey}::${promptText}`) || [])
                  .find((task) => wanjuanVideoTaskMatchesNodeByPrompt(task, node, promptText, projectIdRef.current)) :
                null;
            }
            if (taskWasReset && (node.type === `seedanceNode` || node.type === `tongyiWanxiangNode`)) {
              let updatedData = {
                ...node.data,
                taskId: undefined,
                seedanceTaskId: undefined,
                videoUrl: undefined,
                thumbnailUrl: undefined,
                resultData: undefined,
                loading: false,
                progress: 0,
              };
              return ((changed = true), {
                ...node,
                data: updatedData,
              });
            }
            if (taskWasReset) return node;
            if (!matchedTask) return node;
            if (matchedTask.stoppedByUser) return node;
            let updatedData = {
              ...node.data
            };
            if (wanjuanTaskUsesSeedanceSlot(matchedTask, node))
              ((updatedData.seedanceTaskId = matchedTask.id), (updatedData.taskId = undefined));
            else ((updatedData.taskId = matchedTask.id), (updatedData.seedanceTaskId = undefined));
            matchedTask.provider === `tianji-seedance` && (updatedData.tianjiExecuteId = matchedTask.id);
            if (matchedTask.status === `pending` || matchedTask.status === `running`)
              ((updatedData = wanjuanClearProjectAssetBindingsFromData(updatedData, [`videoUrl`, `thumbnailUrl`, `resultData`])),
                (updatedData.videoUrl = undefined),
                (updatedData.thumbnailUrl = undefined),
                (updatedData.resultData = undefined),
                (updatedData.loading = true),
                (updatedData.progress = matchedTask.progress || updatedData.progress || 0),
                (updatedData.errorMessage = undefined));
            else if (matchedTask.status === `completed`)
              ((updatedData = wanjuanClearProjectAssetBindingsFromData(updatedData, [`videoUrl`, `thumbnailUrl`, `resultData`])),
                (updatedData.resultData = matchedTask.customResultData || updatedData.resultData),
                matchedTask.customOutputType === `text` &&
                (updatedData.text = matchedTask.customResultData || updatedData.text),
                matchedTask.customOutputType === `image` &&
                (updatedData.imageUrl = matchedTask.customResultData || matchedTask.resultUrl || updatedData.imageUrl),
	                (updatedData.videoUrl = resolveWanjuanPlayableTaskUrl(updatedData.videoUrl, matchedTask.resultUrl)),
                matchedTask.customOutputType === `video` &&
                (updatedData.videoUrl = matchedTask.customResultData || updatedData.videoUrl),
                matchedTask.customOutputType === `audio` &&
                (updatedData.audioUrl = WanJuanTtsMusicTaskAudioUrl(matchedTask) || updatedData.audioUrl),
                (updatedData.thumbnailUrl = matchedTask.thumbnailUrl || updatedData.thumbnailUrl),
                (updatedData.loading = false),
                (updatedData.progress = 100),
                (updatedData.errorMessage = undefined));
            else if (matchedTask.status === `failed`)
              ((updatedData.loading = false),
                (updatedData.errorMessage = matchedTask.errorMsg || updatedData.errorMessage || `视频生成失败`));
            let previousData = node.data || {},
              previousKeys = Object.keys(previousData),
              updatedKeys = Object.keys(updatedData),
              sameData = previousKeys.length === updatedKeys.length && updatedKeys.every((key) => Object.is(updatedData[key], previousData[key]));
            return sameData ?
              node :
              ((changed = true), {
                ...node,
                data: updatedData
              });
          });
        return changed ? updatedNodes : nodes2;
      });
	    }, [shouldFitView, GlobalTasks, setNodes, taskIndex]);
}
