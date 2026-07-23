const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-enterprise-gateway-"));
const fakeElectron = {
  app: {
    getPath: () => tempRoot,
    getVersion: () => "1.3.9-test",
  },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (value) => Buffer.from(`encrypted:${value}`, "utf8"),
    decryptString: (buffer) => buffer.toString("utf8").replace(/^encrypted:/, ""),
  },
};

const originalLoad = Module._load;
const originalFetch = global.fetch;
const enterpriseUploadCalls = [];
const usageSummaryCalls = [];
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron" || request === "electron/main") return fakeElectron;
  if (request === "./uploaders/custom-host.cjs" && /enterprise-gateway\.cjs$/.test(String(parent?.filename || ""))) {
    return {
      uploadToCustomPublicHost: async (payload) => {
        enterpriseUploadCalls.push({
          bytes: fs.readFileSync(payload.localPath),
          config: payload.customUpload,
          filename: payload.filename,
          mime: payload.mime,
        });
        return { ok: true, url: "https://cdn.example.net/enterprise-upload.bin" };
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const accountKeyPair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const accountPublicJwk = accountKeyPair.publicKey.export({ format: "jwk" });
accountPublicJwk.kid = "account-test-key";
accountPublicJwk.alg = "RS256";
accountPublicJwk.use = "sig";
const upstreamCalls = [];

function jwt(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  const signingInput = `${encode({ alg: "RS256", typ: "JWT", kid: accountPublicJwk.kid })}.${encode(payload)}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), accountKeyPair.privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

global.fetch = async (url, options = {}) => {
  const parsed = new URL(url);
  if (parsed.pathname === "/.well-known/jwks.json") {
    return new Response(JSON.stringify({ keys: [accountPublicJwk] }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (parsed.pathname.endsWith("/heartbeat")) {
    assert.ok(options.headers["x-wanjuan-signature"]);
    return new Response(JSON.stringify({ ok: true, heartbeatInterval: 60, policyVersion: 1 }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (parsed.pathname.endsWith("/usage-summary")) {
    usageSummaryCalls.push(JSON.parse(String(options.body || "{}")));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (parsed.pathname.endsWith("/control-snapshot")) {
    return new Response(JSON.stringify({
      organizationId: "org_test",
      gatewayId: "gw_test",
      policyVersion: 1,
      timezone: "Asia/Shanghai",
      quotaDefaults: [{ capability_key: "video_generation", enabled: true, limit_value: 1, unit: "successful_tasks" }],
      memberQuotaOverrides: [],
      events: [],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (parsed.hostname === "api.example.com") {
    const body = options.body ? Buffer.from(options.body).toString("utf8") : "";
    upstreamCalls.push({
      method: String(options.method || "GET"),
      pathname: parsed.pathname,
      queryKey: parsed.searchParams.get("key") || "",
      authorization: String(options.headers?.authorization || options.headers?.Authorization || ""),
      xApiKey: String(options.headers?.["x-api-key"] || ""),
      memberAuthorization: String(options.headers?.["x-member-authorization"] || ""),
      body,
    });
    if (parsed.pathname === "/v1/redirect") {
      return new Response(null, { status: 302, headers: { location: "https://cdn.example.net/result.mp4" } });
    }
    return new Response(JSON.stringify({ ok: true, taskId: "task_enterprise", status: parsed.pathname.includes("tasks") ? "completed" : "queued" }), {
      status: 200,
      headers: { "content-type": "application/json", "x-upstream": "enterprise-test" },
    });
  }
  if (parsed.hostname === "cdn.example.net") {
    upstreamCalls.push({
      method: String(options.method || "GET"),
      pathname: parsed.pathname,
      authorization: String(options.headers?.authorization || options.headers?.Authorization || ""),
      body: "",
    });
    return new Response("video-bytes", { status: 200, headers: { "content-type": "video/mp4" } });
  }
  return new Response(JSON.stringify({ error: "not found", code: "NOT_FOUND" }), { status: 404, headers: { "content-type": "application/json" } });
};

function fetchHealth(port) {
  return new Promise((resolve, reject) => {
    const request = https.get({
      hostname: "127.0.0.1",
      port,
      path: "/health",
      rejectUnauthorized: false,
      timeout: 5000,
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) }));
    });
    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error("health request timeout")));
  });
}

async function run() {
  const gateway = require("../electron/main/enterprise-gateway.cjs");
  const gatewayClient = require("../electron/main/enterprise-gateway-client.cjs");
  const secret = "sk-enterprise-secret-value";
  const snapshot = {
    schemaVersion: 1,
    backupSchemaVersion: 4,
    version: 1,
    createdAt: Date.now(),
    sourceAppVersion: "1.3.9-test",
    hash: "sha256:test-one",
    modules: {
      settings: {
        chromeStorage: {
          apiConfigs: [{ id: "api_one", url: "https://api.example.com", key: { $secretRef: "secret_1" } }],
          videoModelApiBindings: { model_one: "api_one" },
          customPublicUploadConfig: {
            endpoint: "https://upload.example.com/files",
            headers: { $secretRef: "secret_upload_headers" },
            fileField: "file",
          },
        },
        selectedSections: ["api", "models", "cloud"],
      },
    },
  };

  const initialized = await gateway.initializeEnterpriseGateway({
    organization: { id: "org_test", name: "测试企业" },
    gatewayName: "测试网关",
    accountBaseUrl: "https://account.example.com",
    snapshot,
    secrets: [
      { id: "secret_1", type: "api_key", path: "apiConfigs.0.key", value: secret },
      { id: "secret_upload_headers", type: "custom_header", path: "customPublicUploadConfig.headers", value: "Authorization=Bearer upload-secret" },
    ],
    autoStart: true,
  });
  assert.equal(initialized.ok, true);
  assert.equal(initialized.status.running, true);
  assert.equal(Buffer.from(initialized.activation.publicKey, "base64").length, 32);
  assert.ok(initialized.activation.certificateFingerprint.startsWith("sha256/"));

  gateway.completeEnterpriseGatewayActivation({ gatewayId: "gw_test", status: "active" });

  const health = await fetchHealth(initialized.status.port);
  assert.equal(health.status, 200);
  assert.equal(health.body.protocol, "wanjuan-enterprise-gateway");
  assert.equal(health.body.organizationId, "org_test");

  const now = Math.floor(Date.now() / 1000);
  const accessToken = jwt({
    iss: "https://account.example.com",
    aud: "wanjuan-desktop",
    sub: "user_test",
    sid: "session_test",
    did: "device_test",
    iat: now,
    exp: now + 600,
  });
  const gatewayGrant = jwt({
    typ: "wanjuan-gateway-grant",
    iss: "https://account.example.com",
    aud: "wanjuan-local-gateway",
    sub: "user_test",
    org: "org_test",
    gateway: "gw_test",
    device: "device_test",
    role: "member",
    policyVersion: 1,
    iat: now,
    exp: now + 600,
  });
  const sessionResponse = await gatewayClient.requestPinnedJson(`https://127.0.0.1:${initialized.status.port}`, "/workspace/session", {
    method: "POST",
    token: accessToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
    body: { signedGatewayGrant: gatewayGrant, deviceId: "device_test", appVersion: "1.3.9-test" },
  });
  assert.ok(sessionResponse.value.workspaceToken);
  assert.equal(sessionResponse.value.organization.role, "member");
  const configResponse = await gatewayClient.requestPinnedJson(`https://127.0.0.1:${initialized.status.port}`, "/workspace/config-snapshot", {
    token: sessionResponse.value.workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
  });
  assert.equal(configResponse.value.hash, snapshot.hash);

  const gatewayUrl = `https://127.0.0.1:${initialized.status.port}`;
  fs.writeFileSync(path.join(tempRoot, "account-session.json"), JSON.stringify({
    version: 2,
    enterprise: {
      mode: "member",
      organization: { id: "org_test", name: "测试企业", role: "member" },
      gatewayId: "gw_test",
      gatewayUrl,
      certificateFingerprint: initialized.activation.certificateFingerprint,
      workspaceTokenEncrypted: Buffer.from(`encrypted:${sessionResponse.value.workspaceToken}`, "utf8").toString("base64"),
      expiresAt: Date.now() + 60 * 60 * 1000,
    },
  }, null, 2));
  gatewayClient.writeEnterpriseSnapshotCache({
    organizationId: "org_test",
    gatewayId: "gw_test",
    gatewayUrl,
    certificateFingerprint: initialized.activation.certificateFingerprint,
    snapshot,
    cachedAt: Date.now(),
  });
  const accountService = require("../electron/main/account-service.cjs");
  const submitResult = await accountService.proxyEnterpriseRequest({
    requestId: "submit-enterprise-video-1",
    url: "https://api.example.com/v1/videos?key=member-placeholder",
    method: "POST",
    headers: { authorization: "Bearer member-personal-secret", "content-type": "application/json" },
    bodyBase64: Buffer.from(JSON.stringify({ model: "model_one", prompt: "test" }), "utf8").toString("base64"),
    requestTimeout: 5000,
  });
  assert.equal(submitResult.handled, true);
  assert.equal(submitResult.response.status, 200);
  const gatewayTaskId = new Map(submitResult.response.headers).get("x-wanjuan-gateway-task-id");
  assert.ok(gatewayTaskId);
  assert.equal(upstreamCalls.at(-1).authorization, `Bearer ${secret}`);
  assert.equal(upstreamCalls.at(-1).queryKey, secret);
  assert.equal(upstreamCalls.at(-1).body.includes("member-personal-secret"), false);
  const upstreamCountAfterSubmit = upstreamCalls.length;
  await assert.rejects(
    accountService.proxyEnterpriseRequest({
      requestId: "submit-enterprise-video-1",
      url: "https://api.example.com/v1/videos?key=member-placeholder",
      method: "POST",
      headers: { authorization: "Bearer member-personal-secret", "content-type": "application/json" },
      bodyBase64: Buffer.from(JSON.stringify({ model: "model_one", prompt: "duplicate" }), "utf8").toString("base64"),
      requestTimeout: 5000,
    }),
    /请勿重复执行/,
  );
  assert.equal(upstreamCalls.length, upstreamCountAfterSubmit);

  const pollResult = await accountService.proxyEnterpriseRequest({
    url: "https://api.example.com/v1/videos/tasks/task_enterprise",
    method: "GET",
    headers: { "x-api-key": "stale-member-key" },
    requestTimeout: 5000,
  });
  assert.equal(pollResult.handled, true);
  assert.equal(upstreamCalls.at(-1).method, "GET");
  assert.equal(upstreamCalls.at(-1).authorization, "");
  assert.equal(upstreamCalls.at(-1).xApiKey, secret);
  const taskResponse = await gatewayClient.requestPinnedJson(gatewayUrl, `/workspace/tasks/${encodeURIComponent(gatewayTaskId)}`, {
    token: sessionResponse.value.workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
  });
  assert.equal(taskResponse.value.task.status, "completed");
  assert.equal(taskResponse.value.task.remoteTaskId, "task_enterprise");
  const usageResponse = await gatewayClient.requestPinnedJson(gatewayUrl, "/workspace/usage", {
    token: sessionResponse.value.workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
  });
  const videoUsage = usageResponse.value.capabilities.find((item) => item.capability === "video_generation");
  assert.equal(videoUsage.successful, 1);
  assert.equal(videoUsage.reserved, 0);
  assert.equal(videoUsage.remaining, 0);
  await gateway.syncGatewayControlPlane();
  assert.equal(usageSummaryCalls.at(-1).successfulByCapability.video_generation, 1);
  assert.equal(usageSummaryCalls.at(-1).activeTasks, 0);
  await assert.rejects(
    accountService.proxyEnterpriseRequest({
      requestId: "quota-second-video",
      url: "https://api.example.com/v1/videos",
      method: "POST",
      headers: { authorization: "Bearer member-personal-secret", "content-type": "application/json" },
      bodyBase64: Buffer.from(JSON.stringify({ model: "model_one", prompt: "second" }), "utf8").toString("base64"),
      requestTimeout: 5000,
    }),
    /额度已用完/,
  );
  const redirectedResult = await accountService.proxyEnterpriseRequest({
    url: "https://api.example.com/v1/redirect",
    method: "GET",
    headers: { authorization: "Bearer stale-member-key" },
    requestTimeout: 5000,
  });
  assert.equal(Buffer.from(redirectedResult.response.bodyBase64, "base64").toString("utf8"), "video-bytes");
  assert.equal(upstreamCalls.at(-1).pathname, "/result.mp4");
  assert.equal(upstreamCalls.at(-1).authorization, "");
  assert.equal((await accountService.proxyEnterpriseRequest({ url: "https://public.example.net/status", method: "GET" })).handled, false);

  const uploadBytes = Buffer.from("enterprise-stream-upload-payload".repeat(2048), "utf8");
  const uploadResult = await accountService.proxyEnterpriseUpload("custom", {
    bytes: uploadBytes,
    filename: "reference-video.mp4",
    mime: "video/mp4",
    kind: "video",
  });
  assert.equal(uploadResult.handled, true);
  assert.equal(uploadResult.response.url, "https://cdn.example.net/enterprise-upload.bin");
  assert.equal(enterpriseUploadCalls.length, 1);
  assert.deepEqual(enterpriseUploadCalls[0].bytes, uploadBytes);
  assert.equal(enterpriseUploadCalls[0].config.headers, "Authorization=Bearer upload-secret");
  assert.equal(enterpriseUploadCalls[0].mime, "video/mp4");

  await assert.rejects(
    gatewayClient.requestPinnedJson(gatewayUrl, "/workspace/proxy-fetch", {
      method: "POST",
      token: sessionResponse.value.workspaceToken,
      certificateFingerprint: initialized.activation.certificateFingerprint,
      body: { managedApiConfigId: "api_one", url: "https://evil.example.net/v1/videos", method: "POST" },
    }),
    /不属于托管 API 配置/,
  );
  await assert.rejects(
    gatewayClient.requestPinnedJson(gatewayUrl, "/health", {
      certificateFingerprint: "sha256/invalid",
    }),
    /指纹不匹配/,
  );

  const gatewayRoot = path.join(tempRoot, "enterprise-gateway");
  const diskText = fs.readdirSync(gatewayRoot)
    .filter((filename) => fs.statSync(path.join(gatewayRoot, filename)).isFile())
    .map((filename) => fs.readFileSync(path.join(gatewayRoot, filename), "utf8"))
    .join("\n");
  assert.equal(diskText.includes(secret), false);
  assert.equal(diskText.includes("upload-secret"), false);
  const taskStoreText = fs.readFileSync(path.join(gatewayRoot, "tasks.json"), "utf8");
  assert.equal(taskStoreText.includes('"prompt"'), false);
  assert.equal(taskStoreText.includes("member-personal-secret"), false);
  assert.equal(fs.readFileSync(path.join(gatewayRoot, "config-snapshot.json"), "utf8").includes("$secretRef"), true);

  const nextSnapshot = { ...snapshot, version: 2, hash: "sha256:test-two" };
  const published = await gateway.publishEnterpriseGatewaySnapshot({
    snapshot: nextSnapshot,
    secrets: [
      { id: "secret_1", type: "api_key", path: "apiConfigs.0.key", value: secret },
      { id: "secret_upload_headers", type: "custom_header", path: "customPublicUploadConfig.headers", value: "Authorization=Bearer upload-secret" },
    ],
  });
  assert.equal(published.status.configVersion, 2);

  await gateway.stopEnterpriseGateway();
  assert.equal(gateway.getEnterpriseGatewayStatus().running, false);
  await assert.rejects(
    accountService.proxyEnterpriseRequest({ url: "https://api.example.com/v1/videos/tasks/task_enterprise", method: "GET", requestTimeout: 1000 }),
    /ECONNREFUSED|企业网关|socket|connect/i,
  );
  await assert.rejects(
    accountService.proxyEnterpriseUpload("custom", { bytes: uploadBytes, filename: "offline.mp4", mime: "video/mp4" }, { timeoutMs: 1000 }),
    /ECONNREFUSED|企业网关|socket|connect/i,
  );
  await gateway.startEnterpriseGateway();
  assert.equal(gateway.getEnterpriseGatewayStatus().running, true);
  await gateway.stopEnterpriseGateway({ disableAutoStart: true });
  assert.equal(gateway.getEnterpriseGatewayStatus().autoStart, false);

  console.log("enterprise gateway: TLS pinning, streaming upload, task ledger, quota settlement and no-fallback passed");
}

run().finally(() => {
  Module._load = originalLoad;
  global.fetch = originalFetch;
  fs.rmSync(tempRoot, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
