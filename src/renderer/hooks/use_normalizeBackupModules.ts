// @ts-nocheck
/**
 * normalizeBackupModules。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildProjectResourceMap } from "../lib/app-root-helpers";
import { cloneBackupValue, normalizeBackupSettingsSections, normalizeProjectLocalforagePayload } from "../lib/backup";
import { normalizeAgentIdSelection } from "../lib/agent";
import { normalizeProjectIdSelection, normalizeProjectResourceMap } from "../lib/project-normalize";

interface UseNormalizeBackupModulesDeps {
  AGENT_STORAGE_KEYS: any;
  BACKUP_MODULE_LABELS: any;
  TRANSIT_RESOURCES_STORAGE_KEY: any;
  buildProjectLocalforagePayload: any;
  getBackupSettingsSectionMap: any;
  normalizeResourceLocalforagePayload: any;
  splitChromeStorageModules: any;
  agentConversations: any;
  projectGroups: any;
  projects: any;
  selectedAgentId: any;
}

export function use_normalizeBackupModules(deps: UseNormalizeBackupModulesDeps) {
  const {
    AGENT_STORAGE_KEYS,
    BACKUP_MODULE_LABELS,
    TRANSIT_RESOURCES_STORAGE_KEY,
    buildProjectLocalforagePayload,
    getBackupSettingsSectionMap,
    normalizeResourceLocalforagePayload,
    splitChromeStorageModules,
    agentConversations,
    projectGroups,
    projects,
    selectedAgentId,
  } = deps;
  const normalizeBackupModules = (backup) => {
                          if (backup?.modules && typeof backup.modules == `object`) {
                            let settingsModule = backup.modules.settings || {},
                              settingsStorage =
                              settingsModule.chromeStorage && typeof settingsModule.chromeStorage == `object` ?
                              cloneBackupValue(settingsModule.chromeStorage) :
                              {},
                              sections =
                              settingsModule.sections && typeof settingsModule.sections == `object` ?
                              cloneBackupValue(settingsModule.sections) :
                              {},
                              mergedSettings = Object.keys(sections).reduce(
                                (acc, sectionKey) => ({
                                  ...acc,
                                  ...(sections[sectionKey] || {})
                                }),
                                cloneBackupValue(settingsStorage),
                              ),
                              settingsSectionMap = getBackupSettingsSectionMap(mergedSettings),
                              projectsModule = backup.modules.projects || {},
                              projectsStorage =
                              projectsModule.chromeStorage && typeof projectsModule.chromeStorage == `object` ?
                              cloneBackupValue(projectsModule.chromeStorage) :
                              {},
                              projects2 = Array.isArray(projectsStorage.projects) ?
                              projectsStorage.projects :
                              Array.isArray(projectsModule.projects) ?
                              cloneBackupValue(projectsModule.projects) :
                              [],
                              lastOpenedProjectId =
                              typeof projectsStorage.lastOpenedProjectId == `string` ?
                              projectsStorage.lastOpenedProjectId :
                              typeof projectsModule.lastOpenedProjectId == `string` ?
                              projectsModule.lastOpenedProjectId :
                              ``,
                              projectGroups2 = Array.isArray(projectsStorage.projectGroups) ?
                              cloneBackupValue(projectsStorage.projectGroups) :
                              Array.isArray(projectsModule.projectGroups) ?
                              cloneBackupValue(projectsModule.projectGroups) :
                              [],
                              selectedProjectIds = normalizeProjectIdSelection(
                                projectsModule.projectIds,
                                projects2.map((project) => project.id).filter(Boolean),
                              ),
                              projectResourceMap = normalizeProjectResourceMap(projectsModule.projectResources),
                              resourcesModule = backup.modules.resources || {},
                              resourcesLocalforage =
                              resourcesModule.localforage && typeof resourcesModule.localforage == `object` ?
                              cloneBackupValue(resourcesModule.localforage) :
                              {},
                              fallbackProjectPayload = buildProjectLocalforagePayload(resourcesLocalforage, selectedProjectIds),
                              projectLocalforagePayload = normalizeProjectLocalforagePayload(projectsModule.localforage),
                              resourceLocalforagePayload = normalizeResourceLocalforagePayload(resourcesModule.localforage),
                              resourcePayload = Object.keys(resourceLocalforagePayload).length ? resourceLocalforagePayload : normalizeResourceLocalforagePayload(resourcesLocalforage),
                              agentModule = backup.modules.agents || {},
                              agentChromeStorage =
                              agentModule.chromeStorage && typeof agentModule.chromeStorage == `object` ?
                              cloneBackupValue(agentModule.chromeStorage) :
                              Object.fromEntries(
                                [...AGENT_STORAGE_KEYS]
                                .filter((storageKey) => Object.prototype.hasOwnProperty.call(settingsStorage, storageKey))
                                .map((storageKey) => [storageKey, cloneBackupValue(settingsStorage[storageKey])]),
                              ),
                              agentList = Array.isArray(agentChromeStorage.agents) ?
                              cloneBackupValue(agentChromeStorage.agents) :
                              [],
                              agentIds = normalizeAgentIdSelection(
                                agentModule.agentIds,
                                agentList.map((agent) => agent.id).filter(Boolean),
                              );
                            return {
                              settings: {
                                label: BACKUP_MODULE_LABELS.settings,
                                chromeStorage: mergedSettings,
                                sections: settingsSectionMap.sections,
                                selectedSections: normalizeBackupSettingsSections(
                                  settingsModule.selectedSections,
                                  settingsSectionMap.availableSections,
                                ),
                              },
                              projects: {
                                label: BACKUP_MODULE_LABELS.projects,
                                chromeStorage: {
                                  projects: projects2,
                                  projectGroups: projectGroups2,
                                  lastOpenedProjectId: lastOpenedProjectId,
                                },
                                localforage: {
                                  canvasStates: Object.keys(projectLocalforagePayload.canvasStates).length ?
                                    projectLocalforagePayload.canvasStates :
                                    fallbackProjectPayload.canvasStates,
                                  assets: Object.keys(projectLocalforagePayload.assets).length ? projectLocalforagePayload.assets : fallbackProjectPayload.assets,
                                },
                                projectIds: selectedProjectIds,
                                projectResources: projectResourceMap,
                              },
                              resources: {
                                label: BACKUP_MODULE_LABELS.resources,
                                localforage: resourcePayload,
                              },
                              agents: {
                                label: BACKUP_MODULE_LABELS.agents,
                                chromeStorage: {
                                  agents: agentList,
                                  selectedAgentId: typeof agentChromeStorage.selectedAgentId == `string` ?
                                    agentChromeStorage.selectedAgentId :
                                    ``,
                                  agentConversations: agentChromeStorage.agentConversations &&
                                    typeof agentChromeStorage.agentConversations == `object` ?
                                    cloneBackupValue(agentChromeStorage.agentConversations) :
                                    {},
                                },
                                agentIds,
                              },
                            };
                          }
                          let storageModules = splitChromeStorageModules(
                              backup?.chromeStorage && typeof backup.chromeStorage == `object` ?
                              backup.chromeStorage :
                              backup || {},
                            ),
                            localforageData =
                            backup?.localforage && typeof backup.localforage == `object` ?
                            cloneBackupValue(backup.localforage) :
                            {},
                            settingsSectionMap = getBackupSettingsSectionMap(storageModules.settings),
                            projects2 = Array.isArray(storageModules.projects?.projects) ?
                            cloneBackupValue(storageModules.projects.projects) :
                            [],
                            projectGroups2 = Array.isArray(storageModules.projects?.projectGroups) ?
                            cloneBackupValue(storageModules.projects.projectGroups) :
                            [],
                            agentList = Array.isArray(storageModules.agents?.agents) ?
                            cloneBackupValue(storageModules.agents.agents) :
                            [],
                            agentIds = agentList.map((agent) => agent.id).filter(Boolean),
                            projectIds = projects2.map((project) => project.id).filter(Boolean),
                            projectPayload = buildProjectLocalforagePayload(localforageData, projectIds),
                            resourcePayload = normalizeResourceLocalforagePayload(localforageData);
                          return {
                            settings: {
                              label: BACKUP_MODULE_LABELS.settings,
                              chromeStorage: cloneBackupValue(storageModules.settings),
                              sections: settingsSectionMap.sections,
                              selectedSections: settingsSectionMap.availableSections,
                            },
                            projects: {
                              label: BACKUP_MODULE_LABELS.projects,
                              chromeStorage: {
                                projects: projects2,
                                projectGroups: projectGroups2,
                                lastOpenedProjectId: typeof storageModules.projects?.lastOpenedProjectId == `string` ?
                                  storageModules.projects.lastOpenedProjectId :
                                  ``,
                              },
                              localforage: projectPayload,
                              projectIds: projectIds,
                              projectResources: buildProjectResourceMap(projectPayload.canvasStates, projectIds, resourcePayload[TRANSIT_RESOURCES_STORAGE_KEY]),
                            },
                            resources: {
                              label: BACKUP_MODULE_LABELS.resources,
                              localforage: resourcePayload,
                            },
                            agents: {
                              label: BACKUP_MODULE_LABELS.agents,
                              chromeStorage: {
                                agents: agentList,
                                selectedAgentId: typeof storageModules.agents?.selectedAgentId == `string` ?
                                  storageModules.agents.selectedAgentId :
                                  ``,
                                agentConversations: storageModules.agents?.agentConversations &&
                                  typeof storageModules.agents.agentConversations == `object` ?
                                  cloneBackupValue(storageModules.agents.agentConversations) :
                                  {},
                              },
                              agentIds,
                            },
                          };
                        };
  return { normalizeBackupModules };
}
