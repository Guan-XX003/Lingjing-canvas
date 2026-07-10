import type { GlobalTask } from "./types";

const normalizeTaskText = (value: unknown) =>
  String(value || ``)
    .trim()
    .replace(/\s+/g, ` `)
    .toLowerCase();

const taskOutputType = (task: GlobalTask) =>
  String(task?.customOutputType || task?.type || ``).toLowerCase();

const isCompletedWithResult = (task: GlobalTask) =>
  task?.status === `completed` && !!(task?.resultUrl || task?.customResultData);

const isLocalDiagnosticTask = (task: GlobalTask) =>
  /^video-local-|^image-local-|^custom-/i.test(String(task?.id || ``));

const isMergeableNodeTask = (task: GlobalTask) => {
  if (!task?.id || !task?.nodeId) return false;
  if (isCompletedWithResult(task)) return false;
  let outputType = taskOutputType(task),
    provider = normalizeTaskText(task?.provider),
    modelName = normalizeTaskText(task?.modelName || task?.model);
  return (
    outputType === `video` ||
    outputType === `text` ||
    provider.includes(`seedance`) ||
    provider.includes(`tianji`) ||
    provider.includes(`tongyi`) ||
    /seedance|doubao|wanx|tongyi|qwen|grok|sora|veo/.test(modelName)
  );
};

const nodeTaskMergeKey = (task: GlobalTask) => {
  if (!isMergeableNodeTask(task)) return ``;
  return [
    task?.projectId || `default`,
    task?.nodeId || ``,
    taskOutputType(task) || `task`,
    normalizeTaskText(task?.provider),
    normalizeTaskText(task?.modelName || task?.model),
    normalizeTaskText(task?.prompt),
  ].join(`::`);
};

const taskStatusRank = (task: GlobalTask) => {
  if (isCompletedWithResult(task)) return 7;
  if (task?.stoppedByUser) return 6;
  if (task?.status === `failed`) return 5;
  if (task?.status === `running`) return 4;
  if (task?.status === `pending`) return 3;
  if (task?.status === `completed`) return 2;
  return 1;
};

const isActiveGlobalTask = (task: GlobalTask) =>
  task?.status === `running` || task?.status === `pending`;

const shouldMergeNodeTaskRecords = (previousTask: GlobalTask, nextTask: GlobalTask) => {
  let previousUpdatedAt = Number(previousTask?.updatedAt || previousTask?.createdAt || 0),
    nextUpdatedAt = Number(nextTask?.updatedAt || nextTask?.createdAt || 0),
    previousCreatedAt = Number(previousTask?.createdAt || 0),
    nextCreatedAt = Number(nextTask?.createdAt || 0);
  if (previousTask?.stoppedByUser && isActiveGlobalTask(nextTask) && nextCreatedAt > previousUpdatedAt) return false;
  if (nextTask?.stoppedByUser && isActiveGlobalTask(previousTask) && previousCreatedAt > nextUpdatedAt) return false;
  return true;
};

const mergeTaskRecord = (baseTask: GlobalTask, nextTask: GlobalTask, preserveId = false) => {
  let baseCreatedAt = Number(baseTask?.createdAt || 0),
    nextCreatedAt = Number(nextTask?.createdAt || 0),
    nextWinsStatus =
      taskStatusRank(nextTask) > taskStatusRank(baseTask) ||
      (taskStatusRank(nextTask) === taskStatusRank(baseTask) && nextCreatedAt >= baseCreatedAt),
    statusSource = nextWinsStatus ? nextTask : baseTask,
    resultSource = nextTask?.resultUrl || nextTask?.customResultData ? nextTask : baseTask;
  return {
    ...baseTask,
    ...nextTask,
    ...(preserveId ? { id: baseTask.id } : {}),
    createdAt: baseCreatedAt && nextCreatedAt ? Math.min(baseCreatedAt, nextCreatedAt) : baseTask?.createdAt || nextTask?.createdAt,
    updatedAt:
      Math.max(Number(baseTask?.updatedAt || baseTask?.createdAt || 0), Number(nextTask?.updatedAt || nextTask?.createdAt || 0)) ||
      baseTask?.updatedAt ||
      nextTask?.updatedAt,
    status: statusSource?.status || nextTask?.status || baseTask?.status,
    progress: Math.max(Number(baseTask?.progress || 0), Number(nextTask?.progress || 0)),
    errorMsg: statusSource?.errorMsg || nextTask?.errorMsg || baseTask?.errorMsg,
    stoppedByUser: !!(baseTask?.stoppedByUser || nextTask?.stoppedByUser),
    resultUrl: resultSource?.resultUrl || baseTask?.resultUrl || nextTask?.resultUrl,
    customResultData: resultSource?.customResultData || baseTask?.customResultData || nextTask?.customResultData,
    thumbnailUrl: resultSource?.thumbnailUrl || baseTask?.thumbnailUrl || nextTask?.thumbnailUrl,
    remoteTaskId: baseTask?.remoteTaskId || nextTask?.remoteTaskId,
    seedanceTaskId: baseTask?.seedanceTaskId || nextTask?.seedanceTaskId,
    taskId: baseTask?.taskId || nextTask?.taskId,
  };
};

const mergeDuplicateTaskRecords = (taskList: GlobalTask[]) => {
  let exactTaskMap = new Map<string, GlobalTask>();
  taskList.forEach((task) => {
    if (!task?.id) return;
    let previousTask = exactTaskMap.get(task.id);
    exactTaskMap.set(task.id, previousTask ? mergeTaskRecord(previousTask, task) : task);
  });
  let activeTaskMap = new Map<string, GlobalTask>();
  Array.from(exactTaskMap.values()).forEach((task) => {
    let key = nodeTaskMergeKey(task);
    if (!key) {
      activeTaskMap.set(`id:${task.id}`, task);
      return;
    }
    let previousTask = activeTaskMap.get(key);
    if (!previousTask) {
      activeTaskMap.set(key, task);
      return;
    }
    if (!shouldMergeNodeTaskRecords(previousTask, task)) {
      activeTaskMap.set(`${key}::id:${task.id}`, task);
      return;
    }
    let preferPreviousId =
        !isLocalDiagnosticTask(previousTask) &&
        (isLocalDiagnosticTask(task) || Number(previousTask.createdAt || 0) >= Number(task.createdAt || 0)),
      primaryTask = preferPreviousId ? previousTask : task,
      secondaryTask = preferPreviousId ? task : previousTask;
    activeTaskMap.set(key, mergeTaskRecord(primaryTask, secondaryTask, true));
  });
  return Array.from(activeTaskMap.values());
};

export const compactGlobalTasks = (tasks: GlobalTask[]) => {
  if (!Array.isArray(tasks)) return [];
  let itemB: GlobalTask[] = [],
    seenTaskKeys = new Set<string>(),
    taskCountByKey = new Map<string, number>(),
    isImageTask = (task: GlobalTask) => task?.type === `image` || task?.customOutputType === `image`,
    hasImageOutput = (task: GlobalTask) =>
      !!(task?.remoteTaskId || task?.asyncImageDetailUrl || task?.customResultData || task?.resultUrl),
    registerTask = (task: GlobalTask) => {
      if (!task || !task.id || seenTaskKeys.has(task.id)) return false;
      seenTaskKeys.add(task.id);
      itemB.push(task);
      return true;
    };
  mergeDuplicateTaskRecords(tasks)
    .sort((itemA, itemB) => (itemB?.createdAt || 0) - (itemA?.createdAt || 0))
    .forEach((item) => {
      if (!item || !item.id) return;
      if (!item.nodeId) {
        let existingBoundCount = taskCountByKey.get(`__unbound__`) || 0;
        existingBoundCount < 100 && registerTask(item);
        taskCountByKey.set(`__unbound__`, existingBoundCount + 1);
        return;
      }
      let groupKey = `${item.projectId || `default`}::${item.nodeId}`,
        groupCount = taskCountByKey.get(groupKey) || 0,
        isTaskActive = item.status === `running` || item.status === `pending`,
        shouldKeepTask = isImageTask(item) && hasImageOutput(item);
      if (groupCount < 20 || isTaskActive || shouldKeepTask) {
        if (registerTask(item)) taskCountByKey.set(groupKey, groupCount + 1);
      }
    });
  return itemB.slice(0, 1200).sort((itemA, itemB) => (itemB?.createdAt || 0) - (itemA?.createdAt || 0));
};

export const indexGlobalTasks = (tasks: GlobalTask[]) => {
  const byId = new Map<string, GlobalTask>();
  const byNode = new Map<string, GlobalTask[]>();
  const byPrompt = new Map<string, GlobalTask[]>();
  const projectKey = (task: GlobalTask) => task?.projectId || `default`;
  for (const task of Array.isArray(tasks) ? tasks : []) {
    if (!task?.id) continue;
    byId.set(task.id, task);
    if (task.nodeId) {
      const key = `${projectKey(task)}::${task.nodeId}`;
      const list = byNode.get(key) || [];
      list.push(task);
      byNode.set(key, list);
    }
    const prompt = String(task.prompt || ``).trim();
    if (prompt) {
      const key = `${projectKey(task)}::${prompt}`;
      const list = byPrompt.get(key) || [];
      list.push(task);
      byPrompt.set(key, list);
    }
  }
  const sortNewestFirst = (list: GlobalTask[]) =>
    list.sort((taskA, taskB) =>
      Number(taskB.createdAt || taskB.updatedAt || 0) - Number(taskA.createdAt || taskA.updatedAt || 0),
    );
  byNode.forEach(sortNewestFirst);
  byPrompt.forEach(sortNewestFirst);
  return { byId, byNode, byPrompt };
};
