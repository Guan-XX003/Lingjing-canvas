// file:// 访问白名单过滤器自测（electron 环境）。
// 验证：白名单目录内的文件可通过 fetch(file://) 读取；目录外（如 /etc/hosts）被拦截。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-file-filter-"));
app.setPath("userData", path.join(root, "user-data"));

app.whenReady().then(async () => {
  const { installFileAccessFilter, isPathAllowed, computeAllowedFileRoots } = require("../electron/main/net/file-access-filter.cjs");

  // 纯函数校验
  const roots = computeAllowedFileRoots();
  assert.ok(roots.length > 0, "should have allowed roots");
  assert.ok(isPathAllowed(path.join(os.tmpdir(), "a.png"), roots), "tmpdir should be allowed");
  assert.ok(!isPathAllowed("/etc/hosts", roots), "/etc/hosts should be denied");
  assert.ok(!isPathAllowed(path.join(os.homedir(), ".ssh", "id_rsa"), roots), "~/.ssh should be denied");
  assert.ok(!isPathAllowed(`${os.tmpdir()}/../../etc/hosts`, roots), "traversal should be denied");

  installFileAccessFilter();

  // 行为校验：webSecurity:false 页面里 fetch file://
  const allowedFile = path.join(os.tmpdir(), `wanjuan-filter-ok-${Date.now()}.txt`);
  fs.writeFileSync(allowedFile, "allowed-content");
  const win = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, webSecurity: false }
  });
  await win.loadURL("data:text/html,<html><body>filter-test</body></html>");
  const probe = async (target) =>
    win.webContents.executeJavaScript(`
      fetch(${JSON.stringify(target)})
        .then((r) => ({ ok: r.ok, status: r.status }))
        .catch((e) => ({ ok: false, error: String(e && e.message || e) }));
    `, true);

  const allowedResult = await probe(`file://${allowedFile}`);
  const deniedResult = await probe("file:///etc/hosts");
  assert.equal(allowedResult.ok, true, `allowed file should load: ${JSON.stringify(allowedResult)}`);
  assert.equal(deniedResult.ok, false, `denied file must be blocked: ${JSON.stringify(deniedResult)}`);

  fs.rmSync(allowedFile, { force: true });
  fs.rmSync(root, { recursive: true, force: true });
  console.log("file access filter tests passed");
  app.exit(0);
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
