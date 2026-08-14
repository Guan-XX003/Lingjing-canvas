const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const {
  emptyEnterpriseTeamCache,
  enterpriseTeamScopeKey,
  enterpriseTeamTemplateToWorkspace,
  mergeEnterpriseTeamTemplatePage,
  normalizeEnterpriseTeamTemplate,
  sanitizeEnterpriseTeamTemplateInput,
} = require(path.join(root, "electron/shared/enterprise-team-template-contract.cjs"));

const context = {
  organizationId: "org_test",
  gatewayId: "gateway_test",
  role: "member",
};

const template = {
  id: "template_test",
  organizationId: context.organizationId,
  gatewayId: context.gatewayId,
  title: "Team title",
  content: "Team prompt",
  description: "Team description",
  type: "video",
  tags: ["team"],
  modelHint: "model_test",
  providerHint: "provider_test",
  generationMode: "text-to-video",
  parameters: { aspectRatio: "16:9", resolution: "720p", durationSeconds: 5 },
  status: "active",
  revision: 1,
  author: { id: "user_test" },
  permissions: { canRead: true, canEdit: false, canDelete: false },
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

function rejectsDto(input) {
  assert.throws(
    () => sanitizeEnterpriseTeamTemplateInput(input),
    (error) => error?.code === "TEAM_TEMPLATE_DTO_REJECTED",
  );
}

const descriptionPatch = sanitizeEnterpriseTeamTemplateInput(
  { description: "Updated description" },
  { requireContent: false, partial: true },
);
assert.deepEqual(descriptionPatch, { description: "Updated description" });
assert.equal("title" in descriptionPatch, false);
assert.equal("content" in descriptionPatch, false);
assert.equal("type" in descriptionPatch, false);
assert.equal("tags" in descriptionPatch, false);
assert.equal("parameters" in descriptionPatch, false);

const titlePatch = sanitizeEnterpriseTeamTemplateInput(
  { title: "Updated title" },
  { requireContent: false, partial: true },
);
assert.deepEqual(titlePatch, { title: "Updated title" });
assert.deepEqual(
  sanitizeEnterpriseTeamTemplateInput({ description: "" }, { requireContent: false, partial: true }),
  { description: "" },
);

for (const field of ["apiKey", "token", "headers", "localPath", "resultUrl", "taskId", "projectId", "nodeId"]) {
  rejectsDto({ title: "Rejected", content: "Rejected", [field]: "secret-or-runtime-value" });
}
rejectsDto({ title: "Rejected", content: "Rejected", parameters: { width: "1280" } });
rejectsDto({ title: "Rejected", content: "Rejected", parameters: "16:9" });
rejectsDto([]);

assert.equal(enterpriseTeamScopeKey(context), "org_test:gateway_test");
assert.notEqual(
  enterpriseTeamScopeKey(context),
  enterpriseTeamScopeKey({ organizationId: "org_other", gatewayId: "gateway_test" }),
);
assert.notEqual(
  enterpriseTeamScopeKey(context),
  enterpriseTeamScopeKey({ organizationId: "org_test", gatewayId: "gateway_other" }),
);

let cache = mergeEnterpriseTeamTemplatePage(
  emptyEnterpriseTeamCache(context),
  { items: [template], nextCursor: "cursor_1", permissions: { canRead: true, canCreate: true }, role: "member" },
  context,
  { replace: true, syncedAt: 1 },
);
assert.equal(cache.items.length, 1);
assert.equal(cache.cursor, "cursor_1");
assert.equal(cache.permissions.canCreate, true);

cache = mergeEnterpriseTeamTemplatePage(
  cache,
  {
    items: [
      { ...template, title: "Stale title", revision: 1 },
      { ...template, title: "Newest title", revision: 2, updatedAt: "2026-08-14T00:01:00.000Z" },
    ],
    nextCursor: "cursor_2",
  },
  context,
  { syncedAt: 2 },
);
assert.equal(cache.items.length, 1);
assert.equal(cache.items[0].title, "Newest title");
assert.equal(cache.items[0].revision, 2);

cache = mergeEnterpriseTeamTemplatePage(
  cache,
  { tombstones: [{ id: template.id, revision: 3, deletedAt: "2026-08-14T00:02:00.000Z" }], nextCursor: "cursor_3" },
  context,
  { syncedAt: 3 },
);
assert.equal(cache.items.length, 0);
assert.equal(cache.cursor, "cursor_3");

const normalized = normalizeEnterpriseTeamTemplate(template, { ...context, role: "owner" });
assert.equal(normalized.permissions.canEdit, false, "client must not infer edit permission from role");
assert.equal(normalized.permissions.canDelete, false, "client must not infer delete permission from role");
assert.throws(
  () => normalizeEnterpriseTeamTemplate({ ...template, organizationId: "org_other" }, context),
  (error) => error?.code === "TEAM_TEMPLATE_SCOPE_MISMATCH",
);
assert.throws(
  () => normalizeEnterpriseTeamTemplate({ ...template, gatewayId: "gateway_other" }, context),
  (error) => error?.code === "TEAM_TEMPLATE_SCOPE_MISMATCH",
);
const workspaceTemplate = enterpriseTeamTemplateToWorkspace(template, context);
for (const forbidden of ["apiKey", "token", "headers", "localPath", "resultUrl", "taskId", "projectId", "nodeId"]) {
  assert.equal(Object.prototype.hasOwnProperty.call(workspaceTemplate, forbidden), false);
}

const accountSource = fs.readFileSync(path.join(root, "electron/main/account-service.cjs"), "utf8");
const ipcSource = fs.readFileSync(path.join(root, "electron/main/ipc.cjs"), "utf8");
const bridgeSource = fs.readFileSync(path.join(root, "electron/preload/bridge-api.cjs"), "utf8");
const preloadSource = fs.readFileSync(path.join(root, "electron/preload/desktop-patches.cjs"), "utf8");

assert.match(accountSource, /invokeEnterpriseTeamTemplatesAsHost\(\{ operation, payload: operationPayload, session \}\)/);
assert.match(accountSource, /trustedHost: true/);
assert.match(accountSource, /token: context\.workspaceToken/);
assert.match(accountSource, /sanitizeEnterpriseTeamTemplateInput\(source\.input \|\| \{\}, \{ requireContent: false, partial: true \}\)/);
assert.match(ipcSource, /wanjuan:enterprise-team-templates/);
assert.match(bridgeSource, /enterpriseTeamTemplates/);
assert.match(preloadSource, /data-template-source="\$\{teamSource\}"/);
assert.match(preloadSource, /templateSource === "enterprise"/);
assert.match(preloadSource, /refresh-enterprise-team/);
assert.match(preloadSource, /workspaceSyncEnterpriseTeamTemplates\(\{ force: true \}\)/);
assert.match(preloadSource, /企业网关团队/);
assert.match(preloadSource, /局域网兼容共享/);

console.log("enterprise team template contract/cache/bridge tests passed");
