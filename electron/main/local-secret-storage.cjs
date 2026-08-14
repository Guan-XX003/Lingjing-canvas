// 主进程本机秘密存储：优先 Electron safeStorage；ad-hoc 签名无法访问 Keychain 时，
// 使用 userData 内 0600 随机主密钥做 AES-256-GCM，保证后续本机更新可继续解密。
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { app, safeStorage } = require("./electron-refs.cjs");

const LOCAL_PREFIX = "wanjuan-local-v1.";

function systemEncryptionAvailable() {
  try { return !!safeStorage?.isEncryptionAvailable?.(); } catch { return false; }
}

function localMasterKeyPath() {
  return path.join(app.getPath("userData"), ".wanjuan-local-secret-key");
}

function existingLocalMasterKey() {
  try {
    const key = fs.readFileSync(localMasterKeyPath());
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

function readOrCreateLocalMasterKey() {
  const target = localMasterKeyPath();
  const existingKey = existingLocalMasterKey();
  if (existingKey) return existingKey;
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const key = crypto.randomBytes(32);
  try {
    fs.writeFileSync(target, key, { mode: 0o600, flag: "wx" });
    return key;
  } catch (error) {
    if (error?.code === "EEXIST") {
      const existing = fs.readFileSync(target);
      if (existing.length === 32) return existing;
    }
    throw error;
  }
}

function localEncryptionAvailable() {
  try { return readOrCreateLocalMasterKey().length === 32; } catch { return false; }
}

function secretStorageMode() {
  // Keep ad-hoc/local updates on the existing AES key. Probing safeStorage first can
  // block the Electron main thread on a macOS Keychain identity prompt after replacement.
  if (existingLocalMasterKey()) return "local";
  if (systemEncryptionAvailable()) return "system";
  if (localEncryptionAvailable()) return "local";
  return "unavailable";
}

function encryptLocalSecret(value) {
  const text = String(value || "");
  if (existingLocalMasterKey()) return encryptWithLocalKey(text);
  if (systemEncryptionAvailable()) return safeStorage.encryptString(text).toString("base64");
  return encryptWithLocalKey(text);
}

function encryptWithLocalKey(text) {
  const key = readOrCreateLocalMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${LOCAL_PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptLocalSecret(value) {
  const encoded = String(value || "");
  if (!encoded) return "";
  if (!encoded.startsWith(LOCAL_PREFIX)) {
    if (!systemEncryptionAvailable()) return "";
    return safeStorage.decryptString(Buffer.from(encoded, "base64"));
  }
  const parts = encoded.slice(LOCAL_PREFIX.length).split(".");
  if (parts.length !== 3) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", readOrCreateLocalMasterKey(), Buffer.from(parts[0], "base64url"));
  decipher.setAuthTag(Buffer.from(parts[1], "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(parts[2], "base64url")), decipher.final()]).toString("utf8");
}

module.exports = {
  decryptLocalSecret,
  encryptLocalSecret,
  secretStorageMode,
  systemEncryptionAvailable,
};
