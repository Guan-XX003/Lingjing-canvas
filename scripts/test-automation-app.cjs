#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");
const { spawn, spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const mode = process.argv.includes("--packaged") ? "packaged" : "dev";
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `wanjuan-automation-${mode}-`));
const userDataPath = path.join(tempRoot, "user-data");
const infoFile = path.join(userDataPath, "wanjuan-automation.json");
const staleToken = "stale-test-token-000000000000000000000001";
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
fs.mkdirSync(userDataPath, { recursive: true });
fs.writeFileSync(infoFile, JSON.stringify({ host: "127.0.0.1", port: 9, token: staleToken, pid: 99999999 }));

function findPackagedApp() {
  const explicit = process.env.WANJUAN_PACKAGED_APP;
  const candidates = [
    explicit,
    path.join(projectRoot, "release", "mac-arm64", "万卷灵境.app"),
    path.join(projectRoot, "release", "mac", "万卷灵境.app"),
    path.join(projectRoot, "release", "mac-universal", "万卷灵境.app"),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

let command;
let appArgs;
let cliRoot;
if (mode === "packaged") {
  if (process.platform !== "darwin") throw new Error("当前打包版冒烟脚本仅在 macOS 运行；Windows 使用 build:win 后检查 resources/wanjuan-cli");
  const appBundle = findPackagedApp();
  if (!appBundle) throw new Error("找不到打包后的万卷灵境.app，请先运行 npm run build");
  command = path.join(appBundle, "Contents", "MacOS", "万卷灵境");
  appArgs = [];
  cliRoot = path.join(appBundle, "Contents", "Resources", "wanjuan-cli");
} else {
  command = require("electron");
  appArgs = [projectRoot];
  cliRoot = path.join(projectRoot, "bin");
}

const cliPath = path.join(cliRoot, "wanjuan.mjs");
const mcpPath = path.join(cliRoot, "wanjuan-mcp.mjs");
assert.equal(fs.existsSync(cliPath), true, `${mode} CLI 文件应存在`);
assert.equal(fs.existsSync(mcpPath), true, `${mode} MCP 文件应存在`);

const child = spawn(command, appArgs, {
  cwd: projectRoot,
  stdio: "ignore",
  env: {
    ...process.env,
    WANJUAN_TEST_USER_DATA_PATH: userDataPath,
    WANJUAN_ALLOW_PACKAGED_TEST_USER_DATA: "1",
    WANJUAN_ALLOW_RANDOM_PORT: "1",
    WANJUAN_DISABLE_UPDATE_CHECK: "1",
    WANJUAN_GPU_MODE: "off",
    WANJUAN_AUTOMATION_TEST_ENDPOINTS: "1",
  },
});

const cliEnv = { ...process.env, WANJUAN_AUTOMATION_FILE: infoFile };
function runCli(args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], { cwd: projectRoot, env: cliEnv, encoding: "utf8", timeout: 15000 });
  if (result.status !== 0) throw new Error((result.stderr || `CLI ${args.join(" ")} 失败`).trim());
  return JSON.parse(result.stdout);
}
async function requestApp(method, endpoint, payload, allowError = false) {
  const info = JSON.parse(fs.readFileSync(infoFile, "utf8"));
  const response = await fetch(`http://127.0.0.1:${info.port}${endpoint}`, {
    method,
    headers: { authorization: `Bearer ${info.token}`, ...(payload ? { "content-type": "application/json" } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const result = await response.json();
  if (!allowError) assert.equal(response.ok, true, JSON.stringify(result));
  return result;
}
async function waitForMaterialize(payload) {
  const deadline = Date.now() + 15000;
  let lastResult;
  while (Date.now() < deadline) {
    lastResult = await requestApp("POST", "/v1/automation-test/materialize", payload, true);
    if (lastResult?.ok) return lastResult;
    if (!/自动化接口尚未就绪/.test(String(lastResult?.error || ""))) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(JSON.stringify(lastResult || { error: "隔离媒体持久化测试超时" }));
}

async function waitForStatus() {
  const deadline = Date.now() + 45000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${mode} App 提前退出，exitCode=${child.exitCode}`);
    if (fs.existsSync(infoFile)) {
      try {
        const currentInfo = JSON.parse(fs.readFileSync(infoFile, "utf8"));
        // 测试会预置一份失效凭据。只有待测 App 已写入自身 PID 和新 token 后，
        // 才允许 CLI 冒烟，避免 CLI 自动跳过失效项后误连到同时运行的正式 App。
        if (currentInfo.pid === child.pid && currentInfo.token !== staleToken) return runCli(["status"]);
      } catch (error) { lastError = error; }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw lastError || new Error(`${mode} App 自动化服务启动超时`);
}

async function inspectMcp() {
  const mcp = spawn(process.execPath, [mcpPath], { cwd: projectRoot, env: cliEnv, stdio: ["pipe", "pipe", "pipe"] });
  const replies = new Map();
  readline.createInterface({ input: mcp.stdout }).on("line", (line) => {
    try { const value = JSON.parse(line); replies.set(value.id, value); } catch {}
  });
  const send = (value) => mcp.stdin.write(`${JSON.stringify(value)}\n`);
  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "automation-smoke", version: "1" } } });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const deadline = Date.now() + 5000;
  while (replies.size < 2 && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
  mcp.kill();
  assert.equal(replies.get(1)?.result?.serverInfo?.name, "wanjuan-lingjing");
    assert.equal(replies.get(2)?.result?.tools?.length, 9);
}

(async () => {
  try {
    const status = await waitForStatus();
    const refreshedInfo = JSON.parse(fs.readFileSync(infoFile, "utf8"));
    assert.notEqual(refreshedInfo.token, staleToken, "App 启动应替换旧自动化凭据");
    assert.equal(refreshedInfo.pid, child.pid, "自动化凭据应属于当前 App 进程");
    const models = runCli(["models"]);
    const tasks = runCli(["tasks"]);
    assert.equal(status.ok, true);
    assert.equal(status.ready, true);
    assert.equal(models.ok, true);
    assert.equal(Array.isArray(models.image), true);
    assert.equal(Array.isArray(models.video), true);
    assert.equal(Array.isArray(models.text), true);
    assert.equal(tasks.ok, true);
    assert.equal(Array.isArray(tasks.tasks), true);
    if (mode === "dev") {
      const mediaRoot = path.join(tempRoot, "media-root");
      const materialized = await waitForMaterialize({ kind: "image", dataUrl: tinyPng, directory: mediaRoot });
      assert.equal(materialized.ok, true);
      assert.match(materialized.resultUrl, /^file:\/\//);
      assert.equal(fs.existsSync(materialized.localPath), true, "隔离项目媒体文件应已写入");
      assert.equal(path.resolve(materialized.localPath).startsWith(path.resolve(mediaRoot)), true, "媒体结果必须写入隔离测试目录");
    }
    await inspectMcp();
    console.log(`automation ${mode} app: status/models/tasks and MCP initialize/tools/list passed`);
  } finally {
    if (child.exitCode === null) child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
