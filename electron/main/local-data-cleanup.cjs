// Local uninstall cleanup. The renderer never supplies a filesystem path: only
// the main process resolves and validates the managed userData directory.
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");

const { app } = require("./electron-refs.cjs");
const { TEST_USER_DATA_DIR, TEST_USER_DATA_PATH } = require("./config.cjs");

const LOCAL_DATA_REMOVAL_CONFIRMATION = "DELETE_WANJUAN_LOCAL_DATA";

function normalizedPath(value) {
  return path.resolve(String(value || ""));
}

function samePath(left, right) {
  if (!left || !right) return false;
  const a = normalizedPath(left);
  const b = normalizedPath(right);
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

function isSafeManagedUserDataRoot(targetPath, options = {}) {
  if (!targetPath) return false;
  const target = normalizedPath(targetPath);
  const homePath = normalizedPath(options.homePath || os.homedir());
  const appDataPath = normalizedPath(options.appDataPath || app?.getPath?.("appData") || homePath);
  const filesystemRoot = path.parse(target).root;
  if (
    samePath(target, filesystemRoot) ||
    samePath(target, homePath) ||
    samePath(target, appDataPath)
  ) {
    return false;
  }

  const allowedRoots = Array.isArray(options.allowedRoots)
    ? options.allowedRoots
    : [
        path.join(appDataPath, TEST_USER_DATA_DIR),
        ...(!app?.isPackaged && TEST_USER_DATA_PATH ? [TEST_USER_DATA_PATH] : []),
      ];
  return allowedRoots.some((allowedPath) => samePath(target, allowedPath));
}

function powershellLiteral(value) {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

function createCleanupHelperSpec(targetPath, parentPid, platform = process.platform) {
  const target = normalizedPath(targetPath);
  const pid = Math.max(1, Number(parentPid) || process.pid);
  if (platform === "win32") {
    const command = [
      `$parentId = ${pid}`,
      `try { Wait-Process -Id $parentId -Timeout 60 -ErrorAction SilentlyContinue } catch {}`,
      `Start-Sleep -Milliseconds 300`,
      `Remove-Item -LiteralPath ${powershellLiteral(target)} -Recurse -Force -ErrorAction SilentlyContinue`,
    ].join("; ");
    return {
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-WindowStyle",
        "Hidden",
        "-EncodedCommand",
        Buffer.from(command, "utf16le").toString("base64"),
      ],
    };
  }

  return {
    command: "/bin/sh",
    args: [
      "-c",
      'while kill -0 "$1" 2>/dev/null; do sleep 0.2; done; sleep 0.3; rm -rf -- "$2"',
      "wanjuan-local-data-cleanup",
      String(pid),
      target,
    ],
  };
}

function scheduleManagedLocalDataRemoval(options = {}) {
  const appRef = options.appRef || app;
  const targetPath = normalizedPath(options.targetPath || appRef?.getPath?.("userData"));
  const appDataPath = options.appDataPath || appRef?.getPath?.("appData");
  if (!isSafeManagedUserDataRoot(targetPath, {
    appDataPath,
    homePath: options.homePath,
    allowedRoots: options.allowedRoots,
  })) {
    throw new Error("拒绝清理：应用数据目录未通过安全校验");
  }

  const helper = createCleanupHelperSpec(targetPath, options.parentPid || process.pid, options.platform);
  const child = (options.spawnImpl || spawn)(helper.command, helper.args, {
    cwd: os.tmpdir(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref?.();

  if (options.quit !== false) {
    setTimeout(() => appRef?.quit?.(), Number(options.quitDelayMs || 250));
  }
  return {
    ok: true,
    scheduled: true,
    directoryName: path.basename(targetPath),
  };
}

module.exports = {
  LOCAL_DATA_REMOVAL_CONFIRMATION,
  createCleanupHelperSpec,
  isSafeManagedUserDataRoot,
  scheduleManagedLocalDataRemoval,
};
