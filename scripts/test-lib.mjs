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
      "--jsx", "react-jsx",
      "--outDir", outDir,
      join(root, "src/renderer/lib/resource.ts"),
      join(root, "src/renderer/lib/video-aspect-ratio.ts"),
      join(root, "src/renderer/lib/video-task.ts"),
      join(root, "src/renderer/lib/tianji-api.ts"),
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
  const { normalizeVideoAspectRatioValue, normalizeVideoSizeValue } = await import(pathToFileURL(join(outDir, "video-aspect-ratio.js")).href);
  const {
    WANJUAN_TIANJI_DEFAULT_BASE_URL,
    WANJUAN_TIANJI_SYNC_SOURCE_JIXIN,
    WANJUAN_TIANJI_SYNC_SOURCE_MANUAL,
    wanjuanBuildSyncedTianjiConfigFromJixin,
    wanjuanMarkTianjiConfigManual,
    wanjuanNormalizeTianjiSeedanceConfig
  } = await import(pathToFileURL(join(outDir, "tianji-api.js")).href);

  console.log("运行用例...");
  // wanjuanResourceKind
  check("kind text", wanjuanResourceKind({ type: "text" }), "text");
  check("kind audio mime", wanjuanResourceKind({ type: "audio/mp3" }), "audio");
  check("kind audio ext", wanjuanResourceKind({ url: "x.mp3" }), "audio");
  check("kind video", wanjuanResourceKind({ type: "video" }), "video");
  check("kind video ext", wanjuanResourceKind({ url: "clip.MOV" }), "video");
  check("kind image default", wanjuanResourceKind({ url: "a.webp" }), "image");
  check("kind data audio", wanjuanResourceKind({ url: "data:audio/wav;base64,xx" }), "audio");

  // wanjuanResourceSourceKind
  check("source generated", wanjuanResourceSourceKind({ source: "seedance" }), "generated");
  check("source external", wanjuanResourceSourceKind({ source: "upload" }), "external");

  // aspect ratio
  check("ratio colon", normalizeVideoAspectRatioValue("16:9"), "16:9");
  check("ratio from size", normalizeVideoAspectRatioValue("", "1920x1080"), "16:9");
  check("ratio fallback", normalizeVideoAspectRatioValue("garbage"), "16:9");
  check("size normalize", normalizeVideoSizeValue("1280 x 720"), "1280x720");
  check("size fallback", normalizeVideoSizeValue("nope"), "1280x720");

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
