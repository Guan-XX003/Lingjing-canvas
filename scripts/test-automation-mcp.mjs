import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-mcp-test-"));
const infoFile = path.join(tempRoot, "automation.json");
const token = "mcp-test-token-0000000000000000000000001";
const requests = [];
const server = http.createServer(async (req, res) => {
  if (req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401); return res.end(JSON.stringify({ ok: false })); }
  let text = "";
  for await (const chunk of req) text += chunk;
  requests.push({ path: new URL(req.url, "http://127.0.0.1").pathname, body: text ? JSON.parse(text) : null });
  const responses = {
    "/v1/status": { ok: true, app: "StarCanvas", version: "1.4.7", ready: true },
    "/v1/models": { ok: true, image: ["test-image"], video: ["test-video"], text: [] },
    "/v1/tasks": { ok: true, tasks: [] },
  "/v1/image/generate": { ok: true, accepted: true, nodeId: "automation-image-test" },
  "/v1/tianji/generate": { ok: true, accepted: true, nodeId: "automation-tianji-test", mode: "first-last" },
  };
  const value = responses[new URL(req.url, "http://127.0.0.1").pathname] || { ok: true, task: null };
  const body = JSON.stringify(value);
  res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body), connection: "close" });
  res.end(body);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
fs.writeFileSync(infoFile, JSON.stringify({ host: "127.0.0.1", port: server.address().port, token, pid: process.pid }));

const child = spawn(process.execPath, [path.resolve("bin/wanjuan-mcp.mjs")], { env: { ...process.env, WANJUAN_AUTOMATION_FILE: infoFile }, stdio: ["pipe", "pipe", "pipe"] });
const replies = new Map();
readline.createInterface({ input: child.stdout }).on("line", (line) => { const value = JSON.parse(line); replies.set(value.id, value); });
const send = (value) => child.stdin.write(`${JSON.stringify(value)}\n`);
send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "wanjuan_status", arguments: {} } });
send({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "wanjuan_generate_image", arguments: { prompt: "test" } } });
send({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "wanjuan_generate_tianji_video", arguments: { prompt: "test", mode: "reference-media", portraitAssetIds: ["asset-reviewed-mock"] } } });

const deadline = Date.now() + 5000;
while (replies.size < 5 && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(replies.get(1)?.result?.serverInfo?.name, "wanjuan-lingjing");
assert.equal(replies.get(2)?.result?.tools?.length, 9);
assert.equal(replies.get(3)?.result?.structuredContent?.ready, true);
assert.equal(replies.get(4)?.result?.structuredContent?.nodeId, "automation-image-test");
assert.equal(replies.get(5)?.result?.structuredContent?.mode, "first-last");
const tianjiTool = replies.get(2)?.result?.tools?.find((tool) => tool.name === "wanjuan_generate_tianji_video");
assert.equal(tianjiTool?.inputSchema?.properties?.portraitAssetIds?.maxItems, 9);
assert.deepEqual(requests.find((request) => request.path === "/v1/tianji/generate")?.body?.portraitAssetIds, ["asset-reviewed-mock"]);

child.kill();
await new Promise((resolve) => server.close(resolve));
fs.rmSync(tempRoot, { recursive: true, force: true });
console.log("automation MCP: initialize, tools/list and tools/call passed");
