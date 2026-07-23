// 成员端企业网关客户端：私有网段校验、TLS 指纹 pinning 和 Workspace 请求。
const crypto = require("node:crypto");
const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const { app } = require("./electron-refs.cjs");

class EnterpriseGatewayClientError extends Error {
  constructor(message, options = {}) {
    super(String(message || "企业网关请求失败"));
    this.name = "EnterpriseGatewayClientError";
    this.code = String(options.code || "ENTERPRISE_GATEWAY_REQUEST_FAILED");
    this.status = Number(options.status || 0);
  }
}

function isPrivateHostname(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(host) || host.endsWith(".local")) return true;
  const parts = host.split(".").map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168));
}

function normalizeGatewayUrl(value) {
  const parsed = new URL(String(value || "").trim().replace(/\/+$/, ""));
  if (parsed.protocol !== "https:") throw new EnterpriseGatewayClientError("企业网关必须使用 HTTPS", { code: "GATEWAY_HTTPS_REQUIRED" });
  if (!isPrivateHostname(parsed.hostname)) throw new EnterpriseGatewayClientError("企业网关地址必须位于局域网", { code: "GATEWAY_PRIVATE_ADDRESS_REQUIRED" });
  if (parsed.username || parsed.password || parsed.pathname !== "/") {
    throw new EnterpriseGatewayClientError("企业网关地址格式无效", { code: "GATEWAY_URL_INVALID" });
  }
  return parsed.origin;
}

function fingerprintFromRawCertificate(raw) {
  return `sha256/${crypto.createHash("sha256").update(raw).digest("base64")}`;
}

function fingerprintsEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function requestPinnedJson(baseUrl, pathname, options = {}) {
  const normalizedBaseUrl = normalizeGatewayUrl(baseUrl);
  const target = new URL(pathname, `${normalizedBaseUrl}/`);
  if (target.origin !== normalizedBaseUrl) throw new EnterpriseGatewayClientError("企业网关请求地址越界", { code: "GATEWAY_URL_INVALID" });
  const expectedFingerprint = String(options.certificateFingerprint || "");
  if (!expectedFingerprint.startsWith("sha256/")) {
    throw new EnterpriseGatewayClientError("缺少有效的企业网关证书指纹", { code: "GATEWAY_TLS_FINGERPRINT_REQUIRED" });
  }
  const bodyBuffer = options.body === undefined ? null : Buffer.from(JSON.stringify(options.body), "utf8");

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (options.signal) options.signal.removeEventListener("abort", onAbort);
      if (error) reject(error);
      else resolve(value);
    };
    const request = https.request(target, {
      method: options.method || "GET",
      rejectUnauthorized: false,
      servername: target.hostname.endsWith(".local") ? target.hostname : undefined,
      headers: {
        accept: "application/json",
        ...(bodyBuffer ? { "content-type": "application/json", "content-length": bodyBuffer.length } : {}),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers || {}),
      },
      timeout: Number(options.timeoutMs || 15000),
    }, (response) => {
      try {
        const certificate = response.socket.getPeerCertificate(true);
        const actualFingerprint = fingerprintFromRawCertificate(certificate.raw);
        if (!fingerprintsEqual(actualFingerprint, expectedFingerprint)) {
          finish(new EnterpriseGatewayClientError("企业网关证书指纹不匹配", { code: "GATEWAY_TLS_MISMATCH" }));
          response.destroy();
          return;
        }
      } catch (error) {
        finish(new EnterpriseGatewayClientError(error?.message || "未能校验企业网关证书", { code: "GATEWAY_TLS_MISMATCH" }));
        response.destroy();
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let value = {};
        try { value = text ? JSON.parse(text) : {}; } catch {}
        if (response.statusCode < 200 || response.statusCode >= 300) {
          finish(new EnterpriseGatewayClientError(value.error || `企业网关请求失败 (${response.statusCode})`, {
            code: value.code || `HTTP_${response.statusCode}`,
            status: response.statusCode,
          }));
          return;
        }
        finish(null, { value, headers: response.headers, status: response.statusCode });
      });
    });
    request.on("timeout", () => request.destroy(new EnterpriseGatewayClientError("连接企业网关超时", { code: "GATEWAY_TIMEOUT" })));
    request.on("error", (error) => finish(error instanceof EnterpriseGatewayClientError ? error : new EnterpriseGatewayClientError(error.message, { code: "GATEWAY_NETWORK_ERROR" })));
    const onAbort = () => request.destroy(Object.assign(new EnterpriseGatewayClientError("企业网关请求已取消", { code: "GATEWAY_ABORTED" }), { name: "AbortError" }));
    if (options.signal?.aborted) {
      onAbort();
      return;
    }
    if (options.signal) options.signal.addEventListener("abort", onAbort, { once: true });
    if (bodyBuffer) request.write(bodyBuffer);
    request.end();
  });
}

function requestPinnedUpload(baseUrl, pathname, options = {}) {
  const normalizedBaseUrl = normalizeGatewayUrl(baseUrl);
  const target = new URL(pathname, `${normalizedBaseUrl}/`);
  if (target.origin !== normalizedBaseUrl) throw new EnterpriseGatewayClientError("企业网关请求地址越界", { code: "GATEWAY_URL_INVALID" });
  const expectedFingerprint = String(options.certificateFingerprint || "");
  if (!expectedFingerprint.startsWith("sha256/")) {
    throw new EnterpriseGatewayClientError("缺少有效的企业网关证书指纹", { code: "GATEWAY_TLS_FINGERPRINT_REQUIRED" });
  }
  const metadata = Buffer.from(JSON.stringify(options.metadata || {}), "utf8").toString("base64url");

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (options.signal) options.signal.removeEventListener("abort", onAbort);
      if (error) reject(error);
      else resolve(value);
    };
    const request = https.request(target, {
      method: "POST",
      rejectUnauthorized: false,
      servername: target.hostname.endsWith(".local") ? target.hostname : undefined,
      headers: {
        accept: "application/json",
        "content-type": String(options.mime || "application/octet-stream"),
        "x-wanjuan-upload-metadata": metadata,
        ...(Number(options.size || 0) > 0 ? { "content-length": String(options.size) } : {}),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      timeout: Number(options.timeoutMs || 10 * 60 * 1000),
    }, (response) => {
      try {
        const certificate = response.socket.getPeerCertificate(true);
        const actualFingerprint = fingerprintFromRawCertificate(certificate.raw);
        if (!fingerprintsEqual(actualFingerprint, expectedFingerprint)) {
          finish(new EnterpriseGatewayClientError("企业网关证书指纹不匹配", { code: "GATEWAY_TLS_MISMATCH" }));
          response.destroy();
          return;
        }
      } catch (error) {
        finish(new EnterpriseGatewayClientError(error?.message || "未能校验企业网关证书", { code: "GATEWAY_TLS_MISMATCH" }));
        response.destroy();
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        let value = {};
        try { value = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch {}
        if (response.statusCode < 200 || response.statusCode >= 300) {
          finish(new EnterpriseGatewayClientError(value.error || `企业网关上传失败 (${response.statusCode})`, {
            code: value.code || `HTTP_${response.statusCode}`,
            status: response.statusCode,
          }));
          return;
        }
        finish(null, { value, headers: response.headers, status: response.statusCode });
      });
    });
    const onAbort = () => request.destroy(Object.assign(new EnterpriseGatewayClientError("企业网关上传已取消", { code: "GATEWAY_ABORTED" }), { name: "AbortError" }));
    request.on("timeout", () => request.destroy(new EnterpriseGatewayClientError("企业网关上传超时", { code: "GATEWAY_TIMEOUT" })));
    request.on("error", (error) => finish(error instanceof EnterpriseGatewayClientError ? error : new EnterpriseGatewayClientError(error.message, { code: "GATEWAY_NETWORK_ERROR" })));
    if (options.signal?.aborted) {
      onAbort();
      return;
    }
    if (options.signal) options.signal.addEventListener("abort", onAbort, { once: true });
    const source = options.stream;
    if (!source || typeof source.pipe !== "function") {
      request.destroy(new EnterpriseGatewayClientError("企业上传缺少文件数据", { code: "GATEWAY_UPLOAD_SOURCE_REQUIRED" }));
      return;
    }
    source.on("error", (error) => request.destroy(error));
    source.pipe(request);
  });
}

function enterpriseSnapshotCachePath() {
  return path.join(app.getPath("userData"), "enterprise-workspace-snapshot.json");
}

function writeEnterpriseSnapshotCache(payload) {
  const target = enterpriseSnapshotCachePath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(payload, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, target);
}

function readEnterpriseSnapshotCache() {
  try {
    return JSON.parse(fs.readFileSync(enterpriseSnapshotCachePath(), "utf8"));
  } catch {
    return null;
  }
}

function clearEnterpriseSnapshotCache() {
  try { fs.rmSync(enterpriseSnapshotCachePath(), { force: true }); } catch {}
}

module.exports = {
  EnterpriseGatewayClientError,
  clearEnterpriseSnapshotCache,
  normalizeGatewayUrl,
  readEnterpriseSnapshotCache,
  requestPinnedJson,
  requestPinnedUpload,
  writeEnterpriseSnapshotCache,
};
