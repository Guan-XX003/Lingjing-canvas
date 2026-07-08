// @ts-nocheck
/**
 * usePluginEnvEffect（自 bundle 抽出的 useEffect，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetAny, Toast } from "../lib/app-types";
import { WANJUAN_BUILTIN_AGENT_ITEMS, WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION, WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS, WANJUAN_JIXIN_DEFAULT_DOC_URL, wanjuanApplyJixinBuiltinProtocolPatch, wanjuanApplySeedanceOptionDefaults, wanjuanBuildJixinBuiltinBasePatch, wanjuanBuildJixinBuiltinStoredGlobalConfig, wanjuanCloneBuiltinAgentConversations, wanjuanCloneBuiltinAgentItems, wanjuanHasUserAgentConfiguration, wanjuanHasUserModelConfiguration, wanjuanIsLegacyJixinDocUrl, wanjuanMergeModelText, wanjuanSyncJixinBuiltinStoredGlobalConfig } from "../lib/jixin-catalog";
import { WanJuanNormalizePerformanceProfile } from "../lib/performance-profile";
import { compactGlobalTasks } from "../lib/app-root-helpers";
import { normalizeThemeMode } from "../lib/app-utils";
import { normalizeUnifiedApiConfigs } from "../lib/unified-api-config";
import { wanjuanCheckForUpdate, wanjuanChildWindowRefs, wanjuanGetOrCreateDeviceId, wanjuanVerifyActivationCode } from "../lib/collaboration";
import { wanjuanNormalizeSeedanceVirtualPortraits } from "../lib/seedance";
declare const chrome: any;

interface UsePluginEnvEffectDeps {
  _e: any;
  localforageModule: any;
  normalizeStoredGlobalConfigs: any;
  projectHydratedRef: Ref;
  repairXSeeVeoReferenceVideoBindings: any;
  setActiveProjectId: SetAny;
  setActiveStoredGlobalConfigId: SetAny;
  setActiveView: SetAny;
  setAdvancedSettingsUnlocked: SetAny;
  setAgentConversations: SetAny;
  setAgentItems: SetAny;
  setApiConfigs: SetAny;
  setAppLanguage: SetAny;
  setAudioApiConfigId: SetAny;
  setAudioApiKey: SetAny;
  setAudioApiUrl: SetAny;
  setAudioModelApiBindings: SetAny;
  setAudioModelProtocolBindings: SetAny;
  setAudioModels: SetAny;
  setAutoDownloadGeneratedResults: SetAny;
  setBackupExportSelection: SetAny;
  setConfigButlerApiKey: SetAny;
  setConfigButlerApiUrl: SetAny;
  setConfigButlerDocUrl: SetAny;
  setConfigButlerMode: SetAny;
  setConfigButlerModel: SetAny;
  setConfigButlerProtocol: SetAny;
  setConfigButlerRepairHistory: SetAny;
  setConfigButlerTargetApiConfigId: SetAny;
  setConfigButlerTargetCategory: SetAny;
  setCurrentPlatform: SetAny;
  setCustomPublicUploadConfig: SetAny;
  setDailyUsageCount: SetAny;
  setDeviceId: SetAny;
  setDownloadDirectory: SetAny;
  setEdges: SetAny;
  setGlobalTasks: SetAny;
  setHasCurrentTab: SetAny;
  setImageApiConfigId: SetAny;
  setImageApiKey: SetAny;
  setImageApiUrl: SetAny;
  setImageCompatResolutions: SetAny;
  setImageModelApiBindings: SetAny;
  setImageModelProtocolBindings: SetAny;
  setImageModels: SetAny;
  setIsLoading: SetAny;
  setIsPluginEnv: SetAny;
  setIsReady: SetAny;
  setLayeredRunConcurrencyOptions: SetAny;
  setLayeredRunMaxConcurrency: SetAny;
  setMaxPollingDuration: SetAny;
  setMembership: SetAny;
  setModelProtocolRegistry: SetAny;
  setPerformanceProfile: SetAny;
  setPollingInterval: SetAny;
  setPresetPrompts: SetAny;
  setProjectGroups: SetAny;
  setProjects: SetAny;
  setQiniuConfig: SetAny;
  setSeedanceDurations: SetAny;
  setSeedanceEnableWebSearch: SetAny;
  setSeedanceGenerateAudio: SetAny;
  setSeedanceModel: SetAny;
  setSeedanceRatios: SetAny;
  setSeedanceResolutions: SetAny;
  setSeedanceUploadMode: SetAny;
  setSeedanceVirtualPortraits: SetAny;
  setSeedanceWatermark: SetAny;
  setSelectedAgentId: SetAny;
  setStorageOptimizationEnabled: SetAny;
  setStorageOptimizationPaused: SetAny;
  setStoredGlobalConfigs: SetAny;
  setTextApiConfigId: SetAny;
  setTextApiKey: SetAny;
  setTextApiUrl: SetAny;
  setTextModelApiBindings: SetAny;
  setTextModelProtocolBindings: SetAny;
  setThemeMode: SetAny;
  setTianjiSeedanceModel: SetAny;
  setTianjiSeedanceSettingsMode: SetAny;
  setTongyiWanxiangDurations: SetAny;
  setTongyiWanxiangEditModels: SetAny;
  setTongyiWanxiangImageModels: SetAny;
  setTongyiWanxiangRatios: SetAny;
  setTongyiWanxiangReferenceImageModels: SetAny;
  setTongyiWanxiangResolutions: SetAny;
  setTongyiWanxiangTextModels: SetAny;
  setTosConfig: SetAny;
  setTransitGridCols: SetAny;
  setTransitResources: SetAny;
  setTtsMusicModel: SetAny;
  setUpdateInfo: SetAny;
  setUsers: SetAny;
  setVideoApiConfigId: SetAny;
  setVideoApiKey: SetAny;
  setVideoApiUrl: SetAny;
  setVideoAspectRatios: SetAny;
  setVideoDurations: SetAny;
  setVideoModelApiBindings: SetAny;
  setVideoModelProtocolBindings: SetAny;
  setVideoModelRequestProfilesText: SetAny;
  setVideoModels: SetAny;
  setVideoResolutions: SetAny;
  settingsHydratedRef: Ref;
  showToast2: Toast;
}

export function usePluginEnvEffect(deps: UsePluginEnvEffectDeps) {
  const {
    _e,
    localforageModule,
    normalizeStoredGlobalConfigs,
    projectHydratedRef,
    repairXSeeVeoReferenceVideoBindings,
    setActiveProjectId,
    setActiveStoredGlobalConfigId,
    setActiveView,
    setAdvancedSettingsUnlocked,
    setAgentConversations,
    setAgentItems,
    setApiConfigs,
    setAppLanguage,
    setAudioApiConfigId,
    setAudioApiKey,
    setAudioApiUrl,
    setAudioModelApiBindings,
    setAudioModelProtocolBindings,
    setAudioModels,
    setAutoDownloadGeneratedResults,
    setBackupExportSelection,
    setConfigButlerApiKey,
    setConfigButlerApiUrl,
    setConfigButlerDocUrl,
    setConfigButlerMode,
    setConfigButlerModel,
    setConfigButlerProtocol,
    setConfigButlerRepairHistory,
    setConfigButlerTargetApiConfigId,
    setConfigButlerTargetCategory,
    setCurrentPlatform,
    setCustomPublicUploadConfig,
    setDailyUsageCount,
    setDeviceId,
    setDownloadDirectory,
    setEdges,
    setGlobalTasks,
    setHasCurrentTab,
    setImageApiConfigId,
    setImageApiKey,
    setImageApiUrl,
    setImageCompatResolutions,
    setImageModelApiBindings,
    setImageModelProtocolBindings,
    setImageModels,
    setIsLoading,
    setIsPluginEnv,
    setIsReady,
    setLayeredRunConcurrencyOptions,
    setLayeredRunMaxConcurrency,
    setMaxPollingDuration,
    setMembership,
    setModelProtocolRegistry,
    setPerformanceProfile,
    setPollingInterval,
    setPresetPrompts,
    setProjectGroups,
    setProjects,
    setQiniuConfig,
    setSeedanceDurations,
    setSeedanceEnableWebSearch,
    setSeedanceGenerateAudio,
    setSeedanceModel,
    setSeedanceRatios,
    setSeedanceResolutions,
    setSeedanceUploadMode,
    setSeedanceVirtualPortraits,
    setSeedanceWatermark,
    setSelectedAgentId,
    setStorageOptimizationEnabled,
    setStorageOptimizationPaused,
    setStoredGlobalConfigs,
    setTextApiConfigId,
    setTextApiKey,
    setTextApiUrl,
    setTextModelApiBindings,
    setTextModelProtocolBindings,
    setThemeMode,
    setTianjiSeedanceModel,
    setTianjiSeedanceSettingsMode,
    setTongyiWanxiangDurations,
    setTongyiWanxiangEditModels,
    setTongyiWanxiangImageModels,
    setTongyiWanxiangRatios,
    setTongyiWanxiangReferenceImageModels,
    setTongyiWanxiangResolutions,
    setTongyiWanxiangTextModels,
    setTosConfig,
    setTransitGridCols,
    setTransitResources,
    setTtsMusicModel,
    setUpdateInfo,
    setUsers,
    setVideoApiConfigId,
    setVideoApiKey,
    setVideoApiUrl,
    setVideoAspectRatios,
    setVideoDurations,
    setVideoModelApiBindings,
    setVideoModelProtocolBindings,
    setVideoModelRequestProfilesText,
    setVideoModels,
    setVideoResolutions,
    settingsHydratedRef,
    showToast2,
  } = deps;
  useEffect(() => {
      let isExtension = typeof chrome < `u` && chrome.runtime && chrome.runtime.id;
      (setIsPluginEnv(!!isExtension),
        isExtension &&
        chrome.tabs.getCurrent((currentTab) => {
          currentTab && setHasCurrentTab(true);
        }));
      let deviceId2 = wanjuanGetOrCreateDeviceId();
      (setDeviceId(deviceId2),
        (async () => {
          let updateInfo2 = await wanjuanCheckForUpdate(
            typeof chrome < `u` && chrome.runtime && chrome.runtime.getManifest ?
            chrome.runtime.getManifest().version :
            `1.0`,
          );
          updateInfo2.hasUpdate && (setUpdateInfo(updateInfo2), showToast2(`发现新版本 v${updateInfo2.version}`));
        })());
      let timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 2e3);
      if (isExtension) {
        (chrome.tabs.query({
            active: true,
            currentWindow: true
          }, (tabs) => {
            if (tabs && tabs.length > 0) {
              let tab = tabs[0];
              setCurrentPlatform({
                title: tab.title || `当前平台`,
                favIconUrl: tab.favIconUrl || ``,
                url: tab.url || ``,
              });
            }
          }),
          chrome.tabs.onUpdated.addListener((updatedTabId, changeInfo, tab) => {
            changeInfo.status === `complete` &&
              tab.active &&
              setCurrentPlatform({
                title: tab.title || `当前平台`,
                favIconUrl: tab.favIconUrl || ``,
                url: tab.url || ``,
              });
          }),
          chrome.tabs.onActivated.addListener((activeInfo) => {
            chrome.tabs.get(activeInfo.tabId, (tab) => {
              tab &&
                setCurrentPlatform({
                  title: tab.title || `当前平台`,
                  favIconUrl: tab.favIconUrl || ``,
                  url: tab.url || ``,
                });
            });
          }));
        try {
          chrome.storage.local.get([`users`], (result) => {
            (chrome.runtime.lastError &&
              (console.error(chrome.runtime.lastError),
                alert(
                  `Storage Error: ` + JSON.stringify(chrome.runtime.lastError),
                )),
              result && result.users && result.users.length > 0 ?
              setUsers(result.users) :
              (setUsers(wanjuanChildWindowRefs), chrome.storage.local.set({
                users: wanjuanChildWindowRefs
              })),
              chrome.storage.local.get(
                [`transitResources`, `transitGridCols`],
                async (result2) => {
                  try {
                    let storedResources = await localforageModule.default.getItem(`transitResources`);
                    if (storedResources && Array.isArray(storedResources) && storedResources.length > 0)
                      if (
                        result2.transitResources &&
                        Array.isArray(result2.transitResources) &&
                        result2.transitResources.length > 0
                      ) {
                        let newResources = result2.transitResources.filter(
                          (resource) => !storedResources.some((existingResource) => existingResource.id === resource.id),
                        );
                        if (newResources.length > 0) {
                          let mergedResources = [...newResources, ...storedResources];
                          (setTransitResources(mergedResources),
                            localforageModule.default
                            .setItem(`transitResources`, mergedResources)
                            .catch((error) => console.error(error)));
                        } else setTransitResources(storedResources);
                      } else setTransitResources(storedResources);
                    else
                      result2.transitResources &&
                      (setTransitResources(result2.transitResources),
                        localforageModule.default.setItem(
                          `transitResources`,
                          result2.transitResources,
                        ));
                  } catch (error) {
                    (console.error(
                        `Failed to load transitResources from localforage`,
                        error,
                      ),
                      result2.transitResources && setTransitResources(result2.transitResources));
                  }
                  result2.transitGridCols && setTransitGridCols(result2.transitGridCols);
                },
              ),
              chrome.storage.local.get(
                [
                  `projects`,
                  `projectGroups`,
                  `presetPrompts`,
                  `globalTasks`,
                  `customNodeTemplates`,
                ],
                (result2) => {
                  (result2.projects && result2.projects.length > 0 ?
                    (setProjects(result2.projects),
                      Array.isArray(result2.projectGroups) && setProjectGroups(result2.projectGroups),
                      chrome.storage.local.get([`lastOpenedProjectId`], (result3) => {
                        let lastOpenedProjectId =
                          result3.lastOpenedProjectId ||
                          localStorage.getItem(`lastOpenedProjectId`);
                        (lastOpenedProjectId && result2.projects.some((project) => project.id === lastOpenedProjectId) ?
                          setActiveProjectId(lastOpenedProjectId) :
                          setActiveProjectId(result2.projects[0].id),
                          (projectHydratedRef.current = true),
                          setTimeout(() => setIsReady(true), 100));
                      })) :
                    ((projectHydratedRef.current = true), setTimeout(() => setIsReady(true), 100)),
                    result2.presetPrompts &&
                    result2.presetPrompts.length > 0 &&
                    setPresetPrompts(result2.presetPrompts),
                    result2.globalTasks && setGlobalTasks(compactGlobalTasks(result2.globalTasks)),
                    result2.customNodeTemplates && setEdges(result2.customNodeTemplates));
                },
              ),
              chrome.storage.local.get(
                [
                  `apiUrl`,
                  `apiKey`,
                  `textApiUrl`,
                  `textApiKey`,
                  `imageApiUrl`,
                  `imageApiKey`,
                  `videoApiUrl`,
                  `videoApiKey`,
                  `audioApiUrl`,
                  `audioApiKey`,
                  `membership`,
	                  `textModel`,
	                  `drawingModel`,
	                  `imageCompatResolutions`,
	                  `videoModel`,
                  `videoDurations`,
                  `videoResolutions`,
                  `videoAspectRatios`,
                  `videoModelRequestProfiles`,
                  `seedanceModel`,
                  `tianjiSeedanceModel`,
                  `seedanceDurations`,
                  `seedanceResolutions`,
                  `seedanceRatios`,
                  `seedanceGenerateAudio`,
                  `seedanceWatermark`,
                  `seedanceEnableWebSearch`,
                  `seedanceVirtualPortraits`,
                  `tianjiSeedanceSettingsMode`,
                  `seedanceUploadMode`,
                  `tosConfig`,
                  `customPublicUploadConfig`,
                  `qiniuConfig`,
                  `themeMode`,
                  `appLanguage`,
                  `uiLanguage`,
                  `downloadDirectory`,
                  `autoDownloadGeneratedResults`,
                  `storageOptimizationEnabled`,
                  `storageOptimizationPaused`,
                  `backupExportSelection`,
                  `backupImportSelection`,
                  `advancedSettingsUnlocked`,
                  `audioModel`,
                  `ttsMusicModel`,
                  `dailyGenerationsUsed`,
                  `dailyGenerationsDate`,
                  `apiConfigs`,
                  `textApiConfigId`,
                  `imageApiConfigId`,
                  `videoApiConfigId`,
                  `audioApiConfigId`,
                  `modelProtocolRegistry`,
                  `configButlerApiUrl`,
	                  `configButlerApiKey`,
	                  `configButlerProtocol`,
	                  `configButlerModel`,
	                  `configButlerDocUrl`,
	        `configButlerMode`,
        `configButlerTargetCategory`,
        `configButlerTargetApiConfigId`,
        `configButlerRepairHistory`,
                  `storedGlobalConfigs`,
                  `activeStoredGlobalConfigId`,
                  `jixinBuiltinBaseConfigVersion`,
                  `textModelApiBindings`,
                  `textModelProtocolBindings`,
                  `imageModelApiBindings`,
                  `imageModelProtocolBindings`,
                  `videoModelProtocolBindings`,
	                  `videoModelApiBindings`,
	                  `audioModelProtocolBindings`,
	                  `audioModelApiBindings`,
	                  `globalPollingInterval`,
                  `globalMaxPollingDuration`,
                  `layeredRunConcurrencyOptions`,
                  `layeredRunMaxConcurrency`,
                  `wanjuanPerformanceProfile`,
                  `agents`,
                  `selectedAgentId`,
                  `agentConversations`,
                ],
                (settings) => {
                  if (settings.jixinBuiltinBaseConfigVersion !== WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION) {
                    let hasUserModelConfiguration = wanjuanHasUserModelConfiguration(settings),
                      hasUserAgentConfiguration = wanjuanHasUserAgentConfiguration(settings),
                      shouldSeedJixinBuiltinConfig = !hasUserModelConfiguration && !hasUserAgentConfiguration,
                      shouldSeedBuiltinAgents = shouldSeedJixinBuiltinConfig;
                    if (shouldSeedJixinBuiltinConfig) {
                      let seededSettings = wanjuanBuildJixinBuiltinBasePatch(settings),
                        builtinStoredConfig = wanjuanBuildJixinBuiltinStoredGlobalConfig(seededSettings);
                      settings = {
                        ...seededSettings,
                        storedGlobalConfigs: [builtinStoredConfig],
                        activeStoredGlobalConfigId: builtinStoredConfig.id,
                        jixinBuiltinBaseConfigVersion: WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION,
                      };
                      if (shouldSeedBuiltinAgents) {
                        settings.agents = wanjuanCloneBuiltinAgentItems();
                        settings.selectedAgentId = WANJUAN_BUILTIN_AGENT_ITEMS[0]?.id || ``;
                        settings.agentConversations = wanjuanCloneBuiltinAgentConversations();
                      }
                    } else settings = wanjuanSyncJixinBuiltinStoredGlobalConfig({
		                      ...wanjuanApplySeedanceOptionDefaults(wanjuanApplyJixinBuiltinProtocolPatch(settings)),
		                      jixinBuiltinBaseConfigVersion: WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION,
		                    });
                    if (typeof chrome < `u`) {
                      let storagePatch = {
                        jixinBuiltinBaseConfigVersion: WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION,
                      };
	                      Object.assign(storagePatch, shouldSeedJixinBuiltinConfig ? {
	                          apiConfigs: settings.apiConfigs,
	                          textApiConfigId: settings.textApiConfigId,
	                          imageApiConfigId: settings.imageApiConfigId,
                          videoApiConfigId: settings.videoApiConfigId,
                          audioApiConfigId: settings.audioApiConfigId,
                          textApiUrl: settings.textApiUrl,
                          imageApiUrl: settings.imageApiUrl,
                          videoApiUrl: settings.videoApiUrl,
                          audioApiUrl: settings.audioApiUrl,
                          textModel: settings.textModel,
                          drawingModel: settings.drawingModel,
                          videoModel: settings.videoModel,
                          ttsMusicModel: settings.ttsMusicModel,
                          seedanceModel: settings.seedanceModel,
                          tianjiSeedanceModel: settings.tianjiSeedanceModel,
                          seedanceDurations: settings.seedanceDurations,
                          seedanceResolutions: settings.seedanceResolutions,
                          seedanceRatios: settings.seedanceRatios,
                          tongyiWanxiangTextModels: settings.tongyiWanxiangTextModels,
                          tongyiWanxiangReferenceImageModels: settings.tongyiWanxiangReferenceImageModels,
                          tongyiWanxiangImageModels: settings.tongyiWanxiangImageModels,
                          tongyiWanxiangEditModels: settings.tongyiWanxiangEditModels,
                          tongyiWanxiangDurations: settings.tongyiWanxiangDurations,
                          tongyiWanxiangResolutions: settings.tongyiWanxiangResolutions,
                          tongyiWanxiangRatios: settings.tongyiWanxiangRatios,
                          videoResolutions: settings.videoResolutions,
                          videoAspectRatios: settings.videoAspectRatios,
                          modelProtocolRegistry: settings.modelProtocolRegistry,
                          textModelApiBindings: settings.textModelApiBindings,
                          textModelProtocolBindings: settings.textModelProtocolBindings,
                          imageModelApiBindings: settings.imageModelApiBindings,
                          imageModelProtocolBindings: settings.imageModelProtocolBindings,
                          videoModelApiBindings: settings.videoModelApiBindings,
                          videoModelProtocolBindings: settings.videoModelProtocolBindings,
                          audioModelApiBindings: settings.audioModelApiBindings,
                          audioModelProtocolBindings: settings.audioModelProtocolBindings,
	                          storedGlobalConfigs: settings.storedGlobalConfigs,
	                          activeStoredGlobalConfigId: settings.activeStoredGlobalConfigId,
	                        } : {
	                          modelProtocolRegistry: settings.modelProtocolRegistry,
	                          textModelApiBindings: settings.textModelApiBindings,
	                          textModelProtocolBindings: settings.textModelProtocolBindings,
	                          imageModelApiBindings: settings.imageModelApiBindings,
	                          imageModelProtocolBindings: settings.imageModelProtocolBindings,
	                          videoModelApiBindings: settings.videoModelApiBindings,
	                          videoModelProtocolBindings: settings.videoModelProtocolBindings,
	                          audioModelApiBindings: settings.audioModelApiBindings,
	                          audioModelProtocolBindings: settings.audioModelProtocolBindings,
	                          seedanceResolutions: settings.seedanceResolutions,
	                          seedanceRatios: settings.seedanceRatios,
	                          storedGlobalConfigs: settings.storedGlobalConfigs,
	                          activeStoredGlobalConfigId: settings.activeStoredGlobalConfigId,
	                        });
                      shouldSeedBuiltinAgents &&
                        Object.assign(storagePatch, {
                          agents: settings.agents,
                          selectedAgentId: settings.selectedAgentId,
                          agentConversations: settings.agentConversations,
                        });
	                      chrome.storage?.local?.set(storagePatch);
                    }
                  }
                  let jixinDocUrlStoragePatch = {};
                  wanjuanIsLegacyJixinDocUrl(settings.configButlerDocUrl) &&
                    (settings = {
                        ...settings,
                        configButlerDocUrl: WANJUAN_JIXIN_DEFAULT_DOC_URL,
                      },
                      jixinDocUrlStoragePatch.configButlerDocUrl = WANJUAN_JIXIN_DEFAULT_DOC_URL);
                  Object.keys(jixinDocUrlStoragePatch).length > 0 &&
                    typeof chrome < `u` &&
                    chrome.storage?.local?.set(jixinDocUrlStoragePatch);
	                  let storedAdvancedSettingsUnlocked = true;
                  (Array.isArray(settings.apiConfigs) &&
                    (() => {
                      let normalizedApiConfigs = normalizeUnifiedApiConfigs(settings.apiConfigs);
                      setApiConfigs(normalizedApiConfigs);
                      JSON.stringify(normalizedApiConfigs) !== JSON.stringify(settings.apiConfigs) &&
                        chrome.storage.local.set({
                          apiConfigs: normalizedApiConfigs
                        });
                    })(),

                    settings.textApiConfigId && setTextApiConfigId(settings.textApiConfigId),
                    storedAdvancedSettingsUnlocked && setAdvancedSettingsUnlocked(true),
                    settings.imageApiConfigId && setImageApiConfigId(settings.imageApiConfigId),
                    settings.videoApiConfigId && setVideoApiConfigId(settings.videoApiConfigId),
                    settings.audioApiConfigId && setAudioApiConfigId(settings.audioApiConfigId),
                    settings.globalPollingInterval !== undefined &&
                    setPollingInterval(settings.globalPollingInterval),
                    settings.globalMaxPollingDuration !== undefined &&
                    setMaxPollingDuration(settings.globalMaxPollingDuration),
                    settings.layeredRunConcurrencyOptions &&
                    setLayeredRunConcurrencyOptions(
                      settings.layeredRunConcurrencyOptions,
                    ),
                    settings.layeredRunMaxConcurrency !== undefined &&
                    setLayeredRunMaxConcurrency(
                      Number(settings.layeredRunMaxConcurrency) || 1,
                    ),
                    settings.wanjuanPerformanceProfile &&
                    setPerformanceProfile(WanJuanNormalizePerformanceProfile(settings.wanjuanPerformanceProfile)),
                    settings.textApiUrl ? setTextApiUrl(settings.textApiUrl) : settings.apiUrl && setTextApiUrl(settings.apiUrl),
                    settings.textApiKey ? setTextApiKey(settings.textApiKey) : settings.apiKey && setTextApiKey(settings.apiKey),
                    settings.imageApiUrl ?
                    setImageApiUrl(settings.imageApiUrl) :
                    settings.apiUrl && setImageApiUrl(settings.apiUrl),
                    settings.imageApiKey ?
                    setImageApiKey(settings.imageApiKey) :
                    settings.apiKey && setImageApiKey(settings.apiKey),
                    settings.videoApiUrl && setVideoApiUrl(settings.videoApiUrl),
                    settings.videoApiKey && setVideoApiKey(settings.videoApiKey),
                    settings.audioApiUrl && setAudioApiUrl(settings.audioApiUrl),
                    settings.audioApiKey && setAudioApiKey(settings.audioApiKey),
                    settings.textModel && _e(settings.textModel),
	                    settings.drawingModel && setImageModels(settings.drawingModel),
	                    settings.imageCompatResolutions &&
	                    setImageCompatResolutions(settings.imageCompatResolutions),
		                    (() => {
		                      let repairedSettings = repairXSeeVeoReferenceVideoBindings(settings, settings.videoApiUrl || ``);
		                      (repairedSettings.modelProtocolRegistry &&
		                        typeof repairedSettings.modelProtocolRegistry == `object` &&
		                        setModelProtocolRegistry(repairedSettings.modelProtocolRegistry),
		                        repairedSettings.videoModelProtocolBindings &&
		                        typeof repairedSettings.videoModelProtocolBindings == `object` &&
		                        setVideoModelProtocolBindings(repairedSettings.videoModelProtocolBindings),
		                        (JSON.stringify(repairedSettings.modelProtocolRegistry || {}) !== JSON.stringify(settings.modelProtocolRegistry || {}) ||
		                          JSON.stringify(repairedSettings.videoModelProtocolBindings || {}) !== JSON.stringify(settings.videoModelProtocolBindings || {})) &&
		                        typeof chrome < `u` &&
		                        chrome.storage?.local?.set({
		                          modelProtocolRegistry: repairedSettings.modelProtocolRegistry,
		                          videoModelProtocolBindings: repairedSettings.videoModelProtocolBindings,
		                        }));
		                    })(),
	                    settings.configButlerApiUrl &&
                    setConfigButlerApiUrl(settings.configButlerApiUrl),
                    settings.configButlerApiKey &&
                    setConfigButlerApiKey(settings.configButlerApiKey),
	                    settings.configButlerProtocol &&
	                    setConfigButlerProtocol(
	                      settings.configButlerProtocol === `gemini` ?
	                      `openai` :
	                      settings.configButlerProtocol,
	                    ),
			                    settings.configButlerModel &&
			                    setConfigButlerModel(
			                      settings.configButlerModel === `gemini-3-flash-preview` ?
			                      `gpt-5.5` :
			                      settings.configButlerModel,
			                    ),
		                    settings.configButlerDocUrl !== undefined &&
		                    setConfigButlerDocUrl(settings.configButlerDocUrl),
		                    settings.configButlerMode &&
	                    setConfigButlerMode(
	                      settings.configButlerMode === `batch` ? `batch` : `single`,
	                    ),
	                    settings.configButlerTargetCategory &&
                    setConfigButlerTargetCategory(
                      settings.configButlerTargetCategory,
                    ),
	                    settings.configButlerTargetApiConfigId &&
	                    setConfigButlerTargetApiConfigId(
	                      settings.configButlerTargetApiConfigId === `vectorengine` ?
	                      `default` :
	                      settings.configButlerTargetApiConfigId,
	                    ),
	                    Array.isArray(settings.configButlerRepairHistory) &&
	                    setConfigButlerRepairHistory(settings.configButlerRepairHistory.slice(0, 50)),
	                    Array.isArray(settings.storedGlobalConfigs) &&
	                    (() => {
	                      let normalizedGlobalConfigs = normalizeStoredGlobalConfigs(settings.storedGlobalConfigs);
	                      (setStoredGlobalConfigs(normalizedGlobalConfigs),
	                        JSON.stringify(normalizedGlobalConfigs) !== JSON.stringify(settings.storedGlobalConfigs) &&
	                        typeof chrome < `u` &&
	                        chrome.storage?.local?.set({
	                          storedGlobalConfigs: normalizedGlobalConfigs,
	                        }));
	                    })(),
                    settings.activeStoredGlobalConfigId &&
                    setActiveStoredGlobalConfigId(settings.activeStoredGlobalConfigId),
                    settings.videoModel && setVideoModels(settings.videoModel),
                    settings.videoDurations && setVideoDurations(settings.videoDurations),
                    settings.videoResolutions &&
                    setVideoResolutions(settings.videoResolutions),
                    settings.videoAspectRatios &&
                    setVideoAspectRatios(settings.videoAspectRatios),
                    settings.videoModelRequestProfiles &&
                    setVideoModelRequestProfilesText(
                      typeof settings.videoModelRequestProfiles == `string` ?
                      settings.videoModelRequestProfiles :
                      JSON.stringify(settings.videoModelRequestProfiles, null, 2),
                    ),
                    settings.seedanceModel && setSeedanceModel(settings.seedanceModel),
                    settings.tianjiSeedanceModel ?
                    setTianjiSeedanceModel(settings.tianjiSeedanceModel) :
                    setTianjiSeedanceModel(wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS)),
                    settings.seedanceDurations &&
                    setSeedanceDurations(settings.seedanceDurations),
                    settings.seedanceResolutions &&
                    setSeedanceResolutions(settings.seedanceResolutions),
                    settings.seedanceRatios && setSeedanceRatios(settings.seedanceRatios),
                    settings.seedanceGenerateAudio !== undefined &&
                    setSeedanceGenerateAudio(settings.seedanceGenerateAudio),
                    settings.seedanceWatermark !== undefined &&
                    setSeedanceWatermark(settings.seedanceWatermark),
                    settings.seedanceEnableWebSearch !== undefined &&
                    setSeedanceEnableWebSearch(settings.seedanceEnableWebSearch),
                    Array.isArray(settings.seedanceVirtualPortraits) &&
                    setSeedanceVirtualPortraits(
                      wanjuanNormalizeSeedanceVirtualPortraits(settings.seedanceVirtualPortraits),
                    ),
                    settings.tianjiSeedanceSettingsMode !== undefined &&
                    setTianjiSeedanceSettingsMode(
                      storedAdvancedSettingsUnlocked && settings.tianjiSeedanceSettingsMode === `tianji` ?
                      `tianji` :
                      `official`,
                    ),
                    settings.tongyiWanxiangTextModels &&
                    setTongyiWanxiangTextModels(settings.tongyiWanxiangTextModels),
                    settings.tongyiWanxiangReferenceImageModels &&
                    setTongyiWanxiangReferenceImageModels(
                      settings.tongyiWanxiangReferenceImageModels,
                    ),
                    settings.tongyiWanxiangImageModels &&
                    setTongyiWanxiangImageModels(settings.tongyiWanxiangImageModels),
                    settings.tongyiWanxiangEditModels &&
                    setTongyiWanxiangEditModels(settings.tongyiWanxiangEditModels),
                    settings.tongyiWanxiangDurations &&
                    setTongyiWanxiangDurations(settings.tongyiWanxiangDurations),
                    settings.tongyiWanxiangResolutions &&
                    setTongyiWanxiangResolutions(settings.tongyiWanxiangResolutions),
                    settings.tongyiWanxiangRatios &&
                    setTongyiWanxiangRatios(settings.tongyiWanxiangRatios),
                    settings.seedanceUploadMode &&
                    setSeedanceUploadMode(settings.seedanceUploadMode),
                    settings.tosConfig &&
                    typeof settings.tosConfig == `object` &&
                    setTosConfig((prev) => ({
                      ...prev,
                      ...settings.tosConfig
                    })),
                    settings.customPublicUploadConfig &&
                    typeof settings.customPublicUploadConfig == `object` &&
                    setCustomPublicUploadConfig((prev) => ({
                      ...prev,
                      ...settings.customPublicUploadConfig,
                    })),
                    settings.qiniuConfig &&
                    typeof settings.qiniuConfig == `object` &&
                    setQiniuConfig((prev) => ({
                      ...prev,
                      ...settings.qiniuConfig,
                    })),
                    settings.themeMode && setThemeMode(normalizeThemeMode(settings.themeMode)),
                    (settings.appLanguage || settings.uiLanguage) &&
                    (setAppLanguage(settings.appLanguage || settings.uiLanguage),
                      globalThis.wanjuanI18nRuntime?.setLanguage?.(settings.appLanguage || settings.uiLanguage)),
                    settings.downloadDirectory &&
                    setDownloadDirectory(settings.downloadDirectory),
                    settings.autoDownloadGeneratedResults !== undefined &&
                    setAutoDownloadGeneratedResults(settings.autoDownloadGeneratedResults === true || settings.autoDownloadGeneratedResults === `true` || settings.autoDownloadGeneratedResults === 1),
                    settings.storageOptimizationEnabled === true &&
                    setStorageOptimizationEnabled(true),
                    settings.storageOptimizationPaused === true &&
                    setStorageOptimizationPaused(true),
                    Array.isArray(settings.backupExportSelection) &&
                    settings.backupExportSelection.length > 0 &&
                    setBackupExportSelection(settings.backupExportSelection),
                    settings.audioModel && setAudioModels(settings.audioModel),
                    settings.ttsMusicModel && setTtsMusicModel(settings.ttsMusicModel),
                    Array.isArray(settings.agents) &&
                    settings.agents.length > 0 &&
                    setAgentItems(settings.agents),
                    settings.selectedAgentId && setSelectedAgentId(settings.selectedAgentId),
                    settings.agentConversations &&
                    typeof settings.agentConversations == `object` &&
                    setAgentConversations(settings.agentConversations),
                    settings.textModelApiBindings &&
                    typeof settings.textModelApiBindings == `object` &&
                    setTextModelApiBindings(settings.textModelApiBindings),
                    settings.textModelProtocolBindings &&
                    typeof settings.textModelProtocolBindings == `object` &&
                    setTextModelProtocolBindings(
                      settings.textModelProtocolBindings,
                    ),
                    settings.imageModelApiBindings &&
                    typeof settings.imageModelApiBindings == `object` &&
                    setImageModelApiBindings(settings.imageModelApiBindings),
                    settings.imageModelProtocolBindings &&
                    typeof settings.imageModelProtocolBindings == `object` &&
                    setImageModelProtocolBindings(
                      settings.imageModelProtocolBindings,
                    ),
                    settings.videoModelApiBindings &&
                    typeof settings.videoModelApiBindings == `object` &&
                    setVideoModelApiBindings(settings.videoModelApiBindings));
	                  settings.audioModelProtocolBindings &&
	                    typeof settings.audioModelProtocolBindings == `object` &&
	                    setAudioModelProtocolBindings(
	                      settings.audioModelProtocolBindings,
	                    );
	                  settings.audioModelApiBindings &&
	                    typeof settings.audioModelApiBindings == `object` &&
	                    setAudioModelApiBindings(settings.audioModelApiBindings);
	                  let dailyLimitKey = `daily-limit-${new Date().toISOString().split(`T`)[0]}`;
                  if (
                    (setDailyUsageCount(parseInt(localStorage.getItem(dailyLimitKey) || `0`)), settings.membership)
                  ) {
                    let now = Date.now();
                    settings.membership.expiry > now ?
                      (setMembership(settings.membership),
                        wanjuanVerifyActivationCode(settings.membership.code, deviceId2).then((result2) => {
                          result2.valid ||
                            (setMembership({
                                type: `FREE`,
                                expiry: 0
                              }),
                              chrome.storage.local.remove(`membership`));
                        })) :
                      (setMembership({
                          type: `FREE`,
                          expiry: 0
                        }),
                        chrome.storage.local.remove(`membership`));
                  }
                  settingsHydratedRef.current = true;
                },
              ),
              chrome.runtime.onMessage.addListener((message, messageSender, sendResponse) => {
                message.action === `resourceAdded` &&
                  (setTransitResources((prevResources) => {
                      if (prevResources.find((resource) => resource.id === message.resource.id)) return prevResources;
                      let updatedResources = [message.resource, ...prevResources];
                      return (
                        localforageModule.default
                        .setItem(`transitResources`, updatedResources)
                        .catch((error) =>
                          console.error(`localforage save error`, error),
                        ),
                        updatedResources
                      );
                    }),
                    setActiveView(`transit`));
              }),
              setIsLoading(false),
              clearTimeout(timeoutId));
          });
        } catch (error) {
          (console.error(`Storage get error:`, error),
            (settingsHydratedRef.current = true),
            (projectHydratedRef.current = true),
            setIsLoading(false),
            setIsReady(true),
            clearTimeout(timeoutId));
        }
      } else
        ((settingsHydratedRef.current = true),
          (projectHydratedRef.current = true),
          setUsers(wanjuanChildWindowRefs),
          setIsLoading(false),
          setIsReady(true),
          clearTimeout(timeoutId));
      return () => clearTimeout(timeoutId);
    }, []);
}
