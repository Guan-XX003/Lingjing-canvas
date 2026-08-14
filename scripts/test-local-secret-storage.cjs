const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-local-secret-"));
let systemProbeCount = 0;
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron" || request === "electron/main") {
    return {
      app: { getPath: () => tempRoot },
      safeStorage: { isEncryptionAvailable: () => { systemProbeCount += 1; return false; } },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

try {
  const storage = require("../electron/main/local-secret-storage.cjs");
  const secret = "sk-local-fallback-secret";
  assert.equal(storage.secretStorageMode(), "local");
  const encrypted = storage.encryptLocalSecret(secret);
  assert.equal(encrypted.includes(secret), false);
  assert.equal(storage.decryptLocalSecret(encrypted), secret);
  const keyPath = path.join(tempRoot, ".wanjuan-local-secret-key");
  assert.equal(fs.statSync(keyPath).mode & 0o777, 0o600);
  assert.equal(fs.readFileSync(keyPath).includes(Buffer.from(secret)), false);
  systemProbeCount = 0;
  assert.equal(storage.secretStorageMode(), "local");
  assert.equal(systemProbeCount, 0, "existing local key must avoid probing macOS safeStorage");
  const secondEncrypted = storage.encryptLocalSecret("second-local-secret");
  assert.equal(systemProbeCount, 0, "existing local key must avoid safeStorage during encryption");
  assert.equal(storage.decryptLocalSecret(secondEncrypted), "second-local-secret");
  console.log("local secret storage: AES-GCM fallback and 0600 master key passed");
} finally {
  Module._load = originalLoad;
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
