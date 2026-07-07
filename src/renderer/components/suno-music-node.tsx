/**
 * 独立音乐节点（Suno / newapi 版接口）。
 *
 * 从原共用的 TTS/音乐节点里拆出来，只做音乐，接 newapi 版 Suno 接口（lib/suno-music-api）：
 *  - 生成：灵感模式(描述，AI 写词) / 自定义模式(歌词 + 风格 tags + 标题)
 *  - 续写(extend)：在已有 clip 上从某秒续写（continue_clip_id + continue_at）
 *  - 翻唱/参考(reference)：基于已有 clip_id 参考生成（reference_clip_id）
 *  - 模型版本 mv：chirp-crow(v5)/bluejay(v4.5+)/auk(v4.5)/v4/v3.5，纯伴奏
 *
 * API 配置沿用「听音 API」绑定：把 suno 模型(如 suno_music)绑定到你的 newapi 站点配置。
 * 提交 /suno/generate → 轮询 /suno/feed/{clipIds}。全内联样式，颜色跟随主题变量。
 */
import { memo as reactMemo, useEffect, useRef, useState, type CSSProperties } from "react";
import { Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { CircleAlert, RefreshCw, Download, Settings2 } from "lucide-react";
import { resolveModelApiBindingIdHelper } from "../lib/model-binding";
import { wanjuanUploadMediaToPublicUrl } from "../lib/reference-media";
import { WanJuanNodeHandle } from "./render-mode";
import {
  SUNO_MV_MODELS,
  SUNO_DEFAULT_MV,
  SUNO_MV_LABELS,
  buildSunoGenerateBody,
  buildSunoExtendBody,
  buildSunoReferenceBody,
  validateSunoGenerateParams,
  submitSunoMusic,
  pollSunoTask,
  type SunoClip,
} from "../lib/suno-music-api";

declare const chrome: any;

/** 绑定这个模型名到你的 newapi 站点配置（配置管家里配的模型名，默认 suno_music） */
const SUNO_MODEL_NAME = "suno_music";

const ACTIONS = [
  { key: "generate", label: "生成" },
  { key: "extend", label: "续写" },
  { key: "cover", label: "翻唱" },
] as const;
type ActionKey = (typeof ACTIONS)[number]["key"];

/** 解析音乐 API 配置：优先 suno_music 的模型绑定，其次匹配 suno/newapi/聚合 的默认配置，再退到听音默认 */
function resolveSunoApiConfig(data: any): { url: string; key: string; configId: string } {
  const configs: any[] = Array.isArray(data?.apiConfigs) ? data.apiConfigs : [];
  const usable = configs.filter((c) => c?.url && c?.key);
  const boundId =
    resolveModelApiBindingIdHelper(data?.audioModelApiBindings, SUNO_MODEL_NAME, "") ||
    resolveModelApiBindingIdHelper(data?.audioModelApiBindings, "suno-music", "");
  const bound = boundId ? configs.find((c) => c.id === boundId) : null;
  const preferred =
    bound ||
    usable.find((c) => /suno|newapi|new-api|zhichuang|智创|聚合|lconai/i.test(`${c?.id || ""} ${c?.name || ""} ${c?.url || ""}`)) ||
    usable.find((c) => c?.id === "default") ||
    usable[0] ||
    null;
  return {
    url: preferred?.url || data?.audioApiUrl || "",
    key: preferred?.key || data?.audioApiKey || "",
    configId: preferred?.id || "",
  };
}

// 全部内联样式：项目 app.css 是固定 Tailwind 产物、构建不重生成，新类会静默失效。
// 颜色用主题变量（--wanjuan-theme-*），跟随石墨灰等主题；带深色兜底。
const v = (name: string, fallback: string) => `var(--wanjuan-theme-${name}, ${fallback})`;
const COL = {
  card: v("surface", "#1c1c1c"),
  panel: v("bg", "#181818"),
  header: v("surface-2", "#222"),
  input: v("bg", "#111"),
  border: v("border", "#333"),
  btnOff: v("surface-3", "#2a2a2a"),
  accent: v("accent", "#8a8f98"),
  textMain: v("text", "#e5e7eb"),
  textDim: v("muted", "#9aa0aa"),
  textFaint: v("muted", "#6b7280"),
  resultBg: v("surface-3", "#151515"),
  onAccent: v("bg", "#111"),
};
const uiInput: CSSProperties = {
  width: "100%", boxSizing: "border-box", background: COL.input, border: `1px solid ${COL.border}`,
  borderRadius: 6, padding: "7px 9px", fontSize: 12, lineHeight: 1.4, color: COL.textMain, outline: "none", userSelect: "text",
};
const uiLabel: CSSProperties = { fontSize: 11, color: COL.textDim, whiteSpace: "nowrap" };
const uiBtn = (active: boolean): CSSProperties => ({
  padding: "6px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none",
  background: active ? COL.accent : COL.btnOff, color: active ? COL.onAccent : COL.textMain,
  whiteSpace: "nowrap", fontWeight: active ? 600 : 400,
});
const uiPanel: CSSProperties = {
  display: "flex", flexDirection: "column", gap: 6, border: `1px solid ${COL.border}`, borderRadius: 6, padding: 8,
};

export const WanJuanSunoMusicNode = reactMemo(({ id: nodeId, data: nodeData }: any) => {
  const { updateNodeData } = useReactFlow();
  const data = nodeData || {};

  const [action, setAction] = useState<ActionKey>(data.sunoAction || "generate");
  const [customMode, setCustomMode] = useState<boolean>(data.customMode ?? false);
  const [instrumental, setInstrumental] = useState<boolean>(!!data.instrumental);
  const [mv, setMv] = useState<string>(data.sunoMv || data.mv || SUNO_DEFAULT_MV);
  const [prompt, setPrompt] = useState<string>(data.prompt || "");
  const [tags, setTags] = useState<string>(data.tags || "");
  const [title, setTitle] = useState<string>(data.title || "");
  const [continueClipId, setContinueClipId] = useState<string>(data.continueClipId || "");
  const [continueAt, setContinueAt] = useState<string>(data.continueAt ?? "");
  const [referenceClipId, setReferenceClipId] = useState<string>(data.referenceClipId || "");
  const [coverAudioUrl, setCoverAudioUrl] = useState<string>(data.coverAudioUrl || "");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // 外部（全局「停止」）把本节点 loading 置否时，中止正在进行的轮询，避免停止后又复活写回
  useEffect(() => {
    if (!data.loading && runningRef.current) abortRef.current?.abort();
  }, [data.loading]);

  // 上游文本节点内容 → 歌词/描述
  const connections = useNodeConnections({ handleType: "target" });
  const upstream: any[] = useNodesData(connections?.map((c: any) => c.source) || []) || [];
  const upstreamText = upstream
    .map((n: any) => (typeof (n?.data?.text || n?.data?.resultData || n?.data?.prompt) === "string" ? n?.data?.text || n?.data?.resultData || n?.data?.prompt : ""))
    .filter(Boolean).join("\n").trim();
  const effectivePrompt = (prompt || upstreamText || "").trim();
  // 上游音频节点的 audioUrl（翻唱时自动上传为参考）
  const upstreamAudioUrl = String(
    upstream.map((n: any) => n?.data?.audioUrl).filter((u: any) => typeof u === "string" && u)[0] || "",
  );
  const effectiveCoverAudio = (coverAudioUrl || upstreamAudioUrl || "").trim();

  useEffect(() => {
    updateNodeData(nodeId, {
      sunoAction: action, customMode, instrumental, sunoMv: mv, prompt, tags, title,
      continueClipId, continueAt, referenceClipId, coverAudioUrl, nodeKind: "music",
    });
  }, [nodeId, updateNodeData, action, customMode, instrumental, mv, prompt, tags, title, continueClipId, continueAt, referenceClipId, coverAudioUrl]);

  const clips: SunoClip[] = Array.isArray(data.sunoClips) ? data.sunoClips : [];

  const run = async () => {
    if (runningRef.current || data.loading) return;
    const { url, key, configId } = resolveSunoApiConfig(data);
    if (!url || !key) {
      updateNodeData(nodeId, { errorMessage: `请先在设置里配置 Suno 的 API（base 指向你的 newapi 站点）并绑定 ${SUNO_MODEL_NAME} 模型` });
      data.onShowToast?.("请先配置 Suno（听音）API");
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;

    let body: Record<string, any>;
    if (action === "generate") {
      const params = { customMode, instrumental, mv, prompt: effectivePrompt, tags, title };
      const err = validateSunoGenerateParams(params);
      if (err) { updateNodeData(nodeId, { errorMessage: err }); data.onShowToast?.(err); return; }
      body = buildSunoGenerateBody(params);
    } else if (action === "cover") {
      const refClipId = referenceClipId.trim();
      let refUrl = effectiveCoverAudio;
      if (!refClipId && !refUrl) {
        updateNodeData(nodeId, { errorMessage: "翻唱需要参考：填音频 URL、连一个音频节点、或填已有 clip_id" });
        return;
      }
      // 本地/私有音频 → 复用 app 的「参考媒体转公网直链」上传，换成公网 URL
      if (!refClipId && refUrl && !/^https?:\/\//i.test(refUrl)) {
        runningRef.current = true;
        try {
          updateNodeData(nodeId, { loading: true, errorMessage: undefined, statusText: "参考音频转公网直链…" });
          refUrl = await wanjuanUploadMediaToPublicUrl(refUrl, "audio", {
            uploadMode: data.seedanceUploadMode,
            tosConfig: data.tosConfig,
            qiniuConfig: data.qiniuConfig,
            customPublicUploadConfig: data.customPublicUploadConfig,
          }, undefined, (msg) => updateNodeData(nodeId, { statusText: msg }));
        } catch (error: any) {
          updateNodeData(nodeId, { loading: false, statusText: undefined, errorMessage: `参考音频转公网失败：${error?.message || error}（可在设置里配置自定义公网直链/TOS/七牛，或直接填公网音频 URL）` });
          data.onShowToast?.("参考音频转公网失败");
          runningRef.current = false;
          return;
        }
      }
      body = buildSunoReferenceBody({ referenceClipId: refClipId, referenceUrl: refUrl, mv, prompt: effectivePrompt, tags, title, instrumental });
    } else {
      if (!continueClipId.trim()) { updateNodeData(nodeId, { errorMessage: "续写需要源音轨 clip_id（从已生成结果「续写」按钮带入，或填入）" }); return; }
      body = buildSunoExtendBody({ continueClipId: continueClipId.trim(), continueAt: continueAt === "" ? null : Number(continueAt), mv, prompt: effectivePrompt, tags, title });
    }

    const itemId = `suno-${nodeId}-${Date.now()}`;
    runningRef.current = true;
    updateNodeData(nodeId, { loading: true, errorMessage: undefined, taskId: itemId, progress: 0 });
    data.updateGlobalTasks?.((items: any[]) => [
      ...items,
      {
        id: itemId, type: "audio", customOutputType: "audio", provider: "suno",
        projectId: data.projectId, nodeId, status: "running", progress: 0, createdAt: Date.now(),
        prompt: (effectivePrompt || title || "Suno 音乐").slice(0, 120),
        modelName: mv, apiConfigId: configId, apiBaseUrl: url,
        requestProfile: { requestType: "suno-newapi", submitPath: "/suno/submit/music", pollPath: "/suno/fetch", action },
      },
    ]);

    try {
      const taskId = await submitSunoMusic(url, key, body);
      if (ac.signal.aborted) return; // 提交后若已被停止，不再继续
      updateNodeData(nodeId, { remoteTaskId: taskId });
      const { clips: resultClips } = await pollSunoTask(url, key, taskId, {
        signal: ac.signal,
        onTick: (status, progress) => {
          const s = progress ? `${status} ${progress}` : status;
          const pct = Math.max(0, Math.min(99, parseInt(String(progress), 10) || 0));
          updateNodeData(nodeId, { statusText: s, progress: pct });
          data.updateGlobalTasks?.((items: any[]) => items.map((t) => (t.id === itemId ? { ...t, statusText: s, progress: pct } : t)));
        },
      });
      if (ac.signal.aborted) return; // 停止后不复活写回
      const first = resultClips.find((c) => c.audioUrl) || resultClips[0];
      const audioUrl = first?.audioUrl || "";
      updateNodeData(nodeId, {
        loading: false, errorMessage: undefined, sunoClips: resultClips,
        audioUrl, audioName: `${first?.title || title || "Suno"}.mp3`,
        text: audioUrl, resultData: resultClips, statusText: undefined,
      });
      audioUrl && data.addTransitResource?.(audioUrl, "audio", `${first?.title || title || "Suno"}.mp3`);
      data.updateGlobalTasks?.((items: any[]) => items.map((t) => (t.id === itemId ? { ...t, status: "succeeded", progress: 100, resultUrl: audioUrl } : t)));
    } catch (error: any) {
      if (ac.signal.aborted) { // 用户主动停止：静默收尾，不报错、不复活
        updateNodeData(nodeId, { loading: false, statusText: undefined });
        data.updateGlobalTasks?.((items: any[]) => items.map((t) => (t.id === itemId ? { ...t, status: "stopped" } : t)));
        return;
      }
      const msg = error?.message || "Suno 生成失败";
      updateNodeData(nodeId, { loading: false, errorMessage: msg, statusText: undefined });
      data.onShowToast?.(msg);
      data.updateGlobalTasks?.((items: any[]) => items.map((t) => (t.id === itemId ? { ...t, status: "failed", errorMsg: msg } : t)));
    } finally {
      runningRef.current = false;
      if (abortRef.current === ac) abortRef.current = null;
    }
  };

  const useClipAs = (kind: "extend" | "cover", id: string) => {
    setAction(kind);
    if (kind === "extend") setContinueClipId(id);
    else setReferenceClipId(id);
  };

  const textareaPlaceholder = upstreamText
    ? "已连接文本节点作为输入；也可在此覆盖"
    : customMode
      ? (instrumental ? "纯伴奏自定义模式可留空歌词" : "输入歌词（可带 [Verse]/[Chorus] 结构），或连接文本节点")
      : "输入歌曲描述（AI 自动写词），或连接文本节点";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: 400 }}>
      <div style={{ position: "relative", background: COL.card, borderRadius: 12, border: `1px solid ${data.selected ? COL.accent : COL.border}`, boxShadow: "0 10px 25px rgba(0,0,0,0.4)" }}>
        <WanJuanNodeHandle type="target" position={Position.Left} />
        <WanJuanNodeHandle type="source" position={Position.Right} />

        {/* 头部 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: COL.header, borderBottom: `1px solid ${COL.border}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: COL.textMain }}>
            <span style={{ color: COL.accent }}>♫</span> 音乐节点 · Suno
          </div>
          {data.loading && <RefreshCw size={14} className="animate-spin" style={{ color: COL.accent }} />}
        </div>

        {/* 主体 */}
        <div className="nodrag nowheel" style={{ padding: 12, background: COL.panel, display: "flex", flexDirection: "column", gap: 10, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }} onClick={(e) => e.stopPropagation()}>
          {/* 动作 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {ACTIONS.map((a) => (
              <button key={a.key} className="nodrag" onClick={() => setAction(a.key)} style={uiBtn(action === a.key)}>{a.label}</button>
            ))}
          </div>

          {action === "extend" && (
            <div style={uiPanel}>
              <span style={uiLabel}>源音轨 clip_id（从已生成结果「续写」按钮自动带入）</span>
              <input className="nodrag" style={uiInput} value={continueClipId} onChange={(e) => setContinueClipId(e.target.value)} placeholder="continue_clip_id" />
              <input className="nodrag" style={uiInput} value={continueAt} onChange={(e) => setContinueAt(e.target.value)} placeholder="从第几秒开始续写 continue_at（秒，可选）" />
            </div>
          )}

          {action === "cover" && (
            <div style={uiPanel}>
              <span style={uiLabel}>参考音频：公网 URL 或本地音频都行（本地会自动转公网直链），也可连音频节点</span>
              <input className="nodrag" style={uiInput} value={coverAudioUrl} onChange={(e) => setCoverAudioUrl(e.target.value)} placeholder={upstreamAudioUrl ? "已连上游音频；也可填音频 URL 覆盖" : "音频 URL（公网/本地皆可）"} />
              {!coverAudioUrl && upstreamAudioUrl && (
                <span style={{ fontSize: 10, color: COL.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>将参考上游音频：{upstreamAudioUrl}</span>
              )}
              {!referenceClipId && effectiveCoverAudio && !/^https?:\/\//i.test(effectiveCoverAudio) && (
                <span style={{ fontSize: 10, color: COL.textFaint }}>本地/私有音频将用「设置→上传」的公网直链配置自动上传后再翻唱</span>
              )}
              <span style={{ fontSize: 10, color: COL.textFaint }}>或直接填 Suno 内已有的 clip_id（填了优先用它）：</span>
              <input className="nodrag" style={uiInput} value={referenceClipId} onChange={(e) => setReferenceClipId(e.target.value)} placeholder="reference_clip_id（可选）" />
            </div>
          )}

          {/* 模式 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button className="nodrag" onClick={() => setCustomMode(false)} style={uiBtn(!customMode)}>灵感模式</button>
            <button className="nodrag" onClick={() => setCustomMode(true)} style={uiBtn(customMode)}>自定义</button>
          </div>

          {/* 模型版本 mv */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={uiLabel}>版本</span>
            <select className="nodrag" style={{ ...uiInput, flex: 1, width: "auto" }} value={mv} onChange={(e) => setMv(e.target.value)}>
              {SUNO_MV_MODELS.map((m) => (<option key={m} value={m}>{SUNO_MV_LABELS[m] || m}</option>))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COL.textMain, whiteSpace: "nowrap" }}>
              <input type="checkbox" className="nodrag" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} /> 纯伴奏
            </label>
          </div>

          {/* 歌词/描述 */}
          <textarea className="nodrag" style={{ ...uiInput, height: 92, resize: "none" }} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={textareaPlaceholder} />

          {/* 风格 tags + 标题（可选） */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="nodrag" style={uiInput} value={tags} onChange={(e) => setTags(e.target.value)} placeholder={customMode ? "风格 tags，如 edm, cinematic（必填）" : "风格 tags，如 pop（可选）"} />
            <button className="nodrag" onClick={() => setShowAdvanced((x) => !x)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COL.textDim, background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", padding: 0 }}>
              <Settings2 size={12} /> 标题（可选） {showAdvanced ? "▲" : "▼"}
            </button>
            {showAdvanced && (
              <input className="nodrag" style={uiInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题 title（可选）" />
            )}
          </div>

          {/* 生成按钮 */}
          <button className="nodrag" onClick={run} disabled={!!data.loading} style={{ padding: "9px 12px", borderRadius: 6, fontSize: 14, fontWeight: 600, border: "none", cursor: data.loading ? "default" : "pointer", background: data.loading ? COL.btnOff : COL.accent, color: data.loading ? COL.textFaint : COL.onAccent }}>
            {data.loading ? (data.statusText ? `生成中… ${data.statusText}` : "生成中…") : action === "extend" ? "续写" : action === "cover" ? "翻唱生成" : "生成音乐"}
          </button>

          {/* 错误 */}
          {data.errorMessage && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#f87171" }}>
              <CircleAlert size={13} style={{ marginTop: 2, flexShrink: 0 }} /> <span>{data.errorMessage}</span>
            </div>
          )}

          {/* 结果 */}
          {clips.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {clips.map((c, i) => (
                <div key={c.id || i} style={{ border: `1px solid ${COL.border}`, borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 6, background: COL.resultBg }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12, color: COL.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title || `曲目 ${i + 1}`}{c.duration ? ` · ${Math.round(c.duration)}s` : ""}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button className="nodrag" title="用作续写源" onClick={() => useClipAs("extend", c.id)} style={{ fontSize: 10, color: COL.accent, background: "none", border: "none", cursor: "pointer" }}>续写</button>
                      <button className="nodrag" title="用作翻唱参考" onClick={() => useClipAs("cover", c.id)} style={{ fontSize: 10, color: COL.accent, background: "none", border: "none", cursor: "pointer" }}>翻唱</button>
                      {c.audioUrl && (<a title="下载" href={c.audioUrl} download style={{ color: COL.textDim, display: "flex" }}><Download size={13} /></a>)}
                    </div>
                  </div>
                  {c.audioUrl && <audio controls src={c.audioUrl} className="nodrag" style={{ width: "100%", height: 32 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
