// @ts-nocheck
/**
 * relinkMissingProjectAssets。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import type { Ref, SetAny } from "../lib/app-types";
import { buildProjectAssetStorageKey, getProjectAssetDialogFilters, getProjectMediaBindingKind } from "../lib/backup";
import { buildProjectMediaFileUrl, reviveProjectMediaBindingValue } from "../lib/resource";

interface UseRelinkMissingAssetsDeps {
  localforageModule: any;
  nodesRef: Ref;
  projectIdRef: Ref;
  saveCanvasState: any;
  setNodes: SetAny;
}

export function useRelinkMissingAssets(deps: UseRelinkMissingAssetsDeps) {
  const {
    localforageModule,
    nodesRef,
    projectIdRef,
    saveCanvasState,
    setNodes,
  } = deps;
  const relinkMissingProjectAssets = useCallback(async () => {
      let missingMediaEntries = globalThis.getMissingProjectMediaEntries(nodesRef.current);
      if (!missingMediaEntries.length) {
        window.alert(`当前项目没有检测到丢失素材`);
        return;
      }
      if (
        !window.wanjuanDesktop?.chooseProjectAssetFile ||
        !window.wanjuanDesktop?.persistProjectAsset ||
        !localforageModule.default
      ) {
        window.alert(`当前桌面版本暂不支持重新链接素材`);
        return;
      }
      let nodesCopy = JSON.parse(JSON.stringify(nodesRef.current)),
        relinkedCount = 0,
        canceled = false;
      for (let entry of missingMediaEntries) {
        let node = nodesCopy.find((node2) => node2.id === entry.nodeId);
        if (!node?.data) continue;
        let assetBindings = {
            ...(node.data.projectAssetBindings || {})
          },
          binding = assetBindings[entry.field] || entry.binding || {},
          bindingKind = binding.kind || getProjectMediaBindingKind(entry.field, node),
          chosenFile = await window.wanjuanDesktop.chooseProjectAssetFile({
            title: `为「${entry.nodeLabel || entry.nodeType}」选择${entry.field}素材`,
            filters: getProjectAssetDialogFilters(bindingKind),
          });
        if (chosenFile?.canceled) {
          canceled = true;
          break;
        }
        if (!chosenFile?.ok || !chosenFile.path) continue;
        let persistResult = await window.wanjuanDesktop.persistProjectAsset({
          localPath: chosenFile.path,
          projectId: projectIdRef.current,
          nodeId: node.id,
          field: entry.field,
          kind: bindingKind,
          assetId: binding.assetId,
          directory: ``,
        });
        if (!persistResult?.ok) continue;
        let storageKey =
          binding.portableDataRef ||
          buildProjectAssetStorageKey(
            projectIdRef.current,
            node.id || `node`,
            `media-${entry.field}-portable`,
          ),
          portableData =
          persistResult.value !== undefined ?
          persistResult.value :
          entry.field === `text` || entry.field === `resultData` ?
          node.data[entry.field] :
          buildProjectMediaFileUrl(persistResult.localPath);
        portableData !== undefined && (await localforageModule.default.setItem(storageKey, portableData));
        let revivedValue = reviveProjectMediaBindingValue({
          portableData: portableData,
          valueFormat: persistResult.valueFormat || binding.valueFormat,
        });
        ((assetBindings[entry.field] = {
            ...binding,
            ...persistResult,
            field: entry.field,
            kind: bindingKind,
            portableDataRef: storageKey,
            valueFormat: persistResult.valueFormat || binding.valueFormat,
            sourceOrigin: `relinked`,
            missing: false,
            lastRelinkedAt: new Date().toISOString(),
          }),
          (node.data = {
            ...node.data,
            [entry.field]: revivedValue !== undefined ?
              revivedValue :
              entry.field === `text` || entry.field === `resultData` ?
              node.data[entry.field] :
              buildProjectMediaFileUrl(persistResult.localPath),
            projectAssetBindings: assetBindings,
          }),
          relinkedCount++);
      }
      let localPathMap = new Map(
        nodesCopy.flatMap((node) =>
          Object.values(node?.data?.projectAssetBindings || {})
          .filter((node2) => node2?.localPath)
          .map((binding) => [binding.localPath, true]),
        ),
      );
      ((nodesCopy = nodesCopy.map((node) => globalThis.applyProjectMediaBindingsToNode(node, localPathMap))),
        setNodes(nodesCopy),
        setTimeout(() => {
          saveCanvasState();
        }, 80),
        relinkedCount > 0 &&
        window.alert(
          `已重新链接 ${relinkedCount} 个素材${canceled ? `，其余素材已保留待下次继续处理` : ``}`,
        ),
        !relinkedCount &&
        !canceled &&
        window.alert(`未完成任何素材重连，请检查选择的文件是否有效`));
    }, [setNodes, saveCanvasState]);
  return { relinkMissingProjectAssets };
}
