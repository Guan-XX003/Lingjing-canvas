import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Trash2, Users } from "lucide-react";
import {
  loadEnterpriseManagement,
  removeEnterpriseManagedMember,
  updateEnterpriseDefaultQuota,
  updateEnterpriseManagedMember,
  updateEnterpriseManagedMemberQuota,
} from "../lib/account";

const capabilities = [
  ["text_generation", "文本生成", "successful_requests"],
  ["image_generation", "图片生成", "successful_outputs"],
  ["video_generation", "视频生成", "successful_tasks"],
  ["jimeng_generation", "即梦生成", "successful_tasks"],
  ["audio_generation", "音频生成", "successful_tasks"],
  ["music_generation", "音乐生成", "successful_tasks"],
] as const;

export function EnterpriseManagementPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [selectedMember, setSelectedMember] = useState("");
  const [memberCapability, setMemberCapability] = useState("video_generation");
  const [memberMode, setMemberMode] = useState("inherit");
  const [memberLimit, setMemberLimit] = useState("10");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await loadEnterpriseManagement();
      if (!result?.ok) throw new Error(result?.error || "企业管理数据读取失败");
      setData(result);
      setLimits(Object.fromEntries(capabilities.map(([key]) => {
        const item = result.quotaDefaults?.find((quota: any) => String(quota.capability_key || quota.capabilityKey) === key);
        const value = item?.limit_value ?? item?.limitValue;
        return [key, value == null ? "" : String(value)];
      })));
      setSelectedMember((current) => current || result.members?.find((item: any) => item.role !== "owner")?.user_id || "");
    } catch (reason) {
      setError(String((reason as Error)?.message || reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const editableMembers = useMemo(() => (data?.members || []).filter((item: any) => item.role !== "owner"), [data]);

  useEffect(() => {
    if (!editableMembers.some((item: any) => String(item.user_id || item.userId) === selectedMember)) {
      setSelectedMember(String(editableMembers[0]?.user_id || editableMembers[0]?.userId || ""));
    }
  }, [editableMembers, selectedMember]);

  useEffect(() => {
    const override = (data?.memberQuotaOverrides || []).find((item: any) =>
      String(item.user_id || item.userId) === selectedMember &&
      String(item.capability_key || item.capabilityKey) === memberCapability);
    setMemberMode(String(override?.mode || "inherit"));
    setMemberLimit(String(override?.limit_value ?? override?.limitValue ?? 10));
  }, [data, selectedMember, memberCapability]);

  const mutate = async (action: () => Promise<any>) => {
    setLoading(true);
    setError("");
    try {
      const result = await action();
      if (!result?.ok) throw new Error(result?.error || "企业设置保存失败");
      setData(result);
      return result;
    } catch (reason) {
      setError(String((reason as Error)?.message || reason));
      return null;
    } finally {
      setLoading(false);
    }
  };

  if (!data && loading) return <div className="wanjuan-enterprise-management-loading">正在读取企业成员与配额…</div>;
  if (!data) return <div className="wanjuan-account-form-error">{error || "企业管理数据暂不可用"}</div>;

  return (
    <div className="wanjuan-enterprise-management">
      <div className="wanjuan-enterprise-management-heading">
        <div><Users size={16} /><span><strong>成员与配额</strong><small>{data.members.length} 名成员 · {data.activeTasks || 0} 个活动任务</small></span></div>
        <button type="button" className="wanjuan-account-outline-button" disabled={loading} onClick={refresh}><RefreshCw size={14} className={loading ? "is-spinning" : ""} />刷新</button>
      </div>
      {error && <div className="wanjuan-account-form-error">{error}</div>}

      <div className="wanjuan-enterprise-member-table">
        <div className="is-header"><span>成员</span><span>角色</span><span>状态</span><span>操作</span></div>
        {data.members.map((member: any) => {
          const userId = String(member.user_id || member.userId || "");
          const role = String(member.role || "member");
          const status = String(member.status || "active");
          const protectedMember = role === "owner" || (data.requesterRole === "admin" && role === "admin");
          return (
            <div key={userId}>
              <span><strong>{member.display_name || member.email || userId}</strong><small>{member.email || userId}</small></span>
              <select disabled={protectedMember || loading} value={role} onChange={(event) => mutate(() => updateEnterpriseManagedMember({ userId, role: event.target.value }))}>
                {role === "owner" && <option value="owner">所有者</option>}
                {(data.requesterRole === "owner" || role === "admin") && <option value="admin">管理员</option>}<option value="member">成员</option>
              </select>
              <button type="button" className={status === "active" ? "is-active" : "is-disabled"} disabled={protectedMember || loading} onClick={() => mutate(() => updateEnterpriseManagedMember({ userId, status: status === "active" ? "disabled" : "active" }))}>{status === "active" ? "正常" : "已禁用"}</button>
              <button type="button" className="wanjuan-enterprise-icon-button" title="移除成员" disabled={protectedMember || loading} onClick={() => window.confirm("移除后该成员的企业会话会被撤销，确定继续吗？") && mutate(() => removeEnterpriseManagedMember(userId))}><Trash2 size={14} /></button>
            </div>
          );
        })}
      </div>

      {data.quotaReadableFromHost ? (
        <>
          <div className="wanjuan-enterprise-subheading"><strong>默认每日配额</strong><span>空白表示不限，只有成功任务计数</span></div>
          <div className="wanjuan-enterprise-default-quota-table">
            {capabilities.map(([key, label, unit]) => (
              <div key={key}>
                <span>{label}</span>
                <input type="number" min="0" placeholder="不限" value={limits[key] ?? ""} onChange={(event) => setLimits((current) => ({ ...current, [key]: event.target.value }))} />
                <button type="button" title="保存配额" disabled={loading} onClick={() => mutate(() => updateEnterpriseDefaultQuota({ capabilityKey: key, enabled: true, limitValue: limits[key] === "" ? null : Number(limits[key]), unit }))}><Save size={14} /></button>
              </div>
            ))}
          </div>

          {editableMembers.length > 0 && (
            <div className="wanjuan-enterprise-member-quota-editor">
              <div className="wanjuan-enterprise-subheading"><strong>成员配额覆盖</strong><span>可继承默认值、单独限额、允许或暂停</span></div>
              <div>
                <select value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)}>{editableMembers.map((member: any) => <option key={member.user_id} value={member.user_id}>{member.display_name || member.email || member.user_id}</option>)}</select>
                <select value={memberCapability} onChange={(event) => setMemberCapability(event.target.value)}>{capabilities.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                <select value={memberMode} onChange={(event) => setMemberMode(event.target.value)}><option value="inherit">继承默认</option><option value="limit">单独上限</option><option value="allow">不限</option><option value="deny">暂停</option></select>
                <input type="number" min="0" disabled={memberMode !== "limit"} value={memberLimit} onChange={(event) => setMemberLimit(event.target.value)} />
                <button type="button" className="wanjuan-account-primary-inline" disabled={loading || !selectedMember} onClick={() => mutate(() => updateEnterpriseManagedMemberQuota({ userId: selectedMember, capabilityKey: memberCapability, mode: memberMode, limitValue: memberMode === "limit" ? Number(memberLimit || 0) : null }))}><Save size={14} />保存</button>
              </div>
            </div>
          )}
        </>
      ) : <div className="wanjuan-account-band-note">配额策略需要在创建者网关电脑上查看和编辑。</div>}
    </div>
  );
}
