const CLOUD_PROMPT_DB_NAME = "wanjuan-cloud-prompts";
const CLOUD_PROMPT_DB_VERSION = 1;
const CLOUD_PROMPT_TEMPLATE_STORE = "cloudPromptTemplates";
const CLOUD_PROMPT_QUEUE_STORE = "cloudPromptSyncQueue";
const CLOUD_PROMPT_CURSOR_STORE = "cloudPromptSyncCursor";
const CLOUD_PROMPT_STORES = [
  CLOUD_PROMPT_TEMPLATE_STORE,
  CLOUD_PROMPT_QUEUE_STORE,
  CLOUD_PROMPT_CURSOR_STORE,
];

function createIndexedDbAdapter(indexedDb = globalThis.indexedDB) {
  let databasePromise = null;
  const database = () => {
    if (!indexedDb) return Promise.reject(new Error("IndexedDB 不可用"));
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDb.open(CLOUD_PROMPT_DB_NAME, CLOUD_PROMPT_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const storeName of CLOUD_PROMPT_STORES) {
          if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("云提示词缓存打开失败"));
    });
    return databasePromise;
  };
  const transact = async (storeName, mode, runner) => {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let request;
      try {
        request = runner(store);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(request?.result);
      transaction.onerror = () => reject(transaction.error || request?.error || new Error("云提示词缓存操作失败"));
      transaction.onabort = () => reject(transaction.error || new Error("云提示词缓存操作已中止"));
    });
  };
  return {
    get: (storeName, key) => transact(storeName, "readonly", (store) => store.get(key)),
    put: (storeName, key, value) => transact(storeName, "readwrite", (store) => store.put(value, key)),
    delete: (storeName, key) => transact(storeName, "readwrite", (store) => store.delete(key)),
    clear: (storeName) => transact(storeName, "readwrite", (store) => store.clear()),
    values: (storeName) => transact(storeName, "readonly", (store) => store.getAll()),
  };
}

function createMemoryCloudPromptAdapter() {
  const stores = new Map(CLOUD_PROMPT_STORES.map((name) => [name, new Map()]));
  const store = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  return {
    async get(name, key) { return store(name).get(key); },
    async put(name, key, value) { store(name).set(key, structuredClone(value)); },
    async delete(name, key) { store(name).delete(key); },
    async clear(name) { store(name).clear(); },
    async values(name) { return [...store(name).values()].map((value) => structuredClone(value)); },
  };
}

function namespace(accountId, workspaceId, itemId = "") {
  return [accountId, workspaceId, itemId].map((value) => String(value || "")).join("::");
}

function createCloudPromptStore(options = {}) {
  const adapter = options.adapter || createIndexedDbAdapter(options.indexedDB);
  const clearAll = async () => {
    await Promise.all(CLOUD_PROMPT_STORES.map((storeName) => adapter.clear(storeName)));
  };
  const ensureAccountIsolation = async (accountId) => {
    const nextAccountId = String(accountId || "");
    const activeAccountId = String(await adapter.get(CLOUD_PROMPT_CURSOR_STORE, "__activeAccountId") || "");
    if (activeAccountId && activeAccountId !== nextAccountId) await clearAll();
    if (nextAccountId) await adapter.put(CLOUD_PROMPT_CURSOR_STORE, "__activeAccountId", nextAccountId);
    return activeAccountId !== nextAccountId;
  };
  const listTemplates = async (accountId, workspaceId, options2 = {}) => {
    const values = await adapter.values(CLOUD_PROMPT_TEMPLATE_STORE);
    return values
      .filter((item) => item?.accountId === accountId && item?.workspaceId === workspaceId)
      .filter((item) => options2.includeArchived === true || item.status !== "archived")
      .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
  };
  const putTemplate = async (accountId, workspaceId, template, syncStatus = "synced") => {
    const item = {
      ...template,
      accountId: String(accountId || ""),
      workspaceId: String(workspaceId || template?.workspaceId || ""),
      syncStatus: String(syncStatus || template?.syncStatus || "synced"),
      cachedAt: Date.now(),
    };
    if (!item.id) throw new Error("云提示词模板缺少 id");
    await adapter.put(CLOUD_PROMPT_TEMPLATE_STORE, namespace(item.accountId, item.workspaceId, item.id), item);
    return item;
  };
  const removeTemplate = (accountId, workspaceId, templateId) =>
    adapter.delete(CLOUD_PROMPT_TEMPLATE_STORE, namespace(accountId, workspaceId, templateId));
  const applyRemoteChanges = async (accountId, workspaceId, items = [], tombstones = [], options2 = {}) => {
    const existing = await listTemplates(accountId, workspaceId, { includeArchived: true });
    const existingMap = new Map(existing.map((item) => [String(item.id), item]));
    const remoteIds = new Set();
    for (const template of items) {
      const id = String(template?.id || "");
      if (!id) continue;
      remoteIds.add(id);
      const local = existingMap.get(id);
      if (local && ["pending-create", "pending-update", "pending-delete", "conflict"].includes(local.syncStatus)) continue;
      await putTemplate(accountId, workspaceId, template, "synced");
    }
    for (const tombstone of tombstones) {
      const id = String(tombstone?.id || tombstone?.templateId || "");
      if (!id) continue;
      const local = existingMap.get(id);
      if (local && ["pending-create", "pending-update"].includes(local.syncStatus)) {
        await putTemplate(accountId, workspaceId, {
          ...local,
          conflict: { reason: "remote-deleted", serverVersion: null, revision: Number(tombstone?.revision || 0) },
        }, "conflict");
      } else {
        await removeTemplate(accountId, workspaceId, id);
      }
    }
    if (options2.replace === true) {
      for (const local of existing) {
        if (!remoteIds.has(String(local.id)) && local.syncStatus === "synced") {
          await removeTemplate(accountId, workspaceId, local.id);
        }
      }
    }
    return listTemplates(accountId, workspaceId, { includeArchived: true });
  };
  const listQueue = async (accountId, workspaceId = "") => {
    const values = await adapter.values(CLOUD_PROMPT_QUEUE_STORE);
    return values
      .filter((item) => item?.accountId === accountId && (!workspaceId || item?.workspaceId === workspaceId))
      .sort((left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0));
  };
  const enqueue = async (entry) => {
    const item = {
      ...entry,
      id: String(entry?.id || `cloud-queue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
      accountId: String(entry?.accountId || ""),
      workspaceId: String(entry?.workspaceId || ""),
      createdAt: Number(entry?.createdAt || Date.now()),
      attempts: Number(entry?.attempts || 0),
    };
    await adapter.put(CLOUD_PROMPT_QUEUE_STORE, item.id, item);
    return item;
  };
  const removeQueueEntry = (entryId) => adapter.delete(CLOUD_PROMPT_QUEUE_STORE, String(entryId || ""));
  const removeQueueForTemplate = async (accountId, workspaceId, templateId) => {
    const queue = await listQueue(accountId, workspaceId);
    await Promise.all(queue
      .filter((item) => String(item.templateId || item.payload?.templateId || "") === String(templateId || ""))
      .map((item) => removeQueueEntry(item.id)));
  };
  const getCursor = (accountId, workspaceId) => adapter.get(CLOUD_PROMPT_CURSOR_STORE, namespace(accountId, workspaceId));
  const setCursor = (accountId, workspaceId, cursor) =>
    adapter.put(CLOUD_PROMPT_CURSOR_STORE, namespace(accountId, workspaceId), String(cursor || ""));
  const getWorkspaceCache = async (accountId) =>
    (await adapter.get(CLOUD_PROMPT_CURSOR_STORE, namespace(accountId, "__workspaces"))) || [];
  const setWorkspaceCache = (accountId, workspaces) =>
    adapter.put(CLOUD_PROMPT_CURSOR_STORE, namespace(accountId, "__workspaces"), Array.isArray(workspaces) ? workspaces : []);
  const clearWorkspace = async (accountId, workspaceId) => {
    const templates = await listTemplates(accountId, workspaceId, { includeArchived: true });
    const queue = await listQueue(accountId, workspaceId);
    await Promise.all([
      ...templates.map((item) => removeTemplate(accountId, workspaceId, item.id)),
      ...queue.map((item) => removeQueueEntry(item.id)),
      adapter.delete(CLOUD_PROMPT_CURSOR_STORE, namespace(accountId, workspaceId)),
    ]);
  };
  const pruneUnauthorizedWorkspaces = async (accountId, allowedWorkspaceIds = []) => {
    const allowed = new Set(allowedWorkspaceIds.map(String));
    const templates = await adapter.values(CLOUD_PROMPT_TEMPLATE_STORE);
    const queue = await adapter.values(CLOUD_PROMPT_QUEUE_STORE);
    const denied = new Set([
      ...templates.filter((item) => item?.accountId === accountId && !allowed.has(String(item.workspaceId))).map((item) => String(item.workspaceId)),
      ...queue.filter((item) => item?.accountId === accountId && !allowed.has(String(item.workspaceId))).map((item) => String(item.workspaceId)),
    ]);
    await Promise.all([...denied].map((workspaceId) => clearWorkspace(accountId, workspaceId)));
    return [...denied];
  };
  return {
    applyRemoteChanges,
    clearAll,
    clearWorkspace,
    enqueue,
    ensureAccountIsolation,
    getCursor,
    getWorkspaceCache,
    listQueue,
    listTemplates,
    pruneUnauthorizedWorkspaces,
    putTemplate,
    removeQueueEntry,
    removeQueueForTemplate,
    removeTemplate,
    setCursor,
    setWorkspaceCache,
  };
}

const defaultCloudPromptStore = createCloudPromptStore();

module.exports = {
  CLOUD_PROMPT_CURSOR_STORE,
  CLOUD_PROMPT_DB_NAME,
  CLOUD_PROMPT_QUEUE_STORE,
  CLOUD_PROMPT_TEMPLATE_STORE,
  createCloudPromptStore,
  createIndexedDbAdapter,
  createMemoryCloudPromptAdapter,
  defaultCloudPromptStore,
};
