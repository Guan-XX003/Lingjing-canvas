// @ts-nocheck
/**
 * applyConfigButlerResult。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig, Bindings, SetAny, Toast } from "../lib/app-types";
import { cloneBackupValue } from "../lib/backup";
import { ensureModelInList } from "../lib/model-list-utils";
import { finalizeButlerProtocolConfig, normalizeButlerBaseUrl, normalizeModelCategory, normalizeProtocolConfig, normalizeProtocolName } from "../lib/config-butler";
import { guessApiConfigName, normalizeUnifiedApiConfigs } from "../lib/unified-api-config";
declare const chrome: any;

interface UseApplyConfigButlerResultDeps {
  _e: any;
  activeStoredGlobalConfigId: any;
  apiConfigs: ApiConfig[];
  audioModelApiBindings: Bindings;
  audioModelProtocolBindings: Bindings;
  audioModels: any;
  configButlerTargetApiConfigId: any;
  configButlerTargetApiKey: any;
  configButlerTargetApiUrl: any;
  configButlerTargetCategory: any;
  configButlerTargetModel: any;
  getSelectedButlerTargetApiConfig: any;
  imageModelApiBindings: Bindings;
  imageModelProtocolBindings: Bindings;
  imageModels: any;
  modelProtocolRegistry: Bindings;
  setActiveProtocolConfigText: SetAny;
  setActiveProtocolName: SetAny;
  setActiveStoredGlobalConfigId: SetAny;
  setApiConfigs: SetAny;
  setAudioApiConfigId: SetAny;
  setAudioModelApiBindings: SetAny;
  setAudioModelProtocolBindings: SetAny;
  setAudioModels: SetAny;
  setConfigButlerExpanded: SetAny;
  setImageModelApiBindings: SetAny;
  setImageModelProtocolBindings: SetAny;
  setImageModels: SetAny;
  setModelProtocolRegistry: SetAny;
  setProtocolFormatsExpanded: SetAny;
  setProtocolNamesText: SetAny;
  setStoredGlobalConfigs: SetAny;
  setTextModelApiBindings: SetAny;
  setTextModelProtocolBindings: SetAny;
  setTtsMusicModel: SetAny;
  setVideoModelApiBindings: SetAny;
  setVideoModelProtocolBindings: SetAny;
  setVideoModels: SetAny;
  showToast2: Toast;
  storedGlobalConfigs: any;
  textModelApiBindings: Bindings;
  textModelProtocolBindings: Bindings;
  textModels: any;
  ttsMusicModel: any;
  videoModelApiBindings: Bindings;
  videoModelProtocolBindings: Bindings;
  videoModels: any;
}

export function useApplyConfigButlerResult(deps: UseApplyConfigButlerResultDeps) {
  const {
    _e,
    activeStoredGlobalConfigId,
    apiConfigs,
    audioModelApiBindings,
    audioModelProtocolBindings,
    audioModels,
    configButlerTargetApiConfigId,
    configButlerTargetApiKey,
    configButlerTargetApiUrl,
    configButlerTargetCategory,
    configButlerTargetModel,
    getSelectedButlerTargetApiConfig,
    imageModelApiBindings,
    imageModelProtocolBindings,
    imageModels,
    modelProtocolRegistry,
    setActiveProtocolConfigText,
    setActiveProtocolName,
    setActiveStoredGlobalConfigId,
    setApiConfigs,
    setAudioApiConfigId,
    setAudioModelApiBindings,
    setAudioModelProtocolBindings,
    setAudioModels,
    setConfigButlerExpanded,
    setImageModelApiBindings,
    setImageModelProtocolBindings,
    setImageModels,
    setModelProtocolRegistry,
    setProtocolFormatsExpanded,
    setProtocolNamesText,
    setStoredGlobalConfigs,
    setTextModelApiBindings,
    setTextModelProtocolBindings,
    setTtsMusicModel,
    setVideoModelApiBindings,
    setVideoModelProtocolBindings,
    setVideoModels,
    showToast2,
    storedGlobalConfigs,
    textModelApiBindings,
    textModelProtocolBindings,
    textModels,
    ttsMusicModel,
    videoModelApiBindings,
    videoModelProtocolBindings,
    videoModels,
  } = deps;
  const applyConfigButlerResult = (butlerResult) => {
          let modelName = String(butlerResult.modelName || configButlerTargetModel || ``).trim(),
            category =
            normalizeModelCategory(configButlerTargetCategory) ||
            normalizeModelCategory(butlerResult.category) ||
            ``,
            apiUrl = String(
              (getSelectedButlerTargetApiConfig() || {}).url ||
              configButlerTargetApiUrl ||
              butlerResult.apiConfig?.url ||
              ``,
            ).trim(),
            apiKey = String(
              (getSelectedButlerTargetApiConfig() || {}).key ||
              configButlerTargetApiKey ||
              ``,
            ).trim();
          if (!modelName || !category || !apiUrl) throw Error(`配置结果缺少模型名、分类或请求地址`);
          let protocolConfig = finalizeButlerProtocolConfig(normalizeProtocolConfig(butlerResult.protocol?.config, category), {
              modelName: modelName,
              apiUrl: apiUrl,
              category: category,
            }),
            protocolName = normalizeProtocolName(butlerResult.protocol?.name, protocolConfig),
            apiConfigName = guessApiConfigName(butlerResult.apiConfig?.name, apiUrl),
            apiConfigs2 = [...apiConfigs],
            matchedApiConfig =
            apiConfigs2.find((apiConfig) => apiConfig.id === configButlerTargetApiConfigId) ||
            apiConfigs2.find(
              (apiConfig) =>
              normalizeButlerBaseUrl(apiConfig.url) === normalizeButlerBaseUrl(apiUrl) ||
              apiConfig.name === apiConfigName,
            ) ||
            null;
          matchedApiConfig
            ?
            ((matchedApiConfig.url = apiUrl), apiKey && (matchedApiConfig.key = apiKey), apiConfigName && (matchedApiConfig.name = apiConfigName), matchedApiConfig.protocolFormat || (matchedApiConfig.protocolFormat = `auto`)) :
            ((matchedApiConfig = {
                id: Date.now().toString(),
                name: apiConfigName,
                url: apiUrl,
                key: apiKey,
                protocolFormat: `auto`,
              }),
              apiConfigs2.push(matchedApiConfig)),
            setApiConfigs(normalizeUnifiedApiConfigs(apiConfigs2));
	          let nextProtocolRegistry = modelProtocolRegistry;
	          if (protocolName && protocolConfig && typeof protocolConfig == `object`) {
	            let protocolConfigKey = JSON.stringify(protocolConfig || {}),
	              existingProtocolName = Object.keys(modelProtocolRegistry).find(
	                (existingName) => JSON.stringify(modelProtocolRegistry[existingName] || {}) === protocolConfigKey,
	              );
	            if (existingProtocolName) protocolName = existingProtocolName;
	            else {
	              let candidateName = protocolName, suffix = 2;
	              for (; modelProtocolRegistry[candidateName];)((candidateName = `${protocolName}（${suffix}）`), (suffix += 1));
	              protocolName = candidateName;
	              nextProtocolRegistry = { ...modelProtocolRegistry, [protocolName]: protocolConfig };
	              setModelProtocolRegistry(nextProtocolRegistry);
	            }
	          }
	          if (category === `text`) {
	            let textModelList = ensureModelInList(textModels, modelName),
	              nextApiBindings = {
	                ...textModelApiBindings,
	                [modelName]: matchedApiConfig.id
	              },
	              nextProtocolBindings = protocolName ? {
	                ...textModelProtocolBindings,
	                [modelName]: protocolName,
	              } : textModelProtocolBindings;
	            (_e(textModelList),
	              setTextModelApiBindings(nextApiBindings),
	              protocolName && setTextModelProtocolBindings(nextProtocolBindings),
	              typeof chrome < `u` && chrome.storage?.local?.set({
	                textModel: textModelList,
	                apiConfigs: apiConfigs2,
	                textModelApiBindings: nextApiBindings,
	                textModelProtocolBindings: nextProtocolBindings,
	                modelProtocolRegistry: nextProtocolRegistry,
	              }));
	          } else if (category === `image`) {
	            let imageModelList = ensureModelInList(imageModels, modelName),
	              nextApiBindings = {
	                ...imageModelApiBindings,
	                [modelName]: matchedApiConfig.id
	              },
	              nextProtocolBindings = protocolName ? {
	                ...imageModelProtocolBindings,
	                [modelName]: protocolName,
	              } : imageModelProtocolBindings;
	            (setImageModels(imageModelList),
	              setImageModelApiBindings(nextApiBindings),
	              protocolName && setImageModelProtocolBindings(nextProtocolBindings),
	              typeof chrome < `u` && chrome.storage?.local?.set({
	                drawingModel: imageModelList,
	                apiConfigs: apiConfigs2,
	                imageModelApiBindings: nextApiBindings,
	                imageModelProtocolBindings: nextProtocolBindings,
	                modelProtocolRegistry: nextProtocolRegistry,
	              }));
	          } else if (category === `video`) {
	            let videoModelList = ensureModelInList(videoModels, modelName),
	              nextApiBindings = {
	                ...videoModelApiBindings,
	                [modelName]: matchedApiConfig.id
	              },
	              nextProtocolBindings = protocolName ? {
	                ...videoModelProtocolBindings,
	                [modelName]: protocolName,
	              } : videoModelProtocolBindings;
	            (setVideoModels(videoModelList),
	              setVideoModelApiBindings(nextApiBindings),
	              protocolName && setVideoModelProtocolBindings(nextProtocolBindings),
	              typeof chrome < `u` && chrome.storage?.local?.set({
	                videoModel: videoModelList,
	                apiConfigs: apiConfigs2,
	                videoModelApiBindings: nextApiBindings,
	                videoModelProtocolBindings: nextProtocolBindings,
	                modelProtocolRegistry: nextProtocolRegistry,
	              }));
	          } else if (category === `audio`) {
	            let audioModelList = ensureModelInList(audioModels, modelName),
	              nextApiBindings = {
	                ...audioModelApiBindings,
	                [modelName]: matchedApiConfig.id
	              },
	              nextProtocolBindings = protocolName ? {
	                ...audioModelProtocolBindings,
	                [modelName]: protocolName,
	              } : audioModelProtocolBindings;
	            (setAudioModels(audioModelList),
	              setAudioModelApiBindings(nextApiBindings),
	              setAudioApiConfigId(matchedApiConfig.id),
	              protocolName && setAudioModelProtocolBindings(nextProtocolBindings),
	              typeof chrome < `u` && chrome.storage?.local?.set({
	                audioModel: audioModelList,
	                audioApiConfigId: matchedApiConfig.id,
	                apiConfigs: apiConfigs2,
	                audioModelApiBindings: nextApiBindings,
	                audioModelProtocolBindings: nextProtocolBindings,
	                modelProtocolRegistry: nextProtocolRegistry,
	              }));
	          } else if (category === `music` || category === `tts-music`) {
	            let ttsMusicModelList = ensureModelInList(ttsMusicModel, modelName),
	              nextApiBindings = {
	                ...audioModelApiBindings,
	                [modelName]: matchedApiConfig.id
	              },
	              nextProtocolBindings = protocolName ? {
	                ...audioModelProtocolBindings,
	                [modelName]: protocolName,
	              } : audioModelProtocolBindings;
	            (setTtsMusicModel(ttsMusicModelList),
	              setAudioModelApiBindings(nextApiBindings),
	              protocolName && setAudioModelProtocolBindings(nextProtocolBindings),
	              typeof chrome < `u` && chrome.storage?.local?.set({
	                ttsMusicModel: ttsMusicModelList,
	                apiConfigs: apiConfigs2,
	                audioModelApiBindings: nextApiBindings,
	                audioModelProtocolBindings: nextProtocolBindings,
	                modelProtocolRegistry: nextProtocolRegistry,
	              }));
	          } else throw Error(`暂不支持的模型分类：${category}`);
	          let currentStoredConfigPatch = {
	              apiConfigs: cloneBackupValue(apiConfigs2),
	              modelProtocolRegistry: cloneBackupValue(nextProtocolRegistry),
	            },
	            activeConfigForButlerApply =
	            activeStoredGlobalConfigId &&
	            (storedGlobalConfigs || []).find((globalConfig) => globalConfig.id === activeStoredGlobalConfigId);
	          if (category === `text`) {
	            currentStoredConfigPatch.textModel = ensureModelInList(textModels, modelName);
	            currentStoredConfigPatch.textModelApiBindings = cloneBackupValue({
	              ...textModelApiBindings,
	              [modelName]: matchedApiConfig.id,
	            });
	            protocolName &&
	            (currentStoredConfigPatch.textModelProtocolBindings = cloneBackupValue({
	              ...textModelProtocolBindings,
	              [modelName]: protocolName,
	            }));
	          } else if (category === `image`) {
	            currentStoredConfigPatch.drawingModel = ensureModelInList(imageModels, modelName);
	            currentStoredConfigPatch.imageModelApiBindings = cloneBackupValue({
	              ...imageModelApiBindings,
	              [modelName]: matchedApiConfig.id,
	            });
	            protocolName &&
	            (currentStoredConfigPatch.imageModelProtocolBindings = cloneBackupValue({
	              ...imageModelProtocolBindings,
	              [modelName]: protocolName,
	            }));
	          } else if (category === `video`) {
	            currentStoredConfigPatch.videoModel = ensureModelInList(videoModels, modelName);
	            currentStoredConfigPatch.videoModelApiBindings = cloneBackupValue({
	              ...videoModelApiBindings,
	              [modelName]: matchedApiConfig.id,
	            });
	            protocolName &&
	            (currentStoredConfigPatch.videoModelProtocolBindings = cloneBackupValue({
	              ...videoModelProtocolBindings,
	              [modelName]: protocolName,
	            }));
	          } else if (category === `audio`) {
	            currentStoredConfigPatch.audioModel = ensureModelInList(audioModels, modelName);
	            currentStoredConfigPatch.audioApiConfigId = matchedApiConfig.id;
	            currentStoredConfigPatch.audioModelApiBindings = cloneBackupValue({
	              ...audioModelApiBindings,
	              [modelName]: matchedApiConfig.id,
	            });
	            protocolName &&
	            (currentStoredConfigPatch.audioModelProtocolBindings = cloneBackupValue({
	              ...audioModelProtocolBindings,
	              [modelName]: protocolName,
	            }));
	          } else if (category === `music` || category === `tts-music`) {
	            currentStoredConfigPatch.ttsMusicModel = ensureModelInList(ttsMusicModel, modelName);
	            currentStoredConfigPatch.audioModelApiBindings = cloneBackupValue({
	              ...audioModelApiBindings,
	              [modelName]: matchedApiConfig.id,
	            });
	            protocolName &&
	            (currentStoredConfigPatch.audioModelProtocolBindings = cloneBackupValue({
	              ...audioModelProtocolBindings,
	              [modelName]: protocolName,
	            }));
	          }
	          if (activeConfigForButlerApply) {
	            let updatedStoredConfigs = (storedGlobalConfigs || []).map((globalConfig) =>
	              globalConfig.id === activeStoredGlobalConfigId ? {
	                ...globalConfig,
	                updatedAt: Date.now(),
	                config: {
	                  ...(globalConfig.config || {}),
	                  ...currentStoredConfigPatch,
	                },
	              } : globalConfig,
	            );
	            (setStoredGlobalConfigs(updatedStoredConfigs),
	              setActiveStoredGlobalConfigId(activeStoredGlobalConfigId),
	              typeof chrome < `u` &&
	              chrome.storage?.local?.set({
	                storedGlobalConfigs: updatedStoredConfigs,
	                activeStoredGlobalConfigId: activeStoredGlobalConfigId,
	              }));
	          }
          protocolName &&
            protocolConfig &&
            typeof protocolConfig == `object` &&
            (setProtocolNamesText(
                Object.keys({
	                  ...nextProtocolRegistry
	                }).join(`
`),
              ),
              setActiveProtocolName(protocolName),
              setActiveProtocolConfigText(JSON.stringify(protocolConfig, null, 2)),
              setProtocolFormatsExpanded(true));
	          setConfigButlerExpanded(true);
	          showToast2(`配置管家已应用 ${modelName} 的配置`);
	        };
  return { applyConfigButlerResult };
}
