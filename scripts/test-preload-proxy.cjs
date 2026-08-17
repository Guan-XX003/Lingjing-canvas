const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "./runtime.cjs") return { ipcRenderer: {} };
  if (request === "./storage.cjs") return { getPerformanceFetchLimit: () => 1 };
  return originalLoad.call(this, request, parent, isMain);
};

try {
  const { buildDesktopProxyFetchBridgePayload } = require("../electron/preload/fetch-proxy.cjs");
  const poll = buildDesktopProxyFetchBridgePayload({
    requestId: "fixture-poll",
    url: "https://mock-upstream.invalid/history",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { task_id: "synthetic" },
    enterpriseRequestKind: "POLL",
  });
  assert.equal(poll.enterpriseRequestKind, "poll");
  assert.deepEqual(JSON.parse(Buffer.from(poll.bodyBase64, "base64").toString("utf8")), { task_id: "synthetic" });

  const submit = buildDesktopProxyFetchBridgePayload({
    url: "https://mock-upstream.invalid/submit",
    method: "POST",
    enterpriseRequestKind: "submit",
  });
  assert.equal(submit.enterpriseRequestKind, "submit");

  const legacy = buildDesktopProxyFetchBridgePayload({
    url: "https://mock-upstream.invalid/legacy",
    method: "POST",
    enterpriseRequestKind: "invalid",
  });
  assert.equal(legacy.enterpriseRequestKind, undefined);
  console.log("preload proxy: enterprise request kind survives IPC payload normalization");
} finally {
  Module._load = originalLoad;
}
