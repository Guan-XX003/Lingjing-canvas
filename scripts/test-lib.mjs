// 工具库行为回归测试：编译 src/renderer/lib 后，对若干纯逻辑函数跑用例，
// 验证反混淆后的实现与预期行为一致。
//
// 运行：npm run test:lib
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(join(tmpdir(), "wj-lib-"));

function compile() {
  execFileSync(
    "npx",
    [
      "tsc",
      "--skipLibCheck",
      "--module", "commonjs",
      "--target", "es2022",
      "--moduleResolution", "node",
      "--esModuleInterop",
      "--jsx", "react-jsx",
      "--outDir", outDir,
      join(root, "src/renderer/lib/resource.ts"),
      join(root, "src/renderer/lib/reference-media.ts"),
      join(root, "src/renderer/lib/project-asset-binding.ts"),
      join(root, "src/renderer/lib/node-runtime-contract.ts"),
      join(root, "src/renderer/lib/video-aspect-ratio.ts"),
      join(root, "src/renderer/lib/video-task.ts"),
      join(root, "src/renderer/lib/video-parameter-mode.ts"),
      join(root, "src/renderer/lib/global-tasks.ts"),
      join(root, "src/renderer/lib/global-config.ts"),
      join(root, "src/renderer/lib/model-selection.ts"),
      join(root, "src/renderer/lib/config-butler.ts"),
      join(root, "src/renderer/lib/jixin-catalog.ts"),
      join(root, "src/renderer/lib/tianji-api.ts"),
      join(root, "src/renderer/lib/tianji-assets.ts"),
      join(root, "src/renderer/lib/tianji-portrait.ts"),
      join(root, "src/renderer/lib/ark-trusted-assets.ts"),
      join(root, "src/renderer/lib/automation-result.ts"),
      join(root, "src/renderer/lib/suno-music-api.ts"),
    ],
    { cwd: root, stdio: "inherit" }
  );
}

let pass = 0;
let fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
  } else {
    fail++;
    console.error(`  ✗ ${name}: got ${a}, expected ${e}`);
  }
}

async function run() {
  console.log("编译工具库...");
  compile();

  const { wanjuanApplyPersistedTransitResource, wanjuanBuildGeneratedVideoResourcesFromNodes, wanjuanResourceKind, wanjuanResourceSourceKind, wanjuanTransitResourceNeedsPersistence } = await import(pathToFileURL(join(outDir, "resource.js")).href);
  const { wanjuanCollectNodeReferenceMedia, wanjuanIsPublicHttpMediaUrl } = await import(pathToFileURL(join(outDir, "reference-media.js")).href);
  const { normalizeVideoAspectRatioValue, normalizeVideoSizeValue } = await import(pathToFileURL(join(outDir, "video-aspect-ratio.js")).href);
  const { applyRunScopedStateUpdate, compactGlobalTasks, failGlobalTaskRefresh, indexGlobalTasks, supersedeActiveNodeTasks, updateTaskRunningProgress } = await import(pathToFileURL(join(outDir, "global-tasks.js")).href);
  const { collectTaskCredentialConfigs, isCurrentSettingsSave, mergeGlobalConfigApiConfigs, replaceGlobalConfigApiConfigs, resolveTaskApiCredential, resolveTaskPollUrl } = await import(pathToFileURL(join(outDir, "global-config.js")).href);
  const { WanJuanShouldAutoPreferredModel } = await import(pathToFileURL(join(outDir, "model-selection.js")).href);
  const videoTask = await import(pathToFileURL(join(outDir, "video-task.js")).href);
  const videoParameterMode = await import(pathToFileURL(join(outDir, "video-parameter-mode.js")).href);
  const nodeRuntime = await import(pathToFileURL(join(outDir, "node-runtime-contract.js")).href);
  const configButler = await import(pathToFileURL(join(outDir, "config-butler.js")).href);
  const { WANJUAN_JIXIN_BUILTIN_GLOBAL_CONFIG_ID, WANJUAN_JIXIN_BUILTIN_UNIFIED_VIDEO_MODELS, WANJUAN_JIXIN_BUILTIN_PROTOCOLS, WANJUAN_JIXIN_BUILTIN_VIDEO_PROTOCOL_BINDINGS, WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID, wanjuanMergeJixinVideoProtocolDefaults, wanjuanSyncJixinBuiltinStoredGlobalConfig } = await import(pathToFileURL(join(outDir, "jixin-catalog.js")).href);
  const {
    WANJUAN_TIANJI_DEFAULT_BASE_URL,
    WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
    WANJUAN_TIANJI_SYNC_SOURCE_MANUAL,
    wanjuanBuildSyncedTianjiConfigFromJixin,
    wanjuanMarkTianjiConfigManual,
    wanjuanNormalizeTianjiSeedanceConfig,
    wanjuanNormalizeTianjiGenerationMode,
    wanjuanBuildTianjiGenerationRequest,
    wanjuanBuildTianjiTaskQuery,
    wanjuanTianjiBalancePoints,
    wanjuanTianjiAuthHeaders,
    wanjuanTianjiDefaultPortraitGroupName,
    WANJUAN_TIANJI_PORTRAIT_ENDPOINTS,
    wanjuanTianjiFindPortraitTaskId,
    wanjuanBuildTianjiPortraitTaskParams,
    wanjuanTianjiRequest,
    wanjuanValidateTianjiReferenceMedia,
    wanjuanTianjiFindTaskId,
    wanjuanTianjiFindVideoUrl,
    wanjuanTianjiFindThumbUrl,
    wanjuanTianjiStatus,
    wanjuanTianjiFindProgress,
    wanjuanTianjiErrorMessage
  } = await import(pathToFileURL(join(outDir, "tianji-api.js")).href);
  const { wanjuanTianjiAssetListParams, wanjuanTianjiPortraitAssetIdFromItem, wanjuanTianjiPortraitDeleteDescriptor } = await import(pathToFileURL(join(outDir, "tianji-assets.js")).href);
  const { wanjuanResetTianjiPortraitBindingForImage } = await import(pathToFileURL(join(outDir, "tianji-portrait.js")).href);
  const arkTrustedAssets = await import(pathToFileURL(join(outDir, "ark-trusted-assets.js")).href);
  const automationResult = await import(pathToFileURL(join(outDir, "automation-result.js")).href);

  console.log("运行用例...");
  const nativePanelSource = readFileSync(join(root, "src/renderer/components/tianji-settings-native.tsx"), "utf8");
  const preloadPanelSource = readFileSync(join(root, "electron/preload/desktop-patches.cjs"), "utf8");
  const cloudWorkspaceSource = readFileSync(join(root, "electron/preload/cloud-prompt-workspace.cjs"), "utf8");
  const accountGateSource = readFileSync(join(root, "src/renderer/components/account-gate.tsx"), "utf8");
  const bootThemeSource = readFileSync(join(root, "electron/preload/boot-theme.cjs"), "utf8");
  const appBundleSource = readFileSync(join(root, "src/renderer/bundle/index.js"), "utf8");
  check("tianji panel exposes portrait group name", nativePanelSource.includes("素材组名称"), true);
  check("tianji virtual group sends generated name", nativePanelSource.includes("params: { name: groupName }"), true);
  check("tianji panel blocks task query without task credentials", nativePanelSource.includes("!bytedToken.trim() && !portraitTaskId.trim()"), true);
  check("tianji preload persists portrait task id", preloadPanelSource.includes("tianjiSeedancePortraitTaskId"), true);
  check("cloud workspace label uses workspace name, not account id", cloudWorkspaceSource.includes("workspace.name || t(\"未命名空间\")"), true);
  check("cloud workspace label exposes full text accessibly", cloudWorkspaceSource.includes("title=\"${escape(selectedWorkspaceLabel)}\" aria-label=\"${escape(selectedWorkspaceLabel)}\""), true);
  check("cloud workspace select allows shrinking", preloadPanelSource.includes(".wanjuan-cloud-workspace-select{display:block;width:100%;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"), true);
  check("cloud workspace card clips long labels", preloadPanelSource.includes(".wanjuan-cloud-workspace-block{display:grid;gap:8px;min-width:0;max-width:100%"), true);
  check("fresh account gate does not cover app while loading", accountGateSource.includes("if (account.loading) return null;"), true);
  check("fresh account gate only opens after explicit auth request", accountGateSource.includes("if (!account.authOpen) return null;"), true);
  check("boot splash has a minimum visible duration", bootThemeSource.includes("if (elapsed < 720)"), true);
  check("boot splash timeout offers recovery", bootThemeSource.includes("wanjuan-boot-retry"), true);
  check("settings defaults to account tab", appBundleSource.includes("[activeSettingsTab, setActiveSettingsTab] = useState(`account`)") , true);
  check("opening settings resets only the new session default", appBundleSource.includes("setActiveSettingsTab(`account`);\n\t      setActiveView(`settings`);"), true);
  check("automation extracts direct custom image data", automationResult.wanjuanExtractAutomationMedia("https://cdn.example.com/result.png", "image"), "https://cdn.example.com/result.png");
  check("automation extracts nested JSON image URL", automationResult.wanjuanExtractAutomationMedia(JSON.stringify({ output: { images: [{ image_url: "https://cdn.example.com/nested.png" }] } }), "image"), "https://cdn.example.com/nested.png");
  check("automation recognizes video blob for persistence", automationResult.wanjuanExtractAutomationMedia({ result: { videoUrl: "blob:http://127.0.0.1/test" } }, "video"), "blob:http://127.0.0.1/test");
  check("automation does not expose arbitrary custom text", automationResult.wanjuanExtractAutomationMedia("API key: secret", "image"), "");
  check("automation builds encoded file URL", automationResult.wanjuanAutomationFileUrl("/Users/test/万卷 result.png"), "file:///Users/test/%E4%B8%87%E5%8D%B7%20result.png");
  check("automation builds Windows file URL", automationResult.wanjuanAutomationFileUrl("C:\\WanJuan\\result video.mp4"), "file:///C:/WanJuan/result%20video.mp4");
  check(
    "tianji image binding survives same result",
    wanjuanResetTianjiPortraitBindingForImage({ imageUrl: "https://cdn/a.png", tianjiPortraitAssetId: "asset-a", tianjiPortraitBindingStatus: "ready" }, "https://cdn/a.png"),
    { imageUrl: "https://cdn/a.png", tianjiPortraitAssetId: "asset-a", tianjiPortraitBindingStatus: "ready" }
  );
  check(
    "tianji image binding clears for new result",
    wanjuanResetTianjiPortraitBindingForImage({ imageUrl: "https://cdn/a.png", tianjiPortraitAssetId: "asset-a", tianjiPortraitBindingStatus: "ready", tianjiPortraitBindingMessage: "bound", isTianjiPortrait: true, sourceOrigin: "tianji-portrait" }, "https://cdn/b.png"),
    { imageUrl: "https://cdn/a.png", tianjiPortraitAssetId: undefined, tianjiPortraitGroupType: undefined, tianjiPortraitPreviewUrl: undefined, tianjiPortraitBindingLookupUrl: undefined, tianjiPortraitBindingName: undefined, tianjiPortraitBindingSourceUrl: undefined, tianjiPortraitBindingStatus: undefined, tianjiPortraitBindingMessage: undefined, tianjiPortraitReviewedAt: undefined, tianjiPortraitBoundAt: undefined, isTianjiPortrait: false, sourceOrigin: "generated" }
  );
  check(
    "ark binding survives the same image",
    arkTrustedAssets.wanjuanResetArkTrustedAssetBindingForImage({ imageUrl: "https://cdn/a.png", arkTrustedAssetId: "ark-a", arkTrustedAssetSourceUrl: "https://cdn/a.png", arkTrustedAssetStatus: "ready" }, "https://cdn/a.png"),
    { imageUrl: "https://cdn/a.png", arkTrustedAssetId: "ark-a", arkTrustedAssetSourceUrl: "https://cdn/a.png", arkTrustedAssetStatus: "ready" }
  );
  check(
    "ark binding clears when the image changes",
    arkTrustedAssets.wanjuanResetArkTrustedAssetBindingForImage({ imageUrl: "https://cdn/a.png", arkTrustedAssetId: "ark-a", arkTrustedAssetGroupId: "group-a", arkTrustedAssetContentHash: "hash-a", arkTrustedAssetSourceUrl: "https://cdn/a.png", arkTrustedAssetStatus: "ready", arkTrustedAssetMessage: "ready", arkTrustedAssetReviewedAt: 1 }, "https://cdn/b.png"),
    { imageUrl: "https://cdn/a.png", arkTrustedAssetId: undefined, arkTrustedAssetGroupId: undefined, arkTrustedAssetContentHash: undefined, arkTrustedAssetSourceUrl: undefined, arkTrustedAssetStatus: undefined, arkTrustedAssetMessage: undefined, arkTrustedAssetReviewedAt: undefined }
  );
  check(
    "ark ready binding resolves without changing the generation API",
    await arkTrustedAssets.wanjuanResolveArkTrustedAssetReference({
      config: { enabled: true, reviewMode: "auto" },
      entry: { url: "https://cdn/a.png", arkTrustedAssetId: "ark-a", arkTrustedAssetSourceUrl: "https://cdn/a.png", arkTrustedAssetStatus: "ready", tianjiPortraitAssetId: "tianji-stays" },
      reviewAsset: () => { throw new Error("should not review"); }
    }),
    { url: "asset://ark-a", assetId: "ark-a", groupId: "", reviewed: false, cached: true }
  );
  let arkAutoReviewCalls = 0;
  check(
    "ark auto mode reviews and returns asset URL",
    await arkTrustedAssets.wanjuanResolveArkTrustedAssetReference({
      config: { enabled: true, reviewMode: "auto" },
      entry: { url: "file:///tmp/a.png", nodeId: "image-1" },
      reviewAsset: async () => { arkAutoReviewCalls++; return { ok: true, assetId: "ark-new", groupId: "group-a" }; }
    }),
    { ok: true, assetId: "ark-new", groupId: "group-a", url: "asset://ark-new", reviewed: true }
  );
  check("ark auto review runs once", arkAutoReviewCalls, 1);
  check(
    "ark manual mode leaves unreviewed reference unchanged",
    await arkTrustedAssets.wanjuanResolveArkTrustedAssetReference({
      config: { enabled: true, reviewMode: "manual" },
      entry: { url: "https://cdn/a.png", tianjiPortraitAssetId: "tianji-stays" },
      reviewAsset: () => { throw new Error("should not review"); }
    }),
    { url: "https://cdn/a.png", reviewed: false }
  );
  check(
    "ark reviewed reference remains usable with a relay generation configuration",
    await arkTrustedAssets.wanjuanResolveArkTrustedAssetReference({
      config: { enabled: true, reviewMode: "manual" },
      entry: { url: "https://cdn/a.png", arkTrustedAssetId: "ark-relay", arkTrustedAssetSourceUrl: "https://cdn/a.png", arkTrustedAssetStatus: "ready" },
      reviewAsset: () => { throw new Error("should not review"); }
    }),
    { url: "asset://ark-relay", assetId: "ark-relay", groupId: "", reviewed: false, cached: true }
  );
  check(
    "resource backfill prefers an existing local video binding over an expiring remote URL",
    (() => {
      const resource = wanjuanBuildGeneratedVideoResourcesFromNodes([
        {
          id: "video-node-local",
          type: "videoNode",
          data: {
            label: "已生成视频",
            videoUrl: "https://temporary.example.com/result.mp4",
            projectAssetBindings: {
              videoUrl: {
                ok: true,
                missing: false,
                localPath: "/Users/test/media/result.mp4",
                sourceSignature: "https://temporary.example.com/result.mp4",
                mime: "video/mp4",
                size: 2048,
              },
            },
          },
        },
      ], [], "project-a")[0];
      return {
        url: resource?.url,
        videoUrl: resource?.videoUrl,
        localPath: resource?.localPath,
        originalUrl: resource?.originalUrl,
        bindingPath: resource?.projectAssetBinding?.localPath,
      };
    })(),
    {
      url: "file:///Users/test/media/result.mp4",
      videoUrl: "file:///Users/test/media/result.mp4",
      localPath: "/Users/test/media/result.mp4",
      originalUrl: "https://temporary.example.com/result.mp4",
      bindingPath: "/Users/test/media/result.mp4",
    }
  );
  const expiringVideoResource = {
    id: "video-expiring",
    url: "https://temporary.example.com/result.mp4",
    videoUrl: "https://temporary.example.com/result.mp4",
    type: "video/mp4",
    source: "generated",
    pageUrl: "canvas:project-a",
  };
  check("generated remote video requires local persistence", wanjuanTransitResourceNeedsPersistence(expiringVideoResource), true);
  check(
    "persisted video rewrites both url and videoUrl to the local file",
    (() => {
      const resource = wanjuanApplyPersistedTransitResource(expiringVideoResource, {
        ok: true,
        assetId: "asset-video",
        localPath: "/Users/test/media/persisted.mp4",
        filename: "persisted.mp4",
        mime: "video/mp4",
        size: 4096,
        sha256: "abc",
        projectId: "project-a",
        nodeId: "transit-resource",
        field: "url",
        kind: "video",
        savedAt: "2026-07-15T00:00:00.000Z",
      });
      return {
        url: resource?.url,
        videoUrl: resource?.videoUrl,
        localPath: resource?.localPath,
        originalUrl: resource?.originalUrl,
        bindingPath: resource?.projectAssetBinding?.localPath,
      };
    })(),
    {
      url: "file:///Users/test/media/persisted.mp4",
      videoUrl: "file:///Users/test/media/persisted.mp4",
      localPath: "/Users/test/media/persisted.mp4",
      originalUrl: "https://temporary.example.com/result.mp4",
      bindingPath: "/Users/test/media/persisted.mp4",
    }
  );
  // wanjuanResourceKind
  check("kind text", wanjuanResourceKind({ type: "text" }), "text");
  check("kind audio mime", wanjuanResourceKind({ type: "audio/mp3" }), "audio");
  check("kind audio ext", wanjuanResourceKind({ url: "x.mp3" }), "audio");
  check("kind video", wanjuanResourceKind({ type: "video" }), "video");
  check("kind video ext", wanjuanResourceKind({ url: "clip.MOV" }), "video");
  check("kind image default", wanjuanResourceKind({ url: "a.webp" }), "image");
  check("kind data audio", wanjuanResourceKind({ url: "data:audio/wav;base64,xx" }), "audio");

  // Reference handles must only pass the selected output, and duplicate media must be removed.
  check(
    "reference grid cell excludes original image",
    wanjuanCollectNodeReferenceMedia({
      type: "gridSplitNode",
      data: { imageUrl: "https://cdn/original.png", extractedImages: ["https://cdn/cell-1.png", "https://cdn/cell-2.png"] }
    }, "cell-1"),
    { images: ["https://cdn/cell-2.png"], videos: [] }
  );
  check(
    "reference grid merge image is not duplicated",
    wanjuanCollectNodeReferenceMedia({ type: "gridMergeNode", data: { imageUrl: "https://cdn/merged.png" } }),
    { images: ["https://cdn/merged.png"], videos: [] }
  );
  check(
    "reference prefers matching local project binding over expiring public URL",
    wanjuanCollectNodeReferenceMedia({
      type: "imageNode",
      data: {
        imageUrl: "https://temporary.example.com/result.png",
        projectAssetBindings: {
          imageUrl: {
            ok: true,
            missing: false,
            localPath: "/Users/test/project/result.png",
            sourceSignature: "https://temporary.example.com/result.png"
          }
        }
      }
    }),
    { images: ["file:///Users/test/project/result.png"], videos: [] }
  );
  check(
    "reference ignores missing local project binding",
    wanjuanCollectNodeReferenceMedia({
      type: "imageNode",
      data: {
        imageUrl: "https://cdn.example.com/result.png",
        projectAssetBindings: {
          imageUrl: { ok: true, missing: true, localPath: "/Users/test/project/missing.png", sourceSignature: "https://cdn.example.com/result.png" }
        }
      }
    }),
    { images: ["https://cdn.example.com/result.png"], videos: [] }
  );
  check(
    "reference does not reuse binding from an older generated result",
    wanjuanCollectNodeReferenceMedia({
      type: "imageNode",
      data: {
        imageUrl: "https://cdn.example.com/new-result.png",
        projectAssetBindings: {
          imageUrl: { ok: true, missing: false, localPath: "/Users/test/project/old-result.png", sourceSignature: "https://cdn.example.com/old-result.png" }
        }
      }
    }),
    { images: ["https://cdn.example.com/new-result.png"], videos: [] }
  );
  check(
    "reference selected video frame excludes source video",
    wanjuanCollectNodeReferenceMedia({
      type: "videoExtractNode",
      data: {
        videoUrl: "https://cdn/source.mp4",
        extractedImages: ["https://cdn/frame-a.png"],
        allExtractedImages: ["https://cdn/frame-a.png"],
        hiddenIndices: []
      }
    }, "frame-0"),
    { images: ["https://cdn/frame-a.png"], videos: [] }
  );
  check("reference public https URL", wanjuanIsPublicHttpMediaUrl("https://cdn.example.com/audio.mp3"), true);
  check("reference localhost is private", wanjuanIsPublicHttpMediaUrl("http://localhost:8080/audio.mp3"), false);
  check("reference LAN URL is private", wanjuanIsPublicHttpMediaUrl("http://192.168.1.8/audio.mp3"), false);
  check("runtime Seedance receives API config", nodeRuntime.WANJUAN_API_CONFIG_NODE_TYPES.has("seedanceNode"), true);
  check("runtime Suno receives upload config", nodeRuntime.WANJUAN_UPLOAD_CONFIG_NODE_TYPES.has("musicNode"), true);
  check("runtime Qwen clone writes resources", nodeRuntime.WANJUAN_TRANSIT_RESOURCE_NODE_TYPES.has("qwenTtsCloneNode"), true);
  check("runtime Real-ESRGAN writes resources", nodeRuntime.WANJUAN_TRANSIT_RESOURCE_NODE_TYPES.has("realEsrganVideoNode"), true);
  check("runtime plain image avoids large API object", nodeRuntime.WANJUAN_API_CONFIG_NODE_TYPES.has("imageNode"), false);
  const persistedNodeData = {
    model: "grok-image-video",
    prompt: "keep prompt",
    videoUrl: "https://cdn.example.com/result.mp4",
    imageUrl: "https://cdn.example.com/reference.jpg",
    allExtractedImages: ["https://cdn.example.com/frame-1.jpg"],
    apiConfigs: [{ id: "runtime-only" }],
    modelProtocolRegistry: { runtime: true },
    wanjuanRenderMode: "lite",
    wanjuanRenderZoom: 0.5,
    arkTrustedAssetEnabled: true,
  };
  check(
    "runtime strip preserves generated results and model parameters",
    nodeRuntime.wanjuanStripRuntimeNodeData(persistedNodeData),
    {
      model: "grok-image-video",
      prompt: "keep prompt",
      videoUrl: "https://cdn.example.com/result.mp4",
      imageUrl: "https://cdn.example.com/reference.jpg",
      allExtractedImages: ["https://cdn.example.com/frame-1.jpg"],
    }
  );
  const stableNodeData = { model: "gpt-image-2", imageUrl: "https://cdn.example.com/result.png" };
  check("runtime strip keeps unchanged object identity", nodeRuntime.wanjuanStripRuntimeNodeData(stableNodeData) === stableNodeData, true);

  // wanjuanResourceSourceKind
  check("source generated", wanjuanResourceSourceKind({ source: "seedance" }), "generated");
  check("source external", wanjuanResourceSourceKind({ source: "upload" }), "external");

  // aspect ratio
  check("ratio colon", normalizeVideoAspectRatioValue("16:9"), "16:9");
  check("ratio from size", normalizeVideoAspectRatioValue("", "1920x1080"), "16:9");
  check("ratio fallback", normalizeVideoAspectRatioValue("garbage"), "16:9");
  check("size normalize", normalizeVideoSizeValue("1280 x 720"), "1280x720");
  check("size fallback", normalizeVideoSizeValue("nope"), "1280x720");
  check("jixin unified video contains wan t2v", WANJUAN_JIXIN_BUILTIN_UNIFIED_VIDEO_MODELS.includes("wan2.7-t2v-1080P"), true);
  check("jixin unified video contains grok image video", WANJUAN_JIXIN_BUILTIN_UNIFIED_VIDEO_MODELS.includes("grok-image-video"), true);
  check("jixin grok image video protocol binding", WANJUAN_JIXIN_BUILTIN_VIDEO_PROTOCOL_BINDINGS["grok-image-video"], "极鑫 Grok Image Video 兼容");
  check(
    "jixin grok image video protocol uses scalar reference and dynamic controls",
    WANJUAN_JIXIN_BUILTIN_PROTOCOLS["极鑫 Grok Image Video 兼容"],
    {
      category: "video",
      parameterMode: "exact-resolution",
      requestType: "openai-video",
      submitPath: "/v1/videos",
      pollPath: "/v1/videos/{taskId}",
      contentPath: "/v1/videos/{taskId}/content",
      authType: "bearer",
      contentType: "application/json",
      referenceImageMode: "field",
      referenceImageAsArray: false,
      referenceImageItemShape: "string",
      fieldMapping: { model: "model", prompt: "prompt", resolution: "size", aspectRatio: "", duration: "seconds", referenceImage: "image", referenceVideo: "" },
      fieldValueTypes: { seconds: "string", size: "string" },
      parameterAdapter: { resolutionValueMode: "dimension", aspectRatioValueMode: "omit" },
      responseMapping: { video: ["video_url", "videoUrl", "data.video_url", "data.videoUrl", "data.0.url", "output.video_url", "result.video_url", "url"], taskId: ["id", "task_id", "data.id", "data.task_id"], status: ["status", "data.status", "state"], completedValues: ["completed", "complete", "success", "succeeded"], failedValues: ["failed", "error", "fail"] }
    }
  );
  check("jixin legacy grok binding migrates", wanjuanMergeJixinVideoProtocolDefaults({ "grok-image-video": "极鑫 Grok Image Video JSON" }, WANJUAN_JIXIN_BUILTIN_VIDEO_PROTOCOL_BINDINGS)["grok-image-video"], "极鑫 Grok Image Video 兼容");
  const customConfigBeforeJixinMigration = {
    id: "custom-config",
    name: "Custom Provider",
    config: {
      apiConfigs: [{ id: "custom-api", url: "https://custom.example.com", key: "custom-key" }],
      videoModel: "custom-video-only",
      videoModelApiBindings: { "custom-video-only": "custom-api" },
    },
  };
  const migratedJixinSettings = wanjuanSyncJixinBuiltinStoredGlobalConfig({
    activeStoredGlobalConfigId: "custom-config",
    apiConfigs: customConfigBeforeJixinMigration.config.apiConfigs,
    videoModel: "custom-video-only",
    storedGlobalConfigs: [customConfigBeforeJixinMigration],
  });
  const migratedBuiltinJixin = migratedJixinSettings.storedGlobalConfigs.find(
    (config) => config.id === WANJUAN_JIXIN_BUILTIN_GLOBAL_CONFIG_ID
  );
  check("jixin migration preserves active custom preset", migratedJixinSettings.activeStoredGlobalConfigId, "custom-config");
  check("jixin migration preserves custom preset snapshot", migratedJixinSettings.storedGlobalConfigs.find((config) => config.id === "custom-config"), customConfigBeforeJixinMigration);
  check("jixin migration does not import custom video models", String(migratedBuiltinJixin.config.videoModel).includes("custom-video-only"), false);
  check("jixin migration does not import custom API config", migratedBuiltinJixin.config.apiConfigs.some((config) => config.id === "custom-api"), false);
  check("jixin migration keeps the builtin API identity", migratedBuiltinJixin.config.apiConfigs[0].id, WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID);
  check(
    "wan video edit aggregates video before image into one reference sequence",
    videoTask.wanjuanBuildReferenceMediaEntries([{ url: "https://cdn/image.png" }], ["https://cdn/video.mp4"], { kinds: ["image", "video"], order: "video-first" }),
    [{ kind: "video", value: "https://cdn/video.mp4" }, { kind: "image", value: "https://cdn/image.png" }]
  );
  check("video parameter mode resolves ratio quality", videoParameterMode.wanjuanResolveVideoParameterMode({ parameterAdapter: { resolutionValueMode: "aspect-ratio", aspectRatioValueMode: "omit" } }), "ratio-quality");
  check("video parameter mode resolves exact dimensions", videoParameterMode.wanjuanResolveVideoParameterMode({ parameterAdapter: { resolutionValueMode: "dimension" } }), "exact-resolution");
  check("video parameter mode resolves follow source", videoParameterMode.wanjuanResolveVideoParameterMode({ parameterAdapter: { resolutionValueMode: "omit", aspectRatioValueMode: "omit" } }), "follow-source");

  // config butler: tool hints must specialize per model, and fallback/invalid
  // results must not be selected for import automatically.
  const butlerContext = configButler.buildConfigButlerToolContext(
    "POST /v1/videos\nPOST /v1/chat/completions",
    "https://docs.example.com",
    { apiUrl: "https://api.example.com" }
  );
  check(
    "configButler specializes video request type",
    configButler.specializeConfigButlerToolContext(butlerContext, { modelName: "demo-video", category: "video" }).inferredRequestType,
    "openai-video"
  );
  check(
    "configButler specializes text request type",
    configButler.specializeConfigButlerToolContext(butlerContext, { modelName: "demo-chat", category: "text" }).inferredRequestType,
    "openai-chat"
  );
  const referencedOpenApiContext = configButler.buildConfigButlerToolContext(
    JSON.stringify({
      openapi: "3.0.0",
      paths: {
        "/v1/videos": {
          post: {
            requestBody: {
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/VideoRequest" } }
              }
            },
            responses: { "200": { description: "ok" } }
          }
        }
      },
      components: {
        schemas: {
          VideoRequest: {
            type: "object",
            allOf: [
              { type: "object", properties: { model: { type: "string" }, prompt: { type: "string" } } },
              { type: "object", properties: { seconds: { type: "string" }, size: { type: "string" }, input_reference: { type: "string" } } }
            ]
          }
        }
      }
    }),
    "https://docs.example.com/openapi.json",
    { modelName: "configurable-video-model", category: "video", apiUrl: "https://api.example.com" }
  );
  check(
    "configButler resolves referenced video request fields",
    configButler.getButlerDocFieldsForPath(referencedOpenApiContext, "/v1/videos"),
    ["model", "prompt", "seconds", "size", "input_reference"]
  );
  check("configButler resolves referenced video request field types", configButler.getButlerDocFieldTypesForPath(referencedOpenApiContext, "/v1/videos").input_reference, "string");
  const repairedVideoProtocol = configButler.validateAndRepairConfigButlerResult({
    modelName: "configurable-video-model",
    category: "video",
    protocol: {
      name: "OpenAI 视频兼容",
      config: {
        category: "video",
        requestType: "openai-video",
        submitPath: "/v1/videos",
        pollPath: "/v1/videos/{taskId}",
        fieldMapping: {
          model: "model",
          prompt: "prompt",
          duration: "seconds",
          resolution: "size",
          aspectRatio: "",
          referenceImage: "input_reference"
        }
      }
    }
  }, {
    modelName: "configurable-video-model",
    category: "video",
    apiUrl: "https://api.example.com",
    toolContext: configButler.buildConfigButlerToolContext(
      "POST /v1/videos\n请求体示例只展示 model、prompt 和 input_reference，其他可选参数请参考完整 schema。",
      "https://docs.example.com/partial",
      { modelName: "configurable-video-model", category: "video", apiUrl: "https://api.example.com" }
    )
  });
  check("configButler partial docs preserve duration mapping", repairedVideoProtocol.protocol.config.fieldMapping.duration, "seconds");
  check("configButler partial docs preserve resolution mapping", repairedVideoProtocol.protocol.config.fieldMapping.resolution, "size");
  check("configButler partial docs do not force omit duration", repairedVideoProtocol.protocol.config.omitDuration === true, false);
  const noEvidenceVideoProtocol = configButler.validateAndRepairConfigButlerResult({
    modelName: "configurable-video-model",
    category: "video",
    protocol: { name: "OpenAI 视频兼容", config: { category: "video", requestType: "openai-video", submitPath: "/v1/videos", pollPath: "/v1/videos/{taskId}", fieldMapping: { referenceImage: "image", duration: "seconds", resolution: "size" }, referenceImageMode: "field", referenceImageAsArray: true } }
  }, { modelName: "configurable-video-model", category: "video", apiUrl: "https://api.example.com", toolContext: configButler.buildConfigButlerToolContext("plain text without endpoint schema", "https://docs.example.com", { category: "video" }) });
  check("configButler no-evidence OpenAI video preserves inferred reference field", noEvidenceVideoProtocol.protocol.config.fieldMapping.referenceImage, "image");
  check("configButler no-evidence OpenAI video uses scalar reference", noEvidenceVideoProtocol.protocol.config.referenceImageAsArray, false);
  check("configButler dry-run includes scalar reference", noEvidenceVideoProtocol.dryRun.requestBody.image, "https://example.com/reference.png");
  const aliasVideoFields = configButler.inferButlerVideoFieldMapping({
    openApi: { endpoints: [{ path: "/generate", requestKeys: ["model_id", "description", "duration_seconds", "dimensions", "ratio", "image_url"] }] },
    curlExamples: []
  }, "/generate", {});
  check(
    "configButler recognizes configurable video field aliases",
    aliasVideoFields.inferred,
    { model: "model_id", prompt: "description", duration: "duration_seconds", resolution: "dimensions", aspectRatio: "ratio", referenceImage: "image_url" }
  );
  check(
    "configButler recognizes text protocol fields",
    configButler.inferButlerProtocolFieldMapping({ openApi: { endpoints: [{ path: "/v1/responses", requestKeys: ["model", "input", "instructions", "max_output_tokens"] }] }, curlExamples: [] }, "/v1/responses", "text", "openai-responses", {}).inferred,
    { model: "model", input: "input", system: "instructions", maxTokens: "max_output_tokens" }
  );
  check(
    "configButler recognizes image protocol fields",
    configButler.inferButlerProtocolFieldMapping({ openApi: { endpoints: [{ path: "/images/generations", requestKeys: ["model_name", "description", "num_images", "image_size", "aspect_ratio", "reference_images"] }] }, curlExamples: [] }, "/images/generations", "image", "openai-images", {}).inferred,
    { model: "model_name", prompt: "description", count: "num_images", size: "image_size", aspectRatio: "aspect_ratio", referenceImage: "reference_images" }
  );
  check(
    "configButler recognizes audio speech protocol fields",
    configButler.inferButlerProtocolFieldMapping({ openApi: { endpoints: [{ path: "/audio/speech", requestKeys: ["model", "text", "voice_id", "audio_format", "rate"] }] }, curlExamples: [] }, "/audio/speech", "audio", "openai-audio-speech", {}).inferred,
    { model: "model", prompt: "text", input: "text", voice: "voice_id", format: "audio_format", speed: "rate" }
  );
  check(
    "configButler recognizes music protocol fields",
    configButler.inferButlerProtocolFieldMapping({ openApi: { endpoints: [{ path: "/music/generate", requestKeys: ["model", "lyrics", "song_title", "genre", "instrumental", "reference_audio"] }] }, curlExamples: [] }, "/music/generate", "music", "suno-music", {}).inferred,
    { model: "model", title: "song_title", tags: "genre", lyrics: "lyrics", instrumental: "instrumental", referenceAudio: "reference_audio" }
  );
  check(
    "configButler warns when all video controls are omitted",
    configButler.validateButlerProtocolConfig({ category: "video", requestType: "openai-video", submitPath: "/v1/videos", pollPath: "/v1/videos/{taskId}", fieldMapping: { duration: "", resolution: "", aspectRatio: "" } }).warnings.length > 0,
    true
  );
  check(
    "configButler repair preserves unrelated protocol fields",
    configButler.mergeButlerProtocolRepair(
      { fieldMapping: { prompt: "prompt", duration: "seconds", resolution: "size", referenceImage: "input_reference" }, parameterAdapter: { resolutionValueMode: "dimension" } },
      { fieldMapping: { referenceImage: "image_url", duration: "", resolution: "" } },
      "input_reference must be a string"
    ),
    { fieldMapping: { prompt: "prompt", duration: "seconds", resolution: "size", referenceImage: "image_url" }, parameterAdapter: { resolutionValueMode: "dimension" }, fieldValueTypes: {}, responseMapping: {}, extraBody: {} }
  );
  check(
    "configButler repair may remove explicitly rejected field",
    configButler.mergeButlerProtocolRepair(
      { fieldMapping: { prompt: "prompt", duration: "seconds", resolution: "size" } },
      { fieldMapping: { duration: "" }, omitDuration: true },
      "unknown parameter seconds"
    ).fieldMapping.duration,
    ""
  );
  const fallbackButlerItem = configButler.normalizeButlerBatchItems(
    { models: [] },
    ["missing-video-model"],
    { apiUrl: "https://api.example.com", toolContext: butlerContext }
  )[0];
  check("configButler fallback source", fallbackButlerItem.inferenceSource, "fallback");
  check("configButler fallback disabled", fallbackButlerItem.enabled, false);
  const renormalizedFallbackItem = configButler.normalizeButlerBatchItems(
    { models: [fallbackButlerItem] },
    ["missing-video-model"],
    { apiUrl: "https://api.example.com", toolContext: butlerContext }
  )[0];
  check("configButler fallback source survives normalization", renormalizedFallbackItem.inferenceSource, "fallback");
  check("configButler fallback disabled survives normalization", renormalizedFallbackItem.enabled, false);
  const invalidButlerItem = configButler.normalizeButlerBatchItems(
    { models: [{ modelName: "mystery-motion", category: "video", protocol: { name: "Custom", config: { category: "video", requestType: "custom", submitPath: "/submit" } } }] },
    ["mystery-motion"],
    { apiUrl: "https://api.example.com" }
  )[0];
  check("configButler invalid protocol disabled", invalidButlerItem.enabled, false);

  check(
    "stored global API configs replace rather than mix providers",
    replaceGlobalConfigApiConfigs([
      { id: "custom", name: "Custom", url: "https://custom.example.com", key: "custom-key" },
    ]),
    [
      {
        id: "custom",
        name: "Custom",
        url: "https://custom.example.com",
        key: "custom-key",
        protocolFormat: "auto",
      },
    ]
  );
  check(
    "switching stored global config preserves unrelated API entries",
    mergeGlobalConfigApiConfigs(
      [
        { id: "primary", name: "Old Primary", url: "https://old.example.com", key: "old-key" },
        { id: "utility", name: "Utility", url: "https://utility.example.com", key: "utility-key" },
      ],
      [
        { id: "primary", name: "New Primary", url: "https://new.example.com", key: "new-key" },
        { id: "batch", name: "Batch", url: "https://batch.example.com", key: "batch-key" },
      ],
    ),
    [
      { id: "primary", name: "New Primary", url: "https://new.example.com", key: "new-key", protocolFormat: "auto" },
      { id: "utility", name: "Utility", url: "https://utility.example.com", key: "utility-key", protocolFormat: "auto" },
      { id: "batch", name: "Batch", url: "https://batch.example.com", key: "batch-key", protocolFormat: "auto" },
    ],
  );
  check(
    "manual model resets when switched config no longer contains it",
    WanJuanShouldAutoPreferredModel("jixin-video-a\njixin-video-b", "custom-video-x", { manual: true }),
    true
  );
  check(
    "manual model remains when switched config still contains it",
    WanJuanShouldAutoPreferredModel("jixin-video-a\njixin-video-b", "jixin-video-b", { manual: true }),
    false
  );
  check(
    "task refresh does not send an old provider task with the current provider key",
    resolveTaskApiCredential({
      apiConfigs: [{ id: "jixin", url: "https://jixing.example.com", key: "jixin-key" }],
      taskApiConfigId: "custom",
      taskApiBaseUrl: "https://custom.example.com",
      currentApiUrl: "https://jixing.example.com",
      currentApiKey: "jixin-key",
    }),
    {
      baseUrl: "https://custom.example.com",
      key: "",
      matchedConfig: null,
      missingOriginalConfig: true,
    }
  );
  check(
    "task refresh may reuse the current key when the original base URL is unchanged",
    resolveTaskApiCredential({
      apiConfigs: [{ id: "jixin-new-id", url: "https://jixing.example.com", key: "new-key" }],
      taskApiConfigId: "jixin-old-id",
      taskApiBaseUrl: "https://jixing.example.com/",
      currentApiUrl: "https://jixing.example.com",
      currentApiKey: "new-key",
    }),
    {
      baseUrl: "https://jixing.example.com",
      key: "new-key",
      matchedConfig: {
        id: "jixin-new-id",
        url: "https://jixing.example.com",
        key: "new-key",
      },
      missingOriginalConfig: false,
    }
  );
  check(
    "task refresh can find credentials in an inactive stored global config",
    collectTaskCredentialConfigs(
      [{ id: "jixin", url: "https://jixing.example.com", key: "jixin-key" }],
      [{
        id: "custom-preset",
        config: {
          apiConfigs: [{ id: "custom", url: "https://custom.example.com", key: "custom-key" }],
        },
      }]
    ).map(({ id, url, key }) => ({ id, url, key })),
    [
      { id: "jixin", url: "https://jixing.example.com", key: "jixin-key" },
      { id: "custom", url: "https://custom.example.com", key: "custom-key" },
    ]
  );
  check(
    "async video refresh reuses the exact poll URL captured at submission",
    resolveTaskPollUrl({
      baseUrl: "https://new-active.example.com",
      pollPath: "/v1/videos/{taskId}",
      storedPollUrl: "https://original.example.com/jobs/remote-123",
      taskId: "remote-123",
    }),
    "https://original.example.com/jobs/remote-123"
  );
  check("older async settings save cannot overwrite a newer config", isCurrentSettingsSave(12, 11), false);
  check("latest async settings save may commit", isCurrentSettingsSave(12, 12), true);
  check(
    "task credential matching does not confuse identical API ids across presets",
    resolveTaskApiCredential({
      apiConfigs: [
        { id: "default", url: "https://active.example.com", key: "active-key" },
        { id: "default", url: "https://original.example.com", key: "original-key" },
      ],
      taskApiConfigId: "default",
      taskApiBaseUrl: "https://original.example.com",
      currentApiUrl: "https://active.example.com",
      currentApiKey: "active-key",
    }).key,
    "original-key"
  );

  // global task de-dupe: manual stop/status changes should not create duplicate active rows,
  // but completed results and a new generation after stop must stay visible.
  check(
    "globalTasks merge duplicate running/stopped video task",
    compactGlobalTasks([
      {
        id: "task-remote-1",
        type: "video",
        provider: "seedance",
        modelName: "doubao-seedance-2-0",
        projectId: "p1",
        nodeId: "n1",
        status: "pending",
        progress: 0,
        createdAt: 1000,
        prompt: "same prompt",
      },
      {
        id: "video-local-n1-1001",
        type: "video",
        provider: "seedance",
        modelName: "doubao-seedance-2-0",
        projectId: "p1",
        nodeId: "n1",
        status: "failed",
        progress: 0,
        createdAt: 1001,
        updatedAt: 1002,
        prompt: "same prompt",
        stoppedByUser: true,
        errorMsg: "已手动停止",
      },
    ]).map((task) => ({ id: task.id, status: task.status, stoppedByUser: task.stoppedByUser, errorMsg: task.errorMsg })),
    [{ id: "task-remote-1", status: "failed", stoppedByUser: true, errorMsg: "已手动停止" }]
  );
  check(
    "globalTasks keeps completed video history",
    compactGlobalTasks([
      {
        id: "task-done-1",
        type: "video",
        provider: "seedance",
        modelName: "doubao-seedance-2-0",
        projectId: "p1",
        nodeId: "n1",
        status: "completed",
        progress: 100,
        resultUrl: "https://cdn/a.mp4",
        createdAt: 1000,
        prompt: "same prompt",
      },
      {
        id: "task-done-2",
        type: "video",
        provider: "seedance",
        modelName: "doubao-seedance-2-0",
        projectId: "p1",
        nodeId: "n1",
        status: "completed",
        progress: 100,
        resultUrl: "https://cdn/b.mp4",
        createdAt: 2000,
        prompt: "same prompt",
      },
    ]).map((task) => task.id),
    ["task-done-2", "task-done-1"]
  );
  check(
    "globalTasks keeps new run after manual stop",
    compactGlobalTasks([
      {
        id: "task-stopped-1",
        type: "video",
        provider: "tongyi-wanxiang",
        modelName: "wan2.1",
        projectId: "p1",
        nodeId: "n1",
        status: "failed",
        progress: 0,
        createdAt: 1000,
        updatedAt: 1200,
        prompt: "same prompt",
        stoppedByUser: true,
      },
      {
        id: "task-new-2",
        type: "video",
        provider: "tongyi-wanxiang",
        modelName: "wan2.1",
        projectId: "p1",
        nodeId: "n1",
        status: "running",
        progress: 10,
        createdAt: 1300,
        prompt: "same prompt",
      },
    ]).map((task) => task.id),
    ["task-new-2", "task-stopped-1"]
  );
  check(
    "globalTasks supersedes an older active run on the same node",
    supersedeActiveNodeTasks(
      [
        { id: "old-active", nodeId: "n1", status: "running", progress: 12 },
        { id: "other-node", nodeId: "n2", status: "running", progress: 40 },
        { id: "old-done", nodeId: "n1", status: "completed", progress: 100 },
      ],
      "n1",
      5000
    ).map((task) => ({
      id: task.id,
      status: task.status,
      progress: task.progress,
      errorMsg: task.errorMsg,
      supersededByNewRun: task.supersededByNewRun,
      updatedAt: task.updatedAt,
    })),
    [
      {
        id: "old-active",
        status: "failed",
        progress: 12,
        errorMsg: "已被同节点的新任务替代",
        supersededByNewRun: true,
        updatedAt: 5000,
      },
      {
        id: "other-node",
        status: "running",
        progress: 40,
      },
      {
        id: "old-done",
        status: "completed",
        progress: 100,
      },
    ]
  );
  check(
    "stale video run cannot restore progress after being superseded",
    applyRunScopedStateUpdate(
      [{ id: "old-active", status: "failed", progress: 12, supersededByNewRun: true }],
      (tasks) => tasks.map((task) => ({ ...task, status: "running", progress: 40 })),
      false
    ),
    [{ id: "old-active", status: "failed", progress: 12, supersededByNewRun: true }]
  );
  check(
    "running task progress clears an earlier error message",
    updateTaskRunningProgress(
      { id: "retrying", status: "failed", progress: 0, errorMsg: "old provider error" },
      12
    ),
    { id: "retrying", status: "running", progress: 12, errorMsg: undefined }
  );
  const refreshFailureTasks = failGlobalTaskRefresh(
    [{ id: "remote-video", status: "running", progress: 87 }],
    "remote-video",
    "任务查询认证失败（401）"
  );
  check("401 refresh failure stops automatic task polling", refreshFailureTasks[0].status, "failed");
  check("401 refresh failure replaces stale progress error", refreshFailureTasks[0].errorMsg, "任务查询认证失败（401）");
  const indexedTasks = Array.from({ length: 1200 }, (_, index) => ({
    id: `indexed-task-${index}`,
    projectId: `p${index % 3}`,
    nodeId: `n${index % 40}`,
    prompt: `prompt-${index % 25}`,
    createdAt: index,
    status: index % 7 === 0 ? "running" : "completed",
    type: "video",
  }));
  const globalTaskIndex = indexGlobalTasks(indexedTasks);
  check("globalTasks index keeps every task id", globalTaskIndex.byId.size, 1200);
  check(
    "globalTasks node index newest first",
    globalTaskIndex.byNode.get("p0::n0")?.slice(0, 3).map((task) => task.createdAt),
    [1080, 960, 840]
  );

  // Tianji defaults
  check("tianji app default base url remains jixin relay", WANJUAN_TIANJI_DEFAULT_BASE_URL, "https://jixing.guancn.uk");
  check("tianji invalid generation mode falls back to text", wanjuanNormalizeTianjiGenerationMode("legacy-unknown"), "text-to-video");
  check("tianji text generation stays on relay api namespace", wanjuanBuildTianjiGenerationRequest({ mode: "text-to-video", common: { prompt: "mock" } }).endpoint, "/api/cut/model/coze-seedance-text-special");
  check("tianji first-frame generation stays on relay api namespace", wanjuanBuildTianjiGenerationRequest({ mode: "first-frame", common: { prompt: "mock" }, imageUrls: ["https://media.example.invalid/first.png"] }).endpoint, "/api/cut/model/coze-seedance-image-first-special");
  check("tianji first-last request uses official fields", wanjuanBuildTianjiGenerationRequest({ mode: "first-last", common: { prompt: "mock" }, imageUrls: ["https://media.example.invalid/first.png", "https://media.example.invalid/last.png"] }), {
    endpoint: "/api/cut/model/coze-seedance-image-first-last-special",
    payload: { prompt: "mock", first_frame: "https://media.example.invalid/first.png", last_frame: "https://media.example.invalid/last.png" },
    generationMode: "first-last"
  });
  check("tianji reference request preserves array field names", wanjuanBuildTianjiGenerationRequest({ mode: "reference-media", common: { prompt: "mock" }, imageUrls: ["asset://portrait-mock"], videoUrls: ["https://media.example.invalid/reference.mp4"], audioUrls: ["https://media.example.invalid/reference.mp3"] }), {
    endpoint: "/api/cut/model/coze-seedance-video-special",
    payload: { prompt: "mock", "images[]": ["asset://portrait-mock"], "videos[]": ["https://media.example.invalid/reference.mp4"], "audios[]": ["https://media.example.invalid/reference.mp3"] },
    generationMode: "reference-media"
  });
  check("tianji asset list sends only documented pagination fields", wanjuanTianjiAssetListParams("AIGC", "group-mock", 2, 20), {
    group_ids: "group-mock", group_type: "AIGC", statuses: "Active", PageNumber: "2", PageSize: "20", SortBy: "CreateTime", SortOrder: "Desc"
  });
  let referenceLimitMessage = "";
  try { wanjuanValidateTianjiReferenceMedia(Array.from({ length: 10 }, (_, index) => ({ url: `https://media.example.invalid/${index}.png` })), "image"); } catch (error) { referenceLimitMessage = error.message; }
  check("tianji rejects excess image references instead of truncating", referenceLimitMessage, "天玑图片参考素材最多 9 个");
  const tianjiFixture = (name) => JSON.parse(readFileSync(join(root, "scripts/fixtures/tianji", name), "utf8"));
  const submitFixture = tianjiFixture("submit-success.json");
  const successFixture = tianjiFixture("poll-success.json");
  const refundedFixture = tianjiFixture("poll-refunded.json");
  check("tianji fixture submit id", wanjuanTianjiFindTaskId(submitFixture), "execute_mock_001");
  check("tianji fixture success status", wanjuanTianjiStatus(successFixture), "succeeded");
  check("tianji fixture success video", wanjuanTianjiFindVideoUrl(successFixture), "https://media.example.invalid/mock-result.mp4");
  check("tianji fixture success thumbnail", wanjuanTianjiFindThumbUrl(successFixture), "https://media.example.invalid/mock-cover.jpg");
  check("tianji fixture normalized progress", wanjuanTianjiFindProgress(successFixture), 99);
  check("tianji fixture refunded status", wanjuanTianjiStatus(refundedFixture), "failed");
  check("tianji fixture refunded message", wanjuanTianjiErrorMessage(refundedFixture), "任务失败（积分已退款）：内容审核未通过，积分已退款");
  check("tianji v2 task query uses POST JSON ids", wanjuanBuildTianjiTaskQuery("execute_mock_001"), {
    endpoint: "/api/cut/model/coze-run-seedance-special-history",
    method: "POST",
    params: { task_id: "execute_mock_001", execute_id: "execute_mock_001" },
  });
  check("tianji balance accepts msg.points", wanjuanTianjiBalancePoints({ code: 200, msg: { points: 12 } }), 12);
  check("tianji balance accepts proxy data.points", wanjuanTianjiBalancePoints({ code: 200, data: { points: 34 } }), 34);
  check("tianji portrait task endpoint contract", WANJUAN_TIANJI_PORTRAIT_ENDPOINTS.queryRealResult, "/api/cut/model/get-visual-date-result");
  check("tianji portrait endpoints stay on relay api namespace", Object.values(WANJUAN_TIANJI_PORTRAIT_ENDPOINTS).every((endpoint) => endpoint.startsWith("/api/cut/model/")), true);
  check("tianji portrait task id parser", wanjuanTianjiFindPortraitTaskId({ data: { task_id: "portrait_mock_001" } }), "portrait_mock_001");
  check("tianji portrait task params", wanjuanBuildTianjiPortraitTaskParams("portrait_mock_001"), { task_id: "portrait_mock_001", execute_id: "portrait_mock_001" });
  check("tianji portrait group default name is readable", wanjuanTianjiDefaultPortraitGroupName(new Date("2026-08-12T12:34:56").getTime()), "万卷灵境-20260812123456");
  check("tianji legacy material id aliases are supported", wanjuanTianjiPortraitAssetIdFromItem({ MaterialId: "asset-legacy-001" }), "asset-legacy-001");
  check("tianji portrait id prefers explicit asset id", wanjuanTianjiPortraitAssetIdFromItem({ id: "group-a", asset_id: "asset-new-001" }), "asset-new-001");
  check("tianji group id is never treated as deletable asset id", wanjuanTianjiPortraitDeleteDescriptor({ id: "group-a", group_type: "AIGC" }, "AIGC"), { id: "", groupType: "AIGC", groupId: "", canDelete: false });
  check("tianji delete descriptor keeps group context", wanjuanTianjiPortraitDeleteDescriptor({ MaterialId: "asset-legacy-002", group_id: "group-a", group_type: "AIGC" }), { id: "asset-legacy-002", groupType: "AIGC", groupId: "group-a", canDelete: true });
  let capturedTianjiRequest = null;
  globalThis.window = {
    wanjuanDesktop: {
      proxyFetch: async (request) => {
        capturedTianjiRequest = request;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          bodyBase64: Buffer.from(JSON.stringify({ code: 200, data: { status: "running" } }), "utf8").toString("base64"),
        };
      },
    },
  };
  const mockTaskQuery = wanjuanBuildTianjiTaskQuery("execute_mock_json");
  await wanjuanTianjiRequest({ baseUrl: "https://mock.example.invalid", token: "test-token-000000000000000000000000", sassId: "1", platform: "web" }, mockTaskQuery.endpoint, {
    method: mockTaskQuery.method,
    params: mockTaskQuery.params,
  });
  check("tianji v2 request method", capturedTianjiRequest.method, "POST");
  check("tianji v2 request content type", capturedTianjiRequest.headers["Content-Type"], "application/json");
  check("tianji v2 request x api key", capturedTianjiRequest.headers["X-API-Key"], "test-token-000000000000000000000000");
  check("tianji jixin request authorization bearer", capturedTianjiRequest.headers.Authorization, "Bearer test-token-000000000000000000000000");
  check("tianji bearer input is not duplicated", wanjuanTianjiAuthHeaders("Bearer test-token-prefixed").Authorization, "Bearer test-token-prefixed");
  check("tianji bearer input keeps raw x api key", wanjuanTianjiAuthHeaders("Bearer test-token-prefixed")["X-API-Key"], "test-token-prefixed");
  check("tianji request stays on configured relay", capturedTianjiRequest.url, "https://mock.example.invalid/api/cut/model/coze-run-seedance-special-history");
  check("tianji v2 request JSON body", JSON.parse(Buffer.from(capturedTianjiRequest.bodyBase64, "base64").toString("utf8")), { task_id: "execute_mock_json", execute_id: "execute_mock_json" });
  await wanjuanTianjiRequest({ baseUrl: "https://jixing.guancn.uk/", token: "Bearer test-token-prefixed" }, "/api/cut/model/fetch-points-balance");
  check("tianji balance uses configured jixin api path", capturedTianjiRequest.url, "https://jixing.guancn.uk/api/cut/model/fetch-points-balance");
  check("tianji balance defaults to POST", capturedTianjiRequest.method, "POST");
  check("tianji empty balance is explicit", wanjuanTianjiBalancePoints({ code: 200, data: [] }), null);
  globalThis.window.wanjuanDesktop.proxyFetch = async () => ({
    ok: true,
    status: 401,
    statusText: "Unauthorized",
    bodyBase64: Buffer.from(JSON.stringify({ code: 401, message: "unauthorized" }), "utf8").toString("base64"),
  });
  let tianjiAuthError = "";
  try {
    await wanjuanTianjiRequest({ baseUrl: "https://mock.example.invalid", token: "test-token" }, "/api/cut/model/fetch-points-balance");
  } catch (error) {
    tianjiAuthError = String(error?.message || error);
  }
  check("tianji authentication error is classified", tianjiAuthError, "天玑鉴权失败：unauthorized");
  globalThis.window.wanjuanDesktop.proxyFetch = async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    bodyBase64: Buffer.from(JSON.stringify({ code: 500, message: "upstream unavailable" }), "utf8").toString("base64"),
  });
  let tianjiBusinessError = "";
  try {
    await wanjuanTianjiRequest({ baseUrl: "https://mock.example.invalid", token: "test-token" }, "/api/cut/model/fetch-points-balance");
  } catch (error) {
    tianjiBusinessError = String(error?.message || error);
  }
  check("tianji upstream business error is classified", tianjiBusinessError, "天玑业务失败：upstream unavailable");
  check("tianji missing base url uses jixin relay", wanjuanNormalizeTianjiSeedanceConfig({}).baseUrl, "https://jixing.guancn.uk");
  check("tianji trims relay trailing slash", wanjuanNormalizeTianjiSeedanceConfig({ baseUrl: " https://jixing.guancn.uk/ " }).baseUrl, "https://jixing.guancn.uk");
  check("tianji rewrites legacy upstream to jixin relay", wanjuanNormalizeTianjiSeedanceConfig({ baseUrl: "https://ai.kulunli.cn/" }).baseUrl, "https://jixing.guancn.uk");
  check("tianji rewrites current internal upstream to jixin relay", wanjuanNormalizeTianjiSeedanceConfig({ baseUrl: "https://aiuse.phad.cn/" }).baseUrl, "https://jixing.guancn.uk");
  check("tianji preserves enterprise relay base url", wanjuanNormalizeTianjiSeedanceConfig({ baseUrl: "https://enterprise-relay.example.invalid/" }).baseUrl, "https://enterprise-relay.example.invalid");
  check("tianji saved empty base url stays empty", wanjuanNormalizeTianjiSeedanceConfig({ baseUrl: "" }).baseUrl, "");
  check("tianji default sync source follows jixin", wanjuanNormalizeTianjiSeedanceConfig({}).syncSource, WANJUAN_TIANJI_SYNC_SOURCE_JIXIN);
  check(
    "tianji jixin sync fills untouched config",
    wanjuanBuildSyncedTianjiConfigFromJixin({}, { url: " https://api.example.com/ ", key: " token-a " }),
    {
      baseUrl: "https://api.example.com",
      token: "token-a",
      syncSource: WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
      sassId: "1",
      platform: "web",
      models: "doubao-seedance-2-0-260128\ndoubao-seedance-2-0-fast-260128",
      durations: "4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15",
      resolutions: "480p\n720p\n1080p",
      ratios: "21:9\n16:9\n4:3\n1:1\n3:4\n9:16",
      generateAudio: true,
      watermark: false
    }
  );
  check(
    "tianji manual config is not overwritten by jixin sync",
    wanjuanBuildSyncedTianjiConfigFromJixin(
      wanjuanMarkTianjiConfigManual({ baseUrl: "https://manual.example.com", token: "manual-token" }),
      { url: "https://api.example.com", key: "token-a" }
    ).baseUrl,
    "https://manual.example.com"
  );
  check(
    "tianji legacy custom base url becomes manual config",
    wanjuanBuildSyncedTianjiConfigFromJixin(
      { baseUrl: " https://legacy.example.com/ ", token: "legacy-token" },
      { url: "https://api.example.com", key: "token-a" }
    ),
    {
      baseUrl: "https://legacy.example.com",
      token: "legacy-token",
      syncSource: WANJUAN_TIANJI_SYNC_SOURCE_MANUAL,
      sassId: "1",
      platform: "web",
      models: "doubao-seedance-2-0-260128\ndoubao-seedance-2-0-fast-260128",
      durations: "4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15",
      resolutions: "480p\n720p\n1080p",
      ratios: "21:9\n16:9\n4:3\n1:1\n3:4\n9:16",
      generateAudio: true,
      watermark: false
    }
  );
  check(
    "tianji forced jixin sync can relink manual config",
    wanjuanBuildSyncedTianjiConfigFromJixin(
      { baseUrl: "https://manual.example.com", token: "manual-token", syncSource: WANJUAN_TIANJI_SYNC_SOURCE_MANUAL },
      { url: "https://api.example.com", key: "token-a" },
      { force: true }
    ),
    {
      baseUrl: "https://api.example.com",
      token: "token-a",
      syncSource: WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
      sassId: "1",
      platform: "web",
      models: "doubao-seedance-2-0-260128\ndoubao-seedance-2-0-fast-260128",
      durations: "4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15",
      resolutions: "480p\n720p\n1080p",
      ratios: "21:9\n16:9\n4:3\n1:1\n3:4\n9:16",
      generateAudio: true,
      watermark: false
    }
  );

  // ---- suno-music-api (newapi 经典 /suno/submit/music 格式) ----
  const suno = await import(pathToFileURL(join(outDir, "suno-music-api.js")).href);
  check("suno.gen.inspiration", suno.buildSunoGenerateBody({ customMode: false, instrumental: false, mv: "chirp-v4", prompt: "乡愁", tags: "" }), { mv: "chirp-v4", gpt_description_prompt: "乡愁" });
  check("suno.gen.custom", suno.buildSunoGenerateBody({ customMode: true, instrumental: false, mv: "chirp-auk", prompt: "[Verse]...", tags: "edm", title: "T" }), { mv: "chirp-auk", prompt: "[Verse]...", tags: "edm", title: "T" });
  check("suno.gen.instrumental", suno.buildSunoGenerateBody({ customMode: true, instrumental: true, mv: "chirp-v4", tags: "lofi" }), { mv: "chirp-v4", make_instrumental: true, tags: "lofi" });
  check("suno.extend", suno.buildSunoExtendBody({ continueClipId: "abc", continueAt: 30, mv: "chirp-v4", prompt: "x" }), { mv: "chirp-v4", continue_clip_id: "abc", continue_at: 30, prompt: "x" });
  check("suno.reference.url", suno.buildSunoReferenceBody({ referenceUrl: "https://a/x.mp3", mv: "chirp-v4", tags: "jazz" }), { mv: "chirp-v4", task: "upload_reference", url: "https://a/x.mp3", tags: "jazz" });
  check("suno.reference.clip", suno.buildSunoReferenceBody({ referenceClipId: "xyz", mv: "chirp-v4" }), { mv: "chirp-v4", reference_clip_id: "xyz" });
  check("suno.validate.inspirationNeedsPrompt", suno.validateSunoGenerateParams({ customMode: false, instrumental: false, mv: "chirp-v4", prompt: "" }), "灵感模式需填写歌曲描述");
  check("suno.validate.customNeedsPrompt", suno.validateSunoGenerateParams({ customMode: true, instrumental: false, mv: "chirp-v4", prompt: "" }), "自定义模式需填写歌词(prompt)");
  check("suno.validate.instrumentalOk", suno.validateSunoGenerateParams({ customMode: false, instrumental: true, mv: "chirp-v4", prompt: "" }), null);
  check("suno.validate.ok", suno.validateSunoGenerateParams({ customMode: false, instrumental: false, mv: "chirp-v4", prompt: "hi" }), null);
  check("suno.taskStatus", suno.extractSunoTaskStatus({ data: { status: "success" } }), "SUCCESS");
  check("suno.taskSuccess", suno.sunoTaskIsSuccess("SUCCESS"), true);
  check("suno.taskFailure", suno.sunoTaskIsFailure("FAILURE"), true);
  check("suno.clips", suno.extractSunoClips({ data: { status: "SUCCESS", data: [{ id: "1", clip_id: "c1", audio_url: "http://a/1.mp3", status: "complete", title: "T", duration: 120, model_name: "chirp-v4" }] } }),
    [{ id: "1", audioUrl: "http://a/1.mp3", videoUrl: undefined, imageUrl: undefined, title: "T", tags: undefined, prompt: undefined, status: "complete", duration: 120, modelName: "chirp-v4" }]);
  check("suno.url", suno.sunoUrl("https://x.newapi.com/", "/suno/submit/music"), "https://x.newapi.com/suno/submit/music");

  console.log(`\n结果：${pass} 通过，${fail} 失败`);
  rmSync(outDir, { recursive: true, force: true });
  process.exit(fail ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
});
