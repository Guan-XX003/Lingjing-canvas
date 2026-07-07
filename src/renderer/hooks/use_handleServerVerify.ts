// @ts-nocheck
/**
 * handleServerVerify。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { wanjuanInstallCrossWindowNavigation, wanjuanVerifyActivationCode } from "../lib/collaboration";
declare const chrome: any;

export function use_handleServerVerify(deps: any) {
  const {
    deviceId,
    isPluginEnv,
    membershipCode,
    setMembership,
    setMembershipCode,
    showToast2,
  } = deps;
  const handleServerVerify = async () => {
                try {
                  showToast2(`正在连接服务器验证...`);
                  let verifyResult = await wanjuanVerifyActivationCode(membershipCode, deviceId);
                  if (verifyResult.valid) {
                    let membership = {
                      type: verifyResult.type,
                      expiry: verifyResult.expiry,
                      code: membershipCode
                    };
                    (setMembership(membership),
                      setMembershipCode(``),
                      showToast2(
                        `激活成功！会员有效期至 ${new Date(verifyResult.expiry).toLocaleDateString()}`,
                      ),
                      isPluginEnv && chrome.storage.local.set({
                        membership: membership
                      }));
                    return;
                  } else if (verifyResult.error !== `连接服务器失败，请检查网络`) {
                    showToast2(`激活失败: ${verifyResult.error}`);
                    return;
                  }
                } catch (error) {
                  console.error(`Server verification error`, error);
                }
                let verifyResult = wanjuanInstallCrossWindowNavigation(membershipCode, deviceId);
                if (verifyResult.valid) {
                  let membership = {
                    type: verifyResult.type,
                    expiry: verifyResult.expiry,
                    code: membershipCode
                  };
                  (setMembership(membership),
                    setMembershipCode(``),
                    showToast2(
                      `激活成功（离线模式）！会员有效期至 ${new Date(verifyResult.expiry).toLocaleDateString()}`,
                    ),
                    isPluginEnv && chrome.storage.local.set({
                      membership: membership
                    }));
                } else showToast2(`激活失败: ${verifyResult.error}`);
              };
  return { handleServerVerify };
}
