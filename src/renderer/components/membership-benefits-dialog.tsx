import { useEffect, useRef } from "react";
import { Building2, Cloud, Copy, Crown, Percent, X } from "lucide-react";
import {
  copyMembershipContactQQ,
  WANJUAN_MEMBERSHIP_BENEFITS,
  WANJUAN_MEMBERSHIP_CONTACT_QQ,
} from "../lib/membership-benefits";

const benefitIcons = [Building2, Cloud, Percent];

export function WanJuanMembershipBenefitsDialog({
  onClose,
  showToast,
}: {
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) || []);
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const copyQQ = () => copyMembershipContactQQ({
    clipboard: navigator.clipboard,
    notify: showToast,
  });

  return (
    <div
      className="wanjuan-membership-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        className="wanjuan-membership-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wanjuan-membership-dialog-title"
        aria-describedby="wanjuan-membership-dialog-description"
      >
        <header className="wanjuan-membership-dialog-header">
          <div className="wanjuan-membership-dialog-title">
            <span className="wanjuan-membership-dialog-icon" aria-hidden="true"><Crown size={20} /></span>
            <div>
              <div className="wanjuan-membership-title-line">
                <h3 id="wanjuan-membership-dialog-title">万卷会员</h3>
                <span className="wanjuan-membership-beta-tag">内测开放</span>
              </div>
              <p id="wanjuan-membership-dialog-description">为个人创作与团队协作提供更完整的模型和提示词能力</p>
            </div>
          </div>
          <button type="button" aria-label="关闭会员权益" title="关闭" onClick={onClose}><X size={17} /></button>
        </header>

        <div className="wanjuan-membership-dialog-body">
          <div className="wanjuan-membership-price" aria-label="会员价格每月 19.9 元">
            <strong><span>¥</span>19.9</strong><span>/月</span>
          </div>
          <div className="wanjuan-membership-benefit-list" aria-label="会员权益列表">
            {WANJUAN_MEMBERSHIP_BENEFITS.map((benefit, index) => {
              const Icon = benefitIcons[index];
              return (
                <div className="wanjuan-membership-benefit-row" key={benefit.title}>
                  <span aria-hidden="true"><Icon size={17} /></span>
                  <div><strong>{benefit.title}</strong><p>{benefit.description}</p></div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="wanjuan-membership-dialog-footer">
          <p>开通会员需要内测码，详情联系 QQ：<strong>{WANJUAN_MEMBERSHIP_CONTACT_QQ}</strong>。</p>
          <button type="button" className="wanjuan-account-outline-button" onClick={copyQQ} aria-label={`复制 QQ ${WANJUAN_MEMBERSHIP_CONTACT_QQ}`}>
            <Copy size={14} />复制 QQ
          </button>
        </footer>
      </section>
    </div>
  );
}
