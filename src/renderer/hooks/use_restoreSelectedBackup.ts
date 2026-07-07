// @ts-nocheck
/**
 * restoreSelectedBackup。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildBackupRestoreReport, cloneBackupValue, extractProjectPortableDataRefs, normalizeBackupSettingsSections, normalizeProjectLocalforagePayload } from "../lib/backup";
import { buildProjectMediaFileUrl } from "../lib/resource";
import { mergeTransitResourceEntries } from "../lib/app-root-helpers";
import { normalizeAgentIdSelection } from "../lib/agent";
import { normalizeModuleSelection, normalizeProjectIdSelection, normalizeProjectResourceMap } from "../lib/project-normalize";
declare const chrome: any;

export function use_restoreSelectedBackup(deps: any) {
  const {
    PROJECT_ASSET_MANIFEST_STORAGE_PREFIX,
    TRANSIT_RESOURCES_STORAGE_KEY,
    extractProjectAssetRefs,
    getAvailableBackupModules,
    getBackupSettingsSectionMap,
    getDesktopProjectMirrorStorageKey,
    getProjectCanvasStorageKey,
    normalizeBackupModules,
    normalizeResourceLocalforagePayload,
    agentConversations,
    projectGroups,
    projects,
    selectedAgentId,
    transitResources,
  } = deps;
  const restoreSelectedBackup = async (backup, moduleSelection, options = {}) => {
                              let modules = normalizeBackupModules(backup),
                                availableModules = getAvailableBackupModules(backup),
                                selectedModules = normalizeModuleSelection(moduleSelection, availableModules),
                                restoreSettings = selectedModules.includes(`settings`),
                                restoreProjects = selectedModules.includes(`projects`),
                                restoreResources = selectedModules.includes(`resources`),
                                shouldRestoreAgents = selectedModules.includes(`agents`),
                                settingsStorage =
                                modules.settings?.chromeStorage && typeof modules.settings.chromeStorage == `object` ?
                                modules.settings.chromeStorage :
                                {},
                                projectsStorage =
                                modules.projects?.chromeStorage && typeof modules.projects.chromeStorage == `object` ?
                                modules.projects.chromeStorage :
                                {},
                                projectPayload = normalizeProjectLocalforagePayload(modules.projects?.localforage),
                                resourcePayload = Object.keys(normalizeResourceLocalforagePayload(modules.resources?.localforage)).length ?
                                normalizeResourceLocalforagePayload(modules.resources?.localforage) :
                                normalizeResourceLocalforagePayload(modules.projects?.bundledResources),
                                settingsSectionMap = getBackupSettingsSectionMap(settingsStorage),
                                selectedSections = normalizeBackupSettingsSections(
                                  options.settingsSections,
                                  settingsSectionMap.availableSections,
                                ),
                                mergedSections = selectedSections.reduce((acc, sectionKey) => ({
                                  ...acc,
                                  ...(settingsSectionMap.sections[sectionKey] || {})
                                }), {}),
                                projects2 = Array.isArray(projectsStorage.projects) ? cloneBackupValue(projectsStorage.projects) : [],
                                selectedProjectIds = normalizeProjectIdSelection(
                                  options.projectIds,
                                  projects2.map((project) => project.id).filter(Boolean),
                                ),
                                selectedProjects = projects2.filter((project) => selectedProjectIds.includes(project.id)),
                                importedProjectGroups = Array.isArray(projectsStorage.projectGroups) ?
                                cloneBackupValue(projectsStorage.projectGroups) :
                                [],
                                selectedImportGroupIds = new Set(selectedProjects.map((project) => project.groupId).filter(Boolean)),
                                restoredProjectGroups = selectedProjectIds.length === projects2.length ?
                                importedProjectGroups :
                                importedProjectGroups.filter((projectGroup) => selectedImportGroupIds.has(projectGroup.id)),
                                agentChromeStorage =
                                modules.agents?.chromeStorage && typeof modules.agents.chromeStorage == `object` ?
                                modules.agents.chromeStorage :
                                {},
                                importedAgents = Array.isArray(agentChromeStorage.agents) ?
                                cloneBackupValue(agentChromeStorage.agents) :
                                [],
                                importedAgentIds = normalizeAgentIdSelection(
                                  options.agentIds,
                                  importedAgents.map((agent) => agent.id).filter(Boolean),
                                ),
                                selectedImportedAgents = importedAgents.filter((agent) =>
                                  importedAgentIds.includes(agent.id),
                                ),
                                selectedImportedAgentIdSet = new Set(
                                  selectedImportedAgents.map((agent) => agent.id),
                                ),
                                importedAgentConversations =
                                agentChromeStorage.agentConversations &&
                                typeof agentChromeStorage.agentConversations == `object` ?
                                cloneBackupValue(agentChromeStorage.agentConversations) :
                                {},
                                projectResourceMap = normalizeProjectResourceMap(modules.projects?.projectResources),
                                selectedCanvasStates = Object.fromEntries(
                                  selectedProjectIds.filter((projectId) => Object.prototype.hasOwnProperty.call(projectPayload.canvasStates, projectId)).map(
                                    (projectId) => [projectId, cloneBackupValue(projectPayload.canvasStates[projectId])],
                                  ),
                                ),
                                assets = Object.entries(projectPayload.assets || {}).reduce(
                                  (acc, [assetId, asset]) => ({
                                    ...acc,
                                    [assetId]: cloneBackupValue(asset)
                                  }), {},
                                ),
                                transitResources2 = Object.prototype.hasOwnProperty.call(
                                  resourcePayload,
                                  TRANSIT_RESOURCES_STORAGE_KEY,
                                ) ?
                                cloneBackupValue(resourcePayload[TRANSIT_RESOURCES_STORAGE_KEY]) :
                                undefined,
                                mergedTransitResources = undefined,
                                pendingWrites = [];
                              if (restoreSettings || restoreProjects || restoreResources || shouldRestoreAgents)
                                await new Promise((resolvePromise, reject) => {
                                  if (!(typeof chrome < `u` && chrome.storage && chrome.storage.local)) {
                                    reject(Error(`Chrome Storage API 不可用`));
                                    return;
                                  }
                                  chrome.storage.local.get(null, (currentStorage) => {
                                    if (chrome.runtime?.lastError) {
                                      reject(Error(chrome.runtime.lastError.message));
                                      return;
                                    }
                                    let storage = {
                                        ...(currentStorage || {})
                                      },
                                      removedKeys = [];
                                    if (restoreSettings)
                                      for (let [key, value] of Object.entries(mergedSections)) storage[key] = cloneBackupValue(value);
                                    if (restoreProjects) {
                                      let existingProjects = Array.isArray(storage.projects) ? cloneBackupValue(storage.projects) : [],
                                        selectedProjectIdSet = new Set(selectedProjects.map((project) => project.id)),
                                        mergedProjects = [...existingProjects.filter((project) => !selectedProjectIdSet.has(project.id)), ...selectedProjects],
                                        projectGroupsExisting = Array.isArray(storage.projectGroups) ?
                                        cloneBackupValue(storage.projectGroups) :
                                        [],
                                        projectGroupIdSet = new Set(restoredProjectGroups.map((projectGroup) => projectGroup.id)),
                                        projectGroupsMerged = [
                                          ...projectGroupsExisting.filter((projectGroup) => !projectGroupIdSet.has(projectGroup.id)),
                                          ...restoredProjectGroups,
                                        ],
                                        lastOpenedProjectId =
                                        selectedProjectIds.includes(projectsStorage.lastOpenedProjectId) && selectedProjectIdSet.has(projectsStorage.lastOpenedProjectId) ?
                                        projectsStorage.lastOpenedProjectId :
                                        selectedProjects[0]?.id || selectedProjectIds[0] || ``;
                                      ((storage.projects = mergedProjects),
                                        projectGroupsMerged.length > 0 && (storage.projectGroups = projectGroupsMerged),
                                        lastOpenedProjectId ?
                                        (storage.lastOpenedProjectId = lastOpenedProjectId) :
                                        (delete storage.lastOpenedProjectId, removedKeys.push(`lastOpenedProjectId`)),
                                        selectedProjectIds.forEach((projectId) => {
                                          let mirrorStorageKey = getDesktopProjectMirrorStorageKey(projectId);
                                          delete storage[mirrorStorageKey], removedKeys.push(mirrorStorageKey);
                                        }),
                                        Object.entries(selectedCanvasStates).forEach(([projectId, mirrorValue]) => {
                                          storage[getDesktopProjectMirrorStorageKey(projectId)] = cloneBackupValue(mirrorValue);
                                        }));
                                    }
                                    if (restoreResources)
                                      transitResources2 !== undefined ?
                                      ((mergedTransitResources = cloneBackupValue(transitResources2)),
                                        (storage[TRANSIT_RESOURCES_STORAGE_KEY] = cloneBackupValue(mergedTransitResources))) :
                                      (delete storage[TRANSIT_RESOURCES_STORAGE_KEY],
                                        removedKeys.push(TRANSIT_RESOURCES_STORAGE_KEY),
                                        (mergedTransitResources = undefined));
                                    else if (restoreProjects && transitResources2 !== undefined) {
                                      let transitResourceEntries = Array.isArray(storage[TRANSIT_RESOURCES_STORAGE_KEY]) ?
                                        storage[TRANSIT_RESOURCES_STORAGE_KEY] :
                                        [];
                                      ((mergedTransitResources = mergeTransitResourceEntries(transitResources2, transitResourceEntries)),
                                        (storage[TRANSIT_RESOURCES_STORAGE_KEY] = cloneBackupValue(mergedTransitResources)));
                                    } else if (restoreProjects) {
                                      let mergedTransitResources2 = mergeTransitResourceEntries(
                                        selectedProjectIds.flatMap((projectId) => projectResourceMap[projectId] || []),
                                        Array.isArray(storage[TRANSIT_RESOURCES_STORAGE_KEY]) ?
                                        storage[TRANSIT_RESOURCES_STORAGE_KEY] :
                                        [],
                                      );
                                      mergedTransitResources2.length > 0 &&
                                        ((mergedTransitResources = mergedTransitResources2),
                                          (storage[TRANSIT_RESOURCES_STORAGE_KEY] = cloneBackupValue(mergedTransitResources)));
                                    }
                                    if (shouldRestoreAgents) {
                                      let existingAgents = Array.isArray(storage.agents) ? cloneBackupValue(storage.agents) : [],
                                        mergedAgents = [
                                          ...existingAgents.filter((agent) => !selectedImportedAgentIdSet.has(agent.id)),
                                          ...selectedImportedAgents,
                                        ],
                                        existingAgentConversations = storage.agentConversations && typeof storage.agentConversations == `object` ?
                                        cloneBackupValue(storage.agentConversations) :
                                        {};
                                      ((storage.agents = mergedAgents),
                                        (storage.agentConversations = {
                                          ...existingAgentConversations,
                                          ...Object.fromEntries(
                                            importedAgentIds
                                            .filter((agentId) => Object.prototype.hasOwnProperty.call(importedAgentConversations, agentId))
                                            .map((agentId) => [agentId, cloneBackupValue(importedAgentConversations[agentId])]),
                                          ),
                                        }));
                                      let selectedAgentId2 =
                                        typeof agentChromeStorage.selectedAgentId == `string` &&
                                        selectedImportedAgentIdSet.has(agentChromeStorage.selectedAgentId) ?
                                        agentChromeStorage.selectedAgentId :
                                        selectedImportedAgents[0]?.id ||
                                        storage.selectedAgentId ||
                                        mergedAgents[0]?.id ||
                                        ``;
                                      selectedAgentId2 && (storage.selectedAgentId = selectedAgentId2);
                                    }
                                    let persistStorage = () => {
                                      chrome.storage.local.set(storage, () => {
                                        if (chrome.runtime?.lastError) {
                                          reject(Error(chrome.runtime.lastError.message));
                                          return;
                                        }
                                        restoreProjects &&
                                          (storage.lastOpenedProjectId ?
                                            localStorage.setItem(`lastOpenedProjectId`, storage.lastOpenedProjectId) :
                                            localStorage.removeItem(`lastOpenedProjectId`)),
                                          (pendingWrites = removedKeys),
                                          resolvePromise();
                                      });
                                    };
                                    removedKeys.length ?
                                      chrome.storage.local.remove(removedKeys, () => {
                                        if (chrome.runtime?.lastError) {
                                          reject(Error(chrome.runtime.lastError.message));
                                          return;
                                        }
                                        persistStorage();
                                      }) :
                                      persistStorage();
                                  });
                                });
                              if (restoreProjects && localforageModule.default) {
                                let referencedAssetKeys = new Set(),
                                  referencedPortableDataKeys = new Set();
                                for (let projectId of selectedProjectIds) {
                                  let canvasStorageKey = getProjectCanvasStorageKey(projectId);
                                  try {
                                    let projectState = await localforageModule.default.getItem(canvasStorageKey);
                                    (extractProjectAssetRefs(projectState).forEach((assetRef) => referencedAssetKeys.add(assetRef)),
                                      extractProjectPortableDataRefs(projectState).forEach((portableDataRef) => referencedPortableDataKeys.add(portableDataRef)));
                                  } catch (error) {
                                    console.warn(`Failed to inspect existing project state`, error);
                                  }
                                  try {
                                    await localforageModule.default.removeItem(canvasStorageKey);
                                  } catch (error) {
                                    console.warn(`Failed to clear existing project state`, error);
                                  }
                                }
                                for (let storageKey of referencedAssetKeys)
                                  try {
                                    await localforageModule.default.removeItem(storageKey);
                                  } catch (error) {
                                    console.warn(`Failed to clear project asset ref`, storageKey, error);
                                  }
                                for (let assetKey of referencedPortableDataKeys)
                                  try {
                                    referencedAssetKeys.has(assetKey) || (await localforageModule.default.removeItem(assetKey));
                                  } catch (error) {
                                    console.warn(`Failed to clear portable project asset`, assetKey, error);
                                  }
                                for (let [projectId, canvasState] of Object.entries(selectedCanvasStates))
                                  await localforageModule.default.setItem(getProjectCanvasStorageKey(projectId), canvasState);
                                for (let [storageKey, assetEntry] of Object.entries(assets)) {
                                  if (assetEntry && typeof assetEntry == `object` && assetEntry.__wanjuanExternalAssetFile && assetEntry.filePath) {
                                    await localforageModule.default.setItem(storageKey, buildProjectMediaFileUrl(assetEntry.filePath) || assetEntry.filePath);
                                    continue;
                                  }
                                  if (typeof assetEntry == `string` && assetEntry.startsWith(PROJECT_ASSET_MANIFEST_STORAGE_PREFIX)) continue;
                                  await localforageModule.default.setItem(storageKey, assetEntry);
                                }
                              }
                              (restoreResources || (restoreProjects && transitResources2 !== undefined)) &&
                              localforageModule.default &&
                                (mergedTransitResources !== undefined ?
                                  await localforageModule.default.setItem(TRANSIT_RESOURCES_STORAGE_KEY, mergedTransitResources) :
                                  restoreResources && (await localforageModule.default.removeItem(TRANSIT_RESOURCES_STORAGE_KEY)));
                              let restoreReport = buildBackupRestoreReport({
                                modules: selectedModules,
                                settingsSections: selectedSections,
                                projectIds: selectedProjectIds,
                                agentIds: importedAgentIds,
                                canvasStates: selectedCanvasStates,
                                assets: assets,
                                transitResources: mergedTransitResources,
                                projectResources: projectResourceMap,
                              });
                              return {
                                modules: selectedModules,
                                settingsSections: selectedSections,
                                projectIds: selectedProjectIds,
                                agentIds: importedAgentIds,
                                clearedChromeKeys: pendingWrites,
                                report: restoreReport,
                              };
                            };
  return { restoreSelectedBackup };
}
