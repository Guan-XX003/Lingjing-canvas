import { useCallback, useEffect, useState } from "react";
import {
  WANJUAN_TIANJI_ASSET_PAGE_SIZE,
  wanjuanTianjiEnsurePortraitGroups,
  wanjuanTianjiExtractGroups,
  wanjuanTianjiFindArray,
  wanjuanTianjiPortraitAssetIdFromItem,
  wanjuanTianjiPortraitDeleteDescriptor,
  wanjuanTianjiPortraitAvailabilityFromItem,
  wanjuanTianjiPortraitImageUrlFromItem,
  wanjuanTianjiPortraitNameFromItem,
  wanjuanTianjiPortraitStatusFromItem,
  wanjuanTianjiRefreshPortraitAssets,
} from "../lib/tianji-assets";
import {
  WANJUAN_TIANJI_PORTRAIT_ENDPOINTS,
  wanjuanBuildTianjiPortraitTaskParams,
  wanjuanTianjiDefaultPortraitGroupName,
  wanjuanGetSyncedTianjiSeedanceConfig,
  wanjuanTianjiBalancePoints,
  wanjuanTianjiFindPortraitTaskId,
  wanjuanMarkTianjiConfigManual,
  wanjuanTianjiFindDeep,
  wanjuanTianjiRequest,
  wanjuanTianjiStorageGet,
  wanjuanTianjiStorageSet,
} from "../lib/tianji-api";

type AssetType = "AIGC" | "LivenessFace";
const emptyAssets = () => ({ AIGC: [], LivenessFace: [] });
const emptyGroups = () => ({ AIGC: "", LivenessFace: "" });
const normalizeAssetList = (value: any) => Array.isArray(value) ? value : wanjuanTianjiFindArray(value);
const normalizeAssets = (value: any) => ({
  AIGC: normalizeAssetList(value?.AIGC),
  LivenessFace: normalizeAssetList(value?.LivenessFace),
});
const brokenPreviewImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="10" fill="#202020"/><rect x="28" y="36" width="104" height="68" rx="8" fill="#2c2c2c" stroke="#555"/><circle cx="58" cy="62" r="9" fill="#666"/><path d="M38 96l24-24 18 18 14-16 28 22H38z" fill="#555"/><text x="80" y="130" text-anchor="middle" font-size="13" font-family="Arial,sans-serif" fill="#aaa">预览暂不可用</text></svg>`,
)}`;

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(reader.error || new Error("读取图片失败"));
  reader.readAsDataURL(file);
});

const formatDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const initialPointsRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { start: formatDateTime(start), end: formatDateTime(end) };
};

function AssetLibrary({ title, type, assets, page, total, onPage, onInfo, onDelete }: any) {
  assets = normalizeAssetList(assets);
  const totalPages = Math.max(1, Math.ceil((total || assets.length) / WANJUAN_TIANJI_ASSET_PAGE_SIZE));
  const visibleAssets = assets.slice((page - 1) * WANJUAN_TIANJI_ASSET_PAGE_SIZE, page * WANJUAN_TIANJI_ASSET_PAGE_SIZE);
  return <section>
    <div className="wanjuan-tianji-native-subtitle-row">
      <strong>{title} · {total || assets.length} 个</strong>
      {totalPages > 1 && <div className="wanjuan-tianji-native-pager">
        <button type="button" disabled={page <= 1} onClick={() => onPage(type, page - 1)}>上一页</button>
        <span>{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(type, page + 1)}>下一页</button>
      </div>}
    </div>
    {visibleAssets.length ? <div className="wanjuan-tianji-native-grid">
      {visibleAssets.map((asset: any, index: number) => {
        const id = wanjuanTianjiPortraitAssetIdFromItem(asset);
        const image = wanjuanTianjiPortraitImageUrlFromItem(asset);
        const availability = wanjuanTianjiPortraitAvailabilityFromItem(asset);
        const pending = availability === "pending";
        const statusText = wanjuanTianjiPortraitStatusFromItem(asset);
        return <article className={`wanjuan-tianji-native-asset${pending ? " is-pending" : ""}`} key={id || `${type}-${index}`}>
          {image ? <img src={image} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = brokenPreviewImage; }} /> : <span className="wanjuan-tianji-native-no-image">无图</span>}
          {pending && <i>待刷新</i>}
          <b title={wanjuanTianjiPortraitNameFromItem(asset)}>{wanjuanTianjiPortraitNameFromItem(asset) || "未命名素材"}</b>
          <small>{pending ? "待天玑素材库返回" : availability === "failed" ? "素材处理失败" : availability === "unknown" ? "状态未知，暂不可绑定" : statusText || id}</small>
          {!pending && <div><button type="button" disabled={!id} title={id ? "查看素材详情" : "该旧素材未返回明确资产 ID"} onClick={() => id && onInfo(id)}>详情</button><button type="button" className="danger" disabled={!id} title={id ? "删除该素材" : "该旧素材未返回明确资产 ID，不能安全删除整组"} onClick={() => onDelete(asset, type)}>删除</button>{!id && <small>旧素材缺少可删除 ID，请刷新列表</small>}</div>}
        </article>;
      })}
    </div> : <div className="wanjuan-tianji-native-empty">暂无素材，刷新列表或上传人像后查看。</div>}
  </section>;
}

export function WanJuanTianjiSettingsNative({ pointsUnlocked = false }: { pointsUnlocked?: boolean }) {
  const [config, setConfig] = useState<any>(null);
  const [groups, setGroups] = useState<any>(emptyGroups);
  const [assets, setAssets] = useState<any>(emptyAssets);
  const [totals, setTotals] = useState<any>({ AIGC: 0, LivenessFace: 0 });
  const [pages, setPages] = useState<any>({ AIGC: 1, LivenessFace: 1 });
  const [uploadType, setUploadType] = useState<AssetType>("AIGC");
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [loadError, setLoadError] = useState("");
  const [pointsDialog, setPointsDialog] = useState<any>(null);
  const [realCallbackUrl, setRealCallbackUrl] = useState("");
  const [portraitTaskId, setPortraitTaskId] = useState("");
  const [bytedToken, setBytedToken] = useState("");
  const [portraitGroupName, setPortraitGroupName] = useState(() => wanjuanTianjiDefaultPortraitGroupName());

  const reload = useCallback(async () => {
    const [nextConfig, stored] = await Promise.all([
      wanjuanGetSyncedTianjiSeedanceConfig(),
      wanjuanTianjiStorageGet(["tianjiSeedanceGroups", "tianjiSeedanceAssets", "tianjiSeedancePortraitTaskId", "tianjiSeedancePortraitBytedToken", "tianjiSeedancePortraitGroupName"]),
    ]);
    const nextAssets = normalizeAssets(stored.tianjiSeedanceAssets);
    setConfig(nextConfig);
    setGroups({ ...emptyGroups(), ...(stored.tianjiSeedanceGroups || {}) });
    setAssets(nextAssets);
    setTotals({ AIGC: nextAssets.AIGC.length, LivenessFace: nextAssets.LivenessFace.length });
    setPortraitTaskId(String(stored.tianjiSeedancePortraitTaskId || ""));
    setBytedToken(String(stored.tianjiSeedancePortraitBytedToken || ""));
    setPortraitGroupName(String(stored.tianjiSeedancePortraitGroupName || "").trim() || wanjuanTianjiDefaultPortraitGroupName());
    if (nextConfig?.token && (stored.tianjiSeedanceGroups?.AIGC || stored.tianjiSeedanceGroups?.LivenessFace)) {
      try {
        const refreshed = await wanjuanTianjiRefreshPortraitAssets(nextConfig, {
          preferredType: "LivenessFace",
          retries: 0,
          pageNumber: 1,
          pageSize: WANJUAN_TIANJI_ASSET_PAGE_SIZE,
        });
        const refreshedAssets = normalizeAssets(refreshed.assets);
        setGroups({ ...emptyGroups(), ...(refreshed.groups || {}) });
        setAssets(refreshedAssets);
        setTotals({
          AIGC: refreshed.aigcTotal || refreshedAssets.AIGC.length,
          LivenessFace: refreshed.liveTotal || refreshedAssets.LivenessFace.length,
        });
      } catch (error) {
        console.warn("Tianji portrait preview refresh failed", error);
      }
    }
  }, []);

  useEffect(() => {
    reload().catch((error) => {
      const message = error?.message || String(error);
      setLoadError(message);
      setStatus(message);
    });
    const listener = (changes: any, area: string) => area === "local" && (changes?.apiConfigs || changes?.tianjiSeedanceConfig) && wanjuanGetSyncedTianjiSeedanceConfig().then(setConfig).catch(console.warn);
    (globalThis as any).chrome?.storage?.onChanged?.addListener?.(listener);
    return () => (globalThis as any).chrome?.storage?.onChanged?.removeListener?.(listener);
  }, [reload]);

  const execute = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await task(); } catch (error: any) { setStatus(error?.message || String(error)); }
    finally { setBusy(false); }
  };

  const save = useCallback(async (manual = true, nextGroups = groups) => {
    const next = manual ? wanjuanMarkTianjiConfigManual(config || {}) : config;
    await wanjuanTianjiStorageSet({ tianjiSeedanceConfig: next, tianjiSeedanceGroups: nextGroups });
    setConfig(next);
    return next;
  }, [config, groups]);

  const refresh = useCallback(async (type = uploadType, page = 1, nextGroups = groups) => {
    const activeConfig = await save(true, nextGroups);
    const result = await wanjuanTianjiRefreshPortraitAssets(activeConfig, {
      preferredType: type, retries: 0, pageNumber: page, pageSize: WANJUAN_TIANJI_ASSET_PAGE_SIZE,
    });
    const nextAssets = normalizeAssets(result.assets);
    setAssets(nextAssets);
    setGroups(result.groups);
    setTotals((current: any) => ({ ...current, AIGC: result.aigcTotal || nextAssets.AIGC.length, LivenessFace: result.liveTotal || nextAssets.LivenessFace.length }));
    setPages((current: any) => ({ ...current, [type]: page }));
    return result;
  }, [groups, save, uploadType]);

  const loadPage = (type: AssetType, page: number) => execute(async () => {
    setStatus(`正在加载第 ${page} 页...`);
    await refresh(type, page);
    setStatus("");
  });

  const showInfo = (id: string) => execute(async () => {
    const result = await wanjuanTianjiRequest(await save(), "/api/cut/model/get-portrait-info", { params: { portrait_asset_id: id } });
    window.alert(`素材 ID：${id}\n\n${JSON.stringify(result, null, 2).slice(0, 1800)}`);
  });

  const deleteAsset = (asset: any, type: AssetType) => execute(async () => {
    const descriptor = wanjuanTianjiPortraitDeleteDescriptor(asset, type);
    if (!descriptor.canDelete) throw new Error("该旧素材未返回明确的资产 ID，暂不能安全删除；请先刷新素材列表");
    const id = descriptor.id;
    if (!window.confirm(`删除素材 ${id}？`)) return;
    await wanjuanTianjiRequest(await save(), "/api/cut/model/delete-portrait", { params: { portrait_asset_id: id } });
    const nextAssets = {
      AIGC: normalizeAssetList(assets.AIGC).filter((item: any) => wanjuanTianjiPortraitAssetIdFromItem(item) !== id),
      LivenessFace: normalizeAssetList(assets.LivenessFace).filter((item: any) => wanjuanTianjiPortraitAssetIdFromItem(item) !== id),
    };
    setAssets(nextAssets);
    await wanjuanTianjiStorageSet({ tianjiSeedanceAssets: nextAssets });
    setStatus(`素材已删除：${id}`);
  });

  const applyPortraitResult = useCallback(async (result: any, preferredType: AssetType) => {
    const taskId = wanjuanTianjiFindPortraitTaskId(result);
    if (taskId) setPortraitTaskId(taskId);
    if (taskId) await wanjuanTianjiStorageSet({ tianjiSeedancePortraitTaskId: taskId });
    const nextGroups = wanjuanTianjiExtractGroups(result, groups, preferredType);
    if (nextGroups.AIGC || nextGroups.LivenessFace) {
      setGroups(nextGroups);
      await wanjuanTianjiStorageSet({ tianjiSeedanceGroups: nextGroups });
    }
    return { taskId, nextGroups };
  }, [groups]);

  const createVirtualGroup = () => execute(async () => {
    const groupName = portraitGroupName.trim() || wanjuanTianjiDefaultPortraitGroupName();
    setPortraitGroupName(groupName);
    await wanjuanTianjiStorageSet({ tianjiSeedancePortraitGroupName: groupName });
    const result = await wanjuanTianjiRequest(await save(), WANJUAN_TIANJI_PORTRAIT_ENDPOINTS.createVirtual, { params: { name: groupName } });
    const { taskId, nextGroups } = await applyPortraitResult(result, "AIGC");
    setStatus(nextGroups.AIGC ? `虚拟组已创建：${nextGroups.AIGC}` : taskId ? `虚拟组创建任务已提交：${taskId}` : "虚拟组创建请求已提交；请填写返回的任务 ID 后查询");
  });

  const createRealAuthentication = () => execute(async () => {
    if (!/^https?:\/\//i.test(realCallbackUrl.trim())) throw new Error("创建真人认证需要填写可公网访问的 callback_url");
    const result = await wanjuanTianjiRequest(await save(), WANJUAN_TIANJI_PORTRAIT_ENDPOINTS.createReal, { params: { callback_url: realCallbackUrl.trim() } });
    const { taskId } = await applyPortraitResult(result, "LivenessFace");
    setStatus(taskId ? `真人认证已创建：${taskId}；请在认证页面完成后查询` : "真人认证已创建；完成认证后填写 BytedToken 查询结果");
  });

  const queryPortraitTask = () => execute(async () => {
    if (!bytedToken.trim() && !portraitTaskId.trim()) throw new Error("请先填写人像任务 ID，或粘贴真人认证回调返回的 BytedToken");
    const activeConfig = await save();
    if (bytedToken.trim()) await wanjuanTianjiStorageSet({ tianjiSeedancePortraitBytedToken: bytedToken.trim() });
    const result = bytedToken.trim()
      ? await wanjuanTianjiRequest(activeConfig, WANJUAN_TIANJI_PORTRAIT_ENDPOINTS.queryRealResult, { params: { bytedToken: bytedToken.trim() } })
      : await wanjuanTianjiRequest(activeConfig, WANJUAN_TIANJI_PORTRAIT_ENDPOINTS.queryTask, { params: wanjuanBuildTianjiPortraitTaskParams(portraitTaskId) });
    const preferredType: AssetType = bytedToken.trim() ? "LivenessFace" : uploadType;
    const { taskId, nextGroups } = await applyPortraitResult(result, preferredType);
    if (!nextGroups[preferredType] && (portraitTaskId || taskId)) {
      const synced = await wanjuanTianjiRequest(activeConfig, WANJUAN_TIANJI_PORTRAIT_ENDPOINTS.syncAssetId, { params: wanjuanBuildTianjiPortraitTaskParams(portraitTaskId || taskId) });
      const applied = await applyPortraitResult(synced, preferredType);
      setStatus(applied.nextGroups[preferredType] ? `组 ID 已同步：${applied.nextGroups[preferredType]}` : "任务尚未返回组 ID，请稍后重试");
      return;
    }
    setStatus(nextGroups[preferredType] ? `组 ID 已更新：${nextGroups[preferredType]}` : "任务查询成功，但尚未返回组 ID");
  });

  const upload = () => execute(async () => {
    if (!uploadFile) throw new Error("请选择一张人像图片");
    const activeConfig = await save();
    const nextGroups = await wanjuanTianjiEnsurePortraitGroups(activeConfig, uploadType);
    setGroups(nextGroups);
    setStatus("正在上传公网图片...");
    const uploaded = await (window as any).wanjuanDesktop?.uploadPublicMedia?.({ url: await fileToDataUrl(uploadFile), kind: "image", filename: `tianji-portrait-${Date.now()}` });
    if (!uploaded?.ok || !uploaded.url) throw new Error(uploaded?.error || "图片公网链接上传失败");
    setStatus("正在提交天玑人像审核...");
    await wanjuanTianjiRequest(activeConfig, uploadType === "AIGC" ? "/api/cut/model/upload-VirtralPortrait" : "/api/cut/model/upload-Portrait", {
      params: {
        image_url: uploaded.url,
        name: uploadName || uploadFile.name || "人像素材",
        ...(uploadType === "AIGC" ? { virtual_group_id: nextGroups.AIGC } : { portrait_group_id: nextGroups.LivenessFace }),
        type: "Image",
      },
    });
    await refresh(uploadType, 1, nextGroups).catch(() => null);
    setUploadFile(null);
    setStatus("上传已提交，素材库已自动刷新");
  });

  const changeConfig = (key: string, value: any) => setConfig((current: any) => ({ ...(current || {}), [key]: value }));
  const openPointsDialog = () => execute(async () => {
    const range = initialPointsRange();
    setPointsDialog({ loading: true, rows: [], page: 1, total: 0, ...range });
    const result = await wanjuanTianjiRequest(await save(), "/api/tasks/points-logs", {
      method: "GET",
      query: { page: 1, pageSize: 30, start_date: range.start, end_date: range.end },
    });
    const rows = wanjuanTianjiFindArray(result);
    const total = Number(wanjuanTianjiFindDeep(result, ["total", "Total", "count", "Count", "totalCount", "TotalCount"])) || rows.length;
    setPointsDialog({ loading: false, rows, page: 1, total, ...range });
    setStatus(`积分明细已更新：${rows.length} 条记录`);
  });
  if (!config) return <div className="wanjuan-tianji-native-loading">{loadError ? `天玑配置读取失败：${loadError}` : "正在读取天玑配置..."}</div>;

  return <div className="wanjuan-tianji-native-card">
    <div className="wanjuan-tianji-native-actions">
      {pointsUnlocked && <button type="button" disabled={busy} onClick={() => execute(async () => { const result = await wanjuanTianjiRequest(await save(), "/api/cut/model/fetch-points-balance"); const points = wanjuanTianjiBalancePoints(result); setStatus(points === null ? "积分余额接口返回空数据" : `积分余额：${points}`); })}>查询积分</button>}
      {pointsUnlocked && <button type="button" disabled={busy} onClick={openPointsDialog}>积分明细</button>}
      <button type="button" disabled={busy} onClick={createVirtualGroup}>创建虚拟组</button>
      <button type="button" disabled={busy} onClick={createRealAuthentication}>创建真人认证</button>
      <button type="button" disabled={busy || (!bytedToken.trim() && !portraitTaskId.trim())} onClick={queryPortraitTask}>查询/同步组 ID</button>
      <button type="button" disabled={busy || !(uploadType === "AIGC" ? groups.AIGC : groups.LivenessFace)} onClick={() => execute(async () => { if (!(uploadType === "AIGC" ? groups.AIGC : groups.LivenessFace)) throw new Error("请先创建/查询对应人像组并保存组 ID，再刷新素材"); setStatus("正在刷新素材..."); const result = await refresh(uploadType, 1); setStatus(`刷新完成：虚拟 ${result.aigcCount} 个，真人 ${result.liveCount} 个`); })}>刷新素材</button>
      <button type="button" disabled={busy} onClick={() => execute(async () => { const next = await wanjuanGetSyncedTianjiSeedanceConfig({ force: true }); setConfig(next); setStatus("已同步极鑫配置"); })}>同步极鑫配置</button>
      <button type="button" className="primary" disabled={busy} onClick={() => execute(async () => { await save(); setStatus("已保存"); })}>保存</button>
      <span>{status || (busy ? "处理中..." : "")}</span>
    </div>
    <div className="wanjuan-tianji-native-fields">
      <label>接口地址<input value={config.baseUrl || ""} onChange={(event) => changeConfig("baseUrl", event.target.value)} /></label>
      <label>Authorization Token<div className="wanjuan-tianji-native-secret"><input type={showToken ? "text" : "password"} value={config.token || ""} onChange={(event) => changeConfig("token", event.target.value)} /><button type="button" onClick={() => setShowToken((value) => !value)}>{showToken ? "隐藏" : "显示"}</button></div></label>
      <label>平台标识<input value={config.platform || "web"} onChange={(event) => changeConfig("platform", event.target.value)} /></label>
      <label>Sass ID<input value={config.sassId || "1"} onChange={(event) => changeConfig("sassId", event.target.value)} /></label>
      <label>真人组 ID<input value={groups.LivenessFace || ""} onChange={(event) => setGroups((current: any) => ({ ...current, LivenessFace: event.target.value }))} /></label>
      <label>虚拟组 ID<input value={groups.AIGC || ""} onChange={(event) => setGroups((current: any) => ({ ...current, AIGC: event.target.value }))} /></label>
      <label>素材组名称<input value={portraitGroupName} onChange={(event) => setPortraitGroupName(event.target.value)} placeholder="留空自动生成万卷灵境-时间" /></label>
      <label>真人回调 URL<input value={realCallbackUrl} onChange={(event) => setRealCallbackUrl(event.target.value)} placeholder="https://.../tianji/callback" /></label>
      <label>人像任务 ID<input value={portraitTaskId} onChange={(event) => { setPortraitTaskId(event.target.value); void wanjuanTianjiStorageSet({ tianjiSeedancePortraitTaskId: event.target.value }); }} placeholder="创建组后自动填写；也可手动填写" /></label>
      <label>BytedToken<input value={bytedToken} onChange={(event) => { setBytedToken(event.target.value); void wanjuanTianjiStorageSet({ tianjiSeedancePortraitBytedToken: event.target.value }); }} placeholder="真人认证回调返回" /></label>
    </div>
    <div className="wanjuan-tianji-native-checks"><label><input type="checkbox" checked={config.generateAudio !== false} onChange={(event) => changeConfig("generateAudio", event.target.checked)} />生成同步声音</label><label><input type="checkbox" checked={config.watermark === true} onChange={(event) => changeConfig("watermark", event.target.checked)} />添加水印</label></div>
    <div className="wanjuan-tianji-native-fields"><label>上传类型<select value={uploadType} onChange={(event) => setUploadType(event.target.value as AssetType)}><option value="AIGC">虚拟人像</option><option value="LivenessFace">真人人像</option></select></label><label>素材名称<input value={uploadName} onChange={(event) => setUploadName(event.target.value)} placeholder="素材名称" /></label><label>图片文件<input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} /></label></div>
    <div className="wanjuan-tianji-native-actions"><button type="button" className="primary" disabled={busy} onClick={upload}>上传到人像库</button></div>
    <AssetLibrary title="虚拟人像" type="AIGC" assets={assets.AIGC || []} page={pages.AIGC} total={totals.AIGC} onPage={loadPage} onInfo={showInfo} onDelete={deleteAsset} />
    <AssetLibrary title="真人人像" type="LivenessFace" assets={assets.LivenessFace || []} page={pages.LivenessFace} total={totals.LivenessFace} onPage={loadPage} onInfo={showInfo} onDelete={deleteAsset} />
    {pointsDialog && <div className="wanjuan-tianji-points-native-overlay" role="dialog" aria-modal="true" aria-label="积分明细" onMouseDown={(event) => event.target === event.currentTarget && setPointsDialog(null)}>
      <div className="wanjuan-tianji-points-native-dialog">
        <header><div><h3>积分明细</h3><p>{pointsDialog.start} 至 {pointsDialog.end}</p></div><button type="button" onClick={() => setPointsDialog(null)}>关闭</button></header>
        <div className="wanjuan-tianji-points-native-table"><table><thead><tr><th>时间</th><th>类型</th><th>变动</th><th>余额</th><th>说明</th></tr></thead><tbody>
          {pointsDialog.loading ? <tr><td colSpan={5}>正在加载...</td></tr> : pointsDialog.rows.length ? pointsDialog.rows.map((row: any, index: number) => <tr key={row?.id || index}><td>{row?.created_at || row?.createdAt || row?.create_time || row?.time || "-"}</td><td>{row?.type || row?.event || row?.scene || "积分变动"}</td><td>{row?.points ?? row?.amount ?? row?.change ?? "-"}</td><td>{row?.balance ?? row?.after_balance ?? row?.remaining_points ?? "-"}</td><td>{row?.remark || row?.description || row?.message || row?.task_id || "-"}</td></tr>) : <tr><td colSpan={5}>没有查到积分变动记录。</td></tr>}
        </tbody></table></div>
        <footer>共 {pointsDialog.total} 条</footer>
      </div>
    </div>}
  </div>;
}
