// @ts-nocheck
/**
 * compactBackupPortableAssets。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";

export function use_compactBackupPortableAssets(deps: any) {
  const {
    PROJECT_ASSET_MANIFEST_STORAGE_PREFIX,
    projects,
  } = deps;
  const compactBackupPortableAssets = (backup = {}, bindings = []) => {
                    if (!backup?.modules?.projects?.localforage) return backup;
                    let clonedBackup = cloneBackupValue(backup),
                      usedRefs = new Set(
                        Array.isArray(bindings) ?
                        bindings.map((binding) => binding?.portableDataRef).filter(Boolean) :
                        [],
                      ),
                      localforageData = clonedBackup.modules.projects.localforage,
                      assets = localforageData.assets && typeof localforageData.assets == `object` ? localforageData.assets : {};
                    for (let [assetRef, assetValue] of Object.entries(assets))
                      usedRefs.has(assetRef) &&
                        typeof assetValue == `string` &&
                        assetValue.startsWith(`data:`) &&
                        (assets[assetRef] = `${PROJECT_ASSET_MANIFEST_STORAGE_PREFIX}${assetRef}`);
                    for (let canvasState of Object.values(localforageData.canvasStates || {})) {
                      for (let node of Array.isArray(canvasState?.nodes) ? canvasState.nodes : []) {
                        let bindings2 = node?.data?.projectAssetBindings;
                        if (!bindings2 || typeof bindings2 != `object`) continue;
                        for (let binding of Object.values(bindings2)) {
                          if (!binding || typeof binding != `object` || !usedRefs.has(binding.portableDataRef)) continue;
                          typeof binding.value == `string` && binding.value.startsWith(`data:`) && delete binding.value;
                          typeof binding.portableData == `string` && binding.portableData.startsWith(`data:`) && delete binding.portableData;
                          typeof binding.sourceSignature == `string` &&
                            binding.sourceSignature.startsWith(`data:`) &&
                            (binding.sourceSignature = `${PROJECT_ASSET_MANIFEST_STORAGE_PREFIX}${binding.portableDataRef}`);
                        }
                      }
                    }
                    return ((localforageData.assets = assets), clonedBackup);
                  };
  return { compactBackupPortableAssets };
}
