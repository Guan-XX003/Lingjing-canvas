// 企业网关任务账本：只保存任务身份、状态和上游任务 ID，不保存提示词、请求正文或密钥。
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { app } = require("./electron-refs.cjs");

const MAX_TASKS = 2000;

function taskStorePath() {
  return path.join(app.getPath("userData"), "enterprise-gateway", "tasks.json");
}

function readTaskStore() {
  try {
    const value = JSON.parse(fs.readFileSync(taskStorePath(), "utf8"));
    return { version: 1, tasks: Array.isArray(value?.tasks) ? value.tasks : [] };
  } catch {
    return { version: 1, tasks: [] };
  }
}

function writeTaskStore(store) {
  const target = taskStorePath();
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  const tasks = (Array.isArray(store?.tasks) ? store.tasks : [])
    .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0))
    .slice(0, MAX_TASKS);
  fs.writeFileSync(temp, JSON.stringify({ version: 1, tasks }, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, target);
}

function jsonBody(payload) {
  if (!payload?.bodyBase64) return null;
  try {
    return JSON.parse(Buffer.from(String(payload.bodyBase64), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getByPath(value, pathValue) {
  return String(pathValue || "").split(".").filter(Boolean).reduce((current, key) => current?.[key], value);
}

function firstValue(value, paths) {
  for (const candidate of paths) {
    const result = getByPath(value, candidate);
    if (result !== undefined && result !== null && String(result).trim()) return result;
  }
  return "";
}

function responseJson(result) {
  const encoded = String(result?.bodyBase64 || "");
  if (!encoded || encoded.length > 3 * 1024 * 1024) return null;
  const contentType = new Map((Array.isArray(result?.headers) ? result.headers : []).map(([key, value]) => [String(key).toLowerCase(), String(value)])).get("content-type") || "";
  if (contentType && !/json|text/i.test(contentType)) return null;
  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function protocolForModel(settings, model) {
  const bindingMaps = [
    settings.textModelProtocolBindings,
    settings.imageModelProtocolBindings,
    settings.videoModelProtocolBindings,
    settings.audioModelProtocolBindings,
  ];
  const protocolName = bindingMaps.map((item) => item?.[model]).find(Boolean);
  return protocolName ? settings.modelProtocolRegistry?.[protocolName] || null : null;
}

function capabilityForModel(settings, model, apiConfigId) {
  const candidates = [
    ["text_generation", settings.textModelApiBindings],
    ["image_generation", settings.imageModelApiBindings],
    ["video_generation", settings.videoModelApiBindings],
    ["audio_generation", settings.audioModelApiBindings],
  ];
  return candidates.find(([, bindings]) => bindings?.[model] === apiConfigId)?.[0] || "managed_generation";
}

function taskResponseFields(settings, model, value) {
  const protocol = protocolForModel(settings, model) || {};
  const mapping = protocol.responseMapping || {};
  const mappedPaths = (item) => Array.isArray(item) ? item : typeof item === "string" && item ? [item] : [];
  const taskPaths = [...mappedPaths(mapping.taskId), "id", "task_id", "taskId", "execute_id", "executeId", "data.id", "data.task_id", "data.taskId", "data.execute_id", "data.executeId"];
  const statusPaths = [...mappedPaths(mapping.status), "status", "state", "data.status", "data.state"];
  return {
    remoteTaskId: String(firstValue(value, taskPaths) || ""),
    remoteStatus: String(firstValue(value, statusPaths) || "").toLowerCase(),
  };
}

function normalizedTaskStatus(httpStatus, remoteTaskId, remoteStatus) {
  if (Number(httpStatus) < 200 || Number(httpStatus) >= 300) return "failed";
  if (/fail|error|cancel|reject|expired/.test(remoteStatus)) return remoteStatus.includes("cancel") ? "cancelled" : "failed";
  if (/success|succeed|complete|completed|finished|done/.test(remoteStatus)) return "completed";
  if (remoteTaskId || /queue|pending|running|processing|submitted|created/.test(remoteStatus)) return "running";
  return "completed";
}

function createEnterpriseTask({ session, payload, snapshot }) {
  const store = readTaskStore();
  const clientRequestId = String(payload.clientRequestId || "");
  if (clientRequestId) {
    const existing = store.tasks.find((item) =>
      item.clientRequestId === clientRequestId &&
      item.userId === String(session.userId || "") &&
      item.organizationId === String(session.organizationId || ""));
    if (existing) {
      const error = new Error("企业任务请求已提交，请勿重复执行");
      error.code = "DUPLICATE_CLIENT_REQUEST";
      error.taskId = existing.id;
      throw error;
    }
  }
  const body = jsonBody(payload) || {};
  const model = String(body.model || body.model_id || body.modelId || "");
  const settings = snapshot?.modules?.settings?.chromeStorage || {};
  const now = Date.now();
  const task = {
    id: `gateway_task_${crypto.randomUUID()}`,
    clientRequestId,
    userId: String(session.userId || ""),
    deviceId: String(session.deviceId || ""),
    organizationId: String(session.organizationId || ""),
    managedApiConfigId: String(payload.managedApiConfigId || ""),
    capability: String(payload.capability || capabilityForModel(settings, model, payload.managedApiConfigId)),
    model,
    method: String(payload.method || "POST").toUpperCase(),
    targetOrigin: new URL(String(payload.url || "")).origin,
    targetPath: new URL(String(payload.url || "")).pathname,
    status: "pending",
    remoteTaskId: "",
    remoteStatus: "",
    httpStatus: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.tasks.unshift(task);
  writeTaskStore(store);
  return task;
}

function settleEnterpriseTask(taskId, result, snapshot) {
  const store = readTaskStore();
  const task = store.tasks.find((item) => item.id === taskId);
  if (!task) return null;
  const value = responseJson(result);
  const settings = snapshot?.modules?.settings?.chromeStorage || {};
  const fields = taskResponseFields(settings, task.model, value);
  task.remoteTaskId = fields.remoteTaskId || task.remoteTaskId;
  task.remoteStatus = fields.remoteStatus;
  task.httpStatus = Number(result?.status || 0);
  task.status = normalizedTaskStatus(task.httpStatus, task.remoteTaskId, task.remoteStatus);
  task.updatedAt = Date.now();
  writeTaskStore(store);
  return task;
}

function failEnterpriseTask(taskId, error) {
  const store = readTaskStore();
  const task = store.tasks.find((item) => item.id === taskId);
  if (!task) return null;
  task.status = error?.name === "AbortError" ? "cancelled" : "failed";
  task.errorCode = String(error?.code || error?.name || "REQUEST_FAILED");
  task.updatedAt = Date.now();
  writeTaskStore(store);
  return task;
}

function reconcileEnterpriseTasks(payload, result, snapshot) {
  const value = responseJson(result);
  if (!value) return [];
  const store = readTaskStore();
  const active = store.tasks.filter((item) => item.status === "running" || item.status === "pending");
  const targetUrl = String(payload.url || "");
  const requestValue = jsonBody(payload) || {};
  const requestTaskId = String(firstValue(requestValue, ["task_id", "taskId", "execute_id", "executeId", "id", "data.task_id", "data.taskId", "data.execute_id", "data.executeId", "data.id"]) || "");
  const settings = snapshot?.modules?.settings?.chromeStorage || {};
  const updated = [];
  for (const task of active) {
    if (task.managedApiConfigId !== String(payload.managedApiConfigId || "")) continue;
    if (task.remoteTaskId && requestTaskId !== task.remoteTaskId && !targetUrl.includes(encodeURIComponent(task.remoteTaskId)) && !targetUrl.includes(task.remoteTaskId)) continue;
    const fields = taskResponseFields(settings, task.model, value);
    if (!task.remoteTaskId && !fields.remoteTaskId) continue;
    if (fields.remoteTaskId && task.remoteTaskId && fields.remoteTaskId !== task.remoteTaskId) continue;
    task.remoteTaskId = fields.remoteTaskId || task.remoteTaskId;
    task.remoteStatus = fields.remoteStatus;
    task.httpStatus = Number(result?.status || 0);
    task.status = normalizedTaskStatus(task.httpStatus, task.remoteTaskId, task.remoteStatus);
    task.updatedAt = Date.now();
    updated.push(task);
  }
  if (updated.length) writeTaskStore(store);
  return updated;
}

function getEnterpriseTask(taskId, session) {
  return readTaskStore().tasks.find((item) => item.id === taskId && item.userId === session.userId && item.organizationId === session.organizationId) || null;
}

function countActiveEnterpriseTasks() {
  return readTaskStore().tasks.filter((item) => item.status === "running" || item.status === "pending").length;
}

module.exports = {
  countActiveEnterpriseTasks,
  createEnterpriseTask,
  failEnterpriseTask,
  getEnterpriseTask,
  reconcileEnterpriseTasks,
  settleEnterpriseTask,
};
