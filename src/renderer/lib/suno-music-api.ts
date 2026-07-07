/**
 * newapi 版 Suno 音乐接口层（供独立音乐节点使用）。
 *
 * 端点（base 为你的 newapi 站点）：
 *  - 生成/续写/翻唱  POST {base}/suno/generate
 *  - 查询结果        GET  {base}/suno/feed/{clipIds}   （clipIds 可逗号分隔多个）
 *  - 上传参考音频    POST {base}/suno/upload           （multipart，返回 clip_id）
 * 鉴权：Authorization: Bearer <apiKey>
 *
 * 提交后返回若干 clip（含 id），用 /suno/feed 轮询到 status=complete/error。
 * 模型版本用 mv 字段（chirp-*）。
 *
 * 分两类：纯函数（body 构造 / 结果提取 / 状态判定）可单测；网络函数接受可注入 fetch。
 */

/** mv 模型版本（新→旧） */
export const SUNO_MV_MODELS = ["chirp-crow", "chirp-bluejay", "chirp-auk", "chirp-v4", "chirp-v3-5"] as const;
export type SunoMv = (typeof SUNO_MV_MODELS)[number];
export const SUNO_DEFAULT_MV: SunoMv = "chirp-v4";
export const SUNO_MV_LABELS: Record<string, string> = {
  "chirp-crow": "chirp-crow（v5）",
  "chirp-bluejay": "chirp-bluejay（v4.5+）",
  "chirp-auk": "chirp-auk（v4.5）",
  "chirp-v4": "chirp-v4",
  "chirp-v3-5": "chirp-v3.5",
};

export const SUNO_ENDPOINTS = {
  generate: "/suno/generate",
  feed: "/suno/feed",
  upload: "/suno/upload",
} as const;

/** 生成参数（节点侧收集） */
export interface SunoGenerateParams {
  /** true=自定义(用 prompt 当歌词 + tags + title)；false=灵感(用 gpt_description_prompt 描述，AI 写词) */
  customMode: boolean;
  /** 纯伴奏 */
  instrumental: boolean;
  mv: SunoMv | string;
  /** 自定义模式=歌词；灵感模式=描述 */
  prompt?: string;
  /** 风格/曲风 */
  tags?: string;
  title?: string;
}

/** 续写参数 */
export interface SunoExtendParams {
  /** 要续写的源音轨 clip_id */
  continueClipId: string;
  /** 从第几秒续写 */
  continueAt?: number | null;
  mv: SunoMv | string;
  prompt?: string;
  tags?: string;
  title?: string;
}

/** 翻唱/参考参数：基于已有 clip_id 做参考生成（若是本地音频，需先 uploadSunoAudio 拿到 clip_id） */
export interface SunoReferenceParams {
  referenceClipId: string;
  mv: SunoMv | string;
  prompt?: string;
  tags?: string;
  title?: string;
  instrumental?: boolean;
}

function withOptional(base: Record<string, any>, optional: Record<string, any>): Record<string, any> {
  const out = { ...base };
  for (const [k, v] of Object.entries(optional)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

/** 构造 /suno/generate 生成请求体 */
export function buildSunoGenerateBody(params: SunoGenerateParams): Record<string, any> {
  const base: Record<string, any> = { mv: params.mv || SUNO_DEFAULT_MV };
  if (params.instrumental) base.make_instrumental = true;
  if (params.customMode) {
    return withOptional(base, { prompt: params.prompt, tags: params.tags, title: params.title });
  }
  // 灵感模式：描述放 gpt_description_prompt，AI 自动写词
  return withOptional(base, { gpt_description_prompt: params.prompt, tags: params.tags, title: params.title });
}

/** 构造 /suno/generate 续写请求体 */
export function buildSunoExtendBody(params: SunoExtendParams): Record<string, any> {
  const base: Record<string, any> = { mv: params.mv || SUNO_DEFAULT_MV, continue_clip_id: params.continueClipId };
  return withOptional(base, {
    continue_at: params.continueAt != null ? Number(params.continueAt) : undefined,
    prompt: params.prompt,
    tags: params.tags,
    title: params.title,
  });
}

/** 构造 /suno/generate 翻唱/参考请求体 */
export function buildSunoReferenceBody(params: SunoReferenceParams): Record<string, any> {
  const base: Record<string, any> = { mv: params.mv || SUNO_DEFAULT_MV, reference_clip_id: params.referenceClipId };
  if (params.instrumental) base.make_instrumental = true;
  return withOptional(base, { prompt: params.prompt, tags: params.tags, title: params.title });
}

/** 校验：灵感/自定义都需要描述或歌词(prompt)；纯伴奏灵感模式可留空 */
export function validateSunoGenerateParams(params: SunoGenerateParams): string | null {
  if (!params.prompt || !String(params.prompt).trim()) {
    if (params.instrumental && !params.customMode) return null; // 纯伴奏灵感可无描述
    return params.customMode ? "自定义模式需填写歌词(prompt)" : "灵感模式需填写歌曲描述";
  }
  return null;
}

/** 一条生成音轨（clip） */
export interface SunoClip {
  id: string;
  audioUrl: string;
  videoUrl?: string;
  imageUrl?: string;
  title?: string;
  tags?: string;
  prompt?: string;
  status?: string;
  duration?: number;
}

const SUNO_STATUS_COMPLETE = new Set(["complete", "succeeded", "success"]);
const SUNO_STATUS_ERROR = new Set(["error", "failed"]);

export function sunoClipIsComplete(status: string): boolean {
  return SUNO_STATUS_COMPLETE.has(String(status || "").toLowerCase());
}
export function sunoClipIsError(status: string): boolean {
  return SUNO_STATUS_ERROR.has(String(status || "").toLowerCase());
}

/** 从任意响应里取 clip 数组（兼容 数组 / {clips} / {data} / {clips_url}） */
function coerceClipArray(resp: any): any[] {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.clips)) return resp.clips;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.data?.clips)) return resp.data.clips;
  if (resp && typeof resp === "object" && (resp.id || resp.audio_url)) return [resp];
  return [];
}

/** 从 /suno/generate 提交响应里取 clip id 列表（用于随后轮询 feed） */
export function extractSunoClipIds(submitResponse: any): string[] {
  return coerceClipArray(submitResponse)
    .map((c: any) => String(c?.id ?? c?.clip_id ?? c?.song_id ?? ""))
    .filter(Boolean);
}

/** 从 /suno/feed 响应里提取标准化音轨 */
export function extractSunoClips(feedResponse: any): SunoClip[] {
  return coerceClipArray(feedResponse)
    .map((c: any) => ({
      id: String(c?.id ?? c?.clip_id ?? ""),
      audioUrl: String(c?.audio_url ?? c?.audioUrl ?? c?.source_audio_url ?? ""),
      videoUrl: c?.video_url ?? c?.videoUrl ?? undefined,
      imageUrl: c?.image_url ?? c?.image_large_url ?? undefined,
      title: c?.title ?? c?.metadata?.title ?? undefined,
      tags: c?.tags ?? c?.metadata?.tags ?? undefined,
      prompt: c?.prompt ?? c?.metadata?.prompt ?? undefined,
      status: c?.status ? String(c.status).toLowerCase() : undefined,
      duration: c?.metadata?.duration != null ? Number(c.metadata.duration) : c?.duration != null ? Number(c.duration) : undefined,
    }))
    .filter((c: SunoClip) => c.id || c.audioUrl);
}

/** 汇总一组 clip 的整体状态：全 complete→complete；有 error→error；否则 pending */
export function summarizeSunoFeed(clips: SunoClip[]): "complete" | "error" | "pending" {
  if (!clips.length) return "pending";
  if (clips.some((c) => sunoClipIsError(c.status || ""))) return "error";
  if (clips.every((c) => sunoClipIsComplete(c.status || "") && c.audioUrl)) return "complete";
  return "pending";
}

export function sunoUrl(baseUrl: string, path: string): string {
  const b = String(baseUrl || "").replace(/\/+$/, "");
  return `${b}${path}`;
}

type FetchLike = (url: string, init?: any) => Promise<any>;
function sunoHeaders(apiKey: string, json = true): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

/** 提交生成，返回 clip id 列表 */
export async function submitSunoGenerate(
  baseUrl: string, apiKey: string, body: Record<string, any>, fetchImpl: FetchLike = (globalThis as any).fetch,
): Promise<string[]> {
  const resp = await fetchImpl(sunoUrl(baseUrl, SUNO_ENDPOINTS.generate), {
    method: "POST", headers: sunoHeaders(apiKey, true), body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`Suno 提交失败: ${json?.message || json?.detail || resp.status}`);
  const ids = extractSunoClipIds(json);
  if (!ids.length) throw new Error(`Suno 提交未返回 clip id: ${JSON.stringify(json).slice(0, 200)}`);
  return ids;
}

/** 轮询 /suno/feed 直到 complete/error/超时 */
export async function pollSunoFeed(
  baseUrl: string, apiKey: string, clipIds: string[],
  opts: {
    fetchImpl?: FetchLike; intervalMs?: number; timeoutMs?: number;
    sleep?: (ms: number) => Promise<void>; now?: () => number;
    onTick?: (status: string, clips: SunoClip[]) => void; signal?: { aborted: boolean };
  } = {},
): Promise<{ status: string; clips: SunoClip[] }> {
  const fetchImpl = opts.fetchImpl || (globalThis as any).fetch;
  const intervalMs = opts.intervalMs ?? 5000;
  const timeoutMs = opts.timeoutMs ?? 300000;
  const now = opts.now || (() => Date.now());
  const sleep = opts.sleep || ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const start = now();
  const idsPath = clipIds.map(encodeURIComponent).join(",");
  for (;;) {
    if (opts.signal?.aborted) throw new Error("Suno 轮询已取消");
    const resp = await fetchImpl(`${sunoUrl(baseUrl, SUNO_ENDPOINTS.feed)}/${idsPath}`, { method: "GET", headers: sunoHeaders(apiKey, false) });
    const json = await resp.json().catch(() => ({}));
    const clips = extractSunoClips(json);
    const status = summarizeSunoFeed(clips);
    opts.onTick?.(status, clips);
    if (status === "complete") return { status, clips };
    if (status === "error") throw new Error(`Suno 生成失败：${clips.find((c) => sunoClipIsError(c.status || ""))?.id || ""}`);
    if (now() - start > timeoutMs) throw new Error(`Suno 生成超时，请稍后用 clip id 查询：${clipIds.join(",")}`);
    await sleep(intervalMs);
  }
}

/** 上传本地音频到 /suno/upload，返回 clip_id（用于翻唱参考） */
export async function uploadSunoAudio(
  baseUrl: string, apiKey: string, file: any, fetchImpl: FetchLike = (globalThis as any).fetch,
): Promise<{ clipId: string; duration?: number }> {
  const form = new FormData();
  form.append("file", file);
  const resp = await fetchImpl(sunoUrl(baseUrl, SUNO_ENDPOINTS.upload), {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form,
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`Suno 上传失败: ${json?.message || resp.status}`);
  const clipId = String(json?.clip_id ?? json?.id ?? json?.data?.clip_id ?? "");
  if (!clipId) throw new Error(`Suno 上传未返回 clip_id`);
  return { clipId, duration: json?.duration != null ? Number(json.duration) : undefined };
}
