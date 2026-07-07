/**
 * 备份 / localforage 持久化域纯函数：项目资产 portable 序列化、
 * 项目媒体绑定判定与签名、备份还原报告、设置分区规范化等。
 * 纯数据变换（不依赖 React state），自 WanJuanAppRoot 抽出，行为不变。
 */
import localforage from "localforage";
// 复刻组件内 localforageModule（localforage 单例，config 全局生效）
const localforageModule = { default: localforage } as any;
import { CanvasNode } from "./types";

export const cloneBackupValue = (value) => {
      if (Array.isArray(value)) return value.map((item) => cloneBackupValue(item));
      if (value && typeof value == `object`) {
        let clone = {};
        for (let [key, value2] of Object.entries(value)) clone[key] = cloneBackupValue(value2);
        return clone;
      }
      return value;
    };

export const normalizeBackupSettingsSections = (list, allowedValues) => {
      let filtered = Array.isArray(list) ?
        list.filter((item) => allowedValues.includes(item)) :
        [];
      return filtered.length ? [...new Set(filtered)] : [...allowedValues];
    };

export const sanitizeProjectAssetStorageSegment = (segment) =>
    String(segment || `asset`)
    .replace(/[^a-zA-Z0-9_-]+/g, `_`)
    .replace(/^_+|_+$/g, ``)
    .slice(0, 80) || `asset`;

export const shouldPersistProjectAssetValue = (key, value) =>
    typeof value == `string` &&
    !!value &&
    (value.startsWith(`data:`) || value.startsWith(`blob:`)) &&
    (key === `url` ||
      key === `src` ||
      key === `resultData` ||
      /Url$/.test(key) ||
      key === `coverImage` ||
      key === `thumbnail` ||
      key === `previewImage` ||
      key === `preview` ||
      key === `icon`);

export const buildProjectAssetStorageKey = (projectId, nodeId, path) =>
    `project-asset-v2-${sanitizeProjectAssetStorageSegment(projectId)}-${sanitizeProjectAssetStorageSegment(nodeId)}-${sanitizeProjectAssetStorageSegment(path)}`;

export const convertProjectAssetValueToPortableString = async (value) => {
        if (typeof value != `string` || !value || value.startsWith(`data:`)) return value;
        if (!value.startsWith(`blob:`)) return value;
        try {
          let response = await fetch(value);
          if (!response.ok) throw Error(`blob fetch failed`);
          let blob = await response.blob();
          return await new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            ((fileReader.onload = () => {
                resolve(typeof fileReader.result == `string` ? fileReader.result : ``);
              }),
              (fileReader.onerror = () => {
                reject(fileReader.error || Error(`blob read failed`));
              }),
              fileReader.readAsDataURL(blob));
          });
        } catch (error) {
          return (console.warn(`Project asset blob fallback`, error), value);
        }
      };

export const extractProjectPortableDataRefs = (container, refs = new Set()) => {
              if (Array.isArray(container)) {
                container.forEach((item) => extractProjectPortableDataRefs(item, refs));
                return [...refs];
              }
              if (!container || typeof container != `object`) return [...refs];
              let assetBindings = container?.data?.projectAssetBindings;
              assetBindings &&
                typeof assetBindings == `object` &&
                Object.values(assetBindings).forEach((binding: any) => {
                  typeof binding?.portableDataRef == `string` &&
                    binding.portableDataRef &&
                    refs.add(binding.portableDataRef);
                });
              for (let value of Object.values(container)) extractProjectPortableDataRefs(value, refs);
              return [...refs];
            };

export const buildBackupRestoreReport = ({
              modules: modules = [],
              settingsSections: settingsSections = [],
              projectIds: projectIds = [],
              agentIds: agentIds = [],
              canvasStates: canvasStates = {},
              assets: assets = {},
              transitResources: transitResources,
              projectResources: projectResources = {},
            }) => {
              let projectIdList = Array.isArray(projectIds) ? projectIds : [],
                canvasStateKeys = Object.keys(canvasStates || {}),
                missingProjectIds = projectIdList.filter((item) => !Object.prototype.hasOwnProperty.call(canvasStates || {}, item)),
                assetKeys = Object.keys(assets || {}),
                transitCount = Array.isArray(transitResources) ? transitResources.length : 0,
                projectResourceCount = Object.values(projectResources || {}).reduce(
                  (accumulator: any, resourceList: any) => accumulator + (Array.isArray(resourceList) ? resourceList.length : 0),
                  0,
                );
              return {
                modules: [...modules],
                settingsSectionCount: Array.isArray(settingsSections) ? settingsSections.length : 0,
                projectCount: projectIdList.length,
                agentCount: Array.isArray(agentIds) ? agentIds.length : 0,
                canvasStateCount: canvasStateKeys.length,
                assetCount: assetKeys.length,
                resourceCount: transitCount,
                projectResourceCount: projectResourceCount,
                missingCanvasProjectIds: missingProjectIds,
              };
            };

export const formatBackupRestoreReport = (backupReport) => {
              let reportLines = [];
              return (
                backupReport.settingsSectionCount > 0 && reportLines.push(`设置 ${backupReport.settingsSectionCount} 项`),
                backupReport.projectCount > 0 &&
                reportLines.push(`项目 ${backupReport.projectCount} 个 / 画布 ${backupReport.canvasStateCount} 份`),
                backupReport.agentCount > 0 && reportLines.push(`智能体 ${backupReport.agentCount} 个`),
                backupReport.assetCount > 0 && reportLines.push(`项目资产 ${backupReport.assetCount} 项`),
                backupReport.resourceCount > 0 && reportLines.push(`资源 ${backupReport.resourceCount} 项`),
                backupReport.projectResourceCount > 0 && reportLines.push(`项目资源映射 ${backupReport.projectResourceCount} 项`),
                backupReport.missingCanvasProjectIds?.length > 0 &&
                reportLines.push(`缺少画布 ${backupReport.missingCanvasProjectIds.length} 个项目`),
                reportLines.join(`，`)
              );
            };

export const getExistingProjectMediaPortableValue = async (binding) => {
                  if (!binding || typeof binding != `object`) return undefined;
                  if (binding.portableData !== undefined && binding.portableData !== null && binding.portableData !== ``)
                    return binding.portableData;
                  if (typeof binding.portableDataRef == `string` && binding.portableDataRef && localforageModule.default)
                    try {
                      let storedValue = await localforageModule.default.getItem(binding.portableDataRef);
                      if (storedValue !== undefined && storedValue !== null && storedValue !== ``) return storedValue;
                    } catch {}
                  return undefined;
                };

export const isProjectMediaExternalReference = (value) =>
                typeof value == `string` &&
                (value.startsWith(`blob:`) || /^https?:\/\//i.test(value) || value.startsWith(`file://`));

export const getProjectMediaBindingKind = (bindingKey: string, node: CanvasNode) =>
                bindingKey === `imageUrl` ?
                node?.data?.mediaKind === `video` ?
                `video` :
                node?.data?.mediaKind === `audio` ?
                `audio` :
                `image` :
                bindingKey === `videoUrl` ?
                `video` :
                bindingKey === `audioUrl` ?
                `audio` :
                node?.type === `customNode` && bindingKey === `resultData` ?
                `text` :
                `text`;

export const getProjectMediaBindingOrigin = (binding, data: any = {}) =>
                String(binding?.sourceOrigin || data?.sourceOrigin || data?.mediaSourceOrigin || ``).trim();

export const hasExternalUploadLikeFileName = (binding, data: any = {}) =>
                [binding?.originalName, binding?.filename, data?.originalName, data?.label, data?.name]
                .some((value) => /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif|tiff?|ico|mp4|webm|mov|m4v|avi|mkv|flv|mpeg|mpg|3gp|3g2|ts|mts|m2ts|wmv|mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|amr|aiff?|caf)$/i.test(String(value || ``).trim()));

export const isProjectMediaFileBackedBinding = (binding, bindingKind, fallbackKind) => {
                  let mime = String(binding?.mime || ``).toLowerCase(),
                    kind = String(binding?.kind || fallbackKind || ``).toLowerCase();
                  return (
                    kind === `image` ||
                    kind === `video` ||
                    kind === `audio` ||
                    /^image\//i.test(mime) ||
                    /^video\//i.test(mime) ||
                    /^audio\//i.test(mime) ||
                    bindingKind === `imageUrl` ||
                    bindingKind === `videoUrl` ||
	                    bindingKind === `audioUrl`
	                  );
	                };

export const buildProjectMediaSourceSignature = (value) =>
                  typeof value == `string` ?
                  value :
                  value && typeof value == `object` ?
                  JSON.stringify(value) :
                  String(value ?? ``);

export const collectProjectMediaBindingPaths =
                  (globalThis.collectProjectMediaBindingPaths = (node) => {
                    let bindings = node?.data?.projectAssetBindings || {},
                      localPaths = [];
                    for (let binding of Object.values(bindings) as any[])
                      binding?.localPath && typeof binding.localPath == `string` && localPaths.push(binding.localPath);
                    return localPaths;
                  });

export const getProjectAssetDialogFilters = (mediaType) =>
                  mediaType === `image` ?
                  [{
                    name: `图片`,
                    extensions: [`png`, `jpg`, `jpeg`, `webp`, `gif`, `bmp`, `svg`, `avif`, `heic`, `heif`, `tif`, `tiff`, `ico`]
                  }] :
                  mediaType === `video` ?
                  [{
                    name: `视频`,
                    extensions: [`mp4`, `webm`, `mov`, `m4v`, `avi`, `mkv`, `flv`, `mpeg`, `mpg`, `3gp`, `3g2`, `ts`, `mts`, `m2ts`, `wmv`]
                  }] :
                  mediaType === `audio` ?
                  [{
                    name: `音频`,
                    extensions: [`mp3`, `wav`, `ogg`, `oga`, `m4a`, `aac`, `flac`, `opus`, `weba`, `amr`, `aif`, `aiff`, `caf`]
                  }] :
                  [{
                      name: `文本`,
                      extensions: [`txt`, `md`, `json`]
                    },
                    {
                      name: `所有文件`,
                      extensions: [`*`]
                    },
                  ];

export const buildBackupExternalAssetStorageValue = (file: any = {}) => ({
                    __wanjuanExternalAssetFile: true,
                    filePath: file.filePath || ``,
                    filename: file.filename || ``,
                    originalName: file.originalName || ``,
                    mime: file.mime || ``,
                    size: file.size || 0,
                    sha256: file.sha256 || ``,
                  });

export const backupExternalAssetMatchesBinding = (asset: any = {}, binding: any = {}) => {
                    if (!asset?.filePath) return false;
                    let bindingSize = Number(binding?.size || 0),
                      assetSize = Number(asset?.size || 0);
                    if (bindingSize && assetSize && bindingSize !== assetSize) return false;
                    let bindingHash = String(binding?.sha256 || ``).trim().toLowerCase(),
                      assetHash = String(asset?.sha256 || ``).trim().toLowerCase();
                    if (bindingHash && assetHash && bindingHash !== assetHash) return false;
                    return true;
                  };

export const normalizeProjectLocalforagePayload = (payload) => {
                      let normalizedPayload = payload && typeof payload == `object` ? cloneBackupValue(payload) : {};
                      return {
                        canvasStates: normalizedPayload.canvasStates && typeof normalizedPayload.canvasStates == `object` ?
                          cloneBackupValue(normalizedPayload.canvasStates) :
                          {},
                        assets: normalizedPayload.assets && typeof normalizedPayload.assets == `object` ?
                          cloneBackupValue(normalizedPayload.assets) :
                          {},
                      };
                    };
