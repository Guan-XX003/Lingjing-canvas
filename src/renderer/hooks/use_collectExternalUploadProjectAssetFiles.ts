// @ts-nocheck
/**
 * collectExternalUploadProjectAssetFiles。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_collectExternalUploadProjectAssetFiles(deps: any) {
  const {
    projects,
  } = deps;
  const collectExternalUploadProjectAssetFiles = (backupData = {}) => {
                      let results = [],
                        canvasStates = backupData?.modules?.projects?.localforage?.canvasStates || {},
                        assets = backupData?.modules?.projects?.localforage?.assets || {};
                      for (let [projectId, canvasState] of Object.entries(canvasStates || {})) {
                        let nodes = Array.isArray(canvasState?.nodes) ? canvasState.nodes : [];
                        for (let node of nodes) {
                          let nodeData = node?.data || {},
                            assetBindings = nodeData.projectAssetBindings || {};
	                          for (let [bindingKey, assetBinding] of Object.entries(assetBindings || {})) {
	                            if (!assetBinding?.localPath && !assetBinding?.portableDataRef) continue;
	                            let hasPortableData =
	                              typeof assetBinding.portableData == `string` && assetBinding.portableData ?
	                              assetBinding.portableData :
	                              assetBinding.portableDataRef && typeof assets[assetBinding.portableDataRef] == `string` ?
	                              assets[assetBinding.portableDataRef] :
	                              ``;
	                            results.push({
	                              projectId: projectId,
	                              nodeId: node.id || ``,
                              field: bindingKey,
                              assetId: assetBinding.assetId || ``,
                              path: assetBinding.localPath,
                              localPath: assetBinding.localPath || ``,
                              value: typeof assetBinding.value == `string` ? assetBinding.value : ``,
                              dataUrl: typeof assetBinding.value == `string` && assetBinding.value.startsWith(`data:`) ? assetBinding.value : ``,
                              portableData: hasPortableData,
                              portableDataRef: assetBinding.portableDataRef || ``,
                              kind: assetBinding.kind || ``,
                              filename: assetBinding.filename || ``,
                              mime: assetBinding.mime || ``,
                              size: assetBinding.size || 0,
                              sha256: assetBinding.sha256 || ``,
                              originalName: assetBinding.originalName || nodeData.originalName || nodeData.label || assetBinding.filename || ``,
                              exportName: String(assetBinding.localPath || assetBinding.filename || ``).split(/[\\/]/).pop() || assetBinding.filename || ``,
                              sourceOrigin: assetBinding.sourceOrigin || nodeData.sourceOrigin || ``,
                            });
                          }
                        }
                      }
                      return results;
                    };
  return { collectExternalUploadProjectAssetFiles };
}
