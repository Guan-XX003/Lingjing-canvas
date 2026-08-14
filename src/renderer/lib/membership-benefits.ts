export const WANJUAN_MEMBERSHIP_CONTACT_QQ = "3379084564";

export const WANJUAN_MEMBERSHIP_BENEFITS = [
  {
    title: "企业模型统一管理",
    description: "企业管理员配置模型后，可统一管理所有成员的模型与使用量。",
  },
  {
    title: "云端提示词库",
    description: "不受局域网限制，保存、管理和分享提示词资产。",
  },
  {
    title: "极鑫模型 85 折",
    description: "会员调用极鑫中转站模型享受 85 折。",
  },
] as const;

export async function copyMembershipContactQQ({
  clipboard,
  notify,
}: {
  clipboard?: Pick<Clipboard, "writeText"> | null;
  notify: (message: string) => void;
}) {
  try {
    if (!clipboard?.writeText) throw new Error("Clipboard unavailable");
    await clipboard.writeText(WANJUAN_MEMBERSHIP_CONTACT_QQ);
    notify("QQ 已复制");
    return true;
  } catch {
    notify("复制失败，请手动复制 QQ");
    return false;
  }
}
