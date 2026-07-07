// @ts-nocheck
/**
 * applyExternalAssetBundleToBackupPayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { backupExternalAssetMatchesBinding, buildBackupExternalAssetStorageValue, buildProjectAssetStorageKey, cloneBackupValue } from "../lib/backup";
import { buildProjectMediaFileUrl } from "../lib/resource";

export function use_applyExternalAssetBundleToBackupPayload(deps: any) {
  const {
    projects,
  } = deps;
  const applyExternalAssetBundleToBackupPayload = (backup, importResult) => {
                    if (!importResult?.files?.length || !backup?.modules?.projects?.localforage) return backup;
                    let clonedBackup = cloneBackupValue(backup),
                      fileMap = new Map();
                    for (let file of importResult.files || []) {
                      if (!file || file.error || !file.filePath) continue;
                      file.assetId && fileMap.set(`asset:${file.assetId}`, file);
                      file.nodeId && file.field && fileMap.set(`node:${file.nodeId}:${file.field}`, file);
                    }
                    let localforageData = clonedBackup.modules.projects.localforage,
                      assets = localforageData.assets && typeof localforageData.assets == `object` ? localforageData.assets : {};
                    for (let canvasState of Object.values(localforageData.canvasStates || {})) {
                      for (let node of Array.isArray(canvasState?.nodes) ? canvasState.nodes : []) {
                        let bindings = node?.data?.projectAssetBindings;
                        if (!bindings || typeof bindings != `object`) continue;
                        for (let [bindingKey, binding] of Object.entries(bindings)) {
                          if (!binding || typeof binding != `object`) continue;
                          let matchedFile = (binding.assetId && fileMap.get(`asset:${binding.assetId}`)) || fileMap.get(`node:${node.id}:${bindingKey}`);
                          if (!matchedFile || !backupExternalAssetMatchesBinding(matchedFile, binding)) continue;
                          let storageKey = binding.portableDataRef || buildProjectAssetStorageKey(binding.projectId || matchedFile.projectId || `imported`, node.id || matchedFile.nodeId || `node`, `media-${bindingKey}-portable`);
                          (bindings[bindingKey] = {
                            ...binding,
                            localPath: matchedFile.filePath,
                            portableDataRef: storageKey,
                            valueFormat: `file-url`,
                            value: buildProjectMediaFileUrl(matchedFile.filePath) || matchedFile.filePath,
                            sourceSignature: buildProjectMediaFileUrl(matchedFile.filePath) || binding.sourceSignature,
                            size: matchedFile.size || binding.size,
                            sha256: matchedFile.sha256 || binding.sha256,
                            mime: matchedFile.mime || binding.mime,
                            missing: false,
                          },
                            assets[storageKey] = buildBackupExternalAssetStorageValue(matchedFile));
                        }
                      }
                    }
                    return ((localforageData.assets = assets), clonedBackup);
                  };
  return { applyExternalAssetBundleToBackupPayload };
}
