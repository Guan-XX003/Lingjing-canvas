const crypto = require("node:crypto");

const {
  cloudPromptTemplateToCanvasPayload,
  normalizePromptWorkspace,
  normalizeSharedPromptTemplate,
  sanitizeSharedPromptTemplateInput,
} = require("../shared/cloud-prompt-contract.cjs");
const { defaultCloudPromptStore } = require("./cloud-prompt-store.cjs");

function createCloudPromptWorkspaceController(options = {}) {
  const store = options.store || defaultCloudPromptStore;
  const invoke = options.invoke;
  const escape = options.escapeHtml || ((value) => String(value || ""));
  const t = options.t || ((value) => String(value || ""));
  const toast = options.toast || (() => {});
  const requestRender = options.requestRender || (() => {});
  const createCanvasNode = options.createCanvasNode || (() => {});
  const captureSelectedNode = options.captureSelectedNode || (() => {});
  const state = {
    initialized: false,
    authenticated: false,
    loading: false,
    syncing: false,
    offline: false,
    mock: false,
    error: "",
    account: null,
    workspaces: [],
    activeWorkspaceId: "",
    templates: [],
    query: "",
    typeFilter: "all",
    tagFilter: "",
    editor: null,
    lastBootstrapAt: 0,
  };

  const activeWorkspace = () => state.workspaces.find((item) => item.id === state.activeWorkspaceId) || null;
  const personalWorkspace = () => state.workspaces.find((item) => item.kind === "personal") || null;
  const can = (permission) => activeWorkspace()?.permissions?.[permission] === true;
  const uuid = (prefix) => `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
  const updateTemplates = async () => {
    if (!state.account?.id || !state.activeWorkspaceId) {
      state.templates = [];
      return state.templates;
    }
    state.templates = await store.listTemplates(state.account.id, state.activeWorkspaceId, { includeArchived: true });
    return state.templates;
  };
  const markOffline = (result) => {
    state.offline = result?.offline === true || Number(result?.status || 0) >= 500;
    state.error = String(result?.error || "");
  };
  const permissionAllows = (workspace, operation) => {
    const permissions = workspace?.permissions || {};
    if (operation === "template.create") return permissions.canCreate === true;
    if (operation === "template.copy") return permissions.canCopy !== false;
    if (operation === "template.update") return permissions.canEdit === true;
    if (["template.favorite", "template.unfavorite"].includes(operation)) return permissions.canFavorite !== false;
    if (operation === "template.archive") return permissions.canDelete === true || permissions.canEdit === true;
    return true;
  };

  const executeQueueEntry = async (entry) => {
    const workspace = state.workspaces.find((item) => item.id === entry.workspaceId);
    if (!workspace || !permissionAllows(workspace, entry.operation)) {
      await store.removeQueueEntry(entry.id);
      if (entry.templateId) {
        const existing = (await store.listTemplates(entry.accountId, entry.workspaceId, { includeArchived: true }))
          .find((item) => item.id === entry.templateId);
        if (existing) await store.putTemplate(entry.accountId, entry.workspaceId, existing, "permission-denied");
      }
      return { ok: false, permissionDenied: true };
    }
    const result = await invoke({
      operation: entry.operation,
      workspaceId: entry.workspaceId,
      templateId: entry.templateId,
      targetWorkspaceId: entry.targetWorkspaceId,
      template: entry.template,
      revision: entry.revision,
      idempotencyKey: entry.idempotencyKey,
    });
    if (result?.ok) {
      if (entry.operation === "template.create") {
        if (entry.templateId) await store.removeTemplate(entry.accountId, entry.workspaceId, entry.templateId);
        if (result.item?.id) await store.putTemplate(entry.accountId, entry.workspaceId, result.item, "synced");
      } else if (entry.operation === "template.copy") {
        if (result.item?.id) await store.putTemplate(entry.accountId, entry.targetWorkspaceId || entry.workspaceId, result.item, "synced");
      } else if (entry.operation === "template.delete") {
        await store.removeTemplate(entry.accountId, entry.workspaceId, entry.templateId);
      } else if (result.item?.id) {
        await store.putTemplate(entry.accountId, entry.workspaceId, result.item, "synced");
      } else if (["template.favorite", "template.unfavorite"].includes(entry.operation)) {
        const existing = (await store.listTemplates(entry.accountId, entry.workspaceId, { includeArchived: true }))
          .find((item) => item.id === entry.templateId);
        if (existing) await store.putTemplate(entry.accountId, entry.workspaceId, {
          ...existing,
          favorite: entry.operation === "template.favorite",
        }, "synced");
      }
      await store.removeQueueEntry(entry.id);
      return result;
    }
    if (Number(result?.status || 0) === 409) {
      const existing = (await store.listTemplates(entry.accountId, entry.workspaceId, { includeArchived: true }))
        .find((item) => item.id === entry.templateId);
      if (existing) {
        await store.putTemplate(entry.accountId, entry.workspaceId, {
          ...existing,
          conflict: {
            reason: "revision-conflict",
            serverVersion: result.conflict?.serverVersion || null,
          },
        }, "conflict");
      }
      await store.removeQueueEntry(entry.id);
      return result;
    }
    if (Number(result?.status || 0) === 401 || Number(result?.status || 0) === 403) {
      const existing = (await store.listTemplates(entry.accountId, entry.workspaceId, { includeArchived: true }))
        .find((item) => item.id === entry.templateId);
      if (existing) await store.putTemplate(entry.accountId, entry.workspaceId, existing, "permission-denied");
      await store.removeQueueEntry(entry.id);
      return result;
    }
    markOffline(result);
    return result;
  };

  const flushQueue = async () => {
    if (!state.account?.id || state.offline) return;
    const queue = await store.listQueue(state.account.id);
    for (const entry of queue) {
      const result = await executeQueueEntry(entry);
      if (result?.offline) break;
    }
    await updateTemplates();
  };

  const syncActiveWorkspace = async (options2 = {}) => {
    if (!state.authenticated || !state.account?.id || !state.activeWorkspaceId || state.syncing) return;
    state.syncing = true;
    state.error = "";
    try {
      state.offline = false;
      await flushQueue();
      const cursor = options2.force ? "" : String(await store.getCursor(state.account.id, state.activeWorkspaceId) || "");
      const result = cursor
        ? await invoke({ operation: "template.changes", workspaceId: state.activeWorkspaceId, cursor })
        : await invoke({ operation: "template.list", workspaceId: state.activeWorkspaceId, includeArchived: true });
      if (!result?.ok) {
        markOffline(result);
        return;
      }
      await store.applyRemoteChanges(
        state.account.id,
        state.activeWorkspaceId,
        result.items || [],
        result.tombstones || [],
        { replace: !cursor }
      );
      await store.setCursor(state.account.id, state.activeWorkspaceId, result.nextCursor || cursor || "");
      await updateTemplates();
      state.offline = false;
      state.error = "";
    } finally {
      state.syncing = false;
    }
  };

  const prepare = async (options2 = {}) => {
    const now = Date.now();
    if (state.loading) return state;
    if (state.initialized && !options2.force && now - state.lastBootstrapAt < 15000) {
      if (options2.sync) await syncActiveWorkspace();
      return state;
    }
    state.loading = true;
    state.lastBootstrapAt = now;
    try {
      const result = await invoke({ operation: "bootstrap" });
      state.initialized = true;
      state.authenticated = result?.authenticated === true;
      state.mock = result?.mock === true;
      state.account = result?.account || null;
      state.offline = result?.offline === true;
      state.error = String(result?.error || "");
      if (!state.authenticated || !state.account?.id) {
        state.workspaces = [];
        state.activeWorkspaceId = "";
        state.templates = [];
        state.editor = null;
        return state;
      }
      await store.ensureAccountIsolation(state.account.id);
      const remoteWorkspaces = (result.workspaces || []).map(normalizePromptWorkspace).filter((item) => item.id);
      const cachedWorkspaces = await store.getWorkspaceCache(state.account.id);
      state.workspaces = remoteWorkspaces.length ? remoteWorkspaces : cachedWorkspaces;
      if (remoteWorkspaces.length) {
        await store.setWorkspaceCache(state.account.id, remoteWorkspaces);
        await store.pruneUnauthorizedWorkspaces(state.account.id, remoteWorkspaces.map((item) => item.id));
      }
      if (!state.workspaces.some((item) => item.id === state.activeWorkspaceId)) {
        state.activeWorkspaceId = personalWorkspace()?.id || state.workspaces[0]?.id || "";
      }
      await updateTemplates();
      if (options2.sync && state.activeWorkspaceId && !state.offline) await syncActiveWorkspace();
      return state;
    } finally {
      state.loading = false;
    }
  };

  const enqueueCreate = async (template, workspaceId = state.activeWorkspaceId) => {
    const safe = sanitizeSharedPromptTemplateInput(template || {});
    const accountId = state.account?.id;
    if (!accountId || !workspaceId) throw new Error("云提示词空间不可用");
    const localId = uuid("local-cloud-template");
    const localTemplate = normalizeSharedPromptTemplate({
      id: localId,
      workspaceId,
      revision: 0,
      ...safe,
      status: "active",
      createdBy: { id: accountId, displayName: state.account?.displayName || "" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { workspaceId });
    await store.putTemplate(accountId, workspaceId, localTemplate, "pending-create");
    await store.enqueue({
      accountId,
      workspaceId,
      operation: "template.create",
      templateId: localId,
      template: safe,
      idempotencyKey: crypto.randomUUID(),
    });
    await updateTemplates();
    if (!state.offline) await flushQueue();
    return localTemplate;
  };

  const enqueueUpdate = async (existing, template) => {
    const safe = sanitizeSharedPromptTemplateInput(template || {});
    const next = normalizeSharedPromptTemplate({ ...existing, ...safe, updatedAt: new Date().toISOString() }, { workspaceId: existing.workspaceId });
    await store.putTemplate(state.account.id, existing.workspaceId, next, "pending-update");
    await store.removeQueueForTemplate(state.account.id, existing.workspaceId, existing.id);
    await store.enqueue({
      accountId: state.account.id,
      workspaceId: existing.workspaceId,
      operation: "template.update",
      templateId: existing.id,
      template: safe,
      revision: existing.revision,
    });
    await updateTemplates();
    if (!state.offline) await flushQueue();
    return next;
  };

  const enqueueArchive = async (template) => {
    await store.putTemplate(state.account.id, template.workspaceId, { ...template, status: "archived" }, "pending-delete");
    await store.removeQueueForTemplate(state.account.id, template.workspaceId, template.id);
    await store.enqueue({
      accountId: state.account.id,
      workspaceId: template.workspaceId,
      operation: "template.archive",
      templateId: template.id,
      revision: template.revision,
    });
    await updateTemplates();
    if (!state.offline) await flushQueue();
  };

  const enqueueFavorite = async (template) => {
    const favorite = template.favorite !== true;
    await store.putTemplate(state.account.id, template.workspaceId, { ...template, favorite }, "pending-update");
    await store.removeQueueForTemplate(state.account.id, template.workspaceId, template.id);
    await store.enqueue({
      accountId: state.account.id,
      workspaceId: template.workspaceId,
      operation: favorite ? "template.favorite" : "template.unfavorite",
      templateId: template.id,
    });
    await updateTemplates();
    if (!state.offline) await flushQueue();
  };

  const enqueueCopy = async (template, targetWorkspaceId) => {
    await store.enqueue({
      accountId: state.account.id,
      workspaceId: template.workspaceId,
      targetWorkspaceId,
      operation: "template.copy",
      templateId: template.id,
      idempotencyKey: crypto.randomUUID(),
    });
    if (!state.offline) await flushQueue();
  };

  const openEditor = (template = null) => {
    const safe = template ? sanitizeSharedPromptTemplateInput(template) : {
      title: "",
      content: "",
      description: "",
      type: "generic",
      tags: [],
      providerHint: "",
      modelHint: "",
      generationMode: "",
      parameters: {},
    };
    state.editor = {
      templateId: template?.id || "",
      revision: Number(template?.revision || 0),
      draft: { ...safe, tagsText: (safe.tags || []).join("，") },
    };
  };

  const findTemplate = (id) => state.templates.find((item) => item.id === id) || null;
  const resolveConflictServer = async (template) => {
    const serverVersion = template?.conflict?.serverVersion;
    if (serverVersion?.id) await store.putTemplate(state.account.id, template.workspaceId, serverVersion, "synced");
    else await store.removeTemplate(state.account.id, template.workspaceId, template.id);
    await store.removeQueueForTemplate(state.account.id, template.workspaceId, template.id);
    await updateTemplates();
  };
  const resolveConflictCopy = async (template) => {
    const target = personalWorkspace();
    if (!target) throw new Error("没有可用的个人云提示词空间");
    await enqueueCreate({ ...template, title: `${template.title}（冲突副本）` }, target.id);
    await resolveConflictServer(template);
  };

  const handleAction = async (action, templateId = "") => {
    const template = findTemplate(templateId);
    if (action === "cloud-refresh") {
      await prepare({ force: true });
      await syncActiveWorkspace({ force: true });
      toast(t("云提示词已刷新"));
      return true;
    }
    if (action === "cloud-new") {
      openEditor();
      requestRender();
      return true;
    }
    if (action === "cloud-save-selected") {
      captureSelectedNode();
      return true;
    }
    if (action === "cloud-cancel") {
      state.editor = null;
      requestRender();
      return true;
    }
    if (action === "cloud-save" && state.editor) {
      const draft = { ...state.editor.draft, tags: state.editor.draft.tagsText || "" };
      if (state.editor.templateId) {
        const existing = findTemplate(state.editor.templateId);
        if (!existing) throw new Error("待编辑模板不存在");
        await enqueueUpdate(existing, draft);
        toast(state.offline ? t("已离线保存，联网后同步") : t("云提示词已保存"));
      } else {
        await enqueueCreate(draft);
        toast(state.offline ? t("已离线保存，联网后同步") : t("云提示词已创建"));
      }
      state.editor = null;
      requestRender();
      return true;
    }
    if (!template) return false;
    if (action === "cloud-use") {
      createCanvasNode(cloudPromptTemplateToCanvasPayload(template));
      return true;
    }
    if (action === "cloud-edit") {
      openEditor(template);
      requestRender();
      return true;
    }
    if (action === "cloud-archive") {
      if (!confirm(t(`归档提示词“${template.title}”？离线设备同步后也会移除。`))) return true;
      await enqueueArchive(template);
      toast(state.offline ? t("已离线归档，联网后同步") : t("提示词已归档"));
      requestRender();
      return true;
    }
    if (action === "cloud-favorite") {
      await enqueueFavorite(template);
      requestRender();
      return true;
    }
    if (action === "cloud-copy") {
      const target = personalWorkspace() || activeWorkspace();
      if (!target) throw new Error("没有可用的目标空间");
      await enqueueCopy(template, target.id);
      toast(state.offline ? t("复制请求已排队") : t("已复制到个人云空间"));
      requestRender();
      return true;
    }
    if (action === "cloud-conflict-server") {
      await resolveConflictServer(template);
      toast(t("已保留服务器版本"));
      requestRender();
      return true;
    }
    if (action === "cloud-conflict-copy") {
      await resolveConflictCopy(template);
      toast(t("本地版本已另存到个人空间"));
      requestRender();
      return true;
    }
    return false;
  };

  const handleField = async (field, value) => {
    if (field === "cloudWorkspaceId") {
      state.activeWorkspaceId = String(value || "");
      state.editor = null;
      await updateTemplates();
      await syncActiveWorkspace();
      requestRender();
      return true;
    }
    if (field === "cloudQuery") state.query = String(value || "");
    else if (field === "cloudTypeFilter") state.typeFilter = String(value || "all");
    else if (field === "cloudTagFilter") state.tagFilter = String(value || "");
    else if (field.startsWith("cloudDraft.") && state.editor) {
      const key = field.slice("cloudDraft.".length);
      if (["durationSeconds"].includes(key)) {
        state.editor.draft.parameters = { ...state.editor.draft.parameters, [key]: value };
      } else if (["aspectRatio", "resolution", "imageSize", "generateAudio", "watermark"].includes(key)) {
        state.editor.draft.parameters = {
          ...state.editor.draft.parameters,
          [key]: ["generateAudio", "watermark"].includes(key) ? value === true : value,
        };
      } else state.editor.draft[key] = value;
    } else return false;
    requestRender();
    return true;
  };

  const captureTemplate = async (template) => {
    if (!state.authenticated) {
      toast(t("请先登录后再保存到云端提示词库"));
      return;
    }
    openEditor(template);
    requestRender();
    toast(t("已提取安全提示词字段，请确认后保存"));
  };

  const filteredTemplates = () => {
    const query = state.query.trim().toLowerCase();
    const tags = state.tagFilter.split(/[,，\s]+/).map((item) => item.trim().toLowerCase()).filter(Boolean);
    return state.templates.filter((item) => item.status !== "archived").filter((item) => {
      if (state.typeFilter !== "all" && item.type !== state.typeFilter) return false;
      const itemTags = (item.tags || []).map((tag) => String(tag).toLowerCase());
      if (tags.length && !tags.every((tag) => itemTags.some((itemTag) => itemTag.includes(tag)))) return false;
      if (!query) return true;
      return `${item.title} ${item.content} ${item.description || ""} ${(item.tags || []).join(" ")} ${item.modelHint || ""}`.toLowerCase().includes(query);
    });
  };
  const statusLabel = (item) => ({
    "pending-create": "待上传",
    "pending-update": "待同步",
    "pending-delete": "待归档",
    conflict: "有冲突",
    "permission-denied": "无权限",
    synced: "已同步",
  }[item.syncStatus] || item.syncStatus || "已同步");
  const workspaceRoleLabel = (workspace) => ({ owner: "所有者", admin: "管理员", editor: "可编辑", member: "成员", viewer: "只读" }[workspace?.role] || workspace?.role || "只读");
  const workspaceDisplayName = (workspace) => {
    if (!workspace) return t("云端工作空间");
    const kindLabel = workspace.kind === "personal" ? t("个人") : t("企业");
    return `${kindLabel} · ${workspace.name || t("未命名空间")}`;
  };
  const renderSidebar = () => {
    const workspace = activeWorkspace();
    const queueNote = state.offline ? "离线缓存" : state.syncing ? "同步中" : state.error ? "同步异常" : "已连接";
    const selectedWorkspaceLabel = workspaceDisplayName(workspace);
    return `
      <div class="wanjuan-cloud-workspace-block">
        <label class="wanjuan-workspace-field-label">${escape(t("云端工作空间"))}
          <select class="wanjuan-cloud-workspace-select" data-workspace-field="cloudWorkspaceId" title="${escape(selectedWorkspaceLabel)}" aria-label="${escape(selectedWorkspaceLabel)}">
            ${state.workspaces.map((item) => `<option value="${escape(item.id)}" ${item.id === state.activeWorkspaceId ? "selected" : ""}>${escape(workspaceDisplayName(item))}</option>`).join("")}
          </select>
        </label>
        <div class="wanjuan-cloud-permission-row"><span>${escape(workspaceRoleLabel(workspace))}</span><span class="${state.offline ? "is-offline" : ""}">${escape(queueNote)}</span></div>
        ${state.mock ? `<div class="wanjuan-cloud-mock-note">${escape(t("当前使用脱敏 Mock 数据"))}</div>` : ""}
        ${state.error ? `<div class="wanjuan-cloud-error">${escape(state.error)}</div>` : ""}
      </div>
      <label class="wanjuan-workspace-field-label">${escape(t("类型筛选"))}
        <select data-workspace-field="cloudTypeFilter">
          ${[["all", "全部"], ["generic", "通用"], ["text", "文本"], ["image", "图片"], ["video", "视频"], ["audio", "音频"]].map(([value, label]) => `<option value="${value}" ${state.typeFilter === value ? "selected" : ""}>${escape(t(label))}</option>`).join("")}
        </select>
      </label>
      <label class="wanjuan-workspace-field-label">${escape(t("标签筛选"))}
        <input data-workspace-field="cloudTagFilter" value="${escape(state.tagFilter)}" placeholder="${escape(t("例如：分镜，电影感"))}">
      </label>
      <div class="wanjuan-cloud-security-note">${escape(t("只同步提示词和安全生成参数，不同步 API Key、素材、结果地址、项目或节点信息。"))}</div>
    `;
  };
  const renderToolbar = () => `
    <input class="wanjuan-workspace-search" data-workspace-field="cloudQuery" value="${escape(state.query)}" placeholder="${escape(t("搜索云提示词、标签、模型"))}">
    <div class="wanjuan-workspace-toolbar-actions">
      ${can("canCreate") ? `<button class="wanjuan-workspace-button" data-workspace-action="cloud-save-selected">${escape(t("保存选中节点"))}</button><button class="wanjuan-workspace-button primary" data-workspace-action="cloud-new">${escape(t("新建提示词"))}</button>` : ""}
      <button class="wanjuan-workspace-button" data-workspace-action="cloud-refresh">${escape(state.syncing ? t("同步中") : t("刷新"))}</button>
      <button class="wanjuan-workspace-button" data-workspace-action="close">${escape(t("返回"))}</button>
    </div>
  `;
  const renderEditor = () => {
    const draft = state.editor?.draft || {};
    const parameters = draft.parameters || {};
    return `
      <div class="wanjuan-cloud-editor">
        <div class="wanjuan-cloud-editor-heading"><strong>${escape(state.editor?.templateId ? t("编辑云提示词") : t("新建云提示词"))}</strong><span>${escape(t("保存前仅会提交白名单字段"))}</span></div>
        <div class="wanjuan-cloud-editor-grid">
          <label>${escape(t("标题"))}<input data-workspace-field="cloudDraft.title" value="${escape(draft.title || "")}" maxlength="120"></label>
          <label>${escape(t("类型"))}<select data-workspace-field="cloudDraft.type">${[["generic", "通用"], ["text", "文本"], ["image", "图片"], ["video", "视频"], ["audio", "音频"]].map(([value, label]) => `<option value="${value}" ${draft.type === value ? "selected" : ""}>${escape(t(label))}</option>`).join("")}</select></label>
          <label class="is-wide">${escape(t("提示词内容"))}<textarea data-workspace-field="cloudDraft.content" maxlength="20000">${escape(draft.content || "")}</textarea></label>
          <label class="is-wide">${escape(t("说明"))}<textarea data-workspace-field="cloudDraft.description" maxlength="2000">${escape(draft.description || "")}</textarea></label>
          <label>${escape(t("标签"))}<input data-workspace-field="cloudDraft.tagsText" value="${escape(draft.tagsText || "")}" placeholder="${escape(t("用逗号分隔"))}"></label>
          <label>${escape(t("模型提示"))}<input data-workspace-field="cloudDraft.modelHint" value="${escape(draft.modelHint || "")}"></label>
          <label>${escape(t("供应商提示"))}<input data-workspace-field="cloudDraft.providerHint" value="${escape(draft.providerHint || "")}"></label>
          <label>${escape(t("生成模式"))}<input data-workspace-field="cloudDraft.generationMode" value="${escape(draft.generationMode || "")}"></label>
          <label>${escape(t("比例"))}<input data-workspace-field="cloudDraft.aspectRatio" value="${escape(parameters.aspectRatio || "")}" placeholder="16:9"></label>
          <label>${escape(t("分辨率"))}<input data-workspace-field="cloudDraft.resolution" value="${escape(parameters.resolution || "")}" placeholder="1080p"></label>
          <label>${escape(t("图片尺寸"))}<input data-workspace-field="cloudDraft.imageSize" value="${escape(parameters.imageSize || "")}" placeholder="2048x2048"></label>
          <label>${escape(t("时长（秒）"))}<input type="number" min="0" max="3600" step="0.1" data-workspace-field="cloudDraft.durationSeconds" value="${escape(parameters.durationSeconds || "")}"></label>
          <label class="wanjuan-cloud-check"><input type="checkbox" data-workspace-field="cloudDraft.generateAudio" ${parameters.generateAudio === true ? "checked" : ""}>${escape(t("生成音频"))}</label>
          <label class="wanjuan-cloud-check"><input type="checkbox" data-workspace-field="cloudDraft.watermark" ${parameters.watermark === true ? "checked" : ""}>${escape(t("添加水印"))}</label>
        </div>
        <div class="wanjuan-cloud-editor-actions"><button class="wanjuan-workspace-button" data-workspace-action="cloud-cancel">${escape(t("取消"))}</button><button class="wanjuan-workspace-button primary" data-workspace-action="cloud-save">${escape(state.offline ? t("离线保存") : t("保存并同步"))}</button></div>
      </div>
    `;
  };
  const renderTemplateCard = (item) => {
    const workspace = activeWorkspace();
    const readOnly = !workspace?.permissions?.canEdit && !(workspace?.permissions?.canEditOwn && item.createdBy?.id === state.account?.id);
    const conflict = item.syncStatus === "conflict";
    return `
      <article class="wanjuan-workspace-card wanjuan-cloud-template-card ${conflict ? "is-conflict" : ""}" data-template-id="${escape(item.id)}">
        <div class="wanjuan-cloud-template-kind">${escape(t({ generic: "通用", text: "文本", image: "图片", video: "视频", audio: "音频" }[item.type] || "通用"))}</div>
        <div class="wanjuan-workspace-card-body">
          <div class="wanjuan-cloud-card-heading"><div class="wanjuan-workspace-card-title" title="${escape(item.title)}">${escape(item.title)}</div><span class="wanjuan-cloud-sync-state is-${escape(item.syncStatus || "synced")}">${escape(statusLabel(item))}</span></div>
          <div class="wanjuan-workspace-card-meta">${escape([item.createdBy?.displayName, item.modelHint || item.providerHint, item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ""].filter(Boolean).join(" · "))}</div>
          <div class="wanjuan-workspace-card-prompt">${escape(item.content)}</div>
          ${item.description ? `<div class="wanjuan-cloud-description">${escape(item.description)}</div>` : ""}
          <div class="wanjuan-cloud-tags">${(item.tags || []).map((tag) => `<span>${escape(tag)}</span>`).join("") || `<span>${escape(t("无标签"))}</span>`}</div>
          ${conflict ? `<div class="wanjuan-cloud-conflict"><strong>${escape(t("服务器版本与本地修改冲突"))}</strong><button class="wanjuan-workspace-button" data-workspace-action="cloud-conflict-server">${escape(t("使用服务器版本"))}</button><button class="wanjuan-workspace-button primary" data-workspace-action="cloud-conflict-copy">${escape(t("另存为个人副本"))}</button></div>` : ""}
          <div class="wanjuan-workspace-card-actions">
            <button class="wanjuan-workspace-button primary" data-workspace-action="cloud-use">${escape(t("创建节点"))}</button>
            <button class="wanjuan-workspace-button" data-workspace-action="cloud-favorite" title="${escape(item.favorite ? t("取消收藏") : t("收藏"))}">${item.favorite ? "★" : "☆"} ${escape(item.favorite ? t("已收藏") : t("收藏"))}</button>
            ${!readOnly && !conflict ? `<button class="wanjuan-workspace-button" data-workspace-action="cloud-edit">${escape(t("编辑"))}</button>` : ""}
            ${workspace?.permissions?.canCopy !== false ? `<button class="wanjuan-workspace-button" data-workspace-action="cloud-copy">${escape(t("复制到个人"))}</button>` : ""}
            ${workspace?.permissions?.canDelete && !conflict ? `<button class="wanjuan-workspace-button danger" data-workspace-action="cloud-archive">${escape(t("归档"))}</button>` : ""}
          </div>
        </div>
      </article>
    `;
  };
  const renderContent = () => {
    if (state.editor) return renderEditor();
    if (state.loading && !state.templates.length) return `<div class="wanjuan-workspace-empty">${escape(t("正在加载云提示词库…"))}</div>`;
    const items = filteredTemplates();
    return `<div class="wanjuan-workspace-list wanjuan-cloud-template-list">${items.length ? items.map(renderTemplateCard).join("") : `<div class="wanjuan-workspace-empty">${escape(state.offline ? t("当前离线，缓存中没有匹配模板") : t("暂无匹配的云提示词"))}</div>`}</div>`;
  };

  const reset = () => {
    Object.assign(state, {
      initialized: false,
      authenticated: false,
      loading: false,
      syncing: false,
      offline: false,
      error: "",
      account: null,
      workspaces: [],
      activeWorkspaceId: "",
      templates: [],
      editor: null,
      lastBootstrapAt: 0,
    });
  };

  return {
    captureTemplate,
    handleAction,
    handleField,
    peek: () => state,
    prepare,
    renderContent,
    renderSidebar,
    renderToolbar,
    reset,
    syncActiveWorkspace,
  };
}

module.exports = { createCloudPromptWorkspaceController };
