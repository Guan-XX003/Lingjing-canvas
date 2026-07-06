/**
 * 模型 API 绑定解析工具。
 *
 * 用户可为不同模型（按归一化的模型 key）绑定不同的 API 配置与协议；
 * 这里提供 base 地址拼接、绑定 key 归一化、候选 key 生成、
 * 绑定 id / 协议解析、视频任务错误提取与 Seedance 清单解析。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { serializeErrorPreview } from "./log-utils";

export const buildApiUrl = (base, path) => {
  let normalizedBase = String(base || ``)
    .replace(/\s+/g, ``)
    .replace(/\/$/, ``),
    trimmedPath = String(path || ``).trim();
  return trimmedPath ?
    /^https?:\/\//i.test(trimmedPath) ?
    trimmedPath :
    `${normalizedBase}${trimmedPath.startsWith(`/`) ? `` : `/`}${trimmedPath}` :
    normalizedBase;
};

export function normalizeModelBindingKeyHelper(e: any) {
  return String(e || ``)
    .trim()
    .toLowerCase()
    .replace(/[._/]+/g, `-`)
    .replace(/\s+/g, `-`)
    .replace(/-+/g, `-`)
    .replace(/^-|-$/g, ``);
}

export function getModelBindingCandidatesHelper(modelKey: any) {
  let trimmedKey = String(modelKey || ``).trim();
  if (!trimmedKey) return [];
  let normalizedKey = normalizeModelBindingKeyHelper(trimmedKey),
    candidates = new Set([trimmedKey, normalizedKey]),
    aliasMap = {
      "grok-video-3-10s": [`grok-videos`],
      "grok-videos": [`grok-video-3-10s`],
      "veo3-1-fast-components": [`veo-3-1-fast`, `veo_3_1-fast`],
      "veo-3-1-fast": [`veo3-1-fast-components`, `veo_3_1-fast`],
      "veo_3_1-fast": [`veo3-1-fast-components`, `veo-3-1-fast`],
      "veo-3-1-fast-4k": [`veo_3_1-fast-4k`, `veo_3_1-fast-4K`],
      "veo_3_1-fast-4k": [`veo-3-1-fast-4k`, `veo_3_1-fast-4K`],
    },
    addCandidate = (key) => {
      let normalizedKey2 = normalizeModelBindingKeyHelper(key);
      if (!normalizedKey2 || candidates.has(normalizedKey2)) return;
      candidates.add(normalizedKey2), candidates.add(String(key).trim());
      let aliases = aliasMap[normalizedKey2];
      Array.isArray(aliases) && aliases.forEach(addCandidate);
    };
  return (addCandidate(trimmedKey), Array.from(candidates).filter(Boolean));
}

export function resolveModelApiBindingIdHelper(obj: any, modelKey: any, fallback: any) {
  if (!obj || typeof obj != `object`) return fallback;
  let candidates = getModelBindingCandidatesHelper(modelKey);
  for (let candidate of candidates)
    if (obj[candidate]) return obj[candidate];
  let candidateSet = new Set(candidates.map((candidate) => normalizeModelBindingKeyHelper(candidate)));
  for (let [key, value] of Object.entries(obj))
    if (candidateSet.has(normalizeModelBindingKeyHelper(key)) && value) return value;
  return fallback;
}

export function resolveModelProtocolBindingHelper(obj: any, modelKey: any, fallback = ``) {
  if (!obj || typeof obj != `object`) return fallback;
  let candidates = getModelBindingCandidatesHelper(modelKey);
  for (let candidate of candidates)
    if (obj[candidate]) return obj[candidate];
  let candidateSet = new Set(candidates.map((candidate) => normalizeModelBindingKeyHelper(candidate)));
  for (let [key, value] of Object.entries(obj))
    if (candidateSet.has(normalizeModelBindingKeyHelper(key)) && value) return value;
  return fallback;
}

export function extractVideoTaskErrorHelper(result: any, fallbackMessage = `视频生成失败`) {
  if (!result || typeof result != `object`) return fallbackMessage;
  let errorItem = Array.isArray(result.items) ?
    result.items.find((item) => item && typeof item == `object` && (item.error || item.message || item.status)) :
    null,
    error = errorItem?.error;
  let errorMessage = [
    typeof error == `string` ? error : ``,
    error?.message,
    error?.detail,
    error?.code,
    errorItem?.message,
    errorItem?.detail,
    result.error?.message,
    result.error?.detail,
    result.message,
    result.detail,
    result.base_resp?.status_msg,
    result.base_resp?.message,
    result.data?.error?.message,
    result.data?.message,
    result.data?.detail,
    result.result?.error?.message,
    result.result?.message,
    result.output?.error?.message,
    result.output?.message,
  ].find((candidate) => typeof candidate == `string` && candidate.trim());
  if (errorMessage) return errorMessage.trim();
  let error2 = [error, result.error, result.data?.error, result.result?.error, result.output?.error].find(
    (result2) => result2 && typeof result2 == `object`,
  );
  if (error2)
    try {
      return serializeErrorPreview(error2, 320);
    } catch {}
  return fallbackMessage;
}

export function parseSeedanceList(input: any) {
  return String(input || ``)
    .split(/[\s,，、]+/)
    .map((part) => part.trim())
    .filter((input2) => input2 !== ``);
}
