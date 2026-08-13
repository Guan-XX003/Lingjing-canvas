import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateTianjiPayload } = require("../electron/main/automation-server.cjs");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-cli-test-"));
const infoFile = path.join(tempRoot, "automation.json");
const token = "cli-test-token-0000000000000000000000001";
const requests = [];
const cliPath = path.resolve(process.env.WANJUAN_CLI_PATH || "bin/wanjuan.mjs");
const runCli = (args, env) => new Promise((resolve) => {
  const child = spawn(process.execPath, [cliPath, ...args], { env, cwd: tempRoot, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("close", (status) => resolve({ status, stdout, stderr }));
});
const server = http.createServer(async (req, res) => {
  let text = "";
  for await (const chunk of req) text += chunk;
  requests.push({ method: req.method, url: req.url, body: text ? JSON.parse(text) : null });
  const payload = req.url?.startsWith("/v1/tianji/generate")
    ? { ok: true, accepted: true, nodeId: "automation-tianji-cli", mode: "first-last" }
    : { ok: true, task: { id: "task-cli", status: "completed", resultUrl: "file:///tmp/stable.mp4", stableResultUrl: "file:///tmp/stable.mp4" } };
  const body = JSON.stringify(payload);
  res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
  res.end(body);
});

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  fs.writeFileSync(infoFile, JSON.stringify({ host: "127.0.0.1", port: server.address().port, token, pid: process.pid }));
  const env = { ...process.env, WANJUAN_AUTOMATION_FILE: infoFile };
  const tianji = await runCli(["tianji", "generate", "--prompt", "mock only", "--mode", "reference-media", "--portrait-asset-id", "asset-reviewed-mock", "--image", "/tmp/ordinary.png", "--video", "/tmp/ref.mp4", "--audio", "/tmp/ref.wav", "--duration", "5", "--ratio", "16:9"], env);
  assert.equal(tianji.status, 0, tianji.stderr);
  assert.equal(JSON.parse(tianji.stdout).nodeId, "automation-tianji-cli");
  const task = await runCli(["task", "get", "task-cli"], env);
  assert.equal(task.status, 0, task.stderr);
  assert.equal(JSON.parse(task.stdout).task.stableResultUrl, "file:///tmp/stable.mp4");
  assert.deepEqual(requests[0], {
    method: "POST", url: "/v1/tianji/generate",
    body: { prompt: "mock only", model: "", resolution: "720p", duration: "5", aspectRatio: "16:9", mode: "reference-media", images: ["/tmp/ordinary.png"], portraitAssetIds: ["asset-reviewed-mock"], videos: ["/tmp/ref.mp4"], audios: ["/tmp/ref.wav"] },
  });
  assert.equal(requests[1].url, "/v1/tasks/task-cli?materialize=1");
  const forgedImage = await runCli(["tianji", "generate", "--prompt", "mock", "--mode", "reference-media", "--image", "asset://forged"], env);
  assert.equal(forgedImage.status, 1);
  assert.match(forgedImage.stderr, /普通图片参数不能使用 asset:\/\//);
  const invalidPortrait = await runCli(["tianji", "generate", "--prompt", "mock", "--mode", "reference-media", "--portrait-asset-id", "https://invalid.example/id"], env);
  assert.equal(invalidPortrait.status, 1);
  assert.match(invalidPortrait.stderr, /素材 ID 格式无效/);
  const missingPortrait = await runCli(["tianji", "generate", "--prompt", "mock", "--mode", "reference-media", "--portrait-asset-id"], env);
  assert.equal(missingPortrait.status, 1);
  assert.match(missingPortrait.stderr, /必须提供值/);
  const wrongMode = await runCli(["tianji", "generate", "--prompt", "mock", "--mode", "first-frame", "--portrait-asset-id", "asset-reviewed-mock"], env);
  assert.equal(wrongMode.status, 1);
  assert.match(wrongMode.stderr, /仅支持 reference-media/);
  assert.deepEqual(validateTianjiPayload({ prompt: "mock", mode: "reference-media", portraitAssetIds: ["asset-reviewed-mock"] }).portraitAssetIds, ["asset-reviewed-mock"]);
  assert.throws(() => validateTianjiPayload({ prompt: "mock", mode: "text-to-video", portraitAssetIds: ["asset-reviewed-mock"] }), /仅支持 reference-media/);
  assert.throws(() => validateTianjiPayload({ prompt: "mock", mode: "reference-media", images: Array(9).fill("https://media.example.invalid/a.png"), portraitAssetIds: ["asset-reviewed-mock"] }), /合计最多 9 个/);
} finally {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("automation CLI: reviewed portrait payload, validation and materialized task get passed");
