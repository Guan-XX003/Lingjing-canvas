const __vite__mapDeps = (
  deps,
  mapDeps = __vite__mapDeps,
  depFiles = mapDeps.f ||
  (mapDeps.f = [
    "./vendor.js",
    "./rolldown-runtime.js",
    "./vendor-BszHeZrG.css",
  ]),
) => deps.map((index) => depFiles[index]);
import {
  r as wanjuanToEsm
} from "./rolldown-runtime.js";
import {
  $ as ArrowUp,
  A as Palette,
  B as Inbox,
  C as Redo2,
  Ct as wanjuanReactFactory,
  D as Pencil,
  E as Pipette,
  F as Maximize2,
  G as FileText,
  H as Hash,
  I as ListPlus,
  J as Copy,
  K as Download,
  L as Link,
  M as MonitorPlay,
  N as Minimize2,
  O as Pen,
  P as Mic,
  Q as Check,
  R as Link2,
  S as RefreshCw,
  St as wanjuanReactDomFactory,
  T as Play,
  U as FolderOpen,
  V as ImageIcon,
  W as Film,
  X as CirclePlay,
  Y as Circle,
  Z as CircleAlert,
  _ as Sparkles,
  _t as Position,
  a as wanjuanLocalforageFactory,
  at as Handle,
  b as Send,
  bt as wanjuanJsxRuntimeFactory,
  c as CloseX,
  ct as Panel,
  d as Undo2,
  dt as useNodesState,
  et as Background,
  f as Type,
  ft as useNodeConnections,
  g as Square,
  gt as useUpdateNodeInternals,
  h as Star,
  ht as useReactFlow,
  useOnViewportChange,
  i as ReactCrop,
  it as NodeToolbar,
  j as Music,
  k as PenLine,
  l as Upload,
  lt as ReactFlowProvider,
  m as Trash2,
  mt as useEdgesState,
  n as makeAspectCrop,
  nt as BaseEdge,
  o as ZoomIn,
  ot as MiniMap,
  p as Trash,
  pt as useNodesData,
  q as Crop,
  r as centerCrop,
  rt as Controls,
  s as Zap,
  st as NodeResizer,
  t as wanjuanDagreFactory,
  tt as BackgroundVariant,
  u as Undo,
  ut as ReactFlow,
  v as Settings,
  vt as addEdge,
  w as Puzzle,
  x as Save,
  xt as wanjuanReactDomClientFactory,
  y as Settings2,
  yt as getBezierPath,
  z as LayoutGrid,
} from "./vendor.js";
// —— 可读源码接线：以下模块已反混淆至 src/renderer/lib/，bundle 内联副本已删除 ——
import {
  normalizeVideoSizeValue,
  normalizeVideoAspectRatioValue,
  snapVideoAspectRatioToSupported,
} from "../lib/video-aspect-ratio";
import {
  wanjuanCloneNodeDataForClipboard,
  wanjuanVideoTaskMatchesNodeByPrompt,
  wanjuanVideoTaskCanAttachToNode,
  wanjuanTaskCreatedAt,
  wanjuanTaskUsesSeedanceSlot,
  wanjuanNewestNodeTask,
} from "../lib/video-task";
import {
  wanjuanFindMentionRange,
  wanjuanMentionHostFromElement,
  wanjuanUpdateMentionPickerPosition,
  wanjuanClearMentionPickerPosition,
  wanjuanShouldShowMentionPicker,
  wanjuanMentionRangeFromPicker,
  wanjuanReplaceMentionToken,
  wanjuanFormatMentionToken,
  wanjuanLegacyMentionToken,
  wanjuanNormalizeMentionTokensForApi,
  wanjuanFindMentionTokenDeleteRange,
  wanjuanDeleteMentionTokenAsUnit,
} from "../lib/mention";
import {
  wanjuanNormalizeTianjiPortraitAssets,
  wanjuanTianjiPortraitNodeDataFromAutomation,
  wanjuanTianjiPortraitToResource,
} from "../lib/tianji-portrait";
import {
  wanjuanClearProjectAssetBindingsFromData,
  wanjuanResourceKind,
  wanjuanResourceMediaUrl,
  wanjuanNormalizeResourceSignatureValue,
  wanjuanResourceIdentitySignatures,
  wanjuanResourceSameIdentity,
  wanjuanResourceInList,
  wanjuanResourcePosterUrl,
  wanjuanResourceLooksLikeImageUrl,
  wanjuanResourceLooksLikeVideoUrl,
  wanjuanGetTransitResourcePageSize,
  wanjuanStableResourceIdPart,
  wanjuanCollectResourceSignatures,
  wanjuanExtractVideoUrlFromValue,
  wanjuanBuildGeneratedVideoResourcesFromNodes,
  wanjuanResourceSourceKind,
  wanjuanResourceMatchesFilter,
  reviveProjectMediaBindingValue,
  buildProjectMediaFileUrl,
} from "../lib/resource";
import {
  wanjuanThemeTransitionPalette,
  wanjuanRunThemeTransitionFallback,
  wanjuanRunThemeTransition,
} from "../lib/theme-transition";
import {
  wanjuanNormalizeSeedanceAssetId,
  wanjuanSeedanceAssetUrl,
  wanjuanBlobToDataUrl,
  wanjuanPrepareSeedancePortraitPreview,
  wanjuanPortableSeedancePortraitPreview,
  wanjuanMakeSeedanceVirtualPortraitsPortable,
  wanjuanNormalizeSeedanceVirtualPortraits,
  wanjuanSeedancePortraitToResource,
} from "../lib/seedance";
import {
  WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG,
  wanjuanNormalizeArkTrustedAssetConfig,
} from "../lib/ark-trusted-assets";
import {
  WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS,
  WANJUAN_JIXIN_BUILTIN_SEEDANCE_DURATIONS,
  WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS,
  WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS,
  wanjuanMergeModelText,
  WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID,
  WANJUAN_JIXIN_DEFAULT_API_URL,
  WANJUAN_JIXIN_DEFAULT_DOC_URL,
  WANJUAN_CONFIG_BUTLER_DEFAULT_MODEL,
  WANJUAN_JIXIN_BUILTIN_GLOBAL_CONFIG_ID,
  WANJUAN_JIXIN_BUILTIN_BASE_CONFIG_VERSION,
  wanjuanIsLegacyJixinDocUrl,
  WANJUAN_JIXIN_BUILTIN_TEXT_MODELS,
  WANJUAN_JIXIN_BUILTIN_IMAGE_MODELS,
  WANJUAN_JIXIN_BUILTIN_VIDEO_MODELS,
  WANJUAN_JIXIN_BUILTIN_UNIFIED_VIDEO_MODELS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_IMAGE_MODELS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_REFERENCE_IMAGE_MODELS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_EDIT_MODELS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_MODELS,
  WANJUAN_JIXIN_BUILTIN_SEEDANCE_MODELS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_DURATIONS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RESOLUTIONS,
  WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RATIOS,
  WANJUAN_JIXIN_BUILTIN_MUSIC_MODELS,
  WANJUAN_JIXIN_BUILTIN_AUDIO_MODELS,
  WANJUAN_JIXIN_BUILTIN_TEXT_PROTOCOLS,
  WANJUAN_JIXIN_BUILTIN_IMAGE_PROTOCOLS,
  WANJUAN_JIXIN_BUILTIN_VIDEO_PROTOCOL_BINDINGS,
  WANJUAN_JIXIN_BUILTIN_AUDIO_PROTOCOL_BINDINGS,
  WANJUAN_JIXIN_BUILTIN_PROTOCOLS,
  wanjuanBuildJixinModelBindings,
  wanjuanMergeObjectDefaults,
  wanjuanMergeOptionText,
  wanjuanMergeJixinVideoProtocolDefaults,
  wanjuanGetJixinDefaultApiConfigId,
  wanjuanEnsureJixinApiConfigKey,
  wanjuanBuildJixinVideoModelBindings,
  wanjuanBuildJixinAudioModelBindings,
  wanjuanBuildJixinVideoProtocolBindings,
  wanjuanBuildJixinAudioProtocolBindings,
  wanjuanApplyJixinBuiltinProtocolPatch,
  wanjuanApplySeedanceOptionDefaults,
  wanjuanHasUserModelConfiguration,
  wanjuanBuildJixinBuiltinBasePatch,
  wanjuanBuildJixinBuiltinStoredGlobalConfig,
  wanjuanSyncJixinBuiltinStoredGlobalConfig,
  WANJUAN_BUILTIN_AGENT_ITEMS,
  WANJUAN_BUILTIN_AGENT_CONVERSATIONS,
  wanjuanCloneBuiltinAgentItems,
  wanjuanCloneBuiltinAgentConversations,
  wanjuanHasUserAgentConfiguration,
} from "../lib/jixin-catalog";
import {
  WanJuanNormalizeModelId,
  WanJuanSameModelId,
  WanJuanParseModelList,
} from "../lib/model-id";
import {
  WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE,
  WANJUAN_DEFAULT_CUSTOM_PUBLIC_UPLOAD_CONFIG,
} from "../lib/upload-defaults";
import {
  WANJUAN_TIANJI_DEFAULT_BASE_URL,
  WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
  WANJUAN_TIANJI_SYNC_SOURCE_MANUAL,
  WANJUAN_TIANJI_CONFIG_MIRROR_KEY,
  wanjuanTianjiSeedanceDefaults,
  wanjuanTianjiStorageGet,
  wanjuanTianjiStorageSet,
  wanjuanNormalizeTianjiSeedanceConfig,
  wanjuanNormalizeTianjiApiBaseUrl,
  wanjuanIsJixinApiConfig,
  wanjuanFindLegacyJixinApiKey,
  wanjuanResolveJixinApiConfigForTianji,
  wanjuanBuildSyncedTianjiConfigFromJixin,
  wanjuanGetSyncedTianjiSeedanceConfig,
  wanjuanTianjiFirstListValue,
  wanjuanTianjiBase64Encode,
  wanjuanTianjiBase64Decode,
  wanjuanTianjiRequest,
  wanjuanTianjiFindDeep,
  wanjuanTianjiFindVideoUrl,
  wanjuanTianjiFindTaskId,
  wanjuanTianjiStatus,
  wanjuanTianjiStatusLabel,
  wanjuanTianjiFindProgress,
  wanjuanTianjiFindThumbUrl,
  wanjuanTianjiErrorMessage,
  wanjuanTianjiMediaUrl,
  wanjuanRunTianjiSeedanceVideo,
} from "../lib/tianji-api";
import {
  wanjuanAutomationFileUrl,
  wanjuanAutomationMediaField,
  wanjuanAutomationMediaMime,
  wanjuanExtractAutomationMedia,
} from "../lib/automation-result";
import {
  wanjuanBrokenResourceImage,
  wanjuanUseBrokenResourceImage,
  wanjuanCanFallbackImageToVideo,
  wanjuanUseVideoResourceFallback,
  wanjuanRenderResourceFilterTabs,
  wanjuanRenderResourceSourceTabs,
} from "../lib/resource-tabs";
import {
  wanjuanTianjiFindArray,
  wanjuanTianjiReadPositiveNumber,
  wanjuanTianjiAssetListParams,
  wanjuanTianjiAssetPagination,
  wanjuanTianjiExtractGroups,
  wanjuanTianjiEnsurePortraitGroups,
  wanjuanTianjiCreateLocalUploadAsset,
  wanjuanTianjiSubmittedPortraitAssetId,
  wanjuanTianjiFinalPortraitAsset,
  wanjuanTianjiPortraitAssetIdFromItem,
  wanjuanTianjiPortraitImageUrlFromItem,
  wanjuanTianjiPortraitNameFromItem,
  wanjuanTianjiFlattenPortraitAssets,
  wanjuanTianjiResolvePortraitAssetForNodeData,
  wanjuanTianjiMergeSubmittedPortraitAsset,
  WANJUAN_TIANJI_ASSET_PAGE_SIZE,
  wanjuanTianjiMergePagedAssets,
  wanjuanTianjiRefreshPortraitAssets,
  wanjuanUploadTianjiVirtualPortrait,
} from "../lib/tianji-assets";
import {
  WanJuanFilterAppNotifications,
  WanJuanLoadCachedAppNotifications,
  WanJuanSaveCachedAppNotifications,
  WanJuanLoadDismissedAppNotificationIds,
  WanJuanSaveDismissedAppNotificationIds,
  WanJuanLoadSessionToastAppNotificationIds,
  WanJuanFetchAppNotifications,
} from "../lib/app-notifications";
import {
  serializeErrorPreview,
  WanJuanIsTransientNetworkError,
  safeStringifyRequestForLog,
} from "../lib/log-utils";
import {
  buildApiUrl,
  normalizeModelBindingKeyHelper,
  getModelBindingCandidatesHelper,
  resolveModelApiBindingIdHelper,
  resolveModelProtocolBindingHelper,
  extractVideoTaskErrorHelper,
  parseSeedanceList,
} from "../lib/model-binding";
import {
  localPathFromProjectFileUrl,
  WANJUAN_PROJECT_ASSET_HYDRATE_DATA_URL_MAX_CHARS,
  wanjuanShouldSkipHydratedProjectAssetValue,
  wanjuanResolveHydratedProjectAssetFileValue,
  wanjuanGetDroppedFilePath,
  wanjuanMediaKindFromFile,
  wanjuanMimeFromMediaKind,
  wanjuanBuildProjectAssetBinding,
} from "../lib/project-asset-binding";
import {
  guessApiConfigName,
  normalizeUnifiedApiConfig,
  normalizeUnifiedApiConfigs,
} from "../lib/unified-api-config";
import {
  normalizeThemeMode,
  formatExtensionToolError,
  extractJsonBlock,
  formatStorageBytes,
} from "../lib/app-utils";
import {
  normalizeProjectGroups,
  normalizeModuleSelection,
  normalizeProjectIdSelection,
  normalizeProjectResourceMap,
} from "../lib/project-normalize";
import {
  isJixinDefaultApiConfig,
  isXSeeVeoReferenceVideoModel,
  ensureModelInList,
} from "../lib/model-list-utils";
import { useMediaEditors } from "../hooks/useMediaEditors";
import { useCanvasContextMenu } from "../hooks/useCanvasContextMenu";
import { useTextGeneration } from "../hooks/useTextGeneration";
import { useVideoGeneration } from "../hooks/useVideoGeneration";
import { useImageGeneration } from "../hooks/useImageGeneration";
import { useCustomNodeGeneration } from "../hooks/useCustomNodeGeneration";
import { useUngroupNode } from "../hooks/useUngroupNode";
import { WanJuanSettingsSectionD } from "../components/WanJuanSettingsSectionD";
import { WanJuanSettingsSectionC } from "../components/WanJuanSettingsSectionC";
import { WanJuanSettingsSectionB } from "../components/WanJuanSettingsSectionB";
import { WanJuanSettingsSectionA } from "../components/WanJuanSettingsSectionA";
import { WanJuanAccountGate } from "../components/account-gate";
import { use_redo } from "../hooks/use_redo";
import { use_handleCopySelected } from "../hooks/use_handleCopySelected";
import { use_addResource } from "../hooks/use_addResource";
import { use_handleSeedancePortraitFile } from "../hooks/use_handleSeedancePortraitFile";
import { use_blobToDataUrl } from "../hooks/use_blobToDataUrl";
import { use_handleDeleteClick } from "../hooks/use_handleDeleteClick";
import { use_readChromeStorage } from "../hooks/use_readChromeStorage";
import { use_normalizeResourceLocalforagePayload } from "../hooks/use_normalizeResourceLocalforagePayload";
import { use_applyLitterboxUploadPreset } from "../hooks/use_applyLitterboxUploadPreset";
import { use_renameProjectGroup } from "../hooks/use_renameProjectGroup";
import { use_createProjectGroup } from "../hooks/use_createProjectGroup";
import { use_extractMem0Results } from "../hooks/use_extractMem0Results";
import { use_resetJixinDefaultConfiguration } from "../hooks/use_resetJixinDefaultConfiguration";
import { use_moveProjectToGroup } from "../hooks/use_moveProjectToGroup";
import { use_saveCurrentToStoredGlobalConfig } from "../hooks/use_saveCurrentToStoredGlobalConfig";
import { use_getShortcutNodePosition } from "../hooks/use_getShortcutNodePosition";
import { use_$e } from "../hooks/use_$e";
import { use_handleClearUnfavorited } from "../hooks/use_handleClearUnfavorited";
import { use_readChromeStorageSnapshot } from "../hooks/use_readChromeStorageSnapshot";
import { use_resolveVideoRunModel } from "../hooks/use_resolveVideoRunModel";
import { use_sanitizeProjectCanvasStateForExport } from "../hooks/use_sanitizeProjectCanvasStateForExport";
import { use_persistProjectsWithStorageState } from "../hooks/use_persistProjectsWithStorageState";
import { use_shouldReuseProjectMediaBinding } from "../hooks/use_shouldReuseProjectMediaBinding";
import { use_extractProjectAssetRefs } from "../hooks/use_extractProjectAssetRefs";
import { use_persistSeedanceVirtualPortraits } from "../hooks/use_persistSeedanceVirtualPortraits";
import { use_addKeyboardNode } from "../hooks/use_addKeyboardNode";
import { use_buildBackupPayload } from "../hooks/use_buildBackupPayload";
import { use_stripLargeProjectMediaPortablePayload } from "../hooks/use_stripLargeProjectMediaPortablePayload";
import { use_mergeStoredGlobalApiConfigs } from "../hooks/use_mergeStoredGlobalApiConfigs";
import { use_updateGlobalTasks } from "../hooks/use_updateGlobalTasks";
import { use_updateSelectedAgent } from "../hooks/use_updateSelectedAgent";
import { use_restoreStorageOptimizationTrash } from "../hooks/use_restoreStorageOptimizationTrash";
import { use_resolveWanjuanPlayableTaskUrl } from "../hooks/use_resolveWanjuanPlayableTaskUrl";
import { use_manageStorageOptimizationTrash } from "../hooks/use_manageStorageOptimizationTrash";
import { use_clearSelectedAgentConversation } from "../hooks/use_clearSelectedAgentConversation";
import { use_normalizeStoredGlobalConfigs } from "../hooks/use_normalizeStoredGlobalConfigs";
import { use_unlockAdvancedSettings } from "../hooks/use_unlockAdvancedSettings";
import { use_splitChromeStorageModules } from "../hooks/use_splitChromeStorageModules";
import { use_persistStoredGlobalConfigs } from "../hooks/use_persistStoredGlobalConfigs";
import { use_editSeedancePortrait } from "../hooks/use_editSeedancePortrait";
import { use_purgeStorageOptimizationTrash } from "../hooks/use_purgeStorageOptimizationTrash";
import { use_toggleFavorite } from "../hooks/use_toggleFavorite";
import { use_getBackupSettingsSectionMap } from "../hooks/use_getBackupSettingsSectionMap";
import { use_addCustomNodeTemplate } from "../hooks/use_addCustomNodeTemplate";
import { use_deleteProjectGroup } from "../hooks/use_deleteProjectGroup";
import { use_normalizeMem0MemoryText } from "../hooks/use_normalizeMem0MemoryText";
import { use_deleteCustomNodeTemplate } from "../hooks/use_deleteCustomNodeTemplate";
import { use_persistProjectGroups } from "../hooks/use_persistProjectGroups";
import { use_clipboardHasPastePayload } from "../hooks/use_clipboardHasPastePayload";
import { use_confirmProjectGroupRename } from "../hooks/use_confirmProjectGroupRename";
import { use_ConfirmRenameProject } from "../hooks/use_ConfirmRenameProject";
import { use_handleRemoveTransitResource } from "../hooks/use_handleRemoveTransitResource";
import { use_warnProjectMediaFetchOnce } from "../hooks/use_warnProjectMediaFetchOnce";
import { use_openAccountSite } from "../hooks/use_openAccountSite";
import { use_dismissSystemNotificationDialog } from "../hooks/use_dismissSystemNotificationDialog";
import { use_normalizeStoredGlobalConfigBackup } from "../hooks/use_normalizeStoredGlobalConfigBackup";
import { use_removeAgentAttachment } from "../hooks/use_removeAgentAttachment";
import { use_saveCurrentAsStoredGlobalConfig } from "../hooks/use_saveCurrentAsStoredGlobalConfig";
import { use_removeAgentKnowledgeFile } from "../hooks/use_removeAgentKnowledgeFile";
import { use_handleDeleteSelected } from "../hooks/use_handleDeleteSelected";
import { use_handleAddPreset } from "../hooks/use_handleAddPreset";
import { use_setAllAdvancedModelSettings } from "../hooks/use_setAllAdvancedModelSettings";
import { use_deleteSelectedAgent } from "../hooks/use_deleteSelectedAgent";
import { use_ensureUniqueProtocolName } from "../hooks/use_ensureUniqueProtocolName";
import { use_buildSyncedTianjiConfigFromJixinApi } from "../hooks/use_buildSyncedTianjiConfigFromJixinApi";
import { use_enableStorageOptimization } from "../hooks/use_enableStorageOptimization";
import { use_applyExternalAssetBundleToBackupPayload } from "../hooks/use_applyExternalAssetBundleToBackupPayload";
import { use_buildProjectLocalforagePayload } from "../hooks/use_buildProjectLocalforagePayload";
import { use_persistTransitResource } from "../hooks/use_persistTransitResource";
import { use_runConfigButlerErrorDiagnosis } from "../hooks/use_runConfigButlerErrorDiagnosis";
import { use_projectMediaStringToPortableValue } from "../hooks/use_projectMediaStringToPortableValue";
import { use_captureCurrentGlobalConfig } from "../hooks/use_captureCurrentGlobalConfig";
import { use_addTransitResource } from "../hooks/use_addTransitResource";
import { use_hydrateProjectAssetContainer } from "../hooks/use_hydrateProjectAssetContainer";
import { use_normalizeBackupModules } from "../hooks/use_normalizeBackupModules";
import { use_sanitizeProjectNodeDataForExport } from "../hooks/use_sanitizeProjectNodeDataForExport";
import { use_addAccount } from "../hooks/use_addAccount";
import { use_duplicateSelectedAgent } from "../hooks/use_duplicateSelectedAgent";
import { use_buildBackupModules } from "../hooks/use_buildBackupModules";
import { use_sendAgentMessage } from "../hooks/use_sendAgentMessage";
import { use_restoreCookies } from "../hooks/use_restoreCookies";
import { use_externalizeProjectCanvasState } from "../hooks/use_externalizeProjectCanvasState";
import { use_createNodeAt } from "../hooks/use_createNodeAt";
import { use_maybeTriggerConfigButlerErrorDiagnosis } from "../hooks/use_maybeTriggerConfigButlerErrorDiagnosis";
import { use_openConfigButlerManualProblemFields } from "../hooks/use_openConfigButlerManualProblemFields";
import { use_copySelectedNodes } from "../hooks/use_copySelectedNodes";
import { use_probeResourceAlive } from "../hooks/use_probeResourceAlive";
import { use_rollbackConfigButlerRepair } from "../hooks/use_rollbackConfigButlerRepair";
import { use_handleBackupImportFile } from "../hooks/use_handleBackupImportFile";
import { use_handleCreateProject } from "../hooks/use_handleCreateProject";
import { use_buildJixinDefaultResetPatch } from "../hooks/use_buildJixinDefaultResetPatch";
import { use_applyStoredGlobalConfig } from "../hooks/use_applyStoredGlobalConfig";
import { use_scanStorageOptimization } from "../hooks/use_scanStorageOptimization";
import { use_handleCleanInvalidResources } from "../hooks/use_handleCleanInvalidResources";
import { use_copyNodeImage } from "../hooks/use_copyNodeImage";
import { use_addGridSplitNode } from "../hooks/use_addGridSplitNode";
import { use_handleFileChange } from "../hooks/use_handleFileChange";
import { use_sendToPlugin } from "../hooks/use_sendToPlugin";
import { use_runManualConfigButlerErrorQuery } from "../hooks/use_runManualConfigButlerErrorQuery";
import { use_forceRehomeProjectDataFileReferences } from "../hooks/use_forceRehomeProjectDataFileReferences";
import { use_getProjectMediaPayload } from "../hooks/use_getProjectMediaPayload";
import { use_refreshGlobalTask } from "../hooks/use_refreshGlobalTask";
import { use_handleServerVerify } from "../hooks/use_handleServerVerify";
import { use_saveUsers } from "../hooks/use_saveUsers";
import { use_saveNonModelSettings } from "../hooks/use_saveNonModelSettings";
import { use_collectExternalUploadProjectAssetFiles } from "../hooks/use_collectExternalUploadProjectAssetFiles";
import { use_compactBackupPortableAssets } from "../hooks/use_compactBackupPortableAssets";
import { use_handleAgentReferenceSelection } from "../hooks/use_handleAgentReferenceSelection";
import { use_storeAgentLongTermMemory } from "../hooks/use_storeAgentLongTermMemory";
import { use_saveApiModelCloudSettings } from "../hooks/use_saveApiModelCloudSettings";
import { use_collectSelectedLocalforageBackup } from "../hooks/use_collectSelectedLocalforageBackup";
import { use_searchAgentLongTermMemory } from "../hooks/use_searchAgentLongTermMemory";
import { use_saveSeedancePortraitForm } from "../hooks/use_saveSeedancePortraitForm";
import { use_applyConfigButlerManualProtocolFix } from "../hooks/use_applyConfigButlerManualProtocolFix";
import { use_saveStoredGlobalConfigApiDocUrl } from "../hooks/use_saveStoredGlobalConfigApiDocUrl";
import { use_externalizeProjectAssetContainer } from "../hooks/use_externalizeProjectAssetContainer";
import { use_copyResource } from "../hooks/use_copyResource";
import { use_scanJixinGatewayModels } from "../hooks/use_scanJixinGatewayModels";
import { use_refreshSystemNotifications } from "../hooks/use_refreshSystemNotifications";
import { use_restoreSelectedBackup } from "../hooks/use_restoreSelectedBackup";
import { use_getConfigButlerRepairContext } from "../hooks/use_getConfigButlerRepairContext";
import { use_applyTianjiSeedanceSettingsMode } from "../hooks/use_applyTianjiSeedanceSettingsMode";
import { use_getBackupChromeStorageKeys } from "../hooks/use_getBackupChromeStorageKeys";
import { use_refreshExtensionToolStatus } from "../hooks/use_refreshExtensionToolStatus";
import { use_importAgentKnowledgeFile } from "../hooks/use_importAgentKnowledgeFile";
import { use_cleanStorageOptimization } from "../hooks/use_cleanStorageOptimization";
import { use_moduleHasBackupData } from "../hooks/use_moduleHasBackupData";
import { use_persistImportedMediaFile } from "../hooks/use_persistImportedMediaFile";
import { use_buildProjectLocalforageExportPayload } from "../hooks/use_buildProjectLocalforageExportPayload";
import { use_resolveJixinApiConfigForTianjiSettings } from "../hooks/use_resolveJixinApiConfigForTianjiSettings";
import { use_createAgent } from "../hooks/use_createAgent";
import { use_createImportedMediaNode } from "../hooks/use_createImportedMediaNode";
import { use_$t } from "../hooks/use_$t";
import { use_applyJixinDefaultResetPatch } from "../hooks/use_applyJixinDefaultResetPatch";
import { use_repairXSeeVeoReferenceVideoBindings } from "../hooks/use_repairXSeeVeoReferenceVideoBindings";
import { use_isExternalUploadedProjectAssetBinding } from "../hooks/use_isExternalUploadedProjectAssetBinding";
import { use_applyConfigButlerProtocolRepair } from "../hooks/use_applyConfigButlerProtocolRepair";
import { useRunConfigButler } from "../hooks/useRunConfigButler";
import { useRunConfigButlerBatch } from "../hooks/useRunConfigButlerBatch";
import { useApplyConfigButlerBatchResults } from "../hooks/useApplyConfigButlerBatchResults";
import { useApplyConfigButlerResult } from "../hooks/useApplyConfigButlerResult";
import { useCallConfigButlerModel } from "../hooks/useCallConfigButlerModel";
import { useLateEffect5880 } from "../hooks/useLateEffect5880";
import { useLateEffect4760 } from "../hooks/useLateEffect4760";
import { useLateEffect1120 } from "../hooks/useLateEffect1120";
import { useLateEffect2670 } from "../hooks/useLateEffect2670";
import { useLateEffect4727 } from "../hooks/useLateEffect4727";
import { useLateEffect1076 } from "../hooks/useLateEffect1076";
import { useLateEffect4703 } from "../hooks/useLateEffect4703";
import { useLateEffect1184 } from "../hooks/useLateEffect1184";
import { useLateEffect1095 } from "../hooks/useLateEffect1095";
import { useLateEffect4766 } from "../hooks/useLateEffect4766";
import { useLateEffect4737 } from "../hooks/useLateEffect4737";
import { useLateEffect4717 } from "../hooks/useLateEffect4717";
import { useLateEffect4743 } from "../hooks/useLateEffect4743";
import { useLateEffect4712 } from "../hooks/useLateEffect4712";
import { useLateEffect1886 } from "../hooks/useLateEffect1886";
import { useSafeEffect47 } from "../hooks/useSafeEffect47";
import { useSafeEffect46 } from "../hooks/useSafeEffect46";
import { useSafeEffect42 } from "../hooks/useSafeEffect42";
import { useSafeEffect40 } from "../hooks/useSafeEffect40";
import { useSafeEffect38 } from "../hooks/useSafeEffect38";
import { useSafeEffect37 } from "../hooks/useSafeEffect37";
import { useSafeEffect30 } from "../hooks/useSafeEffect30";
import { useSafeEffect27 } from "../hooks/useSafeEffect27";
import { useSafeEffect23 } from "../hooks/useSafeEffect23";
import { useSafeEffect22 } from "../hooks/useSafeEffect22";
import { useSafeEffect21 } from "../hooks/useSafeEffect21";
import { useSafeEffect20 } from "../hooks/useSafeEffect20";
import { useSafeEffect19 } from "../hooks/useSafeEffect19";
import { useSafeEffect18 } from "../hooks/useSafeEffect18";
import { useSafeEffect12 } from "../hooks/useSafeEffect12";
import { useSafeEffect11 } from "../hooks/useSafeEffect11";
import { useSafeEffect10 } from "../hooks/useSafeEffect10";
import { useSafeEffect7 } from "../hooks/useSafeEffect7";
import { useSafeEffect1 } from "../hooks/useSafeEffect1";
import { useAutoRefreshGlobalTasksEffect } from "../hooks/useAutoRefreshGlobalTasksEffect";
import { useTransitAudioEffect } from "../hooks/useTransitAudioEffect";
import { useGlobalTasksSyncEffect } from "../hooks/useGlobalTasksSyncEffect";
import { useWorkspaceTemplateEffect } from "../hooks/useWorkspaceTemplateEffect";
import { useCanvasLoadEffect } from "../hooks/useCanvasLoadEffect";
import { useNodeSyncEffect } from "../hooks/useNodeSyncEffect";
import { usePluginEnvEffect } from "../hooks/usePluginEnvEffect";
import { useSelectedRefSources } from "../hooks/useSelectedRefSources";
import { useCanvasNodes } from "../hooks/useCanvasNodes";
import { useResourceLocalUrlMap } from "../hooks/useResourceLocalUrlMap";
import { useHandleEdgeClick } from "../hooks/useHandleEdgeClick";
import { useMultiConnect } from "../hooks/useMultiConnect";
import { useHandleConnect } from "../hooks/useHandleConnect";
import { useCreateImageNode } from "../hooks/useCreateImageNode";
import { useStopGeneration } from "../hooks/useStopGeneration";
import { useAutoLayout } from "../hooks/useAutoLayout";
import { useOnDrop } from "../hooks/useOnDrop";
import { useApplyPerformanceProfile } from "../hooks/useApplyPerformanceProfile";
import { useOnConnectEnd } from "../hooks/useOnConnectEnd";
import { useHandleSplitOne } from "../hooks/useHandleSplitOne";
import { useRelinkMissingAssets } from "../hooks/useRelinkMissingAssets";
import { useSaveEditedVideo } from "../hooks/useSaveEditedVideo";
import { useSaveCanvasState } from "../hooks/useSaveCanvasState";
import { useRunNodeChain } from "../hooks/useRunNodeChain";
import { useAssetCandidateDialog } from "../hooks/useAssetCandidateDialog";
import { useGroupNodes } from "../hooks/useGroupNodes";
import { useHandleSplit } from "../hooks/useHandleSplit";
import { useTianjiPortraitReview } from "../hooks/useTianjiPortraitReview";
import { useArkTrustedAssetReview } from "../hooks/useArkTrustedAssetReview";
import { useRelinkFromFolder } from "../hooks/useRelinkFromFolder";
import { useLayeredRun } from "../hooks/useLayeredRun";
import { useHandlePaste } from "../hooks/useHandlePaste";
import { WanJuanConfigButlerHelp } from "../components/config-butler-help";
import {
  WanJuanRenderRuntime,
  WanJuanRuntimeNodeDataKeys,
  WanJuanStripRuntimeNodeData,
  WanJuanNodeTypeLabel,
  WanJuanNodeStatusLabel,
  WanJuanNodeStatusColor,
  WanJuanRenderShellNode,
  WanJuanWithRenderMode,
  WanJuanHeavyRenderNodeTypes,
  WanJuanEstimateNodeSize,
  WanJuanNodeNeedsFullRender,
  WanJuanComputeNodeRenderMode,
  WanJuanIsCriticalNodePatch,
  WanJuanUseThrottledNodeDataUpdate,
  WanJuanNodeHandle,
} from "../components/render-mode";
import {
  WANJUAN_PERFORMANCE_PROFILE_STORAGE_KEY,
  WANJUAN_PERFORMANCE_PROFILE_CUSTOM_KEY,
  WANJUAN_PERFORMANCE_PROFILE_PRESETS,
  WanJuanNormalizePerformanceProfile,
  WanJuanReadPerformanceProfile,
  WanJuanPerformanceProfileList,
} from "../lib/performance-profile";
import {
  TongyiWanxiangLogo,
  WanJuanReplaceImageIcon,
  WanJuanTianjiPortraitReviewIcon,
} from "../components/icons";
import {
  WanJuanFavoriteModelStoreKey,
  WanJuanReadFavoriteModels,
  WanJuanWriteFavoriteModels,
  WanJuanSortModelsByFavorites,
  WanJuanGetPreferredModel,
  WanJuanShouldAutoPreferredModel,
  WanJuanUseFavoriteModels,
} from "../lib/model-favorites";
import { videoEditorModal } from "../components/video-editor-modal";
import {
  wanjuanCropImageToDataUrl,
  WanJuanImageCropNode,
} from "../components/image-crop-node";
import { WjImageZoomModal } from "../components/image-zoom-modal";
import {
  wanjuanRenderResourcePreview,
  wanjuanRenderResourcePickerHeader,
  WanJuanResourcePicker,
} from "../components/resource-picker";
import { WanJuanVideoFaceBlurNode } from "../components/video-face-blur-node";
import { WanJuanQwenTtsCloneNode } from "../components/qwen-tts-clone-node";
import { WanJuanRealEsrganVideoNode } from "../components/real-esrgan-video-node";
import { WanJuanImageNode } from "../components/image-node";
import { WanJuanPromptNode } from "../components/prompt-node";
import { WanJuanTextNode } from "../components/text-node";
import { WanJuanGridSplitNode } from "../components/grid-split-node";
import { WanJuanGridMergeNode } from "../components/grid-merge-node";
import { WanJuanVideoNode } from "../components/video-node";
import {
  WanJuanTtsMusicNode,
  WanJuanUnifiedAudioNode,
  WanJuanIsMusicModel,
} from "../components/audio-nodes";
import { WanJuanCustomApiNode } from "../components/custom-api-node";
import { WanJuanVideoExtractNode } from "../components/video-extract-node";
import {
  wanjuanLooksLikeLocalMediaPath,
  wanjuanNormalizeReferenceMediaUrl,
  wanjuanPushReferenceMediaUrl,
  wanjuanNodeTextValue,
  wanjuanCollectNodeReferenceMedia,
  mediaUrlToDataUrl,
  wanjuanMediaUrlToDataUrl,
} from "../lib/reference-media";
import { WanJuanTextConcatNode } from "../components/text-concat-node";
import { WanJuanUrlToImageNode } from "../components/url-to-image-node";
import { WanJuanFileToLinkNode } from "../components/file-to-link-node";
import { WanJuanFlowEdge } from "../components/flow-edge";
import { WanJuanImageAnnotateModal } from "../components/image-annotate-modal";
import { agentThemePalettes } from "../lib/agent-theme-palettes";
import { WanJuanSettingsApiConfigSection } from "../components/settings-api-config-section";
import { WanJuanEmptyCanvasPlaceholder } from "../components/empty-canvas-placeholder";
import { WanJuanGlobalTasksPanel } from "../components/global-tasks-panel";
import { WanJuanCanvasPressureMeter } from "../components/canvas-pressure-meter";
import { WanJuanCanvasBottomDock } from "../components/canvas-bottom-dock";
import { WanJuanCanvasContextMenu } from "../components/canvas-context-menu";
import { WanJuanRenameProjectDialog } from "../components/rename-project-dialog";
import { WanJuanSystemNotificationDialog } from "../components/system-notification-dialog";
import { WanJuanSystemNotificationPanel } from "../components/system-notification-panel";
import { WanJuanProjectMenu } from "../components/project-menu";
import { WanJuanGlobalConfigPresetsPanel } from "../components/global-config-presets-panel";
import { WanJuanTtsMusicSettingsPanel } from "../components/tts-music-settings-panel";
import { WanJuanAudioModelSettingsPanel } from "../components/audio-model-settings-panel";
import { WanJuanTextModelSettingsPanel } from "../components/text-model-settings-panel";
import { WanJuanImageModelSettingsPanel } from "../components/image-model-settings-panel";
import { WanJuanConfigButlerBatchModal } from "../components/config-butler-batch-modal";
import { WanJuanVideoModelSettingsPanel } from "../components/video-model-settings-panel";
import { WanJuanTongyiWanxiangSettingsPanel } from "../components/tongyi-wanxiang-settings-panel";
import { WanJuanSeedanceSettingsPanel } from "../components/seedance-settings-panel";
import { WanJuanConfigButlerSettingsPanel } from "../components/config-butler-settings-panel";
import { WanJuanConfigButlerErrorAssistant } from "../components/config-butler-error-assistant";
import { WanJuanProjectGroupPanel } from "../components/project-group-panel";
import { WanJuanSettingsDataTab } from "../components/settings-data-tab";
import { WanJuanSettingsGenerationTab } from "../components/settings-generation-tab";
import { WanJuanSettingsBasicTab } from "../components/settings-basic-tab";
import { WanJuanSettingsCloudTab } from "../components/settings-cloud-tab";
import { WanJuanSettingsExtensionsTab } from "../components/settings-extensions-tab";
import { WanJuanBackupDialog } from "../components/backup-dialog";
import { WanJuanAgentConfigPanel } from "../components/agent-config-panel";
import { WanJuanStorageOptimizationPanel } from "../components/storage-optimization-panel";
import {
  membershipLimits,
  wanjuanI18n,
  fetchDocAsPlainText,
  getMem0Headers,
  renderCopyGlyph,
  compactGlobalTasks,
  BACKUP_SETTINGS_SECTION_KEYS,
  getProjectOptionList,
  mergeTransitResourceEntries,
  collectProjectResourceCandidates,
  buildProjectResourceMap,
  collectProjectFileReferences,
  EXPORT_RUNTIME_NODE_DATA_KEYS,
} from "../lib/app-root-helpers";
import {
  agentIconOptions,
  getAgentIconKey,
  renderAgentIconGlyph,
  renderAgentIconSurface,
  agentChatRailMaxWidth,
  agentChatOuterPadding,
  agentChatRailStyle,
  agentMessagesScrollStyle,
  buildKnowledgeChunks,
  tokenizeKnowledgeQuery,
  selectKnowledgeChunksForQuery,
  releaseAgentAttachment,
  getAgentAttachmentKind,
  getAgentAttachmentMeta,
  formatAgentAttachmentSize,
  renderAgentAttachmentGlyph,
  readAgentAttachmentFileAsDataUrl,
  sanitizeAgentConversationText,
  formatAgentTime,
  getAgentOptionList,
  normalizeAgentIdSelection,
} from "../lib/agent";
import {
  cloneBackupValue,
  normalizeBackupSettingsSections,
  sanitizeProjectAssetStorageSegment,
  shouldPersistProjectAssetValue,
  buildProjectAssetStorageKey,
  convertProjectAssetValueToPortableString,
  extractProjectPortableDataRefs,
  buildBackupRestoreReport,
  formatBackupRestoreReport,
  getExistingProjectMediaPortableValue,
  isProjectMediaExternalReference,
  getProjectMediaBindingKind,
  getProjectMediaBindingOrigin,
  hasExternalUploadLikeFileName,
  isProjectMediaFileBackedBinding,
  buildProjectMediaSourceSignature,
  collectProjectMediaBindingPaths,
  getProjectAssetDialogFilters,
  buildBackupExternalAssetStorageValue,
  backupExternalAssetMatchesBinding,
  normalizeProjectLocalforagePayload,
} from "../lib/backup";
import {
  normalizeButlerBaseUrl,
  normalizeButlerModelName,
  getButlerModelFamilyKey,
  getButlerModelGenerationRank,
  filterButlerLatestTwoGenerations,
  normalizeModelCategory,
  configButlerCategoryOptions,
  buildXSeeVeoReferenceVideoProtocol,
  butlerCloneObject,
  butlerUniquePaths,
  butlerNormalizeTaskPath,
  normalizeProtocolConfig,
  finalizeButlerProtocolConfig,
  configButlerToolsExposed,
  coerceProtocolFieldValue,
  getProtocolCategoryLabel,
  inferProtocolDisplayName,
  normalizeProtocolName,
  parseButlerLooseJson,
  extractButlerJsonKeys,
  extractButlerCurlExamples,
  extractButlerOpenApiSummary,
  inferButlerProtocolFromTools,
  buildConfigButlerToolContext,
  formatConfigButlerToolContext,
  getButlerDocFieldsForPath,
  applyButlerLearnedProtocolRules,
  validateButlerProtocolConfig,
  dryRunButlerProtocolConfig,
  probeButlerProtocol,
  validateAndRepairConfigButlerResult,
  configButlerAdvancedToolsExposed,
  getButlerModelNameFromItem,
  extractButlerModelsFromPayload,
  inferButlerCategoryFromModelName,
  wanjuanButlerBuildProviderProtocol,
  wanjuanButlerProviderProtocolPackages,
  matchWanJuanProviderProtocolPackage,
  wanjuanButlerProviderToolsExposed,
  buildButlerFallbackProtocol,
  scanButlerTargetModels,
  compareButlerModelSnapshots,
  normalizeButlerBatchItems,
  stableConfigButlerTaskStringify,
  getConfigButlerTaskFailureSignature,
  buildLocalConfigButlerErrorDiagnosis,
  normalizeConfigButlerDiagnosis,
  inferConfigButlerProblemPart,
} from "../lib/config-butler";
import {
  WANJUAN_NODE_TYPES,
  WANJUAN_EDGE_TYPES,
  wanjuanCreateStarterCanvas,
  WANJUAN_STARTER_EDGES,
  wanjuanIsDefaultStarterCanvas,
  WANJUAN_PLAN_LIMITS,
} from "../components/canvas-node-registry";
import {
  WANJUAN_MULTIWINDOW_SECRET_SALT,
  WANJUAN_ACTIVATION_SERVER_URL,
  wanjuanHashString,
  wanjuanVerifyActivationCode,
  wanjuanCheckForUpdate,
  wanjuanInstallCrossWindowNavigation,
  WANJUAN_DEVICE_ID_STORAGE_KEY,
  wanjuanGenerateUuid,
  wanjuanGetOrCreateDeviceId,
  wanjuanChildWindowRefs,
} from "../lib/collaboration";

if (typeof globalThis.hydrateProjectAssetContainer !== `function`) {
  globalThis.hydrateProjectAssetContainer = async function hydrateProjectAssetContainer(value) {
    if (Array.isArray(value)) {
      return await Promise.all(value.map((item) => globalThis.hydrateProjectAssetContainer(item)));
    }
    if (!value || typeof value != `object`) return value;
    let result = {};
    for (let [key, value2] of Object.entries(value)) {
      if (typeof value2 == `string` && key.endsWith(`Ref`)) {
        result[key] = value2;
        continue;
      }
      result[key] = await globalThis.hydrateProjectAssetContainer(value2);
    }
    return result;
  };
}
if (typeof globalThis.externalizeProjectCanvasState !== `function`) {
  globalThis.externalizeProjectCanvasState = async function externalizeProjectCanvasState(value) {
    let cleanRuntimeFields = (item) => {
      if (Array.isArray(item)) return item.map(cleanRuntimeFields);
      if (!item || typeof item != `object`) return item;
      let result = {};
      for (let [key, value2] of Object.entries(item)) {
        if (key === `wanjuanRenderMode` || key === `wanjuanRenderReason` || key === `wanjuanRenderRuntime`) continue;
        result[key] = cleanRuntimeFields(value2);
      }
      return result;
    };
    return value && typeof value == `object` ?
      cleanRuntimeFields(JSON.parse(JSON.stringify(value))) :
      value;
  };
}
var wanjuanGlobalPreloadRegistry = Array.isArray(globalThis?.zr) ? globalThis.zr : [];
(function() {
  let relList = document.createElement(`link`).relList;
  if (relList && relList.supports && relList.supports(`modulepreload`)) return;
  for (let link of document.querySelectorAll(`link[rel="modulepreload"]`)) preloadLink(link);
  new MutationObserver((mutations) => {
    for (let mutation of mutations)
      if (mutation.type === `childList`)
        for (let node of mutation.addedNodes)
          node.tagName === `LINK` && node.rel === `modulepreload` && preloadLink(node);
  }).observe(document, {
    childList: true,
    subtree: true
  });

  function getFetchOptions(link) {
    let fetchOptions = {};
    return (
      link.integrity && (fetchOptions.integrity = link.integrity),
      link.referrerPolicy && (fetchOptions.referrerPolicy = link.referrerPolicy),
      link.crossOrigin === `use-credentials` ?
      (fetchOptions.credentials = `include`) :
      link.crossOrigin === `anonymous` ?
      (fetchOptions.credentials = `omit`) :
      (fetchOptions.credentials = `same-origin`),
      fetchOptions
    );
  }

  function preloadLink(link) {
    if (link.ep) return;
    link.ep = true;
    let fetchOptions = getFetchOptions(link);
    fetch(link.href, fetchOptions);
  }
})();
var reactDomClientModule = wanjuanReactDomClientFactory(),
  reactModule = wanjuanToEsm(wanjuanReactFactory(), 1),
  jsxRuntimeModule = wanjuanJsxRuntimeFactory();
// —— 可读化别名：从打包的 React / jsx-runtime / ReactDOM 取出常用成员（同一 React 实例，行为不变）——
const { useState, useEffect, useRef, useCallback, useMemo, memo: reactMemo, StrictMode } = reactModule;
const { jsx, jsxs, Fragment } = jsxRuntimeModule;
const { createRoot } = reactDomClientModule;
var localforageModule = wanjuanToEsm(wanjuanLocalforageFactory(), 1);
var reactDomModule = wanjuanReactDomFactory(),
  WANJUAN_MODULEPRELOAD_REL = `modulepreload`,
  wanjuanResolveModulePreloadUrl = function(url, baseUrl) {
    return new URL(url, baseUrl).href;
  },
  wanjuanModulePreloadSeen = {},
  wanjuanPreloadModuleDeps = function(importFn, deps, importerUrl) {
    let preloadPromise = Promise.resolve();
    if (deps && deps.length > 0) {
      let links = document.getElementsByTagName(`link`),
        cspNonceMeta = document.querySelector(`meta[property=csp-nonce]`),
        nonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute(`nonce`);

      function allSettled(promises) {
        return Promise.all(
          promises.map((promise) =>
            Promise.resolve(promise).then(
              (value) => ({
                status: `fulfilled`,
                value: value
              }),
              (reason) => ({
                status: `rejected`,
                reason: reason
              }),
            ),
          ),
        );
      }
      preloadPromise = allSettled(
        deps.map((dep) => {
          if (((dep = wanjuanResolveModulePreloadUrl(dep, importerUrl)), dep in wanjuanModulePreloadSeen)) return;
          wanjuanModulePreloadSeen[dep] = true;
          let isCss = dep.endsWith(`.css`),
            relSelector = isCss ? `[rel="stylesheet"]` : ``;
          if (importerUrl)
            for (let index = links.length - 1; index >= 0; index--) {
              let existingLink = links[index];
              if (existingLink.href === dep && (!isCss || existingLink.rel === `stylesheet`)) return;
            }
          else if (document.querySelector(`link[href="${dep}"]${relSelector}`)) return;
          let linkElement = document.createElement(`link`);
          if (
            ((linkElement.rel = isCss ? `stylesheet` : WANJUAN_MODULEPRELOAD_REL),
              isCss || (linkElement.as = `script`),
              (linkElement.crossOrigin = ``),
              (linkElement.href = dep),
              nonce && linkElement.setAttribute(`nonce`, nonce),
              document.head.appendChild(linkElement),
              isCss)
          )
            return new Promise((resolve, reject) => {
              (linkElement.addEventListener(`load`, resolve),
                linkElement.addEventListener(`error`, () =>
                  reject(Error(`Unable to preload CSS for ${dep}`)),
                ));
            });
        }),
      );
    }

    function dispatchPreloadError(error) {
      let preloadErrorEvent = new Event(`vite:preloadError`, {
        cancelable: true
      });
      if (((preloadErrorEvent.payload = error), window.dispatchEvent(preloadErrorEvent), !preloadErrorEvent.defaultPrevented))
        throw error;
    }
    return preloadPromise.then((results) => {
      for (let result of results || []) result.status === `rejected` && dispatchPreloadError(result.reason);
      return importFn().catch(dispatchPreloadError);
    });
  };

var dagreModule = wanjuanToEsm(wanjuanDagreFactory(), 1);


localforageModule.default.config({
  driver: [localforageModule.default.INDEXEDDB, localforageModule.default.LOCALSTORAGE],
  name: `mutiwindow`,
  storeName: `canvas_state`,
	      });

function WanJuanCanvasShell(props) {
  return jsxs(ReactFlowProvider, {
    children: [
      jsx(`style`, {
        children: `
        .react-flow__attribution { display: none !important; visibility: hidden !important; opacity: 0 !important; }
        .xyflow__attribution { display: none !important; visibility: hidden !important; opacity: 0 !important; }
        .react-flow__pane { pointer-events: auto !important; }
        .nopan { cursor: auto; }
        .nodrag { cursor: auto; -webkit-app-region: no-drag; }
        .wanjuan-video-fullscreen-modal,
        .wanjuan-video-fullscreen-modal * { -webkit-app-region: no-drag; }
        .react-flow__node { overflow: visible !important; }
        .react-flow__handle.connectingto,
        .react-flow__handle.valid,
        .react-flow__handle.connectionindicator:hover {
          background: #3b82f6 !important;
          border-color: rgba(255,255,255,0.95) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.28), 0 0 18px rgba(59,130,246,0.95) !important;
          opacity: 1 !important;
        }
        .wanjuan-render-shell-node {
          width: 170px;
          height: 72px;
          min-width: 170px;
          min-height: 72px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e5e7eb;
        }
        .wanjuan-render-shell-frame {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid #334155;
          border-radius: 10px;
          background: color-mix(in srgb, var(--wj-surface,#161616) 94%, transparent);
          box-shadow: 0 8px 20px rgba(0,0,0,.22);
          overflow: hidden;
        }
        .wanjuan-render-shell-node.is-selected .wanjuan-render-shell-frame {
          box-shadow: 0 0 0 2px rgba(59,130,246,.35), 0 8px 22px rgba(0,0,0,.28);
        }
        .wanjuan-render-shell-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          flex: 0 0 auto;
          box-shadow: 0 0 12px color-mix(in srgb, var(--wanjuan-shell-color,#38bdf8) 60%, transparent);
        }
        .wanjuan-render-shell-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .wanjuan-render-shell-copy strong {
          font-size: 12px;
          line-height: 16px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wanjuan-render-shell-copy span {
          font-size: 10px;
          line-height: 14px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wanjuan-render-mode-lite img,
        .wanjuan-render-mode-lite video,
        .wanjuan-render-mode-lite audio {
          content-visibility: auto;
          contain-intrinsic-size: 220px 160px;
        }
        [data-wanjuan-render-mode="full"],
        [data-wanjuan-render-mode="lite"] {
          display: contents;
        }
        .wanjuan-settings-sidebar-group {
          color: color-mix(in srgb,var(--wj-muted,#6b7280) 82%,transparent);
          letter-spacing: .06em;
        }
        .wanjuan-settings-sidebar-group:not(:first-of-type) {
          border-top: 1px solid color-mix(in srgb,var(--wj-border,#333) 54%,transparent);
          margin-top: 6px;
          padding-top: 10px;
        }
        html.wanjuan-canvas-dragging .react-flow__node:not(.selected):not([aria-selected="true"]) {
          filter: none !important;
        }
        html.wanjuan-canvas-dragging .react-flow__node:not(.selected):not([aria-selected="true"]) *,
        html.wanjuan-canvas-dragging .react-flow__edge * {
          transition-duration: 0ms !important;
          animation-play-state: paused !important;
          backdrop-filter: none !important;
        }
        html.wanjuan-canvas-dragging .react-flow__node:not(.selected):not([aria-selected="true"]) .shadow-xl,
        html.wanjuan-canvas-dragging .react-flow__node:not(.selected):not([aria-selected="true"]) .shadow-2xl {
          box-shadow: 0 1px 6px rgba(0,0,0,.28) !important;
        }
        html.wanjuan-canvas-dragging .react-flow__node:not(.selected):not([aria-selected="true"]) video,
        html.wanjuan-canvas-dragging .react-flow__node:not(.selected):not([aria-selected="true"]) audio {
          pointer-events: none !important;
        }
      `,
      }),
      jsx(WanJuanAppCanvas, {
        ...props
      }),
    ],
  });
}

function WanJuanAppCanvas({
  projectId: projectId = `default`,
  textApiUrl: propTextApiUrl,
  textApiKey: propTextApiKey,
  imageApiUrl: propImageApiUrl,
  imageApiKey: propImageApiKey,
  videoApiUrl: videoApiUrl,
  videoApiKey: videoApiKey,
  audioApiUrl: audioApiUrl,
	  audioApiKey: audioApiKey,
	  textModel: textModel = ``,
	  drawingModel: drawingModel = ``,
	  imageCompatResolutions: imageCompatResolutions = `1024x1024
1280x720
720x1280
2048x2048
2560x1440
1440x2560
3840x2160
2160x3840`,
	  videoModel: videoModel = ``,
  videoDurations: videoDurations = `10
15`,
  videoResolutions: videoResolutions = `1280x720
	720x1280
	1080x720
	720x1080
	720x720`,
  videoAspectRatios: videoAspectRatios = `16:9
	9:16
	1:1
	3:2
	2:3`,
  seedanceModel: seedanceModel = wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_SEEDANCE_MODELS),
  tianjiSeedanceModel: tianjiSeedanceModel = wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS),
  seedanceDurations: seedanceDurations = WANJUAN_JIXIN_BUILTIN_SEEDANCE_DURATIONS,
  seedanceResolutions: seedanceResolutions = WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS,
  seedanceRatios: seedanceRatios = WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS,
  seedanceGenerateAudio: seedanceGenerateAudio = true,
  seedanceWatermark: seedanceWatermark = false,
  seedanceEnableWebSearch: seedanceEnableWebSearch = false,
  seedanceVirtualPortraits: seedanceVirtualPortraits = [],
  tongyiWanxiangTextModels: tongyiWanxiangTextModels = wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS),
  tongyiWanxiangReferenceImageModels: tongyiWanxiangReferenceImageModels = wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_REFERENCE_IMAGE_MODELS),
  tongyiWanxiangImageModels: tongyiWanxiangImageModels = wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_IMAGE_MODELS),
  tongyiWanxiangEditModels: tongyiWanxiangEditModels = wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_EDIT_MODELS),
  tongyiWanxiangDurations: tongyiWanxiangDurations = WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_DURATIONS,
  tongyiWanxiangResolutions: tongyiWanxiangResolutions = WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RESOLUTIONS,
  tongyiWanxiangRatios: tongyiWanxiangRatios = WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RATIOS,
  audioModel: audioModel = ``,
  ttsMusicModel: ttsMusicModel = ``,
  showToast: showToast,
  transitResources: resources = [],
  addTransitResource: addGeneratedAsset,
  presetPrompts: presetPrompts = [],
  membership: membership = {
    type: `FREE`,
    expiry: 0
  },
  globalTasks: GlobalTasks = [],
  updateGlobalTasks: updateTaskList,
  onSendToActiveTab: sendToActiveTab,
	  customNodeTemplates: customNodeTemplates = [],
	  onAddCustomNodeTemplate: addCustomNode,
	  onDeleteCustomNodeTemplate: deleteCustomNode,
  globalPollingInterval: pollIntervalMs = 3e3,
  globalMaxPollingDuration: timeoutSeconds = 600,
  layeredRunConcurrencyOptions: layeredRunConcurrencyOptions = `2
3
5`,
  layeredRunMaxConcurrency: layeredRunMaxConcurrency = 2,
  apiConfigs: apiConfigs = [],
  arkTrustedAssetConfig: arkTrustedAssetConfig = WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG,
  setArkTrustedAssetConfig: setArkTrustedAssetConfig = () => {},
  modelProtocolRegistry: modelProtocolRegistry = {},
  textModelApiBindings: textModelApiBindings = {},
  textModelProtocolBindings: textModelProtocolBindings = {},
  imageModelApiBindings: imageModelApiBindings = {},
  imageModelProtocolBindings: imageModelProtocolBindings = {},
  videoModelProtocolBindings: videoModelProtocolBindings = {},
	  videoModelApiBindings: videoModelApiBindings = {},
	  videoModelRequestProfiles: videoModelRequestProfiles = `{}`,
	  audioModelProtocolBindings: audioModelProtocolBindings = {},
	  audioModelApiBindings: audioModelApiBindings = {},
	  seedanceUploadMode: seedanceUploadMode = WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE,
	  tosConfig: tosConfig = {},
	  customPublicUploadConfig: customPublicUploadConfig = {},
  qiniuConfig: qiniuConfig = {},
  initialEmptyProject: initialEmptyProject = false,
  onInitialEmptyProjectReady: onInitialEmptyProjectReady,
	}) {
  let [nodes, setNodes, onNodesChange] = useEdgesState([]),
		    [edges, setEdges, onEdgesChange] = useNodesState(WANJUAN_STARTER_EDGES),
		    [shouldFitView, setShouldFitView] = useState(false),
		    [menuPosition, setMenuPosition] = useState(null),
		    lastCanvasMenuPositionRef = useRef(null),
		    [contextToolGroupsOpen, setContextToolGroupsOpen] = useState({
	      format: false,
	      tools: false,
	      extensions: false,
	    }),
	    wrapperRef = useRef(null),
    fileInputRef = useRef(null), {
      screenToFlowPosition: screenToFlowPosition,
      getNodes: getNodes,
      getEdges: getEdges,
      fitView: fitView,
      setViewport: setViewport
    } = useReactFlow(),
	    [isResourceSubmenuOpen, setResourceSubmenuOpen] = useState(false),
	    [resourceSubmenuOpenAlt, setResourceSubmenuOpenAlt] = useState(false),
	    abortControllersRef = useRef(new Map()),
	    wanjuanPrevEdgesRef = useRef([]),
	    [multiConnectIds, setMultiConnectIds] = useState(null),
	    [wanjuanViewport, setWanjuanViewport] = useState({
	      x: 0,
	      y: 0,
	      zoom: 1
	    }),
	    [wanjuanViewportSize, setWanjuanViewportSize] = useState({
	      width: 1600,
	      height: 900
	    }),
	    wanjuanViewportUpdateRef = useRef(0),
	    wanjuanCommitViewport = useCallback((viewport) => {
	      if (!viewport) return;
	      wanjuanViewportUpdateRef.current = viewport;
	      setWanjuanViewport((prev) =>
	        Math.abs(prev.x - viewport.x) > 0.5 ||
	        Math.abs(prev.y - viewport.y) > 0.5 ||
	        Math.abs(prev.zoom - viewport.zoom) > 0.005 ?
	        viewport :
	        prev,
	      );
	    }, []);
  useOnViewportChange({ onEnd: wanjuanCommitViewport });
  (useSafeEffect1({ nodes, setNodes }),
    useEffect(() => {
      const previewCanvas = document.createElement(`canvas`);
      previewCanvas.width = 640;
      previewCanvas.height = 360;
      const previewContext = previewCanvas.getContext(`2d`);
      if (previewContext) {
        const gradient = previewContext.createLinearGradient(0, 0, 640, 360);
        gradient.addColorStop(0, `#334155`);
        gradient.addColorStop(0.5, `#0f766e`);
        gradient.addColorStop(1, `#7c3aed`);
        previewContext.fillStyle = gradient;
        previewContext.fillRect(0, 0, 640, 360);
        previewContext.fillStyle = `rgba(255,255,255,0.88)`;
        previewContext.font = `600 32px sans-serif`;
        previewContext.fillText(`WanJuan result fixture`, 36, 190);
      }
      const tinyPreview = previewCanvas.toDataURL(`image/jpeg`, 0.78);
      const nodeTypes = [`imageNode`, `promptNode`, `videoNode`, `textNode`, `audioNode`, `musicNode`, `videoExtractNode`];
      globalThis.__wanjuanCanvasDebug = {
        loadFixture: (requestedCount = 100, options = {}) => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          const count = Math.max(0, Math.min(1200, Number(requestedCount) || 0));
          const withResults = options.withResults !== !1;
          const videoThumbnails = options.videoThumbnails !== !1;
          const extractedFrameCount = Math.max(0, Math.min(500, Number(options.extractedFrameCount || 120)));
          const sampleVideoUrl = `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4`;
          const sampleAudioUrl = `https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3`;
          const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
          const fixtureNodes = Array.from({ length: count }, (_, index) => {
            const type = nodeTypes[index % nodeTypes.length];
            const extractedFrames = type === `videoExtractNode` && withResults ? Array.from({ length: extractedFrameCount }, () => tinyPreview) : void 0;
            const data = {
              label: `压力节点 ${index + 1}`,
              expanded: !1,
              prompt: `性能测试 ${index + 1}`,
              text: `性能测试文本 ${index + 1}`,
              mediaKind: type === `imageNode` ? `image` : void 0,
              imageUrl: withResults && (type === `imageNode` || type === `promptNode`) ? tinyPreview : void 0,
              thumbnailUrl: withResults && (type === `imageNode` || type === `promptNode` || type === `videoNode` && videoThumbnails) ? tinyPreview : void 0,
              videoUrl: withResults && type === `videoNode` ? sampleVideoUrl : void 0,
              audioUrl: withResults && type === `audioNode` ? sampleAudioUrl : void 0,
              resultData: withResults && type === `textNode` ? `已生成的文本结果 ${index + 1}` : void 0,
              sunoClips: withResults && type === `musicNode` ? Array.from({ length: 4 }, (_, clipIndex) => ({
                id: `perf-clip-${index}-${clipIndex}`,
                title: `生成曲目 ${clipIndex + 1}`,
                audioUrl: sampleAudioUrl,
                duration: 4,
              })) : void 0,
              allExtractedImages: extractedFrames,
              extractedImages: extractedFrames,
            };
            return {
              id: `wanjuan-perf-${index}`,
              type,
              position: { x: (index % columns) * 340, y: Math.floor(index / columns) * 300 },
              style: { width: 260, height: 220 },
              data,
            };
          });
          const fixtureEdges = fixtureNodes.slice(1).map((node, index) => ({
            id: `wanjuan-perf-edge-${index}`,
            source: fixtureNodes[index].id,
            target: node.id,
            type: `custom`,
          }));
          setNodes(fixtureNodes);
          setEdges(fixtureEdges);
          window.setTimeout(() => fitView({ padding: 0.12, duration: 0 }), 50);
          return { nodes: fixtureNodes.length, edges: fixtureEdges.length };
        },
        clearFixture: () => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          setNodes([]);
          setEdges([]);
        },
        selectMediaNodes: (videoCount = 12, audioCount = 8) => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          let selectedVideos = 0,
            selectedAudios = 0;
          setNodes((items) => items.map((node) => {
            let shouldSelect = !1;
            if (node.type === `videoNode` && selectedVideos < videoCount) {
              selectedVideos += 1;
              shouldSelect = !0;
            } else if (node.type === `audioNode` && selectedAudios < audioCount) {
              selectedAudios += 1;
              shouldSelect = !0;
            }
            return node.selected === shouldSelect ? node : { ...node, selected: shouldSelect };
          }));
          return { videos: selectedVideos, audios: selectedAudios };
        },
        selectNodesByType: (nodeType, requestedCount = 1) => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          let selectedCount = 0;
          const limit = Math.max(0, Number(requestedCount) || 0);
          setNodes((items) => items.map((node) => {
            const shouldSelect = node.type === nodeType && selectedCount < limit;
            if (shouldSelect) selectedCount += 1;
            return node.selected === shouldSelect ? node : { ...node, selected: shouldSelect };
          }));
          return { type: nodeType, selected: selectedCount };
        },
        clearSelection: () => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          setNodes((items) => items.map((node) => node.selected ? { ...node, selected: !1 } : node));
        },
        inspectFixtureData: () => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          const items = getNodes();
          return {
            imageResults: items.filter((node) => typeof node.data?.imageUrl === `string` && node.data.imageUrl).length,
            videoResults: items.filter((node) => typeof node.data?.videoUrl === `string` && node.data.videoUrl).length,
            audioResults: items.filter((node) => typeof node.data?.audioUrl === `string` && node.data.audioUrl).length,
            musicClips: items.reduce((total, node) => total + (Array.isArray(node.data?.sunoClips) ? node.data.sunoClips.length : 0), 0),
            extractedFrames: items.reduce((total, node) => total + (Array.isArray(node.data?.allExtractedImages) ? node.data.allExtractedImages.length : 0), 0),
          };
        },
        nodeSnapshot: (nodeId) => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          const node = getNodes().find((item) => item.id === nodeId),
            element = document.querySelector(`.react-flow__node[data-id="${CSS.escape(String(nodeId))}"]`),
            renderElement = element?.querySelector(`[data-wanjuan-render-mode]`);
          return {
            exists: !!node,
            selected: !!node?.selected,
            renderMode: renderElement?.getAttribute(`data-wanjuan-render-mode`) || null,
            images: element?.querySelectorAll(`img`).length || 0,
            videos: element?.querySelectorAll(`video`).length || 0,
            audios: element?.querySelectorAll(`audio`).length || 0,
            extractedFrames: Array.isArray(node?.data?.allExtractedImages) ? node.data.allExtractedImages.length : 0,
            musicClips: Array.isArray(node?.data?.sunoClips) ? node.data.sunoClips.length : 0,
            hasImageResult: !!node?.data?.imageUrl,
            hasVideoResult: !!node?.data?.videoUrl,
            hasAudioResult: !!node?.data?.audioUrl,
            frameHandles: element?.querySelectorAll(`[data-handleid^="frame-"]`).length || 0,
            hasLastFrameHandle: !!element?.querySelector(`[data-handleid="frame-119"]`),
          };
        },
        connectFixtureFrame: (sourceId = `wanjuan-perf-6`, frameIndex = 119, targetId = `wanjuan-perf-7`) => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          const edge = {
            id: `wanjuan-perf-frame-edge-${sourceId}-${frameIndex}-${targetId}`,
            source: sourceId,
            sourceHandle: `frame-${frameIndex}`,
            target: targetId,
            type: `custom`,
          };
          setEdges((items) => [...items.filter((item) => item.id !== edge.id), edge]);
          return edge;
        },
        setViewport: (viewport = {}) => {
          if (document.documentElement.dataset.wanjuanDebug !== `1`) throw Error(`Canvas debug mode is disabled`);
          const nextViewport = {
            x: Number(viewport.x || 0),
            y: Number(viewport.y || 0),
            zoom: Math.max(0.1, Math.min(2, Number(viewport.zoom || 1))),
          };
          setViewport(nextViewport, { duration: 0 });
          setWanjuanViewport(nextViewport);
          return nextViewport;
        },
        snapshot: () => ({
          nodes: document.querySelectorAll(`.react-flow__node`).length,
          edges: document.querySelectorAll(`.react-flow__edge`).length,
          dom: document.getElementsByTagName(`*`).length,
          images: document.querySelectorAll(`.react-flow__node img`).length,
          videos: document.querySelectorAll(`.react-flow__node video`).length,
          activeVideos: document.querySelectorAll(`.react-flow__node video[src]`).length,
          audios: document.querySelectorAll(`.react-flow__node audio`).length,
          activeAudios: document.querySelectorAll(`.react-flow__node audio[src]`).length,
          brokenImages: Array.from(document.querySelectorAll(`.react-flow__node img`)).filter((image) => image.complete && image.naturalWidth === 0).length,
          videoPlayOverlays: Array.from(document.querySelectorAll(`.wanjuan-video-play-overlay`)).map((overlay) => {
            const button = overlay.querySelector(`.wanjuan-video-play-button`),
              overlayRect = overlay.getBoundingClientRect(),
              buttonRect = button?.getBoundingClientRect();
            return buttonRect ? {
              dx: Math.round(buttonRect.left + buttonRect.width / 2 - (overlayRect.left + overlayRect.width / 2)),
              dy: Math.round(buttonRect.top + buttonRect.height / 2 - (overlayRect.top + overlayRect.height / 2)),
            } : { dx: 999, dy: 999 };
          }),
          modes: Array.from(document.querySelectorAll(`.react-flow__node [data-wanjuan-render-mode]`)).reduce((result, element) => {
            const mode = element.getAttribute(`data-wanjuan-render-mode`) || `unknown`;
            result[mode] = (result[mode] || 0) + 1;
            return result;
          }, {}),
          runtime: globalThis.__wanjuanRenderRuntime?.snapshot?.() || {},
          canvasRuntime: globalThis.__wanjuanCanvasRuntimeMetrics || {},
          mediaPerf: globalThis.__wanjuanCanvasMediaPerfStats || {},
          heap: performance.memory ? performance.memory.usedJSHeapSize : 0,
        }),
      };
      return () => { delete globalThis.__wanjuanCanvasDebug; };
    }, [fitView, setEdges, setNodes, setViewport]),
    useEffect(() => {
      let handleBeforeUnload = () => {
        // 关窗/刷新时同步 flush 当前画布到 localStorage，避免 2.8s 自动保存防抖窗口内的未保存编辑丢失。
        // 异步的 saveCanvasState 在卸载时来不及完成写盘；这里用同步 setItem 做 best-effort 兜底。
        try {
          if (shouldFitViewRef.current) {
            let currentProjectId = projectIdRef.current;
            if (!globalThis.__wanjuanProjectMigrationLocks?.has(currentProjectId) && !globalThis.__wanjuanStorageMaintenanceRunning) {
              let canvasState = {
                nodes: (nodesRef.current || [])
                  .filter((node) => node.id !== `ghost-target`)
                  .map((node) => {
                    let nodeData = { ...WanJuanStripRuntimeNodeData(node.data || {}) };
                    Object.keys(nodeData).forEach((key) => { typeof nodeData[key] == `function` && delete nodeData[key]; });
                    return { ...node, data: nodeData };
                  }),
                edges: (edgesRef.current || []).filter((edge) => edge.id !== `ghost-edge`),
              };
              localStorage.setItem(`${canvasStateKeyPrefix}${currentProjectId}`, JSON.stringify(canvasState));
            }
          }
        } catch {}
        (abortControllersRef.current.forEach((controller) => controller.abort()), abortControllersRef.current.clear());
      };
      return (
        window.addEventListener(`beforeunload`, handleBeforeUnload),
        window.addEventListener(`pagehide`, handleBeforeUnload),
        () => {
          (window.removeEventListener(`beforeunload`, handleBeforeUnload),
            window.removeEventListener(`pagehide`, handleBeforeUnload));
        }
      );
    }, []),
    useLateEffect1076({ fitView, nodes, shouldFitView }));
  let [isVisible, setIsVisible] = useState(false),
  [history, setHistory] = useState([]),
  [historyIndex, setHistoryIndex] = useState(-1),
  isRestoringRef = useRef(false),
    historyIndexRef = useRef(-1),
    [dailyGenerationCount, setDailyGenerationCount] = useState(0),
    LoadOnceRef = useRef(false),
    planLimits = WANJUAN_PLAN_LIMITS[membership.type] || WANJUAN_PLAN_LIMITS.FREE;
  useLateEffect1095({ setDailyGenerationCount });
	  let nodesRef = useRef(nodes),
	    edgesRef = useRef(edges),
	    projectIdRef = useRef(projectId),
	    shouldFitViewRef = useRef(shouldFitView);
	  let wanjuanResourceLocalUrlMap = useResourceLocalUrlMap({ resources, useMemo }).wanjuanResourceLocalUrlMap,
	    resolveWanjuanPlayableTaskUrl = use_resolveWanjuanPlayableTaskUrl({ wanjuanResourceLocalUrlMap }).resolveWanjuanPlayableTaskUrl;
	  (useEffect(() => {
	      nodesRef.current = nodes;
	      try { globalThis.__wanjuanCanvasNodesSnapshot = nodes; } catch {}
	    }, [nodes]),
	    useEffect(() => {
	      edgesRef.current = edges;
	    }, [edges]),
	    useSafeEffect7({ setNodes, wanjuanResourceLocalUrlMap }),
	    useLateEffect1120({ projectId, projectIdRef }),
    useEffect(() => {
      shouldFitViewRef.current = shouldFitView;
    }, [shouldFitView]),
    useSafeEffect10({ setWanjuanViewportSize, wrapperRef }));
  let {
    previewImageUrl,
    setPreviewImageUrl,
    imageEditState,
    setImageEditState,
    videoEditState,
    setVideoEditState,
    openImagePreview,
    openImageEditor,
    openVideoEditor,
    handleCropComplete,
  } = useMediaEditors({ setNodes });
  let {
    handleContextMenu,
    handleNodeContextMenu,
    handleSelectionContextMenu,
    handleDelayedSelectionMenu,
  } = useCanvasContextMenu({ wrapperRef, lastCanvasMenuPositionRef, nodesRef, setMenuPosition, setResourceSubmenuOpen, setResourceSubmenuOpenAlt });
  let saveEditedVideo = useSaveEditedVideo({ projectIdRef, setNodes, setVideoEditState, showToast, videoEditState }).saveEditedVideo,
    stopGeneration = useStopGeneration({ abortControllersRef, nodesRef, setEdges, setNodes, showToast, updateTaskList }).stopGeneration,
    canvasStateKeyPrefix = `canvas-state-v1-`,
    desktopCanvasMirrorPrefix = `desktop-canvas-state-v1-`,
	    saveCanvasState = useSaveCanvasState({ WanJuanStripRuntimeNodeData, canvasStateKeyPrefix, desktopCanvasMirrorPrefix, edgesRef, externalizeProjectCanvasState, historyIndexRef, isRestoringRef, localforageModule, nodesRef, projectIdRef, setHistory, setHistoryIndex, shouldFitViewRef, showToast }).saveCanvasState,
    $e = use_$e({ historyIndex, historyIndexRef, isRestoringRef, setEdges, setHistoryIndex, setNodes, edges, history, nodes }).$e,
    redo = use_redo({ historyIndex, historyIndexRef, isRestoringRef, setEdges, setHistoryIndex, setNodes, edges, history, nodes }).redo,
    relinkMissingProjectAssets = useRelinkMissingAssets({ localforageModule, nodesRef, projectIdRef, saveCanvasState, setNodes }).relinkMissingProjectAssets,
    showProjectAssetCandidateDialog = useAssetCandidateDialog({}).showProjectAssetCandidateDialog,
    relinkMissingProjectAssetsFromFolder = useRelinkFromFolder({ localforageModule, nodesRef, projectIdRef, saveCanvasState, setNodes, showProjectAssetCandidateDialog }).relinkMissingProjectAssetsFromFolder;
  (useCanvasLoadEffect({ GlobalTasks, LoadOnceRef, abortControllersRef, canvasStateKeyPrefix, desktopCanvasMirrorPrefix, hydrateProjectAssetContainer, initialEmptyProject, localforageModule, onInitialEmptyProjectReady, projectId, projectIdRef, resolveWanjuanPlayableTaskUrl, setEdges, setNodes, setShouldFitView, shouldFitViewRef }),
    useGlobalTasksSyncEffect({ GlobalTasks, projectIdRef, resolveWanjuanPlayableTaskUrl, setNodes, shouldFitView }),
	    useSafeEffect11({ nodes, setEdges, shouldFitView }),
	    useSafeEffect12({ edges, setNodes, shouldFitView, wanjuanPrevEdgesRef }),
		    useLateEffect1184({ edges, nodes, saveCanvasState, shouldFitView }),
		    useEffect(() => () => {
		      shouldFitViewRef.current && saveCanvasState();
	    }, [projectId, saveCanvasState]),
	    useEffect(() => {
      let bannerId = `wanjuan-project-asset-relink-banner`,
        bannerEl = document.getElementById(bannerId),
        missingCount = globalThis.getMissingProjectMediaEntries(nodes).length,
        neverShowKey = `wanjuan-project-asset-relink-never-${projectIdRef.current || `default`}`;
		      if (!missingCount) {
		        bannerEl && bannerEl.remove();
		        return;
		      }
		      if (localStorage.getItem(neverShowKey) === `1`) {
		        bannerEl && bannerEl.remove();
		        return;
		      }
		      if (globalThis.__wanjuanAssetRelinkBannerDismissedCount === missingCount) {
		        bannerEl && bannerEl.remove();
		        return;
	      }
	      bannerEl ||
	        ((bannerEl = document.createElement(`div`)),
	          (bannerEl.id = bannerId),
	          (bannerEl.role = `button`),
	          (bannerEl.tabIndex = 0),
		          Object.assign(bannerEl.style, {
		            position: `fixed`,
		            right: `18px`,
		            top: `176px`,
		            zIndex: `2147483647`,
		            padding: `12px 40px 12px 16px`,
		            borderRadius: `14px`,
		            border: `1px solid rgba(248,113,113,0.35)`,
		            background: `linear-gradient(135deg, rgba(127,29,29,0.96), rgba(69,10,10,0.96))`,
            color: `#fff7f7`,
            boxShadow: `0 18px 40px rgba(0,0,0,0.35)`,
            fontSize: `13px`,
            fontWeight: `600`,
            cursor: `pointer`,
		            maxWidth: `320px`,
		            textAlign: `left`,
		            lineHeight: `1.45`,
		          }),
		          document.body.appendChild(bannerEl));
		      (bannerEl.querySelector(`[data-relink-label]`) ||
		        (bannerEl.innerHTML = `<span data-relink-label style="display:block;padding-right:28px;"></span><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;"><button data-relink-folder style="appearance:none;border:1px solid rgba(255,255,255,0.32);background:rgba(255,255,255,0.18);color:#fff;border-radius:8px;padding:6px 9px;font-size:12px;font-weight:700;cursor:pointer;">立即链接丢失文件</button><button data-relink-single style="appearance:none;border:1px solid rgba(255,255,255,0.22);background:rgba(0,0,0,0.12);color:#fff;border-radius:8px;padding:6px 9px;font-size:12px;font-weight:700;cursor:pointer;">逐个选择</button><button data-relink-never style="appearance:none;border:1px solid rgba(255,255,255,0.18);background:rgba(0,0,0,0.18);color:#ffe8e8;border-radius:8px;padding:6px 9px;font-size:12px;font-weight:700;cursor:pointer;">关闭提示不再询问</button></div><span data-relink-close title="关闭" aria-label="关闭" style="position:absolute;right:10px;top:10px;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;font-size:20px;line-height:22px;color:#fff;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.28);flex:0 0 auto;">&times;</span>`));
		      ((bannerEl.querySelector(`[data-relink-label]`).textContent = `检测到 ${missingCount} 个本地媒体素材丢失`),
		        (bannerEl.onclick = (event) => {
		          if (event?.target?.closest?.(`[data-relink-close]`)) {
		            globalThis.__wanjuanAssetRelinkBannerDismissedCount = missingCount;
		            bannerEl.remove();
		            return;
		          }
		          if (event?.target?.closest?.(`[data-relink-never]`)) {
		            localStorage.setItem(neverShowKey, `1`);
		            bannerEl.remove();
		            return;
		          }
		          if (event?.target?.closest?.(`[data-relink-folder]`)) {
		            relinkMissingProjectAssetsFromFolder();
	            return;
	          }
	          relinkMissingProjectAssets();
	        }),
	        (bannerEl.onkeydown = (event) => {
	          if (event.key === `Enter` || event.key === ` `) {
	            event.preventDefault();
	            relinkMissingProjectAssetsFromFolder();
	          }
	        }));
	      return () => {
	        bannerEl && ((bannerEl.onclick = null), (bannerEl.onkeydown = null));
	      };
    }, [nodes, relinkMissingProjectAssets, relinkMissingProjectAssetsFromFolder]),
    useEffect(() => {
	      setNodes((nodes2) => {
	        let changed = false;
	        let nextNodes = nodes2.map((node) => {
	          let patch = null;
	          if (node.type === `videoNode`) patch = { videoModel, videoDurations, videoResolutions, videoAspectRatios };
	          else if (node.type === `promptNode`) patch = { drawingModel, imageCompatResolutions };
	          else if (node.type === `textNode`) patch = { textModel };
	          else if (node.type === `audioNode`) patch = { audioModel, audioApiUrl, audioApiKey, projectId: projectIdRef.current, updateGlobalTasks: updateTaskList };
	          if (!patch || Object.entries(patch).every(([key, value]) => Object.is(node.data?.[key], value))) return node;
	          changed = true;
	          return { ...node, data: { ...node.data, ...patch } };
	        });
	        return changed ? nextNodes : nodes2;
	      });
	    }, [videoModel, videoDurations, videoResolutions, videoAspectRatios, drawingModel, imageCompatResolutions, textModel, audioModel, audioApiUrl, audioApiKey, setNodes]));
  let handleConnect = useHandleConnect({ addEdge, getNodes, setEdges }).handleConnect,
    handleMultiConnectToTarget = useMultiConnect({ addEdge, multiConnectIds, setEdges, setMultiConnectIds, showToast }).handleMultiConnectToTarget,
    handleCancel = useCallback(() => {
      (setMenuPosition(null), setResourceSubmenuOpen(false), setResourceSubmenuOpenAlt(false), multiConnectIds && (setMultiConnectIds(null), showToast(`已取消多项连接`)));
    }, [setMenuPosition, multiConnectIds, showToast]),
    handleNoop = useCallback((noopArgA, noopArgB) => {}, []),
    handleCancel2 = useCallback((unusedEvent) => {}, []),
    handleCrop = useCallback((nodeId, imageUrl) => {
      setImageEditState({
        id: nodeId,
        url: imageUrl,
        initialTool: `crop`
      });
    }, []),
    handleSplitOne = useHandleSplitOne({ getEdges, getNodes, handleCrop, openImageEditor, openImagePreview, setEdges, setNodes, showToast }).handleSplitOne,
    handleSplit = useHandleSplit({ getEdges, getNodes, handleCrop, openImageEditor, openImagePreview, setEdges, setNodes, showToast }).handleSplit,
	    createImageNode = useCreateImageNode({ getNodes, handleCrop, openImageEditor, openImagePreview, setEdges, setNodes }).createImageNode,
    generateImage = useImageGeneration({ propImageApiKey, propImageApiUrl, drawingModel, apiConfigs, imageModelApiBindings, imageModelProtocolBindings, planLimits, showToast, getNodes, getEdges, setNodes, addGeneratedAsset, membership, updateTaskList, modelProtocolRegistry, propTextApiUrl, propTextApiKey, textModel, abortControllersRef, audioApiKey, localforageModule, projectIdRef, setDailyGenerationCount, setEdges, timeoutSeconds }).generateImage,
	    handleArkTrustedAssetReview = useArkTrustedAssetReview({ arkTrustedAssetConfig, setArkTrustedAssetConfig, setNodes, showToast, tosConfig }).handleArkTrustedAssetReview,
	    generateVideo = useVideoGeneration({ videoApiKey, videoApiUrl, videoModel, videoDurations, apiConfigs, videoModelApiBindings, videoModelProtocolBindings, modelProtocolRegistry, videoModelRequestProfiles, seedanceUploadMode, tosConfig, customPublicUploadConfig, arkTrustedAssetConfig, handleArkTrustedAssetReview, planLimits, showToast, getNodes, getEdges, setNodes, addGeneratedAsset, membership, abortControllersRef, canvasStateKeyPrefix, localforageModule, nodesRef, pollIntervalMs, projectIdRef, qiniuConfig, setDailyGenerationCount, setEdges, timeoutSeconds, updateTaskList }).generateVideo,
    generateText = useTextGeneration({ propTextApiKey, propTextApiUrl, textModel, apiConfigs, textModelApiBindings, textModelProtocolBindings, modelProtocolRegistry, planLimits, getNodes, getEdges, setNodes, setEdges, showToast, addGeneratedAsset, updateTaskList, projectIdRef, abortControllersRef, customPublicUploadConfig, presetPrompts, seedanceUploadMode, setDailyGenerationCount, tosConfig }).generateText,
    _customGen = useCustomNodeGeneration({ abortControllersRef, addGeneratedAsset, apiConfigs, getEdges, getNodes, modelProtocolRegistry, pollIntervalMs, projectIdRef, propTextApiKey, propTextApiUrl, setEdges, setNodes, showToast, textModel, textModelApiBindings, textModelProtocolBindings, timeoutSeconds, updateTaskList }),
    handleAIAssist = _customGen.handleAIAssist,
    handleGenerateCustom = _customGen.handleGenerateCustom,
    handleTianjiPortraitReview = useTianjiPortraitReview({ setNodes, showToast }).handleTianjiPortraitReview,
	    handleExtractFrames = useCallback(
	      async (nodeId) => {
	          let node = getNodes().find((node2) => node2.id === nodeId);
	          node && node.data.onExtractFrames && (await node.data.onExtractFrames(nodeId));
	        },
	        [getNodes],
	    ),
	    resolveVideoRunModel = use_resolveVideoRunModel({  seedanceModel, tianjiSeedanceModel, videoModel }).resolveVideoRunModel,
	    runNodeChain = useRunNodeChain({ generateImage, generateText, generateVideo, getEdges, getNodes, handleGenerateCustom, resolveVideoRunModel, showToast }).runNodeChain,
    layeredRunDownstream = useLayeredRun({ generateImage, generateText, generateVideo, getEdges, getNodes, handleGenerateCustom, layeredRunMaxConcurrency, resolveVideoRunModel, showToast }).layeredRunDownstream,
	    createNodeAt = use_createNodeAt({ createImageNode, generateImage, generateText, generateVideo, handleAIAssist, handleCrop, handleGenerateCustom, handleArkTrustedAssetReview, handleSplit, handleSplitOne, handleTianjiPortraitReview, nodesRef, openImageEditor, openImagePreview, openVideoEditor, projectIdRef, setEdges, setMenuPosition, setNodes, stopGeneration, addCustomNode, addGeneratedAsset, apiConfigs, arkTrustedAssetConfig, audioApiKey, audioApiUrl, audioModel, audioModelApiBindings, audioModelProtocolBindings, customPublicUploadConfig, drawingModel, imageCompatResolutions, imageModelApiBindings, imageModelProtocolBindings, modelProtocolRegistry, presetPrompts, projectId, qiniuConfig, seedanceDurations, seedanceEnableWebSearch, seedanceGenerateAudio, seedanceModel, seedanceRatios, seedanceResolutions, seedanceUploadMode, seedanceVirtualPortraits, seedanceWatermark, sendToActiveTab, showToast, textModel, textModelApiBindings, textModelProtocolBindings, tianjiSeedanceModel, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangTextModels, tosConfig, ttsMusicModel, updateTaskList, videoAspectRatios, videoDurations, videoModel, videoModelApiBindings, videoModelProtocolBindings, videoModelRequestProfiles, videoResolutions }).createNodeAt,
    persistImportedMediaFile = use_persistImportedMediaFile({ projectIdRef, projectId }).persistImportedMediaFile,
    createImportedMediaNode = use_createImportedMediaNode({ createNodeAt, persistImportedMediaFile, setNodes, addGeneratedAsset }).createImportedMediaNode,
    handleFileChange = use_handleFileChange({ createImportedMediaNode, createNodeAt, menuPosition, screenToFlowPosition, wrapperRef, addGeneratedAsset }).handleFileChange,
    handlePaste = useHandlePaste({ createNodeAt, generateImage, generateText, handleCrop, menuPosition, openImagePreview, projectIdRef, screenToFlowPosition, setEdges, setMenuPosition, setNodes, showToast, wrapperRef }).handlePaste,
    handleDeleteSelected = use_handleDeleteSelected({ menuPosition, nodesRef, setEdges, setMenuPosition, setNodes, stopGeneration }).handleDeleteSelected,
    handleCopySelected = use_handleCopySelected({ edgesRef, nodesRef, projectIdRef, setMenuPosition, showToast, edges, nodes }).handleCopySelected,
      copySelectedNodes = use_copySelectedNodes({ edgesRef, menuPosition, nodesRef, projectIdRef, setMenuPosition, showToast, edges, nodes }).copySelectedNodes,
        copyNodeImage = use_copyNodeImage({ menuPosition, nodes, setMenuPosition, showToast }).copyNodeImage,
          addGridSplitNode = use_addGridSplitNode({ handleSplit, handleSplitOne, menuPosition, nodes, setEdges, setMenuPosition, setNodes, showToast }).addGridSplitNode,
          onConnectEnd = useOnConnectEnd({ screenToFlowPosition, setEdges, setMenuPosition, setNodes, setResourceSubmenuOpen, setResourceSubmenuOpenAlt, wrapperRef }).onConnectEnd,
          onDragOver = useCallback((event) => {
            (event.preventDefault(), (event.dataTransfer.dropEffect = `move`));
          }, []),
          onDrop = useOnDrop({ addGeneratedAsset, createImportedMediaNode, createNodeAt, screenToFlowPosition }).onDrop,
          AbortDeletedNodes = useCallback(
            (nodes2) => {
              if (!shouldFitViewRef.current) return;
              nodes2.forEach((node) => {
                abortControllersRef.current.has(node.id) && stopGeneration(node.id);
              });
            },
            [stopGeneration],
          );
  useNodeSyncEffect({ addCustomNode, addGeneratedAsset, apiConfigs, arkTrustedAssetConfig, audioApiKey, audioApiUrl, audioModel, audioModelApiBindings, audioModelProtocolBindings, createImageNode, customPublicUploadConfig, drawingModel, generateImage, generateText, generateVideo, handleAIAssist, handleCancel2, handleCrop, handleExtractFrames, handleGenerateCustom, handleArkTrustedAssetReview, handleNoop, handleSplit, handleSplitOne, handleTianjiPortraitReview, imageCompatResolutions, imageModelApiBindings, imageModelProtocolBindings, modelProtocolRegistry, openImageEditor, openImagePreview, openVideoEditor, presetPrompts, projectIdRef, qiniuConfig, seedanceDurations, seedanceEnableWebSearch, seedanceGenerateAudio, seedanceModel, seedanceRatios, seedanceResolutions, seedanceUploadMode, seedanceVirtualPortraits, seedanceWatermark, sendToActiveTab, setNodes, shouldFitView, showToast, stopGeneration, textModel, textModelApiBindings, textModelProtocolBindings, tianjiSeedanceModel, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangTextModels, tosConfig, ttsMusicModel, updateTaskList, videoAspectRatios, videoDurations, videoModel, videoModelApiBindings, videoModelProtocolBindings, videoModelRequestProfiles, videoResolutions });

  const automationJobsRef = useRef(new Map());
  const automationResultCacheRef = useRef(new Map());
  // CLI/MCP 自动化桥：只暴露任务控制，不暴露 API Key 或完整配置。
  useEffect(() => {
    const cleanTask = (task, stableResultUrl = "") => ({
      id: task?.id || "", type: task?.type || "", nodeId: task?.nodeId || "", projectId: task?.projectId || "",
      status: task?.status || "", progress: task?.progress ?? 0, modelName: task?.modelName || "", prompt: task?.prompt || "",
      resultUrl: stableResultUrl || task?.resultUrl || task?.videoUrl || task?.imageUrl || wanjuanExtractAutomationMedia(task?.customResultData, task?.type) || "",
      stableResultUrl: stableResultUrl || "", thumbnailUrl: task?.thumbnailUrl || task?.posterUrl || "",
      errorMsg: task?.errorMsg || "", createdAt: task?.createdAt || 0, updatedAt: task?.updatedAt || 0,
    });
    const cleanTasks = (items) => (Array.isArray(items) ? items : []).map((task) => cleanTask(task));
    const materializeAutomationTask = async (task) => {
      if (!task || task.status !== "completed") return cleanTask(task);
      const current = task.resultUrl || task.videoUrl || task.imageUrl || wanjuanExtractAutomationMedia(task.customResultData, task.type);
      const cacheKey = String(task.id || task.nodeId || "");
      const cached = cacheKey ? automationResultCacheRef.current.get(cacheKey) : "";
      if (cached) return cleanTask(task, cached);
      if (!current || /^file:\/\//i.test(current)) return cleanTask(task, current);
      try {
        const persisted = await globalThis.wanjuanDesktop?.persistProjectAsset?.({
          url: current, projectId: task.projectId || "default", nodeId: task.nodeId || task.id || "automation-result",
          field: wanjuanAutomationMediaField(task.type), kind: task.type || "image",
          filename: `${task.type || "result"}-${task.id || Date.now()}`, mime: wanjuanAutomationMediaMime(task.type),
        });
        if (persisted?.ok && persisted.localPath) {
          const stable = wanjuanAutomationFileUrl(persisted.localPath);
          if (cacheKey) automationResultCacheRef.current.set(cacheKey, stable);
          return cleanTask(task, stable);
        }
      } catch (error) { console.warn("automation result persistence skipped", error); }
      // 持久化失败时仍返回远端 URL；blob/data URL 不直接泄漏给 CLI。
      return cleanTask(task, /^(blob:|data:)/i.test(current) ? "" : current);
    };
    const allAutomationTasks = async (materialize = false) => {
      const sourceTasks = Array.isArray(GlobalTasks) ? GlobalTasks : [];
      const tasks = cleanTasks(sourceTasks);
      const knownIds = new Set(tasks.flatMap((task) => [task.id, task.nodeId]).filter(Boolean));
      const now = Date.now();
      for (const [nodeId, job] of automationJobsRef.current.entries()) {
        if (knownIds.has(nodeId) || knownIds.has(job.id)) automationJobsRef.current.delete(nodeId);
        else if (now - Number(job.updatedAt || job.createdAt || now) > 24 * 60 * 60 * 1000) automationJobsRef.current.delete(nodeId);
      }
      const combined = [...sourceTasks, ...automationJobsRef.current.values()];
      return materialize ? Promise.all(combined.map(materializeAutomationTask)) : combined.map((task) => cleanTask(task));
    };
    const findAutomationTask = async (id, materialize = false) => (await allAutomationTasks(materialize)).filter((task) => task.id === String(id || "") || task.nodeId === String(id || "")).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0] || null;
    const setAutomationJob = (nodeId, patch) => {
      const previous = automationJobsRef.current.get(nodeId) || { id: nodeId, nodeId, createdAt: Date.now(), progress: 0 };
      automationJobsRef.current.set(nodeId, { ...previous, ...patch, updatedAt: Date.now() });
    };
    const runAutomationGeneration = (nodeId, type, run) => {
      setAutomationJob(nodeId, { type, status: "submitting", errorMsg: "" });
      void Promise.resolve().then(run).then(() => {
        const node = getNodes().find((item) => item.id === nodeId);
        const createdTaskId = node?.data?.taskId || node?.data?.seedanceTaskId || "";
        if (createdTaskId) setAutomationJob(nodeId, { id: createdTaskId, status: "pending" });
        else setAutomationJob(nodeId, { status: "failed", errorMsg: "任务未创建；请检查应用内模型、接口配置和输入参数" });
      }).catch(() => {
        setAutomationJob(nodeId, { status: "failed", errorMsg: "任务提交失败；请在万卷灵境任务列表查看详情" });
      });
    };
    const waitForCanvasState = () => new Promise((resolve) => setTimeout(resolve, 80));
    const automation = {
      status: async () => ({ ok: true, app: "万卷灵境", version: globalThis.chrome?.runtime?.getManifest?.()?.version || "", ready: true, activeTasks: (await allAutomationTasks()).filter((task) => ["pending", "submitting", "running"].includes(task.status)).length }),
      models: async () => ({ ok: true, image: WanJuanParseModelList(drawingModel || ""), video: WanJuanParseModelList(videoModel || ""), text: WanJuanParseModelList(textModel || "") }),
      tasks: async ({ materialize = false } = {}) => ({ ok: true, tasks: await allAutomationTasks(materialize === true) }),
      task: async ({ id, materialize = true } = {}) => ({ ok: true, task: await findAutomationTask(id, materialize !== false) }),
      cancel: async ({ id } = {}) => {
        const task = await findAutomationTask(id);
        if (!task) return { ok: false, error: "任务不存在" };
        if (task.nodeId) {
          stopGeneration(task.nodeId);
          setAutomationJob(task.nodeId, { id: task.id || task.nodeId, type: task.type, status: "cancelled", errorMsg: "已取消" });
        }
        return { ok: true, taskId: task.id, nodeId: task.nodeId };
      },
      generateImage: async ({ prompt = "", model = "", size = "1024x1024", referenceImage = "" } = {}) => {
        const nodeId = `automation-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setNodes((current) => [...current, { id: nodeId, type: "promptNode", position: { x: 0, y: 0 }, data: { prompt: String(prompt), imageUrl: String(referenceImage || ""), mediaKind: referenceImage ? "image" : undefined } }]);
        await waitForCanvasState();
        runAutomationGeneration(nodeId, "image", () => generateImage(nodeId, String(prompt), String(size || "1024x1024"), String(model || "")));
        return { ok: true, accepted: true, nodeId };
      },
      generateVideo: async ({ prompt = "", model = "", resolution = "1280x720", duration = "", aspectRatio = "", referenceImage = "" } = {}) => {
        const nodeId = `automation-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const sourceId = referenceImage ? `${nodeId}-source` : "";
        setNodes((current) => [...current, ...(sourceId ? [{ id: sourceId, type: "imageNode", position: { x: -360, y: 0 }, data: { imageUrl: String(referenceImage), mediaKind: "image" } }] : []), { id: nodeId, type: "videoNode", position: { x: 0, y: 0 }, data: { prompt: String(prompt), aspectRatio: String(aspectRatio || ""), imageResolution: String(resolution || "") } }]);
        if (sourceId) setEdges((current) => [...current, { id: `automation-edge-${nodeId}`, source: sourceId, target: nodeId, type: "custom" }]);
        await waitForCanvasState();
        runAutomationGeneration(nodeId, "video", () => generateVideo(nodeId, String(prompt), String(resolution || "1280x720"), String(model || ""), duration ? Number(duration) : undefined, undefined, String(aspectRatio || "")));
        return { ok: true, accepted: true, nodeId, sourceNodeId: sourceId || undefined };
      },
      generateTianjiVideo: async ({ prompt = "", model = "", resolution = "720p", duration = "5", aspectRatio = "16:9", mode = "text-to-video", images = [], portraitAssetIds = [], videos = [], audios = [] } = {}) => {
        const nodeId = `automation-tianji-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const sources = [];
        const edges = [];
        const addSources = (items, kind) => (Array.isArray(items) ? items : []).forEach((url, index) => {
          const sourceId = `${nodeId}-${kind}-${index + 1}`;
          const sourceType = kind === "image" ? "imageNode" : kind === "audio" ? "audioNode" : "videoNode";
          const sourceData = kind === "image" ? { imageUrl: String(url), mediaKind: "image" } : kind === "audio" ? { audioUrl: String(url), mediaKind: "audio" } : { videoUrl: String(url), mediaKind: "video" };
          sources.push({ id: sourceId, type: sourceType, position: { x: -420, y: index * 100 }, data: sourceData });
          edges.push({ id: `automation-edge-${sourceId}`, source: sourceId, target: nodeId, type: "custom" });
        });
        addSources(images, "image");
        (Array.isArray(portraitAssetIds) ? portraitAssetIds : []).forEach((assetId, index) => {
          const sourceId = `${nodeId}-portrait-${index + 1}`;
          sources.push({ id: sourceId, type: "imageNode", position: { x: -420, y: (images.length + index) * 100 }, data: wanjuanTianjiPortraitNodeDataFromAutomation(assetId) });
          edges.push({ id: `automation-edge-${sourceId}`, source: sourceId, target: nodeId, type: "custom" });
        });
        addSources(videos, "video"); addSources(audios, "audio");
        setNodes((current) => [...current, ...sources, { id: nodeId, type: "seedanceNode", position: { x: 0, y: 0 }, data: {
          prompt: String(prompt), seedanceNode: true, seedanceMode: "tianji", tianjiSeedanceGenerationMode: String(mode || "text-to-video"),
          tianjiSelectedModel: String(model || ""), selectedResolution: String(resolution || "720p"), selectedSeconds: String(duration || "5"), size: String(aspectRatio || "16:9"),
        } }]);
        if (edges.length) setEdges((current) => [...current, ...edges]);
        await waitForCanvasState();
        runAutomationGeneration(nodeId, "video", () => generateVideo(nodeId, String(prompt), String(resolution || "720p"), String(model || ""), duration ? Number(duration) : undefined, undefined, String(aspectRatio || "16:9")));
        return { ok: true, accepted: true, nodeId, sourceNodeIds: sources.map((item) => item.id), mode: String(mode || "text-to-video") };
      },
      materializeTestResult: async ({ kind = "image", dataUrl = "", directory = "" } = {}) => {
        if (!String(dataUrl).startsWith(`data:${kind}/`) || !directory) throw new Error("无效的隔离媒体持久化测试参数");
        const persisted = await globalThis.wanjuanDesktop?.persistProjectAsset?.({
          url: dataUrl, projectId: "TEST_AUTOMATION_MEDIA", nodeId: "TEST_AUTOMATION_NODE",
          field: wanjuanAutomationMediaField(kind), kind, filename: `TEST_AUTOMATION_RESULT_${Date.now()}`,
          mime: wanjuanAutomationMediaMime(kind), directory: String(directory),
        });
        if (!persisted?.ok || !persisted.localPath) throw new Error(persisted?.error || "隔离媒体持久化失败");
        return { ok: true, resultUrl: wanjuanAutomationFileUrl(persisted.localPath), localPath: persisted.localPath };
      },
    };
    globalThis.__wanjuanAutomation = automation;
    return () => { if (globalThis.__wanjuanAutomation === automation) delete globalThis.__wanjuanAutomation; };
  }, [drawingModel, videoModel, textModel, GlobalTasks, generateImage, generateVideo, getNodes, setNodes, setEdges, stopGeneration]);
		  let onDeleteEdge = useCallback(
	    (event, edge) => {
	      (event.stopPropagation(), setEdges((edges2) => edges2.filter((edge2) => edge2.id !== edge.id)));
	    },
	    [setEdges],
	  ),
	    wanjuanHandleEdgeClick = useHandleEdgeClick({ setEdges, setMenuPosition, setNodes }).wanjuanHandleEdgeClick;
  useLateEffect1886({ menuPosition, setEdges, setNodes });
  let autoLayout = useAutoLayout({ dagreModule, edgesRef, fitView, nodesRef, setNodes, showToast }).autoLayout,
    groupSelectedNodes = useGroupNodes({ nodesRef, setNodes, showToast }).groupSelectedNodes,
    ungroupNode = useUngroupNode({ setNodes, showToast }).ungroupNode;
	  let wanjuanSelectedReferenceSourcesByTarget = useSelectedRefSources({ edges, nodes, useMemo }).wanjuanSelectedReferenceSourcesByTarget,
		    wanjuanCanvasNodes = useCanvasNodes({ WanJuanComputeNodeRenderMode, nodes, useMemo, wanjuanSelectedReferenceSourcesByTarget, wanjuanViewport, wanjuanViewportSize }).wanjuanCanvasNodes;
		  const getShortcutNodePosition = use_getShortcutNodePosition({ lastCanvasMenuPositionRef, menuPosition, screenToFlowPosition, wrapperRef }).getShortcutNodePosition,
		    addKeyboardNode = use_addKeyboardNode({ createNodeAt, getShortcutNodePosition, menuPosition }).addKeyboardNode,
			    clipboardHasPastePayload = use_clipboardHasPastePayload({}).clipboardHasPastePayload;
			  useWorkspaceTemplateEffect({ createNodeAt, getNodes, projectId, projectIdRef, screenToFlowPosition, showToast, wrapperRef });
			  return (
	    useSafeEffect18({ $e, addKeyboardNode, autoLayout, clipboardHasPastePayload, copySelectedNodes, groupSelectedNodes, handlePaste, menuPosition, nodesRef, redo, setEdges, setNodes, stopGeneration }),
    jsxs(`div`, {
      style: {
        width: `100%`,
        height: `100%`
      },
      ref: wrapperRef,
      children: [
        jsx(`input`, {
          type: `file`,
          ref: fileInputRef,
          style: {
            display: `none`
          },
          accept: `image/*,video/*,audio/*,text/plain`,
          onChange: handleFileChange,
        }),
        jsxs(ReactFlow, {
	          nodes: wanjuanCanvasNodes,
          edges: edges,
          onNodesChange: onNodesChange,
          onEdgesChange: onEdgesChange,
	          onConnect: handleConnect,
	          onEdgeClick: wanjuanHandleEdgeClick,
	          onEdgeDoubleClick: onDeleteEdge,
          nodeTypes: WANJUAN_NODE_TYPES,
          edgeTypes: WANJUAN_EDGE_TYPES,
          onNodeClick: handleMultiConnectToTarget,
          onNodeContextMenu: handleNodeContextMenu,
	          onSelectionContextMenu: handleSelectionContextMenu,
	          onSelectionEnd: handleDelayedSelectionMenu,
	          onMove: (event, viewport) => {
	            if (!viewport) return;
	            wanjuanViewportUpdateRef.current = viewport;
	          },
	          onMoveEnd: (event, viewport) => {
	            wanjuanCommitViewport(viewport);
	          },
          onPaneClick: handleCancel,
          onDragOver: onDragOver,
          onDrop: onDrop,
          onConnectEnd: onConnectEnd,
          deleteKeyCode: [`Backspace`, `Delete`],
          fitView: true,
          minZoom: 0.05,
          maxZoom: 4,
          onlyRenderVisibleElements: true,
          elevateNodesOnSelect: false,
          elevateEdgesOnSelect: false,
          nodeDragThreshold: 4,
          className: `bg-[#121212]`,
          proOptions: {
            hideAttribution: true
          },
          children: [
	            jsx(Panel, {
	              position: `top-left`,
	              className: `wanjuan-canvas-pressure-panel mt-2 ml-2`,
	              style: {
	                transform: `scale(0.8)`,
	                transformOrigin: `top left`
	              },
	              children: jsx(WanJuanCanvasPressureMeter, {
	                nodes: wanjuanCanvasNodes,
	                edges: edges,
	              }),
	            }),
	            jsxs(Panel, {
	              position: `top-right`,
	              className: `wanjuan-canvas-top-tools flex items-center mt-2 mr-2`,
	              style: {
	                transform: `scale(0.8)`,
	                transformOrigin: `top right`
	              },
	              children: [
	                jsxs(`div`, {
	                  className: `flex items-center bg-[#2a2a2a] border border-[#333] rounded-lg p-1 shadow-lg`,
	                  children: [
	                    jsx(`button`, {
	                      onClick: autoLayout,
	                      className: `p-1.5 rounded flex items-center justify-center transition-colors text-gray-300 hover:text-white hover:bg-[#444]`,
	                      title: `一键自动排版`,
	                      children: jsx(LayoutGrid, {
	                        size: 16
	                      }),
	                    }),
	                    jsx(`div`, {
	                      className: `w-[1px] h-4 bg-[#444] mx-1`,
	                    }),
	                    jsx(`button`, {
	                      onClick: $e,
	                      disabled: historyIndex <= 0,
	                      className: `p-1.5 rounded flex items-center justify-center transition-colors ${historyIndex <= 0 ? `text-gray-600 cursor-not-allowed` : `text-gray-300 hover:text-white hover:bg-[#444]`}`,
	                      title: `撤销 (Ctrl+Z)`,
	                      children: jsx(Undo2, {
	                        size: 16
	                      }),
	                    }),
	                    jsx(`div`, {
	                      className: `w-[1px] h-4 bg-[#444] mx-1`,
	                    }),
	                    jsx(`button`, {
	                      onClick: redo,
	                      disabled: historyIndex >= history.length - 1,
	                      className: `p-1.5 rounded flex items-center justify-center transition-colors ${historyIndex >= history.length - 1 ? `text-gray-600 cursor-not-allowed` : `text-gray-300 hover:text-white hover:bg-[#444]`}`,
	                      title: `重做 (Ctrl+Y)`,
	                      children: jsx(Redo2, {
	                        size: 16
	                      }),
	                    }),
                  ],
                }),
                jsxs(`div`, {
                  className: `hidden`,
                  children: [
                    jsx(Zap, {
                      size: 14,
                      className: `wanjuan-tier-icon ${membership.type === `VIP` ? `wanjuan-tier-icon-vip` : membership.type === `PRO` ? `wanjuan-tier-icon-pro` : `wanjuan-tier-icon-free`}`,
                    }),
                    jsxs(`span`, {
                      className: `text-xs text-gray-300 font-medium`,
                      children: [`今日生图: `, dailyGenerationCount, `/`, planLimits.dailyGenerations],
                    }),
                  ],
                }),
              ],
            }),
            jsx(Controls, {
              className: `wanjuan-canvas-controls`,
            }),
	          jsx(Panel, {
	            position: `bottom-center`,
	            className: `mb-4`,
	            style: {
	              zIndex: 200,
	            },
	            children: jsx(WanJuanCanvasBottomDock, {
	              createNodeAt,
	              fileInputRef,
	              nodes,
	              resources,
	              screenToFlowPosition,
	              wrapperRef,
	            }),
	          }),
            jsxs(`div`, {
              className: `absolute right-4 bottom-4 z-10 flex flex-col items-end gap-2 pointer-events-none`,
              children: [
                jsx(`div`, {
                  className: `pointer-events-auto transition-all duration-300 origin-bottom-right ${isVisible ? `scale-100 opacity-100` : `scale-90 opacity-0 pointer-events-none absolute bottom-0 right-0`}`,
                  children: jsx(MiniMap, {
                    className: `wanjuan-canvas-minimap !m-0 !relative !bottom-0 !right-0 shadow-2xl rounded overflow-hidden`,
                    nodeColor: `#444`,
                  }),
                }),
                jsx(`button`, {
                  onClick: (event) => {
                    (event.stopPropagation(), setIsVisible(!isVisible));
                  },
                  className: `pointer-events-auto bg-[#222] border border-[#333] text-gray-400 hover:text-white p-2 rounded-full shadow-xl hover:bg-[#2a2a2a] transition-all flex items-center justify-center absolute -bottom-2 -right-2 w-8 h-8 z-50`,
                  title: isVisible ? `隐藏缩略图` : `显示缩略图`,
                  children: jsx(`svg`, {
                    xmlns: `http://www.w3.org/2000/svg`,
                    width: `14`,
                    height: `14`,
                    viewBox: `0 0 24 24`,
                    fill: `none`,
                    stroke: `currentColor`,
                    strokeWidth: `2`,
                    strokeLinecap: `round`,
                    strokeLinejoin: `round`,
                    children: isVisible ?
                      jsx(`path`, {
                        d: `M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7`,
                      }) :
                      jsx(`path`, {
                        d: `M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3`,
                      }),
                  }),
                }),
              ],
            }),
            jsx(Background, {
              variant: BackgroundVariant.Dots,
              gap: 20,
              size: 1,
              color: `#333`,
            }),
            !shouldFitView &&
            jsx(`div`, {
              className: `absolute inset-0 z-[60] flex items-center justify-center bg-[#121212]/80 backdrop-blur-[1px]`,
              children: jsxs(`div`, {
                className: `flex items-center gap-3 rounded-full border border-[#333] bg-[#1c1c1c]/95 px-6 py-3 text-gray-200 shadow-2xl`,
                children: [
                  jsx(`span`, {
                    className: `h-4 w-4 rounded-full border-2 border-gray-600 border-t-blue-400 animate-spin`,
                  }),
                  jsx(`span`, {
                    className: `text-sm font-medium whitespace-nowrap`,
                    children: `项目加载中...`,
                  }),
                ],
              }),
            }),
            shouldFitView &&
            nodes.length === 0 &&
            jsx(WanJuanEmptyCanvasPlaceholder, {
              createNodeAt,
              screenToFlowPosition,
              wrapperRef,
            }),
            menuPosition &&
            jsx(WanJuanCanvasContextMenu, {
  addGridSplitNode,
  contextToolGroupsOpen,
  copyNodeImage,
  copySelectedNodes,
  createNodeAt,
  customNodeTemplates,
  deleteCustomNode,
  fileInputRef,
  groupSelectedNodes,
  handleCopySelected,
  handleDeleteSelected,
  isResourceSubmenuOpen,
  layeredRunDownstream,
  menuPosition,
  nodes,
  resources,
  runNodeChain,
  screenToFlowPosition,
  setContextToolGroupsOpen,
  setMenuPosition,
  setMultiConnectIds,
  setResourceSubmenuOpen,
  setResourceSubmenuOpenAlt,
  showToast,
  ungroupNode,
  wrapperRef,
}),
          ],
        }),
        previewImageUrl &&
        reactDomModule.createPortal(
          jsx(WjImageZoomModal, {
            imageUrl: previewImageUrl,
            onClose: () => setPreviewImageUrl(null)
          }),
          document.body,
        ),
        imageEditState &&
        jsx(WanJuanImageAnnotateModal, {
          imageUrl: imageEditState.url,
          initialTool: imageEditState.initialTool,
          onSave: handleCropComplete,
          onClose: () => setImageEditState(null),
        }),
        videoEditState &&
        jsx(videoEditorModal, {
          videoUrl: videoEditState.url,
          initialName: videoEditState.label,
          onSave: saveEditedVideo,
          onClose: () => setVideoEditState(null),
        }),
      ],
    })
  );
}

function WanJuanAppRoot() {
  let [globalTasks, setGlobalTasks] = useState([]),
  [isOpen, setIsOpen] = useState(false),
  [users, setUsers] = useState([]),
  [selectedUser, setSelectedUser] = useState(null),
  [isLoading, setIsLoading] = useState(false),
  [isPluginEnv, setIsPluginEnv] = useState(true),
  [hasCurrentTab, setHasCurrentTab] = useState(false),
  [transitResources, setTransitResources] = useState([]),
  [resourceTypeFilter, setResourceTypeFilter] = useState(`all`),
  [resourceSourceFilter, setResourceSourceFilter] = useState(`all`),
  [resourceFavoriteOnly, setResourceFavoriteOnly] = useState(false),
  [resourceCleanupBusy, setResourceCleanupBusy] = useState(false),
  [wjResourceFullscreen, setWjResourceFullscreen] = useState(null),
  [transitGridCols, setTransitGridCols] = useState(4),
  [currentPage, setCurrentPage] = useState(1),
  [activeView, setActiveView] = useState(`canvas`),
  [activeSettingsTab, setActiveSettingsTab] = useState(`account`),
  [advancedSettingsUnlocked, setAdvancedSettingsUnlocked] = useState(true),
  [settingsNavUnlockClicks, setSettingsNavUnlockClicks] = useState(0),
  [isAddingAccount, setIsAddingAccount] = useState(false),
  [accountNameInput, setAccountNameInput] = useState(``),
  [editingAccountId, setEditingAccountId] = useState(null),
  [cookieInput, setCookieInput] = useState(``),
  [isAccountBusy, setIsAccountBusy] = useState(false),
  [currentPlatform, setCurrentPlatform] = useState(null),
  [showToast, setShowToast] = useState(false),
  [toastMessage, setToastMessage] = useState(``),
  [textApiUrl, setTextApiUrl] = useState(``),
  [textApiKey, setTextApiKey] = useState(``),
  [textModels, _e] = useState(wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TEXT_MODELS)),
  [imageApiUrl, setImageApiUrl] = useState(``),
  [imageApiKey, setImageApiKey] = useState(``),
  [imageModels, setImageModels] = useState(wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_IMAGE_MODELS)),
  [videoApiUrl, setVideoApiUrl] = useState(``),
  [videoApiKey, setVideoApiKey] = useState(``),
  [videoModels, setVideoModels] = useState(wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_UNIFIED_VIDEO_MODELS)),
  [videoDurations, setVideoDurations] = useState(`5
10
11
15`),
  [audioApiUrl, setAudioApiUrl] = useState(``),
  [audioApiKey, setAudioApiKey] = useState(``),
  [audioModels, setAudioModels] = useState(``),
  [ttsMusicModel, setTtsMusicModel] = useState(wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_MUSIC_MODELS)),
  [modelProtocolRegistry, setModelProtocolRegistry] = useState(() => ({
    "Gemini 文本原生": {
      category: `text`,
      requestType: `gemini-generate-content`
    },
    "OpenAI Chat 原生": {
      category: `text`,
      requestType: `openai-chat`
    },
    "OpenAI Responses 原生": {
      category: `text`,
      requestType: `openai-responses`,
    },
    "Gemini 图片原生": {
      category: `image`,
      requestType: `gemini-generate-content`,
    },
    "OpenAI 图片原生": {
      category: `image`,
      requestType: `openai-images`,
      parameterAdapter: {
        sizeValueMode: `dimension`,
        aspectRatioValueMode: `omit`,
      },
    },
    "智创聚合图片统一": {
      category: `image`,
      requestType: `openai-images`,
      submitPath: `/v1/images/generations`,
    },
    "Ark 图片原生": {
      category: `image`,
      requestType: `ark-image-generation`,
    },
    "OpenAI 图片异步兼容": {
      category: `image`,
      requestType: `gpt-image-2-async`,
    },
    "OpenAI 视频兼容": {
      category: `video`,
      requestType: `openai-video`,
      submitPath: `/v1/videos`,
      pollPath: `/v1/videos/{taskId}`,
      contentPath: `/v1/videos/{taskId}/content`,
      fieldMapping: {
        model: `model`,
        prompt: `prompt`,
        resolution: `size`,
        aspectRatio: ``,
        duration: `seconds`,
        referenceImage: `input_reference`,
        referenceVideo: `input_video`,
      },
      fieldValueTypes: {
        seconds: `string`,
        size: `string`,
      },
      parameterAdapter: {
        resolutionValueMode: `dimension`,
        aspectRatioValueMode: `omit`,
      },
    },
    "表单视频兼容": {
      category: `video`,
      requestType: `multipart-video`
    },
    "智创聚合视频统一": {
      category: `video`,
      requestType: `multipart-video`,
      submitPath: `/v1/videos`,
      pollPath: `/v1/videos/{taskId}`,
      fieldMapping: {
        duration: `seconds`,
        resolution: `size`,
        referenceImage: `input_reference`,
      },
      fieldValueTypes: {
        seconds: `string`,
        size: `string`,
      },
    },
    "智创聚合视频 JSON": {
      category: `video`,
      requestType: `openai-video`,
      submitPath: `/v1/videos`,
      pollPath: `/v1/videos/{taskId}`,
      fieldMapping: {
        duration: `seconds`,
        resolution: `size`,
        referenceImage: `input_references`,
      },
      fieldValueTypes: {
        seconds: `string`,
        size: `string`,
      },
    },
    "MiniMax 视频原生": {
      category: `video`,
      requestType: `json-video`
    },
    "Seedance 视频原生": {
      category: `video`,
      requestType: `seedance-json`,
    },
    "OpenAI 音频转写原生": {
      category: `audio`,
      requestType: `openai-audio-transcription`,
    },
    "智创聚合音频转写": {
      category: `audio`,
      requestType: `openai-audio-transcription`,
      submitPath: `/v1/audio/transcriptions`,
    },
    "OpenAI TTS 原生": {
      category: `audio`,
      requestType: `openai-audio-speech`,
      submitPath: `/v1/audio/speech`,
    },
    "Suno 音乐生成": {
      category: `music`,
      requestType: `suno-music`,
      submitPath: `/suno/submit/music`,
      pollPath: `/suno/fetch/{taskId}`,
    },
    ...WANJUAN_JIXIN_BUILTIN_PROTOCOLS,
  })),
  [protocolNamesText, setProtocolNamesText] = useState(
    `Gemini 文本原生
极鑫文本兼容
OpenAI Chat 原生
OpenAI Responses 原生
Gemini 图片原生
OpenAI 图片原生
智创聚合图片统一
Ark 图片原生
OpenAI 图片异步兼容
OpenAI 视频兼容
表单视频兼容
智创聚合视频统一
智创聚合视频 JSON
极鑫 Veo/Omni 视频兼容
极鑫 Grok 视频兼容
极鑫通义万相文生视频
极鑫通义万相参考图视频
极鑫通义万相图生视频
极鑫通义万相视频编辑
MiniMax 视频原生
Seedance 视频原生
OpenAI 音频转写原生
智创聚合音频转写
极鑫音频转写兼容
OpenAI TTS 原生
极鑫 TTS 兼容
Suno 音乐生成`,
  ),
  [activeProtocolName, setActiveProtocolName] = useState(
    `Gemini 图片原生`,
  ),
  [activeProtocolConfigText, setActiveProtocolConfigText] = useState(
    `{
  "category": "image",
  "requestType": "gemini-generate-content"
}`,
  ),
  [configButlerApiUrl, setConfigButlerApiUrl] = useState(``),
  [configButlerApiKey, setConfigButlerApiKey] = useState(``),
  [configButlerProtocol, setConfigButlerProtocol] = useState(
	    `openai`,
	  ),
  [configButlerModel, setConfigButlerModel] = useState(``),
  [configButlerDocUrl, setConfigButlerDocUrl] = useState(``),
  [configButlerTargetModel, setConfigButlerTargetModel] = useState(``),
  [configButlerTargetCategory, setConfigButlerTargetCategory] = useState(
    `text`,
  ),
  [configButlerTargetApiConfigId, setConfigButlerTargetApiConfigId] = useState(``),
  [configButlerTargetApiUrl, setConfigButlerTargetApiUrl] = useState(
    ``,
  ),
  [configButlerTargetApiKey, setConfigButlerTargetApiKey] = useState(
    ``,
  ),
  [configButlerResultText, setConfigButlerResultText] = useState(``),
  [configButlerLoading, setConfigButlerLoading] = useState(false),
  [configButlerMode, setConfigButlerMode] = useState(`single`),
  [configButlerBatchLoading, setConfigButlerBatchLoading] = useState(false),
  [configButlerBatchItems, setConfigButlerBatchItems] = useState([]),
  [configButlerBatchActiveCategory, setConfigButlerBatchActiveCategory] = useState(`text`),
  [configButlerBatchModalOpen, setConfigButlerBatchModalOpen] = useState(false),
  [configButlerErrorAssistant, setConfigButlerErrorAssistant] = useState(null),
  [configButlerErrorAssistantMinimized, setConfigButlerErrorAssistantMinimized] = useState(false),
  [configButlerManualProtocolOpen, setConfigButlerManualProtocolOpen] = useState(false),
  [configButlerManualProtocolText, setConfigButlerManualProtocolText] = useState(``),
  [configButlerManualProtocolName, setConfigButlerManualProtocolName] = useState(``),
  [configButlerManualProblemPart, setConfigButlerManualProblemPart] = useState(`submit`),
  [configButlerRepairHistory, setConfigButlerRepairHistory] = useState([]),
  [configButlerRepairHistoryOpen, setConfigButlerRepairHistoryOpen] = useState(false),
  [configButlerExpanded, setConfigButlerExpanded] = useState(true),
  [jixinModelScanNotice, setJixinModelScanNotice] = useState(null),
  [jixinModelScanBusy, setJixinModelScanBusy] = useState(false),
  [configButlerAgentExpanded, setConfigButlerAgentExpanded] = useState(
    true,
  ),
  [globalConfigPresetsExpanded, setGlobalConfigPresetsExpanded] = useState(true),
  [storedGlobalConfigs, setStoredGlobalConfigs] = useState([]),
  [activeStoredGlobalConfigId, setActiveStoredGlobalConfigId] = useState(``),
  [protocolFormatsExpanded, setProtocolFormatsExpanded] = useState(false),
  [textProtocolBindingsExpanded, setTextProtocolBindingsExpanded] = useState(false),
  [imageProtocolBindingsExpanded, setImageProtocolBindingsExpanded] = useState(false),
  [videoProtocolBindingsExpanded, setVideoProtocolBindingsExpanded] = useState(false),
  [audioProtocolBindingsExpanded, setAudioProtocolBindingsExpanded] = useState(false),
  [textModelSettingsExpanded, setTextModelSettingsExpanded] = useState(false),
  [imageModelSettingsExpanded, setImageModelSettingsExpanded] = useState(false),
  [videoModelSettingsExpanded, setVideoModelSettingsExpanded] = useState(false),
  [audioModelSettingsExpanded, setAudioModelSettingsExpanded] = useState(false),
  [ttsMusicSettingsExpanded, setTtsMusicSettingsExpanded] = useState(false),
  [seedanceSettingsExpanded, setSeedanceSettingsExpanded] = useState(false),
  [tianjiSeedanceSettingsMode, setTianjiSeedanceSettingsMode] = useState(`official`),
  [tongyiWanxiangSettingsExpanded, setTongyiWanxiangSettingsExpanded] = useState(false),
  [themeMode, setThemeMode] = useState(`graphite`),
  [appLanguage, setAppLanguage] = useState(`zh-CN`),
  [downloadDirectory, setDownloadDirectory] = useState(``),
  [autoDownloadGeneratedResults, setAutoDownloadGeneratedResults] = useState(false),
  [storageOptimizationEnabled, setStorageOptimizationEnabled] = useState(false),
  [storageOptimizationPaused, setStorageOptimizationPaused] = useState(false),
  [storageOptimizationStatus, setStorageOptimizationStatus] = useState(null),
  [storageOptimizationBusy, setStorageOptimizationBusy] = useState(false),
  [storageOptimizationLastResult, setStorageOptimizationLastResult] = useState(``),
  [videoResolutions, setVideoResolutions] = useState(`1280x720
		720x1280
		1080x720
		720x1080
		720x720`),
  [videoAspectRatios, setVideoAspectRatios] = useState(`16:9
		9:16
		1:1
		3:2
		2:3`),
  [imageCompatResolutions, setImageCompatResolutions] = useState(`1024x1024
1280x720
720x1280
2048x2048
2560x1440
1440x2560
3840x2160
2160x3840`),
  [videoModelRequestProfilesText, setVideoModelRequestProfilesText] = useState(`{}`),
  [seedanceModel, setSeedanceModel] = useState(wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_SEEDANCE_MODELS)),
  [tianjiSeedanceModel, setTianjiSeedanceModel] = useState(wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS)),
  [seedanceDurations, setSeedanceDurations] = useState(wanjuanTianjiSeedanceDefaults.durations),
  [seedanceResolutions, setSeedanceResolutions] = useState(wanjuanTianjiSeedanceDefaults.resolutions),
  [seedanceRatios, setSeedanceRatios] = useState(wanjuanTianjiSeedanceDefaults.ratios),
  [seedanceGenerateAudio, setSeedanceGenerateAudio] = useState(true),
  [seedanceWatermark, setSeedanceWatermark] = useState(false),
  [seedanceEnableWebSearch, setSeedanceEnableWebSearch] = useState(false),
  [seedanceVirtualPortraits, setSeedanceVirtualPortraits] = useState([]),
  [seedancePortraitLibraryExpanded, setSeedancePortraitLibraryExpanded] = useState(false),
  [seedancePortraitEditingId, setSeedancePortraitEditingId] = useState(``),
  [seedancePortraitForm, setSeedancePortraitForm] = useState({
    name: ``,
    assetId: ``,
    imageUrl: ``,
    previewUrl: ``,
    projectName: ``,
    notes: ``,
  }),
  [tongyiWanxiangTextModels, setTongyiWanxiangTextModels] = useState(() => wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_TEXT_MODELS)),
  [tongyiWanxiangReferenceImageModels, setTongyiWanxiangReferenceImageModels] = useState(() => wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_REFERENCE_IMAGE_MODELS)),
  [tongyiWanxiangImageModels, setTongyiWanxiangImageModels] = useState(() => wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_IMAGE_MODELS)),
  [tongyiWanxiangEditModels, setTongyiWanxiangEditModels] = useState(() => wanjuanMergeModelText(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_EDIT_MODELS)),
  [tongyiWanxiangDurations, setTongyiWanxiangDurations] = useState(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_DURATIONS),
  [tongyiWanxiangResolutions, setTongyiWanxiangResolutions] = useState(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RESOLUTIONS),
  [tongyiWanxiangRatios, setTongyiWanxiangRatios] = useState(WANJUAN_JIXIN_BUILTIN_TONGYI_WANXIANG_RATIOS),
  [seedanceUploadMode, setSeedanceUploadMode] = useState(WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE),
  [tosConfig, setTosConfig] = useState({
    accessKeyId: ``,
    secretAccessKey: ``,
    region: `cn-beijing`,
    endpoint: `tos-cn-beijing.volces.com`,
    bucket: ``,
    prefix: `wanjuan/seedance`,
    publicBaseUrl: ``,
  }),
  [arkTrustedAssetConfig, setArkTrustedAssetConfig] = useState(() =>
    wanjuanNormalizeArkTrustedAssetConfig(WANJUAN_DEFAULT_ARK_TRUSTED_ASSET_CONFIG),
  ),
  [customPublicUploadConfig, setCustomPublicUploadConfig] = useState(() => ({ ...WANJUAN_DEFAULT_CUSTOM_PUBLIC_UPLOAD_CONFIG })),
  [qiniuConfig, setQiniuConfig] = useState({
    accessKey: ``,
    secretKey: ``,
    bucket: ``,
    endpoint: `s3.cn-south-1.qiniucs.com`,
    domain: ``,
    prefix: `wanjuan/seedance`,
  }),
  [tosUploadConfigExpanded, setTosUploadConfigExpanded] = useState(false),
  [qiniuUploadConfigExpanded, setQiniuUploadConfigExpanded] = useState(false),
  [customUploadConfigExpanded, setCustomUploadConfigExpanded] = useState(false),
  [qiniuJsonImportOpen, setQiniuJsonImportOpen] = useState(false),
  [qiniuJsonImportText, setQiniuJsonImportText] = useState(``),
  [showTosSecretKey, setShowTosSecretKey] = useState(false),
  [showQiniuSecretKey, setShowQiniuSecretKey] = useState(false),
  [extensionToolStatus, setExtensionToolStatus] = useState({}),
  [extensionToolInstalling, setExtensionToolInstalling] = useState({}),
  [performanceProfile, setPerformanceProfile] = useState(() => WanJuanReadPerformanceProfile()),
  [pollingInterval, setPollingInterval] = useState(3e3),
  [maxPollingDuration, setMaxPollingDuration] = useState(600),
  [layeredRunConcurrencyOptions, setLayeredRunConcurrencyOptions] =
  useState(`2
3
5`),
  [layeredRunMaxConcurrency, setLayeredRunMaxConcurrency] =
  useState(2),
  [edges, setEdges] = useState([]),
  [apiConfigs, setApiConfigs] = useState([{
	    id: `jixin-default`,
	    name: `极鑫`,
	    url: WANJUAN_JIXIN_DEFAULT_API_URL,
	    key: ``,
	    protocolFormat: `auto`,
	  }]),
  [textApiConfigId, setTextApiConfigId] = useState(WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID),
  [imageApiConfigId, setImageApiConfigId] = useState(WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID),
  [videoApiConfigId, setVideoApiConfigId] = useState(WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID),
  [audioApiConfigId, setAudioApiConfigId] = useState(WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID),
  [textModelApiBindings, setTextModelApiBindings] = useState(() => wanjuanBuildJixinModelBindings(WANJUAN_JIXIN_BUILTIN_TEXT_MODELS)),
  [textModelProtocolBindings, setTextModelProtocolBindings] = useState(() => ({
    ...WANJUAN_JIXIN_BUILTIN_TEXT_PROTOCOLS
  }), ),
  [imageModelApiBindings, setImageModelApiBindings] = useState(() => wanjuanBuildJixinModelBindings(WANJUAN_JIXIN_BUILTIN_IMAGE_MODELS)),
  [imageModelProtocolBindings, setImageModelProtocolBindings] = useState(() => ({
    ...WANJUAN_JIXIN_BUILTIN_IMAGE_PROTOCOLS
  })),
  [videoModelProtocolBindings, setVideoModelProtocolBindings] = useState(() =>
	    wanjuanBuildJixinVideoProtocolBindings(), ),
  [audioModelProtocolBindings, setAudioModelProtocolBindings] = useState(() =>
	    wanjuanBuildJixinAudioProtocolBindings(), ),
  [audioModelApiBindings, setAudioModelApiBindings] = useState(() => wanjuanBuildJixinAudioModelBindings()),
  [videoModelApiBindings, setVideoModelApiBindings] = useState(() => wanjuanBuildJixinVideoModelBindings()),
  [isReady, setIsReady] = useState(false);
  useSafeEffect19({ apiConfigs, audioApiConfigId, imageApiConfigId, setAudioApiKey, setAudioApiUrl, setImageApiKey, setImageApiUrl, setTextApiKey, setTextApiUrl, setVideoApiKey, setVideoApiUrl, textApiConfigId, videoApiConfigId });
  const applyPerformanceProfile = useApplyPerformanceProfile({ layeredRunConcurrencyOptions, layeredRunMaxConcurrency, setLayeredRunConcurrencyOptions, setLayeredRunMaxConcurrency, setPerformanceProfile }).applyPerformanceProfile;
  useSafeEffect20({ audioModels, setAudioModels, setTtsMusicModel, ttsMusicModel });
  useSafeEffect21({ apiConfigs, configButlerTargetApiConfigId, setConfigButlerTargetApiConfigId, setConfigButlerTargetApiKey, setConfigButlerTargetApiUrl });
  useSafeEffect22({ activeProtocolName, modelProtocolRegistry, setActiveProtocolConfigText, setActiveProtocolName, setProtocolNamesText });
	  useSafeEffect23({ apiConfigs, imageModelApiBindings, imageModelProtocolBindings, setImageModelProtocolBindings });
	  const refreshExtensionToolStatus = use_refreshExtensionToolStatus({ setExtensionToolStatus }).refreshExtensionToolStatus;
	  const installExtensionTool = async (toolName = `deface`) => {
	    try {
	      if (extensionToolInstalling[toolName]) return;
	      let toolLabel = toolName === `qwen-tts` ? `Qwen-TTS` : toolName === `real-esrgan` ? `Real-ESRGAN` : `Deface`;
	      if (typeof window > `u` || typeof window.wanjuanDesktop?.installExtensionTool != `function`) {
	        showToast2(`拓展工具安装能力不可用，请重启应用`);
	        return;
	      }
	      setExtensionToolInstalling((prev) => ({ ...prev, [toolName]: true }));
	      setExtensionToolStatus((prev) => ({
	        ...prev,
	        [toolName]: {
	          ...(prev[toolName] || {}),
	          installing: true,
	          error: ``,
	        },
	      }));
	      let installResult = await window.wanjuanDesktop.installExtensionTool({ tool: toolName });
	      setExtensionToolStatus((prev) => ({ ...prev, [toolName]: installResult }));
	      installResult?.ok && installResult?.installed ? showToast2(`${toolLabel} 安装完成`) : showToast2(installResult?.error || `${toolLabel} 安装失败`);
	    } catch (error) {
	      let errorMessage = error?.message || String(error),
	        toolLabel = toolName === `qwen-tts` ? `Qwen-TTS` : toolName === `real-esrgan` ? `Real-ESRGAN` : `Deface`;
	      setExtensionToolStatus((prev) => ({
	        ...prev,
	        [toolName]: {
	          ok: false,
	          installed: false,
	          error: errorMessage,
	        },
	      }));
	      showToast2(`${toolLabel} 安装失败：${errorMessage}`);
	    } finally {
	      setExtensionToolInstalling((prev) => ({ ...prev, [toolName]: false }));
	    }
	  };
	  const importExtensionToolPack = async () => {
	    try {
	      if (extensionToolInstalling.toolpack) return;
	      if (typeof window > `u` || typeof window.wanjuanDesktop?.importExtensionToolPack != `function`) {
	        showToast2(`离线工具包导入能力不可用，请重启应用`);
	        return;
	      }
	      setExtensionToolInstalling((prev) => ({ ...prev, toolpack: true }));
	      let importResult = await window.wanjuanDesktop.importExtensionToolPack();
	      if (importResult?.canceled) return;
	      if (!importResult?.ok) {
	        showToast2(importResult?.error || `离线工具包导入失败`);
	        return;
	      }
	      [`deface`, `qwen-tts`, `real-esrgan`].forEach((toolName) => refreshExtensionToolStatus(toolName));
	      let toolNames = (importResult.imported || []).map((item) => item.name || item.id).filter(Boolean).join(`、`);
	      showToast2(`离线工具包导入完成${toolNames ? `：${toolNames}` : ``}`);
	    } catch (error) {
	      showToast2(`离线工具包导入失败：${error?.message || error}`);
	    } finally {
	      setExtensionToolInstalling((prev) => ({ ...prev, toolpack: false }));
	    }
	  };
	  
	  useLateEffect2670({ activeSettingsTab, refreshExtensionToolStatus });
	  useEffect(() => {
	    saveApiModelCloudSettings();
	  }, [
	    textApiUrl,
	    textApiKey,
	    imageApiUrl,
	    imageApiKey,
	    videoApiUrl,
	    videoApiKey,
	    audioApiUrl,
	    audioApiKey,
	    textModels,
	    imageModels,
	    imageCompatResolutions,
	    videoModels,
	    videoDurations,
	    videoResolutions,
	    videoAspectRatios,
	    videoModelRequestProfilesText,
	    seedanceModel,
	    tianjiSeedanceModel,
	    seedanceDurations,
	    seedanceResolutions,
	    seedanceRatios,
	    seedanceGenerateAudio,
	    seedanceWatermark,
	    seedanceEnableWebSearch,
	    seedanceVirtualPortraits,
	    arkTrustedAssetConfig,
	    tianjiSeedanceSettingsMode,
	    tongyiWanxiangTextModels,
	    tongyiWanxiangReferenceImageModels,
	    tongyiWanxiangImageModels,
	    tongyiWanxiangEditModels,
	    tongyiWanxiangDurations,
	    tongyiWanxiangResolutions,
	    tongyiWanxiangRatios,
	    seedanceUploadMode,
	    tosConfig,
	    customPublicUploadConfig,
	    qiniuConfig,
	    audioModels,
	    ttsMusicModel,
	    modelProtocolRegistry,
	    configButlerApiUrl,
	    configButlerApiKey,
	    configButlerProtocol,
	    configButlerModel,
	    configButlerDocUrl,
	    configButlerMode,
	    configButlerTargetCategory,
	    configButlerTargetApiConfigId,
	    storedGlobalConfigs,
	    activeStoredGlobalConfigId,
	    apiConfigs,
	    textModelApiBindings,
	    textModelProtocolBindings,
	    imageModelApiBindings,
	    imageModelProtocolBindings,
	    videoModelProtocolBindings,
	    textApiConfigId,
	    imageApiConfigId,
	    videoApiConfigId,
	    audioApiConfigId,
	    videoModelApiBindings,
	    audioModelProtocolBindings,
	    audioModelApiBindings,
	  ]);
	  useEffect(() => {
	    if (
	      !isReady ||
      !settingsHydratedRef.current ||
      typeof chrome > `u` ||
      !chrome.storage ||
      !chrome.storage.local
    )
      return;
    chrome.storage.local.set({
      textModelApiBindings: textModelApiBindings,
      textModelProtocolBindings: textModelProtocolBindings,
      imageModelApiBindings: imageModelApiBindings,
      imageModelProtocolBindings: imageModelProtocolBindings,
      videoModelProtocolBindings: videoModelProtocolBindings,
	      videoModelApiBindings: videoModelApiBindings,
	      audioModelProtocolBindings: audioModelProtocolBindings,
	      audioModelApiBindings: audioModelApiBindings,
	      textApiConfigId: textApiConfigId,
      imageApiConfigId: imageApiConfigId,
      videoApiConfigId: videoApiConfigId,
      audioApiConfigId: audioApiConfigId,
    });
  }, [
    isReady,
    textApiConfigId,
    imageApiConfigId,
    videoApiConfigId,
    audioApiConfigId,
    textModelApiBindings,
    textModelProtocolBindings,
    imageModelApiBindings,
    imageModelProtocolBindings,
	    videoModelProtocolBindings,
	    videoModelApiBindings,
	    audioModelProtocolBindings,
	    audioModelApiBindings,
	  ]);
  useSafeEffect27({ themeMode });
  let [$e, setMembership] = useState({
    type: `FREE`,
    expiry: 0
  }),
  [membershipCode, setMembershipCode] = useState(``),
  [deviceId, setDeviceId] = useState(``),
  [updateInfo, setUpdateInfo] = useState(null),
  [settingsNotificationChecking, setSettingsNotificationChecking] = useState(false),
  [systemNotifications, setSystemNotifications] = useState(() => WanJuanLoadCachedAppNotifications()),
  [systemNotificationPanelOpen, setSystemNotificationPanelOpen] = useState(false),
  [systemNotificationDialog, setSystemNotificationDialog] = useState(null),
  [systemNotificationDismissedIds, setSystemNotificationDismissedIds] = useState(() => WanJuanLoadDismissedAppNotificationIds()),
  [systemNotificationError, setSystemNotificationError] = useState(``),
  systemNotificationToastShownRef = useRef(new Set(WanJuanLoadSessionToastAppNotificationIds())),
  systemNotificationFetchRef = useRef(null),
  currentLimits = membershipLimits[$e.type] || membershipLimits.FREE,
  [dailyUsageCount, setDailyUsageCount] = useState(0),
  [projects, setProjects] = useState([{
	      id: `default`,
	      name: `默认项目`
	    }]),
  [activeProjectId, setActiveProjectId] = useState(`default`),
  [projectGroups, setProjectGroups] = useState([]),
  [projectGroupPanelOpen, setProjectGroupPanelOpen] = useState(false),
  [projectGroupSearch, setProjectGroupSearch] = useState(``),
  [projectGroupDraft, setProjectGroupDraft] = useState(``),
  [editingProjectGroupId, setEditingProjectGroupId] = useState(null),
  [editingProjectGroupName, setEditingProjectGroupName] = useState(``),
  [newProjectIds, setNewProjectIds] = useState([]),
  [projectMenuOpen, setProjectMenuOpen] = useState(false),
  [newProjectName, setNewProjectName] = useState(``),
  [newProjectGroupId, setNewProjectGroupId] = useState(``),
  [renameProjectId, setRenameProjectId] = useState(null),
  [renameProjectName, setRenameProjectName] = useState(``),
  [backupExportSelection, setBackupExportSelection] = useState([
      `settings`,
      `projects`,
      `agents`,
    ]),
  [backupDialogState, setBackupDialogState] = useState(null),
  [backupDialogTab, setBackupDialogTab] = useState(`projects`),
  [agentItems, setAgentItems] = useState(() => wanjuanCloneBuiltinAgentItems()),
  [selectedAgentId, setSelectedAgentId] = useState(WANJUAN_BUILTIN_AGENT_ITEMS[0]?.id || ``),
  [agentConversations, setAgentConversations] = useState(() => wanjuanCloneBuiltinAgentConversations()),
  [agentComposer, setAgentComposer] = useState(``),
  [agentAttachments, setAgentAttachments] = useState([]),
  [agentSearch, setAgentSearch] = useState(``),
  [agentConfigOpen, setAgentConfigOpen] = useState(false),
  [presetPrompts, setPresetPrompts] = useState([{
        title: `三视图`,
        prompt: `三视图，包括前视图、侧视图和后视图，白色背景，高品质，8k分辨率，角色设计`,
        type: `all`,
        enabled: true,
      },
      {
        title: `九宫格`,
        prompt: `九宫格构图，9个不同的画面，高细节，一致的风格，连贯的叙事`,
        type: `all`,
        enabled: true,
      },
    ]),
  [expanded, setExpanded] = useState(false),
  agentAttachmentInputRef = useRef(null),
  agentMessagesScrollRef = useRef(null),
  seedancePortraitFileInputRef = useRef(null),
  configButlerErrorAssistantSeenRef = useRef(new Set()),
  configButlerErrorAssistantInFlightRef = useRef(new Set()),
  wanjuanT = (text) => {
      let runtime = globalThis.wanjuanI18nRuntime;
      if (runtime?.t) {
        let runtimeText = runtime.t(text, appLanguage);
        if (runtimeText !== text) return runtimeText;
      }
      return (wanjuanI18n[appLanguage] && wanjuanI18n[appLanguage][text]) || text;
    },
  showToast2 = (message) => {
      (setToastMessage(message),
        setShowToast(true),
        setTimeout(() => {
          setShowToast(false);
        }, 2e3));
    },
  notificationLevelLabel = (level) =>
      level === `danger` ? `重要` :
      level === `warning` ? `提醒` :
      level === `success` ? `更新` :
      `通知`,
  openSystemNotificationLink = (notification) => {
      let linkUrl = String(notification?.link_url || ``).trim();
      if (!linkUrl) return;
      window.wanjuanDesktop?.openExternal?.(linkUrl) || window.open(linkUrl, `_blank`);
    },
  getUnreadSystemNotifications = () => {
      let dismissedIds = new Set(systemNotificationDismissedIds);
      return systemNotifications.filter((notification) => notification?.id && !dismissedIds.has(notification.id));
    },
  markSystemNotificationRead = (notification) => {
      if (!notification?.id) return;
      let nextIds = Array.from(new Set([...systemNotificationDismissedIds, notification.id]));
      (setSystemNotificationDismissedIds(nextIds), WanJuanSaveDismissedAppNotificationIds(nextIds));
    },
  getVisibleSystemNotifications = () => {
      let unreadNotifications = getUnreadSystemNotifications(),
        pageNotifications = unreadNotifications.filter((notification) => notification.display_type === `page`);
      return pageNotifications.length ? pageNotifications : unreadNotifications;
    },
  dismissSystemNotificationDialog = use_dismissSystemNotificationDialog({ setSystemNotificationDialog, setSystemNotificationDismissedIds, systemNotificationDismissedIds }).dismissSystemNotificationDialog,
  refreshSystemNotifications = use_refreshSystemNotifications({ setSettingsNotificationChecking, setSystemNotificationError, setSystemNotifications, showToast2, systemNotificationFetchRef }).refreshSystemNotifications,
  openSystemNotificationPanel = async () => {
      (setSystemNotificationPanelOpen(true),
        await refreshSystemNotifications({
          source: `panel`,
          silent: false,
        }));
    },
  renderSystemNotificationBanner = () => {
      return null;
    },
  WANJUAN_JIXIN_API_URL = WANJUAN_JIXIN_DEFAULT_API_URL,
  WANJUAN_JIXIN_DOC_URL = WANJUAN_JIXIN_DEFAULT_DOC_URL,
  WANJUAN_CUSTOM_API_LIMIT = 3,
  WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_JIXIN = `jixin-default`,
  WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL = `manual`,
  resolveJixinApiConfigForTianjiSettings = use_resolveJixinApiConfigForTianjiSettings({ WANJUAN_JIXIN_API_URL, apiConfigs }).resolveJixinApiConfigForTianjiSettings,
  normalizeTianjiSettingsSyncSource = (source) =>
    source === WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL ?
    WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL :
    WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_JIXIN,
  buildSyncedTianjiConfigFromJixinApi = use_buildSyncedTianjiConfigFromJixinApi({ WANJUAN_JIXIN_API_URL, WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_JIXIN, WANJUAN_TIANJI_SETTINGS_SYNC_SOURCE_MANUAL, normalizeTianjiSettingsSyncSource }).buildSyncedTianjiConfigFromJixinApi,
  syncTianjiConfigFromJixinApi = async (configs = apiConfigs, options = {}) => {
      if (typeof chrome > `u` || !chrome.storage?.local) return null;
      let stored = await readChromeStorage([
          `tianjiSeedanceConfig`,
          `advancedSettingsUnlocked`,
          `apiConfigs`,
          `apiKey`,
          `textApiKey`,
          `imageApiKey`,
          `videoApiKey`,
          `audioApiKey`,
        ]),
        jixinConfig = resolveJixinApiConfigForTianjiSettings(
          (Array.isArray(configs) ? configs : []).find(isJixinDefaultApiConfig) || null,
          stored,
        );
      if (!jixinConfig) return null;
      let currentConfig = stored.tianjiSeedanceConfig && typeof stored.tianjiSeedanceConfig == `object` ?
        stored.tianjiSeedanceConfig :
        {},
        nextConfig = buildSyncedTianjiConfigFromJixinApi(currentConfig, jixinConfig, {
          ...options,
	          force: options.force === true,
        });
      JSON.stringify(currentConfig) !== JSON.stringify(nextConfig) &&
        (await wanjuanTianjiStorageSet({
          tianjiSeedanceConfig: nextConfig,
        }));
      return nextConfig;
    },
  getCustomApiConfigCount = (configs = apiConfigs) =>
    (Array.isArray(configs) ? configs : []).filter((config) => !isJixinDefaultApiConfig(config)).length,
  unlockAdvancedSettings = use_unlockAdvancedSettings({ setAdvancedSettingsUnlocked, setSettingsNavUnlockClicks, showToast2, advancedSettingsUnlocked }).unlockAdvancedSettings,
	  handleSettingsNavClick = () => {
		      if (activeView !== `settings`) setActiveSettingsTab(`account`);
		      setActiveView(`settings`);
		      setSettingsNavUnlockClicks(0);
		    },
	  openAccountSettingsEffect = useEffect(() => {
	    const handler = () => {
	      setActiveSettingsTab(`account`);
	      setActiveView(`settings`);
	    };
	    window.addEventListener(`wanjuan:open-account-settings`, handler);
	    return () => window.removeEventListener(`wanjuan:open-account-settings`, handler);
	  }, []),
  settingsHydratedRef = useRef(false),
  projectHydratedRef = useRef(false),
  nonModelSettingsSaveTimerRef = useRef(null),
  apiModelCloudSettingsSaveTimerRef = useRef(null),
  saveNonModelSettings = use_saveNonModelSettings({ agentConversations, agentItems, appLanguage, autoDownloadGeneratedResults, backupExportSelection, downloadDirectory, layeredRunConcurrencyOptions, layeredRunMaxConcurrency, maxPollingDuration, nonModelSettingsSaveTimerRef, performanceProfile, pollingInterval, presetPrompts, selectedAgentId, settingsHydratedRef, storageOptimizationEnabled, storageOptimizationPaused, themeMode }).saveNonModelSettings,
  applyLitterboxUploadPreset = use_applyLitterboxUploadPreset({ setCustomPublicUploadConfig, setCustomUploadConfigExpanded, setSeedanceUploadMode, showToast2, customPublicUploadConfig, seedanceUploadMode }).applyLitterboxUploadPreset,
  buildJixinDefaultResetPatch = use_buildJixinDefaultResetPatch({ WANJUAN_JIXIN_DOC_URL, activeStoredGlobalConfigId, apiConfigs, audioApiKey, configButlerApiKey, configButlerApiUrl, configButlerDocUrl, configButlerMode, configButlerModel, configButlerProtocol, configButlerRepairHistory, configButlerTargetApiConfigId, configButlerTargetCategory, imageApiKey, storedGlobalConfigs, textApiKey, tianjiSeedanceSettingsMode, videoApiKey }).buildJixinDefaultResetPatch,
  applyJixinDefaultResetPatch = use_applyJixinDefaultResetPatch({ WANJUAN_JIXIN_DOC_URL, _e, setActiveProtocolConfigText, setActiveProtocolName, setActiveStoredGlobalConfigId, setApiConfigs, setArkTrustedAssetConfig, setAudioApiConfigId, setAudioApiKey, setAudioApiUrl, setAudioModelApiBindings, setAudioModelProtocolBindings, setAudioModels, setConfigButlerApiKey, setConfigButlerApiUrl, setConfigButlerBatchItems, setConfigButlerDocUrl, setConfigButlerMode, setConfigButlerModel, setConfigButlerProtocol, setConfigButlerRepairHistory, setConfigButlerResultText, setConfigButlerTargetApiConfigId, setConfigButlerTargetCategory, setImageApiConfigId, setImageApiKey, setImageApiUrl, setImageCompatResolutions, setImageModelApiBindings, setImageModelProtocolBindings, setImageModels, setJixinModelScanNotice, setModelProtocolRegistry, setProtocolNamesText, setSeedanceDurations, setSeedanceEnableWebSearch, setSeedanceGenerateAudio, setSeedanceModel, setSeedanceRatios, setSeedanceResolutions, setSeedanceWatermark, setStoredGlobalConfigs, setTextApiConfigId, setTextApiKey, setTextApiUrl, setTextModelApiBindings, setTextModelProtocolBindings, setTianjiSeedanceModel, setTianjiSeedanceSettingsMode, setTongyiWanxiangDurations, setTongyiWanxiangEditModels, setTongyiWanxiangImageModels, setTongyiWanxiangRatios, setTongyiWanxiangReferenceImageModels, setTongyiWanxiangResolutions, setTongyiWanxiangTextModels, setTtsMusicModel, setVideoApiConfigId, setVideoApiKey, setVideoApiUrl, setVideoAspectRatios, setVideoDurations, setVideoModelApiBindings, setVideoModelProtocolBindings, setVideoModelRequestProfilesText, setVideoModels, setVideoResolutions, activeStoredGlobalConfigId, apiConfigs, audioApiConfigId, audioApiUrl, audioModelApiBindings, audioModelProtocolBindings, imageApiConfigId, imageApiUrl, imageCompatResolutions, imageModelApiBindings, imageModelProtocolBindings, modelProtocolRegistry, seedanceDurations, seedanceModel, seedanceRatios, seedanceResolutions, storedGlobalConfigs, textApiConfigId, textApiUrl, textModelApiBindings, textModelProtocolBindings, tianjiSeedanceModel, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangTextModels, ttsMusicModel, videoApiConfigId, videoApiUrl, videoAspectRatios, videoDurations, videoModelApiBindings, videoModelProtocolBindings, videoResolutions }).applyJixinDefaultResetPatch,
  resetJixinDefaultConfiguration = use_resetJixinDefaultConfiguration({ apiModelCloudSettingsSaveTimerRef, applyJixinDefaultResetPatch, buildJixinDefaultResetPatch, showToast2 }).resetJixinDefaultConfiguration,
  saveApiModelCloudSettings = use_saveApiModelCloudSettings({ activeStoredGlobalConfigId, arkTrustedAssetConfig, apiConfigs, apiModelCloudSettingsSaveTimerRef, audioApiConfigId, audioApiKey, audioApiUrl, audioModelApiBindings, audioModelProtocolBindings, audioModels, configButlerApiKey, configButlerApiUrl, configButlerDocUrl, configButlerMode, configButlerModel, configButlerProtocol, configButlerTargetApiConfigId, configButlerTargetCategory, customPublicUploadConfig, imageApiConfigId, imageApiKey, imageApiUrl, imageCompatResolutions, imageModelApiBindings, imageModelProtocolBindings, imageModels, modelProtocolRegistry, qiniuConfig, seedanceDurations, seedanceEnableWebSearch, seedanceGenerateAudio, seedanceModel, seedanceRatios, seedanceResolutions, seedanceUploadMode, seedanceVirtualPortraits, seedanceWatermark, settingsHydratedRef, storedGlobalConfigs, syncTianjiConfigFromJixinApi, textApiConfigId, textApiKey, textApiUrl, textModelApiBindings, textModelProtocolBindings, textModels, tianjiSeedanceModel, tianjiSeedanceSettingsMode, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangTextModels, tosConfig, ttsMusicModel, videoApiConfigId, videoApiKey, videoApiUrl, videoAspectRatios, videoDurations, videoModelApiBindings, videoModelProtocolBindings, videoModelRequestProfilesText, videoModels, videoResolutions }).saveApiModelCloudSettings,
  persistTransitResource = use_persistTransitResource({}).persistTransitResource;
  useTransitAudioEffect({ activeProjectId, activeView, isPluginEnv, localforageModule, persistTransitResource, setTransitResources, transitResources });
  let persistSeedanceVirtualPortraits = use_persistSeedanceVirtualPortraits({ setSeedanceVirtualPortraits, seedanceVirtualPortraits }).persistSeedanceVirtualPortraits,
    resetSeedancePortraitForm = () => {
      (setSeedancePortraitEditingId(``),
        setSeedancePortraitForm({
          name: ``,
          assetId: ``,
          imageUrl: ``,
          previewUrl: ``,
          projectName: ``,
          notes: ``,
        }));
    },
    saveSeedancePortraitForm = use_saveSeedancePortraitForm({ persistSeedanceVirtualPortraits, resetSeedancePortraitForm, seedancePortraitEditingId, seedancePortraitForm, seedanceVirtualPortraits, showToast2 }).saveSeedancePortraitForm,
    editSeedancePortrait = use_editSeedancePortrait({ setSeedancePortraitEditingId, setSeedancePortraitForm, setSeedancePortraitLibraryExpanded }).editSeedancePortrait,
    removeSeedancePortrait = (portraitId) => {
      persistSeedanceVirtualPortraits(seedanceVirtualPortraits.filter((portrait) => portrait.id !== portraitId));
      seedancePortraitEditingId === portraitId && resetSeedancePortraitForm();
      showToast2(`虚拟人像已删除`);
    },
    handleSeedancePortraitFile = use_handleSeedancePortraitFile({ setSeedancePortraitForm }).handleSeedancePortraitFile;
  let allAdvancedModelSettingsExpanded =
    configButlerExpanded &&
    textModelSettingsExpanded &&
    imageModelSettingsExpanded &&
    videoModelSettingsExpanded &&
    audioModelSettingsExpanded &&
    ttsMusicSettingsExpanded &&
    seedanceSettingsExpanded &&
    tongyiWanxiangSettingsExpanded,
  setAllAdvancedModelSettings = use_setAllAdvancedModelSettings({ setAudioModelSettingsExpanded, setConfigButlerExpanded, setImageModelSettingsExpanded, setSeedanceSettingsExpanded, setTextModelSettingsExpanded, setTongyiWanxiangSettingsExpanded, setTtsMusicSettingsExpanded, setVideoModelSettingsExpanded }).setAllAdvancedModelSettings,
  applyTianjiSeedanceSettingsMode = use_applyTianjiSeedanceSettingsMode({ setTianjiSeedanceSettingsMode, tianjiSeedanceSettingsMode }).applyTianjiSeedanceSettingsMode,
  getDefaultButlerModel = () =>
    configButlerModel.trim() ||
    WANJUAN_CONFIG_BUTLER_DEFAULT_MODEL,
  getSelectedButlerTargetApiConfig = () =>
    apiConfigs.find((config) => config.id === configButlerTargetApiConfigId) ||
    apiConfigs.find((config) => config.id === `vectorengine`) ||
    apiConfigs[0] ||
    null,
  repairXSeeVeoReferenceVideoBindings = use_repairXSeeVeoReferenceVideoBindings({  modelProtocolRegistry, videoApiUrl, videoModelProtocolBindings }).repairXSeeVeoReferenceVideoBindings,
  normalizeStoredGlobalConfigBackup = use_normalizeStoredGlobalConfigBackup({ repairXSeeVeoReferenceVideoBindings, apiConfigs, videoApiUrl }).normalizeStoredGlobalConfigBackup,
  normalizeStoredGlobalConfigs = use_normalizeStoredGlobalConfigs({ normalizeStoredGlobalConfigBackup, configButlerDocUrl }).normalizeStoredGlobalConfigs,
  captureCurrentGlobalConfig = use_captureCurrentGlobalConfig({ apiConfigs, arkTrustedAssetConfig, audioApiConfigId, audioApiKey, audioApiUrl, audioModelApiBindings, audioModelProtocolBindings, audioModels, configButlerDocUrl, configButlerMode, configButlerTargetApiConfigId, configButlerTargetCategory, imageApiConfigId, imageApiKey, imageApiUrl, imageCompatResolutions, imageModelApiBindings, imageModelProtocolBindings, imageModels, modelProtocolRegistry, seedanceDurations, seedanceEnableWebSearch, seedanceGenerateAudio, seedanceModel, seedanceRatios, seedanceResolutions, seedanceVirtualPortraits, seedanceWatermark, textApiConfigId, textApiKey, textApiUrl, textModelApiBindings, textModelProtocolBindings, textModels, tianjiSeedanceModel, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangTextModels, ttsMusicModel, videoApiConfigId, videoApiKey, videoApiUrl, videoAspectRatios, videoDurations, videoModelApiBindings, videoModelProtocolBindings, videoModelRequestProfilesText, videoModels, videoResolutions }).captureCurrentGlobalConfig,
  persistStoredGlobalConfigs = use_persistStoredGlobalConfigs({ activeStoredGlobalConfigId, setActiveStoredGlobalConfigId, setStoredGlobalConfigs, storedGlobalConfigs }).persistStoredGlobalConfigs,
  mergeStoredGlobalApiConfigs = use_mergeStoredGlobalApiConfigs({ apiConfigs }).mergeStoredGlobalApiConfigs,
  applyStoredGlobalConfig = use_applyStoredGlobalConfig({ _e, apiModelCloudSettingsSaveTimerRef, configButlerApiKey, configButlerApiUrl, configButlerModel, configButlerProtocol, mergeStoredGlobalApiConfigs, normalizeStoredGlobalConfigBackup, setActiveStoredGlobalConfigId, setApiConfigs, setArkTrustedAssetConfig, setAudioApiConfigId, setAudioApiKey, setAudioApiUrl, setAudioModelApiBindings, setAudioModelProtocolBindings, setAudioModels, setConfigButlerApiKey, setConfigButlerApiUrl, setConfigButlerDocUrl, setConfigButlerModel, setConfigButlerMode, setConfigButlerTargetApiConfigId, setConfigButlerTargetApiKey, setConfigButlerTargetApiUrl, setConfigButlerTargetCategory, setImageApiConfigId, setImageApiKey, setImageApiUrl, setImageCompatResolutions, setImageModelApiBindings, setImageModelProtocolBindings, setImageModels, setModelProtocolRegistry, setSeedanceDurations, setSeedanceEnableWebSearch, setSeedanceGenerateAudio, setSeedanceModel, setSeedanceRatios, setSeedanceResolutions, setSeedanceVirtualPortraits, setSeedanceWatermark, setTextApiConfigId, setTextApiKey, setTextApiUrl, setTextModelApiBindings, setTextModelProtocolBindings, setTianjiSeedanceModel, setTongyiWanxiangDurations, setTongyiWanxiangEditModels, setTongyiWanxiangImageModels, setTongyiWanxiangRatios, setTongyiWanxiangReferenceImageModels, setTongyiWanxiangResolutions, setTongyiWanxiangTextModels, setTtsMusicModel, setVideoApiConfigId, setVideoApiKey, setVideoApiUrl, setVideoAspectRatios, setVideoDurations, setVideoModelApiBindings, setVideoModelProtocolBindings, setVideoModelRequestProfilesText, setVideoModels, setVideoResolutions, showToast2, storedGlobalConfigs, activeStoredGlobalConfigId, apiConfigs, audioApiConfigId, audioApiKey, audioApiUrl, audioModelApiBindings, audioModelProtocolBindings, configButlerDocUrl, configButlerMode, configButlerTargetApiConfigId, configButlerTargetCategory, imageApiConfigId, imageApiKey, imageApiUrl, imageCompatResolutions, imageModelApiBindings, imageModelProtocolBindings, modelProtocolRegistry, seedanceDurations, seedanceEnableWebSearch, seedanceGenerateAudio, seedanceModel, seedanceRatios, seedanceResolutions, seedanceVirtualPortraits, seedanceWatermark, textApiConfigId, textApiKey, textApiUrl, textModelApiBindings, textModelProtocolBindings, tianjiSeedanceModel, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangTextModels, ttsMusicModel, videoApiConfigId, videoApiKey, videoApiUrl, videoAspectRatios, videoDurations, videoModelApiBindings, videoModelProtocolBindings, videoResolutions }).applyStoredGlobalConfig,
  saveCurrentToStoredGlobalConfig = use_saveCurrentToStoredGlobalConfig({ captureCurrentGlobalConfig, persistStoredGlobalConfigs, showToast2, storedGlobalConfigs }).saveCurrentToStoredGlobalConfig,
  saveStoredGlobalConfigApiDocUrl = use_saveStoredGlobalConfigApiDocUrl({ activeStoredGlobalConfigId, persistStoredGlobalConfigs, setConfigButlerDocUrl, showToast2, storedGlobalConfigs, configButlerDocUrl }).saveStoredGlobalConfigApiDocUrl,
  saveCurrentAsStoredGlobalConfig = use_saveCurrentAsStoredGlobalConfig({ captureCurrentGlobalConfig, persistStoredGlobalConfigs, showToast2, storedGlobalConfigs }).saveCurrentAsStoredGlobalConfig,
  findExistingProtocolName = (protocolConfig) => {
      let serialized = JSON.stringify(protocolConfig || {});
      return (
        Object.keys(modelProtocolRegistry || {}).find(
          (protocolKey) => JSON.stringify(modelProtocolRegistry[protocolKey] || {}) === serialized,
        ) || ``
      );
    },
  ensureUniqueProtocolName = use_ensureUniqueProtocolName({ modelProtocolRegistry }).ensureUniqueProtocolName,
  callConfigButlerModel = useCallConfigButlerModel({ configButlerApiKey, configButlerApiUrl, configButlerProtocol, getDefaultButlerModel }).callConfigButlerModel,
  readChromeStorage = use_readChromeStorage({}).readChromeStorage,
  writeChromeStorage = (items) => {
	          try {
	            typeof chrome < `u` && chrome.storage?.local?.set?.(items);
	          } catch {}
	        },
  getJixinApiConfig = () =>
	        (Array.isArray(apiConfigs) ? apiConfigs : []).find(isJixinDefaultApiConfig) || null,
  scanJixinGatewayModels = use_scanJixinGatewayModels({ WANJUAN_JIXIN_API_URL, WANJUAN_JIXIN_DOC_URL, getJixinApiConfig, readChromeStorage, setJixinModelScanBusy, setJixinModelScanNotice, showToast2, writeChromeStorage }).scanJixinGatewayModels,
  runJixinGatewaySync = async () => {
	          let jixinConfig = getJixinApiConfig();
	          if (!jixinConfig) {
	            showToast2(`未找到极鑫统一 API 配置`);
	            return;
	          }
	          if (!String(jixinConfig.key || ``).trim()) {
	            showToast2(`请先在极鑫统一 API 配置中填写令牌`);
	            return;
	          }
	          if (!String(configButlerApiKey || ``).trim()) {
	            showToast2(`请先配置“配置管家”的基础智能体 API Key`);
	            return;
	          }
	          setConfigButlerTargetApiConfigId(jixinConfig.id);
	          setConfigButlerDocUrl(WANJUAN_JIXIN_DOC_URL);
	          setConfigButlerMode(`batch`);
	          setConfigButlerExpanded(true);
	          await runConfigButlerBatch({
	            apiConfig: jixinConfig,
	            docUrl: WANJUAN_JIXIN_DOC_URL,
	            models: Array.isArray(jixinModelScanNotice?.models) && jixinModelScanNotice.models.length ?
	              jixinModelScanNotice.models :
	              null,
	          });
	        },
  runJixinGatewayFullModelSync = async () => {
	          let jixinConfig = getJixinApiConfig();
	          if (!jixinConfig) {
	            showToast2(`未找到极鑫统一 API 配置`);
	            return;
	          }
	          let jixinApiUrl = String(jixinConfig.url || WANJUAN_JIXIN_API_URL).trim() || WANJUAN_JIXIN_API_URL,
	            jixinApiKey = String(jixinConfig.key || ``).trim();
	          if (!jixinApiKey) {
	            showToast2(`请先在极鑫统一 API 配置中填写令牌`);
	            return;
	          }
	          let butlerConfig = {
	            apiUrl: jixinApiUrl,
	            apiKey: jixinApiKey,
	            protocol: `openai`,
	            model: `gpt-5.5`,
	          };
	          (setConfigButlerApiUrl(butlerConfig.apiUrl),
	            setConfigButlerApiKey(butlerConfig.apiKey),
	            setConfigButlerProtocol(butlerConfig.protocol),
	            setConfigButlerModel(butlerConfig.model),
	            setConfigButlerDocUrl(WANJUAN_JIXIN_DOC_URL),
	            setConfigButlerTargetApiConfigId(jixinConfig.id),
	            setConfigButlerMode(`batch`),
	            setConfigButlerExpanded(true),
	            setConfigButlerAgentExpanded(true));
	          writeChromeStorage({
	            configButlerApiUrl: butlerConfig.apiUrl,
	            configButlerApiKey: butlerConfig.apiKey,
	            configButlerProtocol: butlerConfig.protocol,
	            configButlerModel: butlerConfig.model,
	            configButlerDocUrl: WANJUAN_JIXIN_DOC_URL,
	            configButlerMode: `batch`,
	            configButlerTargetApiConfigId: jixinConfig.id,
	          });
	          showToast2(`正在同步极鑫中转站模型...`);
	          let scanResult = await scanJixinGatewayModels({
	            force: true,
	            apiConfig: jixinConfig,
	          });
	          if (!scanResult?.filteredModels?.length) {
	            showToast2(`极鑫模型扫描未返回可同步模型`);
	            return;
	          }
	          let batchResult = await runConfigButlerBatch({
	            apiConfig: jixinConfig,
	            docUrl: WANJUAN_JIXIN_DOC_URL,
	            models: scanResult.filteredModels,
	            butlerConfig: butlerConfig,
	            autoApply: true,
	            silentToast: true,
	          });
	          batchResult?.applyResult?.importedCount ?
	            showToast2(`极鑫中转站模型已同步：${batchResult.applyResult.importedCount} 个模型`) :
	            showToast2(`极鑫中转站模型同步完成，请检查批量识别结果`);
	        },
  applyConfigButlerResult = useApplyConfigButlerResult({ _e, activeStoredGlobalConfigId, apiConfigs, audioModelApiBindings, audioModelProtocolBindings, audioModels, configButlerTargetApiConfigId, configButlerTargetApiKey, configButlerTargetApiUrl, configButlerTargetCategory, configButlerTargetModel, getSelectedButlerTargetApiConfig, imageModelApiBindings, imageModelProtocolBindings, imageModels, modelProtocolRegistry, setActiveProtocolConfigText, setActiveProtocolName, setActiveStoredGlobalConfigId, setApiConfigs, setAudioApiConfigId, setAudioModelApiBindings, setAudioModelProtocolBindings, setAudioModels, setConfigButlerExpanded, setImageModelApiBindings, setImageModelProtocolBindings, setImageModels, setModelProtocolRegistry, setProtocolFormatsExpanded, setProtocolNamesText, setStoredGlobalConfigs, setTextModelApiBindings, setTextModelProtocolBindings, setTtsMusicModel, setVideoModelApiBindings, setVideoModelProtocolBindings, setVideoModels, showToast2, storedGlobalConfigs, textModelApiBindings, textModelProtocolBindings, textModels, ttsMusicModel, videoModelApiBindings, videoModelProtocolBindings, videoModels }).applyConfigButlerResult,
  applyConfigButlerBatchResults = useApplyConfigButlerBatchResults({ _e, apiModelCloudSettingsSaveTimerRef, captureCurrentGlobalConfig, configButlerBatchItems, configButlerDocUrl, configButlerTargetApiKey, configButlerTargetApiUrl, getSelectedButlerTargetApiConfig, mergeStoredGlobalApiConfigs, normalizeStoredGlobalConfigBackup, setActiveStoredGlobalConfigId, setApiConfigs, setAudioApiConfigId, setAudioApiKey, setAudioApiUrl, setAudioModelApiBindings, setAudioModelProtocolBindings, setAudioModels, setConfigButlerBatchModalOpen, setConfigButlerExpanded, setImageApiConfigId, setImageApiKey, setImageApiUrl, setImageModelApiBindings, setImageModelProtocolBindings, setImageModels, setModelProtocolRegistry, setProtocolNamesText, setStoredGlobalConfigs, setTextApiConfigId, setTextApiKey, setTextApiUrl, setTextModelApiBindings, setTextModelProtocolBindings, setTtsMusicModel, setVideoApiConfigId, setVideoApiKey, setVideoApiUrl, setVideoModelApiBindings, setVideoModelProtocolBindings, setVideoModels, showToast2, storedGlobalConfigs }).applyConfigButlerBatchResults,
  runConfigButlerBatch = useRunConfigButlerBatch({ applyConfigButlerBatchResults, callConfigButlerModel, configButlerDocUrl, getSelectedButlerTargetApiConfig, setConfigButlerBatchActiveCategory, setConfigButlerBatchItems, setConfigButlerBatchLoading, setConfigButlerBatchModalOpen, setConfigButlerResultText, showToast2 }).runConfigButlerBatch,
  runConfigButler = useRunConfigButler({ callConfigButlerModel, configButlerDocUrl, configButlerTargetCategory, configButlerTargetModel, getSelectedButlerTargetApiConfig, setConfigButlerLoading, setConfigButlerResultText, showToast2 }).runConfigButler;
	  useLateEffect4703({});
  useLateEffect4712({ apiConfigs, isReady, settingsHydratedRef, syncTianjiConfigFromJixinApi });
  useSafeEffect30({ isReady });
  useLateEffect4717({ WANJUAN_JIXIN_DOC_URL, configButlerDocUrl, isReady, setConfigButlerDocUrl, settingsHydratedRef });
  useEffect(() => {
    refreshSystemNotifications({
      source: `startup`,
      silent: true,
    });
  }, []);
  useLateEffect4727({ activeView, refreshSystemNotifications });
  useEffect(() => {
    systemNotificationDialog && setSystemNotificationDialog(null);
  }, [systemNotificationDialog]);
  useLateEffect4737({ activeView, setDailyUsageCount });
  (useLateEffect4743({ activeProjectId, isReady }),
    useSafeEffect37({ activeProjectId, isReady, projectHydratedRef, settingsHydratedRef, themeMode }),
    usePluginEnvEffect({ _e, localforageModule, normalizeStoredGlobalConfigs, projectHydratedRef, repairXSeeVeoReferenceVideoBindings, setActiveProjectId, setActiveStoredGlobalConfigId, setActiveView, setAdvancedSettingsUnlocked, setAgentConversations, setAgentItems, setApiConfigs, setArkTrustedAssetConfig, setAppLanguage, setAudioApiConfigId, setAudioApiKey, setAudioApiUrl, setAudioModelApiBindings, setAudioModelProtocolBindings, setAudioModels, setAutoDownloadGeneratedResults, setBackupExportSelection, setConfigButlerApiKey, setConfigButlerApiUrl, setConfigButlerDocUrl, setConfigButlerMode, setConfigButlerModel, setConfigButlerProtocol, setConfigButlerRepairHistory, setConfigButlerTargetApiConfigId, setConfigButlerTargetCategory, setCurrentPlatform, setCustomPublicUploadConfig, setDailyUsageCount, setDeviceId, setDownloadDirectory, setEdges, setGlobalTasks, setHasCurrentTab, setImageApiConfigId, setImageApiKey, setImageApiUrl, setImageCompatResolutions, setImageModelApiBindings, setImageModelProtocolBindings, setImageModels, setIsLoading, setIsPluginEnv, setIsReady, setLayeredRunConcurrencyOptions, setLayeredRunMaxConcurrency, setMaxPollingDuration, setMembership, setModelProtocolRegistry, setPerformanceProfile, setPollingInterval, setPresetPrompts, setProjectGroups, setProjects, setQiniuConfig, setSeedanceDurations, setSeedanceEnableWebSearch, setSeedanceGenerateAudio, setSeedanceModel, setSeedanceRatios, setSeedanceResolutions, setSeedanceUploadMode, setSeedanceVirtualPortraits, setSeedanceWatermark, setSelectedAgentId, setStorageOptimizationEnabled, setStorageOptimizationPaused, setStoredGlobalConfigs, setTextApiConfigId, setTextApiKey, setTextApiUrl, setTextModelApiBindings, setTextModelProtocolBindings, setThemeMode, setTianjiSeedanceModel, setTianjiSeedanceSettingsMode, setTongyiWanxiangDurations, setTongyiWanxiangEditModels, setTongyiWanxiangImageModels, setTongyiWanxiangRatios, setTongyiWanxiangReferenceImageModels, setTongyiWanxiangResolutions, setTongyiWanxiangTextModels, setTosConfig, setTransitGridCols, setTransitResources, setTtsMusicModel, setUpdateInfo, setUsers, setVideoApiConfigId, setVideoApiKey, setVideoApiUrl, setVideoAspectRatios, setVideoDurations, setVideoModelApiBindings, setVideoModelProtocolBindings, setVideoModelRequestProfilesText, setVideoModels, setVideoResolutions, settingsHydratedRef, showToast2 }),
    useSafeEffect38({ agentConversations, agentItems, appLanguage, autoDownloadGeneratedResults, backupExportSelection, downloadDirectory, layeredRunConcurrencyOptions, layeredRunMaxConcurrency, maxPollingDuration, performanceProfile, pollingInterval, presetPrompts, saveNonModelSettings, selectedAgentId, storageOptimizationEnabled, storageOptimizationPaused, themeMode }),
    useEffect(() => {
      globalThis.__wanjuanLastCanvasActivityAt = Date.now();
    }, [activeProjectId]),
    useSafeEffect40({ activeProjectId, globalTasks, storageOptimizationEnabled, storageOptimizationPaused }),
    useLateEffect4760({ activeSettingsTab, downloadDirectory, setStorageOptimizationStatus }),
    useSafeEffect42({ downloadDirectory, setStorageOptimizationLastResult, storageOptimizationEnabled }),
	    useLateEffect4766({ apiModelCloudSettingsSaveTimerRef, nonModelSettingsSaveTimerRef }));
  let saveUsers = use_saveUsers({ isPluginEnv, setUsers, users }).saveUsers,
    restoreCookies = use_restoreCookies({ isPluginEnv }).restoreCookies,
      openAccountSite = use_openAccountSite({ isPluginEnv, restoreCookies, setSelectedUser }).openAccountSite,
        addAccount = use_addAccount({ accountNameInput, cookieInput, currentLimits, currentPlatform, editingAccountId, isPluginEnv, saveUsers, setAccountNameInput, setCookieInput, setEditingAccountId, setIsAccountBusy, setIsAddingAccount, users }).addAccount,
          [pendingDeleteId, setPendingDeleteId] = useState(null),
          handleDeleteClick = use_handleDeleteClick({ pendingDeleteId, saveUsers, selectedUser, setPendingDeleteId, setSelectedUser, users }).handleDeleteClick,
          toggleFavorite = use_toggleFavorite({ isPluginEnv, setTransitResources, transitResources, localforageModule }).toggleFavorite,
            handleClearUnfavorited = use_handleClearUnfavorited({ isPluginEnv, setTransitResources, transitResources, localforageModule }).handleClearUnfavorited,
            probeResourceAlive = use_probeResourceAlive({}).probeResourceAlive,
            handleCleanInvalidResources = use_handleCleanInvalidResources({ isPluginEnv, probeResourceAlive, resourceCleanupBusy, setCurrentPage, setResourceCleanupBusy, setTransitResources, showToast2, transitResources, localforageModule }).handleCleanInvalidResources;
  let filteredTransitResources = transitResources.filter((resource) => wanjuanResourceMatchesFilter(resource, resourceTypeFilter, resourceSourceFilter, resourceFavoriteOnly)),
    transitResourcePageSize = wanjuanGetTransitResourcePageSize(transitGridCols),
    transitResourceTotalPages = Math.max(1, Math.ceil(filteredTransitResources.length / transitResourcePageSize));
  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(1, page), transitResourceTotalPages));
  }, [transitResourceTotalPages]);
  useEffect(() => {
    let handlePaste = async (event) => {
      if (activeView !== `transit`) return;
      let items = event.clipboardData?.items;
      if (items)
        for (let index = 0; index < items.length; index++) {
          let clipboardItem = items[index];
          if (clipboardItem.type.indexOf(`image`) !== -1) {
            let file = clipboardItem.getAsFile();
            if (file) {
              let reader = new FileReader();
              ((reader.onload = (event2) => {
                  if (event2.target?.result) {
                    let dataUrl = event2.target.result;
                    addResource(dataUrl, `image`);
                  }
                }),
                reader.readAsDataURL(file));
            }
          } else
            clipboardItem.type === `text/plain` &&
            clipboardItem.getAsString((text) => {
              text && addResource(text, `text`);
            });
        }
    };
    return (
      window.addEventListener(`paste`, handlePaste),
      () => {
        window.removeEventListener(`paste`, handlePaste);
      }
    );
  }, [activeView, transitResources]);
	  let addResource = use_addResource({ isPluginEnv, setTransitResources, transitResources, localforageModule }).addResource;
	  useSafeEffect46({ activeView, isPluginEnv, localforageModule, setEdges, setMaxPollingDuration, setTransitResources, transitResources });
	  useSafeEffect47({ activeView, isPluginEnv, localforageModule, setEdges, setMaxPollingDuration, setTransitResources, transitResources });
  let addTransitResource = use_addTransitResource({ isPluginEnv, persistTransitResource, setEdges, setTransitResources, transitResources, localforageModule }).addTransitResource;
  let sendToPlugin = use_sendToPlugin({ isPluginEnv, showToast2 }).sendToPlugin,
  copyResource = use_copyResource({ showToast2 }).copyResource,
  handleRemoveTransitResource = use_handleRemoveTransitResource({ isPluginEnv, setTransitResources, transitResources, localforageModule }).handleRemoveTransitResource,
  handleCreateProject = use_handleCreateProject({ isPluginEnv, newProjectGroupId, newProjectName, projectGroups, projects, setActiveProjectId, setNewProjectGroupId, setNewProjectIds, setNewProjectName, setProjectMenuOpen, setProjects }).handleCreateProject,
  persistProjectGroups = use_persistProjectGroups({ isPluginEnv, projects, setProjectGroups, projectGroups }).persistProjectGroups,
  createProjectGroup = use_createProjectGroup({ persistProjectGroups, projectGroupDraft, projectGroups, setProjectGroupDraft, showToast2 }).createProjectGroup,
  renameProjectGroup = use_renameProjectGroup({ projectGroups, setEditingProjectGroupId, setEditingProjectGroupName }).renameProjectGroup,
  confirmProjectGroupRename = use_confirmProjectGroupRename({ editingProjectGroupId, editingProjectGroupName, persistProjectGroups, projectGroups, setEditingProjectGroupId, setEditingProjectGroupName, showToast2 }).confirmProjectGroupRename,
  deleteProjectGroup = use_deleteProjectGroup({ persistProjectGroups, projectGroups, projects, setProjects, showToast2 }).deleteProjectGroup,
  moveProjectToGroup = use_moveProjectToGroup({ isPluginEnv, projectGroups, projects, setProjects }).moveProjectToGroup,
  VtRenameProject = (projectId) => {
          let project = projects.find((project2) => project2.id === projectId);
          if (!project) return;
          (setRenameProjectId(projectId), setRenameProjectName(project.name || ``));
        },
  ConfirmRenameProject = use_ConfirmRenameProject({ isPluginEnv, projects, renameProjectId, renameProjectName, setProjects, setRenameProjectId, setRenameProjectName, showToast2 }).ConfirmRenameProject,
  handleDeleteProject = (projectId) => {
          if (projects.length <= 1) {
            showToast2(`至少保留一个项目`);
            return;
          }
          if (confirm(`确定删除此项目吗？`)) {
            let remainingProjects = projects.filter((project) => project.id !== projectId);
            (setProjects(remainingProjects),
              activeProjectId === projectId && setActiveProjectId(remainingProjects[0].id),
              isPluginEnv && chrome.storage.local.set({
                projects: remainingProjects
              }),
              (async () => {
                let canvasStorageKey = getProjectCanvasStorageKey(projectId),
                  assetRefs = new Set(),
                  portableDataRefs = new Set();
                if (localforageModule.default)
                  try {
                    let canvasData = await localforageModule.default.getItem(canvasStorageKey);
                    (extractProjectAssetRefs(canvasData).forEach((assetRef) => assetRefs.add(assetRef)),
                      extractProjectPortableDataRefs(canvasData).forEach((dataRef) => portableDataRefs.add(dataRef)),
                      await localforageModule.default.removeItem(canvasStorageKey));
                  } catch (error) {
                    console.warn(`删除项目画布缓存失败`, error);
                  }
                for (let assetRef of assetRefs)
                  try {
                    await localforageModule.default.removeItem(assetRef);
                  } catch (error) {
                    console.warn(`删除项目资产引用失败`, assetRef, error);
                  }
                for (let dataRef of portableDataRefs)
                  try {
                    assetRefs.has(dataRef) || (await localforageModule.default.removeItem(dataRef));
                  } catch (error) {
                    console.warn(`删除项目便携资产失败`, dataRef, error);
                  }
                if (isPluginEnv) {
                  try {
                    chrome.storage.local.remove([
                      getDesktopProjectMirrorStorageKey(projectId),
                      activeProjectId === projectId ? `lastOpenedProjectId` : ``,
                    ].filter(Boolean));
                  } catch (error) {
                    console.warn(`删除项目镜像缓存失败`, error);
                  }
                }
                if (window.wanjuanDesktop?.removeProjectAssets)
                  try {
                    await window.wanjuanDesktop.removeProjectAssets({
                      projectId: projectId,
                      directory: downloadDirectory,
                    });
                  } catch (error) {
                    console.warn(`删除项目媒体目录失败`, error);
                  }
              })().catch(console.error),
              showToast2(`项目已删除`));
          }
        },
  storageStatusLabels = {
          unoptimized: `未优化`,
          queued: `等待迁移`,
          migrating: `迁移中`,
          optimized: `已优化`,
          authorization: `需要授权`,
          failed: `迁移失败`,
        },
  persistProjectsWithStorageState = use_persistProjectsWithStorageState({ isPluginEnv, projects, setProjects }).persistProjectsWithStorageState,
  refreshStorageOptimizationStatus = async () => {
          let result = await window.wanjuanDesktop?.getStorageOptimizationStatus?.({
            directory: downloadDirectory
          });
          result?.ok && setStorageOptimizationStatus(result);
          return result;
        },
  buildCompleteStorageReferenceIndex = async () => {
          let indexedProjects = [];
          for (let project of projects) {
            let state = await localforageModule.default?.getItem(getProjectCanvasStorageKey(project.id));
            indexedProjects.push({
              projectId: project.id,
              complete: !!state,
              references: state ? [...globalThis.collectProjectFileReferences(state)] : [],
            });
          }
          let result = await window.wanjuanDesktop?.rebuildStorageReferenceIndex?.({
            directory: downloadDirectory,
            projects: indexedProjects,
          });
          result?.ok && (await refreshStorageOptimizationStatus());
          return result;
        },
  runStorageMigrationForProject = async (projectId, automatic = false) => {
          if (!storageOptimizationEnabled) {
            automatic || showToast2(`请先启用存储优化`);
            return {
              ok: false,
              error: `STORAGE_OPTIMIZATION_DISABLED`
            };
          }
          if (projectId === activeProjectId) {
            persistProjectsWithStorageState(projectId, `queued`, `切换到其他项目后将在空闲时迁移`);
            automatic || showToast2(`当前项目已加入优先队列，切换项目后执行`);
            return {
              ok: false,
              error: `CURRENT_PROJECT_MUST_BE_CLOSED`
            };
          }
          if (globalThis.__wanjuanStorageMigrationRunning) return {
            ok: false,
            error: `STORAGE_MIGRATION_BUSY`
          };
          globalThis.__wanjuanStorageMigrationRunning = true;
          persistProjectsWithStorageState(projectId, `migrating`, ``);
          try {
            let result = await globalThis.runForcedArchiveMigration(projectId, downloadDirectory, {
              currentProjectId: activeProjectId
            });
            persistProjectsWithStorageState(projectId, `optimized`, `迁移完成`);
            setStorageOptimizationLastResult(`项目迁移完成：${projects.find((project) => project.id === projectId)?.name || projectId}`);
            await refreshStorageOptimizationStatus();
            return result;
          } catch (error) {
            let message = String(error?.message || error),
              status = /permission|access|EACCES|EPERM/i.test(message) ? `authorization` : `failed`;
            persistProjectsWithStorageState(projectId, status, message);
            setStorageOptimizationLastResult(`项目迁移失败并已恢复：${message}`);
            automatic || showToast2(`迁移失败，原项目已恢复`);
            return {
              ok: false,
              error: message
            };
          } finally {
            globalThis.__wanjuanStorageMigrationRunning = false;
          }
        },
  runNextStorageMigration =
        (globalThis.__wanjuanRunNextStorageMigration = async (automatic = false) => {
          if (!storageOptimizationEnabled || storageOptimizationPaused || globalThis.__wanjuanStorageMigrationRunning) return;
          let candidate = projects.find((project) => project.id !== activeProjectId && [`queued`, `unoptimized`, undefined].includes(project.storageStatus));
          if (!candidate) {
            if (automatic && Date.now() - Number(globalThis.__wanjuanLastTrashPurgeAt || 0) > 864e5) {
              globalThis.__wanjuanLastTrashPurgeAt = Date.now();
              await window.wanjuanDesktop?.purgeStorageTrash?.({
                directory: downloadDirectory,
                olderThanDays: 30,
                confirm: true,
              });
            }
            return;
          }
          return runStorageMigrationForProject(candidate.id, automatic);
        }),
  enableStorageOptimization = use_enableStorageOptimization({ activeProjectId, projects, refreshStorageOptimizationStatus, setProjects, setStorageOptimizationEnabled, setStorageOptimizationLastResult, setStorageOptimizationPaused, showToast2, storageOptimizationEnabled, storageOptimizationPaused }).enableStorageOptimization,
  scanStorageOptimization = use_scanStorageOptimization({ buildCompleteStorageReferenceIndex, downloadDirectory, refreshStorageOptimizationStatus, setStorageOptimizationBusy, setStorageOptimizationLastResult, showToast2 }).scanStorageOptimization,
  cleanStorageOptimization = use_cleanStorageOptimization({ buildCompleteStorageReferenceIndex, downloadDirectory, refreshStorageOptimizationStatus, setStorageOptimizationBusy, setStorageOptimizationLastResult, showToast2 }).cleanStorageOptimization,
  restoreStorageOptimizationTrash = use_restoreStorageOptimizationTrash({ downloadDirectory, refreshStorageOptimizationStatus, setStorageOptimizationLastResult }).restoreStorageOptimizationTrash,
  purgeStorageOptimizationTrash = use_purgeStorageOptimizationTrash({ downloadDirectory, refreshStorageOptimizationStatus, setStorageOptimizationLastResult }).purgeStorageOptimizationTrash,
  showStorageOptimizationDetails = () => {
          let lines = projects.map((project) => `${project.name}：${projectStorageLabel(project)}${project.storageDetail ? ` · ${project.storageDetail}` : ``}`);
          alert(`存储优化详细记录\n\n${lines.join(`\n`) || `暂无项目记录`}\n\n最近结果：${storageOptimizationLastResult || `暂无`}`);
        },
  manageStorageOptimizationTrash = use_manageStorageOptimizationTrash({ downloadDirectory }).manageStorageOptimizationTrash,
  projectStorageLabel = (project) => storageStatusLabels[project?.storageStatus || `unoptimized`] || `未优化`,
  projectGroupList = normalizeProjectGroups(projectGroups),
  projectGroupIds = new Set(projectGroupList.map((group) => group.id)),
  projectGroupSearchText = String(projectGroupSearch || ``).trim().toLowerCase(),
  projectMatchesGroupSearch = (project) =>
        !projectGroupSearchText ||
        String(project?.name || ``).toLowerCase().includes(projectGroupSearchText),
  projectUngroupedAll = projects.filter((project) => !project.groupId || !projectGroupIds.has(project.groupId)),
  projectGroupedSectionsAll = projectGroupList.map((group) => ({
          ...group,
          projects: projects.filter((project) => project.groupId === group.id)
        })),
  ungroupedProjectList = projectUngroupedAll.filter(projectMatchesGroupSearch),
  groupedProjectSections = projectGroupedSectionsAll.map((group) => ({
          ...group,
          projects: group.projects.filter(projectMatchesGroupSearch)
        })),
  addCustomNodeTemplate = use_addCustomNodeTemplate({ edges, isPluginEnv, setEdges, showToast2 }).addCustomNodeTemplate,
  deleteCustomNodeTemplate = use_deleteCustomNodeTemplate({ edges, isPluginEnv, setEdges, showToast2 }).deleteCustomNodeTemplate,
  agentModelOptions = textModels
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== ``),
  filteredAgentItems = agentItems.filter((agent) => {
          let searchQuery = agentSearch.trim().toLowerCase();
          if (!searchQuery) return true;
          return [agent.name, agent.description, agent.model, agent.knowledge]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(searchQuery));
        }),
  selectedAgent =
        agentItems.find((agent) => agent.id === selectedAgentId) || agentItems[0] || null,
  selectedAgentMessages = agentConversations[selectedAgentId] || [],
  agentMessagesAutoScrollEffect = useLateEffect5880({ agentMessagesScrollRef, selectedAgentId, selectedAgentMessages }),
  updateSelectedAgent = use_updateSelectedAgent({ selectedAgent, setAgentItems }).updateSelectedAgent,
  normalizeMem0BaseUrl = (url) =>
        String(url || ``)
        .trim()
        .replace(/\/+$/, ``),
  normalizeMem0MemoryText = use_normalizeMem0MemoryText({}).normalizeMem0MemoryText,
  extractMem0Results = use_extractMem0Results({ normalizeMem0MemoryText }).extractMem0Results,
  searchAgentLongTermMemory = use_searchAgentLongTermMemory({ extractMem0Results, normalizeMem0BaseUrl }).searchAgentLongTermMemory,
  storeAgentLongTermMemory = use_storeAgentLongTermMemory({ normalizeMem0BaseUrl }).storeAgentLongTermMemory,
  resolvedAgentTheme =
        themeMode === `system` ?
        typeof window < `u` &&
        window.matchMedia &&
        window.matchMedia(`(prefers-color-scheme: light)`).matches ?
        `light` :
        `dark` :
        normalizeThemeMode(themeMode),
  agentTheme =
        agentThemePalettes[resolvedAgentTheme] ||
        agentThemePalettes[
          typeof resolvedAgentTheme == `string` &&
          resolvedAgentTheme.toLowerCase().includes(`dark`) ?
          `dark` :
          `light`
        ],
  isLightAgentTheme = agentTheme.mode !== `dark`,
  backupDialogTheme = {
          panelBg: isLightAgentTheme ? agentTheme.mainBg : agentTheme.panelBg,
          headerBg: isLightAgentTheme ? agentTheme.headerBg : agentTheme.panelBg,
          bodyBg: isLightAgentTheme ? agentTheme.pageBg : agentTheme.mainBg,
          sectionBg: isLightAgentTheme ? agentTheme.cardBg : agentTheme.cardBg,
          insetBg: isLightAgentTheme ? agentTheme.chipBg : agentTheme.chipBg,
          border: agentTheme.panelBorder,
          mutedBorder: agentTheme.panelMutedBorder,
          textPrimary: agentTheme.textPrimary,
          textSecondary: agentTheme.textSecondary,
          textMuted: agentTheme.textMuted,
          buttonBg: agentTheme.chipBg,
          buttonBorder: agentTheme.chipBorder,
          buttonText: agentTheme.chipText,
          accentBg: agentTheme.accentBg,
          primaryBg: agentTheme.accentText,
          primaryBorder: agentTheme.accentBorder,
          primaryText: isLightAgentTheme ? `#ffffff` : `#0f172a`,
          shadow: isLightAgentTheme ?
            `0 24px 70px rgba(70, 88, 76, 0.24)` :
            `0 24px 70px rgba(0,0,0,0.52)`,
        },
  configErrorAssistantTheme = {
          panelBg: isLightAgentTheme ? agentTheme.modalBg : agentTheme.panelBg,
          headerBg: isLightAgentTheme ? agentTheme.modalHeaderBg : agentTheme.headerBg,
          bodyBg: isLightAgentTheme ? agentTheme.modalSectionBg : agentTheme.mainBg,
          cardBg: isLightAgentTheme ? agentTheme.inputBg : agentTheme.mainBg,
          border: agentTheme.modalBorder || agentTheme.panelBorder,
          mutedBorder: agentTheme.panelMutedBorder,
          textPrimary: agentTheme.textPrimary,
          textSecondary: agentTheme.textSecondary,
          textMuted: agentTheme.textMuted,
          buttonBg: agentTheme.chipBg,
          buttonBorder: agentTheme.chipBorder,
          buttonText: agentTheme.chipText,
          accentBg: agentTheme.accentBg,
          accentBorder: agentTheme.accentBorder,
          accentText: agentTheme.accentText,
          dangerText: isLightAgentTheme ? `#b42318` : `#fecaca`,
          dangerBg: isLightAgentTheme ? `rgba(220,38,38,0.08)` : `rgba(239,68,68,0.16)`,
          successText: isLightAgentTheme ? `#166534` : `#bbf7d0`,
          successBg: isLightAgentTheme ? `rgba(22,101,52,0.08)` : `rgba(34,197,94,0.12)`,
          primaryBg: agentTheme.accentText,
          primaryText: isLightAgentTheme ? `#ffffff` : `#08111f`,
          shadow: isLightAgentTheme ?
            `0 22px 58px rgba(80, 70, 58, 0.24)` :
            `0 18px 50px rgba(0,0,0,0.58)`,
        },
  importAgentKnowledgeFile = use_importAgentKnowledgeFile({ selectedAgent, showToast2, updateSelectedAgent }).importAgentKnowledgeFile,
  removeAgentKnowledgeFile = use_removeAgentKnowledgeFile({ selectedAgent, showToast2, updateSelectedAgent }).removeAgentKnowledgeFile,
  addAgentReferenceFile = () => {
	            agentAttachmentInputRef.current?.click();
	          },
  renderAgentAttachmentPill = (attachment) => {
	            let attachmentMeta = getAgentAttachmentMeta(attachment),
	              sizeLabel = formatAgentAttachmentSize(attachment.size),
	              uploadProgress = Math.max(0, Math.min(100, Number(attachment.uploadProgress) || (attachment.uploadStatus === `ready` ? 100 : 0))),
	              isReady = attachment.uploadStatus === `ready`;
	            return jsxs(`div`, {
	              className: `group relative inline-flex shrink-0 items-center text-left transition-all hover:-translate-y-1 hover:scale-[1.02]`,
	              style: {
	                position: `relative`,
	                display: `inline-flex`,
	                flexShrink: 0,
	                alignItems: `center`,
	                gap: `6px`,
	                width: `128px`,
	                height: `40px`,
	                padding: `4px 6px`,
	                borderRadius: `14px`,
	                border: `1px solid rgba(255,255,255,0.8)`,
	                background: `rgba(255,255,255,0.76)`,
	                boxShadow: `0 14px 30px rgba(18,24,38,0.18), 0 2px 8px rgba(18,24,38,0.08), inset 0 1px 0 rgba(255,255,255,0.92)`,
	                backdropFilter: `blur(12px)`,
	              },
	              children: [
	                jsx(`span`, {
	                  className: `relative inline-flex shrink-0 items-center justify-center border`,
	                  style: {
	                    position: `relative`,
	                    display: `inline-flex`,
	                    flexShrink: 0,
	                    alignItems: `center`,
	                    justifyContent: `center`,
	                    width: `30px`,
	                    height: `30px`,
	                    borderRadius: `11px`,
	                    borderColor: `${attachmentMeta.tint}55`,
	                    background: `linear-gradient(145deg,rgba(255,255,255,0.86),${attachmentMeta.bg})`,
	                    color: attachmentMeta.tint,
	                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.92),0 7px 14px rgba(42,51,72,0.14)`,
	                  },
	                  children: [
	                    renderAgentAttachmentGlyph(attachment, {
	                      size: 15,
	                    }),
	                    isReady &&
	                    jsx(`span`, {
	                      className: `absolute flex items-center justify-center rounded-full border`,
	                      style: {
	                        position: `absolute`,
	                        right: `-2px`,
	                        bottom: `-2px`,
	                        display: `flex`,
	                        alignItems: `center`,
	                        justifyContent: `center`,
	                        width: `11px`,
	                        height: `11px`,
	                        borderRadius: `999px`,
	                        borderColor: `rgba(255,255,255,0.88)`,
	                        background: attachmentMeta.tint,
	                        color: `white`,
	                        fontSize: `7px`,
	                        lineHeight: `11px`,
	                      },
	                      children: `✓`,
	                    }),
	                  ],
	                }),
	                jsxs(`span`, {
	                  className: `min-w-0 flex-1`,
	                  style: {
	                    display: `block`,
	                    minWidth: 0,
	                    flex: `1 1 auto`,
	                  },
	                  children: [
	                    jsx(`span`, {
	                      className: `block truncate`,
	                      style: {
	                        display: `block`,
	                        overflow: `hidden`,
	                        textOverflow: `ellipsis`,
	                        whiteSpace: `nowrap`,
	                        fontSize: `10px`,
	                        fontWeight: 650,
	                        lineHeight: `13px`,
	                        color: `#2f2a24`,
	                      },
	                      title: attachment.name || `参考文件`,
	                      children: attachment.name || `参考文件`,
	                    }),
	                    jsxs(`span`, {
	                      className: `block truncate`,
	                      style: {
	                        display: `block`,
	                        overflow: `hidden`,
	                        textOverflow: `ellipsis`,
	                        whiteSpace: `nowrap`,
	                        marginTop: `1px`,
	                        fontSize: `9px`,
	                        lineHeight: `11px`,
	                        color: `#8a7a66`,
	                      },
	                      children: [
	                        isReady ? `已选择` : `选择中 ${Math.round(uploadProgress)}%`,
	                        sizeLabel ? ` · ${sizeLabel}` : ``,
	                      ],
	                    }),
	                    jsx(`span`, {
	                      className: `block overflow-hidden rounded-full`,
	                      style: {
	                        display: `block`,
	                        height: `2px`,
	                        marginTop: `2px`,
	                        overflow: `hidden`,
	                        borderRadius: `999px`,
	                        background: `#eadfcd`,
	                      },
	                      children: jsx(`span`, {
	                        className: `block h-full rounded-full transition-all duration-500`,
	                        style: {
	                          display: `block`,
	                          height: `100%`,
	                          borderRadius: `999px`,
	                          width: `${uploadProgress}%`,
	                          background: `linear-gradient(90deg,${attachmentMeta.tint},rgba(255,255,255,0.82))`,
	                        },
	                      }),
	                    }),
	                  ],
	                }),
	                jsx(`button`, {
	                  type: `button`,
	                  onClick: () => removeAgentAttachment(attachment.id),
	                  className: `absolute inline-flex shrink-0 items-center justify-center rounded-full border opacity-0 transition-opacity group-hover:opacity-100`,
	                  style: {
	                    position: `absolute`,
	                    right: `-6px`,
	                    top: `-6px`,
	                    display: `inline-flex`,
	                    alignItems: `center`,
	                    justifyContent: `center`,
	                    width: `16px`,
	                    height: `16px`,
	                    borderRadius: `999px`,
	                    borderColor: `rgba(248,113,113,0.72)`,
	                    background: `rgba(127,29,29,0.92)`,
	                    color: `#fecaca`,
	                    fontSize: `10px`,
	                    lineHeight: `16px`,
	                  },
	                  title: `移除`,
	                  children: `×`,
	                }),
	              ],
	            }, attachment.id);
	          },
  removeAgentAttachment = use_removeAgentAttachment({ setAgentAttachments }).removeAgentAttachment,
  handleAgentReferenceSelection = use_handleAgentReferenceSelection({ setAgentAttachments, showToast2 }).handleAgentReferenceSelection,
  createAgent = use_createAgent({ agentModelOptions, setAgentConversations, setAgentItems, setSelectedAgentId, showToast2, textApiConfigId, textModelApiBindings, textModels }).createAgent,
  duplicateSelectedAgent = use_duplicateSelectedAgent({ selectedAgent, setAgentConversations, setAgentItems, setSelectedAgentId, showToast2 }).duplicateSelectedAgent,
  deleteSelectedAgent = use_deleteSelectedAgent({ agentItems, selectedAgent, setAgentConversations, setAgentItems, setSelectedAgentId, showToast2 }).deleteSelectedAgent,
  clearSelectedAgentConversation = use_clearSelectedAgentConversation({ agentConversations, selectedAgent, setAgentConversations, showToast2 }).clearSelectedAgentConversation,
  sendAgentMessage = use_sendAgentMessage({ agentAttachments, agentComposer, agentConversations, agentModelOptions, apiConfigs, modelProtocolRegistry, searchAgentLongTermMemory, selectedAgent, setAgentAttachments, setAgentComposer, setAgentConversations, showToast2, storeAgentLongTermMemory, textApiConfigId, textApiKey, textApiUrl, textModelApiBindings, textModelProtocolBindings, customPublicUploadConfig, qiniuConfig, seedanceUploadMode, tosConfig }).sendAgentMessage,
  canManuallyRefreshGlobalTask = (task) => {
		              return !!task && [`running`, `pending`, `failed`, `completed`].includes(task.status);
		            },
  canManualRecoverImageTask = (task) => {
		              return !!task && !task.stoppedByUser && (task.type === `image` || task.customOutputType === `image`);
		            },
  handleManualRecoverImageTask = async (task) => {
		              if (!canManualRecoverImageTask(task)) return;
		              // 优先自动拉回：任务已记录中转站 remoteTaskId(或已有结果)时，直接交给
		              // refreshGlobalTask 用已记录的 ID 去中转站查结果，无需用户手动粘贴 ID/URL。
		              // 仅当确实没有 remoteTaskId 也没有结果时，才退回手动输入框作为兜底。
		              if (task.remoteTaskId || task.customResultData || task.resultUrl) {
		                refreshGlobalTask(task, {});
		                return;
		              }
		              let dialogResult = await window.wanjuanDesktop?.showInputDialog?.({
		                title: `手动恢复图片任务`,
		                message: `这个任务没有记录中转站任务 ID（可能提交时已失败）。可粘贴图片结果 URL，或填写中转站任务 ID：`,
		                defaultValue: ``,
		              });
		              if (dialogResult === null) return;
		              let trimmedInput = String(dialogResult || ``).trim();
		              if (!trimmedInput) {
		                showToast2(`没有填写结果 URL 或任务 ID`);
		                return;
		              }
		              refreshGlobalTask(task, {
		                manualImageValue: trimmedInput
		              });
		            },
  runConfigButlerErrorDiagnosis = use_runConfigButlerErrorDiagnosis({ activeStoredGlobalConfigId, apiConfigs, audioModelProtocolBindings, callConfigButlerModel, configButlerDocUrl, configButlerErrorAssistantInFlightRef, imageModelProtocolBindings, modelProtocolRegistry, setConfigButlerErrorAssistant, storedGlobalConfigs, textModelProtocolBindings, videoModelProtocolBindings }).runConfigButlerErrorDiagnosis,
  maybeTriggerConfigButlerErrorDiagnosis = use_maybeTriggerConfigButlerErrorDiagnosis({ configButlerErrorAssistant, configButlerErrorAssistantInFlightRef, runConfigButlerErrorDiagnosis }).maybeTriggerConfigButlerErrorDiagnosis,
  runManualConfigButlerErrorQuery = use_runManualConfigButlerErrorQuery({ configButlerErrorAssistant, configButlerErrorAssistantMinimized, globalTasks, maybeTriggerConfigButlerErrorDiagnosis, setConfigButlerErrorAssistant, setConfigButlerErrorAssistantMinimized, showToast2 }).runManualConfigButlerErrorQuery,
  getConfigButlerRepairContext = use_getConfigButlerRepairContext({ audioModelProtocolBindings, configButlerErrorAssistant, imageModelProtocolBindings, modelProtocolRegistry, textModelProtocolBindings, videoModelProtocolBindings }).getConfigButlerRepairContext,
  openConfigButlerManualProblemFields = use_openConfigButlerManualProblemFields({ configButlerErrorAssistant, getConfigButlerRepairContext, setConfigButlerManualProblemPart, setConfigButlerManualProtocolName, setConfigButlerManualProtocolOpen, setConfigButlerManualProtocolText, showToast2 }).openConfigButlerManualProblemFields,
  applyConfigButlerProtocolRepair = use_applyConfigButlerProtocolRepair({ activeStoredGlobalConfigId, audioModelProtocolBindings, configButlerErrorAssistant, configButlerRepairHistory, imageModelProtocolBindings, modelProtocolRegistry, setActiveStoredGlobalConfigId, setAudioModelProtocolBindings, setConfigButlerErrorAssistant, setConfigButlerRepairHistory, setImageModelProtocolBindings, setModelProtocolRegistry, setStoredGlobalConfigs, setTextModelProtocolBindings, setVideoModelProtocolBindings, showToast2, storedGlobalConfigs, textModelProtocolBindings, videoModelProtocolBindings }).applyConfigButlerProtocolRepair,
  applyConfigButlerErrorAssistantFix = () => {
		              let suggestedProtocol = configButlerErrorAssistant?.diagnosis?.suggestedProtocol;
		              applyConfigButlerProtocolRepair(suggestedProtocol, `配置管家修复`);
		            },
  applyConfigButlerManualProtocolFix = use_applyConfigButlerManualProtocolFix({ applyConfigButlerProtocolRepair, configButlerErrorAssistant, configButlerManualProtocolName, configButlerManualProtocolText, getConfigButlerRepairContext, showToast2 }).applyConfigButlerManualProtocolFix,
  rollbackConfigButlerRepair = use_rollbackConfigButlerRepair({ configButlerRepairHistory, setAudioModelProtocolBindings, setConfigButlerRepairHistory, setImageModelProtocolBindings, setModelProtocolRegistry, setStoredGlobalConfigs, setTextModelProtocolBindings, setVideoModelProtocolBindings, showToast2, storedGlobalConfigs, audioModelProtocolBindings, imageModelProtocolBindings, modelProtocolRegistry, textModelProtocolBindings, videoModelProtocolBindings }).rollbackConfigButlerRepair,
  updateGlobalTasks = use_updateGlobalTasks({ isPluginEnv, setGlobalTasks, globalTasks }).updateGlobalTasks,
  configButlerDiagnosticsTestHook = (() => {
              try {
                typeof window < `u` &&
                  (window.__wanjuanConfigButlerDiagnostics = {
	                    triggerWithTasks: (tasks) => maybeTriggerConfigButlerErrorDiagnosis(compactGlobalTasks(tasks), [], {
	                      manual: true,
	                    }),
                    getState: () => configButlerErrorAssistant,
                    clear: () => setConfigButlerErrorAssistant(null),
                  });
              } catch {}
              return true;
            })(),
  configButlerStoredTaskScanEffect = true,
  refreshGlobalTask = use_refreshGlobalTask({ addResource, apiConfigs, audioApiKey, audioApiUrl, imageApiKey, imageApiUrl, imageModelApiBindings, showToast2, updateGlobalTasks, videoApiKey, videoApiUrl, videoModelApiBindings, globalTasks, storedGlobalConfigs, Send }).refreshGlobalTask,
  wanjuanAutoRefreshGlobalTasksRef = useRef(globalTasks),
  wanjuanAutoRefreshGlobalTasksBusyRef = useRef(false),
  wanjuanAutoRefreshGlobalTaskRefreshRef = useRef(null),
  wanjuanAutoRefreshGlobalTasksCurrent = (wanjuanAutoRefreshGlobalTasksRef.current = globalTasks),
  wanjuanAutoRefreshGlobalTaskRefreshCurrent = (wanjuanAutoRefreshGlobalTaskRefreshRef.current = refreshGlobalTask),
  wanjuanAutoRefreshGlobalTasksEffect = useAutoRefreshGlobalTasksEffect({ wanjuanAutoRefreshGlobalTaskRefreshRef, wanjuanAutoRefreshGlobalTasksBusyRef, wanjuanAutoRefreshGlobalTasksRef }),
  updatePresetField = (index, key, value) => {
                let nextPresets = [...presetPrompts];
                ((nextPresets[index] = {
                  ...nextPresets[index],
                  [key]: value
                }), setPresetPrompts(nextPresets));
              },
  handleAddPreset = use_handleAddPreset({ currentLimits, presetPrompts, setPresetPrompts, showToast2 }).handleAddPreset,
  handleRemovePreset = (index) => {
                setPresetPrompts(presetPrompts.filter((promptRule, index2) => index2 !== index));
              },
  handleServerVerify = use_handleServerVerify({ deviceId, isPluginEnv, membershipCode, setMembership, setMembershipCode, showToast2 }).handleServerVerify;
  let BACKUP_MODULE_LABELS = {
      settings: `设置参数`,
      projects: `画布项目`,
      agents: `智能体配置`,
      resources: `资源信息`,
    },
  BACKUP_SETTINGS_SECTION_LABELS = {
      basic: `个性设置`,
      api: `API 配置`,
      models: `模型配置`,
      cloud: `云盘设置`,
      generation: `生成设置`,
      data: `数据管理`,
      other: `其他设置`,
    },
  BACKUP_SETTINGS_SECTION_ORDER = [
      `basic`,
      `api`,
      `models`,
      `cloud`,
      `generation`,
      `data`,
      `other`,
    ],
  PROJECT_STORAGE_KEYS = new Set([`projects`, `projectGroups`, `lastOpenedProjectId`]),
  AGENT_STORAGE_KEYS = new Set([`agents`, `selectedAgentId`, `agentConversations`]),
  PROJECT_CANVAS_STORAGE_PREFIX = `canvas-state-v1-`,
  DESKTOP_PROJECT_MIRROR_STORAGE_PREFIX = `desktop-canvas-state-v1-`,
  TRANSIT_RESOURCES_STORAGE_KEY = `transitResources`,
  PROJECT_ASSET_STORAGE_PREFIX = `project-asset-v2-`,
  EXTERNAL_PROJECT_ASSET_ORIGINS = new Set([`external-upload`, `uploaded`, `user-upload`, `user-media`, `local-file`, `relinked`]),
  GENERATED_PROJECT_ASSET_ORIGIN_PATTERN = /(generated|video-editor|ai|seedream|seedance|task|tts|music)/i,
  splitChromeStorageModules = use_splitChromeStorageModules({ AGENT_STORAGE_KEYS, DESKTOP_PROJECT_MIRROR_STORAGE_PREFIX, PROJECT_ASSET_STORAGE_PREFIX, PROJECT_CANVAS_STORAGE_PREFIX, PROJECT_STORAGE_KEYS, TRANSIT_RESOURCES_STORAGE_KEY, projects }).splitChromeStorageModules,
  getBackupSettingSectionForKey = (key) =>
    BACKUP_SETTINGS_SECTION_ORDER.find(
      (section) => section !== `other` && BACKUP_SETTINGS_SECTION_KEYS[section].includes(key),
    ) || `other`,
  getBackupSettingsSectionMap = use_getBackupSettingsSectionMap({ BACKUP_SETTINGS_SECTION_ORDER, getBackupSettingSectionForKey }).getBackupSettingsSectionMap,
  getProjectCanvasStorageKey = (projectId) => `${PROJECT_CANVAS_STORAGE_PREFIX}${projectId}`,
  getDesktopProjectMirrorStorageKey = (projectId) =>
    `${DESKTOP_PROJECT_MIRROR_STORAGE_PREFIX}${projectId}`,
  PROJECT_ASSET_REF_SUFFIX = `Ref`,
  externalizeProjectAssetContainer = use_externalizeProjectAssetContainer({ PROJECT_ASSET_REF_SUFFIX, localforageModule }).externalizeProjectAssetContainer,
  externalizeProjectCanvasState = use_externalizeProjectCanvasState({ externalizeProjectAssetContainer }).externalizeProjectCanvasState,
  hydrateProjectAssetContainer = use_hydrateProjectAssetContainer({ PROJECT_ASSET_REF_SUFFIX, localforageModule }).hydrateProjectAssetContainer,
  extractProjectAssetRefs = use_extractProjectAssetRefs({ PROJECT_ASSET_REF_SUFFIX }).extractProjectAssetRefs,
  projectMediaFieldList = [`imageUrl`, `videoUrl`, `audioUrl`, `text`, `resultData`],
  blobToDataUrl = use_blobToDataUrl({}).blobToDataUrl,
  projectMediaFetchWarningCache = new Set(),
  warnProjectMediaFetchOnce = use_warnProjectMediaFetchOnce({ projectMediaFetchWarningCache }).warnProjectMediaFetchOnce,
  projectMediaStringToPortableValue = use_projectMediaStringToPortableValue({ blobToDataUrl, warnProjectMediaFetchOnce }).projectMediaStringToPortableValue,
  shouldReuseProjectMediaBinding = use_shouldReuseProjectMediaBinding({}).shouldReuseProjectMediaBinding,
  isExternalUploadedProjectAssetBinding = use_isExternalUploadedProjectAssetBinding({ EXTERNAL_PROJECT_ASSET_ORIGINS, GENERATED_PROJECT_ASSET_ORIGIN_PATTERN }).isExternalUploadedProjectAssetBinding,
  shouldPromptProjectMediaRelink = (binding, bindingKey, data = {}) =>
	                  !!(
	                    binding?.missing &&
	                    isProjectMediaFileBackedBinding(binding, bindingKey, binding?.kind) &&
	                    isExternalUploadedProjectAssetBinding(binding, bindingKey, data)
	                  ),
  stripLargeProjectMediaPortablePayload = use_stripLargeProjectMediaPortablePayload({}).stripLargeProjectMediaPortablePayload,
  getProjectMediaPayload = use_getProjectMediaPayload({ projectMediaStringToPortableValue }).getProjectMediaPayload,
  applyProjectMediaBindingsToNode =
                  (globalThis.applyProjectMediaBindingsToNode = (node, presenceMap = new Map()) => {
                    let bindings = node?.data?.projectAssetBindings;
                    if (!bindings || typeof bindings != `object`) return node;
                    let data = {
                        ...node.data
                      },
                      nextBindings = {},
                      missingAssets = [];
	                    for (let [bindingKey, binding] of Object.entries(bindings || {})) {
	                      let strippedBinding = stripLargeProjectMediaPortablePayload(binding, bindingKey, binding?.kind),
	                        value = data[bindingKey],
		                        fileExists = strippedBinding?.localPath ?
		                        presenceMap.has(strippedBinding.localPath) && presenceMap.get(strippedBinding.localPath) !== false ||
		                        !!strippedBinding?.portableData ||
		                        typeof value == `string` &&
	                        !!value &&
	                        (value.startsWith(`data:`) ||
	                          /^https?:\/\//i.test(value) ||
	                          /^blob:/i.test(value) ||
	                          (/^file:\/\//i.test(value) && value !== buildProjectMediaFileUrl(strippedBinding.localPath))) :
	                        !!strippedBinding?.portableData,
	                        resolvedBinding = {
	                          ...strippedBinding,
	                          missing: strippedBinding?.localPath ? !fileExists : false,
	                          lastCheckedAt: new Date().toISOString(),
	                        };
	                      (nextBindings[bindingKey] = resolvedBinding),
	                        shouldPromptProjectMediaRelink(resolvedBinding, bindingKey, data) &&
	                        missingAssets.push(bindingKey);
                      let revivedValue = reviveProjectMediaBindingValue(resolvedBinding);
                      if (resolvedBinding.localPath && isProjectMediaFileBackedBinding(resolvedBinding, bindingKey, resolvedBinding.kind)) {
                        let fileUrl = buildProjectMediaFileUrl(resolvedBinding.localPath);
                        fileUrl &&
                          (bindingKey === `audioUrl` ||
                            data[bindingKey] === undefined ||
                            data[bindingKey] === null ||
                            data[bindingKey] === `` ||
                            (typeof data[bindingKey] == `string` && data[bindingKey].startsWith(`data:`))) &&
                          (data[bindingKey] = fileUrl);
                      } else
                        (data[bindingKey] === undefined || data[bindingKey] === null || data[bindingKey] === ``) &&
                        revivedValue !== undefined &&
                        (data[bindingKey] = revivedValue);
                    }
                    return {
                      ...node,
                      data: {
                        ...data,
                        projectAssetBindings: nextBindings,
                        missingProjectAssets: missingAssets,
                      },
                    };
                  }),
  getMissingProjectMediaEntries =
                  (globalThis.getMissingProjectMediaEntries = (nodes = []) => {
                    let missingEntries = [];
                    return (
                      Array.isArray(nodes) &&
                      nodes.forEach((node) => {
	                        let bindings = node?.data?.projectAssetBindings || {};
	                        Object.entries(bindings).forEach(([bindingKey, binding]) => {
	                          shouldPromptProjectMediaRelink(binding, bindingKey, node?.data || {}) &&
	                            missingEntries.push({
                              nodeId: node.id,
                              nodeType: node.type,
                              nodeLabel: node?.data?.label ||
                                node?.data?.title ||
                                node?.data?.name ||
                                node?.data?.prompt ||
                                node.type,
                              field: bindingKey,
                              binding: binding,
                            });
                        });
                      }),
                      missingEntries
                    );
                  }),
  forceRehomeProjectDataFileReferences = use_forceRehomeProjectDataFileReferences({}).forceRehomeProjectDataFileReferences,
  prepareProjectMediaStateForPersistence =
                  (globalThis.prepareProjectMediaStateForPersistence = async (canvasState, projectId, persistOptions, options = {}) => {
                    if (!window.wanjuanDesktop?.persistProjectAsset || !localforageModule.default) return canvasState;
                    let clonedState = cloneBackupValue(canvasState || {});
                    if (!Array.isArray(clonedState.nodes) || !clonedState.nodes.length) return clonedState;
                    clonedState.nodes = await Promise.all(
                      clonedState.nodes.map(async (node) => {
                        if (!node?.data || node.id === `ghost-target`) return node;
                        let data = {
                            ...node.data
                          },
                          bindings = {
                            ...(data.projectAssetBindings || {})
                          };
	                        for (let bindingKey of projectMediaFieldList) {
	                          let fieldValue = data[bindingKey],
	                            binding = bindings[bindingKey] || {},
	                            kind = binding.kind || getProjectMediaBindingKind(bindingKey, node),
	                            strippedBinding = stripLargeProjectMediaPortablePayload(binding, bindingKey, kind);
	                          if (wanjuanShouldSkipHydratedProjectAssetValue(fieldValue)) {
	                            let fileValue =
	                              wanjuanResolveHydratedProjectAssetFileValue(data, bindingKey) ||
	                              (binding.localPath ? buildProjectMediaFileUrl(binding.localPath) : ``),
	                              existingRef = data[`${bindingKey}${PROJECT_ASSET_REF_SUFFIX}`] || binding.portableDataRef;
	                            if (fileValue) {
	                              data[bindingKey] = fileValue;
	                              bindings[bindingKey] = {
	                                ...strippedBinding,
	                                field: bindingKey,
	                                kind: kind,
	                                valueFormat: `file-url`,
	                                sourceSignature: fileValue,
	                                missing: false,
	                              };
	                            } else {
	                              delete data[bindingKey];
	                              existingRef &&
	                                (bindings[bindingKey] = {
	                                  ...strippedBinding,
	                                  field: bindingKey,
	                                  kind: kind,
	                                  portableDataRef: existingRef,
	                                  valueFormat: strippedBinding.valueFormat || `data-url`,
	                                  sourceSignature: strippedBinding.sourceSignature || `${PROJECT_ASSET_STORAGE_PREFIX}${existingRef}`,
	                                });
	                            }
	                            console.warn(`Skipped oversized project media data URL during canvas save`, bindingKey, node.id);
	                            continue;
	                          }
	                          if (options.forceRehomeExistingFiles) {
                            let existingFileValue =
                              binding.localPath ||
                              (typeof fieldValue == `string` && fieldValue.startsWith(`file://`) ? fieldValue : ``);
                            if (existingFileValue) {
                              try {
                                let archivedAsset = await window.wanjuanDesktop.persistProjectAsset({
                                    localPath: binding.localPath,
                                    url: binding.localPath ? `` : existingFileValue,
                                    mime: binding.mime,
                                    filename: binding.filename || binding.originalName,
                                    projectId: projectId,
                                    nodeId: node.id,
                                    field: bindingKey,
                                    kind: kind,
                                    assetId: binding.assetId,
                                    directory: persistOptions,
                                    forceArchiveExistingFile: true,
                                    migrationId: options.migrationId,
                                  });
                                if (!archivedAsset?.ok || !archivedAsset.localPath)
                                  throw Error(archivedAsset?.error || `Project media archive failed`);
                                let archivedFileUrl = buildProjectMediaFileUrl(archivedAsset.localPath);
                                archivedFileUrl && (data[bindingKey] = archivedFileUrl);
                                try {
                                  binding.portableDataRef && (await localforageModule.default.removeItem(binding.portableDataRef));
                                } catch {}
                                bindings[bindingKey] = {
                                  ...binding,
                                  ...archivedAsset,
                                  field: bindingKey,
                                  portableDataRef: undefined,
                                  portableData: undefined,
                                  value: archivedFileUrl,
                                  sourceSignature: archivedFileUrl,
                                  valueFormat: archivedAsset.valueFormat || binding.valueFormat,
                                  missing: false,
                                };
                                continue;
                              } catch (error) {
                                console.warn(`Project media force archive skipped`, error);
                              }
                            }
                          }
                          if (strippedBinding !== binding) {
                            try {
                              binding.portableDataRef && (await localforageModule.default.removeItem(binding.portableDataRef));
                            } catch {}
                            let localFileUrl = buildProjectMediaFileUrl(strippedBinding.localPath);
                            localFileUrl && (data[bindingKey] = localFileUrl);
                            ((bindings[bindingKey] = {
                                ...strippedBinding,
                                field: bindingKey,
                                kind: kind,
                                missing: false,
                              }),
                              (binding = bindings[bindingKey]));
                            continue;
                          }
                          let
                            existingPortableValue = await getExistingProjectMediaPortableValue(binding);
                          if (existingPortableValue !== undefined && shouldReuseProjectMediaBinding(binding, fieldValue)) {
                            bindings[bindingKey] = {
                              ...binding,
                              field: bindingKey,
                              sourceSignature: binding.sourceSignature || buildProjectMediaSourceSignature(existingPortableValue),
                              valueFormat: binding.valueFormat ||
                                (typeof existingPortableValue == `string` && existingPortableValue.startsWith(`data:`) ?
                                  `data-url` :
                                  bindingKey === `text` || bindingKey === `resultData` ?
                                  `text` :
                                  binding.valueFormat),
                            };
                            continue;
                          }
                          if (
                            existingPortableValue !== undefined &&
                            typeof fieldValue == `string` &&
                            isProjectMediaExternalReference(fieldValue)
                          ) {
                            bindings[bindingKey] = {
                              ...binding,
                              field: bindingKey,
                              sourceSignature: binding.sourceSignature || buildProjectMediaSourceSignature(existingPortableValue),
                              valueFormat: binding.valueFormat ||
                                (typeof existingPortableValue == `string` && existingPortableValue.startsWith(`data:`) ?
                                  `data-url` :
                                  binding.valueFormat),
                            };
                            continue;
                          }
                          let payload = await getProjectMediaPayload(node, bindingKey, fieldValue);
                          if (!payload?.portableValue) continue;
                          let sourceSignature = buildProjectMediaSourceSignature(payload.portableValue),
                            storageKey =
                            binding.portableDataRef ||
                            buildProjectAssetStorageKey(projectId, node.id || `node`, `media-${bindingKey}-portable`);
                          try {
                            let persistedAsset = await window.wanjuanDesktop.persistProjectAsset({
                                ...payload.persistPayload,
                                projectId: projectId,
                                nodeId: node.id,
                                field: bindingKey,
                                kind: getProjectMediaBindingKind(bindingKey, node),
                                assetId: binding.assetId,
                                directory: persistOptions,
                                migrationId: options.migrationId,
                              }),
                              fileBacked = persistedAsset?.localPath &&
                                isProjectMediaFileBackedBinding(persistedAsset, bindingKey, kind);
                            if (!persistedAsset?.ok) throw Error(persistedAsset?.error || `Project media persist failed`);
                            if (fileBacked) {
                              try {
                                await localforageModule.default.removeItem(storageKey);
                              } catch {}
                              let localFileUrl = buildProjectMediaFileUrl(persistedAsset.localPath);
                              localFileUrl && (data[bindingKey] = localFileUrl);
                            } else {
                              await localforageModule.default.setItem(storageKey, payload.portableValue);
                            }
                            (bindings[bindingKey] = {
                                ...binding,
                                ...persistedAsset,
                                field: bindingKey,
                                portableDataRef: fileBacked ? undefined : storageKey,
                                sourceSignature: fileBacked ?
                                  buildProjectMediaFileUrl(persistedAsset.localPath) :
                                  sourceSignature,
                                valueFormat: fileBacked ? `file-url` : payload.valueFormat,
                                sourceOrigin: binding.sourceOrigin ||
                                  data.sourceOrigin ||
                                  data.mediaSourceOrigin ||
                                  (bindingKey === `text` || bindingKey === `resultData` ? `generated-text` : `media`),
                                originalName: binding.originalName || data.originalName || data.label || data.name || ``,
                                missing: false,
                              });
                          } catch (error) {
                            console.warn(`Project media persist skipped`, error);
                            try {
                              await localforageModule.default.setItem(storageKey, payload.portableValue);
                            } catch {}
                            bindings[bindingKey] = {
                              ...binding,
                              field: bindingKey,
                              portableDataRef: storageKey,
                              sourceSignature: sourceSignature,
                              valueFormat: payload.valueFormat,
                            };
                          }
                        }
                        options.forceRehomeExistingFiles &&
                          (data = await forceRehomeProjectDataFileReferences(data, {
                            projectId: projectId,
                            nodeId: node.id,
                            directory: persistOptions,
                            migrationId: options.migrationId,
                          }));
                        return {
                          ...node,
                          data: {
                            ...data,
                            projectAssetBindings: bindings
                          }
                        };
                      }),
                    );
                    return clonedState;
                  }),
  exposeProjectFileReferenceCollector =
                  (globalThis.collectProjectFileReferences = collectProjectFileReferences),
  projectMigrationLocks = (globalThis.__wanjuanProjectMigrationLocks ||= new Set()),
  activeProjectMigrations = (globalThis.__wanjuanActiveProjectMigrations ||= new Map()),
  getForcedArchiveMigrationStatus =
                  (globalThis.getForcedArchiveMigrationStatus = async (projectId) => {
                    let migrationId = activeProjectMigrations.get(projectId);
                    return migrationId ?
                      window.wanjuanDesktop?.getProjectMigration?.({
                        migrationId: migrationId
                      }) :
                      {
                        ok: false,
                        error: `MIGRATION_NOT_FOUND`
                      };
                  }),
  cancelForcedArchiveMigration =
                  (globalThis.cancelForcedArchiveMigration = async (projectId) => {
                    let migrationId = activeProjectMigrations.get(projectId);
                    return migrationId ?
                      window.wanjuanDesktop?.cancelProjectMigration?.({
                        migrationId: migrationId
                      }) :
                      {
                        ok: false,
                        error: `MIGRATION_NOT_FOUND`
                      };
                  }),
  runForcedArchiveMigration =
                  (globalThis.runForcedArchiveMigration = async (projectId, directory, options = {}) => {
                    if (!localforageModule.default || !window.wanjuanDesktop?.beginProjectMigration)
                      throw Error(`Migration API unavailable`);
                    if (options.currentProjectId === projectId)
                      throw Error(`CURRENT_PROJECT_MUST_BE_CLOSED`);
                    if (projectMigrationLocks.has(projectId))
                      throw Error(`PROJECT_MIGRATION_LOCKED`);
                    let storageKey = getProjectCanvasStorageKey(projectId),
                      originalState = await localforageModule.default.getItem(storageKey);
                    if (!originalState) throw Error(`PROJECT_STATE_NOT_FOUND`);
                    let originalReferences = [...collectProjectFileReferences(originalState)],
                      originalReferenceCheck = await window.wanjuanDesktop.checkProjectAssets(originalReferences),
                      requiredBytes = (originalReferenceCheck?.assets || []).reduce((sum, asset) => sum + Number(asset?.size || 0), JSON.stringify(originalState).length);
                    let begin = await window.wanjuanDesktop.beginProjectMigration({
                      projectId: projectId,
                      directory: directory,
                      total: Array.isArray(originalState.nodes) ? originalState.nodes.length : 0,
                      requiredBytes: requiredBytes,
                    });
                    if (!begin?.ok) throw Error(begin?.error || `Migration begin failed`);
                    let migrationId = begin.migrationId;
                    projectMigrationLocks.add(projectId);
                    activeProjectMigrations.set(projectId, migrationId);
                    let snapshot = await window.wanjuanDesktop.saveProjectMigrationSnapshot({
                      migrationId: migrationId,
                      projectId: projectId,
                      state: originalState,
                    });
                    if (!snapshot?.ok) throw Error(snapshot?.error || `Migration snapshot failed`);
                    try {
                      let migratedState = await globalThis.prepareProjectMediaStateForPersistence(
                        originalState,
                        projectId,
                        directory,
                        {
                          forceRehomeExistingFiles: true,
                          migrationId: migrationId,
                        },
                      );
                      let references = [...collectProjectFileReferences(migratedState)];
                      let check = await window.wanjuanDesktop.checkProjectAssets(references);
                      let missing = (check?.assets || []).filter((asset) => !asset.exists);
                      if (missing.length) throw Error(`MIGRATION_REFERENCE_MISSING:${missing.length}`);
                      await localforageModule.default.setItem(storageKey, migratedState);
                      let committed = await window.wanjuanDesktop.commitProjectMigration({
                        migrationId: migrationId,
                        references: references,
                        requireGlobalBlobs: true,
                      });
                      if (!committed?.ok) throw Error(committed?.error || `Migration commit failed`);
                      return {
                        ok: true,
                        migrationId: migrationId,
                        state: migratedState,
                        references: references,
                        session: committed.session,
                      };
                    } catch (error) {
                      await localforageModule.default.setItem(storageKey, originalState);
                      await window.wanjuanDesktop.rollbackProjectMigration({
                        migrationId: migrationId,
                        error: String(error?.message || error),
                      });
                      throw error;
                    } finally {
                      projectMigrationLocks.delete(projectId);
                      activeProjectMigrations.delete(projectId);
                    }
                  }),
  recoverInterruptedProjectMigrations =
                  (globalThis.recoverInterruptedProjectMigrations = async (directory = ``) => {
                    if (!localforageModule.default || !window.wanjuanDesktop?.listIncompleteMigrations) return [];
                    let result = await window.wanjuanDesktop.listIncompleteMigrations({
                        directory: directory
                      }),
                      recovered = [];
                    for (let session of result?.migrations || []) {
                      try {
                        let snapshot = await window.wanjuanDesktop.loadProjectMigrationSnapshot({
                          migrationId: session.id,
                          directory: directory,
                        });
                        if (!snapshot?.ok) throw Error(snapshot?.error || `Migration snapshot unavailable`);
                        await localforageModule.default.setItem(getProjectCanvasStorageKey(session.projectId), snapshot.state);
                        await window.wanjuanDesktop.rollbackProjectMigration({
                          migrationId: session.id,
                          directory: directory,
                          error: `Recovered after interrupted migration`,
                        });
                        recovered.push(session.projectId);
                      } catch (error) {
                        console.error(`Interrupted project migration recovery failed`, session.projectId, error);
                      }
                    }
                    return recovered;
                  }),
  scheduleInterruptedMigrationRecovery = setTimeout(() => {
                    globalThis.recoverInterruptedProjectMigrations?.(``).catch(console.error);
                  }, 1500),
  buildProjectLocalforagePayload = use_buildProjectLocalforagePayload({ extractProjectAssetRefs, getProjectCanvasStorageKey }).buildProjectLocalforagePayload,
  EXPORT_INLINE_MEDIA_FIELDS = new Set([
                    `imageUrl`,
                    `videoUrl`,
                    `audioUrl`,
                    `text`,
                    `resultData`,
                  ]),
  PROJECT_ASSET_MANIFEST_STORAGE_PREFIX = `external-asset-file:`,
  applyExternalAssetBundleToBackupPayload = use_applyExternalAssetBundleToBackupPayload({  projects }).applyExternalAssetBundleToBackupPayload,
  compactBackupPortableAssets = use_compactBackupPortableAssets({ PROJECT_ASSET_MANIFEST_STORAGE_PREFIX, projects }).compactBackupPortableAssets,
  sanitizeProjectNodeDataForExport = use_sanitizeProjectNodeDataForExport({ EXPORT_INLINE_MEDIA_FIELDS }).sanitizeProjectNodeDataForExport,
  sanitizeProjectCanvasStateForExport = use_sanitizeProjectCanvasStateForExport({ sanitizeProjectNodeDataForExport }).sanitizeProjectCanvasStateForExport,
  buildProjectLocalforageExportPayload = use_buildProjectLocalforageExportPayload({ externalizeProjectCanvasState, extractProjectAssetRefs, getProjectCanvasStorageKey, sanitizeProjectCanvasStateForExport, prepareProjectMediaStateForPersistence }).buildProjectLocalforageExportPayload,
  collectExternalUploadProjectAssetFiles = use_collectExternalUploadProjectAssetFiles({  projects }).collectExternalUploadProjectAssetFiles,
  normalizeResourceLocalforagePayload = use_normalizeResourceLocalforagePayload({ TRANSIT_RESOURCES_STORAGE_KEY }).normalizeResourceLocalforagePayload,
  readChromeStorageSnapshot = use_readChromeStorageSnapshot({}).readChromeStorageSnapshot,
  getBackupChromeStorageKeys = use_getBackupChromeStorageKeys({ AGENT_STORAGE_KEYS, PROJECT_STORAGE_KEYS, getDesktopProjectMirrorStorageKey, projects }).getBackupChromeStorageKeys,
  collectSelectedLocalforageBackup = use_collectSelectedLocalforageBackup({ extractProjectAssetRefs, getDesktopProjectMirrorStorageKey, getProjectCanvasStorageKey, projects, localforageModule }).collectSelectedLocalforageBackup,
  buildBackupModules = use_buildBackupModules({ BACKUP_MODULE_LABELS, apiConfigs, buildProjectLocalforageExportPayload, edges, getBackupSettingsSectionMap, getDesktopProjectMirrorStorageKey, getProjectCanvasStorageKey, setEdges, setMaxPollingDuration, splitChromeStorageModules, agentConversations, projectGroups, projects, seedanceVirtualPortraits, selectedAgentId, storedGlobalConfigs }).buildBackupModules,
  normalizeBackupModules = use_normalizeBackupModules({ AGENT_STORAGE_KEYS, BACKUP_MODULE_LABELS, TRANSIT_RESOURCES_STORAGE_KEY, buildProjectLocalforagePayload, getBackupSettingsSectionMap, normalizeResourceLocalforagePayload, splitChromeStorageModules, agentConversations, projectGroups, projects, selectedAgentId }).normalizeBackupModules,
  moduleHasBackupData = use_moduleHasBackupData({ TRANSIT_RESOURCES_STORAGE_KEY, projects }).moduleHasBackupData,
  getAvailableBackupModules = (backup) =>
                        Object.entries(normalizeBackupModules(backup)).reduce(
                          (acc, [moduleName, moduleData]) => (moduleHasBackupData(moduleName, moduleData) ? [...acc, moduleName] : acc),
                          [],
                        ),
  buildBackupPayload = use_buildBackupPayload({ buildBackupModules }).buildBackupPayload,
  restoreSelectedBackup = use_restoreSelectedBackup({ PROJECT_ASSET_MANIFEST_STORAGE_PREFIX, TRANSIT_RESOURCES_STORAGE_KEY, extractProjectAssetRefs, getAvailableBackupModules, getBackupSettingsSectionMap, getDesktopProjectMirrorStorageKey, getProjectCanvasStorageKey, normalizeBackupModules, normalizeResourceLocalforagePayload, agentConversations, projectGroups, projects, selectedAgentId, transitResources, localforageModule }).restoreSelectedBackup,
  openBackupExportDialog = async (moduleSelection) => {
                                try {
                                  let selectedModules = normalizeModuleSelection(moduleSelection, [`settings`, `projects`, `agents`]),
                                    storageSnapshot = await readChromeStorageSnapshot(getBackupChromeStorageKeys(selectedModules)),
                                    storageModules = splitChromeStorageModules(storageSnapshot),
                                    availableSettingsSections = getBackupSettingsSectionMap(storageModules.settings).availableSections,
                                    projectOptions = getProjectOptionList(storageModules.projects?.projects),
                                    agentOptions = getAgentOptionList(storageModules.agents?.agents),
                                    selectedSettingsSections = selectedModules.includes(`settings`) ? availableSettingsSections : [],
                                    selectedProjects = selectedModules.includes(`projects`) ? projectOptions : [],
                                    selectedAgents = selectedModules.includes(`agents`) ? agentOptions : [];
                                  if (!selectedSettingsSections.length && !selectedProjects.length && !selectedAgents.length) {
                                    await $t(selectedModules);
                                    return;
                                  }
                                  setBackupDialogTab(selectedModules.includes(`projects`) ? `projects` : selectedModules.includes(`agents`) ? `agents` : `settings`),
                                    setBackupDialogState({
                                      mode: `export`,
                                      title: `导出细分选择`,
                                      modules: selectedModules,
                                      settingsSections: [...selectedSettingsSections],
                                      availableSettingsSections: selectedSettingsSections,
                                      projectIds: selectedProjects.map((project) => project.id),
                                      availableProjects: selectedProjects,
                                      agentIds: selectedAgents.map((agent) => agent.id),
                                      availableAgents: selectedAgents,
                                    });
                                } catch (error) {
                                  (console.error(error), showToast2(`导出失败`));
                                }
                              },
  handleBackupImportFile = use_handleBackupImportFile({ applyExternalAssetBundleToBackupPayload, getAvailableBackupModules, getBackupSettingsSectionMap, normalizeBackupModules, setBackupDialogState, setBackupDialogTab, showToast2, projects }).handleBackupImportFile,
  confirmBackupDialog = async () => {
                                  if (!backupDialogState) return;
                                  try {
                                    if (backupDialogState.mode === `export`) {
                                      await $t(backupDialogState.modules, {
                                        settingsSections: backupDialogState.settingsSections,
                                        projectIds: backupDialogState.projectIds,
                                        agentIds: backupDialogState.agentIds,
                                      });
                                      setBackupDialogState(null);
                                      return;
                                    }
                                    let restoreResult = await restoreSelectedBackup(
                                      backupDialogState.payload,
                                      backupDialogState.modules, {
                                        settingsSections: backupDialogState.settingsSections,
                                        projectIds: backupDialogState.projectIds,
                                        agentIds: backupDialogState.agentIds,
                                      },
                                    );
                                    (setBackupDialogState(null),
                                      typeof window.dispatchEvent == `function` &&
                                      window.dispatchEvent(new CustomEvent(`wanjuan:backup-imported`, {
                                        detail: restoreResult
                                      })),
                                      console.log(`[backup-import-report]`, restoreResult.report || {}),
                                      showToast2(
                                        `导入成功：${restoreResult.modules.map((moduleKey) => BACKUP_MODULE_LABELS[moduleKey]).join(`、`)}${restoreResult.report ? `，${formatBackupRestoreReport(restoreResult.report)}` : ``}，正在刷新显示`,
                                      ),
                                      setTimeout(() => window.location.reload(), 400));
                                  } catch (error) {
                                    (console.error(error), showToast2(`导入失败`));
                                  }
                                };
  let $t = use_$t({ BACKUP_MODULE_LABELS, buildBackupPayload, collectExternalUploadProjectAssetFiles, collectSelectedLocalforageBackup, compactBackupPortableAssets, getBackupChromeStorageKeys, readChromeStorageSnapshot, showToast2, projects }).$t;
  return isLoading ?
    jsx(`div`, {
      className: `flex items-center justify-center h-screen`,
      children: `Loading...`,
    }) :
    isPluginEnv ?
    jsxs(`div`, {
      className: `flex h-screen bg-[#121212] flex-col font-sans text-gray-200`,
      children: [
        jsxs(`div`, {
	          className: `wanjuan-app-top-nav bg-[#1c1c1c] border-b border-[#333] flex shadow-md relative z-20 flex-shrink-0`,
          children: [
            jsxs(`button`, {
              onClick: () => setActiveView(`canvas`),
	              className: `wanjuan-app-nav-tab relative flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 ${activeView === `canvas` ? `wanjuan-app-nav-tab-active` : `wanjuan-app-nav-tab-idle`}`,
              children: jsxs(`span`, {
                className: `wanjuan-app-nav-click-zone`,
                children: [jsx(`span`, {
                  className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-canvas`,
                  children: `🎨`,
                }), jsx(`span`, {
                  children: wanjuanT(`灵境画布`),
                })],
              }),
            }),
            jsxs(`button`, {
              onClick: () => setActiveView(`transit`),
	              className: `wanjuan-app-nav-tab relative flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 ${activeView === `transit` ? `wanjuan-app-nav-tab-active` : `wanjuan-app-nav-tab-idle`}`,
              children: jsxs(`span`, {
                className: `wanjuan-app-nav-click-zone`,
                children: [jsx(`span`, {
                  className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-resources`,
                  children: `🗂️`,
                }), jsx(`span`, {
                  children: wanjuanT(`资源`),
                })],
              }),
            }),
            jsxs(`button`, {
              onClick: () => setActiveView(`agents`),
	              className: `wanjuan-app-nav-tab relative flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 ${activeView === `agents` ? `wanjuan-app-nav-tab-active` : `wanjuan-app-nav-tab-idle`}`,
              children: jsxs(`span`, {
                className: `wanjuan-app-nav-click-zone`,
                children: [jsx(`span`, {
                  className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-agents`,
                  children: `💡`,
                }), jsx(`span`, {
                  children: wanjuanT(`智能体`),
                })],
              }),
            }),
            jsxs(`button`, {
              onClick: () => {
                window.dispatchEvent(new CustomEvent(`wanjuan:workspace-open`));
              },
	              className: `wanjuan-workspace-nav-tab wanjuan-app-nav-tab relative flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 wanjuan-app-nav-tab-idle`,
              children: jsxs(`span`, {
                className: `wanjuan-app-nav-click-zone`,
                children: [jsx(`span`, {
                  className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-workspace`,
                  children: `🗃️`,
                }), jsx(`span`, {
                  children: `工作空间`,
                })],
              }),
            }),
            jsxs(`button`, {
              onClick: handleSettingsNavClick,
	              className: `wanjuan-app-nav-tab relative flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 ${activeView === `settings` ? `wanjuan-app-nav-tab-active` : `wanjuan-app-nav-tab-idle`}`,
              children: [
                jsxs(`span`, {
                  className: `wanjuan-app-nav-click-zone`,
                  children: [jsx(`span`, {
                    className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-settings`,
                    children: `⚙️`,
                  }), jsx(`span`, {
                    children: wanjuanT(`设置`),
                  })],
                }),
                jsx(`span`, {
                  className: `absolute bottom-1 right-2 text-[8px] text-gray-600 font-normal`,
                  children: `v${globalThis.chrome?.runtime?.getManifest?.()?.version || `1.4.2`}`,
                }),
              ],
            }),
          ],
        }),
        jsxs(`div`, {
          className: `flex-1 relative overflow-hidden bg-[#121212]`,
          // overflow:clip 替代 hidden：clip 不创建滚动容器，scrollTop 恒为 0。
          // 修复任务清单展开(absolute top-full 抽屉向下溢出 17px)后反复缩放/拖动画布时，
          // 该容器被浏览器自动滚动 → 工具栏(画布压力表行)被推进顶部导航栏下方的错位 bug。
          style: { overflow: `clip` },
          children: [
            jsx(WanJuanSettingsSectionC, { Copy, Download, FolderOpen, Maximize2, Star, Trash, activeView, chrome, copyResource, currentPage, filteredTransitResources, handleCleanInvalidResources, handleClearUnfavorited, handleRemoveTransitResource, isPluginEnv, resourceCleanupBusy, resourceFavoriteOnly, resourceSourceFilter, resourceTypeFilter, setCurrentPage, setResourceFavoriteOnly, setResourceSourceFilter, setResourceTypeFilter, setTransitGridCols, setWjResourceFullscreen, showToast2, toggleFavorite, transitGridCols, transitResourcePageSize, transitResourceTotalPages, transitResources, wanjuanUseBrokenResourceImage }),
            jsx(WanJuanSettingsSectionD, { $e, Trash2, VtRenameProject, WanJuanCanvasShell, activeProjectId, activeView, addCustomNodeTemplate, addTransitResource, apiConfigs, arkTrustedAssetConfig, setArkTrustedAssetConfig, audioApiKey, audioApiUrl, audioModelApiBindings, audioModelProtocolBindings, audioModels, configButlerErrorAssistant, configButlerErrorAssistantMinimized, customPublicUploadConfig, deleteCustomNodeTemplate, edges, getUnreadSystemNotifications, globalTasks, handleDeleteProject, imageApiKey, imageApiUrl, imageCompatResolutions, imageModelApiBindings, imageModelProtocolBindings, imageModels, isOpen, layeredRunConcurrencyOptions, layeredRunMaxConcurrency, maxPollingDuration, modelProtocolRegistry, newProjectIds, openSystemNotificationPanel, pollingInterval, presetPrompts, projectGroupIds, projectGroupPanelOpen, projectGroupedSectionsAll, projectMenuOpen, projectStorageLabel, projectUngroupedAll, projects, qiniuConfig, renameProjectId, runManualConfigButlerErrorQuery, runStorageMigrationForProject, seedanceDurations, seedanceEnableWebSearch, seedanceGenerateAudio, seedanceModel, seedanceRatios, seedanceResolutions, seedanceUploadMode, seedanceVirtualPortraits, seedanceWatermark, sendToPlugin, setActiveProjectId, setIsOpen, setNewProjectGroupId, setNewProjectIds, setProjectGroupPanelOpen, setProjectMenuOpen, settingsNotificationChecking, showToast2, textApiKey, textApiUrl, textModelApiBindings, textModelProtocolBindings, textModels, tianjiSeedanceModel, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangTextModels, tosConfig, transitResources, ttsMusicModel, updateGlobalTasks, videoApiKey, videoApiUrl, videoAspectRatios, videoDurations, videoModelApiBindings, videoModelProtocolBindings, videoModelRequestProfilesText, videoModels, videoResolutions, applyConfigButlerErrorAssistantFix, ConfirmRenameProject, applyConfigButlerManualProtocolFix, canManualRecoverImageTask, canManuallyRefreshGlobalTask, configButlerManualProblemPart, configButlerManualProtocolName, configButlerManualProtocolOpen, configButlerManualProtocolText, configButlerRepairHistory, configButlerRepairHistoryOpen, configErrorAssistantTheme, confirmProjectGroupRename, createProjectGroup, deleteProjectGroup, editingProjectGroupId, editingProjectGroupName, groupedProjectSections, handleCreateProject, handleManualRecoverImageTask, moveProjectToGroup, newProjectGroupId, newProjectName, openConfigButlerManualProblemFields, persistProjectGroups, projectGroupDraft, projectGroupList, projectGroupSearch, refreshGlobalTask, renameProjectGroup, renameProjectName, rollbackConfigButlerRepair, setConfigButlerErrorAssistant, setConfigButlerErrorAssistantMinimized, setConfigButlerManualProblemPart, setConfigButlerManualProtocolName, setConfigButlerManualProtocolOpen, setConfigButlerManualProtocolText, setConfigButlerRepairHistoryOpen, setEditingProjectGroupId, setEditingProjectGroupName, setNewProjectName, setProjectGroupDraft, setProjectGroupSearch, setRenameProjectId, setRenameProjectName, ungroupedProjectList }),
            jsx(WanJuanSettingsSectionA, { Trash2, activeView, addAgentReferenceFile, agentAttachmentInputRef, agentAttachments, agentComposer, agentConfigOpen, agentConversations, agentMessagesScrollRef, agentSearch, agentTheme, clearSelectedAgentConversation, createAgent, deleteSelectedAgent, duplicateSelectedAgent, filteredAgentItems, handleAgentReferenceSelection, isLightAgentTheme, renderAgentAttachmentPill, selectedAgent, selectedAgentId, selectedAgentMessages, sendAgentMessage, setAgentAttachments, setAgentComposer, setAgentConfigOpen, setAgentSearch, setSelectedAgentId, showToast2, agentModelOptions, apiConfigs, importAgentKnowledgeFile, removeAgentKnowledgeFile, textApiConfigId, textModelApiBindings, updateSelectedAgent }),
            jsx(WanJuanSettingsSectionB, { activeSettingsTab, arkTrustedAssetConfig, activeStoredGlobalConfigId, activeView, allAdvancedModelSettingsExpanded, audioModelSettingsExpanded, configButlerBatchModalOpen, configButlerExpanded, globalConfigPresetsExpanded, imageModelSettingsExpanded, seedanceSettingsExpanded, setActiveSettingsTab, setAllAdvancedModelSettings, setAudioModelSettingsExpanded, setConfigButlerExpanded, setGlobalConfigPresetsExpanded, setImageModelSettingsExpanded, setSeedanceSettingsExpanded, setTextModelSettingsExpanded, setTtsMusicSettingsExpanded, setVideoModelSettingsExpanded, storedGlobalConfigs, textModelSettingsExpanded, tianjiSeedanceSettingsMode, ttsMusicSettingsExpanded, updateInfo, videoModelSettingsExpanded, $e, BACKUP_MODULE_LABELS, _e, apiConfigs, appLanguage, applyConfigButlerBatchResults, applyConfigButlerResult, applyLitterboxUploadPreset, applyPerformanceProfile, applyStoredGlobalConfig, applyTianjiSeedanceSettingsMode, audioModelApiBindings, audioModels, autoDownloadGeneratedResults, backupExportSelection, cleanStorageOptimization, configButlerAgentExpanded, configButlerApiKey, configButlerApiUrl, configButlerBatchActiveCategory, configButlerBatchItems, configButlerBatchLoading, configButlerDocUrl, configButlerLoading, configButlerMode, configButlerModel, configButlerProtocol, configButlerResultText, configButlerTargetApiConfigId, configButlerTargetCategory, configButlerTargetModel, currentLimits, customPublicUploadConfig, customUploadConfigExpanded, dailyUsageCount, deviceId, downloadDirectory, editSeedancePortrait, enableStorageOptimization, expanded, extensionToolInstalling, extensionToolStatus, handleAddPreset, handleBackupImportFile, handleRemovePreset, handleSeedancePortraitFile, handleServerVerify, imageCompatResolutions, imageModelApiBindings, imageModels, importExtensionToolPack, installExtensionTool, layeredRunConcurrencyOptions, layeredRunMaxConcurrency, manageStorageOptimizationTrash, maxPollingDuration, membershipCode, openBackupExportDialog, performanceProfile, pollingInterval, presetPrompts, projects, purgeStorageOptimizationTrash, qiniuConfig, qiniuJsonImportOpen, qiniuJsonImportText, qiniuUploadConfigExpanded, refreshExtensionToolStatus, refreshStorageOptimizationStatus, removeSeedancePortrait, resetJixinDefaultConfiguration, resetSeedancePortraitForm, restoreStorageOptimizationTrash, runConfigButler, runConfigButlerBatch, runNextStorageMigration, saveSeedancePortraitForm, saveStoredGlobalConfigApiDocUrl, scanStorageOptimization, seedanceDurations, seedanceEnableWebSearch, seedanceGenerateAudio, seedanceModel, seedancePortraitEditingId, seedancePortraitFileInputRef, seedancePortraitForm, seedancePortraitLibraryExpanded, seedanceRatios, seedanceResolutions, seedanceUploadMode, seedanceVirtualPortraits, seedanceWatermark, setActiveStoredGlobalConfigId, setApiConfigs, setArkTrustedAssetConfig, setAppLanguage, setAudioModelApiBindings, setAudioModels, setAutoDownloadGeneratedResults, setBackupExportSelection, setConfigButlerAgentExpanded, setConfigButlerApiKey, setConfigButlerApiUrl, setConfigButlerBatchActiveCategory, setConfigButlerBatchItems, setConfigButlerBatchModalOpen, setConfigButlerDocUrl, setConfigButlerMode, setConfigButlerModel, setConfigButlerProtocol, setConfigButlerResultText, setConfigButlerTargetApiConfigId, setConfigButlerTargetCategory, setConfigButlerTargetModel, setCustomPublicUploadConfig, setCustomUploadConfigExpanded, setDownloadDirectory, setExpanded, setImageCompatResolutions, setImageModelApiBindings, setImageModels, setLayeredRunConcurrencyOptions, setLayeredRunMaxConcurrency, setMaxPollingDuration, setMembershipCode, setPollingInterval, setQiniuConfig, setQiniuJsonImportOpen, setQiniuJsonImportText, setQiniuUploadConfigExpanded, setSeedanceDurations, setSeedanceEnableWebSearch, setSeedanceGenerateAudio, setSeedanceModel, setSeedancePortraitForm, setSeedancePortraitLibraryExpanded, setSeedanceRatios, setSeedanceResolutions, setSeedanceUploadMode, setSeedanceWatermark, setShowQiniuSecretKey, setShowTosSecretKey, setStorageOptimizationLastResult, setStorageOptimizationPaused, setStoredGlobalConfigs, setTextModelApiBindings, setThemeMode, setTianjiSeedanceModel, setTongyiWanxiangDurations, setTongyiWanxiangEditModels, setTongyiWanxiangImageModels, setTongyiWanxiangRatios, setTongyiWanxiangReferenceImageModels, setTongyiWanxiangResolutions, setTongyiWanxiangSettingsExpanded, setTongyiWanxiangTextModels, setTosConfig, setTosUploadConfigExpanded, setTtsMusicModel, setVideoAspectRatios, setVideoDurations, setVideoModelApiBindings, setVideoModels, setVideoResolutions, showQiniuSecretKey, showStorageOptimizationDetails, showToast2, showTosSecretKey, storageOptimizationBusy, storageOptimizationEnabled, storageOptimizationLastResult, storageOptimizationPaused, storageOptimizationStatus, textModelApiBindings, textModels, themeMode, tianjiSeedanceModel, tongyiWanxiangDurations, tongyiWanxiangEditModels, tongyiWanxiangImageModels, tongyiWanxiangRatios, tongyiWanxiangReferenceImageModels, tongyiWanxiangResolutions, tongyiWanxiangSettingsExpanded, tongyiWanxiangTextModels, tosConfig, tosUploadConfigExpanded, ttsMusicModel, updatePresetField, users, videoAspectRatios, videoDurations, videoModelApiBindings, videoModels, videoResolutions }),
          ],
        }),
        backupDialogState &&
        jsx(WanJuanBackupDialog, {
  BACKUP_MODULE_LABELS,
  BACKUP_SETTINGS_SECTION_LABELS,
  agentTheme,
  backupDialogState,
  backupDialogTab,
  backupDialogTheme,
  confirmBackupDialog,
  setBackupDialogState,
  setBackupDialogTab,
}),
        wjResourceFullscreen &&
        (wjResourceFullscreen.type?.startsWith(`video`) ?
          jsxs(`div`, {
            className: `fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4`,
            style: {
              position: `fixed`,
              inset: 0,
              zIndex: 2147483647,
              display: `flex`,
              alignItems: `center`,
              justifyContent: `center`,
              padding: `16px`,
              background: `rgba(0,0,0,0.94)`,
              pointerEvents: `auto`,
              WebkitAppRegion: `no-drag`,
            },
            onClick: (event) => {
              event.target === event.currentTarget && setWjResourceFullscreen(null);
            },
            children: [
              jsx(`button`, {
                type: `button`,
                onPointerDown: (event) => event.stopPropagation(),
                onClick: (event) => {
                  (event.stopPropagation(), setWjResourceFullscreen(null));
                },
                className: `absolute right-5 top-5 h-10 w-10 rounded-full border border-white/15 bg-white/10 text-2xl leading-none text-white hover:bg-white/20 transition-colors flex items-center justify-center`,
                style: {
                  position: `fixed`,
                  top: `18px`,
                  right: `18px`,
                  width: `48px`,
                  height: `48px`,
                  borderRadius: `9999px`,
                  border: `1px solid rgba(255,255,255,0.14)`,
                  background: `rgba(17,24,39,0.72)`,
                  color: `#fff`,
                  display: `inline-flex`,
                  alignItems: `center`,
                  justifyContent: `center`,
                  padding: 0,
                  cursor: `pointer`,
                  zIndex: 2147483647,
                  pointerEvents: `auto`,
                  WebkitAppRegion: `no-drag`,
                  boxShadow: `0 10px 30px rgba(0,0,0,0.35)`,
                  fontSize: `28px`,
                  lineHeight: `1`,
                },
                title: `关闭`,
                children: `×`,
              }),
              jsx(`video`, {
                src: wjResourceFullscreen.url,
                controls: true,
                autoPlay: true,
                className: `max-w-[96vw] max-h-[92vh] object-contain rounded-lg shadow-2xl`,
                style: {
                  maxWidth: `96vw`,
                  maxHeight: `92vh`,
                  objectFit: `contain`,
                  borderRadius: `10px`,
                  boxShadow: `0 24px 80px rgba(0,0,0,0.55)`,
                },
                onClick: (event) => event.stopPropagation(),
              }),
            ],
          }) :
          jsx(WjImageZoomModal, {
            imageUrl: wjResourceFullscreen.url || wjResourceFullscreen.thumbnailUrl,
            onClose: () => setWjResourceFullscreen(null),
          })),
        systemNotificationPanelOpen &&
        jsx(WanJuanSystemNotificationPanel, {
  getVisibleSystemNotifications,
  markSystemNotificationRead,
  notificationLevelLabel,
  openSystemNotificationLink,
  refreshSystemNotifications,
  setSystemNotificationPanelOpen,
  settingsNotificationChecking,
  systemNotificationError,
}),
        systemNotificationDialog &&
        jsx(WanJuanSystemNotificationDialog, {
  dismissSystemNotificationDialog,
  notificationLevelLabel,
  openSystemNotificationLink,
  systemNotificationDialog,
}),
        showToast &&
        jsx(`div`, {
          className: `absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm z-50 animate-fade-in pointer-events-none wanjuan-toast`,
          children: toastMessage,
        }),
        jsx(WanJuanAccountGate, {}),
      ],
    }) :
    jsx(`div`, {
      className: `min-h-screen bg-[#121212] flex items-center justify-center p-4 font-sans text-gray-200`,
      children: jsxs(`div`, {
        className: `bg-[#1c1c1c] p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-[#333]`,
        children: [
          jsx(`h1`, {
            className: `text-xl font-bold text-red-500 mb-4`,
            children: `⚠️ 非插件环境`,
          }),
          jsx(`p`, {
            className: `text-gray-400 mb-6`,
            children: `请在 Chrome 扩展程序中加载此项目。`,
          }),
          jsx(`button`, {
            onClick: () => {
              (setIsPluginEnv(true), setIsLoading(false));
            },
            className: `text-blue-500 hover:text-blue-400 underline`,
            children: `开发模式：模拟进入`,
          }),
        ],
      }),
    });
}

var originalConsoleError = console.error;
((console.error = (...args) => {
    (typeof args[0] == `string` && args[0].includes(`ResizeObserver loop`)) ||
    originalConsoleError.call(console, ...args);
  }),
  window.addEventListener(`error`, (event) => {
    (event.message.includes(`ResizeObserver loop limit exceeded`) ||
      event.message.includes(
        `ResizeObserver loop completed with undelivered notifications`,
      )) &&
    (event.stopImmediatePropagation(), event.preventDefault());
  }),
  createRoot(document.getElementById(`root`)).render(
    jsx(StrictMode, {
      children: jsx(WanJuanAppRoot, {})
    }),
  ));
