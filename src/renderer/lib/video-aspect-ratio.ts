// 视频尺寸与画幅比例归一化工具。
// 从前端 bundle (index-Bsv1kDi5.js 行 3518-3536) 反混淆而来，行为保持不变。

/**
 * 把任意尺寸字符串归一化为 "宽x高" 形式（如 "1280x720"）。
 * 解析失败时回退到 "1280x720"。
 */
export function normalizeVideoSizeValue(input: any): string {
  const match = String(input || "").trim().match(/(\d{2,5})\s*[xX]\s*(\d{2,5})/);
  return match ? `${match[1]}x${match[2]}` : "1280x720";
}

/**
 * 把任意画幅描述归一化为最简比例字符串（如 "16:9"）。
 * - 若输入本身是 "a:b" 形式，直接规整返回；
 * - 否则尝试从 fallback 尺寸（默认 "1280x720"）推导；
 * - 都失败则返回 "16:9"。
 */
/** 上游 API 支持的固定画幅白名单。 */
export const SUPPORTED_VIDEO_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];

/**
 * 把任意比例就近吸附到白名单值（按对数距离比较，如 "2.35:1" → "21:9"）。
 * 已在白名单内的原样返回；解析失败回退白名单首项。
 */
export function snapVideoAspectRatioToSupported(
  ratio: string,
  supported: string[] = SUPPORTED_VIDEO_ASPECT_RATIOS,
): string {
  const parseRatioValue = (value: string): number => {
    const match = String(value || "").trim().match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
    if (!match) return NaN;
    const width = Number(match[1]);
    const height = Number(match[2]);
    return width > 0 && height > 0 ? width / height : NaN;
  };
  const normalized = String(ratio || "").trim();
  const fallback = supported[0] || "16:9";
  if (supported.includes(normalized)) return normalized;
  const target = parseRatioValue(normalized);
  if (!isFinite(target)) return fallback;
  let best = fallback;
  let bestDistance = Infinity;
  for (const candidate of supported) {
    const value = parseRatioValue(candidate);
    if (!isFinite(value)) continue;
    const distance = Math.abs(Math.log(value / target));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

export function normalizeVideoAspectRatioValue(input: any, fallbackSize = "1280x720"): string {
  const rawRatio = String(input || "").trim();
  let parsed = rawRatio.match(/^(\d+(?:\.\d+)?)\s*[:xX\/]\s*(\d+(?:\.\d+)?)$/);
  if (parsed && rawRatio.includes(":")) return `${parsed[1]}:${parsed[2]}`;
  if (!parsed) parsed = String(fallbackSize || "").trim().match(/^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)$/);
  if (!parsed) return "16:9";
  const width = Number(parsed[1]);
  const height = Number(parsed[2]);
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) return "16:9";
  // 欧几里得求最大公约数，约分为最简比例。
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width * 100), Math.round(height * 100));
  return `${Math.round(width * 100) / divisor}:${Math.round(height * 100) / divisor}`;
}
