// 本机自动化控制服务：CLI / MCP 通过 loopback 受控调用正在运行的桌面应用。
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { BrowserWindow, app } = require("./electron-refs.cjs");

const AUTOMATION_FILE_NAME = "wanjuan-automation.json";
const MAX_REQUEST_BODY_BYTES = 2 * 1024 * 1024;
const MAX_REFERENCE_FILE_BYTES = 100 * 1024 * 1024;
let server = null;
let automationInfo = null;
let registeredWindow = null;
function infoPath() { return path.join(app.getPath("userData"), AUTOMATION_FILE_NAME); }
function writeInfo() {
  fs.mkdirSync(path.dirname(infoPath()), { recursive: true });
  fs.writeFileSync(infoPath(), `${JSON.stringify(automationInfo, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(infoPath(), 0o600); } catch {}
}
function removeInfo() { try { fs.rmSync(infoPath(), { force: true }); } catch {} }
function setAutomationWindow(win) { registeredWindow = win; }
function getWindow() { return registeredWindow && !registeredWindow.isDestroyed?.() ? registeredWindow : BrowserWindow.getAllWindows?.().find((win) => !win.isDestroyed?.()) || null; }
async function evaluate(method, payload) {
  const win = getWindow();
  if (!win?.webContents) throw new Error("万卷灵境窗口尚未就绪");
  const m = JSON.stringify(String(method));
  const p = JSON.stringify(payload ?? {});
  return Promise.race([
    win.webContents.executeJavaScript(`(async()=>{const api=globalThis.__wanjuanAutomation;if(!api||typeof api[${m}]!=="function")throw new Error("自动化接口尚未就绪，请等待画布加载完成");return await api[${m}](${p})})()`, true),
    new Promise((_, reject) => setTimeout(() => reject(new Error("自动化接口响应超时，请等待画布加载完成后重试")), 10000)),
  ]);
}
function send(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload ?? { ok: false }), "utf8");
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": body.length, "cache-control": "no-store", connection: "close", "x-content-type-options": "nosniff" });
  res.end(body);
}
function requestError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
function safeText(value, name, maxLength, required = false) {
  const text = String(value ?? "").trim();
  if (required && !text) throw requestError(`${name}不能为空`);
  if (text.length > maxLength) throw requestError(`${name}过长`);
  if (text.includes("\0")) throw requestError(`${name}包含无效字符`);
  return text;
}
function validateReferenceImage(value) {
  const referenceImage = safeText(value, "参考图片", 4096);
  if (!referenceImage) return "";
  try {
    const url = new URL(referenceImage);
    if (!/^https?:$/.test(url.protocol)) throw requestError("参考图片 URL 仅支持 http/https");
    return referenceImage;
  } catch (error) {
    if (error?.statusCode) throw error;
  }
  if (!path.isAbsolute(referenceImage) && !path.win32.isAbsolute(referenceImage)) throw requestError("本地参考图片必须使用绝对路径");
  let stat;
  try { stat = fs.statSync(referenceImage); } catch { throw requestError("本地参考图片不存在或不可访问"); }
  if (!stat.isFile()) throw requestError("本地参考图片必须是文件");
  if (stat.size > MAX_REFERENCE_FILE_BYTES) throw requestError("本地参考图片超过 100MB 限制");
  return referenceImage;
}
function validatePortraitAssetId(value) {
  const id = safeText(value, "天玑已审核人像素材 ID", 512, true);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,511}$/.test(id)) throw requestError("天玑已审核人像素材 ID 格式无效");
  return id;
}
function validateGenerationPayload(kind, value) {
  const payload = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const result = {
    prompt: safeText(payload.prompt, "提示词", 50000, true),
    model: safeText(payload.model, "模型名称", 512),
    referenceImage: validateReferenceImage(payload.referenceImage),
  };
  if (kind === "image") result.size = safeText(payload.size || "1024x1024", "图片尺寸", 64);
  if (kind === "video") {
    result.resolution = safeText(payload.resolution || "1280x720", "视频分辨率", 64);
    result.aspectRatio = safeText(payload.aspectRatio, "视频比例", 32);
    if (payload.duration !== "" && payload.duration !== undefined && payload.duration !== null) {
      const duration = Number(payload.duration);
      if (!Number.isFinite(duration) || duration <= 0 || duration > 600) throw requestError("视频时长必须在 0 到 600 秒之间");
      result.duration = duration;
    }
  }
  return result;
}
function validateTianjiPayload(value) {
  const payload = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const mode = safeText(payload.mode || "text-to-video", "天玑生成模式", 64);
  if (!["text-to-video", "first-frame", "first-last", "reference-media"].includes(mode)) throw requestError("不支持的天玑生成模式");
  const list = (name, max) => {
    const values = Array.isArray(payload[name]) ? payload[name] : [];
    if (values.length > max) throw requestError(`${name}最多 ${max} 个`);
    return values.map((item) => validateReferenceImage(item));
  };
  const result = validateGenerationPayload("video", payload);
  const images = list("images", 9);
  const portraitAssetIds = Array.isArray(payload.portraitAssetIds) ? payload.portraitAssetIds.map(validatePortraitAssetId) : [];
  if (portraitAssetIds.length && mode !== "reference-media") throw requestError("已审核天玑人像仅支持 reference-media 模式");
  if (images.length + portraitAssetIds.length > 9) throw requestError("images 与 portraitAssetIds 合计最多 9 个");
  return { ...result, mode, images, portraitAssetIds, videos: list("videos", 3), audios: list("audios", 3), callbackUrl: safeText(payload.callbackUrl, "回调 URL", 4096) };
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let settled = false;
    req.on("data", (chunk) => {
      if (settled) return;
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_BODY_BYTES) {
        settled = true;
        reject(requestError("请求体过大", 413));
      }
    });
    req.on("end", () => { if (settled) return; if (!body.trim()) return resolve({}); try { resolve(JSON.parse(body)); } catch { reject(requestError("请求体不是有效 JSON")); } });
    req.on("error", reject);
  });
}
function createServer() {
  return http.createServer(async (req, res) => {
    if (!automationInfo?.token || req.headers.authorization !== `Bearer ${automationInfo.token}`) return send(res, 401, { ok: false, error: "未授权的自动化请求" });
      const parsedUrl = (() => { try { return new URL(req.url || "/", "http://127.0.0.1"); } catch { return new URL("http://127.0.0.1/"); } })();
      const pathname = parsedUrl.pathname;
    try {
      if (req.method === "GET" && pathname === "/v1/status") return send(res, 200, await evaluate("status", {}));
      if (req.method === "GET" && pathname === "/v1/models") return send(res, 200, await evaluate("models", {}));
      if (req.method === "GET" && pathname === "/v1/tasks") return send(res, 200, await evaluate("tasks", { materialize: parsedUrl.searchParams.get("materialize") === "1" }));
      const task = pathname.match(/^\/v1\/tasks\/([^/]+)$/);
      if (task && req.method === "GET") return send(res, 200, await evaluate("task", { id: decodeURIComponent(task[1]), materialize: parsedUrl.searchParams.get("materialize") !== "0" }));
      if (task && req.method === "POST") return send(res, 200, await evaluate("cancel", { id: decodeURIComponent(task[1]) }));
      if (req.method === "POST" && pathname === "/v1/image/generate") return send(res, 200, await evaluate("generateImage", validateGenerationPayload("image", await readJson(req))));
      if (req.method === "POST" && pathname === "/v1/video/generate") return send(res, 200, await evaluate("generateVideo", validateGenerationPayload("video", await readJson(req))));
      if (req.method === "POST" && pathname === "/v1/tianji/generate") return send(res, 200, await evaluate("generateTianjiVideo", validateTianjiPayload(await readJson(req))));
      if (process.env.WANJUAN_AUTOMATION_TEST_ENDPOINTS === "1" && req.method === "POST" && pathname === "/v1/automation-test/materialize") return send(res, 200, await evaluate("materializeTestResult", await readJson(req)));
      return send(res, 404, { ok: false, error: "未找到自动化接口" });
    } catch (error) { return send(res, Number(error?.statusCode || 500), { ok: false, error: String(error?.message || error) }); }
  });
}
async function startAutomationServer() {
  if (server) return automationInfo;
  // 上次异常退出可能留下旧端口和旧 token；新实例启动前先同步清理。
  removeInfo();
  automationInfo = { protocol: "wanjuan-automation", protocolVersion: 1, host: "127.0.0.1", port: 0, token: crypto.randomBytes(32).toString("hex"), pid: process.pid, appVersion: app.getVersion?.() || "", startedAt: Date.now() };
  server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", () => { automationInfo.port = server.address().port; writeInfo(); resolve(); }); });
  return automationInfo;
}
async function stopAutomationServer() {
  removeInfo();
  registeredWindow = null;
  if (!server) { automationInfo = null; return; }
  await new Promise((resolve) => server.close(() => resolve()));
  server = null; automationInfo = null;
}
module.exports = { startAutomationServer, stopAutomationServer, setAutomationWindow, validateTianjiPayload };
