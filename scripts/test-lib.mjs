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

  // ---- suno-music-api ----
  const suno = await import(pathToFileURL(join(outDir, "suno-music-api.js")).href);
  // 灵感模式：只带 prompt，不带 style/title
  check("suno.generate.inspiration", suno.buildSunoGenerateBody(
    { customMode: false, instrumental: false, model: "V4_5PLUS", prompt: "轻快的城市清晨", style: "should-be-ignored", title: "ignored" }
  ), { customMode: false, instrumental: false, model: "V4_5PLUS", callBackUrl: suno.SUNO_PLACEHOLDER_CALLBACK, prompt: "轻快的城市清晨" });
  // 自定义模式：带 style/title/歌词，权重裁剪，负向标签，人声性别
  check("suno.generate.custom", suno.buildSunoGenerateBody(
    { customMode: true, instrumental: false, model: "V5", prompt: "[verse]...", style: "citypop", title: "Morning", negativeTags: "heavy metal", vocalGender: "f", styleWeight: 1.5, weirdnessConstraint: -0.2, audioWeight: 0.3 }
  ), { customMode: true, instrumental: false, model: "V5", callBackUrl: suno.SUNO_PLACEHOLDER_CALLBACK, prompt: "[verse]...", style: "citypop", title: "Morning", negativeTags: "heavy metal", vocalGender: "f", styleWeight: 1, weirdnessConstraint: 0, audioWeight: 0.3 });
  // 纯伴奏+自定义：可无 prompt
  check("suno.generate.instrumental", suno.buildSunoGenerateBody(
    { customMode: true, instrumental: true, model: "V4", style: "lofi", title: "Focus" }
  ), { customMode: true, instrumental: true, model: "V4", callBackUrl: suno.SUNO_PLACEHOLDER_CALLBACK, style: "lofi", title: "Focus" });
  // extend：defaultParamFlag=false 时不带自定义参数
  check("suno.extend.original", suno.buildSunoExtendBody(
    { audioId: "abc", defaultParamFlag: false, model: "V4_5", prompt: "x", continueAt: 30 }
  ), { defaultParamFlag: false, audioId: "abc", model: "V4_5", callBackUrl: suno.SUNO_PLACEHOLDER_CALLBACK });
  check("suno.extend.custom", suno.buildSunoExtendBody(
    { audioId: "abc", defaultParamFlag: true, model: "V4_5", prompt: "继续", style: "rock", title: "T", continueAt: 30 }
  ), { defaultParamFlag: true, audioId: "abc", model: "V4_5", callBackUrl: suno.SUNO_PLACEHOLDER_CALLBACK, prompt: "继续", style: "rock", title: "T", continueAt: 30 });
  // 校验
  check("suno.validate.customNeedsStyle", suno.validateSunoGenerateParams({ customMode: true, instrumental: false, model: "V4", prompt: "l", title: "t" }), "自定义模式需填写风格(style)");
  check("suno.validate.inspirationNeedsPrompt", suno.validateSunoGenerateParams({ customMode: false, instrumental: false, model: "V4", prompt: "" }), "灵感模式需填写歌曲描述(prompt)");
  check("suno.validate.ok", suno.validateSunoGenerateParams({ customMode: false, instrumental: false, model: "V4", prompt: "hi" }), null);
  // 状态
  check("suno.status.success", suno.sunoStatusIsSuccess("SUCCESS"), true);
  check("suno.status.failure", suno.sunoStatusIsFailure("SENSITIVE_WORD_ERROR"), true);
  check("suno.status.pendingNotTerminal", suno.sunoStatusIsTerminal("PENDING"), false);
  // 结果提取
  check("suno.extractTracks", suno.extractSunoTracks(
    { data: { response: { sunoData: [{ id: "1", audioUrl: "http://a/1.mp3", title: "T", duration: "120", model_name: "chirp" }] } } }
  ), [{ id: "1", audioUrl: "http://a/1.mp3", streamAudioUrl: undefined, imageUrl: undefined, title: "T", tags: undefined, duration: 120, prompt: undefined, modelName: "chirp", createTime: undefined }]);
  check("suno.extractStatus", suno.extractSunoStatus({ data: { status: "first_success" } }), "FIRST_SUCCESS");
  check("suno.url", suno.sunoUrl("https://api.sunoapi.org/", "/api/v1/generate"), "https://api.sunoapi.org/api/v1/generate");
  check("suno.charLimits.v4", suno.sunoCharLimits("V4"), { prompt: 3000, style: 200, title: 80 });
  check("suno.charLimits.v5", suno.sunoCharLimits("V5_5"), { prompt: 5000, style: 1000, title: 100 });
  // 参考音频翻唱 upload-cover
  check("suno.cover.body", suno.buildSunoUploadCoverBody(
    { uploadUrl: "https://cdn.example.com/ref.mp3", customMode: false, instrumental: false, model: "V4_5PLUS", prompt: "改成爵士风" }
  ), { uploadUrl: "https://cdn.example.com/ref.mp3", customMode: false, instrumental: false, model: "V4_5PLUS", callBackUrl: suno.SUNO_PLACEHOLDER_CALLBACK, prompt: "改成爵士风" });
  check("suno.cover.validate.needUrl", suno.validateSunoUploadCoverParams({ uploadUrl: "", customMode: false, instrumental: false, model: "V4", prompt: "x" }), "翻唱需提供参考音频的公网 URL（uploadUrl）");
  check("suno.cover.validate.needPublic", suno.validateSunoUploadCoverParams({ uploadUrl: "file:///a.mp3", customMode: false, instrumental: false, model: "V4", prompt: "x" }), "参考音频必须是公网可访问的 http(s) URL（本地文件需先上传到公网）");
  check("suno.cover.validate.ok", suno.validateSunoUploadCoverParams({ uploadUrl: "https://a/x.mp3", customMode: false, instrumental: false, model: "V4", prompt: "x" }), null);

  console.log(`\n结果：${pass} 通过，${fail} 失败`);
  rmSync(outDir, { recursive: true, force: true });
  process.exit(fail ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
});
