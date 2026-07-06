/**
 * 协作与许可证域：多窗口通信、激活码校验、版本检查、设备 id。
 *
 * - WANJUAN_MULTIWINDOW_SECRET_SALT / wanjuanHashString：多窗口消息签名用盐与哈希。
 * - wanjuanVerifyActivationCode / wanjuanCheckForUpdate：向激活服务器校验激活码、检查新版本。
 * - wanjuanInstallCrossWindowNavigation：监听 postMessage 的 WANJUAN_NAVIGATE 做跨窗口视图切换。
 * - wanjuanGenerateUuid / wanjuanGetOrCreateDeviceId / WANJUAN_DEVICE_ID_STORAGE_KEY：设备 id 生成与持久化。
 * - wanjuanChildWindowRefs：子窗口引用列表（共享可变数组）。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */

export const WANJUAN_MULTIWINDOW_SECRET_SALT = `MUTIWINDOW_SECRET_SALT_2024`;
export const WANJUAN_ACTIVATION_SERVER_URL = ``;
export const wanjuanHashString = (str) => {
    let hash = 0;
    for (let index = 0; index < str.length; index++) {
      let charCode = str.charCodeAt(index);
      ((hash = (hash << 5) - hash + charCode), (hash &= hash));
    }
    return Math.abs(hash).toString(16);
  };
export const wanjuanVerifyActivationCode = async (code, deviceId) => {
      if (!WANJUAN_ACTIVATION_SERVER_URL) return {
        valid: !1,
        error: `连接服务器失败，请检查网络`
      };
      try {
        let result: any = await (
          await fetch(`${WANJUAN_ACTIVATION_SERVER_URL}/api/verify`, {
            method: `POST`,
            headers: {
              "Content-Type": `application/json`
            },
            body: JSON.stringify({
              code: code,
              deviceId: deviceId
            }),
          })
        ).json();
        return result.valid ?
          {
            valid: !0,
            type: result.tier,
            expiry: new Date(result.expiresAt).getTime()
          } :
          {
            valid: !1,
            error: result.error || `验证失败`
          };
      } catch (error) {
        return (
          console.error(`License verification failed:`, error), {
            valid: !1,
            error: `连接服务器失败，请检查网络`
          }
        );
      }
    };
export const wanjuanCheckForUpdate = async (currentVersion) => {
      try {
          if (!WANJUAN_ACTIVATION_SERVER_URL) return {
            hasUpdate: !1
          };
          let response: any = await fetch(`${WANJUAN_ACTIVATION_SERVER_URL}/api/version`).catch(() => null);
          if (!response || !response.ok) return {
            hasUpdate: !1
          };
          let contentType = response.headers.get(`content-type`);
          if (!contentType || !contentType.includes(`application/json`))
            throw TypeError(`Oops, we haven't got JSON!`);
          let data: any = await response.json();
          if (data.version && data.version !== currentVersion) {
            let currentParts = currentVersion.split(`.`).map(Number),
              latestParts = data.version.split(`.`).map(Number);
            for (let index = 0; index < Math.max(currentParts.length, latestParts.length); index++) {
              let currentPart = currentParts[index] || 0,
                latestPart = latestParts[index] || 0;
              if (latestPart > currentPart) return {
                hasUpdate: !0,
                ...data,
                downloadUrl: `https://lingjing.guancn.uk`
              };
              if (currentPart > latestPart) return {
                hasUpdate: !1
              };
            }
          }
          return {
            hasUpdate: !1
          };
        } catch (error) {
          return (console.error(`Check update failed:`, error), {
            hasUpdate: !1
          });
        }
      };
export const wanjuanInstallCrossWindowNavigation = (code, deviceId) => {
        try {
          if (!code) return {
            valid: !1,
            error: `Empty code`
          };
          let parts = atob(code).split(`|`),
            tier,
            expiryStr,
            signature,
            boundDeviceId;
          if (parts.length === 3)[tier, expiryStr, signature] = parts;
          else if (parts.length === 4)[tier, expiryStr, boundDeviceId, signature] = parts;
          else return {
            valid: !1,
            error: `Invalid format`
          };
          let expiry = parseInt(expiryStr);
          return isNaN(expiry) ?
            {
              valid: !1,
              error: `Invalid expiry`
            } :
            wanjuanHashString((boundDeviceId ? `${tier}|${expiryStr}|${boundDeviceId}` : `${tier}|${expiryStr}`) + WANJUAN_MULTIWINDOW_SECRET_SALT) === signature ?
            Date.now() > expiry ?
            {
              valid: !1,
              error: `Expired`,
              expiry: expiry
            } :
            boundDeviceId && deviceId && boundDeviceId !== deviceId ?
            {
              valid: !1,
              error: `Device mismatch`
            } :
            {
              valid: !0,
              type: tier,
              expiry: expiry,
              boundDeviceId: boundDeviceId
            } :
            {
              valid: !1,
              error: `Invalid signature`
            };
        } catch {
          return {
            valid: !1,
            error: `Parse error`
          };
        }
      };
export const WANJUAN_DEVICE_ID_STORAGE_KEY = `device_id_v1`;
export function wanjuanGenerateUuid() {
  return `10000000-1000-4000-8000-100000000000`.replace(/[018]/g, (e: any) =>
    (
      e ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (e / 4)))
    ).toString(16),
  );
}
export const wanjuanGetOrCreateDeviceId = () => {
    let storedId = localStorage.getItem(WANJUAN_DEVICE_ID_STORAGE_KEY);
    return (storedId || ((storedId = wanjuanGenerateUuid()), localStorage.setItem(WANJUAN_DEVICE_ID_STORAGE_KEY, storedId)), storedId);
  };
export const wanjuanChildWindowRefs = [];
