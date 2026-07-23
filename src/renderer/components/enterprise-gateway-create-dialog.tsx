import { useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Gauge,
  LoaderCircle,
  Server,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { createEnterpriseGateway, takeOverEnterpriseGateway, type OwnedEnterprise } from "../lib/account";
import { buildEnterpriseConfigDraft, type EnterpriseConfigDraft } from "../lib/enterprise-config-snapshot";

type QuotaKey = "text_generation" | "image_generation" | "video_generation" | "jimeng_generation" | "audio_generation" | "music_generation";

const quotaRows: Array<{ key: QuotaKey; label: string; unit: string; value: number | null }> = [
  { key: "text_generation", label: "文本生成", unit: "成功请求", value: null },
  { key: "image_generation", label: "图片生成", unit: "成功输出张数", value: 50 },
  { key: "video_generation", label: "视频生成", unit: "成功任务", value: 20 },
  { key: "jimeng_generation", label: "即梦生成", unit: "成功任务", value: 15 },
  { key: "audio_generation", label: "音频生成", unit: "成功任务", value: 20 },
  { key: "music_generation", label: "音乐生成", unit: "成功任务", value: 10 },
];

type CreationResult = {
  organization?: { id?: string; name?: string };
  gateway?: { preferredUrl?: string; certificateFingerprint?: string; configVersion?: number };
  inviteCode?: string;
};

export function EnterpriseGatewayCreateDialog({
  currentConfigVersion = 0,
  defaultName = "",
  existingEnterprise = null,
  onClose,
}: {
  currentConfigVersion?: number;
  defaultName?: string;
  existingEnterprise?: OwnedEnterprise | null;
  onClose: () => void;
}) {
  const takeover = !!existingEnterprise?.id;
  const [step, setStep] = useState(1);
  const [operationId] = useState(() => crypto.randomUUID());
  const [organizationName, setOrganizationName] = useState(existingEnterprise?.name || (defaultName ? `${defaultName}的企业` : ""));
  const [gatewayName, setGatewayName] = useState(defaultName ? `${defaultName}的企业网关` : "企业网关");
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [autoStart, setAutoStart] = useState(true);
  const [draft, setDraft] = useState<EnterpriseConfigDraft | null>(null);
  const draftSecretsRef = useRef<EnterpriseConfigDraft["secrets"]>([]);
  const [draftError, setDraftError] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [result, setResult] = useState<CreationResult | null>(null);
  const [quotas, setQuotas] = useState(() => Object.fromEntries(quotaRows.map((row) => [row.key, row.value])) as Record<QuotaKey, number | null>);

  const loadDraft = async () => {
    setLoadingDraft(true);
    setDraftError("");
    try {
      const next = await buildEnterpriseConfigDraft({ version: currentConfigVersion + 1 });
      draftSecretsRef.current = next.secrets;
      setDraft({ ...next, secrets: [] });
      setStep(2);
    } catch (error) {
      setDraftError(String((error as Error)?.message || error));
    } finally {
      setLoadingDraft(false);
    }
  };

  const create = async () => {
    if (!draft) return;
    setCreating(true);
    setCreateError("");
    const request = {
      operationId,
      organizationName: organizationName.trim(),
      organizationId: existingEnterprise?.id,
      gatewayName: gatewayName.trim(),
      timezone,
      autoStart,
      snapshot: draft.snapshot,
      secrets: draftSecretsRef.current,
      defaultQuotas: quotaRows.map((row) => ({
        capability: row.key,
        enabled: true,
        limit: quotas[row.key],
        unit: row.unit,
      })),
    };
    const response = takeover
      ? await takeOverEnterpriseGateway(request)
      : await createEnterpriseGateway(request);
    setCreating(false);
    if (!response?.ok) {
      setCreateError(String(response?.error || (takeover ? "企业网关接管失败" : "企业网关创建失败")));
      return;
    }
    setResult(response.creationResult || null);
    setStep(4);
  };

  const copy = (value?: string) => {
    if (value) navigator.clipboard?.writeText(value).catch(() => {});
  };

  return (
    <div className="wanjuan-enterprise-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !creating && onClose()}>
      <section className="wanjuan-enterprise-create-dialog" role="dialog" aria-modal="true" aria-label={takeover ? "接管企业网关" : "创建企业网关"}>
        <header className="wanjuan-enterprise-dialog-header">
          <div>
            <strong>{takeover ? "接管企业网关" : "创建企业网关"}</strong>
            <span>{takeover ? "当前电脑将替换原主网关，并成为新的企业配置源" : "创建者电脑将成为企业配置源和局域网请求网关"}</span>
          </div>
          <button type="button" aria-label="关闭" title="关闭" disabled={creating} onClick={onClose}><X size={17} /></button>
        </header>

        <div className="wanjuan-enterprise-steps" aria-label="创建进度">
          {[
            [1, takeover ? "企业确认" : "企业信息", Server],
            [2, "配置镜像", Settings2],
            [3, takeover ? "确认接管" : "成员配额", takeover ? TriangleAlert : Gauge],
            [4, takeover ? "接管完成" : "创建完成", Check],
          ].map(([index, label, Icon]: any) => (
            <div key={index} className={step >= index ? "is-active" : ""}>
              <span>{step > index ? <Check size={13} /> : <Icon size={13} />}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>

        <div className="wanjuan-enterprise-dialog-body">
          {step === 1 && (
            <div className="wanjuan-enterprise-form-grid">
              <label><span>企业名称</span><input value={organizationName} readOnly={takeover} onChange={(event) => setOrganizationName(event.target.value)} placeholder="例如：万卷创作团队" /></label>
              <label><span>网关名称</span><input value={gatewayName} onChange={(event) => setGatewayName(event.target.value)} placeholder="例如：主创作网关" /></label>
              <label><span>企业时区</span><select value={takeover ? existingEnterprise?.timezone || timezone : timezone} disabled={takeover} onChange={(event) => setTimezone(event.target.value)}><option value="Asia/Shanghai">Asia/Shanghai</option><option value="Asia/Hong_Kong">Asia/Hong_Kong</option><option value="UTC">UTC</option></select></label>
              <label className="wanjuan-enterprise-toggle-row">
                <input type="checkbox" checked={autoStart} onChange={(event) => setAutoStart(event.target.checked)} />
                <span><strong>软件启动时自动运行网关</strong><small>创建者电脑在线时，成员才能使用企业模型与上传配置。</small></span>
              </label>
              {draftError && <div className="wanjuan-account-form-error">{draftError}</div>}
            </div>
          )}

          {step === 2 && draft && (
            <div className="wanjuan-enterprise-config-review">
              <div className="wanjuan-enterprise-secure-note"><ShieldCheck size={19} /><div><strong>完整配置镜像，真实密钥留在本机</strong><span>成员会获得模型、协议、参数和上传行为；Key、Token、AK/SK 已替换为 Secret 引用。</span></div></div>
              <div className="wanjuan-enterprise-summary-grid">
                <div><span>API 配置</span><strong>{draft.summary.apiConfigCount}</strong></div>
                <div><span>全局配置</span><strong>{draft.summary.storedGlobalConfigCount}</strong></div>
                <div><span>模型协议</span><strong>{draft.summary.protocolCount}</strong></div>
                <div><span>模型绑定</span><strong>{draft.summary.modelBindingCount}</strong></div>
                <div><span>上传通道</span><strong>{draft.summary.uploadChannelCount}</strong></div>
                <div><span>受保护密钥</span><strong>{draft.summary.secretCount}</strong></div>
              </div>
              {draft.warnings.length > 0 && <div className="wanjuan-enterprise-warning-list">{draft.warnings.map((warning) => <div key={warning}>{warning}</div>)}</div>}
              <button type="button" className="wanjuan-account-outline-button" disabled={loadingDraft} onClick={loadDraft}>{loadingDraft ? "正在重新读取" : "重新读取本机配置"}</button>
            </div>
          )}

          {step === 3 && !takeover && (
            <div className="wanjuan-enterprise-quota-section">
              <p>成员提交时先预占额度，只有成功任务才计入每日数量；失败、取消和超时不会扣除。</p>
              <div className="wanjuan-enterprise-quota-table">
                <div className="is-header"><span>能力</span><span>不限</span><span>每日上限</span><span>计量单位</span></div>
                {quotaRows.map((row) => (
                  <div key={row.key}>
                    <strong>{row.label}</strong>
                    <label><input type="checkbox" checked={quotas[row.key] == null} onChange={(event) => setQuotas((current) => ({ ...current, [row.key]: event.target.checked ? null : row.value || 10 }))} /><span>不限</span></label>
                    <input type="number" min="1" disabled={quotas[row.key] == null} value={quotas[row.key] ?? ""} onChange={(event) => setQuotas((current) => ({ ...current, [row.key]: Math.max(1, Number(event.target.value || 1)) }))} />
                    <span>{row.unit}</span>
                  </div>
                ))}
              </div>
              {createError && <div className="wanjuan-account-form-error">{createError}</div>}
            </div>
          )}

          {step === 3 && takeover && (
            <div className="wanjuan-enterprise-quota-section">
              <div className="wanjuan-enterprise-secure-note is-warning">
                <TriangleAlert size={19} />
                <div><strong>原主网关会立即失效</strong><span>现有企业、成员、邀请码和配额会保留；成员会话将被撤销，需要连接新网关地址。</span></div>
              </div>
              <p>接管成功后，当前电脑会保存新的网关身份、TLS 证书和企业密钥库。当前电脑的本机配置将成为新的企业配置镜像。</p>
              {existingEnterprise?.gatewayName && <div className="wanjuan-enterprise-warning-list"><div>将替换：{existingEnterprise.gatewayName}（{existingEnterprise.gatewayStatus || "状态未知"}）</div></div>}
              {createError && <div className="wanjuan-account-form-error">{createError}</div>}
            </div>
          )}

          {step === 4 && (
            <div className="wanjuan-enterprise-created-state">
              <CheckCircle2 size={34} />
              <strong>{takeover ? "企业网关已接管" : "企业网关已创建"}</strong>
              <span>新的网关身份、TLS 证书和企业密钥库已经保存在当前电脑。</span>
              <div className="wanjuan-enterprise-result-list">
                <div><span>企业</span><strong>{result?.organization?.name || organizationName}</strong></div>
                <div><span>网关地址</span><strong>{result?.gateway?.preferredUrl || "等待局域网地址"}</strong><button type="button" title="复制网关地址" onClick={() => copy(result?.gateway?.preferredUrl)}><Copy size={14} /></button></div>
                <div><span>企业邀请码</span><strong>{result?.inviteCode || "未返回邀请码"}</strong><button type="button" title="复制邀请码" onClick={() => copy(result?.inviteCode)}><Copy size={14} /></button></div>
                <div><span>配置版本</span><strong>v{result?.gateway?.configVersion || draft?.snapshot.version || 1}</strong></div>
              </div>
              <p>邀请码只用于加入企业和首次配对，不包含任何模型密钥。</p>
            </div>
          )}
        </div>

        <footer className="wanjuan-enterprise-dialog-footer">
          {step > 1 && step < 4 ? <button type="button" className="wanjuan-account-outline-button" disabled={creating} onClick={() => setStep((current) => current - 1)}>上一步</button> : <span />}
          {step === 1 && <button type="button" className="wanjuan-account-primary-inline" disabled={!organizationName.trim() || !gatewayName.trim() || loadingDraft} onClick={loadDraft}>{loadingDraft ? <><LoaderCircle className="is-spinning" size={15} />正在读取配置</> : "下一步"}</button>}
          {step === 2 && <button type="button" className="wanjuan-account-primary-inline" onClick={() => setStep(3)}>确认配置镜像</button>}
          {step === 3 && <button type="button" className={takeover ? "wanjuan-account-danger-button" : "wanjuan-account-primary-inline"} disabled={creating} onClick={create}>{creating ? <><LoaderCircle className="is-spinning" size={15} />{takeover ? "正在接管网关" : "正在创建网关"}</> : takeover ? "确认接管企业网关" : "创建企业网关"}</button>}
          {step === 4 && <button type="button" className="wanjuan-account-primary-inline" onClick={onClose}>完成</button>}
        </footer>
      </section>
    </div>
  );
}
