#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { sanitizeLogPayload } = require("../electron/main/logging.cjs");

const projectRoot = path.resolve(__dirname, "..");
const electronPath = require("electron");
const debugPort = Number(process.env.WANJUAN_WORKSPACE_DEBUG_PORT || 9461);
const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-workspace-team-"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getJson = (url) => new Promise((resolve, reject) => {
  http.get(url, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  }).on("error", reject);
});
const findFreePort = () => new Promise((resolve, reject) => {
  const server = http.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    server.close((error) => error ? reject(error) : resolve(port));
  });
});

async function waitForTarget() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const targets = await getJson(`http://127.0.0.1:${debugPort}/json/list`);
      const target = targets.find((item) => item.type === "page" && /index\.html/.test(item.url || ""));
      if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("Timed out waiting for workspace test window");
}

async function run() {
  const secretToken = "workspace-team-secret-token";
  const sanitizedLog = sanitizeLogPayload({
    preferredUrl: `http://127.0.0.1:39218?token=${secretToken}`,
    urls: [`http://192.168.1.8:39218/workspace/templates?token=${secretToken}`],
  });
  if (JSON.stringify(sanitizedLog).includes(secretToken)) {
    throw new Error("workspace share token leaked through diagnostic log sanitization");
  }
  const conflictServer = http.createServer();
  await new Promise((resolve, reject) => {
    conflictServer.once("error", reject);
    conflictServer.listen(0, "0.0.0.0", resolve);
  });
  const conflictAddress = conflictServer.address();
  const conflictPort = typeof conflictAddress === "object" && conflictAddress ? conflictAddress.port : 0;
  const teamPort = await findFreePort();
  const child = spawn(electronPath, [projectRoot, `--remote-debugging-port=${debugPort}`], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      WANJUAN_TEST_USER_DATA_PATH: userDataPath,
      WANJUAN_ALLOW_RANDOM_PORT: "1",
      WANJUAN_DISABLE_UPDATE_CHECK: "1",
    },
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  let ws;
  try {
    ws = new WebSocket(await waitForTarget());
    let id = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      pending.get(message.id)(message);
      pending.delete(message.id);
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const send = (method, params = {}) => new Promise((resolve) => {
      const requestId = ++id;
      pending.set(requestId, resolve);
      ws.send(JSON.stringify({ id: requestId, method, params }));
    });
    const evaluate = async (expression, awaitPromise = false) => {
      const response = await send("Runtime.evaluate", {
        expression,
        awaitPromise,
        returnByValue: true,
      });
      if (response.result?.exceptionDetails) {
        throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
      }
      return response.result?.result?.value;
    };
    const waitFor = async (expression, message, timeoutMs = 10000) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (await evaluate(expression)) return;
        await sleep(150);
      }
      throw new Error(message);
    };

    try {
      await waitFor(`!!document.querySelector('.wanjuan-app-top-nav')`, "main navigation was not ready", 20000);
    } catch (error) {
      const snapshot = await evaluate(`({
        url: location.href,
        title: document.title,
        readyState: document.readyState,
        rootChildren: document.querySelector('#root')?.childElementCount || 0,
        bodyText: document.body?.innerText?.slice(0, 500) || '',
      })`);
      throw new Error(`${error.message}: ${JSON.stringify(snapshot)}`);
    }
    await evaluate(`document.querySelector('.wanjuan-workspace-nav-tab').click()`);
    await waitFor(
      `!!document.querySelector('[data-workspace-space="team"]')`,
      "workspace team tab was not mounted"
    );
    await evaluate(`document.querySelector('[data-workspace-space="team"]').click()`);
    try {
      await waitFor(
        `!!document.querySelector('[data-workspace-action="start-team"]')`,
        "workspace team start button was not mounted"
      );
    } catch (error) {
      const snapshot = await evaluate(`({
        htmlClass: document.documentElement.className,
        workspacePages: document.querySelectorAll('.wanjuan-workspace-page').length,
        workspacePageText: document.querySelector('.wanjuan-workspace-page')?.textContent?.slice(0, 500) || '',
      })`);
      throw new Error(`${error.message}: ${JSON.stringify(snapshot)}`);
    }
    await evaluate(`(() => {
      const input = document.querySelector('[data-workspace-field="teamPort"]');
      input.value = ${JSON.stringify(conflictPort)};
      document.querySelector('[data-workspace-action="save-team-settings"]').click();
    })()`);
    await sleep(250);
    await waitFor(
      `!!document.querySelector('[data-workspace-action="start-team"]')`,
      "team start button disappeared after saving the occupied port"
    );
    await evaluate(`document.querySelector('[data-workspace-action="start-team"]').click()`);
    await waitFor(
      `[...document.querySelectorAll('.wanjuan-workspace-toast')].some((item) => item.textContent.includes('团队空间开启失败：') && !item.textContent.includes('{message}'))`,
      "team start failure did not show the concrete error"
    );
    await evaluate(`(() => {
      const input = document.querySelector('[data-workspace-field="teamPort"]');
      input.value = ${JSON.stringify(teamPort)};
      document.querySelector('[data-workspace-action="save-team-settings"]').click();
    })()`);
    await sleep(250);
    await evaluate(`document.querySelector('[data-workspace-action="start-team"]').click()`);
    await waitFor(
      `!!document.querySelector('[data-workspace-action="stop-team"]')`,
      "team space did not enter the running state"
    );
    const status = await evaluate(`window.wanjuanDesktop.workspaceTeamStatus()`, true);
    if (!status?.ok || !status?.status?.running) {
      throw new Error(`team space status is not running: ${JSON.stringify(status)}`);
    }
    const authenticatedProbe = await evaluate(`window.wanjuanDesktop.workspaceTeamStatus().then((current) =>
      fetch('http://127.0.0.1:' + current.status.port + '/workspace/manifest?token=' + encodeURIComponent(current.status.token))
        .then(async (response) => ({ status: response.status, body: await response.json() }))
    )`, true);
    if (authenticatedProbe?.status !== 200 || !authenticatedProbe?.body?.ok) {
      throw new Error(`team manifest endpoint was not reachable: ${JSON.stringify(authenticatedProbe)}`);
    }
    const literalPlaceholder = await evaluate(`document.body.textContent.includes('团队空间开启失败：{message}')`);
    if (literalPlaceholder) throw new Error("workspace error message left an unsubstituted placeholder");
    await evaluate(`document.querySelector('[data-workspace-action="stop-team"]').click()`);
    await waitFor(
      `!!document.querySelector('[data-workspace-action="start-team"]')`,
      "team space did not stop cleanly"
    );
    await evaluate(`document.querySelector('[data-workspace-space="personal"]').click()`);
    await waitFor(
      `!!document.querySelector('[data-workspace-action="new-group"]')`,
      "personal workspace controls were not restored"
    );
    await evaluate(`document.querySelector('[data-workspace-action="new-group"]').click()`);
    await waitFor(
      `!!document.querySelector('.wanjuan-native-input-overlay')`,
      "workspace input dialog did not open in the preload world"
    );
    await evaluate(`document.querySelector('.wanjuan-native-input-overlay [data-action="cancel"]').click()`);
    await waitFor(
      `!document.querySelector('.wanjuan-native-input-overlay')`,
      "workspace input dialog did not close"
    );
    console.log("workspace team start/stop bridge test passed");
  } finally {
    try { ws?.close(); } catch {}
    child.kill("SIGTERM");
    await sleep(500);
    if (!child.killed) child.kill("SIGKILL");
    await new Promise((resolve) => conflictServer.close(() => resolve()));
    fs.rmSync(userDataPath, { recursive: true, force: true });
    if (stderr && process.env.WANJUAN_WORKSPACE_VERBOSE === "1") process.stderr.write(stderr);
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
