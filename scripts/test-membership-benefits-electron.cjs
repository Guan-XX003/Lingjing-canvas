#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const electronPath = require("electron");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-membership-qa-"));
const userDataPath = path.join(tempRoot, "user-data");
const qaRoot = path.join(projectRoot, "docs", "qa");
const port = Number(process.env.WANJUAN_MEMBERSHIP_QA_PORT || 9486);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

fs.mkdirSync(userDataPath, { recursive: true });
fs.mkdirSync(qaRoot, { recursive: true });

async function waitForTarget() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const target = targets.find((item) => item.type === "page" && /index\.html/.test(String(item.url || "")));
      if (target?.webSocketDebuggerUrl) return target;
    } catch {}
    await sleep(250);
  }
  throw new Error("等待会员权益 Electron 页面超时");
}

async function run() {
  const child = spawn(electronPath, [projectRoot, `--remote-debugging-port=${port}`], {
    cwd: projectRoot,
    stdio: ["ignore", "ignore", "pipe"],
    env: {
      ...process.env,
      WANJUAN_TEST_USER_DATA_PATH: userDataPath,
      WANJUAN_ALLOW_RANDOM_PORT: "1",
      WANJUAN_DISABLE_UPDATE_CHECK: "1",
      WANJUAN_GPU_MODE: "off",
    },
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  let ws;
  try {
    const target = await waitForTarget();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    let requestId = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = ++requestId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression, awaitPromise = false) => {
      const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
      if (response.result?.exceptionDetails) {
        throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
      }
      return response.result?.result?.value;
    };
    const waitFor = async (expression, label, timeout = 30000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await evaluate(expression)) return;
        await sleep(150);
      }
      throw new Error(`等待 ${label} 超时`);
    };
    const setWindowSize = async (width, height) => {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(350);
    };
    const capture = async (filename, selector = "") => {
      let clip;
      if (selector) {
        clip = await evaluate(`(() => {
          const rect = document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect();
          return rect ? { x: Math.max(0, rect.x - 12), y: Math.max(0, rect.y - 12), width: Math.min(innerWidth, rect.width + 24), height: Math.min(innerHeight, rect.height + 24), scale: 1 } : null;
        })()`);
      }
      const response = await send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
        ...(clip ? { clip } : {}),
      });
      fs.writeFileSync(path.join(qaRoot, filename), Buffer.from(response.result.data, "base64"));
    };

    await send("Runtime.enable");
    await send("Page.enable");
    await setWindowSize(1600, 980);
    await waitFor("document.body?.innerText?.includes('设置')", "应用初始化");
    await sleep(1200);
    await evaluate("(() => { document.documentElement.classList.remove('wanjuan-booting'); document.getElementById('wanjuan-boot-splash')?.remove(); })()");
    await evaluate("window.dispatchEvent(new CustomEvent('wanjuan:open-account-settings'))");
    await waitFor("!!document.querySelector('.wanjuan-membership-benefits-button')", "会员权益按钮");

    const beforeStatus = await evaluate("document.querySelectorAll('.wanjuan-account-metrics strong')[1]?.textContent || ''");
    assert.equal(beforeStatus, "未开通");
    assert.equal(await evaluate("document.querySelector('.wanjuan-membership-benefits-button')?.textContent?.trim()"), "会员权益");
    await capture("membership-benefits-card-isolated-20260814.png", ".wanjuan-account-settings-band");

    await evaluate("(() => { const button = document.querySelector('.wanjuan-membership-benefits-button'); button.focus(); button.click(); })()");
    await waitFor("!!document.querySelector('.wanjuan-membership-dialog')", "会员权益弹窗");
    const dialogText = await evaluate("document.querySelector('.wanjuan-membership-dialog')?.innerText || ''");
    for (const expected of [
      "万卷会员",
      "19.9",
      "/月",
      "内测开放",
      "企业模型统一管理",
      "云端提示词库",
      "极鑫模型 85 折",
      "3379084564",
    ]) assert.equal(dialogText.includes(expected), true, `弹窗缺少：${expected}`);
    assert.equal(await evaluate("document.activeElement?.getAttribute('aria-label')"), "关闭会员权益");
    await capture("membership-benefits-dialog-wide-isolated-20260814.png");

    await evaluate(`(() => {
      window.__membershipCopied = '';
      window.__membershipClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__membershipCopied = value; } } });
      document.querySelector('.wanjuan-membership-dialog-footer button').click();
    })()`);
    await waitFor("document.querySelector('.wanjuan-toast')?.textContent === 'QQ 已复制'", "复制成功提示");
    assert.equal(await evaluate("window.__membershipCopied"), "3379084564");

    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await waitFor("!document.querySelector('.wanjuan-membership-dialog')", "Escape 关闭弹窗");
    assert.equal(await evaluate("document.activeElement?.classList.contains('wanjuan-membership-benefits-button')"), true);

    await evaluate("document.querySelector('.wanjuan-membership-benefits-button').click()");
    await waitFor("!!document.querySelector('.wanjuan-membership-dialog-backdrop')", "再次打开弹窗");
    await evaluate(`(() => {
      const backdrop = document.querySelector('.wanjuan-membership-dialog-backdrop');
      backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    })()`);
    await waitFor("!document.querySelector('.wanjuan-membership-dialog')", "遮罩关闭弹窗");

    await evaluate("document.querySelector('.wanjuan-membership-benefits-button').click()");
    await waitFor("!!document.querySelector('.wanjuan-membership-dialog')", "复制失败测试弹窗");
    await evaluate(`(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
      document.querySelector('.wanjuan-membership-dialog-footer button').click();
    })()`);
    await waitFor("document.querySelector('.wanjuan-toast')?.textContent === '复制失败，请手动复制 QQ'", "复制失败提示");

    await sleep(2200);
    await setWindowSize(480, 800);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), true, "窄窗口不应横向溢出");
    assert.equal(await evaluate("document.querySelector('.wanjuan-membership-dialog').scrollWidth <= document.querySelector('.wanjuan-membership-dialog').clientWidth"), true, "弹窗内容不应溢出");
    await capture("membership-benefits-dialog-narrow-isolated-20260814.png");

    const afterStatus = await evaluate("document.querySelectorAll('.wanjuan-account-metrics strong')[1]?.textContent || ''");
    assert.equal(afterStatus, beforeStatus, "查看权益不应修改会员状态");
    console.log("membership benefits Electron QA: dialog, focus, copy success/failure, responsive layout and immutable membership state passed");
  } finally {
    try { ws?.close(); } catch {}
    if (child.exitCode === null) child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      sleep(3000),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
    fs.rmSync(tempRoot, { recursive: true, force: true });
    if (child.exitCode && child.exitCode !== 0) process.stderr.write(stderr.slice(-4000));
  }
}

run().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
