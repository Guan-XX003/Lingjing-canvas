const CLOUD_PROMPT_TYPES = new Set(["generic", "text", "image", "video", "audio"]);
const CLOUD_PROMPT_STATUSES = new Set(["active", "archived"]);
const CLOUD_PROMPT_WORKSPACE_KINDS = new Set(["personal", "organization"]);

function cleanText(value, maxLength = 2000) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function cleanOptionalText(value, maxLength = 2000) {
  const text = cleanText(value, maxLength);
  return text || undefined;
}

function normalizePromptType(value) {
  const type = cleanText(value, 32).toLowerCase();
  if (type === "prompt") return "generic";
  if (type === "img" || type === "picture") return "image";
  return CLOUD_PROMPT_TYPES.has(type) ? type : "generic";
}

function normalizePromptParameters(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const output = {};
  const aspectRatio = cleanOptionalText(source.aspectRatio || source.ratio || source.size, 32);
  const resolution = cleanOptionalText(source.resolution || source.selectedResolution, 32);
  const imageSize = cleanOptionalText(source.imageSize, 32);
  const durationValue = source.durationSeconds ?? source.duration ?? source.selectedSeconds;
  const durationSeconds = Number(durationValue);
  if (aspectRatio) output.aspectRatio = aspectRatio;
  if (resolution) output.resolution = resolution;
  if (imageSize) output.imageSize = imageSize;
  if (Number.isFinite(durationSeconds) && durationSeconds > 0 && durationSeconds <= 3600) {
    output.durationSeconds = Math.round(durationSeconds * 100) / 100;
  }
  if (typeof source.generateAudio === "boolean") output.generateAudio = source.generateAudio;
  if (typeof source.watermark === "boolean") output.watermark = source.watermark;
  return output;
}

function normalizeTags(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/[,，\n]/);
  return [...new Set(values.map((item) => cleanText(item, 40)).filter(Boolean))].slice(0, 20);
}

function sanitizeSharedPromptTemplateInput(input = {}, options = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const content = cleanText(source.content ?? source.prompt, 20000);
  if (options.requireContent !== false && !content) {
    const error = new Error("提示词内容不能为空");
    error.code = "PROMPT_CONTENT_REQUIRED";
    throw error;
  }
  const title = cleanText(source.title || content.slice(0, 40) || "未命名提示词", 120);
  const output = {
    title: title || "未命名提示词",
    content,
    type: normalizePromptType(source.type || source.category),
    tags: normalizeTags(source.tags),
    parameters: normalizePromptParameters(source.parameters || source.params),
  };
  const description = cleanOptionalText(source.description, 2000);
  const modelHint = cleanOptionalText(source.modelHint || source.modelName, 160);
  const providerHint = cleanOptionalText(source.providerHint || source.sourceProvider, 120);
  const generationMode = cleanOptionalText(source.generationMode, 120);
  if (description) output.description = description;
  if (modelHint) output.modelHint = modelHint;
  if (providerHint) output.providerHint = providerHint;
  if (generationMode) output.generationMode = generationMode;
  return output;
}

function normalizePermissions(value = {}, role = "viewer") {
  const source = value && typeof value === "object" ? value : {};
  return {
    canRead: source.canRead !== false,
    // Mutating capabilities must be explicitly granted by the server. Role
    // labels are presentational and must never manufacture client authority.
    canCreate: source.canCreate === true,
    canEdit: source.canEdit === true,
    canEditOwn: source.canEditOwn === true,
    canDelete: source.canDelete === true,
    canShare: source.canShare === true,
    canFavorite: source.canFavorite !== false,
    canCopy: source.canCopy !== false,
  };
}

function normalizePromptWorkspace(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const role = cleanText(source.role || source.membershipRole || "viewer", 40).toLowerCase();
  const kindInput = cleanText(source.kind || source.type || (source.organizationId ? "organization" : "personal"), 40).toLowerCase();
  return {
    id: cleanText(source.id, 160),
    name: cleanText(source.name || source.title || (kindInput === "personal" ? "个人空间" : "企业空间"), 160),
    description: cleanOptionalText(source.description, 2000),
    kind: CLOUD_PROMPT_WORKSPACE_KINDS.has(kindInput) ? kindInput : "personal",
    organizationId: cleanOptionalText(source.organizationId || source.organization_id, 160),
    role,
    revision: Math.max(0, Number(source.revision || 0)),
    status: CLOUD_PROMPT_STATUSES.has(cleanText(source.status || "active", 32).toLowerCase()) ? cleanText(source.status || "active", 32).toLowerCase() : "active",
    memberCanCreate: source.memberCanCreate === true || source.member_can_create === true,
    permissions: normalizePermissions(source.permissions, role),
    updatedAt: source.updatedAt || source.updated_at || null,
  };
}

function normalizeSharedPromptTemplate(input = {}, options = {}) {
  const source = input && typeof input === "object" ? input : {};
  const safe = sanitizeSharedPromptTemplateInput(source, { requireContent: options.requireContent !== false });
  const createdBySource = source.createdBy && typeof source.createdBy === "object" ? source.createdBy : {};
  const statusInput = cleanText(source.status || "active", 32).toLowerCase();
  return {
    id: cleanText(source.id || source.templateId, 180),
    workspaceId: cleanText(source.workspaceId || source.workspace_id || options.workspaceId, 180),
    revision: Math.max(0, Number(source.revision || 0)),
    ...safe,
    status: CLOUD_PROMPT_STATUSES.has(statusInput) ? statusInput : "active",
    favorite: source.favorite === true || source.isFavorite === true,
    etag: cleanOptionalText(source.etag, 180),
    permissions: source.permissions ? normalizePermissions(source.permissions, source.role || "viewer") : undefined,
    createdBy: {
      id: cleanText(createdBySource.id || source.createdById || source.created_by_id, 160),
      displayName: cleanText(createdBySource.displayName || createdBySource.name || source.createdByName, 160),
    },
    createdAt: source.createdAt || source.created_at || null,
    updatedAt: source.updatedAt || source.updated_at || null,
  };
}

function cloudPromptTemplateToCanvasPayload(template = {}) {
  const normalized = normalizeSharedPromptTemplate(template, { requireContent: true });
  return {
    id: normalized.id,
    content: normalized.content,
    prompt: normalized.content,
    title: normalized.title,
    type: normalized.type,
    tags: normalized.tags,
    providerHint: normalized.providerHint || "",
    modelHint: normalized.modelHint || "",
    generationMode: normalized.generationMode || "",
    parameters: normalized.parameters,
  };
}

module.exports = {
  CLOUD_PROMPT_TYPES,
  cloudPromptTemplateToCanvasPayload,
  normalizePermissions,
  normalizePromptParameters,
  normalizePromptType,
  normalizePromptWorkspace,
  normalizeSharedPromptTemplate,
  sanitizeSharedPromptTemplateInput,
};
