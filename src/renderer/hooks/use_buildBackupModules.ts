// @ts-nocheck
/**
 * buildBackupModules。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { ApiConfig, SetAny, SetState, StoredGlobalConfig, WjEdge } from "../lib/app-types";
import { buildProjectResourceMap } from "../lib/app-root-helpers";
import { cloneBackupValue, normalizeBackupSettingsSections } from "../lib/backup";
import { normalizeAgentIdSelection } from "../lib/agent";
import { normalizeModuleSelection, normalizeProjectIdSelection } from "../lib/project-normalize";
import { wanjuanMakeSeedanceVirtualPortraitsPortable } from "../lib/seedance";

interface UseBuildBackupModulesDeps {
  BACKUP_MODULE_LABELS: any;
  apiConfigs: ApiConfig[];
  buildProjectLocalforageExportPayload: any;
  edges: WjEdge[];
  getBackupSettingsSectionMap: any;
  getDesktopProjectMirrorStorageKey: any;
  getProjectCanvasStorageKey: any;
  setEdges: SetState<WjEdge[]>;
  setMaxPollingDuration: SetAny;
  splitChromeStorageModules: any;
  agentConversations: any;
  projectGroups: any;
  projects: any;
  seedanceVirtualPortraits: any;
  selectedAgentId: any;
  storedGlobalConfigs: StoredGlobalConfig[];
}

export function use_buildBackupModules(deps: UseBuildBackupModulesDeps) {
  const {
    BACKUP_MODULE_LABELS,
    apiConfigs,
    buildProjectLocalforageExportPayload,
    edges,
    getBackupSettingsSectionMap,
    getDesktopProjectMirrorStorageKey,
    getProjectCanvasStorageKey,
    setEdges,
    setMaxPollingDuration,
    splitChromeStorageModules,
    agentConversations,
    projectGroups,
    projects,
    seedanceVirtualPortraits,
    selectedAgentId,
    storedGlobalConfigs,
  } = deps;
  const buildBackupModules = async (chromeStorage, userData, moduleSelection, selection = {}) => {
                          let selectedModules = normalizeModuleSelection(moduleSelection, [`settings`, `projects`, `agents`]),
                            storageModules = splitChromeStorageModules(chromeStorage || {}),
                            modules = {};
                          if (selectedModules.includes(`settings`)) {
                            let settingsSectionMap = getBackupSettingsSectionMap(storageModules.settings),
                              selectedSections = normalizeBackupSettingsSections(selection.settingsSections, settingsSectionMap.availableSections),
	                              settings = selectedSections.reduce(
	                                (acc, sectionKey) => ({
	                                  ...acc,
	                                  ...(settingsSectionMap.sections[sectionKey] || {})
	                                }), {},
	                              );
	                            Array.isArray(settings.seedanceVirtualPortraits) &&
	                              (settings.seedanceVirtualPortraits = await wanjuanMakeSeedanceVirtualPortraitsPortable(settings.seedanceVirtualPortraits));
	                            Array.isArray(settings.storedGlobalConfigs) &&
	                              (settings.storedGlobalConfigs = await Promise.all(
	                                settings.storedGlobalConfigs.map(async (item) => {
	                                  let agent = cloneBackupValue(item);
	                                  return (
	                                    Array.isArray(agent?.config?.seedanceVirtualPortraits) &&
	                                      (agent.config.seedanceVirtualPortraits = await wanjuanMakeSeedanceVirtualPortraitsPortable(agent.config.seedanceVirtualPortraits)),
	                                    agent
	                                  );
	                                }),
	                              ));
	                            modules.settings = {
                              label: BACKUP_MODULE_LABELS.settings,
                              chromeStorage: cloneBackupValue(settings),
                              sections: cloneBackupValue(settingsSectionMap.sections),
                              selectedSections: selectedSections,
                            };
                          }
                              if (selectedModules.includes(`projects`)) {
                            let projects2 = Array.isArray(storageModules.projects?.projects) ?
                              cloneBackupValue(storageModules.projects.projects) :
                              [],
                              selectedProjectIds = normalizeProjectIdSelection(
                                selection.projectIds,
                                projects2.map((project) => project.id).filter(Boolean),
                              ),
                              selectedProjects = projects2.filter((project) => selectedProjectIds.includes(project.id)),
                              lastOpenedProjectId =
                              typeof storageModules.projects?.lastOpenedProjectId == `string` &&
                              selectedProjectIds.includes(storageModules.projects.lastOpenedProjectId) ?
                              storageModules.projects.lastOpenedProjectId :
                              selectedProjects[0]?.id || ``,
                              projectGroups2 = Array.isArray(storageModules.projects?.projectGroups) ?
                              cloneBackupValue(storageModules.projects.projectGroups) :
                              [];
                            let selectedProjectGroupIds = new Set(selectedProjects.map((project) => project.groupId).filter(Boolean)),
                              exportProjectGroups = selectedProjectIds.length === projects2.length ?
                              projectGroups2 :
                              projectGroups2.filter((projectGroup) => selectedProjectGroupIds.has(projectGroup.id));
                            let backupManifest = {
                              ...(userData || {})
                            };
                            for (let projectId of selectedProjectIds) {
                              let canvasStorageKey = getProjectCanvasStorageKey(projectId),
                                mirrorStorageKey = getDesktopProjectMirrorStorageKey(projectId);
                              !Object.prototype.hasOwnProperty.call(backupManifest, canvasStorageKey) &&
                                Object.prototype.hasOwnProperty.call(projects2 || {}, mirrorStorageKey) &&
                                (backupManifest[canvasStorageKey] = cloneBackupValue(projects2[mirrorStorageKey]));
                            }
                            let projectPayload = await buildProjectLocalforageExportPayload(backupManifest, selectedProjectIds, {
                              currentProjectId: setEdges.current,
                              currentProjectState: apiConfigs.current ?
                                {
                                  nodes: setMaxPollingDuration.current.filter((node) => node.id !== `ghost-target`),
                                  edges: edges.current.filter((edge) => edge.id !== `ghost-edge`),
                                } :
                                null,
                            });
                            modules.projects = {
                              label: BACKUP_MODULE_LABELS.projects,
                              chromeStorage: {
                                projects: selectedProjects,
                                projectGroups: exportProjectGroups,
                                lastOpenedProjectId: lastOpenedProjectId,
                              },
                              localforage: projectPayload,
                              projectIds: selectedProjectIds,
                              projectResources: buildProjectResourceMap(projectPayload.canvasStates, selectedProjectIds, []),
                            };
                              }
                          if (selectedModules.includes(`agents`)) {
                            let agentList = Array.isArray(storageModules.agents?.agents) ?
                                cloneBackupValue(storageModules.agents.agents) :
                                [],
                              selectedAgentIds = normalizeAgentIdSelection(
                                selection.agentIds,
                                agentList.map((agentList2) => agentList2.id).filter(Boolean),
                              ),
                              selectedAgents = agentList.filter((agent) => selectedAgentIds.includes(agent.id)),
                              selectedAgentId2 =
                              typeof storageModules.agents?.selectedAgentId == `string` &&
                              selectedAgentIds.includes(storageModules.agents.selectedAgentId) ?
                              storageModules.agents.selectedAgentId :
                              selectedAgents[0]?.id || ``,
                              agentConversations2 = storageModules.agents?.agentConversations &&
                              typeof storageModules.agents.agentConversations == `object` ?
                              cloneBackupValue(storageModules.agents.agentConversations) :
                              {};
                            modules.agents = {
                              label: BACKUP_MODULE_LABELS.agents,
                              chromeStorage: {
                                agents: selectedAgents,
                                selectedAgentId: selectedAgentId2,
                                agentConversations: Object.fromEntries(
                                  selectedAgentIds
                                  .filter((agentId) => Object.prototype.hasOwnProperty.call(agentConversations2, agentId))
                                  .map((agentId) => [agentId, cloneBackupValue(agentConversations2[agentId])]),
                                ),
                              },
                              agentIds: selectedAgentIds,
                            };
                          }
                          return modules;
                        };
  return { buildBackupModules };
}
