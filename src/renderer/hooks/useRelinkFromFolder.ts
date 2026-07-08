// @ts-nocheck
/**
 * relinkMissingProjectAssetsFromFolder。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import { buildProjectAssetStorageKey, getProjectMediaBindingKind } from "../lib/backup";
import { buildProjectMediaFileUrl, reviveProjectMediaBindingValue } from "../lib/resource";

export function useRelinkFromFolder(deps: any) {
  const {
    localforageModule,
    nodesRef,
    projectIdRef,
    saveCanvasState,
    setNodes,
    showProjectAssetCandidateDialog,
  } = deps;
  const relinkMissingProjectAssetsFromFolder = useCallback(async () => {
      let missingMediaEntries = globalThis.getMissingProjectMediaEntries(nodesRef.current);
      if (!missingMediaEntries.length) {
        window.alert(`当前项目没有检测到需要批量重连的本地媒体素材`);
        return;
      }
      if (
        !window.wanjuanDesktop?.chooseProjectAssetFolder ||
        !window.wanjuanDesktop?.findProjectAssetsInFolder ||
        !window.wanjuanDesktop?.persistProjectAsset ||
        !localforageModule.default
      ) {
        window.alert(`当前桌面版本暂不支持从文件夹自动链接素材`);
        return;
      }
      let chosenFolder = await window.wanjuanDesktop.chooseProjectAssetFolder({
        title: `选择导出时生成的外部素材文件夹`,
      });
      if (chosenFolder?.canceled) return;
      if (!chosenFolder?.ok || !chosenFolder.path) {
        window.alert(`未选择有效的素材文件夹`);
        return;
      }
      let searchResult = await window.wanjuanDesktop.findProjectAssetsInFolder({
        folderPath: chosenFolder.path,
        entries: missingMediaEntries.map((entry) => ({
          projectId: entry.binding?.projectId || projectIdRef.current || ``,
          nodeId: entry.nodeId,
          nodeType: entry.nodeType || ``,
          field: entry.field,
          assetId: entry.binding?.assetId || ``,
          filename: entry.binding?.filename || ``,
          originalName: entry.binding?.originalName || entry.nodeLabel || ``,
          localPath: entry.binding?.localPath || ``,
          kind: entry.binding?.kind || ``,
          mime: entry.binding?.mime || ``,
          size: entry.binding?.size || 0,
          sha256: entry.binding?.sha256 || ``,
          sourceOrigin: entry.binding?.sourceOrigin || ``,
        })),
      });
      if (!searchResult?.ok) {
        window.alert(`搜索素材失败：${searchResult?.error || `未知错误`}`);
        return;
      }
      let resolvedPaths = new Map((searchResult.matches || []).filter((match) => match.path).map((match) => [`${match.nodeId}|${match.field}`, match.path])),
        candidateCanceled = false;
      for (let entry of missingMediaEntries) {
        let entryKey = `${entry.nodeId}|${entry.field}`;
        if (resolvedPaths.has(entryKey)) continue;
        let matchEntry = (searchResult.matches || []).find((match) => match.nodeId === entry.nodeId && match.field === entry.field),
          candidates = Array.isArray(matchEntry?.candidates) ? matchEntry.candidates : [];
        if (!candidates.length) continue;
        let dialogResult = await showProjectAssetCandidateDialog(entry, candidates);
        if (dialogResult?.action === `cancel`) {
          candidateCanceled = true;
          break;
        }
        dialogResult?.action === `use` && dialogResult.path && resolvedPaths.set(entryKey, dialogResult.path);
      }
      let nodesCopy = JSON.parse(JSON.stringify(nodesRef.current)),
        linkedCount = 0;
      for (let entry of missingMediaEntries) {
        let node = nodesCopy.find((node2) => node2.id === entry.nodeId),
          resolvedPath = resolvedPaths.get(`${entry.nodeId}|${entry.field}`);
        if (!node?.data || !resolvedPath) continue;
        let assetBindings = {
            ...(node.data.projectAssetBindings || {})
          },
          binding = assetBindings[entry.field] || entry.binding || {},
          bindingKind = binding.kind || getProjectMediaBindingKind(entry.field, node),
          persistResult = await window.wanjuanDesktop.persistProjectAsset({
            localPath: resolvedPath,
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
          linkedCount++);
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
          let remainingCount = globalThis.getMissingProjectMediaEntries?.(nodesCopy)?.length || 0,
            relinkBanner = document.getElementById(`wanjuan-project-asset-relink-banner`);
          (!remainingCount || linkedCount > 0) && relinkBanner?.remove?.();
        }, 0),
        setTimeout(() => {
          saveCanvasState();
        }, 80),
        linkedCount > 0 ?
        window.alert(`已链接 ${linkedCount} 个素材${linkedCount < missingMediaEntries.length ? `，还有 ${missingMediaEntries.length - linkedCount} 个未匹配到` : ``}`) :
        candidateCanceled ?
        window.alert(`已取消候选素材重连`) :
        Array.isArray(searchResult.unavailable) && searchResult.unavailable.length ?
        window.alert(`该文件夹是正确的，但 ${searchResult.unavailable.length} 个缺失素材在导出时没有成功打包，文件夹里没有可恢复文件。请重新导出时确保原视频/音频文件仍存在，或点击“逐个选择”用原始文件手动重连。`) :
        searchResult.candidateCount > 0 ?
        window.alert(`已找到候选素材，但未选择任何素材进行重连`) :
        window.alert(`没有在该文件夹里匹配到缺失素材，请确认选择的是导出时生成的外部素材文件夹`));
    }, [setNodes, saveCanvasState, showProjectAssetCandidateDialog]);
  return { relinkMissingProjectAssetsFromFolder };
}
