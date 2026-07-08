/**
 * addAccount。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
declare const chrome: any;

interface UseAddAccountDeps {
  accountNameInput: any;
  cookieInput: any;
  currentLimits: any;
  currentPlatform: any;
  editingAccountId: any;
  isPluginEnv: boolean;
  saveUsers: any;
  setAccountNameInput: SetAny;
  setCookieInput: SetAny;
  setEditingAccountId: SetAny;
  setIsAccountBusy: SetAny;
  setIsAddingAccount: SetAny;
  users: any;
}

export function use_addAccount(deps: UseAddAccountDeps) {
  const {
    accountNameInput,
    cookieInput,
    currentLimits,
    currentPlatform,
    editingAccountId,
    isPluginEnv,
    saveUsers,
    setAccountNameInput,
    setCookieInput,
    setEditingAccountId,
    setIsAccountBusy,
    setIsAddingAccount,
    users,
  } = deps;
  const addAccount = async (shouldClear = false) => {
            if (false && users.length >= currentLimits.accounts) {
              alert(
                `当前${currentLimits.name}最多支持 ${currentLimits.accounts} 个账号，请升级会员解锁更多`,
              );
              return;
            }
            let nameInput = shouldClear ? `` : accountNameInput,
              cookieInput2 = shouldClear ? `` : cookieInput,
              editingId = shouldClear ? null : editingAccountId,
              accountName = nameInput.trim();
            (!accountName && currentPlatform && (accountName = currentPlatform.title), (accountName ||= `新建环境`), setIsAccountBusy(true));
            try {
              let cookies = [],
                siteName = `未知网站`,
                siteUrl = ``,
                avatarUrl = ``;
              if (cookieInput2.trim())
                try {
                  let manualCookies = [];
                  try {
                    let parsed = JSON.parse(cookieInput2);
                    manualCookies = Array.isArray(parsed) ? parsed : [parsed];
                  } catch {
                    cookieInput.includes(`=`) &&
                      (manualCookies = cookieInput
                        .split(`;`)
                        .map((line) => {
                          let [cookieName, ...valueParts] = line.trim().split(`=`),
                            cookieValue = valueParts.join(`=`);
                          return cookieName && cookieValue ?
                            {
                              name: cookieName.trim(),
                              value: cookieValue.trim(),
                              domain: new URL(siteUrl || `https://example.com`).hostname,
                              path: `/`,
                              secure: true,
                            } :
                            null;
                        })
                        .filter(Boolean));
                  }
                  if (manualCookies.length > 0)
                    ((cookies = manualCookies),
                      (siteName = `手动添加`),
                      (siteUrl ||= `https://example.com`),
                      (avatarUrl =
                        currentPlatform?.favIconUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${accountName}`));
                  else throw Error(`Invalid cookie format`);
                } catch {
                  (alert(
                      `Cookie 格式错误，请输入有效的 JSON 数组或 key=value; 格式字符串`,
                    ),
                    setIsAccountBusy(false));
                  return;
                }
              else if (isPluginEnv) {
                let [activeTab] = await chrome.tabs.query({
                  active: true,
                  currentWindow: true
                });
                activeTab?.url &&
                  ((siteUrl = activeTab.url),
                    (avatarUrl =
                      activeTab.favIconUrl ||
                      `https://www.google.com/s2/favicons?domain=${new URL(activeTab.url).hostname}&sz=64`),
                    (cookies = await chrome.cookies.getAll({
                      url: activeTab.url
                    })),
                    activeTab.title && (siteName = activeTab.title.substring(0, 5)));
              } else
                ((siteName = `开发测试网`),
                  (siteUrl = `http://localhost:3000`),
                  (avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=test`),
                  (cookies = [{
                    name: `test`,
                    value: `123`
                  }]));
              if (
                cookies.length === 0 &&
                !confirm(`当前页面未检测到 Cookie，且未手动输入，确定要保存吗？`)
              ) {
                setIsAccountBusy(false);
                return;
              }
              let cookieData = cookies.map((cookie) => ({
                  name: cookie.name,
                  value: cookie.value,
                  domain: cookie.domain,
                  path: cookie.path,
                  secure: cookie.secure,
                  httpOnly: cookie.httpOnly,
                  expirationDate: cookie.expirationDate,
                  sameSite: cookie.sameSite,
                  storeId: cookie.storeId,
                })),
                updatedUsers;
              if (editingId)
                updatedUsers = users.map((account) =>
                  account.id === editingId ?
                  {
                    ...account,
                    name: accountName,
                    cookies: cookieData,
                    avatar: avatarUrl || account.avatar,
                    siteName: account.siteName,
                    siteUrl: account.siteUrl,
                  } :
                  account,
                );
              else {
                let newAccount = {
                  id: Date.now().toString(),
                  name: accountName,
                  siteName: siteName,
                  siteUrl: siteUrl,
                  avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${accountName}`,
                  cookies: cookieData,
                };
                updatedUsers = [...users, newAccount];
              }
              (saveUsers(updatedUsers), setAccountNameInput(``), setCookieInput(``), setEditingAccountId(null), setIsAddingAccount(false));
            } catch (error) {
              (console.error(error), alert(`添加失败，请重试`));
            } finally {
              setIsAccountBusy(false);
            }
          };
  return { addAccount };
}
