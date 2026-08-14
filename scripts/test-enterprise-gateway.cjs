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
let seedancePollCount = 0;
let controlMembers = [
  { user_id: "user_test", role: "member", status: "active", expires_at: null },
  { user_id: "user_other", role: "member", status: "active", expires_at: null },
  { user_id: "user_admin", role: "admin", status: "active", expires_at: null },
];

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
      members: controlMembers,
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
      contentType: String(options.headers?.["content-type"] || options.headers?.["Content-Type"] || ""),
      body,
    });
    if (parsed.pathname === "/v1/redirect") {
      return new Response(null, { status: 302, headers: { location: "https://cdn.example.net/result.mp4" } });
    }
    if (parsed.pathname === "/v1/videos") {
      return new Response(JSON.stringify({ data: { execute_id: "seedance_execute_fixture", status: "queued" } }), {
        status: 200,
        headers: { "content-type": "application/json", "x-upstream": "enterprise-test" },
      });
    }
    if (parsed.pathname === "/api/cut/model/coze-run-seedance-special-history") {
      seedancePollCount += 1;
      const completed = seedancePollCount >= 2;
      return new Response(JSON.stringify({ data: {
        execute_id: "seedance_execute_fixture",
        status: completed ? "completed" : "running",
        ...(completed ? { result: { video_url: "https://cdn.example.net/fixture-result.mp4" } } : {}),
      } }), {
        status: 200,
        headers: { "content-type": "application/json", "x-upstream": "enterprise-test" },
      });
    }
    return new Response(JSON.stringify({ ok: true, taskId: "task_enterprise", status: "completed" }), {
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

function rawGatewayRequest(port, pathname, options = {}) {
  const body = Buffer.from(String(options.body || ""), "utf8");
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: "127.0.0.1",
      port,
      path: pathname,
      method: options.method || "GET",
      rejectUnauthorized: false,
      timeout: 5000,
      headers: {
        accept: "application/json",
        ...(body.length ? { "content-type": "application/json", "content-length": body.length } : {}),
        ...(options.headers || {}),
      },
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let value = {};
        try { value = text ? JSON.parse(text) : {}; } catch {}
        resolve({ status: response.statusCode, headers: response.headers, value });
      });
    });
    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error("raw gateway request timeout")));
    if (body.length) request.write(body);
    request.end();
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
  await gateway.syncGatewayControlPlane();
  const createWorkspaceSession = async (userId, role = "member") => {
    const deviceId = `device_${userId}`;
    const accessToken = jwt({
      iss: "https://account.example.com",
      aud: "wanjuan-desktop",
      sub: userId,
      sid: `session_${userId}`,
      did: deviceId,
      iat: now,
      exp: now + 600,
    });
    const gatewayGrant = jwt({
      typ: "wanjuan-gateway-grant",
      iss: "https://account.example.com",
      aud: "wanjuan-local-gateway",
      sub: userId,
      org: "org_test",
      gateway: "gw_test",
      device: deviceId,
      role,
      policyVersion: 1,
      iat: now,
      exp: now + 600,
    });
    return gatewayClient.requestPinnedJson(`https://127.0.0.1:${initialized.status.port}`, "/workspace/session", {
      method: "POST",
      token: accessToken,
      certificateFingerprint: initialized.activation.certificateFingerprint,
      body: { signedGatewayGrant: gatewayGrant, deviceId, appVersion: "1.3.9-test" },
    });
  };
  const sessionResponse = await createWorkspaceSession("user_test", "member");
  const otherSessionResponse = await createWorkspaceSession("user_other", "member");
  const adminSessionResponse = await createWorkspaceSession("user_admin", "admin");
  assert.ok(sessionResponse.value.workspaceToken);
  assert.equal(sessionResponse.value.organization.role, "member");
  const configResponse = await gatewayClient.requestPinnedJson(`https://127.0.0.1:${initialized.status.port}`, "/workspace/config-snapshot", {
    token: sessionResponse.value.workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
  });
  assert.equal(configResponse.value.hash, snapshot.hash);

  const gatewayUrl = `https://127.0.0.1:${initialized.status.port}`;
  const teamRequest = (workspaceToken, pathname, options = {}) => gatewayClient.requestPinnedJson(gatewayUrl, pathname, {
    token: workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
    ...options,
  });
  const accountAccessOnlyToken = jwt({
    iss: "https://account.example.com",
    aud: "wanjuan-desktop",
    sub: "user_test",
    sid: "access-only-session",
    did: "access-only-device",
    iat: now,
    exp: now + 600,
  });
  await assert.rejects(
    teamRequest(accountAccessOnlyToken, "/workspace/team-templates"),
    (error) => error.code === "WORKSPACE_SESSION_EXPIRED" && error.status === 401,
  );
  const rawTeamHeaders = {
    authorization: `Bearer ${sessionResponse.value.workspaceToken}`,
    "idempotency-key": "team-invalid-request-0001",
  };
  const malformedTeamRequest = await rawGatewayRequest(initialized.status.port, "/workspace/team-templates", {
    method: "POST",
    headers: rawTeamHeaders,
    body: "{",
  });
  assert.equal(malformedTeamRequest.status, 400);
  assert.equal(malformedTeamRequest.value.code, "TEAM_TEMPLATE_JSON_INVALID");
  const oversizedTeamRequest = await rawGatewayRequest(initialized.status.port, "/workspace/team-templates", {
    method: "POST",
    headers: rawTeamHeaders,
    body: JSON.stringify({ title: "Too large", content: "x".repeat(70 * 1024) }),
  });
  assert.equal(oversizedTeamRequest.status, 413);
  assert.equal(oversizedTeamRequest.value.code, "TEAM_TEMPLATE_BODY_TOO_LARGE");
  const unsupportedTeamMethod = await rawGatewayRequest(initialized.status.port, "/workspace/team-templates", {
    method: "PUT",
    headers: { authorization: `Bearer ${sessionResponse.value.workspaceToken}` },
  });
  assert.equal(unsupportedTeamMethod.status, 405);
  assert.equal(unsupportedTeamMethod.headers.allow, "GET, POST");
  const templateInput = {
    title: "Synthetic team template",
    content: "Synthetic prompt content used only by the isolated gateway test.",
    description: "Initial description",
    type: "video",
    tags: ["test", "team"],
    modelHint: "model_one",
    providerHint: "provider_test",
    generationMode: "text-to-video",
    parameters: { aspectRatio: "16:9", resolution: "720p", durationSeconds: 5 },
  };
  const createdTeamTemplate = await teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates", {
    method: "POST",
    headers: { "idempotency-key": "team-create-test-0001" },
    body: templateInput,
  });
  assert.equal(createdTeamTemplate.status, 201);
  assert.equal(createdTeamTemplate.value.item.author.id, "user_test");
  assert.equal(createdTeamTemplate.value.item.permissions.canEdit, true);
  const teamTemplateId = createdTeamTemplate.value.item.id;

  const idempotentRetry = await teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates", {
    method: "POST",
    headers: { "idempotency-key": "team-create-test-0001" },
    body: templateInput,
  });
  assert.equal(idempotentRetry.value.item.id, teamTemplateId);
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates", {
      method: "POST",
      headers: { "idempotency-key": "team-create-test-0001" },
      body: { ...templateInput, title: "Different payload" },
    }),
    (error) => error.code === "IDEMPOTENCY_CONFLICT" && error.status === 409,
  );
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates", {
      method: "POST",
      headers: { "idempotency-key": "team-create-danger-0001" },
      body: { ...templateInput, apiKey: "must-be-rejected" },
    }),
    (error) => error.code === "TEAM_TEMPLATE_DTO_REJECTED" && error.status === 400,
  );

  const secondTeamTemplate = await teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates", {
    method: "POST",
    headers: { "idempotency-key": "team-create-test-0002" },
    body: { ...templateInput, title: "Second synthetic template", content: "Second synthetic content." },
  });
  const secondTemplateId = secondTeamTemplate.value.item.id;
  const otherListFirstPage = await teamRequest(otherSessionResponse.value.workspaceToken, "/workspace/team-templates?limit=1");
  assert.equal(otherListFirstPage.value.items.length, 1);
  assert.ok(otherListFirstPage.value.nextCursor);
  assert.equal(otherListFirstPage.value.items[0].permissions.canEdit, false);
  const otherListSecondPage = await teamRequest(otherSessionResponse.value.workspaceToken,
    `/workspace/team-templates?limit=1&cursor=${encodeURIComponent(otherListFirstPage.value.nextCursor)}`);
  assert.equal(otherListSecondPage.value.items.length, 1);

  await assert.rejects(
    teamRequest(otherSessionResponse.value.workspaceToken, `/workspace/team-templates/${encodeURIComponent(teamTemplateId)}`, {
      method: "PATCH",
      headers: { "if-match": '"1"' },
      body: { description: "Unauthorized edit" },
    }),
    (error) => error.code === "TEAM_TEMPLATE_FORBIDDEN" && error.status === 403,
  );
  const authorPatch = await teamRequest(sessionResponse.value.workspaceToken, `/workspace/team-templates/${encodeURIComponent(teamTemplateId)}`, {
    method: "PATCH",
    headers: { "if-match": '"1"' },
    body: { description: "Updated description" },
  });
  assert.equal(authorPatch.value.item.revision, 2);
  assert.equal(authorPatch.value.item.description, "Updated description");
  assert.equal(authorPatch.value.item.title, templateInput.title);
  assert.equal(authorPatch.value.item.content, templateInput.content);
  assert.deepEqual(authorPatch.value.item.parameters, templateInput.parameters);
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, `/workspace/team-templates/${encodeURIComponent(teamTemplateId)}`, {
      method: "PATCH",
      headers: { "if-match": '"1"' },
      body: { description: "Stale edit" },
    }),
    (error) => error.code === "TEAM_TEMPLATE_CONFLICT" && error.status === 409 && error.details.revision === 2,
  );

  const hostOwnerPatch = await gateway.invokeEnterpriseTeamTemplatesAsHost({
    operation: "update",
    payload: { id: teamTemplateId, input: { title: "Host managed title" }, revision: 2 },
    session: {
      userId: "user_host_owner",
      organizationId: "org_test",
      gatewayId: "gw_test",
      role: "owner",
      trustedHost: true,
    },
  });
  assert.equal(hostOwnerPatch.item.title, "Host managed title");
  assert.equal(hostOwnerPatch.item.content, templateInput.content);
  assert.equal(hostOwnerPatch.item.revision, 3);
  await assert.rejects(
    gateway.invokeEnterpriseTeamTemplatesAsHost({
      operation: "list",
      payload: {},
      session: { userId: "user_host_owner", organizationId: "org_test", gatewayId: "gw_test", role: "owner" },
    }),
    (error) => error.code === "TEAM_TEMPLATE_HOST_AUTH_REQUIRED",
  );

  const adminDelete = await teamRequest(adminSessionResponse.value.workspaceToken, `/workspace/team-templates/${encodeURIComponent(secondTemplateId)}`, {
    method: "DELETE",
    headers: { "if-match": '"1"' },
  });
  assert.equal(adminDelete.value.tombstone.revision, 2);
  const listAfterDelete = await teamRequest(otherSessionResponse.value.workspaceToken, "/workspace/team-templates");
  assert.equal(listAfterDelete.value.items.some((item) => item.id === secondTemplateId), false);

  const initialChanges = await teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates/changes?limit=100");
  assert.ok(initialChanges.value.nextCursor);
  assert.equal(initialChanges.value.tombstones.some((item) => item.id === secondTemplateId), true);
  const authorDelete = await teamRequest(sessionResponse.value.workspaceToken, `/workspace/team-templates/${encodeURIComponent(teamTemplateId)}`, {
    method: "DELETE",
    headers: { "if-match": '"3"' },
  });
  assert.equal(authorDelete.value.tombstone.revision, 4);
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates", {
      method: "POST",
      headers: { "idempotency-key": "team-create-test-0001" },
      body: templateInput,
    }),
    (error) => error.code === "IDEMPOTENCY_RESOURCE_GONE" && error.status === 409,
  );
  const incrementalChanges = await teamRequest(sessionResponse.value.workspaceToken,
    `/workspace/team-templates/changes?cursor=${encodeURIComponent(initialChanges.value.nextCursor)}`);
  assert.equal(incrementalChanges.value.items.length, 0);
  assert.equal(incrementalChanges.value.tombstones.length, 1);
  assert.equal(incrementalChanges.value.tombstones[0].id, teamTemplateId);

  const persistentTemplate = await teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates", {
    method: "POST",
    headers: { "idempotency-key": "team-create-persist-001" },
    body: { ...templateInput, title: "Persistent synthetic template", content: "Persists across gateway restart." },
  });
  const persistentTemplateId = persistentTemplate.value.item.id;

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
    enterpriseRequestKind: "submit",
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
      enterpriseRequestKind: "submit",
      headers: { authorization: "Bearer member-personal-secret", "content-type": "application/json" },
      bodyBase64: Buffer.from(JSON.stringify({ model: "model_one", prompt: "duplicate" }), "utf8").toString("base64"),
      requestTimeout: 5000,
    }),
    /请勿重复执行/,
  );
  assert.equal(upstreamCalls.length, upstreamCountAfterSubmit);

  const pollResult = await accountService.proxyEnterpriseRequest({
    url: "https://api.example.com/api/cut/model/coze-run-seedance-special-history",
    method: "POST",
    enterpriseRequestKind: "poll",
    bodyBase64: Buffer.from(JSON.stringify({ task_id: "seedance_execute_fixture", execute_id: "seedance_execute_fixture" }), "utf8").toString("base64"),
    headers: { "x-api-key": "stale-member-key", "content-type": "application/json" },
    requestTimeout: 5000,
  });
  assert.equal(pollResult.handled, true);
  assert.equal(upstreamCalls.at(-1).method, "POST");
  assert.equal(upstreamCalls.at(-1).pathname, "/api/cut/model/coze-run-seedance-special-history");
  assert.equal(upstreamCalls.at(-1).contentType, "application/json");
  assert.deepEqual(JSON.parse(upstreamCalls.at(-1).body), { task_id: "seedance_execute_fixture", execute_id: "seedance_execute_fixture" });
  assert.equal(upstreamCalls.at(-1).authorization, "");
  assert.equal(upstreamCalls.at(-1).xApiKey, secret);
  assert.equal(new Map(pollResult.response.headers).has("x-wanjuan-gateway-task-id"), false);
  assert.equal(JSON.parse(Buffer.from(pollResult.response.bodyBase64, "base64").toString("utf8")).data.status, "running");
  const runningTaskResponse = await gatewayClient.requestPinnedJson(gatewayUrl, `/workspace/tasks/${encodeURIComponent(gatewayTaskId)}`, {
    token: sessionResponse.value.workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
  });
  assert.equal(runningTaskResponse.value.task.status, "running");
  const runningUsageResponse = await gatewayClient.requestPinnedJson(gatewayUrl, "/workspace/usage", {
    token: sessionResponse.value.workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
  });
  const runningVideoUsage = runningUsageResponse.value.capabilities.find((item) => item.capability === "video_generation");
  assert.equal(runningVideoUsage.successful, 0);
  assert.equal(runningVideoUsage.reserved, 1);
  const secondPollResult = await accountService.proxyEnterpriseRequest({
    url: "https://api.example.com/api/cut/model/coze-run-seedance-special-history",
    method: "POST",
    enterpriseRequestKind: "poll",
    bodyBase64: Buffer.from(JSON.stringify({ task_id: "seedance_execute_fixture", execute_id: "seedance_execute_fixture" }), "utf8").toString("base64"),
    headers: { "x-api-key": "stale-member-key", "content-type": "application/json" },
    requestTimeout: 5000,
  });
  assert.equal(secondPollResult.response.status, 200);
  assert.equal(new Map(secondPollResult.response.headers).has("x-wanjuan-gateway-task-id"), false);
  assert.equal(JSON.parse(Buffer.from(secondPollResult.response.bodyBase64, "base64").toString("utf8")).data.status, "completed");
  assert.equal(seedancePollCount, 2);
  const taskResponse = await gatewayClient.requestPinnedJson(gatewayUrl, `/workspace/tasks/${encodeURIComponent(gatewayTaskId)}`, {
    token: sessionResponse.value.workspaceToken,
    certificateFingerprint: initialized.activation.certificateFingerprint,
  });
  assert.equal(taskResponse.value.task.status, "completed");
  assert.equal(taskResponse.value.task.remoteTaskId, "seedance_execute_fixture");
  assert.equal(JSON.parse(fs.readFileSync(path.join(tempRoot, "enterprise-gateway", "tasks.json"), "utf8")).tasks.length, 1);
  await assert.rejects(
    accountService.proxyEnterpriseRequest({
      url: "https://api.example.com/api/cut/model/coze-run-seedance-special-history",
      method: "POST",
      enterpriseRequestKind: "polling",
      requestTimeout: 5000,
    }),
    (error) => error.code === "INVALID_ENTERPRISE_REQUEST_KIND",
  );
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
      enterpriseRequestKind: "submit",
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
  const teamStorePath = path.join(gatewayRoot, "team-templates.json");
  const teamAuditPath = path.join(gatewayRoot, "team-template-audit.json");
  const teamStoreText = fs.readFileSync(teamStorePath, "utf8");
  const teamAuditText = fs.readFileSync(teamAuditPath, "utf8");
  assert.equal(fs.statSync(teamStorePath).mode & 0o777, 0o600);
  assert.equal(fs.statSync(teamAuditPath).mode & 0o777, 0o600);
  assert.equal(teamStoreText.includes(templateInput.content), false);
  assert.equal(teamStoreText.includes("Second synthetic content."), false);
  assert.equal(teamAuditText.includes("Synthetic prompt content"), false);
  assert.equal(teamAuditText.includes("Persistent synthetic template"), false);
  assert.equal(fs.statSync(gatewayRoot).mode & 0o777, 0o700);

  const rateLimitHostSession = {
    userId: "user_rate_limit_owner",
    organizationId: "org_test",
    gatewayId: "gw_test",
    role: "owner",
    trustedHost: true,
  };
  for (let index = 0; index < 300; index += 1) {
    await gateway.invokeEnterpriseTeamTemplatesAsHost({ operation: "list", payload: {}, session: rateLimitHostSession });
  }
  await assert.rejects(
    gateway.invokeEnterpriseTeamTemplatesAsHost({ operation: "list", payload: {}, session: rateLimitHostSession }),
    (error) => error.code === "TEAM_TEMPLATE_RATE_LIMITED" && error.status === 429,
  );

  fs.writeFileSync(teamStorePath, "{", { encoding: "utf8", mode: 0o600 });
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates"),
    (error) => error.code === "TEAM_TEMPLATE_STORE_CORRUPT" && error.status === 503,
  );
  assert.equal(fs.readFileSync(teamStorePath, "utf8"), "{");
  fs.writeFileSync(teamStorePath, teamStoreText, { encoding: "utf8", mode: 0o600 });

  fs.writeFileSync(teamAuditPath, "{", { encoding: "utf8", mode: 0o600 });
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, `/workspace/team-templates/${encodeURIComponent(persistentTemplateId)}`, {
      method: "PATCH",
      headers: { "if-match": '"1"' },
      body: { description: "Must roll back when audit is unavailable" },
    }),
    (error) => error.code === "TEAM_TEMPLATE_AUDIT_CORRUPT" && error.status === 503,
  );
  const unchangedAfterAuditFailure = await teamRequest(sessionResponse.value.workspaceToken,
    `/workspace/team-templates/${encodeURIComponent(persistentTemplateId)}`);
  assert.equal(unchangedAfterAuditFailure.value.item.revision, 1);
  assert.equal(unchangedAfterAuditFailure.value.item.description, templateInput.description);
  fs.writeFileSync(teamAuditPath, teamAuditText, { encoding: "utf8", mode: 0o600 });

  controlMembers = controlMembers.map((member) => member.user_id === "user_other" ? { ...member, status: "disabled" } : member);
  controlMembers = controlMembers.map((member) => member.user_id === "user_admin" ? {
    ...member,
    expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
  } : member);
  await gateway.syncGatewayControlPlane();
  await assert.rejects(
    teamRequest(otherSessionResponse.value.workspaceToken, "/workspace/team-templates"),
    (error) => error.code === "TEAM_TEMPLATE_MEMBERSHIP_REVOKED" && error.status === 403,
  );
  await assert.rejects(
    teamRequest(adminSessionResponse.value.workspaceToken, "/workspace/team-templates"),
    (error) => error.code === "TEAM_TEMPLATE_MEMBERSHIP_REVOKED" && error.status === 403,
  );
  fs.rmSync(path.join(gatewayRoot, "control-snapshot.json"), { force: true });
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates"),
    (error) => error.code === "TEAM_TEMPLATE_CONTROL_UNAVAILABLE" && error.status === 503,
  );
  fs.writeFileSync(path.join(gatewayRoot, "control-snapshot.json"), "{", { encoding: "utf8", mode: 0o600 });
  await assert.rejects(
    teamRequest(sessionResponse.value.workspaceToken, "/workspace/team-templates"),
    (error) => error.code === "TEAM_TEMPLATE_CONTROL_UNAVAILABLE" && error.status === 503,
  );
  await gateway.syncGatewayControlPlane();
  await assert.rejects(
    gateway.invokeEnterpriseTeamTemplatesAsHost({
      operation: "list",
      payload: {},
      session: { userId: "user_host_owner", organizationId: "org_other", gatewayId: "gw_test", role: "owner", trustedHost: true },
    }),
    (error) => error.code === "TEAM_TEMPLATE_FORBIDDEN",
  );

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
  const persistedAfterRestart = await teamRequest(sessionResponse.value.workspaceToken,
    `/workspace/team-templates/${encodeURIComponent(persistentTemplateId)}`);
  assert.equal(persistedAfterRestart.value.item.title, "Persistent synthetic template");
  await gateway.stopEnterpriseGateway({ disableAutoStart: true });
  assert.equal(gateway.getEnterpriseGatewayStatus().autoStart, false);

  console.log("enterprise gateway: TLS pinning, local team templates, task ledger, quota settlement and no-fallback passed");
}

run().finally(() => {
  Module._load = originalLoad;
  global.fetch = originalFetch;
  fs.rmSync(tempRoot, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
