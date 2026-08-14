const {
  normalizePermissions,
  sanitizeSharedPromptTemplateInput,
} = require("./cloud-prompt-contract.cjs");

const ENTERPRISE_TEAM_CACHE_VERSION = 2;
const ENTERPRISE_TEAM_TEMPLATE_FIELDS = new Set(["title", "content", "description", "type", "tags", "modelHint", "providerHint", "generationMode", "parameters"]);
const ENTERPRISE_TEAM_PARAMETER_FIELDS = new Set(["aspectRatio", "resolution", "durationSeconds", "imageSize", "generateAudio", "watermark"]);

function cleanText(value, maxLength = 2000) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function sanitizeEnterpriseTeamTemplateInput(input = {}, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    const error = new Error("团队模板必须是 JSON 对象");
    error.code = "TEAM_TEMPLATE_DTO_REJECTED";
    throw error;
  }
  const source = input;
  const unknownFields = Object.keys(source).filter((key) => !ENTERPRISE_TEAM_TEMPLATE_FIELDS.has(key));
  if (Object.prototype.hasOwnProperty.call(source, "parameters") &&
      (source.parameters == null || typeof source.parameters !== "object" || Array.isArray(source.parameters))) {
    const error = new Error("团队模板 parameters 必须是 JSON 对象");
    error.code = "TEAM_TEMPLATE_DTO_REJECTED";
    throw error;
  }
  const parameterSource = source.parameters || {};
  const unknownParameters = Object.keys(parameterSource).filter((key) => !ENTERPRISE_TEAM_PARAMETER_FIELDS.has(key));
  if (unknownFields.length || unknownParameters.length) {
    const error = new Error("团队模板包含不允许的字段");
    error.code = "TEAM_TEMPLATE_DTO_REJECTED";
    throw error;
  }
  const safe = sanitizeSharedPromptTemplateInput(source, {
    requireContent: options.requireContent !== false,
  });
  if (options.partial === true) {
    const output = {};
    for (const key of ["title", "content", "description", "type", "tags", "modelHint", "providerHint", "generationMode", "parameters"]) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
      if (["description", "modelHint", "providerHint", "generationMode"].includes(key)) {
        output[key] = safe[key] || "";
      } else {
        output[key] = safe[key];
      }
    }
    if (Object.prototype.hasOwnProperty.call(output, "title") && !output.title) {
      const error = new Error("提示词标题不能为空");
      error.code = "TEAM_TEMPLATE_TITLE_REQUIRED";
      throw error;
    }
    if (Object.prototype.hasOwnProperty.call(output, "content") && !output.content) {
      const error = new Error("提示词内容不能为空");
      error.code = "TEAM_TEMPLATE_CONTENT_REQUIRED";
      throw error;
    }
    return output;
  }
  if (!cleanText(source.title, 120)) {
    const error = new Error("提示词标题不能为空");
    error.code = "TEAM_TEMPLATE_TITLE_REQUIRED";
    throw error;
  }
  return safe;
}

function normalizeEnterpriseTeamTemplate(input = {}, context = {}) {
  const source = input && typeof input === "object" ? input : {};
  const expectedOrganizationId = cleanText(context.organizationId, 160);
  const expectedGatewayId = cleanText(context.gatewayId, 160);
  const sourceOrganizationId = cleanText(source.organizationId, 160);
  const sourceGatewayId = cleanText(source.gatewayId, 160);
  if ((expectedOrganizationId && sourceOrganizationId && sourceOrganizationId !== expectedOrganizationId) ||
      (expectedGatewayId && sourceGatewayId && sourceGatewayId !== expectedGatewayId)) {
    const error = new Error("团队模板不属于当前企业网关");
    error.code = "TEAM_TEMPLATE_SCOPE_MISMATCH";
    throw error;
  }
  const safeInput = Object.fromEntries(Object.entries(source).filter(([key]) => ENTERPRISE_TEAM_TEMPLATE_FIELDS.has(key)));
  const safe = sanitizeEnterpriseTeamTemplateInput(safeInput, { requireContent: true });
  const authorSource = source.author && typeof source.author === "object" ? source.author : {};
  return {
    id: cleanText(source.id, 180),
    organizationId: sourceOrganizationId || expectedOrganizationId,
    gatewayId: sourceGatewayId || expectedGatewayId,
    ...safe,
    status: cleanText(source.status || "active", 32) === "archived" ? "archived" : "active",
    revision: revisionOf(source.revision),
    author: { id: cleanText(authorSource.id, 160) },
    permissions: normalizePermissions(source.permissions, context.role || "member"),
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
}

function enterpriseTeamScopeKey(context = {}) {
  const organizationId = cleanText(context.organizationId, 160);
  const gatewayId = cleanText(context.gatewayId, 160);
  return organizationId && gatewayId ? `${organizationId}:${gatewayId}` : "";
}

function emptyEnterpriseTeamCache(context = {}) {
  return {
    version: ENTERPRISE_TEAM_CACHE_VERSION,
    organizationId: cleanText(context.organizationId, 160),
    gatewayId: cleanText(context.gatewayId, 160),
    userId: cleanText(context.userId, 160),
    cursor: "",
    items: [],
    role: cleanText(context.role || "member", 40),
    permissions: normalizePermissions(context.permissions, context.role || "member"),
    serverTime: null,
    syncedAt: 0,
  };
}

function revisionOf(value) {
  const revision = Number(value || 0);
  return Number.isFinite(revision) && revision >= 0 ? revision : 0;
}

function mergeEnterpriseTeamTemplatePage(cache = {}, response = {}, context = {}, options = {}) {
  const scope = {
    organizationId: cleanText(context.organizationId || cache.organizationId, 160),
    gatewayId: cleanText(context.gatewayId || cache.gatewayId, 160),
    userId: cleanText(context.userId || cache.userId, 160),
    role: cleanText(response.role || context.role || cache.role || "member", 40),
    permissions: response.permissions || context.permissions || cache.permissions,
  };
  const base = options.replace === true ? emptyEnterpriseTeamCache(scope) : {
    ...emptyEnterpriseTeamCache(scope),
    ...(cache && typeof cache === "object" ? cache : {}),
    ...scope,
  };
  const byId = new Map();
  for (const item of Array.isArray(base.items) ? base.items : []) {
    try {
      const normalized = normalizeEnterpriseTeamTemplate(item, scope);
      if (normalized.id && normalized.status !== "archived") byId.set(normalized.id, normalized);
    } catch {}
  }
  for (const item of Array.isArray(response.items) ? response.items : []) {
    const normalized = normalizeEnterpriseTeamTemplate(item, scope);
    if (!normalized.id) continue;
    const existing = byId.get(normalized.id);
    if (!existing || revisionOf(normalized.revision) >= revisionOf(existing.revision)) {
      if (normalized.status === "archived") byId.delete(normalized.id);
      else byId.set(normalized.id, normalized);
    }
  }
  for (const tombstone of Array.isArray(response.tombstones) ? response.tombstones : []) {
    const id = cleanText(tombstone?.id, 180);
    if (!id) continue;
    const existing = byId.get(id);
    if (!existing || revisionOf(tombstone?.revision) >= revisionOf(existing.revision)) byId.delete(id);
  }
  return {
    ...base,
    organizationId: scope.organizationId,
    gatewayId: scope.gatewayId,
    userId: scope.userId,
    cursor: cleanText(response.nextCursor ?? base.cursor, 2000),
    items: [...byId.values()].sort((left, right) =>
      new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime()
    ),
    role: scope.role,
    permissions: normalizePermissions(scope.permissions, scope.role),
    serverTime: response.serverTime || base.serverTime || null,
    syncedAt: Number(options.syncedAt || Date.now()),
  };
}

function enterpriseTeamTemplateToWorkspace(template = {}, context = {}) {
  const normalized = normalizeEnterpriseTeamTemplate(template, context);
  return {
    id: normalized.id,
    title: normalized.title,
    prompt: normalized.content,
    type: normalized.type,
    groupId: "",
    sourceProvider: normalized.providerHint || "",
    modelName: normalized.modelHint || "",
    generationMode: normalized.generationMode || "text-to-video",
    params: normalized.parameters,
    createdAt: normalized.createdAt ? new Date(normalized.createdAt).getTime() : Date.now(),
    updatedAt: normalized.updatedAt ? new Date(normalized.updatedAt).getTime() : Date.now(),
    enterpriseTeam: true,
    organizationId: normalized.organizationId,
    gatewayId: normalized.gatewayId,
    revision: normalized.revision,
    author: normalized.author,
    permissions: normalized.permissions,
  };
}

function normalizeEnterpriseTeamTemplateResponse(response = {}, context = {}) {
  const source = response && typeof response === "object" ? response : {};
  const output = { ok: source.ok !== false };
  if (source.item) output.item = normalizeEnterpriseTeamTemplate(source.item, context);
  if (Array.isArray(source.items)) output.items = source.items.map((item) => normalizeEnterpriseTeamTemplate(item, context));
  if (Array.isArray(source.tombstones)) {
    output.tombstones = source.tombstones.map((item) => ({
      id: cleanText(item?.id, 180),
      revision: revisionOf(item?.revision),
      deletedAt: item?.deletedAt || null,
    })).filter((item) => item.id);
  }
  if (source.tombstone) {
    const tombstone = source.tombstone;
    output.tombstone = {
      id: cleanText(tombstone?.id, 180),
      revision: revisionOf(tombstone?.revision),
      deletedAt: tombstone?.deletedAt || null,
    };
  }
  if (Object.prototype.hasOwnProperty.call(source, "nextCursor")) output.nextCursor = cleanText(source.nextCursor, 2000);
  if (Object.prototype.hasOwnProperty.call(source, "serverTime")) output.serverTime = source.serverTime || null;
  if (Object.prototype.hasOwnProperty.call(source, "role")) output.role = cleanText(source.role || context.role || "member", 40);
  if (source.permissions) output.permissions = normalizePermissions(source.permissions, source.role || context.role || "member");
  return output;
}

function normalizeEnterpriseTeamConflictDetails(details = {}) {
  const source = details && typeof details === "object" ? details : {};
  return {
    id: cleanText(source.id, 180),
    revision: revisionOf(source.revision),
    updatedAt: source.updatedAt || null,
  };
}

module.exports = {
  ENTERPRISE_TEAM_CACHE_VERSION,
  emptyEnterpriseTeamCache,
  enterpriseTeamScopeKey,
  enterpriseTeamTemplateToWorkspace,
  mergeEnterpriseTeamTemplatePage,
  normalizeEnterpriseTeamConflictDetails,
  normalizeEnterpriseTeamTemplate,
  normalizeEnterpriseTeamTemplateResponse,
  sanitizeEnterpriseTeamTemplateInput,
};
