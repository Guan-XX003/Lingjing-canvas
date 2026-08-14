// Enterprise team prompt templates stay on the local gateway and are isolated by organization + gateway.
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { app } = require("./electron-refs.cjs");

const STORE_VERSION = 1;
const MAX_ACTIVE_TEMPLATES = 5000;
const MAX_STORE_BYTES = 64 * 1024 * 1024;
const MAX_AUDIT_RECORDS = 5000;
const MAX_IDEMPOTENCY_RECORDS = 5000;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const TEMPLATE_TYPES = new Set(["text", "image", "video", "audio", "generic"]);
const INPUT_KEYS = new Set([
  "title",
  "content",
  "description",
  "type",
  "tags",
  "modelHint",
  "providerHint",
  "generationMode",
  "parameters",
]);
const PARAMETER_KEYS = new Set([
  "aspectRatio",
  "resolution",
  "durationSeconds",
  "imageSize",
  "generateAudio",
  "watermark",
]);

class TeamTemplateError extends Error {
  constructor(message, options = {}) {
    super(String(message || "团队提示词操作失败"));
    this.name = "TeamTemplateError";
    this.status = Number(options.status || 400);
    this.code = String(options.code || "TEAM_TEMPLATE_INVALID");
    this.details = options.details && typeof options.details === "object" ? options.details : null;
  }
}

function gatewayRoot() {
  return path.join(app.getPath("userData"), "enterprise-gateway");
}

function storePath() {
  return path.join(gatewayRoot(), "team-templates.json");
}

function auditPath() {
  return path.join(gatewayRoot(), "team-template-audit.json");
}

function atomicWrite(filePath, value) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(directory, 0o700); } catch {}
  const temp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(temp, value, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temp, filePath);
  } finally {
    try { fs.rmSync(temp, { force: true }); } catch {}
  }
}

function normalizedScope(principal) {
  const organizationId = String(principal?.organizationId || "").trim();
  const gatewayId = String(principal?.gatewayId || "").trim();
  const userId = String(principal?.userId || "").trim();
  const role = String(principal?.role || "member").toLowerCase();
  if (!organizationId || !gatewayId || !userId) {
    throw new TeamTemplateError("企业团队提示词身份不完整", { status: 403, code: "TEAM_TEMPLATE_FORBIDDEN" });
  }
  if (!["member", "owner", "admin"].includes(role)) {
    throw new TeamTemplateError("当前企业角色无权访问团队提示词", { status: 403, code: "TEAM_TEMPLATE_FORBIDDEN" });
  }
  return { organizationId, gatewayId, userId, role };
}

function emptyStore(scope) {
  return {
    version: STORE_VERSION,
    organizationId: scope.organizationId,
    gatewayId: scope.gatewayId,
    lastTimestamp: 0,
    templates: [],
    idempotency: [],
  };
}

function readStore(principal) {
  const scope = normalizedScope(principal);
  let serialized;
  try {
    serialized = fs.readFileSync(storePath(), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return emptyStore(scope);
    throw new TeamTemplateError("团队提示词存储暂不可用", { status: 503, code: "TEAM_TEMPLATE_STORE_UNAVAILABLE" });
  }
  let value;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new TeamTemplateError("团队提示词存储已损坏，已停止读写", { status: 503, code: "TEAM_TEMPLATE_STORE_CORRUPT" });
  }
  if (value?.version !== STORE_VERSION || !Array.isArray(value?.templates) || !Array.isArray(value?.idempotency) ||
      !Number.isFinite(Number(value?.lastTimestamp || 0))) {
    throw new TeamTemplateError("团队提示词存储格式不受支持", { status: 503, code: "TEAM_TEMPLATE_STORE_CORRUPT" });
  }
  if (String(value?.organizationId || "") !== scope.organizationId || String(value?.gatewayId || "") !== scope.gatewayId) {
    throw new TeamTemplateError("团队提示词存储不属于当前企业网关", {
      status: 403,
      code: "TEAM_TEMPLATE_SCOPE_MISMATCH",
    });
  }
  const store = {
    version: STORE_VERSION,
    organizationId: scope.organizationId,
    gatewayId: scope.gatewayId,
    lastTimestamp: Number(value?.lastTimestamp || 0),
    templates: Array.isArray(value?.templates) ? value.templates : [],
    idempotency: Array.isArray(value?.idempotency) ? value.idempotency : [],
  };
  if (store.templates.some((item) => !isPlainObject(item) || !String(item.id || "") ||
      String(item.organizationId || "") !== scope.organizationId || String(item.gatewayId || "") !== scope.gatewayId ||
      !["active", "archived", "deleted"].includes(String(item.status || "")) ||
      !Number.isInteger(Number(item.revision)) || Number(item.revision) < 1 ||
      !Number.isFinite(Number(item.createdAt)) || !Number.isFinite(Number(item.updatedAt)))) {
    throw new TeamTemplateError("团队提示词存储包含无效记录", { status: 503, code: "TEAM_TEMPLATE_STORE_CORRUPT" });
  }
  return store;
}

function serializeStore(store) {
  const serialized = JSON.stringify(store, null, 2);
  if (Buffer.byteLength(serialized, "utf8") > MAX_STORE_BYTES) {
    throw new TeamTemplateError("团队提示词存储已达到容量上限", { status: 507, code: "TEAM_TEMPLATE_STORE_FULL" });
  }
  return serialized;
}

function nextTimestamp(store) {
  const value = Math.max(Date.now(), Number(store.lastTimestamp || 0) + 1);
  store.lastTimestamp = value;
  return value;
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function assertKnownKeys(value, allowed, code = "TEAM_TEMPLATE_DTO_REJECTED") {
  if (!isPlainObject(value)) {
    throw new TeamTemplateError("团队提示词参数必须是 JSON 对象", { status: 400, code });
  }
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new TeamTemplateError("团队提示词包含不允许保存的字段", {
      status: 400,
      code,
      details: { fields: unknown.slice(0, 20) },
    });
  }
}

function limitedString(value, field, maxLength, options = {}) {
  if (value === undefined && options.optional) return undefined;
  if (typeof value !== "string") {
    throw new TeamTemplateError(`${field} 必须是字符串`, { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
  }
  const normalized = options.preserveWhitespace ? value : value.trim();
  if (!options.allowEmpty && !normalized.trim().length) {
    throw new TeamTemplateError(`${field} 不能为空`, { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
  }
  if (normalized.length > maxLength) {
    throw new TeamTemplateError(`${field} 超过长度限制`, { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
  }
  return normalized;
}

function assertSafeStructuredString(value, field) {
  if (/^(?:file|blob|data):/i.test(value) || /^(?:[a-zA-Z]:[\\/]|\/Users\/|\/home\/|\/var\/|\/tmp\/)/.test(value)) {
    throw new TeamTemplateError(`${field} 不允许包含本地路径或内嵌文件地址`, {
      status: 400,
      code: "TEAM_TEMPLATE_DTO_REJECTED",
    });
  }
}

function normalizeParameters(value, optional) {
  if (value === undefined && optional) return undefined;
  if (value === undefined || value === null) return {};
  assertKnownKeys(value, PARAMETER_KEYS);
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (["generateAudio", "watermark"].includes(key)) {
      if (typeof item !== "boolean") {
        throw new TeamTemplateError(`${key} 必须是布尔值`, { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
      }
      result[key] = item;
      continue;
    }
    if (key === "durationSeconds") {
      const duration = Number(item);
      if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) {
        throw new TeamTemplateError("durationSeconds 超出允许范围", { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
      }
      result[key] = duration;
      continue;
    }
    const text = limitedString(item, key, 80);
    assertSafeStructuredString(text, key);
    result[key] = text;
  }
  return result;
}

function normalizeTeamTemplateInput(input, options = {}) {
  assertKnownKeys(input, INPUT_KEYS);
  const partial = options.partial === true;
  const result = {};
  if (!partial || input.title !== undefined) result.title = limitedString(input.title, "title", 120, { optional: partial });
  if (!partial || input.content !== undefined) {
    result.content = limitedString(input.content, "content", 20000, { optional: partial, preserveWhitespace: true });
  }
  if (!partial || input.description !== undefined) {
    result.description = limitedString(input.description ?? "", "description", 2000, { optional: partial, allowEmpty: true, preserveWhitespace: true });
  }
  if (!partial || input.type !== undefined) {
    const type = limitedString(input.type ?? "generic", "type", 20, { optional: partial }).toLowerCase();
    if (!TEMPLATE_TYPES.has(type)) {
      throw new TeamTemplateError("type 不属于允许的提示词类型", { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
    }
    result.type = type;
  }
  if (!partial || input.tags !== undefined) {
    if (input.tags !== undefined && !Array.isArray(input.tags)) {
      throw new TeamTemplateError("tags 必须是数组", { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
    }
    const tags = [...new Set((input.tags || []).map((item) => limitedString(item, "tag", 40)))];
    if (tags.length > 20) {
      throw new TeamTemplateError("tags 数量超过限制", { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
    }
    result.tags = tags;
  }
  for (const [key, maxLength] of [["modelHint", 160], ["providerHint", 120], ["generationMode", 120]]) {
    if (!partial || input[key] !== undefined) {
      const text = limitedString(input[key] ?? "", key, maxLength, { optional: partial, allowEmpty: true });
      if (text !== undefined) assertSafeStructuredString(text, key);
      result[key] = text;
    }
  }
  if (!partial || input.parameters !== undefined) result.parameters = normalizeParameters(input.parameters, partial);
  if (partial && !Object.keys(result).length) {
    throw new TeamTemplateError("更新请求没有可修改字段", { status: 400, code: "TEAM_TEMPLATE_DTO_REJECTED" });
  }
  return result;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function pruneIdempotency(store, now) {
  store.idempotency = store.idempotency
    .filter((item) => Number(item.createdAt || 0) > now - IDEMPOTENCY_TTL_MS)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))
    .slice(0, MAX_IDEMPOTENCY_RECORDS);
}

function readAudit() {
  let serialized;
  try {
    serialized = fs.readFileSync(auditPath(), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return { version: 1, records: [] };
    throw new TeamTemplateError("团队提示词审计日志暂不可用", { status: 503, code: "TEAM_TEMPLATE_AUDIT_UNAVAILABLE" });
  }
  let value;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new TeamTemplateError("团队提示词审计日志已损坏，已停止写入", { status: 503, code: "TEAM_TEMPLATE_AUDIT_CORRUPT" });
  }
  if (value?.version !== 1 || !Array.isArray(value?.records)) {
    throw new TeamTemplateError("团队提示词审计日志格式不受支持", { status: 503, code: "TEAM_TEMPLATE_AUDIT_CORRUPT" });
  }
  return value;
}

function nextAudit(principal, action, template, result = "success") {
  const value = readAudit();
  const records = Array.isArray(value?.records) ? value.records : [];
  records.unshift({
    timestamp: Date.now(),
    action: String(action),
    templateId: String(template?.id || ""),
    actorUserId: String(principal.userId),
    organizationId: String(principal.organizationId),
    gatewayId: String(principal.gatewayId),
    role: String(principal.role),
    revision: Number(template?.revision || 0),
    result: String(result),
  });
  return JSON.stringify({ version: 1, records: records.slice(0, MAX_AUDIT_RECORDS) }, null, 2);
}

function cloneStore(store) {
  return JSON.parse(JSON.stringify(store));
}

function commitMutation(previousStore, store, principal, action, template) {
  const previousExisted = fs.existsSync(storePath());
  const previousSerialized = serializeStore(previousStore);
  const nextSerialized = serializeStore(store);
  const auditSerialized = nextAudit(principal, action, template);
  try {
    atomicWrite(storePath(), nextSerialized);
  } catch {
    throw new TeamTemplateError("团队提示词存储写入失败", { status: 503, code: "TEAM_TEMPLATE_STORE_UNAVAILABLE" });
  }
  try {
    atomicWrite(auditPath(), auditSerialized);
  } catch {
    try {
      if (previousExisted) atomicWrite(storePath(), previousSerialized);
      else fs.rmSync(storePath(), { force: true });
    } catch {}
    throw new TeamTemplateError("团队提示词审计写入失败，模板变更已回滚", {
      status: 503,
      code: "TEAM_TEMPLATE_AUDIT_UNAVAILABLE",
    });
  }
}

function canManage(principal, template) {
  return principal.role === "owner" || principal.role === "admin" || String(template.authorUserId) === principal.userId;
}

function permissionsFor(principal, template) {
  const canManageTemplate = canManage(principal, template);
  return { canRead: true, canEdit: canManageTemplate, canDelete: canManageTemplate };
}

function isoTime(value) {
  return new Date(Number(value || 0)).toISOString();
}

function publicTemplate(template, principal) {
  return {
    id: String(template.id),
    organizationId: String(template.organizationId),
    gatewayId: String(template.gatewayId),
    title: String(template.title || ""),
    content: String(template.content || ""),
    description: String(template.description || ""),
    type: String(template.type || "generic"),
    tags: Array.isArray(template.tags) ? template.tags : [],
    modelHint: String(template.modelHint || ""),
    providerHint: String(template.providerHint || ""),
    generationMode: String(template.generationMode || ""),
    parameters: isPlainObject(template.parameters) ? template.parameters : {},
    status: String(template.status || "active"),
    revision: Number(template.revision || 1),
    author: { id: String(template.authorUserId || "") },
    permissions: permissionsFor(principal, template),
    createdAt: isoTime(template.createdAt),
    updatedAt: isoTime(template.updatedAt),
  };
}

function encodeCursor(timestamp, id, direction) {
  return Buffer.from(JSON.stringify({ v: 1, t: Number(timestamp), id: String(id), d: direction }), "utf8").toString("base64url");
}

function decodeCursor(cursor, direction) {
  if (!cursor) return null;
  try {
    const value = JSON.parse(Buffer.from(String(cursor), "base64url").toString("utf8"));
    if (value.v !== 1 || value.d !== direction || !Number.isFinite(Number(value.t)) || !String(value.id || "")) throw new Error();
    return { timestamp: Number(value.t), id: String(value.id) };
  } catch {
    throw new TeamTemplateError("团队提示词游标无效", { status: 400, code: "TEAM_TEMPLATE_CURSOR_INVALID" });
  }
}

function normalizedLimit(value, fallback, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > max) {
    throw new TeamTemplateError("limit 超出允许范围", { status: 400, code: "TEAM_TEMPLATE_CURSOR_INVALID" });
  }
  return limit;
}

function normalizedUpdatedAfter(value) {
  if (value === undefined || value === null || value === "") return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) return numeric;
  const parsed = Date.parse(String(value));
  if (!Number.isFinite(parsed)) {
    throw new TeamTemplateError("updatedAfter 格式无效", { status: 400, code: "TEAM_TEMPLATE_CURSOR_INVALID" });
  }
  return parsed;
}

function assertExpectedRevision(template, expectedRevision) {
  const revision = Number(expectedRevision);
  if (!Number.isInteger(revision) || revision < 1) {
    throw new TeamTemplateError("更新或删除必须提供 revision/If-Match", {
      status: 428,
      code: "TEAM_TEMPLATE_REVISION_REQUIRED",
    });
  }
  if (revision !== Number(template.revision || 0)) {
    throw new TeamTemplateError("团队提示词已被其他成员修改", {
      status: 409,
      code: "TEAM_TEMPLATE_CONFLICT",
      details: { id: String(template.id), revision: Number(template.revision), updatedAt: isoTime(template.updatedAt) },
    });
  }
}

function createTeamTemplate(principalValue, input, idempotencyKey) {
  const principal = normalizedScope(principalValue);
  const key = String(idempotencyKey || "").trim();
  if (key.length < 8 || key.length > 120) {
    throw new TeamTemplateError("创建团队提示词必须提供有效 Idempotency-Key", {
      status: 400,
      code: "IDEMPOTENCY_KEY_REQUIRED",
    });
  }
  const normalized = normalizeTeamTemplateInput(input);
  const store = readStore(principal);
  const previousStore = cloneStore(store);
  const now = Date.now();
  pruneIdempotency(store, now);
  const keyHash = hashValue(`${principal.userId}\0${key}`);
  const payloadHash = hashValue(stableJson(normalized));
  const prior = store.idempotency.find((item) => item.keyHash === keyHash);
  if (prior) {
    if (prior.payloadHash !== payloadHash) {
      throw new TeamTemplateError("Idempotency-Key 已用于不同请求", { status: 409, code: "IDEMPOTENCY_CONFLICT" });
    }
    const existing = store.templates.find((item) => item.id === prior.templateId);
    if (!existing || existing.status === "deleted") {
      throw new TeamTemplateError("该幂等请求对应的团队提示词已删除", {
        status: 409,
        code: "IDEMPOTENCY_RESOURCE_GONE",
      });
    }
    return publicTemplate(existing, principal);
  }
  if (store.templates.filter((item) => item.status !== "deleted").length >= MAX_ACTIVE_TEMPLATES) {
    throw new TeamTemplateError("团队提示词数量已达到上限", { status: 409, code: "TEAM_TEMPLATE_LIMIT_REACHED" });
  }
  const timestamp = nextTimestamp(store);
  const template = {
    id: `team_template_${crypto.randomUUID()}`,
    organizationId: principal.organizationId,
    gatewayId: principal.gatewayId,
    authorUserId: principal.userId,
    ...normalized,
    status: "active",
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: 0,
  };
  store.templates.push(template);
  store.idempotency.unshift({ keyHash, payloadHash, templateId: template.id, createdAt: now });
  pruneIdempotency(store, now);
  commitMutation(previousStore, store, principal, "create", template);
  return publicTemplate(template, principal);
}

function getTeamTemplate(principalValue, templateId) {
  const principal = normalizedScope(principalValue);
  const template = readStore(principal).templates.find((item) => item.id === String(templateId || "") && item.status !== "deleted");
  if (!template) throw new TeamTemplateError("团队提示词不存在", { status: 404, code: "TEAM_TEMPLATE_NOT_FOUND" });
  return publicTemplate(template, principal);
}

function listTeamTemplates(principalValue, options = {}) {
  const principal = normalizedScope(principalValue);
  const store = readStore(principal);
  const cursor = decodeCursor(options.cursor, "desc");
  const limit = normalizedLimit(options.limit, 50, 200);
  const updatedAfter = normalizedUpdatedAfter(options.updatedAfter);
  const includeArchived = options.includeArchived === true || String(options.includeArchived || "").toLowerCase() === "true";
  let items = store.templates.filter((item) => item.status === "active" || (includeArchived && item.status === "archived"));
  if (updatedAfter) items = items.filter((item) => Number(item.updatedAt || 0) > updatedAfter);
  items.sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0) || String(right.id).localeCompare(String(left.id)));
  if (cursor) {
    items = items.filter((item) => Number(item.updatedAt || 0) < cursor.timestamp ||
      (Number(item.updatedAt || 0) === cursor.timestamp && String(item.id).localeCompare(cursor.id) < 0));
  }
  const page = items.slice(0, limit);
  const hasMore = items.length > page.length;
  const last = page.at(-1);
  return {
    items: page.map((item) => publicTemplate(item, principal)),
    nextCursor: hasMore && last ? encodeCursor(last.updatedAt, last.id, "desc") : null,
    serverTime: new Date().toISOString(),
    role: principal.role,
    permissions: { canRead: true, canCreate: true },
  };
}

function updateTeamTemplate(principalValue, templateId, input, expectedRevision) {
  const principal = normalizedScope(principalValue);
  const normalized = normalizeTeamTemplateInput(input, { partial: true });
  const store = readStore(principal);
  const previousStore = cloneStore(store);
  const template = store.templates.find((item) => item.id === String(templateId || "") && item.status !== "deleted");
  if (!template) throw new TeamTemplateError("团队提示词不存在", { status: 404, code: "TEAM_TEMPLATE_NOT_FOUND" });
  if (!canManage(principal, template)) {
    throw new TeamTemplateError("只有作者或企业管理员可以修改该模板", { status: 403, code: "TEAM_TEMPLATE_FORBIDDEN" });
  }
  assertExpectedRevision(template, expectedRevision);
  Object.assign(template, normalized);
  template.revision = Number(template.revision || 0) + 1;
  template.updatedAt = nextTimestamp(store);
  commitMutation(previousStore, store, principal, "update", template);
  return publicTemplate(template, principal);
}

function deleteTeamTemplate(principalValue, templateId, expectedRevision) {
  const principal = normalizedScope(principalValue);
  const store = readStore(principal);
  const previousStore = cloneStore(store);
  const template = store.templates.find((item) => item.id === String(templateId || "") && item.status !== "deleted");
  if (!template) throw new TeamTemplateError("团队提示词不存在", { status: 404, code: "TEAM_TEMPLATE_NOT_FOUND" });
  if (!canManage(principal, template)) {
    throw new TeamTemplateError("只有作者或企业管理员可以删除该模板", { status: 403, code: "TEAM_TEMPLATE_FORBIDDEN" });
  }
  assertExpectedRevision(template, expectedRevision);
  template.status = "deleted";
  template.revision = Number(template.revision || 0) + 1;
  template.updatedAt = nextTimestamp(store);
  template.deletedAt = template.updatedAt;
  template.title = "";
  template.content = "";
  template.description = "";
  template.tags = [];
  template.modelHint = "";
  template.providerHint = "";
  template.generationMode = "";
  template.parameters = {};
  commitMutation(previousStore, store, principal, "delete", template);
  return { id: template.id, revision: template.revision, deletedAt: isoTime(template.deletedAt) };
}

function listTeamTemplateChanges(principalValue, options = {}) {
  const principal = normalizedScope(principalValue);
  const store = readStore(principal);
  const cursor = decodeCursor(options.cursor, "asc");
  const limit = normalizedLimit(options.limit, 100, 500);
  let items = [...store.templates].sort((left, right) => Number(left.updatedAt || 0) - Number(right.updatedAt || 0) || String(left.id).localeCompare(String(right.id)));
  if (cursor) {
    items = items.filter((item) => Number(item.updatedAt || 0) > cursor.timestamp ||
      (Number(item.updatedAt || 0) === cursor.timestamp && String(item.id).localeCompare(cursor.id) > 0));
  }
  const page = items.slice(0, limit);
  const last = page.at(-1);
  return {
    items: page.filter((item) => item.status !== "deleted").map((item) => publicTemplate(item, principal)),
    tombstones: page.filter((item) => item.status === "deleted").map((item) => ({
      id: String(item.id),
      revision: Number(item.revision),
      deletedAt: isoTime(item.deletedAt || item.updatedAt),
    })),
    nextCursor: last ? encodeCursor(last.updatedAt, last.id, "asc") : (options.cursor || null),
    serverTime: new Date().toISOString(),
  };
}

module.exports = {
  TeamTemplateError,
  createTeamTemplate,
  deleteTeamTemplate,
  getTeamTemplate,
  listTeamTemplateChanges,
  listTeamTemplates,
  normalizeTeamTemplateInput,
  updateTeamTemplate,
};
