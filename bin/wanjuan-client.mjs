import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUTOMATION_FILE_NAME = "wanjuan-automation.json";
const DEFAULT_REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_MISSING_TASK_GRACE_MS = 12000;

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => path.resolve(String(value))))];
}

export function automationCandidates() {
  return unique([
    process.env.WANJUAN_AUTOMATION_FILE,
    path.join(process.cwd(), ".wanjuan-dev-user-data", AUTOMATION_FILE_NAME),
    path.join(packageRoot, ".wanjuan-dev-user-data", AUTOMATION_FILE_NAME),
    process.platform === "darwin" ? path.join(os.homedir(), "Library", "Application Support", "wanjuan-ai-canvas-desktop-test", AUTOMATION_FILE_NAME) : "",
    process.platform === "win32" && process.env.APPDATA ? path.join(process.env.APPDATA, "wanjuan-ai-canvas-desktop-test", AUTOMATION_FILE_NAME) : "",
    process.platform === "linux" ? path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "wanjuan-ai-canvas-desktop-test", AUTOMATION_FILE_NAME) : "",
  ]);
}

function normalizeAutomationInfo(value, file) {
  const host = String(value?.host || "");
  const port = Number(value?.port);
  const token = String(value?.token || "");
  const pid = Number(value?.pid || 0);
  if (host !== "127.0.0.1") return null;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (!/^[A-Za-z0-9_-]{32,512}$/.test(token)) return null;
  if (pid && (!Number.isInteger(pid) || pid < 1)) return null;
  return { ...value, host, port, token, pid, file };
}

function processIsAlive(pid) {
  if (!pid) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function readAutomationInfos() {
  const infos = [];
  for (const file of automationCandidates()) {
    try {
      const info = normalizeAutomationInfo(JSON.parse(fs.readFileSync(file, "utf8")), file);
      if (info) infos.push(info);
    } catch {}
  }
  return infos;
}

// 保留同步读取函数供外部诊断使用；真正请求会继续校验 PID、端口和鉴权。
export function readAutomationInfo() {
  const info = readAutomationInfos()[0];
  if (info) return info;
  throw new Error("找不到运行中的万卷灵境，请先启动应用");
}

async function requestWithInfo(info, method, endpoint, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`http://${info.host}:${info.port}${endpoint}`, {
      method,
      headers: {
        authorization: `Bearer ${info.token}`,
        connection: "close",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    return { response, result };
  } finally {
    clearTimeout(timer);
  }
}

export async function wanjuanRequest(method, endpoint, body, options = {}) {
  const infos = readAutomationInfos();
  if (!infos.length) throw new Error("找不到运行中的万卷灵境，请先启动应用");
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || DEFAULT_REQUEST_TIMEOUT_MS));
  let lastConnectionError = null;
  for (const info of infos) {
    if (!processIsAlive(info.pid)) continue;
    try {
      const { response, result } = await requestWithInfo(info, method, endpoint, body, timeoutMs);
      // 失效 token 或被其他进程占用的旧端口应继续尝试下一个候选。
      if (response.status === 401) continue;
      if (!response.ok || result.ok === false) throw new Error(result.error || `请求失败（${response.status}）`);
      return result;
    } catch (error) {
      if (error?.name === "AbortError" || error instanceof TypeError) {
        lastConnectionError = error;
        continue;
      }
      throw error;
    }
  }
  throw new Error(lastConnectionError ? "万卷灵境自动化端点不可用，已自动跳过失效凭据；请重启应用后重试" : "没有可用的万卷灵境自动化端点；请启动或重启应用");
}

export async function waitForTask(id, options = {}) {
  const taskId = String(id || "").trim();
  if (!taskId) throw new Error("必须提供 taskId 或 nodeId");
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || 600000));
  const intervalMs = Math.max(250, Number(options.intervalMs || 1000));
  const missingGraceMs = Math.max(0, Number(options.missingGraceMs ?? DEFAULT_MISSING_TASK_GRACE_MS));
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await wanjuanRequest("GET", `/v1/tasks/${encodeURIComponent(taskId)}?materialize=1`);
    if (result.task) {
      if (!["pending", "submitting", "running"].includes(result.task.status)) return result;
    } else if (Date.now() - startedAt >= missingGraceMs) {
      throw new Error("任务未创建或已不存在；请检查模型配置、输入参数或任务列表");
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`等待任务超时（${Math.round(timeoutMs / 1000)} 秒）`);
}
