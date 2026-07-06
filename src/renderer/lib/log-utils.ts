/**
 * 日志与网络错误工具。
 *
 * - serializeErrorPreview：把任意错误对象安全序列化为可入日志的截断文本。
 * - WanJuanIsTransientNetworkError：判断错误是否为可重试的瞬时网络错误。
 * - safeStringifyRequestForLog：请求体入日志前的安全序列化（略去 dataURL/base64 等大字段）。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */

export function serializeErrorPreview(errorPayload: any, maxLength = 1200) {
  let truncate = (text) =>
    typeof text == `string` && text.length > maxLength ?
    `${text.slice(0, maxLength)}...(truncated ${text.length} chars)` :
    text;
  try {
    if (typeof errorPayload == `string`) return truncate(errorPayload);
    let serialized = JSON.stringify(errorPayload);
    return typeof serialized == `string` ?
      truncate(serialized) :
      `[unserializable error payload]`;
  } catch (error) {
    try {
      let stringified = String(errorPayload);
      if (stringified && stringified !== `[object Object]`) return truncate(stringified);
    } catch {}
    let messageSuffix = error && error.message ? `: ${error.message}` : ``;
    return `[unserializable error payload${messageSuffix}]`;
  }
}

export function WanJuanIsTransientNetworkError(error: any) {
  let message = String(
      error?.message ||
      error?.reason ||
      error?.code ||
      error?.name ||
      error ||
      ``,
    ),
    code = String(error?.code || error?.cause?.code || ``),
    name = String(error?.name || ``),
    combined = `${name} ${code} ${message}`;
  return /socket hang up|ECONNRESET|ECONNABORTED|ETIMEDOUT|EPIPE|ENETUNREACH|EHOSTUNREACH|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|network error|failed to fetch|load failed|fetch failed|Proxy fetch request timeout|request timeout|timed out|timeout|超时/i.test(
    combined,
  );
}

export function safeStringifyRequestForLog(requestPayload: any, maxLength = 4000) {
  try {
    let serialized = JSON.stringify(
      requestPayload,
      (key, value) => {
        if (
          typeof value == `string` &&
          (key === `data` || key === `bodyBase64` || /^data:image\//i.test(value) || value.length > 1200)
        )
          return `[omitted ${value.length} chars]`;
        return value;
      },
      2,
    );
    return serialized.length > maxLength ? `${serialized.slice(0, maxLength)}...(truncated ${serialized.length} chars)` : serialized;
  } catch (error) {
    return `[unserializable request payload: ${error?.message || error}]`;
  }
}
