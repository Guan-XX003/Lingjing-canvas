/**
 * CLI/MCP 自动化结果归一化。
 * 只提取媒体引用，不把 API 响应、凭据或大段 base64 原样暴露给外部智能体。
 */

const MEDIA_KEYS = [
  `url`, `imageUrl`, `videoUrl`, `audioUrl`, `resultUrl`, `outputUrl`,
  `mediaUrl`, `downloadUrl`, `fileUrl`, `contentUrl`, `uri`,
  `image_url`, `video_url`, `audio_url`, `result_url`, `output_url`,
  `media_url`, `download_url`, `file_url`, `content_url`,
];

function mediaKindFromValue(kind: string): `image` | `video` | `audio` {
  return kind === `video` || kind === `audio` ? kind : `image`;
}

function isMediaString(value: string, kind: string): boolean {
  const text = String(value || ``).trim();
  if (!text || text.length > 8 * 1024 * 1024) return false;
  if (/^(https?:|file:|blob:)/i.test(text)) return true;
  if (/^data:/i.test(text)) {
    // data URL 可供 renderer 使用，但不直接作为 CLI 输出；持久化后返回本地文件。
    return new RegExp(`^data:${mediaKindFromValue(kind)}(?:\\/|;)`, `i`).test(text);
  }
  return false;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== `string`) return value;
  const text = value.trim();
  if (!text || text.length > 8 * 1024 * 1024 || !/^[\[{]/.test(text)) return value;
  try { return JSON.parse(text); } catch { return value; }
}

export function wanjuanExtractAutomationMedia(value: unknown, kind: string = `image`): string {
  const seen = new Set<unknown>();
  const visit = (current: unknown, depth: number): string => {
    if (depth > 8 || current == null) return ``;
    current = parseMaybeJson(current);
    if (typeof current === `string`) return isMediaString(current, kind) ? current.trim() : ``;
    if (typeof current !== `object` || seen.has(current)) return ``;
    seen.add(current);
    const record = current as Record<string, unknown>;
    for (const key of MEDIA_KEYS) {
      const found = visit(record[key], depth + 1);
      if (found) return found;
    }
    for (const entry of Object.values(record)) {
      const found = visit(entry, depth + 1);
      if (found) return found;
    }
    if (Array.isArray(current)) {
      for (const entry of current) {
        const found = visit(entry, depth + 1);
        if (found) return found;
      }
    }
    return ``;
  };
  return visit(value, 0);
}

export function wanjuanAutomationMediaField(kind: string): `imageUrl` | `videoUrl` | `audioUrl` {
  return mediaKindFromValue(kind) === `video` ? `videoUrl` : mediaKindFromValue(kind) === `audio` ? `audioUrl` : `imageUrl`;
}

export function wanjuanAutomationMediaMime(kind: string): string {
  return mediaKindFromValue(kind) === `video` ? `video/mp4` : mediaKindFromValue(kind) === `audio` ? `audio/mpeg` : `image/png`;
}

export function wanjuanAutomationFileUrl(localPath: string): string {
  const text = String(localPath || ``).trim();
  if (!text) return ``;
  if (/^file:\/\//i.test(text)) return text;
  const normalized = text.replace(/\\/g, `/`);
  if (/^[A-Za-z]:\//.test(normalized))
    return `file:///${normalized.split(`/`).map((part) => encodeURIComponent(part).replace(/%3A/i, `:`)).join(`/`)}`;
  if (/^\/\//.test(normalized))
    return `file://${normalized.slice(2).split(`/`).map((part) => encodeURIComponent(part)).join(`/`)}`;
  return `file://${normalized.split(`/`).map((part) => encodeURIComponent(part)).join(`/`)}`;
}
