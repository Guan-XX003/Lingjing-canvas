// @ts-nocheck
/**
 * applyConfigButlerBatchResults。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";
import { ensureModelInList } from "../lib/model-list-utils";
import { finalizeButlerProtocolConfig, inferButlerCategoryFromModelName, normalizeModelCategory, normalizeProtocolConfig, normalizeProtocolName } from "../lib/config-butler";
import { guessApiConfigName } from "../lib/unified-api-config";
declare const chrome: any;

export function useApplyConfigButlerBatchResults(deps: any) {
  const {
    _e,
    captureCurrentGlobalConfig,
    configButlerBatchItems,
    configButlerDocUrl,
    configButlerTargetApiKey,
    configButlerTargetApiUrl,
    getSelectedButlerTargetApiConfig,
    mergeStoredGlobalApiConfigs,
    normalizeStoredGlobalConfigBackup,
    setActiveStoredGlobalConfigId,
    setApiConfigs,
    setAudioApiConfigId,
    setAudioApiKey,
    setAudioApiUrl,
    setAudioModelApiBindings,
    setAudioModelProtocolBindings,
    setAudioModels,
    setConfigButlerBatchModalOpen,
    setConfigButlerExpanded,
    setImageApiConfigId,
    setImageApiKey,
    setImageApiUrl,
    setImageModelApiBindings,
    setImageModelProtocolBindings,
    setImageModels,
    setModelProtocolRegistry,
    setProtocolNamesText,
    setStoredGlobalConfigs,
    setTextApiConfigId,
    setTextApiKey,
    setTextApiUrl,
    setTextModelApiBindings,
    setTextModelProtocolBindings,
    setTtsMusicModel,
    setVideoApiConfigId,
    setVideoApiKey,
    setVideoApiUrl,
    setVideoModelApiBindings,
    setVideoModelProtocolBindings,
    setVideoModels,
    showToast2,
    storedGlobalConfigs,
  } = deps;
  const applyConfigButlerBatchResults = (options = {}) => {
	          let sourceBatchItems = Array.isArray(options.items) ? options.items : configButlerBatchItems,
	            validBatchItems = (sourceBatchItems || []).filter((batchItem) =>
	            String(batchItem?.modelName || ``).trim(),
	          );
	          if (!validBatchItems.length) {
	            showToast2(`没有可导入的模型配置`);
	            return;
	          }
	          let targetApiConfig = options.apiConfig || getSelectedButlerTargetApiConfig(),
	            apiUrl = String(targetApiConfig?.url || configButlerTargetApiUrl || ``).trim(),
	            apiKey = String(targetApiConfig?.key || configButlerTargetApiKey || ``).trim();
	          if (!apiUrl) {
	            showToast2(`目标统一 API 配置缺少请求地址`);
	            return;
	          }
	          let apiConfigName = guessApiConfigName(targetApiConfig?.name, apiUrl),
	            newApiConfig = {
	              id: `config-butler-batch-${Date.now()}`,
	              name: apiConfigName,
	              url: apiUrl,
	              key: apiKey,
	              protocolFormat: `auto`,
	            };
	          let textModels2 = ``,
	            imageModels2 = ``,
	            videoModels2 = ``,
	            audioModels2 = ``,
	            ttsMusicModels = ``,
	            textApiBindings = {},
	            imageApiBindings = {},
	            videoApiBindings = {},
	            audioApiBindings = {},
	            textProtocolBindings = {},
	            imageProtocolBindings = {},
	            videoProtocolBindings = {},
	            audioProtocolBindings = {},
	            protocolRegistry = {},
	            importedCount = 0;
	          validBatchItems.forEach((batchItem) => {
	            let modelName = String(batchItem.modelName || ``).trim(),
	              category = normalizeModelCategory(batchItem.category) || inferButlerCategoryFromModelName(modelName);
	            if (!modelName || !category) return;
	            let protocolConfig = finalizeButlerProtocolConfig(
	                normalizeProtocolConfig(batchItem.protocol?.config, category), {
	                  modelName: modelName,
	                  apiUrl: apiUrl,
	                  category: category
	                },
	              ),
	              protocolName = normalizeProtocolName(batchItem.protocol?.name, protocolConfig),
	              protocolConfigKey = JSON.stringify(protocolConfig || {}),
	              existingProtocolName = Object.keys(protocolRegistry).find((protocolName2) => JSON.stringify(protocolRegistry[protocolName2] || {}) === protocolConfigKey);
	            if (existingProtocolName) protocolName = existingProtocolName;
	            else if (protocolName && protocolConfig && typeof protocolConfig == `object`) {
	              let candidateName = protocolName,
	                suffix = 2;
	              for (; protocolRegistry[candidateName];)((candidateName = `${protocolName}（${suffix}）`), (suffix += 1));
	              protocolName = candidateName;
	              protocolRegistry[protocolName] = protocolConfig;
	            }
	            category === `text` ?
	              ((textModels2 = ensureModelInList(textModels2, modelName)), (textApiBindings[modelName] = newApiConfig.id), protocolName && (textProtocolBindings[modelName] = protocolName), (importedCount += 1)) :
	              category === `image` ?
	              ((imageModels2 = ensureModelInList(imageModels2, modelName)), (imageApiBindings[modelName] = newApiConfig.id), protocolName && (imageProtocolBindings[modelName] = protocolName), (importedCount += 1)) :
	              category === `video` ?
	              ((videoModels2 = ensureModelInList(videoModels2, modelName)), (videoApiBindings[modelName] = newApiConfig.id), protocolName && (videoProtocolBindings[modelName] = protocolName), (importedCount += 1)) :
	              category === `audio` ?
	              ((audioModels2 = ensureModelInList(audioModels2, modelName)), (audioApiBindings[modelName] = newApiConfig.id), protocolName && (audioProtocolBindings[modelName] = protocolName), (importedCount += 1)) :
	              (category === `music` || category === `tts-music`) &&
	              ((ttsMusicModels = ensureModelInList(ttsMusicModels, modelName)), (audioApiBindings[modelName] = newApiConfig.id), protocolName && (audioProtocolBindings[modelName] = protocolName), (importedCount += 1));
	          });
	          if (!importedCount) {
	            showToast2(`没有可导入的有效模型配置`);
	            return;
	          }
	          let docUrl = String(options.docUrl || configButlerDocUrl || ``).trim(),
	            baseConfigName = String(apiConfigName || `配置管家批量配置`).trim() || `配置管家批量配置`,
	            existingConfigNames = new Set((storedGlobalConfigs || []).map((globalConfig) => String(globalConfig?.name || ``))),
	            configName = existingConfigNames.has(baseConfigName) ? `${baseConfigName} ${new Date().toLocaleString()}` : baseConfigName,
	            configId = `global-config-butler-batch-${Date.now()}`,
	            repairedGlobalConfig = normalizeStoredGlobalConfigBackup({
	              ...captureCurrentGlobalConfig(),
	              apiConfigs: [cloneBackupValue(newApiConfig)],
	              textApiConfigId: newApiConfig.id,
	              imageApiConfigId: newApiConfig.id,
	              videoApiConfigId: newApiConfig.id,
	              audioApiConfigId: newApiConfig.id,
	              textApiUrl: apiUrl,
	              textApiKey: apiKey,
	              imageApiUrl: apiUrl,
	              imageApiKey: apiKey,
	              videoApiUrl: apiUrl,
	              videoApiKey: apiKey,
	              audioApiUrl: apiUrl,
	              audioApiKey: apiKey,
	              textModel: textModels2,
	              drawingModel: imageModels2,
	              videoModel: videoModels2,
	              audioModel: audioModels2,
	              ttsMusicModel: ttsMusicModels,
	              modelProtocolRegistry: cloneBackupValue(protocolRegistry),
	              textModelApiBindings: cloneBackupValue(textApiBindings),
	              imageModelApiBindings: cloneBackupValue(imageApiBindings),
	              videoModelApiBindings: cloneBackupValue(videoApiBindings),
	              audioModelApiBindings: cloneBackupValue(audioApiBindings),
	              textModelProtocolBindings: cloneBackupValue(textProtocolBindings),
	              imageModelProtocolBindings: cloneBackupValue(imageProtocolBindings),
	              videoModelProtocolBindings: cloneBackupValue(videoProtocolBindings),
	              audioModelProtocolBindings: cloneBackupValue(audioProtocolBindings),
	              apiDocUrl: docUrl,
	              configButlerDocUrl: docUrl,
	              configButlerMode: `batch`,
	              configButlerTargetApiConfigId: newApiConfig.id,
	            }),
	            nextStoredConfigs = [
	              ...(storedGlobalConfigs || []),
	              {
	                id: configId,
	                name: configName,
	                description: `配置管家批量生成 · ${importedCount} 个模型`,
	                apiDocUrl: docUrl,
	                updatedAt: Date.now(),
	                config: repairedGlobalConfig,
	              },
	            ],
	            mergedApiConfigs = mergeStoredGlobalApiConfigs(repairedGlobalConfig.apiConfigs);
	          (setStoredGlobalConfigs(nextStoredConfigs),
	            setActiveStoredGlobalConfigId(configId),
	            setApiConfigs(mergedApiConfigs),
	            setTextApiConfigId(newApiConfig.id),
	            setImageApiConfigId(newApiConfig.id),
	            setVideoApiConfigId(newApiConfig.id),
	            setAudioApiConfigId(newApiConfig.id),
	            setTextApiUrl(apiUrl),
	            setTextApiKey(apiKey),
	            setImageApiUrl(apiUrl),
	            setImageApiKey(apiKey),
	            setVideoApiUrl(apiUrl),
	            setVideoApiKey(apiKey),
	            setAudioApiUrl(apiUrl),
	            setAudioApiKey(apiKey),
	            _e(textModels2),
	            setImageModels(imageModels2),
	            setVideoModels(videoModels2),
	            setAudioModels(audioModels2),
	            setTtsMusicModel(ttsMusicModels),
	            setTextModelApiBindings(textApiBindings),
	            setImageModelApiBindings(imageApiBindings),
	            setVideoModelApiBindings(videoApiBindings),
	            setAudioModelApiBindings(audioApiBindings),
	            setTextModelProtocolBindings(repairedGlobalConfig.textModelProtocolBindings || textProtocolBindings),
	            setImageModelProtocolBindings(repairedGlobalConfig.imageModelProtocolBindings || imageProtocolBindings),
	            setVideoModelProtocolBindings(repairedGlobalConfig.videoModelProtocolBindings || videoProtocolBindings),
	            setAudioModelProtocolBindings(repairedGlobalConfig.audioModelProtocolBindings || audioProtocolBindings),
	            setModelProtocolRegistry(repairedGlobalConfig.modelProtocolRegistry || protocolRegistry),
	            setProtocolNamesText(Object.keys(repairedGlobalConfig.modelProtocolRegistry || protocolRegistry).join(`
`)),
	            setConfigButlerBatchModalOpen(false),
	            setConfigButlerExpanded(true),
	            typeof chrome < `u` && chrome.storage?.local?.set({
	              storedGlobalConfigs: nextStoredConfigs,
	              activeStoredGlobalConfigId: configId,
	              apiConfigs: mergedApiConfigs,
	              textApiConfigId: newApiConfig.id,
	              imageApiConfigId: newApiConfig.id,
	              videoApiConfigId: newApiConfig.id,
	              audioApiConfigId: newApiConfig.id,
	              textApiUrl: apiUrl,
	              textApiKey: apiKey,
	              imageApiUrl: apiUrl,
	              imageApiKey: apiKey,
	              videoApiUrl: apiUrl,
	              videoApiKey: apiKey,
	              audioApiUrl: apiUrl,
	              audioApiKey: apiKey,
	              textModel: textModels2,
	              drawingModel: imageModels2,
	              videoModel: videoModels2,
	              audioModel: audioModels2,
	              ttsMusicModel: ttsMusicModels,
	              textModelApiBindings: textApiBindings,
	              imageModelApiBindings: imageApiBindings,
	              videoModelApiBindings: videoApiBindings,
	              audioModelApiBindings: audioApiBindings,
	              textModelProtocolBindings: repairedGlobalConfig.textModelProtocolBindings || textProtocolBindings,
	              imageModelProtocolBindings: repairedGlobalConfig.imageModelProtocolBindings || imageProtocolBindings,
	              videoModelProtocolBindings: repairedGlobalConfig.videoModelProtocolBindings || videoProtocolBindings,
	              audioModelProtocolBindings: repairedGlobalConfig.audioModelProtocolBindings || audioProtocolBindings,
	              modelProtocolRegistry: repairedGlobalConfig.modelProtocolRegistry || protocolRegistry,
	              configButlerDocUrl: docUrl,
	              configButlerMode: `batch`,
	              configButlerTargetApiConfigId: newApiConfig.id
	            }),
	            showToast2(options.silentToast ? `已同步极鑫中转站模型（${importedCount} 个）` : `已保存并切换到 ${configName}（${importedCount} 个模型）`));
	          return {
	            importedCount: importedCount,
	            configId: configId,
	            configName: configName,
	            apiConfigId: newApiConfig.id,
	          };
	        };
  return { applyConfigButlerBatchResults };
}
