// 工具库行为回归测试：编译 src/renderer/lib 后，对若干纯逻辑函数跑用例，
// 验证反混淆后的实现与预期行为一致。
//
// 运行：npm run test:lib
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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
      join(root, "src/renderer/lib/config-butler.ts"),
      join(root, "src/renderer/lib/jixin-catalog.ts"),
      join(root, "src/renderer/lib/tianji-api.ts"),
      join(root, "src/renderer/lib/tianji-portrait.ts"),
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

  const { wanjuanResourceKind, wanjuanResourceSourceKind } = await import(pathToFileURL(join(outDir, "resource.js")).href);
  const { wanjuanCollectNodeReferenceMedia, wanjuanIsPublicHttpMediaUrl } = await import(pathToFileURL(join(outDir, "reference-media.js")).href);
  const { normalizeVideoAspectRatioValue, normalizeVideoSizeValue } = await import(pathToFileURL(join(outDir, "video-aspect-ratio.js")).href);
  const { compactGlobalTasks, indexGlobalTasks } = await import(pathToFileURL(join(outDir, "global-tasks.js")).href);
  const videoTask = await import(pathToFileURL(join(outDir, "video-task.js")).href);
  const videoParameterMode = await import(pathToFileURL(join(outDir, "video-parameter-mode.js")).href);
  const nodeRuntime = await import(pathToFileURL(join(outDir, "node-runtime-contract.js")).href);
  const configButler = await import(pathToFileURL(join(outDir, "config-butler.js")).href);
  const { WANJUAN_JIXIN_BUILTIN_UNIFIED_VIDEO_MODELS, WANJUAN_JIXIN_BUILTIN_PROTOCOLS, WANJUAN_JIXIN_BUILTIN_VIDEO_PROTOCOL_BINDINGS, wanjuanMergeJixinVideoProtocolDefaults } = await import(pathToFileURL(join(outDir, "jixin-catalog.js")).href);
  const {
    WANJUAN_TIANJI_DEFAULT_BASE_URL,
    WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
    WANJUAN_TIANJI_SYNC_SOURCE_MANUAL,
    wanjuanBuildSyncedTianjiConfigFromJixin,
    wanjuanMarkTianjiConfigManual,
    wanjuanNormalizeTianjiSeedanceConfig
  } = await import(pathToFileURL(join(outDir, "tianji-api.js")).href);
  const { wanjuanResetTianjiPortraitBindingForImage } = await import(pathToFileURL(join(outDir, "tianji-portrait.js")).href);

  console.log("运行用例...");
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
  check("tianji default base url", WANJUAN_TIANJI_DEFAULT_BASE_URL, "https://jixing.guancn.uk");
  check("tianji missing base url uses default", wanjuanNormalizeTianjiSeedanceConfig({}).baseUrl, "https://jixing.guancn.uk");
  check("tianji trims default trailing slash", wanjuanNormalizeTianjiSeedanceConfig({ baseUrl: " https://jixing.guancn.uk/ " }).baseUrl, "https://jixing.guancn.uk");
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
