import { useState, useSyncExternalStore } from "react";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  Cloud,
  Crown,
  CreditCard,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogIn,
  LogOut,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Square,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  connectEnterpriseWorkspace,
  disconnectEnterpriseWorkspace,
  getAccountState,
  logoutAccount,
  openAccountAuth,
  publishEnterpriseConfig,
  refreshEnterpriseConfig,
  startEnterpriseGateway,
  stopEnterpriseGateway,
  subscribeAccount,
  releaseCreatedEnterpriseGateway,
} from "../lib/account";
import { buildEnterpriseConfigDraft } from "../lib/enterprise-config-snapshot";
import { EnterpriseGatewayCreateDialog } from "./enterprise-gateway-create-dialog";
import { EnterpriseManagementPanel } from "./enterprise-management-panel";
import { WanJuanMembershipBenefitsDialog } from "./membership-benefits-dialog";

const planLabels: Record<string, string> = {
  free: "本地免费版",
  pro: "专业版",
  team: "团队版",
  enterprise: "企业版",
};

const platformLabels: Record<string, string> = {
  darwin: "macOS",
  win32: "Windows",
  linux: "Linux",
  unknown: "旧客户端",
};

function AccountStatusPill({ account }: { account: ReturnType<typeof getAccountState> }) {
  if (account.authenticated && account.offline) return <span className="wanjuan-account-pill is-warning"><WifiOff size={13} />离线宽限</span>;
  if (account.authenticated) return <span className="wanjuan-account-pill is-success"><CheckCircle2 size={13} />已登录</span>;
  return <span className="wanjuan-account-pill"><UserRound size={13} />本地模式</span>;
}

export function WanJuanSettingsAccountTab({ showToast = () => {} }: { showToast?: (message: string) => void }) {
  const account = useSyncExternalStore(subscribeAccount, getAccountState, getAccountState);
  const [enterprisePanel, setEnterprisePanel] = useState<"connect" | "create" | "takeover" | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState(account.enterprise?.gatewayUrl || "");
  const [inviteCode, setInviteCode] = useState("");
  const [publishingConfig, setPublishingConfig] = useState(false);
  const [membershipBenefitsOpen, setMembershipBenefitsOpen] = useState(false);

  const connectEnterprise = async () => {
    const result = await connectEnterpriseWorkspace({
      gatewayUrl,
      inviteCode,
      deviceId: account.device?.id,
    });
    if (result.enterprise?.connected) setEnterprisePanel(null);
  };

  const publishCurrentConfig = async () => {
    setPublishingConfig(true);
    try {
      const draft = await buildEnterpriseConfigDraft({ version: Number(account.gatewayHost?.configVersion || 0) + 1 });
      await publishEnterpriseConfig({ snapshot: draft.snapshot, secrets: draft.secrets });
    } finally {
      setPublishingConfig(false);
    }
  };

  const isGatewayHost = account.enterprise?.mode === "host" && account.gatewayHost?.initialized;

  const releaseCurrentGateway = async () => {
    const confirmed = window.confirm("移除后，当前电脑会停止企业网关并删除本机企业密钥库。企业、成员和配额仍会保留，可在本机或另一台电脑重新接管。确定继续吗？");
    if (!confirmed) return;
    await releaseCreatedEnterpriseGateway({
      organizationId: account.enterprise?.organization?.id,
      gatewayId: account.enterprise?.gatewayId,
    });
  };

  return (
    <div className="wanjuan-account-settings-page wanjuan-settings-section">
      <section className="wanjuan-account-settings-hero">
        <div className="wanjuan-account-avatar"><UserRound size={25} /></div>
        <div className="min-w-0 flex-1">
          <div className="wanjuan-account-settings-title-row">
            <h2>{account.user?.name || account.user?.email || account.user?.phone || "我的账号"}</h2>
            <AccountStatusPill account={account} />
          </div>
          <p>
            {account.authenticated
              ? account.user?.email || account.user?.phone || `用户 ID：${account.user?.id || "--"}`
              : "当前使用本地模式。登录不会移动、覆盖或删除现有画布项目。"}
          </p>
        </div>
        {account.authenticated ? (
          <button type="button" className="wanjuan-account-outline-button" onClick={() => window.confirm("退出账号不会删除本地项目，确定继续吗？") && logoutAccount()}>
            <LogOut size={16} />退出登录
          </button>
        ) : (
          <button type="button" className="wanjuan-account-primary-inline" onClick={openAccountAuth}>
            <LogIn size={16} />登录 / 注册
          </button>
        )}
      </section>

      {!account.serviceConfigured && (
        <div className="wanjuan-account-inline-notice">
          <CircleAlert size={17} />
          <div><strong>账号服务暂时不可用</strong><span>本地画布、项目和自有 API 不受影响，请稍后重试。</span></div>
        </div>
      )}

      <section className="wanjuan-account-settings-band">
        <div className="wanjuan-account-band-heading with-action wanjuan-membership-band-heading">
          <div className="wanjuan-account-band-title">
            <CreditCard size={18} />
            <div><strong>会员状态</strong><span>查看当前账号的会员方案与有效状态</span></div>
          </div>
          <button type="button" className="wanjuan-account-outline-button wanjuan-membership-benefits-button" onClick={() => setMembershipBenefitsOpen(true)}>
            <Crown size={15} />会员权益
          </button>
        </div>
        <div className="wanjuan-account-metrics">
          <div><span>当前方案</span><strong>{planLabels[account.subscription?.plan || "free"] || account.subscription?.plan || "本地免费版"}</strong></div>
          <div><span>会员状态</span><strong>{account.subscription?.status === "active" ? "有效" : "未开通"}</strong></div>
        </div>
        <p className="wanjuan-account-band-note">企业空间的会员权益由企业管理员单独管理。</p>
      </section>

      <section className="wanjuan-account-settings-band">
        <div className="wanjuan-account-band-heading">
          <Laptop size={18} />
          <div><strong>设备与安全</strong><span>登录令牌由系统安全存储加密，不写入项目和导出包</span></div>
        </div>
        <div className="wanjuan-account-security-row">
          <div><ShieldCheck size={17} /><span>令牌加密存储</span></div>
          <strong className={account.secureStorageAvailable ? "is-ok" : "is-warning"}>{account.secureStorageMode === "system" ? "系统安全存储" : account.secureStorageMode === "local" ? "本机加密存储" : "不可用"}</strong>
        </div>
        <div className="wanjuan-account-security-row">
          <div><Cloud size={17} /><span>云端身份校验</span></div>
          <strong>{account.authenticated ? account.offline ? "暂时离线" : "已验证" : "未登录"}</strong>
        </div>
        {account.device?.id && (
          <div className="wanjuan-account-security-row">
            <div><Laptop size={17} /><span>当前设备</span></div>
            <strong>{account.device.name || "StarCanvas桌面端"} · {platformLabels[account.device.platform || "unknown"] || account.device.platform || "未知平台"}</strong>
          </div>
        )}
      </section>

      <section className="wanjuan-account-settings-band">
        <div className="wanjuan-account-band-heading with-action">
          <div className="wanjuan-account-band-title"><Building2 size={18} /><div><strong>企业与组织</strong><span>企业配置与个人统一 API 配置完全隔离</span></div></div>
          {!account.enterprise?.connected && (
            <div className="wanjuan-enterprise-heading-actions">
              {account.ownedEnterprise ? (
                <button type="button" className="wanjuan-account-primary-inline" disabled={!account.authenticated} onClick={() => setEnterprisePanel("takeover")}><RefreshCw size={16} />接管企业网关</button>
              ) : (
                <button type="button" className="wanjuan-account-primary-inline" disabled={!account.authenticated} onClick={() => setEnterprisePanel("create")}><Server size={16} />创建企业网关</button>
              )}
              <button type="button" className="wanjuan-account-outline-button" disabled={!account.authenticated} onClick={() => setEnterprisePanel((value) => value === "connect" ? null : "connect")}><KeyRound size={16} />连接企业网关</button>
            </div>
          )}
        </div>

        {account.enterprise?.connected ? (
          <>
            <div className="wanjuan-enterprise-connected">
              <div className={`wanjuan-enterprise-state-icon ${account.gatewayHost?.running || !isGatewayHost ? "" : "is-offline"}`}>{account.gatewayHost?.running || !isGatewayHost ? <Wifi size={20} /> : <WifiOff size={20} />}</div>
              <div className="min-w-0 flex-1">
                <strong>{account.enterprise.organization?.name || "企业私密空间"}</strong>
                <span>{isGatewayHost ? `${account.gatewayHost?.gatewayName || "本机网关"} · ${account.gatewayHost?.running ? "正在运行" : "已停止"}` : `${account.enterprise.organization?.role || "成员"} · 企业内网网关已绑定`}</span>
              </div>
              <span className={`wanjuan-account-pill ${account.gatewayHost?.running || !isGatewayHost ? "is-success" : "is-warning"}`}><LockKeyhole size={13} />密钥受保护</span>
              {!isGatewayHost && <button type="button" className="wanjuan-account-outline-button" disabled={account.busy} onClick={refreshEnterpriseConfig}><RefreshCw size={14} />刷新配置</button>}
              <button type="button" className="wanjuan-account-danger-button" onClick={disconnectEnterpriseWorkspace}>断开</button>
            </div>
            {isGatewayHost && (
              <>
                <div className="wanjuan-enterprise-host-details">
                  <div className="wanjuan-enterprise-host-metrics">
                    <div><span>网关地址</span><strong>{account.gatewayHost?.preferredUrl || "等待局域网地址"}</strong></div>
                    <div><span>配置版本</span><strong>v{account.gatewayHost?.configVersion || 1}</strong></div>
                    <div><span>云端状态</span><strong>{account.gatewayHost?.cloudStatus === "active" ? "已激活" : "等待激活"}</strong></div>
                  </div>
                  <div className="wanjuan-enterprise-host-actions">
                    <button type="button" className="wanjuan-account-outline-button" disabled={account.busy || publishingConfig} onClick={publishCurrentConfig}><RefreshCw size={15} className={publishingConfig ? "is-spinning" : ""} />{publishingConfig ? "正在同步" : "同步本机配置"}</button>
                    {account.gatewayHost?.running ? <button type="button" className="wanjuan-account-outline-button" disabled={account.busy} onClick={stopEnterpriseGateway}><Square size={14} />停止网关</button> : <button type="button" className="wanjuan-account-primary-inline" disabled={account.busy} onClick={startEnterpriseGateway}><Play size={14} />启动网关</button>}
                    <button type="button" className="wanjuan-account-danger-button" disabled={account.busy} onClick={releaseCurrentGateway}>移除本机网关</button>
                  </div>
                </div>
                {(["owner", "admin"].includes(String(account.enterprise?.organization?.role || ""))) && <EnterpriseManagementPanel />}
              </>
            )}
          </>
        ) : (
          <div className="wanjuan-enterprise-empty">
            <LockKeyhole size={20} />
            <div><strong>{account.ownedEnterprise ? `已找到企业：${account.ownedEnterprise.name || "未命名企业"}` : account.authenticated ? "尚未绑定企业空间" : "登录后可绑定企业空间"}</strong><span>{account.ownedEnterprise ? "可将当前电脑设为新的主网关，企业成员和配额不会被删除。" : "企业 API Key 只保存在局域网网关，客户端仅持有短期企业会话。"}</span></div>
          </div>
        )}

        {enterprisePanel === "connect" && (
          <div className="wanjuan-enterprise-connect-form">
            <label><span>企业网关地址</span><input type="url" value={gatewayUrl} onChange={(event) => setGatewayUrl(event.target.value)} placeholder="https://gateway.company.local" /></label>
            <label><span>企业邀请码</span><input type="text" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="首次绑定时填写" /></label>
            {account.error && <div className="wanjuan-account-form-error">{account.error}</div>}
            <div className="wanjuan-enterprise-form-actions">
              <button type="button" className="wanjuan-account-outline-button" onClick={() => setEnterprisePanel(null)}>取消</button>
              <button type="button" className="wanjuan-account-primary-inline" disabled={account.busy || !gatewayUrl.trim()} onClick={connectEnterprise}>
                {account.busy ? "正在验证" : "连接企业网关"}
              </button>
            </div>
          </div>
        )}
        {account.error && !enterprisePanel && <div className="wanjuan-account-form-error">{account.error}</div>}
      </section>
      {(enterprisePanel === "create" || enterprisePanel === "takeover") && (
        <EnterpriseGatewayCreateDialog
          currentConfigVersion={Number(account.gatewayHost?.configVersion || 0)}
          defaultName={account.user?.name || account.user?.email?.split("@")[0] || ""}
          existingEnterprise={enterprisePanel === "takeover" ? account.ownedEnterprise : null}
          onClose={() => setEnterprisePanel(null)}
        />
      )}
      {membershipBenefitsOpen && (
        <WanJuanMembershipBenefitsDialog
          onClose={() => setMembershipBenefitsOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
