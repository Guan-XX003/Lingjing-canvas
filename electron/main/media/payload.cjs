// 媒体与下载载荷处理：把各种来源(arrayBuffer/bytes/text/dataURL/远程URL/本地文件)
// 归一化为 { buffer, mime }，供素材持久化、上传、外部工具消费。
const fs = require("fs");
const path = require("path");
const { sniffImageMime, guessMimeFromFilename } = require("../utils/mime.cjs");
const { sha256Buffer } = require("../utils/crypto.cjs");
const { localPathFromFileUrl } = require("../utils/paths.cjs");
const { assertPublicHttpUrl } = require("../net/security.cjs");
const { isLocalFilePathAllowed } = require("../net/file-access-filter.cjs");

function normalizedMime(mime) {
  return String(mime || "").split(";")[0].trim().toLowerCase();
}

function hasMediaHint(payload = {}, mime = "") {
  const hintedMime = normalizedMime(mime || payload?.mime);
  if (/^(video|audio)\//i.test(hintedMime)) return true;
  const kind = String(payload?.kind || "").toLowerCase();
  if (kind === "video" || kind === "audio") return true;
  const field = String(payload?.field || "").toLowerCase();
  if (field === "videourl" || field === "audiourl") return true;
  return /\.(mp4|webm|mov|m4v|avi|mkv|flv|mpeg|mpg|3gp|3g2|ts|mts|m2ts|wmv|mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|amr|aiff?|caf)($|\?)/i.test(
    String(payload?.filename || payload?.url || payload?.localPath || payload?.path || "")
  );
}

function looksLikeHtml(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return false;
  const head = buffer.slice(0, 1024).toString("utf8").replace(/^\uFEFF/, "").trimStart().toLowerCase();
  return (
    head.startsWith("<!doctype html") ||
    head.startsWith("<html") ||
    /^<head[\s>]/.test(head) ||
    /<title[\s>]/.test(head) ||
    /<body[\s>]/.test(head)
  );
}

function sniffMediaMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return "";
  if (buffer.length >= 12 && buffer.slice(4, 8).toString("ascii") === "ftyp") return "video/mp4";
  if (buffer.slice(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "AVI "
  ) return "video/x-msvideo";
  if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && [0xba, 0xb3].includes(buffer[3])) return "video/mpeg";
  if (buffer.slice(0, 3).toString("ascii") === "ID3") return "audio/mpeg";
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return "audio/mpeg";
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WAVE"
  ) return "audio/wav";
  if (buffer.slice(0, 4).toString("ascii") === "OggS") return "audio/ogg";
  if (buffer.slice(0, 4).toString("ascii") === "fLaC") return "audio/flac";
  return "";
}

function validateMediaPayload(result, payload = {}) {
  const buffer = result?.buffer;
  const declaredMime = normalizedMime(result?.mime || payload?.mime);
  if (!hasMediaHint(payload, declaredMime)) return result;
  if (!Buffer.isBuffer(buffer)) return result;
  if (buffer.length < 1024) throw new Error("Media asset is empty or too small to save");
  if (looksLikeHtml(buffer) || declaredMime === "text/html" || declaredMime === "application/xhtml+xml") {
    throw new Error("媒体地址返回的是网页或登录页，不是可播放的媒体文件");
  }
  if (/^text\//i.test(declaredMime) || declaredMime === "application/json") {
    throw new Error(`媒体地址返回了 ${declaredMime} 内容，不是可播放的媒体文件`);
  }
  const sniffedMime = sniffMediaMime(buffer);
  return sniffedMime && (!declaredMime || /^(video|audio)\//i.test(declaredMime))
    ? { ...result, mime: sniffedMime }
    : result;
}

function normalizeImagePayload(buffer, mime) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16) {
    return { buffer, mime };
  }
  const declaredMime = String(mime || "").split(";")[0].trim().toLowerCase();
  const signatures = [
    { mime: "image/png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
    { mime: "image/jpeg", bytes: Buffer.from([0xff, 0xd8, 0xff]) },
    { mime: "image/gif", bytes: Buffer.from([0x47, 0x49, 0x46, 0x38]) },
    { mime: "image/webp", bytes: Buffer.from("RIFF", "ascii"), verify: (candidate) => candidate.length >= 12 && candidate.slice(8, 12).toString("ascii") === "WEBP" }
  ];
  let normalizedBuffer = buffer;
  for (const signature of signatures) {
    const offset = buffer.indexOf(signature.bytes);
    if (offset > 0 && offset < 4096) {
      const candidate = buffer.slice(offset);
      if (!signature.verify || signature.verify(candidate)) {
        normalizedBuffer = candidate;
        break;
      }
    }
  }
  const sniffedMime = sniffImageMime(normalizedBuffer);
  return {
    buffer: normalizedBuffer,
    mime: sniffedMime || declaredMime || mime
  };
}

function readLocalFilePayload(filePath) {
  const resolvedPath = path.resolve(String(filePath || ""));
  // 只允许读取白名单媒体目录内的本地文件（与 file:// 渲染过滤同一套），
  // 阻断被攻破渲染进程借上传/读取通道外泄 ~/.ssh、/etc/passwd 等任意本地文件。
  if (!isLocalFilePathAllowed(resolvedPath)) {
    throw new Error(`拒绝访问该本地路径（不在允许的媒体目录内）`);
  }
  const buffer = fs.readFileSync(resolvedPath);
  return {
    buffer,
    mime: guessMimeFromFilename(resolvedPath),
    filename: path.basename(resolvedPath)
  };
}

async function resolveAssetPayload(payload) {
  if (payload?.text !== undefined && payload?.text !== null) {
    return {
      buffer: Buffer.from(String(payload.text), "utf8"),
      mime: payload?.mime || "text/plain",
      filename: payload?.filename || "asset.txt"
    };
  }
  if (payload?.localPath && fs.existsSync(payload.localPath)) {
    return readLocalFilePayload(payload.localPath);
  }
  const media = await bufferFromMediaPayload(payload || {});
  return {
    buffer: media.buffer,
    mime: media.mime,
    filename: payload?.filename || `asset-${Date.now()}`
  };
}

async function bufferFromDownloadPayload(payload) {
  const url = String(payload?.url || "");
  const text = payload?.text;
  const sender = payload?.sender;
  const downloadId = payload?.downloadId;
  const emitProgress = (progress) => {
    if (!sender || !downloadId) return;
    sender.send(`wanjuan:download-progress:${downloadId}`, progress);
  };
  if (payload?.arrayBuffer) {
    const buffer = Buffer.from(payload.arrayBuffer);
    emitProgress({ percent: 100, receivedBytes: buffer.length, totalBytes: buffer.length });
    return validateMediaPayload({
      buffer,
      mime: payload?.mime || "application/octet-stream"
    }, payload);
  }
  if (payload?.bytes) {
    const buffer = Buffer.from(payload.bytes);
    emitProgress({ percent: 100, receivedBytes: buffer.length, totalBytes: buffer.length });
    return validateMediaPayload({
      buffer,
      mime: payload?.mime || "application/octet-stream"
    }, payload);
  }
  if (text !== undefined && text !== null) {
    const body = Buffer.from(String(text), "utf8");
    emitProgress({ percent: 100, receivedBytes: body.length, totalBytes: body.length });
    return validateMediaPayload({
      buffer: body,
      mime: payload?.mime || "application/json"
    }, payload);
  }
  if (payload?.localPath && fs.existsSync(payload.localPath)) {
    const file = readLocalFilePayload(payload.localPath);
    emitProgress({ percent: 100, receivedBytes: file.buffer.length, totalBytes: file.buffer.length });
    return validateMediaPayload(file, payload);
  }
  if (payload?.path && fs.existsSync(payload.path)) {
    const file = readLocalFilePayload(payload.path);
    emitProgress({ percent: 100, receivedBytes: file.buffer.length, totalBytes: file.buffer.length });
    return validateMediaPayload(file, payload);
  }
  if (!url) throw new Error("Missing download URL");

  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!match) throw new Error("Unsupported data URL");
    const isBase64 = Boolean(match[2]);
    const body = match[3] || "";
    emitProgress({ percent: 100, receivedBytes: body.length, totalBytes: body.length });
    return validateMediaPayload({
      buffer: isBase64 ? Buffer.from(body, "base64") : Buffer.from(decodeURIComponent(body)),
      mime: match[1] || payload.mime || ""
    }, payload);
  }

  if (payload?.base64) {
    emitProgress({ percent: 100, receivedBytes: String(payload.base64).length, totalBytes: String(payload.base64).length });
    return validateMediaPayload({
      buffer: Buffer.from(String(payload.base64), "base64"),
      mime: payload.mime || ""
    }, payload);
  }
  if (/^file:\/\//i.test(url)) {
    const file = readLocalFilePayload(localPathFromFileUrl(url) || decodeURIComponent(new URL(url).pathname));
    emitProgress({ percent: 100, receivedBytes: file.buffer.length, totalBytes: file.buffer.length });
    return validateMediaPayload(file, payload);
  }

  if (!/^https?:\/\//i.test(url)) throw new Error("Unsupported download URL");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const totalBytes = Number(response.headers.get("content-length") || 0);
  if (!response.body || typeof response.body.getReader !== "function") {
    const arrayBuffer = await response.arrayBuffer();
    emitProgress({ percent: 100, receivedBytes: arrayBuffer.byteLength, totalBytes: arrayBuffer.byteLength });
    return validateMediaPayload({
      buffer: Buffer.from(arrayBuffer),
      mime: response.headers.get("content-type") || payload.mime || ""
    }, payload);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let receivedBytes = 0;
  emitProgress({ percent: totalBytes ? 0 : null, receivedBytes, totalBytes });
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    const chunk = Buffer.from(value);
    chunks.push(chunk);
    receivedBytes += chunk.length;
    emitProgress({
      percent: totalBytes ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100)) : null,
      receivedBytes,
      totalBytes
    });
  }
  emitProgress({ percent: 100, receivedBytes, totalBytes: totalBytes || receivedBytes });
  return validateMediaPayload({
    buffer: Buffer.concat(chunks),
    mime: response.headers.get("content-type") || payload.mime || ""
  }, payload);
}

async function bufferFromMediaPayload(payload) {
  const url = String(payload?.url || "");
  const localPath =
    (typeof payload?.localPath === "string" && payload.localPath) ||
    (typeof payload?.path === "string" && payload.path) ||
    (/^file:\/\//i.test(url) ? localPathFromFileUrl(url) : "");
  if (localPath) {
    return validateMediaPayload(readLocalFilePayload(localPath), payload);
  }
  if (payload?.arrayBuffer) {
    return validateMediaPayload({
      buffer: Buffer.from(payload.arrayBuffer),
      mime: payload?.mime || "application/octet-stream"
    }, payload);
  }
  if (payload?.bytes) {
    return validateMediaPayload({
      buffer: Buffer.from(payload.bytes),
      mime: payload?.mime || "application/octet-stream"
    }, payload);
  }
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!match) throw new Error("Unsupported data URL");
    return validateMediaPayload({
      buffer: match[2] ? Buffer.from(match[3] || "", "base64") : Buffer.from(decodeURIComponent(match[3] || "")),
      mime: match[1] || payload?.mime || "application/octet-stream"
    }, payload);
  }
  if (payload?.base64) {
    return validateMediaPayload({
      buffer: Buffer.from(String(payload.base64), "base64"),
      mime: payload?.mime || "application/octet-stream"
    }, payload);
  }
  assertPublicHttpUrl(url, "Media URL");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch media failed: ${response.status}`);
  return validateMediaPayload({
    buffer: Buffer.from(await response.arrayBuffer()),
    mime: response.headers.get("content-type") || payload?.mime || guessMimeFromFilename(new URL(url).pathname) || "application/octet-stream"
  }, payload);
}

module.exports = {
  normalizeImagePayload,
  readLocalFilePayload,
  resolveAssetPayload,
  bufferFromDownloadPayload,
  bufferFromMediaPayload,
};
