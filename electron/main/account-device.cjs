const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { app } = require("./electron-refs.cjs");

const ACCOUNT_DEVICE_VERSION = 1;

function normalizeAccountPlatform(value = process.platform) {
  const platform = String(value || "").trim().toLowerCase();
  return ["darwin", "win32", "linux"].includes(platform) ? platform : "unknown";
}

function fallbackDeviceName(platform) {
  if (platform === "darwin") return "Mac 上的万卷灵境";
  if (platform === "win32") return "Windows 上的万卷灵境";
  return "万卷灵境桌面端";
}

function sanitizeDeviceName(value, platform) {
  const cleaned = String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 120);
  return cleaned || fallbackDeviceName(platform);
}

function accountDevicePath(userDataPath = app.getPath("userData")) {
  return path.join(userDataPath, "account-device.json");
}

function writeAccountDevice(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, target);
  try {
    fs.chmodSync(target, 0o600);
  } catch {}
}

function readOrCreateAccountDevice(userDataPath = app.getPath("userData"), options = {}) {
  const target = accountDevicePath(userDataPath);
  let stored = null;
  try {
    stored = JSON.parse(fs.readFileSync(target, "utf8"));
  } catch {}

  const installationId = String(stored?.installationId || "").trim();
  const validInstallationId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(installationId);
  const state = validInstallationId ? {
    version: ACCOUNT_DEVICE_VERSION,
    installationId,
    createdAt: Number(stored?.createdAt || Date.now()),
  } : {
    version: ACCOUNT_DEVICE_VERSION,
    installationId: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  if (!validInstallationId || Number(stored?.version) !== ACCOUNT_DEVICE_VERSION) {
    writeAccountDevice(target, state);
  }

  const platform = normalizeAccountPlatform(options.platform || process.platform);
  let hostname = options.hostname;
  if (hostname === undefined) {
    try {
      hostname = os.hostname();
    } catch {
      hostname = "";
    }
  }

  return {
    installationId: state.installationId,
    platform,
    deviceName: sanitizeDeviceName(hostname, platform),
  };
}

module.exports = {
  ACCOUNT_DEVICE_VERSION,
  accountDevicePath,
  normalizeAccountPlatform,
  readOrCreateAccountDevice,
  sanitizeDeviceName,
};
