// @ts-nocheck
/**
 * externalizeProjectCanvasState。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { WanJuanStripRuntimeNodeData } from "../components/render-mode";
import { cloneBackupValue } from "../lib/backup";

interface UseExternalizeProjectCanvasStateDeps {
  externalizeProjectAssetContainer: any;
}

export function use_externalizeProjectCanvasState(deps: UseExternalizeProjectCanvasStateDeps) {
  const {
    externalizeProjectAssetContainer,
  } = deps;
  const externalizeProjectCanvasState = async (backup, projectId, options = {}) => {
            let clonedBackup = cloneBackupValue(backup || {});
            return (
              Array.isArray(clonedBackup.nodes) &&
              (clonedBackup.nodes = clonedBackup.nodes.map((node) => ({
                ...node,
                data: WanJuanStripRuntimeNodeData(node?.data || {})
              }))),
              Array.isArray(clonedBackup.nodes) &&
              (clonedBackup.nodes = await Promise.all(
                clonedBackup.nodes.map((node, index) =>
                  externalizeProjectAssetContainer(node, {
                    projectId: projectId,
                    nodeId: node?.id || `node-${index}`,
                    path: `node-${node?.id || index}`,
                    assetMap: options.assetMap || {},
                    persist: !!options.persist,
                  }),
                ),
              )),
              clonedBackup
            );
          };
  return { externalizeProjectCanvasState };
}
