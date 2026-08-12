import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { waitForTask, wanjuanRequest } from "../bin/wanjuan-client.mjs";

const originalCwd = process.cwd();
const originalAutomationFile = process.env.WANJUAN_AUTOMATION_FILE;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-client-test-"));
const devData = path.join(tempRoot, ".wanjuan-dev-user-data");
const staleFile = path.join(tempRoot, "stale-automation.json");
const liveFile = path.join(devData, "wanjuan-automation.json");
const token = "client-test-token-000000000000000000000001";

fs.mkdirSync(devData, { recursive: true });
fs.writeFileSync(staleFile, JSON.stringify({ host: "127.0.0.1", port: 9, token, pid: 99999999 }));

const server = http.createServer((req, res) => {
  if (req.headers.authorization !== `Bearer ${token}`) {
    res.writeHead(401);
    return res.end(JSON.stringify({ ok: false }));
  }
  const pathname = new URL(req.url, "http://127.0.0.1").pathname;
  if (req.method === "POST" && pathname === "/v1/tasks/node-failed") {
    const body = JSON.stringify({ ok: true, taskId: "task-failed", nodeId: "node-failed" });
    res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body), connection: "close" });
    return res.end(body);
  }
  if (req.method === "GET" && pathname === "/v1/tasks/node-image") {
    const body = JSON.stringify({ ok: true, task: { id: "task-image", nodeId: "node-image", type: "image", status: "completed", resultUrl: "https://cdn.example.com/result.png", stableResultUrl: "file:///tmp/result.png" } });
    res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body), connection: "close" });
    return res.end(body);
  }
  const responses = {
    "/v1/status": { ok: true, app: "万卷灵境", ready: true },
    "/v1/models": { ok: true, image: [], video: [], text: [] },
    "/v1/tasks": { ok: true, tasks: [] },
    "/v1/tasks/node-failed": { ok: true, task: { id: "task-failed", nodeId: "node-failed", status: "failed", errorMsg: "test" } },
    "/v1/tasks/node-missing": { ok: true, task: null },
  };
  const body = JSON.stringify(responses[pathname] || { ok: false, error: "not found" });
  res.writeHead(responses[pathname] ? 200 : 404, { "content-type": "application/json", "content-length": Buffer.byteLength(body), connection: "close" });
  res.end(body);
});

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  fs.writeFileSync(liveFile, JSON.stringify({ host: "127.0.0.1", port: server.address().port, token, pid: process.pid }));
  process.chdir(tempRoot);
  process.env.WANJUAN_AUTOMATION_FILE = staleFile;

  assert.equal((await wanjuanRequest("GET", "/v1/status")).ready, true, "应跳过死进程凭据并连接后续候选");
  assert.deepEqual(await wanjuanRequest("GET", "/v1/models"), { ok: true, image: [], video: [], text: [] });
  assert.deepEqual(await wanjuanRequest("GET", "/v1/tasks"), { ok: true, tasks: [] });
  assert.equal((await wanjuanRequest("GET", "/v1/tasks/node-image?materialize=1")).task.stableResultUrl, "file:///tmp/result.png");
  assert.equal((await waitForTask("node-failed", { timeoutMs: 1000, intervalMs: 20 })).task.status, "failed");
  assert.equal((await wanjuanRequest("POST", "/v1/tasks/node-failed")).nodeId, "node-failed");
  await assert.rejects(
    waitForTask("node-missing", { timeoutMs: 1000, intervalMs: 20, missingGraceMs: 80 }),
    /任务未创建或已不存在/,
  );
} finally {
  process.chdir(originalCwd);
  if (originalAutomationFile === undefined) delete process.env.WANJUAN_AUTOMATION_FILE;
  else process.env.WANJUAN_AUTOMATION_FILE = originalAutomationFile;
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("automation client: stale fallback, status/models/tasks and fast task failure passed");
