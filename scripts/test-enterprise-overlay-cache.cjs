const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");

const overlayState = { ok: true, active: false, settings: {} };
const local = new Map();
const originalWarn = console.warn;
console.warn = () => {};
global.window = {
  indexedDB: undefined,
  localStorage: {
    getItem: (key) => local.has(key) ? local.get(key) : null,
    setItem: (key, value) => local.set(key, String(value)),
    removeItem: (key) => local.delete(key),
  },
  dispatchEvent: () => true,
  CustomEvent: class CustomEvent {},
};

const constants = {
  STORAGE_KEY: "__storage__",
  STORAGE_DB_NAME: "test-storage",
  STORAGE_DB_VERSION: 1,
  STORAGE_DB_STORE: "store",
  PERFORMANCE_PROFILE_STORAGE_KEY: "profile",
  PERFORMANCE_PROFILE_CUSTOM_KEY: "profile-custom",
  PERFORMANCE_PROFILE_PRESETS: { balanced: { layeredRunMaxConcurrency: 2, aiGenerateLimit: 1, aiChatLimit: 1, aiSubmitLimit: 1, aiPollLimit: 2 } },
};
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request.endsWith("/constants.cjs")) return constants;
  if (request.endsWith("/runtime.cjs")) {
    return { ipcRenderer: { invoke: async () => ({ ...overlayState, settings: { ...overlayState.settings } }) } };
  }
  if (request.endsWith("/chrome-shim.cjs")) {
    return { pickStorage: (keys, value) => {
      if (keys == null) return value;
      const list = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(list.filter((key) => Object.prototype.hasOwnProperty.call(value || {}, key)).map((key) => [key, value[key]]));
    } };
  }
  if (request.endsWith("/boot-theme.cjs")) return { mirrorBootThemeFromStore: () => {} };
  return originalLoad.call(this, request, parent, isMain);
};

const storagePath = require.resolve("../electron/preload/storage.cjs");
delete require.cache[storagePath];
const storage = require(storagePath);

(async () => {
  const initial = await storage.getDesktopStorageItems(["managedModel"]);
  assert.equal(initial.managedModel, undefined);

  overlayState.active = true;
  overlayState.settings = { managedModel: "gateway-model" };
  const stale = await storage.getDesktopStorageItems(["managedModel"]);
  assert.equal(stale.managedModel, undefined, "the first inactive overlay is cached until invalidated");

  storage.resetEnterpriseStorageOverlay();
  const refreshed = await storage.getDesktopStorageItems(["managedModel"]);
  assert.equal(refreshed.managedModel, "gateway-model");

  await storage.setDesktopStorageItems({ managedModel: "member-value", localOnly: "local-value" });
  const afterWrite = await storage.getDesktopStorageItems(["managedModel", "localOnly"]);
  assert.deepEqual(afterWrite, { managedModel: "gateway-model", localOnly: "local-value" });

  const root = path.resolve(__dirname, "..");
  const bridgeSource = fs.readFileSync(path.join(root, "electron/preload/bridge-api.cjs"), "utf8");
  for (const operation of [
    "accountBootstrap",
    "accountLogin",
    "accountRefresh",
    "accountLogout",
    "accountConnectEnterprise",
    "accountRefreshEnterpriseConfig",
    "accountDisconnectEnterprise",
  ]) {
    const start = bridgeSource.indexOf(`${operation}: async`);
    assert.notEqual(start, -1, `${operation} bridge wrapper must exist`);
    assert.notEqual(bridgeSource.slice(start, start + 500).indexOf("resetEnterpriseStorageOverlay()"), -1, `${operation} must invalidate the overlay cache`);
  }

  const refreshSource = fs.readFileSync(path.join(root, "src/renderer/hooks/use_refreshGlobalTask.ts"), "utf8");
  const tianjiBootstrap = refreshSource.indexOf("wanjuanDesktop?.accountBootstrap?.()");
  const tianjiConfigRead = refreshSource.indexOf("wanjuanGetSyncedTianjiSeedanceConfig()");
  assert.notEqual(tianjiBootstrap, -1);
  assert.ok(tianjiBootstrap < tianjiConfigRead, "Tianji task refresh must bootstrap the enterprise overlay before reading its config");
  console.warn = originalWarn;
  console.log("enterprise storage overlay cache invalidation passed");
})().catch((error) => {
  console.warn = originalWarn;
  console.error(error);
  process.exitCode = 1;
});
