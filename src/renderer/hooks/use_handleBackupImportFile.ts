// @ts-nocheck
/**
 * handleBackupImportFile。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { getAgentOptionList } from "../lib/agent";
import { getProjectOptionList } from "../lib/app-root-helpers";

interface UseHandleBackupImportFileDeps {
  applyExternalAssetBundleToBackupPayload: any;
  getAvailableBackupModules: any;
  getBackupSettingsSectionMap: any;
  normalizeBackupModules: any;
  setBackupDialogState: SetAny;
  setBackupDialogTab: SetAny;
  showToast2: Toast;
  projects: any;
}

export function use_handleBackupImportFile(deps: UseHandleBackupImportFileDeps) {
  const {
    applyExternalAssetBundleToBackupPayload,
    getAvailableBackupModules,
    getBackupSettingsSectionMap,
    normalizeBackupModules,
    setBackupDialogState,
    setBackupDialogTab,
    showToast2,
    projects,
  } = deps;
  const handleBackupImportFile = async (event) => {
                                  if (window.wanjuanDesktop?.chooseBackupFile) {
                                    try {
                                      let backupFileResult = await window.wanjuanDesktop.chooseBackupFile({
                                        title: `选择万卷备份 JSON`,
                                      });
                                      if (backupFileResult?.canceled) return;
                                      if (!backupFileResult?.ok) throw Error(backupFileResult?.error || `读取备份文件失败`);
                                      let backupPayload = applyExternalAssetBundleToBackupPayload(
                                          JSON.parse(backupFileResult.content || `{}`),
                                          backupFileResult.externalAssetBundle,
                                        ),
                                        availableModules = getAvailableBackupModules(backupPayload).filter((module) => [`settings`, `projects`, `agents`].includes(module));
                                      if (!availableModules.length) {
                                        showToast2(`导入失败：未识别到可导入内容`);
                                        return;
                                      }
                                      let normalizedModules = normalizeBackupModules(backupPayload),
                                        settingsSections = availableModules.includes(`settings`) ?
                                        getBackupSettingsSectionMap(normalizedModules.settings?.chromeStorage || {}).availableSections :
                                        [],
                                        projectOptions = availableModules.includes(`projects`) ?
                                        getProjectOptionList(normalizedModules.projects?.chromeStorage?.projects) :
                                        [],
                                        agentOptions = availableModules.includes(`agents`) ?
                                        getAgentOptionList(normalizedModules.agents?.chromeStorage?.agents) :
                                        [];
                                      setBackupDialogTab(availableModules.includes(`projects`) ? `projects` : availableModules.includes(`agents`) ? `agents` : `settings`),
                                        setBackupDialogState({
                                          mode: `import`,
                                          title: `确认导入内容`,
                                          sourceName: backupFileResult.name || `备份文件`,
                                          payload: backupPayload,
                                          modules: availableModules,
                                          settingsSections: [...settingsSections],
                                          availableSettingsSections: settingsSections,
                                          projectIds: projectOptions.map((project) => project.id),
                                          availableProjects: projectOptions,
                                          agentIds: agentOptions.map((agent) => agent.id),
                                          availableAgents: agentOptions,
                                        });
                                    } catch (error) {
                                      (console.error(error), showToast2(`导入失败：文件格式不正确`));
                                    } finally {
                                      event?.target && (event.target.value = ``);
                                    }
                                    return;
                                  }
                                  let selectedFile = event?.target?.files?.[0];
                                  if (!selectedFile) return;
                                  let reader = new FileReader();
                                  ((reader.onload = async (event2) => {
                                      try {
                                        let parsedBackup = JSON.parse(event2.target?.result || `{}`),
                                          availableModules = getAvailableBackupModules(parsedBackup).filter((module) => [`settings`, `projects`, `agents`].includes(module));
                                        if (!availableModules.length) {
                                          showToast2(`导入失败：未识别到可导入内容`);
                                          return;
                                        }
                                        let normalizedModules = normalizeBackupModules(parsedBackup),
                                          settingsBackup = availableModules.includes(`settings`) ?
                                          getBackupSettingsSectionMap(normalizedModules.settings?.chromeStorage || {}).availableSections :
                                          [],
                                          projectList = availableModules.includes(`projects`) ?
                                          getProjectOptionList(normalizedModules.projects?.chromeStorage?.projects) :
                                          [],
                                          agentList = availableModules.includes(`agents`) ?
                                          getAgentOptionList(normalizedModules.agents?.chromeStorage?.agents) :
                                          [];
                                        setBackupDialogTab(availableModules.includes(`projects`) ? `projects` : availableModules.includes(`agents`) ? `agents` : `settings`),
                                          setBackupDialogState({
                                            mode: `import`,
                                            title: `确认导入内容`,
                                            sourceName: selectedFile.name,
                                            payload: parsedBackup,
                                            modules: availableModules,
                                            settingsSections: [...settingsBackup],
                                            availableSettingsSections: settingsBackup,
                                            projectIds: projectList.map((project) => project.id),
                                            availableProjects: projectList,
                                            agentIds: agentList.map((agent) => agent.id),
                                            availableAgents: agentList,
                                          });
                                      } catch (error) {
                                        (console.error(error), showToast2(`导入失败：文件格式不正确`));
                                      }
                                    }),
                                    reader.readAsText(selectedFile),
                                    (event.target.value = ``));
                                };
  return { handleBackupImportFile };
}
