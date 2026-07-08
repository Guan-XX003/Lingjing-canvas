/**
 * forceRehomeProjectDataFileReferences。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { buildProjectMediaFileUrl } from "../lib/resource";

interface UseForceRehomeProjectDataFileReferencesDeps {}

export function use_forceRehomeProjectDataFileReferences(deps: UseForceRehomeProjectDataFileReferencesDeps) {
  const {} = deps;
  const forceRehomeProjectDataFileReferences = async (value, context, pathParts = []) => {
                    if (typeof value == `string` && value.startsWith(`file://`)) {
                      try {
                        let archivedAsset = await window.wanjuanDesktop.persistProjectAsset({
                          url: value,
                          projectId: context.projectId,
                          nodeId: context.nodeId,
                          field: pathParts.join(`.`) || `file`,
                          kind: `binary`,
                          directory: context.directory,
                          forceArchiveExistingFile: true,
                          migrationId: context.migrationId,
                        });
                        if (archivedAsset?.ok && archivedAsset.localPath)
                          return buildProjectMediaFileUrl(archivedAsset.localPath);
                      } catch (error) {
                        console.warn(`Nested project file force archive skipped`, error);
                      }
                      return value;
                    }
                    if (Array.isArray(value))
                      return Promise.all(value.map((item, index) => forceRehomeProjectDataFileReferences(item, context, [...pathParts, String(index)])));
                    if (!value || typeof value != `object`) return value;
                    let result = {};
                    for (let [key, item] of Object.entries(value)) {
                      if (key === `projectAssetBindings`) {
                        result[key] = item;
                        continue;
                      }
                      result[key] = await forceRehomeProjectDataFileReferences(item, context, [...pathParts, key]);
                    }
                    return result;
                  };
  return { forceRehomeProjectDataFileReferences };
}
