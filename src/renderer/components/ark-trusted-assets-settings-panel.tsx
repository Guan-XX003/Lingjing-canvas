import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { wanjuanNormalizeArkTrustedAssetConfig } from "../lib/ark-trusted-assets";

export function WanJuanArkTrustedAssetsSettingsPanel({
  arkTrustedAssetConfig,
  setArkTrustedAssetConfig,
  showToast2,
  tosConfig,
}: any) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(``);
  const config = wanjuanNormalizeArkTrustedAssetConfig(arkTrustedAssetConfig);
  const updateConfig = (patch) => setArkTrustedAssetConfig((current) =>
    wanjuanNormalizeArkTrustedAssetConfig({ ...(current || {}), ...patch })
  );
  const tosReady = Boolean(
    String(tosConfig?.accessKeyId || tosConfig?.accessKey || ``).trim() &&
    String(tosConfig?.secretAccessKey || tosConfig?.secretKey || ``).trim() &&
    String(tosConfig?.bucket || ``).trim()
  );
  const ensureGroup = async () => {
    if (busy) return;
    setBusy(true);
    setStatus(`正在连接 Ark 资产库...`);
    try {
      const result = await window.wanjuanDesktop?.ensureArkTrustedAssetGroup?.({ tos: tosConfig || {}, ark: config });
      if (!result?.ok || !result.groupId) throw new Error(result?.error || `未返回资产组 ID`);
      updateConfig({ assetGroupId: result.groupId });
      setStatus(`资产组可用：${result.groupId}`);
      showToast2?.(`Ark 可信素材资产组连接成功`);
    } catch (error) {
      const message = error?.message || String(error);
      setStatus(`连接失败：${message}`);
      showToast2?.(`Ark 资产组连接失败：${message}`);
    } finally {
      setBusy(false);
    }
  };
  const clearCache = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await window.wanjuanDesktop?.clearArkTrustedAssetCache?.();
      if (!result?.ok) throw new Error(result?.error || `清理失败`);
      setStatus(`本地审核缓存已清理`);
      showToast2?.(`Ark 可信素材本地缓存已清理`);
    } catch (error) {
      const message = error?.message || String(error);
      setStatus(`清理失败：${message}`);
    } finally {
      setBusy(false);
    }
  };

  return jsxs(`div`, {
    className: `rounded-lg border border-[#333] bg-[#121212] overflow-hidden wanjuan-ark-trusted-assets-settings`,
    children: [
      jsxs(`div`, {
        className: `flex items-center justify-between gap-3 p-3 border-b border-[#292929]`,
        children: [
          jsxs(`div`, {
            className: `min-w-0`,
            children: [
              jsx(`div`, { className: `text-xs font-semibold text-gray-200`, children: `Ark 可信素材` }),
              jsx(`div`, { className: `text-[10px] text-gray-500 mt-0.5`, children: `官方兼容模式参考图审核与 asset:// 绑定` }),
            ],
          }),
          jsxs(`label`, {
            className: `flex items-center gap-2 text-xs text-gray-300 shrink-0`,
            children: [
              jsx(`input`, {
                type: `checkbox`,
                checked: config.enabled,
                onChange: (event) => updateConfig({ enabled: event.target.checked }),
              }),
              `启用`,
            ],
          }),
        ],
      }),
      jsxs(`div`, {
        className: `p-3 space-y-3`,
        children: [
          jsxs(`div`, {
            className: `grid grid-cols-2 gap-2`,
            children: [
              jsx(`button`, {
                type: `button`,
                "aria-pressed": config.reviewMode === `manual`,
                onClick: () => updateConfig({ reviewMode: `manual` }),
                className: `px-3 py-2 rounded-lg border text-xs transition-colors wanjuan-settings-button ${config.reviewMode === `manual` ? `is-active` : ``}`,
                children: `仅手动审核`,
              }),
              jsx(`button`, {
                type: `button`,
                "aria-pressed": config.reviewMode === `auto`,
                onClick: () => updateConfig({ reviewMode: `auto` }),
                className: `px-3 py-2 rounded-lg border text-xs transition-colors wanjuan-settings-button ${config.reviewMode === `auto` ? `is-active` : ``}`,
                children: `生成时自动审核`,
              }),
            ],
          }),
          jsx(`div`, {
            className: `rounded-lg border px-3 py-2 text-[11px] leading-5 wanjuan-settings-note`,
            children: `图片审核固定直连火山 Ark；即梦生成仍使用统一 API 配置及节点内选择的 API，不会改写或锁定生成接口。`,
          }),
          jsxs(`div`, {
            className: `grid grid-cols-1 md:grid-cols-2 gap-2`,
            children: [
              [`region`, `Ark Region`],
              [`projectName`, `Project Name`],
              [`assetGroupId`, `Asset Group ID`],
              [`assetGroupName`, `Asset Group Name`],
            ].map(([key, label]) => jsxs(`label`, {
              className: `block`,
              children: [
                jsx(`div`, { className: `text-[10px] text-gray-500 mb-1`, children: label }),
                jsx(`input`, {
                  value: config[key] || ``,
                  onChange: (event) => updateConfig({ [key]: event.target.value }),
                  className: `w-full rounded-lg border px-3 py-2 text-xs wanjuan-settings-control`,
                }),
              ],
            }, key)),
          }),
          jsxs(`div`, {
            className: `flex flex-wrap items-center gap-2`,
            children: [
              jsx(`span`, {
                className: `px-2 py-1 rounded-md border text-[10px] ${tosReady ? `border-emerald-500/40 text-emerald-200` : `border-amber-500/40 text-amber-200`}`,
                children: tosReady ? `TOS 已配置` : `TOS 未配置`,
              }),
              jsx(`span`, {
                className: `px-2 py-1 rounded-md border text-[10px] border-emerald-500/40 text-emerald-200`,
                children: `审核直连火山 Ark`,
              }),
              jsx(`button`, {
                type: `button`,
                disabled: busy || !tosReady,
                onClick: ensureGroup,
                className: `px-3 py-1.5 rounded-md text-xs disabled:opacity-50 wanjuan-settings-save-button`,
                children: busy ? `处理中...` : `测试并创建资产组`,
              }),
              jsx(`button`, {
                type: `button`,
                disabled: busy,
                onClick: clearCache,
                className: `px-3 py-1.5 rounded-md border text-xs disabled:opacity-50 wanjuan-settings-button`,
                children: `清理本地缓存`,
              }),
            ],
          }),
          status && jsx(`div`, {
            className: `rounded-lg border px-3 py-2 text-[11px] leading-5 wanjuan-settings-note`,
            children: status,
          }),
        ],
      }),
    ],
  });
}
