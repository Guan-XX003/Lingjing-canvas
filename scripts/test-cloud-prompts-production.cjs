#!/usr/bin/env node

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app } = require("electron");

const sourceSessionPath = String(process.env.WANJUAN_ACCOUNT_SESSION_SOURCE || "").trim();
const confirmed = process.env.WANJUAN_CLOUD_PROMPT_PRODUCTION_CONFIRM === "1";

if (!confirmed || !sourceSessionPath) {
  console.error("production cloud prompt smoke test requires explicit confirmation and an account session source path");
  process.exit(2);
}
if (!fs.existsSync(sourceSessionPath) || path.basename(sourceSessionPath) !== "account-session.json") {
  console.error("account session source path is invalid");
  process.exit(2);
}
if (path.basename(path.dirname(sourceSessionPath)) !== "wanjuan-ai-canvas-desktop-test") {
  console.error("production cloud prompt smoke test only accepts the dedicated desktop test session");
  process.exit(2);
}

const temporaryUserData = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-cloud-prompt-production-"));
fs.copyFileSync(sourceSessionPath, path.join(temporaryUserData, "account-session.json"));
app.setName("StarCanvas");
app.setPath("userData", temporaryUserData);

let service;
let workspace = null;
const createdTemplates = new Map();
const createdWorkspaces = new Map();
const createdInvitations = new Map();

async function invoke(payload) {
  const result = await service.invoke(payload);
  if (!result?.ok) {
    const error = new Error(result?.error || "cloud prompt production request failed");
    error.result = result;
    throw error;
  }
  return result;
}

async function deleteTemplate(templateId, revision) {
  const record = createdTemplates.get(templateId);
  const workspaceId = record?.workspaceId || workspace?.id;
  if (!templateId || !revision || !workspaceId) return;
  const result = await service.invoke({
    operation: "template.delete",
    workspaceId,
    templateId,
    revision,
  });
  if (result?.ok) createdTemplates.delete(templateId);
}

async function archiveWorkspace() {
  if (!workspace?.id || !workspace?.revision) return;
  let result = await service.invoke({
    operation: "workspace.update",
    workspaceId: workspace.id,
    revision: workspace.revision,
    workspace: { status: "archived" },
  });
  if (result?.ok) return;
  const list = await service.invoke({ operation: "workspace.list" });
  const current = list?.workspaces?.find((item) => item.id === workspace.id);
  if (!current?.revision) throw new Error("test workspace cleanup revision unavailable");
  result = await service.invoke({
    operation: "workspace.update",
    workspaceId: workspace.id,
    revision: current.revision,
    workspace: { status: "archived" },
  });
  if (!result?.ok) throw new Error(result?.error || "test workspace cleanup failed");
}

async function archiveCreatedWorkspace(workspaceId, revision) {
  if (!workspaceId || !revision) return;
  let result = await service.invoke({
    operation: "workspace.update",
    workspaceId,
    revision,
    workspace: { status: "archived" },
  });
  if (result?.ok || Number(result?.status || 0) === 404) return;
  const list = await service.invoke({ operation: "workspace.list" });
  const current = list?.workspaces?.find((item) => item.id === workspaceId);
  if (!current) return;
  if (!current.revision) throw new Error("test workspace cleanup revision unavailable");
  result = await service.invoke({
    operation: "workspace.update",
    workspaceId,
    revision: current.revision,
    workspace: { status: "archived" },
  });
  if (!result?.ok && Number(result?.status || 0) !== 404) {
    throw new Error(result?.error || "test workspace cleanup failed");
  }
}

async function run() {
  await app.whenReady();
  assert.equal(app.getPath("userData"), temporaryUserData, "temporary userData path must be active");
  const { readAccountState } = require("../electron/main/account-service.cjs");
  const copiedAccountState = readAccountState();
  assert.ok(copiedAccountState?.user?.id, "copied account session must contain an account id");
  assert.ok(copiedAccountState?.session?.refreshTokenEncrypted, "copied account session must contain an encrypted refresh token");
  const { decryptLocalSecret } = require("../electron/main/local-secret-storage.cjs");
  assert.ok(
    decryptLocalSecret(copiedAccountState.session.refreshTokenEncrypted),
    "copied refresh token must be decryptable by the current Electron identity",
  );
  ({ defaultCloudPromptService: service } = require("../electron/main/cloud-prompt-service.cjs"));
  const prefix = `CODEX_SHARE_APP_${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
  const bootstrap = await invoke({ operation: "bootstrap" });
  assert.equal(bootstrap.authenticated, true, "copied account session must refresh successfully");

  const workspaceResult = await invoke({
    operation: "workspace.create",
    idempotencyKey: crypto.randomUUID(),
    workspace: {
      name: prefix,
      description: "Codex production contract smoke test; archived immediately after validation",
      kind: "personal",
    },
  });
  workspace = workspaceResult.item;
  createdWorkspaces.set(workspace.id, workspace.revision);
  assert.equal(workspace.kind, "personal");
  assert.ok(workspace.revision >= 1);

  const targetWorkspaceResult = await invoke({
    operation: "workspace.create",
    idempotencyKey: crypto.randomUUID(),
    workspace: {
      name: `${prefix}-TARGET`,
      description: "Isolated cross-workspace copy target; archived immediately after validation",
      kind: "personal",
    },
  });
  const targetWorkspace = targetWorkspaceResult.item;
  createdWorkspaces.set(targetWorkspace.id, targetWorkspace.revision);

  const baseline = await invoke({ operation: "template.changes", workspaceId: workspace.id, limit: 10 });
  assert.equal(baseline.items.length, 0, "new test workspace must start empty");
  const baselineCursor = baseline.nextCursor;

  const createResult = await invoke({
    operation: "template.create",
    workspaceId: workspace.id,
    idempotencyKey: crypto.randomUUID(),
    template: {
      title: `${prefix}-模板`,
      content: "Production contract smoke test prompt. No user content or media.",
      description: "Temporary contract test",
      type: "image",
      tags: ["codex-contract-test"],
      modelHint: "mock-model-hint",
      providerHint: "managed-provider",
      generationMode: "text-to-image",
      parameters: { aspectRatio: "16:9", resolution: "1080p", watermark: false },
    },
  });
  let template = createResult.item;
  createdTemplates.set(template.id, { workspaceId: workspace.id, revision: template.revision });
  assert.equal(template.revision, 1);

  const exactList = await invoke({
    operation: "template.list",
    workspaceId: workspace.id,
    query: prefix,
    type: "image",
    tags: ["codex-contract-test"],
    limit: 10,
  });
  assert.deepEqual(exactList.items.map((item) => item.id), [template.id]);

  const fetched = await invoke({ operation: "template.get", workspaceId: workspace.id, templateId: template.id });
  assert.equal(fetched.item.id, template.id);

  const updated = await invoke({
    operation: "template.update",
    workspaceId: workspace.id,
    templateId: template.id,
    revision: template.revision,
    template: { ...template, content: "Production contract smoke test prompt, revision two." },
  });
  template = updated.item;
  createdTemplates.set(template.id, { workspaceId: workspace.id, revision: template.revision });
  assert.equal(template.revision, 2);

  const conflict = await service.invoke({
    operation: "template.update",
    workspaceId: workspace.id,
    templateId: template.id,
    revision: 1,
    template: { ...template, content: "Intentionally stale revision." },
  });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.status, 409);
  assert.equal(conflict.code, "PROMPT_TEMPLATE_CONFLICT");
  assert.equal(conflict.conflict?.serverVersion?.revision, template.revision);

  const favorite = await invoke({ operation: "template.favorite", workspaceId: workspace.id, templateId: template.id });
  assert.equal(favorite.item?.favorite ?? favorite.favorite, true);
  const unfavorite = await invoke({ operation: "template.unfavorite", workspaceId: workspace.id, templateId: template.id });
  assert.equal(unfavorite.item?.favorite ?? unfavorite.favorite, false);

  const copied = await invoke({
    operation: "template.copy",
    workspaceId: workspace.id,
    templateId: template.id,
    targetWorkspaceId: targetWorkspace.id,
    idempotencyKey: crypto.randomUUID(),
  });
  createdTemplates.set(copied.item.id, { workspaceId: targetWorkspace.id, revision: copied.item.revision });
  assert.equal(copied.item.workspaceId, targetWorkspace.id);

  const members = await invoke({ operation: "member.list", workspaceId: workspace.id });
  assert.ok(Array.isArray(members.items));
  const invitations = await invoke({ operation: "invitation.list", workspaceId: workspace.id });
  assert.ok(Array.isArray(invitations.items));
  const invitation = await invoke({
    operation: "invitation.create",
    workspaceId: workspace.id,
    idempotencyKey: crypto.randomUUID(),
    invitation: {
      identifier: `${prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@example.com`,
      role: "viewer",
    },
  });
  createdInvitations.set(invitation.item.id, workspace.id);
  assert.equal(invitation.item.status, "pending");
  const invitationListAfterCreate = await invoke({ operation: "invitation.list", workspaceId: workspace.id });
  assert.equal(invitationListAfterCreate.items.some((item) => item.id === invitation.item.id), true);
  await invoke({ operation: "invitation.cancel", workspaceId: workspace.id, invitationId: invitation.item.id });
  createdInvitations.delete(invitation.item.id);
  const invitationListAfterCancel = await invoke({ operation: "invitation.list", workspaceId: workspace.id });
  assert.equal(invitationListAfterCancel.items.some((item) => item.id === invitation.item.id), false);
  const invitationInbox = await invoke({ operation: "invitation.inbox" });
  assert.ok(Array.isArray(invitationInbox.items));

  const { createCloudPromptStore, createMemoryCloudPromptAdapter } = require("../electron/preload/cloud-prompt-store.cjs");
  const { createCloudPromptWorkspaceController } = require("../electron/preload/cloud-prompt-workspace.cjs");
  const uiController = createCloudPromptWorkspaceController({
    store: createCloudPromptStore({ adapter: createMemoryCloudPromptAdapter() }),
    invoke: (payload) => service.invoke(payload),
    escapeHtml: (value) => String(value == null ? "" : value).replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char])),
  });
  await uiController.prepare({ force: true });
  await uiController.handleField("cloudWorkspaceId", workspace.id);
  await uiController.handleAction("cloud-sharing-open");
  const sharingHtml = uiController.renderContent();
  assert.equal(sharingHtml.includes("成员与共享"), true);
  assert.equal(sharingHtml.includes("cloud-invite-member"), true);
  assert.equal(sharingHtml.includes("发送邀请"), true);

  const changed = await invoke({
    operation: "template.changes",
    workspaceId: workspace.id,
    cursor: baselineCursor,
    limit: 20,
  });
  const changedIds = new Set(changed.items.map((item) => item.id));
  assert.equal(changedIds.has(template.id), true);
  assert.equal(changedIds.has(copied.item.id), false, "copy must belong only to the target workspace");
  const targetChanges = await invoke({ operation: "template.changes", workspaceId: targetWorkspace.id, limit: 20 });
  assert.equal(targetChanges.items.some((item) => item.id === copied.item.id), true);

  await deleteTemplate(copied.item.id, copied.item.revision);
  await deleteTemplate(template.id, template.revision);

  const deletedChanges = await invoke({
    operation: "template.changes",
    workspaceId: workspace.id,
    cursor: changed.nextCursor,
    limit: 20,
  });
  const tombstoneIds = new Set(deletedChanges.tombstones.map((item) => item.id));
  assert.equal(tombstoneIds.has(template.id), true);
  const deletedTargetChanges = await invoke({
    operation: "template.changes",
    workspaceId: targetWorkspace.id,
    cursor: targetChanges.nextCursor,
    limit: 20,
  });
  assert.equal(new Set(deletedTargetChanges.tombstones.map((item) => item.id)).has(copied.item.id), true);

  await archiveCreatedWorkspace(targetWorkspace.id, targetWorkspace.revision);
  await archiveCreatedWorkspace(workspace.id, workspace.revision);
  workspace = null;
  console.log(JSON.stringify({
    ok: true,
    workspaceCreate: true,
    templateCreateListGetPatch: true,
    conflict409WithServerVersion: true,
    favoriteRoundTrip: true,
    copy: true,
    copyTargetIsolated: true,
    membersList: true,
    invitationCreateListCancel: true,
    invitationInbox: true,
    sharingUi: true,
    changesAndTombstones: true,
    cleanup: true,
  }));
}

run().catch(async (error) => {
  try {
    for (const [invitationId, workspaceId] of [...createdInvitations.entries()].reverse()) {
      const result = await service?.invoke({ operation: "invitation.cancel", workspaceId, invitationId });
      if (result?.ok || Number(result?.status || 0) === 404) createdInvitations.delete(invitationId);
    }
    for (const [templateId, record] of [...createdTemplates.entries()].reverse()) {
      await deleteTemplate(templateId, record.revision);
    }
    for (const [workspaceId, revision] of [...createdWorkspaces.entries()].reverse()) {
      await archiveCreatedWorkspace(workspaceId, revision);
    }
  } catch (cleanupError) {
    console.error(`cleanup failed: ${cleanupError.message || cleanupError}`);
  }
  const failureCode = String(error?.result?.code || error?.code || "UNKNOWN");
  const failureStatus = Number(error?.result?.status || error?.status || 0);
  console.error(`production cloud prompt smoke test failed: ${error.message || error} (code=${failureCode}, status=${failureStatus})`);
  process.exitCode = 1;
}).finally(async () => {
  try { fs.rmSync(temporaryUserData, { recursive: true, force: true }); } catch {}
  const exitCode = Number(process.exitCode || 0);
  try { app.exit(exitCode); } catch {}
});
