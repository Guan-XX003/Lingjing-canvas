const crypto = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");

const {
  normalizePromptWorkspace,
  normalizeSharedPromptTemplate,
  sanitizeSharedPromptTemplateInput,
} = require("../shared/cloud-prompt-contract.cjs");
const {
  AccountRequestError,
  accountApiUrl,
  readAccountState,
  requestWithAccountAuth,
} = require("./account-service.cjs");

const CLOUD_PROMPT_MOCK_ENV = "WANJUAN_PROMPT_LIBRARY_MOCK";

function safeIdentifier(value, label = "标识") {
  const text = String(value || "").trim();
  if (!text || text.length > 180 || !/^[A-Za-z0-9._:-]+$/.test(text)) {
    const error = new Error(`${label}无效`);
    error.code = "INVALID_PROMPT_IDENTIFIER";
    throw error;
  }
  return text;
}

function safeRevision(value) {
  const revision = Number(value);
  return Number.isFinite(revision) && revision >= 0 ? Math.floor(revision) : 0;
}

function safeIdempotencyKey(value) {
  const text = String(value || "").trim();
  if (!text) return crypto.randomUUID();
  if (text.length > 180 || !/^[A-Za-z0-9._:-]+$/.test(text)) {
    const error = new Error("Idempotency-Key 无效");
    error.code = "INVALID_IDEMPOTENCY_KEY";
    throw error;
  }
  return text;
}

function accountContextFromState() {
  const state = readAccountState();
  const user = state.user && typeof state.user === "object" ? state.user : null;
  const accountId = String(user?.id || user?.userId || user?.accountId || "").trim();
  return {
    authenticated: !!accountId && !!state.session?.refreshTokenEncrypted,
    account: accountId ? {
      id: accountId,
      displayName: String(user.displayName || user.name || user.email || ""),
      email: String(user.email || ""),
    } : null,
  };
}

function encodeQuery(values = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value == null || value === "" || value === false) continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function normalizeWorkspaceList(payload = {}) {
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : Array.isArray(payload.workspaces) ? payload.workspaces : [];
  return items.map(normalizePromptWorkspace).filter((item) => item.id);
}

function normalizeTemplateList(payload = {}, workspaceId = "") {
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : Array.isArray(payload.templates) ? payload.templates : [];
  return items
    .map((item) => normalizeSharedPromptTemplate(item, { workspaceId, requireContent: true }))
    .filter((item) => item.id);
}

function normalizeTombstones(payload = {}) {
  const values = Array.isArray(payload.tombstones) ? payload.tombstones : [];
  return values.map((item) => ({
    id: String(item?.id || item?.templateId || ""),
    revision: safeRevision(item?.revision),
  })).filter((item) => item.id);
}

function normalizeTemplateResponse(payload = {}, workspaceId = "") {
  const item = payload.item || payload.template || payload;
  const normalizedItem = normalizeSharedPromptTemplate(item, { workspaceId, requireContent: true });
  return {
    item: {
      ...normalizedItem,
      ...(payload.permissions ? { permissions: payload.permissions } : {}),
      ...(payload.etag ? { etag: String(payload.etag) } : {}),
    },
    permissions: payload.permissions || null,
    etag: String(payload.etag || ""),
  };
}

function cloudPromptErrorResult(error) {
  let serverVersion = null;
  const detailItem = error?.details?.serverVersion || error?.details?.item || error?.details?.template;
  if (detailItem) {
    try {
      serverVersion = normalizeSharedPromptTemplate(detailItem, { requireContent: true });
    } catch {}
  }
  return {
    ok: false,
    error: String(error?.message || error || "云提示词服务请求失败"),
    code: String(error?.code || "CLOUD_PROMPT_REQUEST_FAILED"),
    status: Number(error?.status || 0),
    offline: error?.network === true || String(error?.code || "") === "ACCOUNT_NETWORK_ERROR",
    conflict: Number(error?.status || 0) === 409 ? { serverVersion } : null,
  };
}

function createCloudPromptMockRequest(fixtureInput) {
  const fixture = fixtureInput || JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/cloud-prompt-library.json"), "utf8"));
  const state = {
    account: structuredClone(fixture.account || {}),
    workspaces: structuredClone(fixture.workspaces || []),
    templates: structuredClone(fixture.templates || []),
    tombstones: [],
    cursor: 1,
  };
  const fail = (message, options = {}) => {
    const error = new AccountRequestError(message, options);
    error.details = options.details || null;
    throw error;
  };
  const workspaceById = (id) => state.workspaces.find((item) => String(item.id) === String(id));
  const templateById = (workspaceId, templateId) => state.templates.find((item) => item.workspaceId === workspaceId && item.id === templateId);
  const stamp = () => new Date().toISOString();
  const bumpCursor = () => String(++state.cursor);
  return async (pathname, options = {}) => {
    const url = new URL(pathname, "https://mock.wanjuan.invalid");
    const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const method = String(options.method || "GET").toUpperCase();
    if (segments.length === 1 && segments[0] === "prompt-workspaces") {
      if (method === "GET") return { items: structuredClone(state.workspaces), nextCursor: String(state.cursor) };
      if (method === "POST") {
        const body = options.body || {};
        const item = normalizePromptWorkspace({
          id: `mock-workspace-${crypto.randomUUID()}`,
          name: body.name || "新提示词库",
          kind: body.kind || "personal",
          role: "owner",
          revision: 1,
        });
        state.workspaces.push(item);
        bumpCursor();
        return { item };
      }
    }
    const workspaceId = segments[1];
    const workspace = workspaceById(workspaceId);
    if (!workspace) fail("提示词工作空间不存在", { status: 404, code: "PROMPT_WORKSPACE_NOT_FOUND" });
    if (segments.length === 2 && method === "PATCH") {
      const revision = safeRevision(options.body?.revision);
      if (revision && revision !== safeRevision(workspace.revision)) {
        fail("提示词工作空间版本冲突", { status: 409, code: "PROMPT_WORKSPACE_CONFLICT" });
      }
      workspace.name = String(options.body?.name || workspace.name);
      workspace.revision = safeRevision(workspace.revision) + 1;
      workspace.updatedAt = stamp();
      bumpCursor();
      return { item: structuredClone(workspace) };
    }
    if (segments[2] === "templates" && segments.length === 3) {
      if (method === "GET") {
        let items = state.templates.filter((item) => item.workspaceId === workspaceId && item.status !== "archived");
        const query = String(url.searchParams.get("query") || "").toLowerCase();
        const type = String(url.searchParams.get("type") || "");
        if (query) items = items.filter((item) => `${item.title} ${item.content} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query));
        if (type) items = items.filter((item) => item.type === type);
        return { items: structuredClone(items), nextCursor: String(state.cursor) };
      }
      if (method === "POST") {
        const safe = sanitizeSharedPromptTemplateInput(options.body || {});
        const item = normalizeSharedPromptTemplate({
          id: `mock-template-${crypto.randomUUID()}`,
          workspaceId,
          revision: 1,
          ...safe,
          status: "active",
          favorite: false,
          createdBy: { id: state.account.id, displayName: state.account.displayName },
          createdAt: stamp(),
          updatedAt: stamp(),
        }, { workspaceId });
        state.templates.push(item);
        bumpCursor();
        return { item: structuredClone(item), permissions: workspace.permissions };
      }
    }
    if (segments[2] === "changes" && method === "GET") {
      return {
        items: structuredClone(state.templates.filter((item) => item.workspaceId === workspaceId)),
        tombstones: structuredClone(state.tombstones.filter((item) => item.workspaceId === workspaceId)),
        nextCursor: String(state.cursor),
        serverTime: stamp(),
      };
    }
    const templateId = segments[3];
    const template = templateById(workspaceId, templateId);
    if (!template) fail("提示词模板不存在", { status: 404, code: "PROMPT_TEMPLATE_NOT_FOUND" });
    if (segments.length === 4 && method === "GET") return { item: structuredClone(template), permissions: workspace.permissions };
    if (segments.length === 4 && method === "PATCH") {
      const revision = safeRevision(options.body?.revision);
      if (revision !== safeRevision(template.revision)) {
        fail("提示词模板已被其他成员更新", {
          status: 409,
          code: "PROMPT_TEMPLATE_CONFLICT",
          details: { item: structuredClone(template) },
        });
      }
      const templatePatch = options.body?.status === "archived"
        ? { status: "archived" }
        : sanitizeSharedPromptTemplateInput(options.body || {});
      Object.assign(template, templatePatch, {
        revision: template.revision + 1,
        updatedAt: stamp(),
      });
      bumpCursor();
      return { item: structuredClone(template), permissions: workspace.permissions };
    }
    if (segments.length === 4 && method === "DELETE") {
      const revision = safeRevision(options.body?.revision);
      if (revision !== safeRevision(template.revision)) {
        fail("提示词模板已被其他成员更新", {
          status: 409,
          code: "PROMPT_TEMPLATE_CONFLICT",
          details: { item: structuredClone(template) },
        });
      }
      const deletedRevision = template.revision + 1;
      state.templates = state.templates.filter((item) => item !== template);
      state.tombstones.push({ id: template.id, workspaceId, revision: deletedRevision, updatedAt: stamp() });
      bumpCursor();
      return { tombstone: { id: template.id, revision: deletedRevision } };
    }
    if (segments[4] === "copy" && method === "POST") {
      const targetWorkspaceId = safeIdentifier(options.body?.targetWorkspaceId || workspaceId, "目标空间");
      if (!workspaceById(targetWorkspaceId)) fail("目标提示词空间不存在", { status: 404, code: "PROMPT_WORKSPACE_NOT_FOUND" });
      const item = normalizeSharedPromptTemplate({
        ...template,
        id: `mock-template-${crypto.randomUUID()}`,
        workspaceId: targetWorkspaceId,
        revision: 1,
        favorite: false,
        title: options.body?.title || `${template.title} 副本`,
        createdBy: { id: state.account.id, displayName: state.account.displayName },
        createdAt: stamp(),
        updatedAt: stamp(),
      }, { workspaceId: targetWorkspaceId });
      state.templates.push(item);
      bumpCursor();
      return { item: structuredClone(item) };
    }
    if (segments[4] === "favorite" && ["POST", "DELETE"].includes(method)) {
      template.favorite = method === "POST";
      template.updatedAt = stamp();
      bumpCursor();
      return { item: structuredClone(template), favorite: template.favorite };
    }
    fail("Mock 云提示词接口不支持此操作", { status: 404, code: "MOCK_ROUTE_NOT_FOUND" });
  };
}

function createCloudPromptService(options = {}) {
  const mockEnabled = options.mockEnabled === true || process.env[CLOUD_PROMPT_MOCK_ENV] === "1";
  const mockFixture = options.fixture;
  const request = options.request || (mockEnabled
    ? createCloudPromptMockRequest(mockFixture)
    : (pathname, requestOptions) => requestWithAccountAuth(accountApiUrl(), pathname, requestOptions));
  const getAccountContext = options.getAccountContext || (mockEnabled
    ? () => {
        const fixture = mockFixture || JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/cloud-prompt-library.json"), "utf8"));
        return { authenticated: true, account: structuredClone(fixture.account) };
      }
    : accountContextFromState);

  const invoke = async (payload = {}) => {
    const operation = String(payload.operation || "");
    const context = await getAccountContext();
    if (operation === "bootstrap" && !context.authenticated) {
      return { ok: true, authenticated: false, account: null, workspaces: [], mock: mockEnabled };
    }
    if (!context.authenticated) throw new AccountRequestError("请先登录万卷灵境账号", { status: 401, code: "AUTH_REQUIRED" });
    if (operation === "bootstrap" || operation === "workspace.list") {
      try {
        const response = await request(`/prompt-workspaces${encodeQuery({ cursor: payload.cursor })}`, { method: "GET" });
        return {
          ok: true,
          authenticated: true,
          account: context.account,
          workspaces: normalizeWorkspaceList(response),
          nextCursor: String(response.nextCursor || ""),
          mock: mockEnabled,
        };
      } catch (error) {
        if (operation === "bootstrap" && (error?.network === true || Number(error?.status || 0) >= 500)) {
          return {
            ok: true,
            authenticated: true,
            account: context.account,
            workspaces: [],
            offline: true,
            error: String(error.message || error),
            code: String(error.code || "ACCOUNT_NETWORK_ERROR"),
            mock: mockEnabled,
          };
        }
        throw error;
      }
    }
    if (operation === "workspace.create") {
      const body = {
        name: String(payload.workspace?.name || "").trim().slice(0, 160),
        description: String(payload.workspace?.description || "").trim().slice(0, 2000) || undefined,
        kind: ["personal", "organization"].includes(payload.workspace?.kind) ? payload.workspace.kind : "personal",
        organizationId: payload.workspace?.kind === "organization" ? String(payload.workspace?.organizationId || "").trim() || undefined : undefined,
        memberCanCreate: payload.workspace?.memberCanCreate === true,
      };
      const response = await request("/prompt-workspaces", {
        method: "POST",
        headers: { "Idempotency-Key": safeIdempotencyKey(payload.idempotencyKey) },
        body,
      });
      return { ok: true, item: normalizePromptWorkspace(response.item || response.workspace || response) };
    }
    const workspaceId = safeIdentifier(payload.workspaceId, "工作空间");
    const workspacePath = `/prompt-workspaces/${encodeURIComponent(workspaceId)}`;
    if (operation === "workspace.update") {
      const revision = safeRevision(payload.revision);
      const workspacePatch = payload.workspace && typeof payload.workspace === "object" ? payload.workspace : {};
      const response = await request(workspacePath, {
        method: "PATCH",
        headers: { "If-Match": `\"${revision}\"` },
        body: {
          ...(workspacePatch.name != null ? { name: String(workspacePatch.name).trim().slice(0, 160) } : {}),
          ...(workspacePatch.description != null ? { description: String(workspacePatch.description).trim().slice(0, 2000) } : {}),
          ...(typeof workspacePatch.memberCanCreate === "boolean" ? { memberCanCreate: workspacePatch.memberCanCreate } : {}),
          ...(["active", "archived"].includes(workspacePatch.status) ? { status: workspacePatch.status } : {}),
          revision,
        },
      });
      return { ok: true, item: normalizePromptWorkspace(response.item || response.workspace || response) };
    }
    const templatesPath = `${workspacePath}/templates`;
    if (operation === "template.list") {
      const response = await request(`${templatesPath}${encodeQuery({
        cursor: payload.cursor,
        query: String(payload.query || "").trim().slice(0, 500),
        type: String(payload.type || "").trim().slice(0, 40),
        tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 20) : [],
        updatedAfter: String(payload.updatedAfter || "").trim().slice(0, 80),
        includeArchived: payload.includeArchived === true ? "true" : "",
        limit: Math.max(1, Math.min(200, Number(payload.limit || 100))),
      })}`, { method: "GET" });
      return {
        ok: true,
        items: normalizeTemplateList(response, workspaceId),
        permissions: response.permissions || null,
        nextCursor: String(response.nextCursor || ""),
      };
    }
    if (operation === "template.changes") {
      const response = await request(`${workspacePath}/changes${encodeQuery({
        cursor: payload.cursor,
        limit: Math.max(1, Math.min(500, Number(payload.limit || 200))),
      })}`, { method: "GET" });
      return {
        ok: true,
        items: normalizeTemplateList(response, workspaceId),
        tombstones: normalizeTombstones(response),
        nextCursor: String(response.nextCursor || ""),
        serverTime: response.serverTime || null,
      };
    }
    if (operation === "template.create") {
      const body = sanitizeSharedPromptTemplateInput(payload.template || {});
      const response = await request(templatesPath, {
        method: "POST",
        headers: { "Idempotency-Key": safeIdempotencyKey(payload.idempotencyKey) },
        body,
      });
      return { ok: true, ...normalizeTemplateResponse(response, workspaceId) };
    }
    const templateId = safeIdentifier(payload.templateId, "提示词模板");
    const templatePath = `${templatesPath}/${encodeURIComponent(templateId)}`;
    if (operation === "template.get") {
      const response = await request(templatePath, { method: "GET" });
      return { ok: true, ...normalizeTemplateResponse(response, workspaceId) };
    }
    if (operation === "template.update") {
      const revision = safeRevision(payload.revision);
      const body = { ...sanitizeSharedPromptTemplateInput(payload.template || {}), revision };
      const response = await request(templatePath, {
        method: "PATCH",
        headers: { "If-Match": `\"${revision}\"` },
        body,
      });
      return { ok: true, ...normalizeTemplateResponse(response, workspaceId) };
    }
    if (operation === "template.archive") {
      const revision = safeRevision(payload.revision);
      const response = await request(templatePath, {
        method: "PATCH",
        headers: { "If-Match": `\"${revision}\"` },
        body: { status: "archived", revision },
      });
      return { ok: true, ...normalizeTemplateResponse(response, workspaceId) };
    }
    if (operation === "template.delete") {
      const revision = safeRevision(payload.revision);
      const response = await request(templatePath, {
        method: "DELETE",
        headers: { "If-Match": `\"${revision}\"` },
        body: { revision },
      });
      return {
        ok: true,
        tombstone: {
          id: String(response.tombstone?.id || templateId),
          revision: safeRevision(response.tombstone?.revision || revision + 1),
        },
      };
    }
    if (operation === "template.copy") {
      const targetWorkspaceId = safeIdentifier(payload.targetWorkspaceId || workspaceId, "目标工作空间");
      const response = await request(`${templatePath}/copy`, {
        method: "POST",
        headers: { "Idempotency-Key": safeIdempotencyKey(payload.idempotencyKey) },
        body: { targetWorkspaceId },
      });
      return { ok: true, ...normalizeTemplateResponse(response, targetWorkspaceId) };
    }
    if (operation === "template.favorite" || operation === "template.unfavorite") {
      const response = await request(`${templatePath}/favorite`, {
        method: operation === "template.favorite" ? "POST" : "DELETE",
      });
      const normalized = response.item || response.template ? normalizeTemplateResponse(response, workspaceId) : {};
      return { ok: true, favorite: operation === "template.favorite", ...normalized };
    }
    const error = new Error("不支持的云提示词操作");
    error.code = "UNSUPPORTED_CLOUD_PROMPT_OPERATION";
    throw error;
  };

  return {
    invoke: async (payload) => {
      try {
        return await invoke(payload);
      } catch (error) {
        return cloudPromptErrorResult(error);
      }
    },
    mockEnabled,
  };
}

const defaultCloudPromptService = createCloudPromptService();

module.exports = {
  CLOUD_PROMPT_MOCK_ENV,
  accountContextFromState,
  cloudPromptErrorResult,
  createCloudPromptMockRequest,
  createCloudPromptService,
  defaultCloudPromptService,
  normalizeTemplateList,
  normalizeWorkspaceList,
  safeIdempotencyKey,
};
