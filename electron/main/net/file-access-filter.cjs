// file:// 访问白名单过滤器。
//
// 背景：应用页面运行在 http://127.0.0.1 且 webSecurity 关闭（本地媒体以 file:// URL
// 直接渲染，遍布画布与既有项目数据，短期无法全量切换协议）。webSecurity 关闭意味着
// 被攻破的渲染进程可以 fetch 任意本地文件（如 ~/.ssh、/etc/passwd）。
//
// 缓解：在 webRequest 层拦截所有 file:// 请求，只放行媒体资产的合法来源目录，
// 其余一律取消并记录日志。这在不改动渲染层媒体管线的前提下，
// 消除了 webSecurity:false 最主要的攻击面（任意本地文件读取）。
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, session } = require("../electron-refs.cjs");
const { appendDesktopLog, truncateLogValue } = require("../logging.cjs");
const { defaultDownloadDirectory, localPathFromFileUrl } = require("../utils/paths.cjs");

const ROOTS_CACHE_TTL_MS = 10000;
let cachedRoots = null;
let cachedRootsAt = 0;

function addRoot(roots, candidate) {
  if (!candidate) return;
  try {
    roots.add(path.resolve(String(candidate)));
  } catch {}
}

function computeAllowedFileRoots() {
  const roots = new Set();
  addRoot(roots, defaultDownloadDirectory());
  addRoot(roots, app.getPath("userData"));
  addRoot(roots, os.tmpdir());
  // 用户常规媒体目录：拖入/选择素材的常见来源。
  for (const key of ["downloads", "desktop", "documents", "pictures", "videos", "music"]) {
    try {
      addRoot(roots, app.getPath(key));
    } catch {}
  }
  if (process.platform === "darwin") addRoot(roots, "/Volumes"); // 外接磁盘
  // 用户注册过的媒体库/迁移目录。
  try {
    const registryPath = path.join(app.getPath("userData"), "project-migration-directories.json");
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    for (const directory of registry?.directories || []) addRoot(roots, directory);
  } catch {}
  return [...roots];
}

function allowedFileRoots() {
  const now = Date.now();
  if (!cachedRoots || now - cachedRootsAt > ROOTS_CACHE_TTL_MS) {
    cachedRoots = computeAllowedFileRoots();
    cachedRootsAt = now;
  }
  return cachedRoots;
}

function isPathAllowed(filePath, roots) {
  let resolved;
  try {
    resolved = path.resolve(String(filePath));
  } catch {
    return false;
  }
  return roots.some((root) => {
    const relative = path.relative(root, resolved);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  });
}

function installFileAccessFilter() {
  if (process.env.WANJUAN_DISABLE_FILE_FILTER === "1") {
    appendDesktopLog("file-access-filter-disabled", { reason: "env" });
    return;
  }
  if (!session?.defaultSession?.webRequest) return;
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = String(details.url || "");
    if (!/^file:\/\//i.test(url)) {
      callback({});
      return;
    }
    const localPath = localPathFromFileUrl(url);
    const allowed = Boolean(localPath) && isPathAllowed(localPath, allowedFileRoots());
    if (!allowed) {
      appendDesktopLog("file-access-blocked", {
        url: truncateLogValue(url),
        resourceType: details.resourceType || ""
      });
    }
    callback({ cancel: !allowed });
  });
  appendDesktopLog("file-access-filter-installed", { roots: allowedFileRoots().length });
}

module.exports = { installFileAccessFilter, isPathAllowed, computeAllowedFileRoots };
