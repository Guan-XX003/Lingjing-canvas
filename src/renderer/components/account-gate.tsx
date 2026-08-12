import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Cloud,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import {
  bootstrapAccount,
  closeAccountAuth,
  continueWithLocalMode,
  getAccountState,
  loginAccount,
  sendAccountCode,
  subscribeAccount,
} from "../lib/account";

const isValidAccountEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 320;

function AccountAuthSurface({ welcome = false }: { welcome?: boolean }) {
  const account = useSyncExternalStore(subscribeAccount, getAccountState, getAccountState);
  const [register, setRegister] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const requestCode = async () => {
    setNotice("");
    setFormError("");
    if (!isValidAccountEmail(identifier)) {
      setFormError("请输入有效的邮箱地址");
      return;
    }
    const result = await sendAccountCode(identifier, register ? "register" : "login");
    if (result?.ok) {
      setCooldown(60);
      setNotice("验证码已发送，请检查邮箱");
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!isValidAccountEmail(identifier)) {
      setFormError("请输入有效的邮箱地址");
      return;
    }
    await loginAccount({ identifier, code, inviteCode, register });
  };

  return (
    <div className={`wanjuan-account-auth-shell ${welcome ? "wanjuan-account-auth-welcome" : "wanjuan-account-auth-modal"}`}>
      {!welcome && (
        <button type="button" className="wanjuan-account-auth-close" onClick={closeAccountAuth} title="关闭">
          <X size={18} />
        </button>
      )}

      <section className="wanjuan-account-auth-intro">
        <div className="wanjuan-account-mark" aria-hidden="true">
          <BookOpen />
        </div>
        <div>
          <div className="wanjuan-account-kicker">万卷灵境账号</div>
          <h1>随时随地开始创作</h1>
          <p>登录后可启用云备份、多设备同步、会员权益和企业私密空间。本地项目不会因为登录、退出或会员到期而被删除。</p>
        </div>

        <div className="wanjuan-account-benefits">
          <div><Cloud size={17} /><span>云端备份与设备恢复</span></div>
          <div><Building2 size={17} /><span>企业局域网与成员权限</span></div>
          <div><ShieldCheck size={17} /><span>企业密钥不进入客户端</span></div>
        </div>

        <div className="wanjuan-account-private-note">
          <LockKeyhole size={17} />
          <span>企业空间采用账号身份 + 局域网网关双重验证，离开企业网络后自动停止企业模型访问。</span>
        </div>
      </section>

      <section className="wanjuan-account-auth-form-panel">
        <div className="wanjuan-account-auth-tabs" role="tablist" aria-label="登录方式">
          <button type="button" className={!register ? "is-active" : ""} onClick={() => setRegister(false)}>登录</button>
          <button type="button" className={register ? "is-active" : ""} onClick={() => setRegister(true)}>注册</button>
        </div>

        <div className="wanjuan-account-form-heading">
          <UserRound size={20} />
          <div>
            <strong>{register ? "创建万卷灵境账号" : "欢迎回来"}</strong>
            <span>{register ? "内测阶段可通过邀请码创建账号" : "使用邮箱验证码登录"}</span>
          </div>
        </div>

        {!account.serviceConfigured && (
          <div className="wanjuan-account-service-warning">
            账号服务暂时不可用，请稍后重试。本地画布和项目不会受到影响。
          </div>
        )}

        <form className="wanjuan-account-form" onSubmit={submit}>
          <label>
            <span>邮箱</span>
            <input
              type="email"
              inputMode="email"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setFormError("");
              }}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>验证码</span>
            <div className="wanjuan-account-code-row">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="输入验证码"
                autoComplete="one-time-code"
              />
              <button
                type="button"
                className="wanjuan-account-secondary-button"
                disabled={!isValidAccountEmail(identifier) || cooldown > 0 || account.busy || !account.serviceConfigured}
                onClick={requestCode}
              >
                {cooldown > 0 ? `${cooldown}s` : "获取验证码"}
              </button>
            </div>
          </label>

          {register && (
            <label>
              <span>邀请码</span>
              <div className="wanjuan-account-input-with-icon">
                <KeyRound size={16} />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="内测邀请码"
                />
              </div>
            </label>
          )}

          {(account.error || formError || notice) && (
            <div className={account.error || formError ? "wanjuan-account-form-error" : "wanjuan-account-form-success"}>
              {account.error || formError || notice}
            </div>
          )}

          <button
            type="submit"
            className="wanjuan-account-primary-button"
            disabled={account.busy || !isValidAccountEmail(identifier) || !code.trim() || !account.serviceConfigured}
          >
            <span>{account.busy ? "正在验证" : register ? "注册并继续" : "登录并继续"}</span>
            {!account.busy && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="wanjuan-account-local-divider"><span>或者</span></div>
        <button type="button" className="wanjuan-account-local-button" disabled={account.busy} onClick={continueWithLocalMode}>
          先本地使用
        </button>
        <p className="wanjuan-account-local-copy">本地模式保留完整画布、自有 API、项目与资源功能，之后可随时在设置中登录。</p>
      </section>
    </div>
  );
}

export function WanJuanAccountGate() {
  const account = useSyncExternalStore(subscribeAccount, getAccountState, getAccountState);

  useEffect(() => {
    bootstrapAccount();
  }, []);

  // 账号状态加载不能遮挡启动开屏；新安装直接进入本地模式，只有用户
  // 主动打开账号页或已有会话失效时才显示认证界面。
  if (account.loading) return null;
  if (!account.authOpen) return null;

  return (
    <div className="wanjuan-account-overlay is-dialog" role="dialog" aria-modal="true">
      <AccountAuthSurface welcome={false} />
    </div>
  );
}
