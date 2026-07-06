/**
 * 应用内通知（公告/提醒）模块。
 *
 * 从管理后台拉取已发布的应用通知，按平台与最低版本过滤，
 * 并在 localStorage 维护缓存、已忽略与本会话已弹过 toast 的通知 id。
 * 拉取走桌面端 proxyFetch（带直连回退与备用地址）。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */

/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */
declare const chrome: any;

export const WANJUAN_APP_NOTIFICATION_API_URL = `https://wanjuan-admin.guancn.uk/items/app_notifications?filter[status][_eq]=published&sort=-sort,-date_created&fields=id,title,content,level,display_type,platforms,min_version,start_at,end_at,link_url,date_created,date_updated`;
export const WANJUAN_APP_NOTIFICATION_API_FALLBACK_URL = `https://wanjuan-admin.guancn.uk/items/app_notifications?filter[status][_eq]=published&sort=-sort,-date_created&fields=id,title,content,level,display_type,platforms,min_version,start_at,end_at,link_url,date_created`;
export const WANJUAN_APP_NOTIFICATION_CACHE_KEY = `wanjuan.appNotifications.cache.v1`;
export const WANJUAN_APP_NOTIFICATION_DISMISSED_KEY = `wanjuan.appNotifications.dismissed.v1`;
export const WANJUAN_APP_NOTIFICATION_SESSION_TOAST_KEY = `wanjuan.appNotifications.sessionToast.v1`;
export const WANJUAN_APP_NOTIFICATION_PLATFORM = `macos`;

export function WanJuanDecodeBase64Utf8(base64: any) {
  try {
    let binaryString = atob(String(base64 || ``)),
      bytes = new Uint8Array(binaryString.length);
    for (let index = 0; index < binaryString.length; index++) bytes[index] = binaryString.charCodeAt(index);
    return new TextDecoder().decode(bytes);
  } catch {
    return ``;
  }
}

export function WanJuanCompareVersions(left: any, right: any) {
  let normalize = (value) =>
    String(value || ``)
    .replace(/^v/i, ``)
    .split(/[.-]/)
    .map((part) => parseInt(part, 10))
    .map((part) => Number.isFinite(part) ? part : 0);
  let leftParts = normalize(left),
    rightParts = normalize(right),
    length = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < length; index++) {
    let leftPart = leftParts[index] || 0,
      rightPart = rightParts[index] || 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}

export function WanJuanGetAppVersion() {
  try {
    return chrome?.runtime?.getManifest?.()?.version || `1.3.6`;
  } catch {
    return `1.3.6`;
  }
}

export function WanJuanNormalizeNotificationPlatforms(value: any) {
  if (Array.isArray(value)) return value.map((item) => String(item || ``).trim().toLowerCase()).filter(Boolean);
  if (typeof value == `string`) {
    try {
      let parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return WanJuanNormalizeNotificationPlatforms(parsed);
    } catch {}
    return value.split(/[,，\s]+/).map((item) => item.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

export function WanJuanNormalizeAppNotifications(payload: any) {
  let items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return items
    .map((item) => ({
      id: String(item?.id || ``).trim(),
      title: String(item?.title || ``).trim(),
      content: String(item?.content || ``).trim(),
      level: [`info`, `warning`, `success`, `danger`].includes(String(item?.level || ``).trim()) ? String(item?.level || ``).trim() : `info`,
      display_type: [`banner`, `dialog`, `toast`, `page`].includes(String(item?.display_type || ``).trim()) ? String(item?.display_type || ``).trim() : `page`,
      platforms: WanJuanNormalizeNotificationPlatforms(item?.platforms),
      min_version: String(item?.min_version || ``).trim(),
      start_at: item?.start_at || ``,
      end_at: item?.end_at || ``,
      link_url: String(item?.link_url || ``).trim(),
      date_created: item?.date_created || ``,
      date_updated: item?.date_updated || ``,
    }))
    .filter((item) => item.id && (item.title || item.content));
}

export function WanJuanFilterAppNotifications(items: any, {
  version = WanJuanGetAppVersion(),
  platform = WANJUAN_APP_NOTIFICATION_PLATFORM,
  now = Date.now(),
} = {}) {
  let platformAliases = new Set([`all`, platform, `mac`, `darwin`, `desktop`, `electron`, `macos`]);
  return WanJuanNormalizeAppNotifications(items).filter((item) => {
    let platforms = item.platforms.length ? item.platforms : [`all`];
    if (!platforms.some((platformName) => platformAliases.has(platformName))) return !1;
    if (item.min_version && WanJuanCompareVersions(version, item.min_version) < 0) return !1;
    let startAt = item.start_at ? Date.parse(item.start_at) : 0,
      endAt = item.end_at ? Date.parse(item.end_at) : 0;
    if (Number.isFinite(startAt) && startAt > 0 && now < startAt) return !1;
    if (Number.isFinite(endAt) && endAt > 0 && now > endAt) return !1;
    return !0;
  });
}

export function WanJuanLoadCachedAppNotifications() {
  try {
    let cached = JSON.parse(localStorage.getItem(WANJUAN_APP_NOTIFICATION_CACHE_KEY) || `null`);
    return WanJuanFilterAppNotifications(cached?.items || []);
  } catch {
    return [];
  }
}

export function WanJuanSaveCachedAppNotifications(items: any) {
  try {
    localStorage.setItem(WANJUAN_APP_NOTIFICATION_CACHE_KEY, JSON.stringify({
      fetchedAt: Date.now(),
      items: WanJuanNormalizeAppNotifications(items),
    }));
  } catch {}
}

export function WanJuanLoadDismissedAppNotificationIds() {
  try {
    let value = JSON.parse(localStorage.getItem(WANJUAN_APP_NOTIFICATION_DISMISSED_KEY) || `[]`);
    return Array.isArray(value) ? value.map((item) => String(item || ``)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function WanJuanSaveDismissedAppNotificationIds(ids: any) {
  try {
    localStorage.setItem(WANJUAN_APP_NOTIFICATION_DISMISSED_KEY, JSON.stringify(Array.from(new Set(ids)).filter(Boolean)));
  } catch {}
}

export function WanJuanLoadSessionToastAppNotificationIds() {
  try {
    let value = JSON.parse(sessionStorage.getItem(WANJUAN_APP_NOTIFICATION_SESSION_TOAST_KEY) || `[]`);
    return Array.isArray(value) ? value.map((item) => String(item || ``)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function WanJuanSaveSessionToastAppNotificationIds(ids: any) {
  try {
    sessionStorage.setItem(WANJUAN_APP_NOTIFICATION_SESSION_TOAST_KEY, JSON.stringify(Array.from(new Set(ids)).filter(Boolean)));
  } catch {}
}

export async function WanJuanFetchAppNotificationJson(url: any) {
  let directError = null;
  try {
    let controller = typeof AbortController == `function` ? new AbortController() : null,
      timeoutId = controller ? setTimeout(() => controller.abort(), 12e3) : 0,
      response = await fetch(url, {
        method: `GET`,
        headers: {
          Accept: `application/json`,
        },
        signal: controller?.signal,
      });
    timeoutId && clearTimeout(timeoutId);
    if (!response.ok) throw Error(`通知接口返回 ${response.status}`);
    return await response.json();
  } catch (error) {
    directError = error;
  }
  if (window.wanjuanDesktop?.proxyFetch) {
    let proxyResponse = await window.wanjuanDesktop.proxyFetch({
      requestId: `app-notifications-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url: url,
      method: `GET`,
      headers: {
        Accept: `application/json`,
      },
      requestTimeout: 18e4,
    });
    if (!proxyResponse?.ok) throw Error(proxyResponse?.error || directError?.message || `通知接口请求失败`);
    if (proxyResponse.status < 200 || proxyResponse.status >= 300)
      throw Error(`通知接口返回 ${proxyResponse.status}`);
    return JSON.parse(WanJuanDecodeBase64Utf8(proxyResponse.bodyBase64) || `{}`);
  }
  throw directError || Error(`通知接口请求失败`);
}

export async function WanJuanFetchAppNotifications() {
  try {
    return WanJuanNormalizeAppNotifications(await WanJuanFetchAppNotificationJson(WANJUAN_APP_NOTIFICATION_API_URL));
  } catch (error) {
    let message = String(error?.message || error || ``);
    if (!/date_updated|403|forbidden|permission|权限/i.test(message)) throw error;
    return WanJuanNormalizeAppNotifications(await WanJuanFetchAppNotificationJson(WANJUAN_APP_NOTIFICATION_API_FALLBACK_URL));
  }
}

