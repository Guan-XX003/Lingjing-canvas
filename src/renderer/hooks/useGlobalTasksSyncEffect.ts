/**
 * useGlobalTasksSyncEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetAny } from "../lib/app-types";
import { WanJuanTtsMusicTaskAudioUrl } from "../components/audio-nodes";
import { wanjuanClearProjectAssetBindingsFromData } from "../lib/resource";
import { wanjuanNewestNodeTask, wanjuanTaskUsesSeedanceSlot, wanjuanVideoTaskCanAttachToNode, wanjuanVideoTaskMatchesNodeByPrompt } from "../lib/video-task";

interface UseGlobalTasksSyncEffectDeps {
  GlobalTasks: any;
  projectIdRef: Ref;
  resolveWanjuanPlayableTaskUrl: any;
  setNodes: SetAny;
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
  useEffect(() => {
      if (!shouldFitView || !Array.isArray(GlobalTasks) || GlobalTasks.length === 0) return;
      setNodes((nodes2) => {
            let changed = false,
          updatedNodes = nodes2.map((node) => {
            let taskId = node.data?.seedanceTaskId || node.data?.taskId;
            if (!taskId && node.data?.loading && (node.type === `seedanceNode` || node.type === `tongyiWanxiangNode` || node.type === `videoNode`))
              return node;
            let matchedTask = taskId ?
              GlobalTasks.find((task) => task.id === taskId) :
              GlobalTasks
              .filter((task) => task.id && task.nodeId && task.nodeId === node.id)
              .sort((taskB, taskA) => (taskA.createdAt || 0) - (taskB.createdAt || 0))[0];
            let newerNodeTask = wanjuanNewestNodeTask(GlobalTasks, node, projectIdRef.current, matchedTask);
            newerNodeTask && (matchedTask = newerNodeTask);
            let taskWasReset = false;
            if (matchedTask && !wanjuanVideoTaskCanAttachToNode(matchedTask, node, projectIdRef.current))
              ((matchedTask = null), (taskWasReset = true));
            if (!matchedTask && !taskId) {
              let promptText = String(node.data?.prompt || ``).trim();
              matchedTask =
                promptText && !node.data?.videoUrl ?
                GlobalTasks
                .filter((task) => wanjuanVideoTaskMatchesNodeByPrompt(task, node, promptText, projectIdRef.current))
                .sort((taskB, taskA) => (taskA.createdAt || 0) - (taskB.createdAt || 0))[0] :
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
            return JSON.stringify(updatedData) === JSON.stringify(node.data) ?
              node :
              ((changed = true), {
                ...node,
                data: updatedData
              });
          });
        return changed ? updatedNodes : nodes2;
      });
	    }, [shouldFitView, GlobalTasks, setNodes]);
}
