// 成员端企业上传源：把本地文件、IPC 字节、data URL 或公网响应转换为 Node 可读流。
const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");

const { assertPublicHttpUrl } = require("./net/security.cjs");
const { isLocalFilePathAllowed } = require("./net/file-access-filter.cjs");
const { localPathFromFileUrl } = require("./utils/paths.cjs");
const { guessMimeFromFilename } = require("./utils/mime.cjs");

function bufferSource(buffer, payload = {}) {
  const value = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  return {
    stream: Readable.from(value),
    size: value.length,
    mime: String(payload.mime || "application/octet-stream"),
    filename: String(payload.filename || `enterprise-upload-${Date.now()}`),
  };
}

function localFileSource(filePath, payload = {}) {
  const resolvedPath = path.resolve(String(filePath || ""));
  if (!isLocalFilePathAllowed(resolvedPath)) throw new Error("拒绝上传不在允许媒体目录内的本地文件");
  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) throw new Error("企业上传源不是有效文件");
  return {
    stream: fs.createReadStream(resolvedPath),
    size: stat.size,
    mime: String(payload.mime || guessMimeFromFilename(resolvedPath) || "application/octet-stream"),
    filename: String(payload.filename || path.basename(resolvedPath)),
  };
}

async function createEnterpriseUploadSource(payload = {}) {
  const url = String(payload.url || "");
  const localPath = String(payload.localPath || payload.path || (/^file:\/\//i.test(url) ? localPathFromFileUrl(url) : "") || "");
  if (localPath) return localFileSource(localPath, payload);
  if (payload.arrayBuffer) return bufferSource(payload.arrayBuffer, payload);
  if (payload.bytes) return bufferSource(payload.bytes, payload);
  if (payload.base64) return bufferSource(Buffer.from(String(payload.base64), "base64"), payload);
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!match) throw new Error("企业上传 data URL 格式无效");
    return bufferSource(match[2] ? Buffer.from(match[3] || "", "base64") : Buffer.from(decodeURIComponent(match[3] || "")), {
      ...payload,
      mime: payload.mime || match[1] || "application/octet-stream",
    });
  }
  const target = assertPublicHttpUrl(url, "企业上传素材地址");
  const response = await fetch(target, { signal: AbortSignal.timeout(120000) });
  if (!response.ok || !response.body) throw new Error(`读取企业上传素材失败 (${response.status})`);
  return {
    stream: Readable.fromWeb(response.body),
    size: Number(response.headers.get("content-length") || 0),
    mime: String(payload.mime || response.headers.get("content-type") || guessMimeFromFilename(target.pathname) || "application/octet-stream"),
    filename: String(payload.filename || path.basename(target.pathname) || `enterprise-upload-${Date.now()}`),
  };
}

module.exports = { createEnterpriseUploadSource };
