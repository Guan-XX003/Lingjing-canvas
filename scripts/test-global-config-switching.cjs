#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const electronPath = require("electron");
const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-global-config-"));
const port = Number(process.env.WANJUAN_CONFIG_TEST_PORT || 9461);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = (url) => new Promise((resolve, reject) => {
  http.get(url, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => {
      try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
    });
  }).on("error", reject);
});

async function waitForTarget() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
      const target = targets.find((item) => item.type === "page" && /index\.html/.test(item.url || ""));
      if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error("Timed out waiting for Electron debug target");
}

const customApi = {
  id: "custom-api",
  name: "Custom API",
  url: "https://custom.example.com",
  key: "custom-key",
  protocolFormat: "auto",
};
const jixinApi = {
  id: "jixin-default",
  name: "极鑫",
  url: "https://jixing.guancn.uk",
  key: "jixin-key",
  protocolFormat: "auto",
};
const utilityApi = {
  id: "utility-api",
  name: "用户保留 API 2",
  url: "https://utility.example.com",
  key: "utility-key",
  protocolFormat: "auto",
};
const backupApi = {
  id: "backup-api",
  name: "用户保留 API 3",
  url: "https://backup.example.com",
  key: "backup-key",
  protocolFormat: "auto",
};
const makeConfig = ({ api, textModel, imageModel = "", videoModel, audioModel = "" }) => ({
  apiConfigs: [api],
  textApiConfigId: api.id,
  imageApiConfigId: api.id,
  videoApiConfigId: api.id,
  audioApiConfigId: api.id,
  textApiUrl: api.url,
  textApiKey: api.key,
  imageApiUrl: api.url,
  imageApiKey: api.key,
  videoApiUrl: api.url,
  videoApiKey: api.key,
  audioApiUrl: api.url,
  audioApiKey: api.key,
  textModel,
  drawingModel: imageModel,
  videoModel,
  audioModel,
  ttsMusicModel: "",
  modelProtocolRegistry: {},
  textModelApiBindings: { [textModel]: api.id },
  imageModelApiBindings: imageModel ? { [imageModel]: api.id } : {},
  videoModelApiBindings: { [videoModel]: api.id },
  audioModelApiBindings: audioModel ? { [audioModel]: api.id } : {},
  textModelProtocolBindings: {},
  imageModelProtocolBindings: {},
  videoModelProtocolBindings: {},
  audioModelProtocolBindings: {},
  videoDurations: "5",
  videoResolutions: "1280x720",
  videoAspectRatios: "16:9",
  videoModelRequestProfiles: "{}",
  configButlerDocUrl: "",
  configButlerMode: "batch",
  configButlerTargetCategory: "text",
  configButlerTargetApiConfigId: api.id,
});

const customConfig = makeConfig({ api: customApi, textModel: "custom-text-only", videoModel: "custom-video-only" });
const jixinConfig = makeConfig({
  api: jixinApi,
  textModel: "jixin-text-only",
  imageModel: "jixin-image-only",
  videoModel: "jixin-video-only",
  audioModel: "jixin-audio-only",
});
const storedGlobalConfigs = [
  { id: "builtin-jixin-base", name: "极鑫测试配置", source: "builtin-jixin", config: jixinConfig },
  { id: "custom-preset", name: "自定义测试配置", config: customConfig },
];
const historicalVideoTask = {
  id: "remote-video-123",
  type: "video",
  provider: "video",
  apiBaseUrl: customApi.url,
  apiConfigId: customApi.id,
  modelName: "custom-video-only",
  requestProfile: {
    requestType: "openai-video",
    pollPath: "/v1/videos/{taskId}",
    pollUrl: "https://custom.example.com/jobs/remote-video-123",
  },
  projectId: "config-test-project",
  status: "failed",
  progress: 87,
  createdAt: Date.now(),
  prompt: "历史异步视频任务",
  errorMsg: "previous auth error",
};

async function run() {
  const child = spawn(electronPath, [projectRoot, `--remote-debugging-port=${port}`], {
    cwd: projectRoot,
    stdio: ["ignore", "ignore", "pipe"],
    env: {
      ...process.env,
      WANJUAN_TEST_USER_DATA_PATH: userDataPath,
      WANJUAN_ALLOW_RANDOM_PORT: "1",
      WANJUAN_DISABLE_UPDATE_CHECK: "1",
    },
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  let ws;
  try {
    ws = new WebSocket(await waitForTarget());
    let id = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const send = (method, params = {}) => new Promise((resolve) => {
      const requestId = ++id;
      pending.set(requestId, resolve);
      ws.send(JSON.stringify({ id: requestId, method, params }));
    });
    const evaluate = async (expression, awaitPromise = false) => {
      const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
      if (response.result?.exceptionDetails) {
        throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
      }
      return response.result?.result?.value;
    };
    const waitFor = async (expression, label, timeout = 30000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await evaluate(expression)) return;
        await sleep(200);
      }
      throw new Error(`Timed out waiting for ${label}`);
    };
    const readStorage = (keys) => evaluate(`new Promise(resolve => chrome.storage.local.get(${JSON.stringify(keys)}, resolve))`, true);
    const assertActiveConfig = async (expectedId, expectedApiId, expectedConfig) => {
      const snapshot = await readStorage([
        "activeStoredGlobalConfigId",
        "apiConfigs",
        "drawingModel",
        "videoModel",
        "audioModel",
        "imageModelApiBindings",
        "videoModelApiBindings",
        "audioModelApiBindings",
      ]);
      if (snapshot.activeStoredGlobalConfigId !== expectedId) throw new Error(`Active config mismatch: ${JSON.stringify(snapshot)}`);
      const apiIds = new Set((snapshot.apiConfigs || []).map((config) => config?.id));
      for (const requiredId of [expectedApiId, "custom-api", "utility-api", "backup-api"]) {
        if (!apiIds.has(requiredId)) throw new Error(`API config ${requiredId} was deleted: ${JSON.stringify(snapshot.apiConfigs)}`);
      }
      if (snapshot.drawingModel !== expectedConfig.drawingModel) throw new Error(`Image models mixed: ${JSON.stringify(snapshot.drawingModel)}`);
      if (snapshot.videoModel !== expectedConfig.videoModel) throw new Error(`Video models mixed: ${JSON.stringify(snapshot.videoModel)}`);
      if (snapshot.audioModel !== expectedConfig.audioModel) throw new Error(`Audio models mixed: ${JSON.stringify(snapshot.audioModel)}`);
      if (JSON.stringify(snapshot.imageModelApiBindings || {}) !== JSON.stringify(expectedConfig.imageModelApiBindings || {})) {
        throw new Error(`Image bindings mixed: ${JSON.stringify(snapshot.imageModelApiBindings)}`);
      }
      if (snapshot.videoModelApiBindings?.[expectedConfig.videoModel] !== expectedApiId || Object.keys(snapshot.videoModelApiBindings || {}).length !== 1) {
        throw new Error(`Video bindings mixed: ${JSON.stringify(snapshot.videoModelApiBindings)}`);
      }
      if (JSON.stringify(snapshot.audioModelApiBindings || {}) !== JSON.stringify(expectedConfig.audioModelApiBindings || {})) {
        throw new Error(`Audio bindings mixed: ${JSON.stringify(snapshot.audioModelApiBindings)}`);
      }
    };
    const selectConfig = (configId) => evaluate(`(() => {
      const select = document.querySelector('.wanjuan-global-config-presets-panel select');
      if (!select) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, ${JSON.stringify(configId)});
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    const applySelectedConfig = () => evaluate(`document.querySelector('.wanjuan-stored-global-config-apply')?.click() || true`);

    await waitFor(`typeof chrome?.storage?.local?.set === 'function'`, "desktop storage");
    await waitFor(`document.body && document.body.innerText.includes('设置')`, "initial app hydration");
    await sleep(1200);
    await evaluate(`new Promise(resolve => chrome.storage.local.set(${JSON.stringify({
      ...customConfig,
      apiConfigs: [customApi, utilityApi, backupApi],
      storedGlobalConfigs,
      globalTasks: [historicalVideoTask],
      activeStoredGlobalConfigId: "custom-preset",
      jixinBuiltinBaseConfigVersion: "2026-07-11-wan27-protocols-v3",
    })}, resolve))`, true);
    await send("Page.reload", { ignoreCache: true });
    await waitFor(`document.body && document.body.innerText.includes('设置')`, "app reload");
    await sleep(1200);
    await assertActiveConfig("custom-preset", "custom-api", customConfig);

    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent.replace(/\\s+/g, ' ').trim().endsWith('设置'));
      button?.click();
      return !!button;
    })()`);
    await waitFor(`[...document.querySelectorAll('button')].some((item) => item.textContent.includes('API 配置'))`, "settings API tab");
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('API 配置'));
      button?.click();
      return !!button;
    })()`);
    await waitFor(`!!document.querySelector('.wanjuan-stored-global-config-apply')`, "global config controls");

    await selectConfig("builtin-jixin-base");
    await sleep(700);
    await assertActiveConfig("custom-preset", "custom-api", customConfig);
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === '保存文档链接');
      const input = button?.parentElement?.querySelector('input');
      if (!button || !input) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'https://docs.example.com/jixin');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      button.click();
      return true;
    })()`);
    await sleep(700);
    await assertActiveConfig("custom-preset", "custom-api", customConfig);

    await applySelectedConfig();
    await sleep(1000);
    await assertActiveConfig("builtin-jixin-base", "jixin-default", jixinConfig);

    await evaluate(`(() => {
      globalThis.__wanjuanOriginalFetch = globalThis.fetch;
      globalThis.__wanjuanCapturedTaskRefresh = null;
      globalThis.fetch = async (url, options = {}) => {
        globalThis.__wanjuanCapturedTaskRefresh = {
          url: String(url),
          authorization: String(options?.headers?.Authorization || options?.headers?.authorization || ''),
        };
        return new Response(JSON.stringify({ status: 'running', progress: 42 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };
      const taskButton = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('任务清单'));
      taskButton?.click();
      return !!taskButton;
    })()`);
    await waitFor(`!!document.querySelector('.wanjuan-task-card-icon-action.is-refresh')`, "task refresh control");
    await evaluate(`document.querySelector('.wanjuan-task-card-icon-action.is-refresh')?.click() || true`);
    await waitFor(`!!globalThis.__wanjuanCapturedTaskRefresh`, "captured historical task refresh");
    const capturedTaskRefresh = await evaluate(`globalThis.__wanjuanCapturedTaskRefresh`);
    if (capturedTaskRefresh.url !== historicalVideoTask.requestProfile.pollUrl) {
      throw new Error(`Historical task used the wrong poll URL: ${JSON.stringify(capturedTaskRefresh)}`);
    }
    if (capturedTaskRefresh.authorization !== `Bearer ${customApi.key}`) {
      throw new Error(`Historical task used the wrong API key: ${JSON.stringify(capturedTaskRefresh)}`);
    }
    await evaluate(`(() => {
      globalThis.fetch = globalThis.__wanjuanOriginalFetch;
      document.querySelector('.wanjuan-task-card-icon-action.is-delete')?.click();
      return true;
    })()`);

    await selectConfig("custom-preset");
    await applySelectedConfig();
    await sleep(1200);
    await assertActiveConfig("custom-preset", "custom-api", customConfig);

    await selectConfig("builtin-jixin-base");
    await sleep(60);
    await applySelectedConfig();
    await sleep(80);
    await selectConfig("custom-preset");
    await sleep(60);
    await applySelectedConfig();
    await sleep(1500);
    await assertActiveConfig("custom-preset", "custom-api", customConfig);

    await send("Page.reload", { ignoreCache: true });
    await waitFor(`document.body && document.body.innerText.includes('设置')`, "second app reload");
    await sleep(1500);
    await assertActiveConfig("custom-preset", "custom-api", customConfig);

    await evaluate(`(() => {
      const settingsButton = [...document.querySelectorAll('button')].find((item) => item.textContent.replace(/\s+/g, ' ').trim().endsWith('设置'));
      settingsButton?.click();
      return !!settingsButton;
    })()`);
    await waitFor(`[...document.querySelectorAll('button')].some((item) => item.textContent.includes('API 配置'))`, "settings API tab after restart");
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('API 配置'));
      button?.click();
      return !!button;
    })()`);
    await waitFor(`[...document.querySelectorAll('button')].some((item) => item.textContent.includes('恢复默认配置'))`, "restore Jixin control");
    await evaluate(`(() => {
      window.confirm = () => true;
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('恢复默认配置'));
      button?.click();
      return !!button;
    })()`);
    await sleep(1000);
    const resetSnapshot = await readStorage(["activeStoredGlobalConfigId", "storedGlobalConfigs", "apiConfigs"]);
    if (!resetSnapshot.storedGlobalConfigs?.some((config) => config.id === "custom-preset")) {
      throw new Error(`Jixin reset deleted the custom preset: ${JSON.stringify(resetSnapshot.storedGlobalConfigs)}`);
    }
    if (!resetSnapshot.storedGlobalConfigs?.some((config) => config.id === "builtin-jixin-base")) {
      throw new Error(`Jixin reset did not preserve the built-in preset: ${JSON.stringify(resetSnapshot.storedGlobalConfigs)}`);
    }
    if (resetSnapshot.activeStoredGlobalConfigId !== "builtin-jixin-base") {
      throw new Error(`Jixin reset did not activate the built-in preset: ${JSON.stringify(resetSnapshot)}`);
    }
    const resetApiIds = new Set((resetSnapshot.apiConfigs || []).map((config) => config?.id));
    for (const requiredId of ["jixin-default", "custom-api", "utility-api", "backup-api"]) {
      if (!resetApiIds.has(requiredId)) {
        throw new Error(`Jixin reset deleted API config ${requiredId}: ${JSON.stringify(resetSnapshot.apiConfigs)}`);
      }
    }

    const preservedParameterKeys = [
      "imageCompatResolutions",
      "videoDurations",
      "videoResolutions",
      "videoAspectRatios",
      "seedanceDurations",
      "seedanceResolutions",
      "seedanceRatios",
      "tongyiWanxiangDurations",
      "tongyiWanxiangResolutions",
      "tongyiWanxiangRatios",
      "customPublicUploadConfig",
      "seedanceUploadMode",
      "seedanceVirtualPortraits",
    ];
    const explicitUserParameters = {
      imageCompatResolutions: "1111x777\n777x1111",
      videoDurations: "7\n13",
      videoResolutions: "1111x777\n777x1111",
      videoAspectRatios: "7:5\n5:7",
      seedanceDurations: "6\n12",
      seedanceResolutions: "540p\n900p",
      seedanceRatios: "4:3\n3:4",
      tongyiWanxiangDurations: "3\n9",
      tongyiWanxiangResolutions: "540P\n900P",
      tongyiWanxiangRatios: "4:3\n3:4",
      customPublicUploadConfig: { enabled: true, provider: "test-preserved-upload" },
      seedanceUploadMode: "custom-public",
      seedanceVirtualPortraits: [{ id: "preserved-portrait", name: "保留人像", assetId: "asset-preserved" }],
    };
    await evaluate(`new Promise(resolve => chrome.storage.local.set(${JSON.stringify(explicitUserParameters)}, resolve))`, true);
    await send("Page.reload", { ignoreCache: true });
    await waitFor(`document.body && document.body.innerText.includes('设置')`, "custom parameter hydration");
    await sleep(1500);
    const parametersBeforeEmptyMode = await readStorage(preservedParameterKeys);
    await evaluate(`(() => {
      const settingsButton = [...document.querySelectorAll('button')].find((item) => item.textContent.replace(/\s+/g, ' ').trim().endsWith('设置'));
      settingsButton?.click();
      return !!settingsButton;
    })()`);
    await waitFor(`[...document.querySelectorAll('button')].some((item) => item.textContent.includes('API 配置'))`, "settings API tab before custom empty mode");
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('API 配置'));
      button?.click();
      return !!button;
    })()`);
    await waitFor(`!!document.querySelector('.wanjuan-stored-global-config-apply')`, "custom empty mode control");
    await evaluate(`window.confirm = () => true`);
    await evaluate(`document.querySelector('.wanjuan-custom-empty-config-button')?.click() || true`);
    await sleep(1200);
    const emptyModeKeys = [
      "activeStoredGlobalConfigId",
      "storedGlobalConfigs",
      "apiConfigs",
      "textApiConfigId",
      "imageApiConfigId",
      "videoApiConfigId",
      "audioApiConfigId",
      "textApiUrl",
      "textApiKey",
      "imageApiUrl",
      "imageApiKey",
      "videoApiUrl",
      "videoApiKey",
      "audioApiUrl",
      "audioApiKey",
      "textModel",
      "drawingModel",
      "videoModel",
      "audioModel",
      "ttsMusicModel",
      "seedanceModel",
      "tianjiSeedanceModel",
      "tongyiWanxiangTextModels",
      "tongyiWanxiangReferenceImageModels",
      "tongyiWanxiangImageModels",
      "tongyiWanxiangEditModels",
      "modelProtocolRegistry",
      "textModelApiBindings",
      "textModelProtocolBindings",
      "imageModelApiBindings",
      "imageModelProtocolBindings",
      "videoModelApiBindings",
      "videoModelProtocolBindings",
      "audioModelApiBindings",
      "audioModelProtocolBindings",
      "configButlerApiUrl",
      "configButlerApiKey",
      "configButlerModel",
      "configButlerDocUrl",
      "configButlerTargetApiConfigId",
      "tianjiSeedanceConfig",
      ...preservedParameterKeys,
    ];
    const assertEmptyCustomMode = (snapshot, label) => {
      if (snapshot.activeStoredGlobalConfigId !== "custom-empty") {
        throw new Error(`${label}: custom empty mode was not active: ${JSON.stringify(snapshot.activeStoredGlobalConfigId)}`);
      }
      if (!Array.isArray(snapshot.apiConfigs) || snapshot.apiConfigs.length !== 0) {
        throw new Error(`${label}: API configs were not empty: ${JSON.stringify(snapshot.apiConfigs)}`);
      }
      const emptyStringKeys = [
        "textApiConfigId", "imageApiConfigId", "videoApiConfigId", "audioApiConfigId",
        "textApiUrl", "textApiKey", "imageApiUrl", "imageApiKey", "videoApiUrl", "videoApiKey", "audioApiUrl", "audioApiKey",
        "textModel", "drawingModel", "videoModel", "audioModel", "ttsMusicModel", "seedanceModel", "tianjiSeedanceModel",
        "tongyiWanxiangTextModels", "tongyiWanxiangReferenceImageModels", "tongyiWanxiangImageModels", "tongyiWanxiangEditModels",
        "configButlerApiUrl", "configButlerApiKey", "configButlerModel", "configButlerDocUrl", "configButlerTargetApiConfigId",
      ];
      for (const key of emptyStringKeys) {
        if (snapshot[key] !== "") throw new Error(`${label}: ${key} was not empty: ${JSON.stringify(snapshot[key])}`);
      }
      const emptyObjectKeys = [
        "modelProtocolRegistry", "textModelApiBindings", "textModelProtocolBindings",
        "imageModelApiBindings", "imageModelProtocolBindings", "videoModelApiBindings",
        "videoModelProtocolBindings", "audioModelApiBindings", "audioModelProtocolBindings",
      ];
      for (const key of emptyObjectKeys) {
        if (JSON.stringify(snapshot[key] || {}) !== "{}") throw new Error(`${label}: ${key} was not empty: ${JSON.stringify(snapshot[key])}`);
      }
      if (snapshot.tianjiSeedanceConfig !== undefined) {
        throw new Error(`${label}: Tianji authorization config was not removed: ${JSON.stringify(snapshot.tianjiSeedanceConfig)}`);
      }
      if (!snapshot.storedGlobalConfigs?.some((config) => config.id === "custom-preset") ||
          !snapshot.storedGlobalConfigs?.some((config) => config.id === "builtin-jixin-base")) {
        throw new Error(`${label}: saved global presets were removed: ${JSON.stringify(snapshot.storedGlobalConfigs)}`);
      }
      for (const key of preservedParameterKeys) {
        if (JSON.stringify(snapshot[key]) !== JSON.stringify(parametersBeforeEmptyMode[key])) {
          throw new Error(`${label}: model parameter ${key} changed: ${JSON.stringify({ before: parametersBeforeEmptyMode[key], after: snapshot[key] })}`);
        }
      }
    };
    assertEmptyCustomMode(await readStorage(emptyModeKeys), "after applying custom empty mode");

    await send("Page.reload", { ignoreCache: true });
    await waitFor(`document.body && document.body.innerText.includes('设置')`, "custom empty mode reload");
    await sleep(1500);
    assertEmptyCustomMode(await readStorage(emptyModeKeys), "after reloading custom empty mode");

    console.log(JSON.stringify({ ok: true, checks: [
      "custom config survives startup without Jixin model injection",
      "selecting a preset does not apply or persist it",
      "Jixin and custom presets switch model/binding state while preserving unrelated APIs",
      "historical async tasks retain their original poll URL and credentials",
      "rapid consecutive switches keep the last applied config",
      "custom config survives autosave and restart without mixing",
      "restoring Jixin keeps user-created global presets",
      "custom empty mode clears API/model identity while preserving presets and model parameters",
      "custom empty mode survives restart without reseeding Jixin",
    ] }, null, 2));
  } finally {
    try { ws?.close(); } catch {}
    child.kill("SIGTERM");
    await sleep(500);
    if (!child.killed) child.kill("SIGKILL");
    fs.rmSync(userDataPath, { recursive: true, force: true });
    if (stderr && process.env.WANJUAN_CONFIG_TEST_VERBOSE === "1") process.stderr.write(stderr);
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
