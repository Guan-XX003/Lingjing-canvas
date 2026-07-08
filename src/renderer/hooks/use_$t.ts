/**
 * $t。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Toast } from "../lib/app-types";
import { normalizeModuleSelection } from "../lib/project-normalize";

interface Use$tDeps {
  BACKUP_MODULE_LABELS: any;
  buildBackupPayload: any;
  collectExternalUploadProjectAssetFiles: any;
  collectSelectedLocalforageBackup: any;
  compactBackupPortableAssets: any;
  getBackupChromeStorageKeys: any;
  readChromeStorageSnapshot: any;
  showToast2: Toast;
  projects: any;
}

export function use_$t(deps: Use$tDeps) {
  const {
    BACKUP_MODULE_LABELS,
    buildBackupPayload,
    collectExternalUploadProjectAssetFiles,
    collectSelectedLocalforageBackup,
    compactBackupPortableAssets,
    getBackupChromeStorageKeys,
    readChromeStorageSnapshot,
    showToast2,
    projects,
  } = deps;
  const $t = async (moduleSelection, options = {}) => {
    try {
      let selectedModules = normalizeModuleSelection(moduleSelection, [`settings`, `projects`, `agents`]),
        storageSnapshot = await readChromeStorageSnapshot(getBackupChromeStorageKeys(selectedModules, options)),
        backupPayload = await buildBackupPayload(
          storageSnapshot,
          await collectSelectedLocalforageBackup(selectedModules, options, storageSnapshot),
          selectedModules,
          options,
        ),
        externalAssetFiles = selectedModules.includes(`projects`) ? collectExternalUploadProjectAssetFiles(backupPayload) : [],
        exportPayload = compactBackupPortableAssets(backupPayload, externalAssetFiles),
        scopeLabel =
        selectedModules.length === 3 ?
        `all` :
        selectedModules.length === 1 ?
        selectedModules[0] :
        selectedModules.join(`-`),
        exportFilename = `wanjuan-backup-${scopeLabel}-${new Date().toISOString().split(`T`)[0]}.json`,
        exportFolderName = exportFilename.replace(/\.json$/i, ``),
        externalAssetFolderName = exportFilename.replace(/\.json$/i, `-external-assets`),
        externalAssetSummary = externalAssetFiles.length ? {
          version: 2,
          manifestVersion: 2,
          folderName: externalAssetFolderName,
          fileCount: externalAssetFiles.length,
          copied: 0,
          failed: 0,
          assets: externalAssetFiles.map((asset) => ({
            projectId: asset.projectId,
            nodeId: asset.nodeId,
            field: asset.field,
            assetId: asset.assetId,
            kind: asset.kind,
            mime: asset.mime,
            filename: asset.filename,
            originalName: asset.originalName,
            sourceOrigin: asset.sourceOrigin,
            size: asset.size || 0,
            sha256: asset.sha256 || ``,
          })),
        } : null,
        saveResult = await window.wanjuanDesktop?.saveDownload?.({
          text: JSON.stringify(
            externalAssetSummary && exportPayload?.modules?.projects ?
            {
              ...exportPayload,
              modules: {
                ...exportPayload.modules,
                projects: {
                  ...exportPayload.modules.projects,
                  externalAssetBundle: externalAssetSummary,
                },
              },
            } :
            exportPayload,
            null,
            2,
          ),
          mime: `application/json`,
          filename: exportFilename,
          saveAsFolder: true,
          folderName: exportFolderName,
          externalAssetFiles,
          externalAssetFolderName,
        });
      if (saveResult?.canceled) {
        showToast2(`已取消导出`);
        return;
      }
      if (!saveResult?.ok) {
        if (Array.isArray(saveResult?.missingAssets) && saveResult.missingAssets.length) {
          let missingAssetsText = saveResult.missingAssets
            .slice(0, 12)
            .map((missingAsset, index) => `${index + 1}. ${missingAsset.nodeId || `未知节点`} / ${missingAsset.field || `素材`} / ${missingAsset.assetId || missingAsset.originalName || `未命名`}${missingAsset.sourcePath ? `\n   ${missingAsset.sourcePath}` : ``}`)
            .join(`\n`);
          window.alert(`导出已中止：检测到 ${saveResult.missingAssets.length} 个素材源文件缺失。\n\n${missingAssetsText}${saveResult.missingAssets.length > 12 ? `\n...` : ``}\n\n请先在画布中重连这些素材，或删除对应节点后再导出。`);
          showToast2(`导出失败：素材源文件缺失`);
          return;
        }
        throw Error(saveResult?.error || `保存下载文件失败`);
      }
      showToast2(`导出成功：${selectedModules.map((moduleKey) => BACKUP_MODULE_LABELS[moduleKey]).join(`、`)}，已生成备份文件夹${saveResult.externalAssetBundle?.copied ? `，同步打包外部素材 ${saveResult.externalAssetBundle.copied} 个` : ``}${saveResult.externalAssetBundle?.failed ? `，${saveResult.externalAssetBundle.failed} 个素材源文件缺失未能打包` : ``}`);
    } catch (error) {
      (console.error(error), showToast2(`导出失败`));
    }
  };
  return { $t };
}
