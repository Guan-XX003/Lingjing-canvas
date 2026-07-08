// @ts-nocheck
/**
 * refreshGlobalTask。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig, Bindings, Toast } from "../lib/app-types";
import { WanJuanSunoHeaders, WanJuanSunoTaskFailed, WanJuanSunoTaskSucceeded, WanJuanTtsMusicApiUrl, WanJuanTtsMusicExtractAudio, WanJuanTtsMusicExtractClipId, WanJuanTtsMusicExtractTaskId, WanJuanTtsMusicTaskAudioUrl } from "../components/audio-nodes";
import { wanjuanClearProjectAssetBindingsFromData } from "../lib/resource";
import { wanjuanGetSyncedTianjiSeedanceConfig, wanjuanTianjiErrorMessage, wanjuanTianjiFindProgress, wanjuanTianjiFindThumbUrl, wanjuanTianjiFindVideoUrl, wanjuanTianjiRequest, wanjuanTianjiStatus } from "../lib/tianji-api";
import { wanjuanTaskUsesSeedanceSlot } from "../lib/video-task";
declare const chrome: any;

interface UseRefreshGlobalTaskDeps {
  Send: any;
  addResource: any;
  apiConfigs: ApiConfig[];
  audioApiKey: any;
  audioApiUrl: any;
  imageApiKey: any;
  imageApiUrl: any;
  imageModelApiBindings: Bindings;
  showToast2: Toast;
  updateGlobalTasks: any;
  videoApiKey: any;
  videoApiUrl: any;
  videoModelApiBindings: Bindings;
  globalTasks: any;
}

export function use_refreshGlobalTask(deps: UseRefreshGlobalTaskDeps) {
  const {
    Send,
    addResource,
    apiConfigs,
    audioApiKey,
    audioApiUrl,
    imageApiKey,
    imageApiUrl,
    imageModelApiBindings,
    showToast2,
    updateGlobalTasks,
    videoApiKey,
    videoApiUrl,
    videoModelApiBindings,
    globalTasks,
  } = deps;
  const refreshGlobalTask = async (task, manualRefreshOptions = {}) => {
	                let notify = manualRefreshOptions?.silent === true ? () => {} : showToast2;
	                try {
                    if (task.type === `audio` || task.customOutputType === `audio`) {
                      let audioUrl = WanJuanTtsMusicTaskAudioUrl(task);
                      if (audioUrl) {
                        (updateGlobalTasks((tasks) =>
                            tasks.map((task2) =>
                              task2.id === task.id ?
                              {
                                ...task2,
                                status: `completed`,
                                progress: 100,
                                customOutputType: `audio`,
                                resultUrl: audioUrl,
                                errorMsg: undefined,
                              } :
                              task2,
                            ),
                          ),
                          task.nodeId &&
                          Send((nodes) =>
                            nodes.map((node) =>
                              node.id === task.nodeId ?
                              {
                                ...node,
                                data: {
                                  ...node.data,
                                  audioUrl,
                                  audioName: node.data?.audioName || task.audioName || task.title || `音频结果`,
                                  resultData: task.customResultData || node.data?.resultData,
                                  text: audioUrl,
                                  loading: false,
                                  progress: 100,
                                  errorMessage: undefined,
                                },
                              } :
                              node,
                            ),
                          ),
                          addResource(audioUrl, `audio`, task.provider === `suno` ? `suno` : `generated`),
                          notify(`音频结果已同步到节点`));
                        return;
                      }
                      if (task.remoteTaskId && !task.stoppedByUser) {
                        let taskModelName = String(task.modelName || task.model || ``).trim(),
                          taskProvider = String(task.provider || ``).toLowerCase(),
                          looksLikeSunoTask =
                          taskProvider === `suno` ||
                          /suno|music|song|lyrics|concat/i.test(`${taskModelName} ${task.requestProfile?.requestType || ``} ${task.requestProfile?.pollPath || ``}`) ||
                          !!task.remoteTaskId,
                          matchedAudioConfig =
                          (task.apiConfigId && apiConfigs.find((config) => config.id === task.apiConfigId)) ||
                          (task.apiBaseUrl && apiConfigs.find((config) => String(config.url || ``).replace(/\/$/, ``) === String(task.apiBaseUrl || ``).replace(/\/$/, ``))) ||
                          apiConfigs.find((config) => /zhichuang|智创|聚合|suno|lconai/i.test(`${config?.id || ``} ${config?.name || ``} ${config?.url || ``}`)) ||
                          apiConfigs.find((config) => config?.id === `default`) ||
                          null,
                          sunoApiUrl = task.apiBaseUrl || matchedAudioConfig?.url || audioApiUrl,
                          sunoApiKey = matchedAudioConfig?.key || audioApiKey;
                        if (looksLikeSunoTask && sunoApiUrl && sunoApiKey) {
                          let response = await fetch(WanJuanTtsMusicApiUrl(sunoApiUrl, `/suno/fetch/${encodeURIComponent(task.remoteTaskId)}`), {
                            method: `GET`,
                            headers: WanJuanSunoHeaders(sunoApiKey, false)
                          });
                          if (!response.ok) {
                            let errorText = await response.text().catch(() => response.statusText);
                            throw Error(errorText || `Suno 查询失败: ${response.status}`);
                          }
                          let responseText = await response.text().catch(() => ``),
                            payload;
                          try {
                            payload = responseText ? JSON.parse(responseText) : {};
                          } catch {
                            payload = responseText;
                          }
                          let refreshedAudioUrl = WanJuanTtsMusicExtractAudio(payload),
                            refreshedTaskId = WanJuanTtsMusicExtractTaskId(payload) || task.remoteTaskId,
                            refreshedClipId = WanJuanTtsMusicExtractClipId(payload) || task.clipId,
                            refreshedResultData = typeof payload == `string` ? payload : JSON.stringify(payload, null, 2),
                            failed = WanJuanSunoTaskFailed(payload),
                            completed = WanJuanSunoTaskSucceeded(payload),
                            matchesTaskNode = (node) =>
                            node.id === task.nodeId ||
                            node.data?.taskId === task.id ||
                            (task.remoteTaskId && node.data?.remoteTaskId === task.remoteTaskId) ||
                            (refreshedTaskId && node.data?.remoteTaskId === refreshedTaskId);
                          if (failed) throw Error(payload?.data?.fail_reason || payload?.fail_reason || payload?.message || `Suno 任务失败`);
                          if (refreshedAudioUrl) {
                            (updateGlobalTasks((tasks) =>
                                tasks.map((task2) =>
                                  task2.id === task.id ?
                                  {
                                    ...task2,
                                    status: `completed`,
                                    progress: 100,
                                    customOutputType: `audio`,
                                    customResultData: refreshedResultData,
                                    resultUrl: refreshedAudioUrl,
                                    remoteTaskId: refreshedTaskId,
                                    clipId: refreshedClipId,
                                    errorMsg: undefined,
                                  } :
                                  task2,
                                ),
                              ),
                              Send((nodes) =>
                                nodes.map((node) =>
                                  matchesTaskNode(node) ?
                                  {
                                    ...node,
                                    data: {
                                      ...node.data,
                                      audioUrl: refreshedAudioUrl,
                                      audioName: node.data?.audioName || task.audioName || task.title || `Suno 音乐.mp3`,
                                      resultData: refreshedResultData,
                                      text: refreshedAudioUrl,
                                      remoteTaskId: refreshedTaskId,
                                      clipId: refreshedClipId,
                                      loading: false,
                                      progress: 100,
                                      errorMessage: undefined,
                                    },
                                  } :
                                  node,
                                ),
                              ),
                              addResource(refreshedAudioUrl, `audio`, task.provider === `suno` ? `suno` : `generated`),
                              notify(`Suno 音频结果已同步到节点`));
                            return;
                          }
                          if (completed) {
                            updateGlobalTasks((tasks) =>
                              tasks.map((task2) =>
                                task2.id === task.id ?
                                {
                                  ...task2,
                                  status: `running`,
                                  progress: Math.max(task2.progress || 0, 98),
                                  customOutputType: `audio`,
                                  customResultData: refreshedResultData,
                                  remoteTaskId: refreshedTaskId,
                                  clipId: refreshedClipId,
                                  errorMsg: `Suno 已完成，音频地址还未返回，稍后再刷新`,
                                } :
                                task2,
                              ),
                            );
                            Send((nodes) =>
                              nodes.map((node) =>
                                matchesTaskNode(node) ?
                                {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    loading: true,
                                    resultData: refreshedResultData,
                                    remoteTaskId: refreshedTaskId,
                                    clipId: refreshedClipId,
                                    errorMessage: `Suno 任务已完成，等待音频地址...`,
                                  },
                                } :
                                node,
                              ),
                            );
                            notify(`Suno 已完成，但音频地址还未返回，请稍后刷新`);
                            return;
                          }
                          updateGlobalTasks((tasks) =>
                            tasks.map((task2) =>
                              task2.id === task.id ?
                              {
                                ...task2,
                                status: `running`,
                                progress: Math.max(task2.progress || 0, 10),
                                customOutputType: `audio`,
                                customResultData: refreshedResultData,
                                remoteTaskId: refreshedTaskId,
                                clipId: refreshedClipId,
                                errorMsg: undefined,
                              } :
                              task2,
                            ),
                          );
                          notify(`Suno 任务仍在生成中`);
                          return;
                        }
                      }
                      notify(task.status === `completed` ? `音频任务已完成，但任务记录里没有可播放的音频地址` : `音频任务还没有可播放结果`);
                      return;
                    }
                    if (task.type === `image` || task.customOutputType === `image`) {
                      let findImageTaskUrl = ((value) => {
                          if (!value) return ``;
                          if (typeof value == `string`) {
                            let cleaned = value.replace(/[`\s]/g, ``);
                            if (/^data:image\//i.test(cleaned)) return cleaned;
                            if (/^https?:\/\//i.test(cleaned) && (/\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(cleaned) || /oss|cos|cdn|image|img|file|tmpfiles/i.test(cleaned))) return cleaned;
                            try {
                              let parsed = JSON.parse(value),
                                imageUrl = findImageTaskUrl(parsed);
                              if (imageUrl) return imageUrl;
                            } catch {}
                            let urlMatches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
                            for (let url of urlMatches) {
                              let cleaned2 = url.replace(/[`\s]/g, ``);
                              if (/\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(cleaned2) || /oss|cos|cdn|image|img|file|tmpfiles/i.test(cleaned2)) return cleaned2;
                            }
                            return ``;
                          }
                          if (Array.isArray(value)) {
                            for (let value2 of value) {
                              let imageUrl = findImageTaskUrl(value2);
                              if (imageUrl) return imageUrl;
                            }
                            return ``;
                          }
                          if (typeof value == `object`) {
                            let urlKeys = [
                              `download_url`,
                              `downloadUrl`,
                              `original_url`,
                              `originalUrl`,
                              `origin_url`,
                              `originUrl`,
                              `large_image_url`,
                              `largeImageUrl`,
                              `result_url`,
                              `resultUrl`,
                              `output_url`,
                              `outputUrl`,
                              `image_url`,
                              `imageUrl`,
                              `b64_json`,
                              `url`,
                            ];
                            for (let key of urlKeys) {
                              let imageUrl = findImageTaskUrl(key === `b64_json` && value[key] ? `data:image/png;base64,${value[key]}` : value[key]);
                              if (imageUrl) return imageUrl;
                            }
	                            for (let [key, value2] of Object.entries(value)) {
	                              if ([`urls`, `url_list`, `reference`, `references`, `input`, `inputs`, `request`, `params`, `payload`, `prompt`, `thumbnail`, `thumbnail_url`, `thumbnailUrl`, `preview`, `preview_url`, `previewUrl`, `cover`, `cover_url`, `coverUrl`].includes(String(key).toLowerCase()))
	                                continue;
	                              let imageUrl = findImageTaskUrl(value2);
	                              if (imageUrl) return imageUrl;
	                            }
	                          }
	                          return ``;
	                        }),
	                        manualImageValue = String(manualRefreshOptions?.manualImageValue || ``).trim(),
	                        manualDirectImageUrl = manualImageValue.replace(/[`\s]/g, ``),
	                        manualImageUrl = manualImageValue ?
	                        (/^(https?:|data:image\/)/i.test(manualDirectImageUrl) ?
	                          manualDirectImageUrl :
	                          findImageTaskUrl(manualImageValue)) :
	                        ``,
	                        existingImageUrl = findImageTaskUrl(task.customResultData || task.resultUrl);
		                      if (manualImageValue) {
		                        if (manualImageUrl) {
		                          try {
		                            (globalThis.__wanjuanManualRecoveredImageTaskIds ||= new Set()).add(task.id);
		                          } catch {}
		                          (updateGlobalTasks((tasks) =>
		                              tasks.map((task2) =>
		                                task2.id === task.id ?
		                                {
		                                  ...task2,
		                                  status: `completed`,
		                                  progress: 100,
		                                  customOutputType: `image`,
		                                  customResultData: manualImageUrl,
		                                  resultUrl: manualImageUrl,
		                                  errorMsg: undefined,
		                                } :
		                                task2,
		                              ),
		                            ),
		                            Send((nodes) =>
		                              nodes.map((node) =>
		                                node.id === task.nodeId ?
		                                {
		                                  ...node,
		                                  data: {
		                                    ...node.data,
		                                    imageUrl: manualImageUrl,
		                                    loading: false,
		                                    progress: 100,
		                                    errorMessage: undefined,
		                                  },
		                                } :
		                                node,
		                              ),
		                            ),
		                            addResource(manualImageUrl, `image`, `generated`),
		                            notify(`图片结果已手动拉回`));
		                          return;
		                        }
		                        (updateGlobalTasks((tasks) =>
		                            tasks.map((task2) =>
		                              task2.id === task.id ?
		                              {
		                                ...task2,
		                                remoteTaskId: manualImageValue,
		                                errorMsg: `已保存远端任务 ID，可点击刷新尝试查询；如果接口不支持查询，请再次点“拉回”粘贴结果 URL。`,
		                              } :
		                              task2,
		                            ),
		                          ),
		                          notify(`已保存远端任务 ID`));
		                        return;
		                      }
		                      if (existingImageUrl) {
		                        (updateGlobalTasks((tasks) =>
		                            tasks.map((task2) =>
	                              task2.id === task.id ?
                          {
                            ...task2,
                            status: `completed`,
                            progress: 100,
                            customOutputType: `image`,
                            customResultData: existingImageUrl,
                            resultUrl: existingImageUrl,
                            errorMsg: undefined,
                          } :
                          task2,
                        ),
                      ),
                      task.nodeId &&
                      Send((nodes) =>
                        nodes.map((node) =>
                          node.id === task.nodeId ?
                          {
                            ...node,
                            data: {
                              ...node.data,
                              taskId: task.id,
                              seedanceTaskId: undefined,
                              imageUrl: existingImageUrl,
                              loading: false,
                              progress: 100,
                              errorMessage: undefined,
                            },
                          } :
                          node,
                        ),
                      ),
                      addResource(existingImageUrl, `image`, `generated`),
		                          notify(`图片结果已同步到节点`));
	                        return;
	                      }
	                      if (!task.remoteTaskId && typeof chrome < `u` && chrome.storage?.local) {
	                        let storedTasks = await new Promise((resolve) => {
	                          try {
	                            chrome.storage.local.get([`globalTasks`], (result) => resolve(result?.globalTasks || []));
	                          } catch {
	                            resolve([]);
	                          }
	                        }),
	                          existingTask = Array.isArray(storedTasks) ?
	                          storedTasks
	                          .filter((task2) =>
	                            task2 &&
	                            task2.id !== task.id &&
	                            task2.nodeId === task.nodeId &&
	                            (task2.projectId || `default`) === (task.projectId || `default`) &&
	                            (task2.type === `image` || task2.customOutputType === `image`) &&
	                            task2.remoteTaskId,
	                          )
	                          .sort((taskA, taskB) => (taskB?.createdAt || 0) - (taskA?.createdAt || 0))[0] :
	                          null;
	                        existingTask &&
	                          (task = {
	                            ...existingTask,
	                            ...task,
	                            remoteTaskId: existingTask.remoteTaskId,
	                            asyncImageDetailUrl: existingTask.asyncImageDetailUrl || task.asyncImageDetailUrl,
	                            apiBaseUrl: task.apiBaseUrl || existingTask.apiBaseUrl,
	                            apiConfigId: task.apiConfigId || existingTask.apiConfigId,
	                            modelName: task.modelName || existingTask.modelName,
	                            requestProfile: task.requestProfile || existingTask.requestProfile,
	                          });
	                      }
	                      let imageTaskConfig =
	                          task.apiConfigId ?
	                          apiConfigs.find((apiConfig) => apiConfig.id === task.apiConfigId) :
                          task.modelName && imageModelApiBindings?.[task.modelName] ?
                          apiConfigs.find((apiConfig) => apiConfig.id === imageModelApiBindings[task.modelName]) :
                          null,
                        normalizeImageBaseUrl = (url) => String(url || ``).replace(/\s+/g, ``).replace(/\/+$/, ``).toLowerCase(),
                        imageBaseMatchedConfig = task.apiBaseUrl ?
                        apiConfigs.find((apiConfig) => normalizeImageBaseUrl(apiConfig.url) === normalizeImageBaseUrl(task.apiBaseUrl)) :
                        null,
                        imageTaskKey = imageTaskConfig?.key || imageBaseMatchedConfig?.key || imageApiKey,
                        imageTaskBaseUrl = (task.apiBaseUrl || imageTaskConfig?.url || imageBaseMatchedConfig?.url || imageApiUrl || ``).replace(/\s+/g, ``).replace(/\/$/, ``),
                        imageRequestProfile = task.requestProfile || {},
                        isAsyncImageTask =
                        imageRequestProfile.requestType === `gpt-image-2-async` ||
                        task.remoteTaskId ||
                        /\/api\/async\/image_gpt/i.test(imageTaskBaseUrl);
	                      if (isAsyncImageTask) {
	                        if (!task.remoteTaskId) {
	                          if (task.status === `running` || task.status === `pending`) {
		                            notify(`图片任务正在提交或自动生成中，远端任务ID返回后可手动刷新`);
	                            return;
	                          }
		                          notify(`这个旧图片任务没有远端任务ID，无法手动拉回；请重新生成一次`);
	                          return;
	                        }
                        let imageDetailUrl =
                          task.asyncImageDetailUrl ||
                          (/\/api\/async\/image_gpt$/i.test(imageTaskBaseUrl) ?
                            imageTaskBaseUrl.replace(/\/api\/async\/image_gpt$/i, `/api/async/detail`) :
                            `${imageTaskBaseUrl}/api/async/detail`),
                          imageQueryUrl = `${imageDetailUrl}?key=${encodeURIComponent(imageTaskKey)}&id=${encodeURIComponent(task.remoteTaskId)}`,
                          response = await fetch(imageQueryUrl, {
                            method: `GET`,
                            headers: {
                              Authorization: imageTaskKey,
                              "Content-Type": `application/json`,
                            },
                          });
                        if (!response.ok) {
	                          notify(`图片刷新失败: ${response.status}`);
                          return;
                        }
                        let result = await response.json(),
                          status = Number(result.data?.status ?? result.status ?? 0),
                          imageUrl = findImageTaskUrl(result.data || result);
                        if (result.code && result.code !== 200) {
	                          notify(result.msg || `图片刷新失败`);
                          return;
                        }
                        if (imageUrl || status === 2) {
                          if (!imageUrl) {
	                            notify(`图片任务已完成，但接口没有返回图片地址`);
                            return;
                          }
                          (updateGlobalTasks((tasks) =>
                              tasks.map((task2) =>
                                task2.id === task.id ?
                                {
                                  ...task2,
                                  status: `completed`,
                                  progress: 100,
                                  customOutputType: `image`,
                                  customResultData: imageUrl,
                                  resultUrl: imageUrl,
                                  errorMsg: undefined,
                                } :
                                task2,
                              ),
                            ),
                            task.nodeId &&
                            Send((nodes) =>
                              nodes.map((node) =>
                                node.id === task.nodeId ?
                                {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    taskId: task.id,
                                    seedanceTaskId: undefined,
                                    imageUrl: imageUrl,
                                    loading: false,
                                    progress: 100,
                                    errorMessage: undefined,
                                  },
                                } :
                                node,
                              ),
                            ),
                            addResource(imageUrl, `image`, `generated`),
	                            notify(`图片任务已完成，结果已拉回`));
                          return;
                        }
                        if (status === 3) {
                          updateGlobalTasks((tasks) =>
                            tasks.map((task2) =>
                              task2.id === task.id ?
                              {
                                ...task2,
                                status: `failed`,
                                errorMsg: result.data?.message || result.msg || `图片生成失败`,
                              } :
                              task2,
                            ),
                          );
	                          notify(result.data?.message || result.msg || `图片生成失败`);
                          return;
                        }
                        (updateGlobalTasks((tasks) =>
                            tasks.map((task2) =>
                              task2.id === task.id ?
                              {
                                ...task2,
                                status: `running`,
                                progress: task2.progress || task.progress || 0,
                              } :
                              task2,
                            ),
                          ),
	                          notify(`图片任务仍在生成中`));
                        return;
                      }
		                      notify(task.status === `running` || task.status === `pending` ? `图片任务正在自动生成中，请等待节点自动返回结果` : task.status === `completed` ? `图片任务已完成，但任务记录里没有图片地址` : `图片任务没有可手动查询的远端任务ID，请等待节点自动完成或重新生成`);
	                      return;
                    }
                    if (task.provider === `tianji-seedance`) {
                      let config = await wanjuanGetSyncedTianjiSeedanceConfig(),
                        result = await wanjuanTianjiRequest(config, `/api/cut/model/coze-run-seedance-special-history`, {
                          method: `GET`,
                          query: {
                            execute_id: task.id
                          },
                        }),
                        status = wanjuanTianjiStatus(result),
                        videoUrl = wanjuanTianjiFindVideoUrl(result),
                        thumbUrl = wanjuanTianjiFindThumbUrl(result),
                        progress = wanjuanTianjiFindProgress(result);
                      if ([`succeeded`, `completed`, `complete`, `success`, `done`].includes(status) || videoUrl) {
                        if (!videoUrl) {
                          notify(`即梦天玑任务已完成，但接口没有返回视频地址`);
                          return;
                        }
                        (updateGlobalTasks((tasks) =>
                            tasks.map((taskItem) =>
                              taskItem.id === task.id ?
                              {
                                ...taskItem,
                                status: `completed`,
                                progress: 100,
                                resultUrl: videoUrl,
                                thumbnailUrl: thumbUrl,
                              } :
                              taskItem,
                            ),
                          ),
                          task.nodeId &&
                          setNodes((nodes) =>
                            nodes.map((node) =>
                              node.id === task.nodeId ?
                              {
                                ...node,
                                data: {
                                  ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
                                  taskId: undefined,
                                  seedanceTaskId: task.id,
                                  tianjiExecuteId: task.id,
                                  videoUrl: videoUrl,
                                  thumbnailUrl: thumbUrl,
                                  loading: false,
                                  progress: 100,
                                  errorMessage: undefined,
                                  loadingText: undefined,
                                },
                              } :
                              node,
                            ),
                          ),
                          addResource(videoUrl, `video`, `generated`),
                          notify(`即梦天玑任务已完成，结果已拉回`));
                        return;
                      }
                      if ([`failed`, `fail`, `error`, `expired`, `canceled`, `cancelled`, `rejected`].includes(status)) {
                        let message = wanjuanTianjiErrorMessage(result);
                        (updateGlobalTasks((tasks) =>
                            tasks.map((taskItem) =>
                              taskItem.id === task.id ?
                              {
                                ...taskItem,
                                status: `failed`,
                                errorMsg: message,
                              } :
                              taskItem,
                            ),
                          ),
                          notify(message));
                        return;
                      }
                      (updateGlobalTasks((tasks) =>
                          tasks.map((taskItem) =>
                            taskItem.id === task.id ?
                            {
                              ...taskItem,
                              status: `running`,
                              progress: isNaN(progress) ? taskItem.progress || 0 : Math.min(99, Math.max(0, progress)),
                            } :
                            taskItem,
                          ),
                        ),
                        notify(`即梦天玑任务仍在生成中`));
                      return;
                    }
                    let requestProfile = task.requestProfile || {},
                      buildApiUrl = (baseUrl, path) => {
                        let base = String(baseUrl || ``).replace(/\/$/, ``),
                          path2 = String(path || ``).trim();
                        return path2 ?
                          /^https?:\/\//i.test(path2) ?
                          path2 :
                          `${base}/${path2.replace(/^\/+/, ``)}` :
                          base;
                      },
                      taskIdForRequest = task.id,
                      replaceTaskPath = (pathTemplate, taskId) => {
                        let taskUrlTemplate = String(pathTemplate || `/v1/videos/{taskId}`);
                        return /\{(?:taskId|task_id|video_id|id)\}/.test(taskUrlTemplate) ?
                          taskUrlTemplate.replace(/\{(?:taskId|task_id|video_id|id)\}/g, taskId) :
                          `${taskUrlTemplate.replace(/\/$/, ``)}/${taskId}`;
                      },
                      isSeedanceTask =
                      task.provider === `seedance` ||
                      requestProfile.requestType === `seedance-json` ||
                      /^task-|^cgt-/.test(task.id || ``),
                      seedanceConfig = apiConfigs.find(
                        (apiConfig) =>
                        apiConfig.id === `volcengine-ark` ||
                        /ark\.cn-beijing\.volces\.com/.test(apiConfig.url || ``),
                      ),
                      videoTaskConfig =
                      task.apiConfigId ?
                      apiConfigs.find((apiConfig) => apiConfig.id === task.apiConfigId) :
                      task.modelName && videoModelApiBindings?.[task.modelName] ?
                      apiConfigs.find((apiConfig) => apiConfig.id === videoModelApiBindings[task.modelName]) :
                      null,
                      normalizeApiBaseUrl = (baseUrl) => String(baseUrl || ``).replace(/\s+/g, ``).replace(/\/+$/, ``).toLowerCase(),
                      apiBaseMatchedConfig = task.apiBaseUrl ?
                      apiConfigs.find((apiConfig) => normalizeApiBaseUrl(apiConfig.url) === normalizeApiBaseUrl(task.apiBaseUrl)) :
                      null,
                      baseUrl = isSeedanceTask ?
                      (task.apiBaseUrl ||
                        videoTaskConfig?.url ||
                        apiBaseMatchedConfig?.url ||
                        seedanceConfig?.url ||
                        ``).replace(/\s+/g, ``).replace(/\/$/, ``) :
                      (task.apiBaseUrl || videoTaskConfig?.url || apiBaseMatchedConfig?.url || videoApiUrl).replace(/\s+/g, ``).replace(/\/$/, ``),
                      taskBaseUrlForRequest = baseUrl,
                      isXpclawSoraCompatTask = !isSeedanceTask &&
                      /^grok-video/i.test(task.modelName || ``) &&
                      /xpclaw\.ai/i.test(baseUrl),
                      contentPathTemplate =
                      requestProfile.contentPath ||
                      (isXpclawSoraCompatTask ? `/v1/videos/{taskId}/content` : ``),
                      taskKey = isSeedanceTask ?
                      videoTaskConfig?.key || apiBaseMatchedConfig?.key || seedanceConfig?.key || videoApiKey :
                      videoTaskConfig?.key || apiBaseMatchedConfig?.key || videoApiKey,
                      response = await fetch(
                        isSeedanceTask ?
                        `${baseUrl}/contents/generations/tasks/${task.id}` :
                        buildApiUrl(
                          baseUrl,
                          replaceTaskPath(requestProfile.pollPath, task.id),
                        ), {
                          headers: {
                            Authorization: `Bearer ${taskKey}`
                          },
                        },
                      );
                    if (response.ok) {
                      let data = await response.json(),
                        isCompleted = false,
                        status = task.status,
                        progress = task.progress,
                        errorMsg = task.errorMsg,
                        resultUrl = task.resultUrl,
                        thumbnailUrl = task.thumbnailUrl;
	                      if (isSeedanceTask) {
	                        let seedanceItems = Array.isArray(data.items) ?
	                            data.items :
	                            Array.isArray(data.data?.items) ?
	                            data.data.items :
	                            Array.isArray(data.output?.items) ?
	                            data.output.items :
	                            Array.isArray(data.result?.items) ?
	                            data.result.items :
	                            null,
	                          seedanceItem = Array.isArray(seedanceItems) ?
	                            seedanceItems.find(
	                              (item) =>
	                              item &&
	                              typeof item == `object` &&
	                              (item.status || item.content || item.video_url || item.videoUrl || item.error || item.progress !== undefined),
	                            ) || seedanceItems[0] :
	                            null,
	                          seedanceItemError = seedanceItem?.error,
	                          seedanceItemErrorMessage =
	                          typeof seedanceItemError == `string` ?
	                          seedanceItemError :
	                          seedanceItemError?.message ||
	                          seedanceItemError?.detail ||
	                          seedanceItemError?.code ||
	                          ``,
	                          status2 = String(
	                            seedanceItem?.status ||
	                            (seedanceItem?.error ? `failed` : ``) ||
	                            data.status ||
	                            data.data?.status ||
	                            data.task?.status ||
	                            data.content?.status ||
	                            ``,
	                          ).toLowerCase(),
                          extractUrl = (value) =>
                          typeof value == `string` ?
                          value.replace(/[`\s]/g, ``) :
                          value && typeof value == `object` && typeof value.url == `string` ?
                          value.url.replace(/[`\s]/g, ``) :
                          ``,
	                          videoUrl = extractUrl(
	                            seedanceItem?.content?.video_url ||
	                            seedanceItem?.content?.videoUrl ||
	                            seedanceItem?.content?.[0]?.video_url ||
	                            seedanceItem?.content?.[0]?.videoUrl ||
	                            seedanceItem?.content?.[0]?.url ||
	                            seedanceItem?.video_url ||
	                            seedanceItem?.videoUrl ||
	                            seedanceItem?.url ||
	                            data.content?.video_url ||
	                            data.content?.videoUrl ||
                            data.output?.video_url ||
                            data.output?.videoUrl ||
                            data.data?.video_url ||
                            data.data?.videoUrl ||
                            data.data?.content?.video_url ||
                            data.data?.output?.video_url ||
                            data.result?.video_url ||
                            data.result?.videoUrl ||
                            data.video_url ||
                            data.videoUrl ||
                            data.url,
                          ),
	                          thumbnailUrl2 = extractUrl(
	                            seedanceItem?.content?.last_frame_url ||
	                            seedanceItem?.content?.lastFrameUrl ||
	                            seedanceItem?.content?.thumbnail_url ||
	                            seedanceItem?.content?.[0]?.last_frame_url ||
	                            seedanceItem?.content?.[0]?.lastFrameUrl ||
	                            seedanceItem?.content?.[0]?.thumbnail_url ||
	                            seedanceItem?.last_frame_url ||
	                            seedanceItem?.thumbnail_url ||
	                            seedanceItem?.cover_url ||
	                            data.content?.last_frame_url ||
	                            data.content?.lastFrameUrl ||
                            data.content?.thumbnail_url ||
                            data.output?.last_frame_url ||
                            data.output?.thumbnail_url ||
                            data.data?.last_frame_url ||
                            data.data?.thumbnail_url ||
                            data.data?.content?.last_frame_url ||
                            data.data?.output?.last_frame_url ||
                            data.result?.last_frame_url ||
                            data.result?.thumbnail_url ||
                            data.thumbnail_url ||
                            data.cover_url,
                          );
                        if (
                          !videoUrl &&
                          [
                            `succeeded`,
                            `completed`,
                            `complete`,
                            `success`,
                            `done`,
                          ].includes(status2)
                        )
                          try {
                            let parsedUrl = new URL(taskBaseUrlForRequest),
                              candidateUrls = [`${parsedUrl.origin}/v1/videos/${taskIdForRequest}`];
                            if (parsedUrl.hostname.startsWith(`api.`)) {
                              let parsedUrl2 = new URL(taskBaseUrlForRequest);
                              ((parsedUrl2.hostname = parsedUrl2.hostname.replace(/^api\./, ``)),
                                candidateUrls.push(`${parsedUrl2.origin}/v1/videos/${taskIdForRequest}`));
                            }
                            for (let url of [...new Set(candidateUrls)]) {
                              let response2 = await fetch(url, {
                                headers: {
                                  Authorization: `Bearer ${taskKey}`
                                },
                              });
                              if (response2.ok) {
                                let data2 = await response2.json().catch(() => null);
                                videoUrl = extractUrl(
                                  data2?.video_url ||
                                  data2?.videoUrl ||
                                  data2?.url ||
                                  data2?.content?.video_url ||
                                  data2?.content?.videoUrl ||
                                  data2?.data?.video_url ||
                                  data2?.data?.videoUrl ||
                                  data2?.result?.video_url ||
                                  data2?.result?.videoUrl,
                                ) || videoUrl;
                                thumbnailUrl2 = extractUrl(
                                  data2?.thumbnail_url ||
                                  data2?.cover_url ||
                                  data2?.content?.last_frame_url ||
                                  data2?.content?.thumbnail_url ||
                                  data2?.data?.thumbnail_url ||
                                  data2?.result?.thumbnail_url,
                                ) || thumbnailUrl2;
                                if (videoUrl) break;
                              }
                            }
                          } catch (error) {
                            console.warn(`Failed to query Sora-compatible video status`, error);
                          }
                        if (
                          !videoUrl &&
                          [
                            `succeeded`,
                            `completed`,
                            `complete`,
                            `success`,
                            `done`,
                          ].includes(status2)
                        )
                          try {
                            let parsedUrl = new URL(taskBaseUrlForRequest),
                              candidateUrls = [`${parsedUrl.origin}/v1/videos/${taskIdForRequest}/content`];
                            if (parsedUrl.hostname.startsWith(`api.`)) {
                              let parsedUrl2 = new URL(taskBaseUrlForRequest);
                              ((parsedUrl2.hostname = parsedUrl2.hostname.replace(/^api\./, ``)),
                                candidateUrls.push(`${parsedUrl2.origin}/v1/videos/${taskIdForRequest}/content`));
                            }
                            for (let url of [...new Set(candidateUrls)]) {
                              let response2 = await fetch(url, {
                                headers: {
                                  Authorization: `Bearer ${taskKey}`
                                },
                              });
                              if (response2.ok) {
                                let contentType = response2.headers.get(`content-type`) || ``,
                                  blob = await response2.blob();
                                if (blob.size > 0 && !/json|text\/html/i.test(contentType)) {
                                  videoUrl = URL.createObjectURL(blob);
                                  break;
                                }
                              }
                            }
                          } catch (error) {
                            console.warn(`Failed to fetch Seedance video content`, error);
                          }
                        [
                          `succeeded`,
                          `completed`,
                          `complete`,
                          `success`,
                          `done`,
                        ].includes(status2) || videoUrl ?
                          ((isCompleted = true), (status = `completed`), (progress = 100), (resultUrl = videoUrl), (thumbnailUrl = thumbnailUrl2)) :
                          [
	                            `failed`,
	                            `fail`,
	                            `error`,
                            `expired`,
                            `canceled`,
                            `cancelled`,
                            `rejected`,
                          ].includes(status2) ?
	                          ((status = `failed`),
	                            (errorMsg =
	                              seedanceItemErrorMessage ||
	                              seedanceItem?.message ||
	                              data.error?.message ||
	                              data.data?.error?.message ||
                              data.message ||
                              data.error?.code ||
                              `视频生成失败`)) :
	                          ((status = `running`),
	                            (progress =
	                              seedanceItem?.progress !== undefined &&
	                              seedanceItem?.progress !== null ?
	                              parseInt(seedanceItem.progress) :
	                              data.progress !== undefined && data.progress !== null ?
	                              parseInt(data.progress) :
                              data.data?.progress !== undefined &&
                              data.data?.progress !== null ?
                              parseInt(data.data.progress) :
                              data.content?.progress !== undefined &&
                              data.content?.progress !== null ?
                              parseInt(data.content.progress) :
                              progress || 0));
                      } else {
                        let statusText = String(
                          data.status ||
                          data.data?.status ||
                          data.output?.status ||
                          data.result?.status ||
                          data.task?.status ||
                          data.base_resp?.status_msg ||
                          ``,
                        )
                          .trim()
                          .toLowerCase(),
                          videoUrl =
                          (
                            data.video_url ||
                            data.videoUrl ||
                            data.data?.video_url ||
                            data.data?.videoUrl ||
                            data.output?.video_url ||
                            data.output?.videoUrl ||
                            data.result?.video_url ||
                            data.result?.videoUrl ||
                            data.video?.url ||
                            data.video ||
                            data.result_url ||
                            data.url
                          )?.replace(
                            /[`\s]/g,
                            ``,
                          ) || ``,
                          thumbnailUrl2 =
                          (data.thumbnail_url || data.cover_url || data.thumbnail)?.replace(
                            /[`\s]/g,
                            ``,
                          ) || ``,
                          fileId =
                          data.file_id ||
                          data.fileId ||
                          data.data?.file_id ||
                          data.output?.file_id ||
                          data.result?.file_id;
                        if (!videoUrl && fileId)
                          try {
                            let apiUrl = buildApiUrl(
                                task.apiBaseUrl || videoTaskConfig?.url || videoApiUrl,
                                `/v1/files/retrieve`,
                              ),
                              requestUrl = new URL(apiUrl);
                            requestUrl.searchParams.set(`file_id`, fileId);
                            let response2 = await fetch(requestUrl.toString(), {
                              headers: {
                                Authorization: `Bearer ${taskKey}`
                              },
                            });
                            if (response2.ok) {
                              let data2 = await response2.json();
                              videoUrl =
                                (data2?.file?.download_url || data2?.download_url || ``).replace(
                                  /[`\s]/g,
                                  ``,
                                ) || videoUrl;
                            }
                          } catch (error) {
                            console.warn(`Failed to retrieve video file by file_id`, error);
                          }
                        if (!videoUrl && contentPathTemplate)
                          try {
                            let apiUrl = buildApiUrl(
                                (task.apiBaseUrl || videoTaskConfig?.url || videoApiUrl).replace(/\s+/g, ``).replace(/\/$/, ``),
                                replaceTaskPath(contentPathTemplate, task.id),
                              ),
                              response2 = await fetch(apiUrl, {
                                headers: {
                                  Authorization: `Bearer ${taskKey}`
                                },
                              });
                            if (response2.ok) {
                              let blob = await response2.blob();
                              videoUrl = URL.createObjectURL(blob);
                            }
                          } catch (error) {
                            console.warn(`Failed to retrieve video content by contentPath`, error);
                          }
                        if ([`completed`, `complete`, `success`, `succeeded`, `done`].includes(statusText) || videoUrl)
                          ((isCompleted = true), (status = `completed`), (progress = 100), (resultUrl = videoUrl), (thumbnailUrl = thumbnailUrl2));
                        else if ([`failed`, `error`, `fail`, `expired`, `canceled`, `cancelled`, `rejected`].includes(statusText)) {
                          status = `failed`;
                          let errorMsg2 = `视频生成失败`;
                          (data.error &&
                            (typeof data.error == `string` ?
                              (errorMsg2 = data.error) :
                              data.error.message && (errorMsg2 = data.error.message)),
                            (errorMsg = errorMsg2));
                        } else
                          ((status = `running`),
                            (progress =
                              data.progress !== undefined && data.progress !== null ?
                              parseInt(data.progress) :
                              data.data?.progress !== undefined && data.data?.progress !== null ?
                              parseInt(data.data.progress) :
                              progress || 0));
                      }
                      (updateGlobalTasks((tasks) =>
                          tasks.map((task2) =>
                            task2.id === task.id ?
                            {
                              ...task2,
                              status: status,
                              progress: progress,
                              errorMsg: errorMsg,
                              resultUrl: resultUrl,
                              thumbnailUrl: thumbnailUrl,
                            } :
                              task2,
                          ),
                        ),
                        isCompleted &&
                        resultUrl &&
                        (task.nodeId &&
                          setNodes((nodes) =>
                            nodes.map((node) =>
                              node.id === task.nodeId ?
                              {
                                ...node,
                                data: {
                                  ...wanjuanClearProjectAssetBindingsFromData(node.data, [`videoUrl`, `thumbnailUrl`, `resultData`]),
                                  taskId: wanjuanTaskUsesSeedanceSlot(task, node) ? undefined : task.id,
                                  seedanceTaskId: wanjuanTaskUsesSeedanceSlot(task, node) ? task.id : undefined,
                                  videoUrl: resultUrl,
                                  thumbnailUrl: thumbnailUrl,
                                  loading: false,
                                  progress: 100,
                                  errorMessage: undefined,
                                },
                              } :
                              node,
                            ),
                          ),
                          addResource(resultUrl, `video`, `generated`),
                          thumbnailUrl && addResource(thumbnailUrl, `image`, `generated`)),
	                        notify(isCompleted ? resultUrl ? `任务已完成，结果已拉回` : `任务已完成，但接口没有返回视频地址` : `状态已刷新`));
	                    } else notify(`刷新失败: ${response.status}`);
	                } catch (error) {
	                  notify(`网络错误: ${error.message}`);
	                }
	              };
  return { refreshGlobalTask };
}
