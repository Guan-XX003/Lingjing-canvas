/**
 * newapi 版 Suno 音乐接口层（经典 /suno/submit/music 格式，已对真实网关验证）。
 *
 * 端点（base 为你的 newapi 站点）：
 *  - 提交  POST {base}/suno/submit/music   → { code:"success", data:"<taskId>" }
 *  - 查询  GET  {base}/suno/fetch/{taskId}  → { data:{ status, progress, fail_reason, data:[clips] } }
 * 鉴权：Authorization: Bearer <apiKey>
 *
 * 提交返回单个 taskId，用 /suno/fetch 轮询 data.status 到 SUCCESS/FAILURE。
 * 每个任务通常出 2 首 clip（data.data[]，含 audio_url/status）。
 * 模型版本用 mv（chirp-*）。翻唱参考音频用 task:"upload_reference" + url（需公网 URL）。
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
  submit: "/suno/submit/music",
  fetch: "/suno/fetch",
} as const;

/** 生成参数 */
export interface SunoGenerateParams {
  /** true=自定义(prompt 当歌词 + tags + title)；false=灵感(gpt_description_prompt 描述，AI 写词) */
  customMode: boolean;
  /** 纯伴奏 */
  instrumental: boolean;
  mv: SunoMv | string;
  /** 自定义=歌词；灵感=描述 */
  prompt?: string;
  /** 风格/曲风 */
  tags?: string;
  title?: string;
}

/** 续写参数 */
export interface SunoExtendParams {
  /** 要续写的源 clip_id */
  continueClipId: string;
  /** 从第几秒续写 */
  continueAt?: number | null;
  mv: SunoMv | string;
  prompt?: string;
  tags?: string;
  title?: string;
}

/** 翻唱/参考参数：用公网音频 URL（task:upload_reference），或已有 clip_id（reference_clip_id） */
export interface SunoReferenceParams {
  /** 参考音频的公网 URL（本地文件此网关不支持上传） */
  referenceUrl?: string;
  /** 或 Suno 内已有的 clip_id */
  referenceClipId?: string;
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

/** 构造 /suno/submit/music 生成请求体 */
export function buildSunoGenerateBody(params: SunoGenerateParams): Record<string, any> {
  const base: Record<string, any> = { mv: params.mv || SUNO_DEFAULT_MV };
  if (params.instrumental) base.make_instrumental = true;
  if (params.customMode) return withOptional(base, { prompt: params.prompt, tags: params.tags, title: params.title });
  return withOptional(base, { gpt_description_prompt: params.prompt, tags: params.tags, title: params.title });
}

/** 构造续写请求体 */
export function buildSunoExtendBody(params: SunoExtendParams): Record<string, any> {
  const base: Record<string, any> = { mv: params.mv || SUNO_DEFAULT_MV, continue_clip_id: params.continueClipId };
  return withOptional(base, {
    continue_at: params.continueAt != null ? Number(params.continueAt) : undefined,
    prompt: params.prompt, tags: params.tags, title: params.title,
  });
}

/** 构造翻唱/参考请求体：有 clip_id 用 reference_clip_id，否则用 task:upload_reference + url */
export function buildSunoReferenceBody(params: SunoReferenceParams): Record<string, any> {
  const base: Record<string, any> = { mv: params.mv || SUNO_DEFAULT_MV };
  if (params.instrumental) base.make_instrumental = true;
  if (params.referenceClipId && params.referenceClipId.trim()) {
    base.reference_clip_id = params.referenceClipId.trim();
  } else {
    base.task = "upload_reference";
    base.url = params.referenceUrl;
  }
  return withOptional(base, { prompt: params.prompt, tags: params.tags, title: params.title });
}

/** 校验：灵感/自定义都需 prompt；纯伴奏灵感可空 */
export function validateSunoGenerateParams(params: SunoGenerateParams): string | null {
  if (!params.prompt || !String(params.prompt).trim()) {
    if (params.instrumental && !params.customMode) return null;
    return params.customMode ? "自定义模式需填写歌词(prompt)" : "灵感模式需填写歌曲描述";
  }
  return null;
}

/** 一条生成音轨 */
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
  modelName?: string;
}

/** 任务级状态（/suno/fetch 的 data.status） */
export function sunoTaskIsSuccess(status: string): boolean {
  return String(status || "").toUpperCase() === "SUCCESS";
}
export function sunoTaskIsFailure(status: string): boolean {
  return ["FAILURE", "FAILED", "ERROR"].includes(String(status || "").toUpperCase());
}

/** 从 /suno/fetch 响应取任务状态 */
export function extractSunoTaskStatus(fetchResponse: any): string {
  return String(fetchResponse?.data?.status ?? fetchResponse?.status ?? "").toUpperCase();
}
/** 从 /suno/fetch 响应取失败原因 */
export function extractSunoFailReason(fetchResponse: any): string {
  return String(fetchResponse?.data?.fail_reason ?? fetchResponse?.fail_reason ?? "").trim();
}

/** 从 /suno/fetch 响应取 clips（data.data[]） */
export function extractSunoClips(fetchResponse: any): SunoClip[] {
  const list = fetchResponse?.data?.data ?? fetchResponse?.data?.clips ?? fetchResponse?.clips ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((c: any) => ({
      id: String(c?.id ?? c?.clip_id ?? ""),
      audioUrl: String(c?.audio_url ?? c?.audioUrl ?? ""),
      videoUrl: c?.video_url ?? undefined,
      imageUrl: c?.image_url ?? c?.image_large_url ?? c?.avatar_image_url ?? undefined,
      title: c?.title ?? undefined,
      tags: c?.tags ?? undefined,
      prompt: c?.prompt ?? c?.gpt_description_prompt ?? undefined,
      status: c?.status ? String(c.status).toLowerCase() : undefined,
      duration: c?.duration != null ? Number(c.duration) : c?.metadata?.duration != null ? Number(c.metadata.duration) : undefined,
      modelName: c?.model_name ?? c?.mv ?? undefined,
    }))
    .filter((c: SunoClip) => c.id || c.audioUrl);
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

/** 提交 /suno/submit/music，返回 taskId */
export async function submitSunoMusic(
  baseUrl: string, apiKey: string, body: Record<string, any>, fetchImpl: FetchLike = (globalThis as any).fetch,
): Promise<string> {
  const resp = await fetchImpl(sunoUrl(baseUrl, SUNO_ENDPOINTS.submit), {
    method: "POST", headers: sunoHeaders(apiKey, true), body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  const taskId = typeof json?.data === "string" ? json.data : json?.data?.task_id || json?.task_id || json?.data?.id;
  if (!resp.ok || !taskId) {
    throw new Error(`Suno 提交失败: ${json?.message || json?.error?.message || resp.status}`);
  }
  return String(taskId);
}

/** 轮询 /suno/fetch/{taskId} 直到 SUCCESS/FAILURE/超时 */
export async function pollSunoTask(
  baseUrl: string, apiKey: string, taskId: string,
  opts: {
    fetchImpl?: FetchLike; intervalMs?: number; timeoutMs?: number;
    sleep?: (ms: number) => Promise<void>; now?: () => number;
    onTick?: (status: string, progress: string, clips: SunoClip[]) => void; signal?: { aborted: boolean };
  } = {},
): Promise<{ status: string; clips: SunoClip[] }> {
  const fetchImpl = opts.fetchImpl || (globalThis as any).fetch;
  const intervalMs = opts.intervalMs ?? 5000;
  const timeoutMs = opts.timeoutMs ?? 300000;
  const now = opts.now || (() => Date.now());
  const sleep = opts.sleep || ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const start = now();
  for (;;) {
    if (opts.signal?.aborted) throw new Error("Suno 轮询已取消");
    const resp = await fetchImpl(`${sunoUrl(baseUrl, SUNO_ENDPOINTS.fetch)}/${encodeURIComponent(taskId)}`, { method: "GET", headers: sunoHeaders(apiKey, false) });
    const json = await resp.json().catch(() => ({}));
    const status = extractSunoTaskStatus(json);
    const clips = extractSunoClips(json);
    opts.onTick?.(status, String(json?.data?.progress ?? ""), clips);
    if (sunoTaskIsSuccess(status)) return { status, clips };
    if (sunoTaskIsFailure(status)) throw new Error(`Suno 生成失败：${extractSunoFailReason(json) || status}`);
    if (now() - start > timeoutMs) throw new Error(`Suno 生成超时，请稍后用任务ID查询：${taskId}`);
    await sleep(intervalMs);
  }
}
