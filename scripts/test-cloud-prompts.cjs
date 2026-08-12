const assert = require("node:assert/strict");

const {
  normalizePermissions,
  sanitizeSharedPromptTemplateInput,
} = require("../electron/shared/cloud-prompt-contract.cjs");
const {
  createCloudPromptStore,
  createMemoryCloudPromptAdapter,
} = require("../electron/preload/cloud-prompt-store.cjs");
const {
  cloudPromptErrorResult,
  createCloudPromptService,
} = require("../electron/main/cloud-prompt-service.cjs");
const { AccountRequestError } = require("../electron/main/account-service.cjs");

async function testDtoWhitelist() {
  const safe = sanitizeSharedPromptTemplateInput({
    title: " 安全模板 ",
    prompt: "生成一张电影感分镜图",
    description: "只保留说明",
    type: "image",
    tags: ["分镜", "分镜", "电影感"],
    modelName: "image-model",
    sourceProvider: "provider",
    generationMode: "text-to-image",
    params: {
      ratio: "16:9",
      selectedResolution: "2K",
      selectedSeconds: 5,
      generateAudio: false,
      watermark: true,
      apiKey: "must-not-survive",
      resultUrl: "https://private.invalid/result.png",
    },
    apiKey: "must-not-survive",
    token: "must-not-survive",
    apiConfigs: [{ key: "must-not-survive" }],
    headers: { authorization: "must-not-survive" },
    selectedContextResources: [{ url: "file:///private.png" }],
    sourceProjectId: "private-project",
    sourceNodeId: "private-node",
    resultUrl: "https://private.invalid/result.png",
    localPath: "/Users/private/result.png",
    taskId: "private-task",
  });
  assert.deepEqual(safe, {
    title: "安全模板",
    content: "生成一张电影感分镜图",
    description: "只保留说明",
    type: "image",
    tags: ["分镜", "电影感"],
    modelHint: "image-model",
    providerHint: "provider",
    generationMode: "text-to-image",
    parameters: {
      aspectRatio: "16:9",
      resolution: "2K",
      durationSeconds: 5,
      generateAudio: false,
      watermark: true,
    },
  });
  const serialized = JSON.stringify(safe);
  for (const forbidden of ["apiKey", "token", "apiConfigs", "authorization", "selectedContextResources", "sourceProjectId", "sourceNodeId", "resultUrl", "localPath", "taskId", "file://"]) {
    assert.equal(serialized.includes(forbidden), false, `DTO leaked ${forbidden}`);
  }
}

async function testCacheIsolationAndRevocation() {
  const store = createCloudPromptStore({ adapter: createMemoryCloudPromptAdapter() });
  await store.ensureAccountIsolation("account-a");
  await store.putTemplate("account-a", "workspace-a", {
    id: "template-a",
    workspaceId: "workspace-a",
    title: "A",
    content: "A",
    type: "text",
    tags: [],
    parameters: {},
  }, "synced");
  await store.enqueue({ accountId: "account-a", workspaceId: "workspace-a", operation: "template.update", templateId: "template-a" });
  assert.equal((await store.listTemplates("account-a", "workspace-a")).length, 1);
  assert.equal((await store.listQueue("account-a")).length, 1);

  await store.ensureAccountIsolation("account-b");
  assert.equal((await store.listTemplates("account-a", "workspace-a")).length, 0, "account switch must clear previous template cache");
  assert.equal((await store.listQueue("account-a")).length, 0, "account switch must clear previous sync queue");

  await store.putTemplate("account-b", "allowed", { id: "allowed-template", workspaceId: "allowed", title: "Allowed", content: "Allowed", type: "text", tags: [], parameters: {} }, "synced");
  await store.putTemplate("account-b", "revoked", { id: "revoked-template", workspaceId: "revoked", title: "Revoked", content: "Revoked", type: "text", tags: [], parameters: {} }, "pending-update");
  await store.enqueue({ accountId: "account-b", workspaceId: "revoked", operation: "template.update", templateId: "revoked-template" });
  const removed = await store.pruneUnauthorizedWorkspaces("account-b", ["allowed"]);
  assert.deepEqual(removed, ["revoked"]);
  assert.equal((await store.listTemplates("account-b", "revoked", { includeArchived: true })).length, 0);
  assert.equal((await store.listQueue("account-b", "revoked")).length, 0, "revoked workspace operations must not upload later");
}

async function testHeadersAndOutboundBody() {
  const calls = [];
  const service = createCloudPromptService({
    getAccountContext: () => ({ authenticated: true, account: { id: "account-test", displayName: "Test" } }),
    request: async (pathname, options = {}) => {
      calls.push({ pathname, options });
      if (options.method === "POST") return {
        item: { id: "template-created", workspaceId: "workspace-test", revision: 1, ...options.body, status: "active" },
      };
      if (options.method === "PATCH") return {
        item: { id: "template-created", workspaceId: "workspace-test", revision: 8, ...options.body, status: "active" },
      };
      return { items: [] };
    },
  });
  const unsafeTemplate = {
    title: "测试",
    content: "安全正文",
    type: "video",
    tags: ["测试"],
    parameters: { aspectRatio: "16:9", apiKey: "leak" },
    apiKey: "leak",
    localPath: "/private/file",
    resultUrl: "https://private.invalid/result.mp4",
  };
  const created = await service.invoke({
    operation: "template.create",
    workspaceId: "workspace-test",
    template: unsafeTemplate,
    idempotencyKey: "idem-create-1",
  });
  assert.equal(created.ok, true);
  const createCall = calls.at(-1);
  assert.equal(createCall.options.headers["Idempotency-Key"], "idem-create-1");
  assert.deepEqual(Object.keys(createCall.options.body).sort(), ["content", "parameters", "tags", "title", "type"]);
  assert.equal(JSON.stringify(createCall.options.body).includes("leak"), false);

  const updated = await service.invoke({
    operation: "template.update",
    workspaceId: "workspace-test",
    templateId: "template-created",
    revision: 7,
    template: unsafeTemplate,
  });
  assert.equal(updated.ok, true);
  const updateCall = calls.at(-1);
  assert.equal(updateCall.options.headers["If-Match"], '"7"');
  assert.equal(updateCall.options.body.revision, 7);
}

async function testMockApiAndConflict() {
  const service = createCloudPromptService({ mockEnabled: true });
  const bootstrap = await service.invoke({ operation: "bootstrap" });
  assert.equal(bootstrap.ok, true);
  assert.equal(bootstrap.authenticated, true);
  assert.equal(bootstrap.workspaces.some((item) => item.kind === "personal"), true);
  assert.equal(bootstrap.workspaces.some((item) => item.kind === "organization"), true);

  const workspaceId = bootstrap.workspaces.find((item) => item.kind === "personal").id;
  const created = await service.invoke({
    operation: "template.create",
    workspaceId,
    idempotencyKey: "mock-create-1",
    template: { title: "冲突测试", content: "第一版", type: "text", tags: ["测试"], parameters: {} },
  });
  assert.equal(created.ok, true);
  const firstUpdate = await service.invoke({
    operation: "template.update",
    workspaceId,
    templateId: created.item.id,
    revision: 1,
    template: { ...created.item, content: "第二版" },
  });
  assert.equal(firstUpdate.ok, true);
  const conflict = await service.invoke({
    operation: "template.update",
    workspaceId,
    templateId: created.item.id,
    revision: 1,
    template: { ...created.item, content: "过期本地版" },
  });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.status, 409);
  assert.equal(conflict.code, "PROMPT_TEMPLATE_CONFLICT");
  assert.equal(conflict.conflict.serverVersion.content, "第二版");

  const favorite = await service.invoke({ operation: "template.favorite", workspaceId, templateId: created.item.id, idempotencyKey: "mock-favorite-1" });
  assert.equal(favorite.ok, true);
  assert.equal(favorite.item.favorite, true);
  const organizationId = bootstrap.workspaces.find((item) => item.kind === "organization").id;
  const copied = await service.invoke({ operation: "template.copy", workspaceId, templateId: created.item.id, targetWorkspaceId: organizationId, idempotencyKey: "mock-copy-1" });
  assert.equal(copied.ok, true);
  assert.equal(copied.item.workspaceId, organizationId);
  const archived = await service.invoke({ operation: "template.archive", workspaceId, templateId: created.item.id, revision: firstUpdate.item.revision });
  assert.equal(archived.ok, true);
  assert.equal(archived.item.status, "archived");
  const deleted = await service.invoke({ operation: "template.delete", workspaceId, templateId: created.item.id, revision: archived.item.revision });
  assert.equal(deleted.ok, true);
  assert.equal(deleted.tombstone.id, created.item.id);
  const changes = await service.invoke({ operation: "template.changes", workspaceId });
  assert.equal(changes.tombstones.some((item) => item.id === created.item.id), true);
}

async function testPermissionDefaults() {
  assert.deepEqual(normalizePermissions({}, "viewer"), {
    canRead: true,
    canCreate: false,
    canEdit: false,
    canEditOwn: false,
    canDelete: false,
    canShare: false,
    canFavorite: true,
    canCopy: true,
  });
  assert.equal(normalizePermissions({}, "editor").canEdit, true);
  assert.equal(normalizePermissions({}, "admin").canDelete, true);
}

async function testConflictDetailsPreserved() {
  const error = new AccountRequestError("conflict", {
    status: 409,
    code: "PROMPT_TEMPLATE_CONFLICT",
    details: {
      item: {
        id: "server-template",
        workspaceId: "server-workspace",
        revision: 4,
        title: "server",
        content: "server content",
        type: "text",
        tags: [],
        parameters: {},
      },
    },
  });
  const result = cloudPromptErrorResult(error);
  assert.equal(result.status, 409);
  assert.equal(result.conflict.serverVersion.revision, 4);
  assert.equal(result.conflict.serverVersion.content, "server content");
}

async function main() {
  await testDtoWhitelist();
  await testCacheIsolationAndRevocation();
  await testHeadersAndOutboundBody();
  await testMockApiAndConflict();
  await testPermissionDefaults();
  await testConflictDetailsPreserved();
  console.log("cloud prompt tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
