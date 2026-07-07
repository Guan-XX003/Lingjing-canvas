/**
 * 独立音乐节点（Suno / sunoapi.org）。
 *
 * 从原共用的 TTS/音乐节点里拆出来，只做音乐，接 sunoapi.org 新版接口
 * （lib/suno-music-api）。支持：
 *  - 生成：灵感模式(仅描述，AI 写词) / 自定义模式(歌词+风格+标题)
 *  - 全部生成参数：模型版本 V4~V5_5、纯伴奏、负向标签、人声性别、
 *    风格权重 / 怪异度 / 音频权重、人声/风格 persona
 *  - 续写(extend)：在已生成音轨上从某秒续写
 *
 * API 配置沿用「听音 API」绑定：把 suno 模型绑定到一个 url=https://api.sunoapi.org
 * 的配置即可（或设默认听音配置）。桌面端用轮询取结果（callBackUrl 传占位）。
 */
import { memo as reactMemo, useEffect, useRef, useState, type CSSProperties } from "react";
import { Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { CircleAlert, RefreshCw, Download, Play, Sparkles, Settings2 } from "lucide-react";
import { resolveModelApiBindingIdHelper } from "../lib/model-binding";
import { WanJuanNodeHandle } from "./render-mode";
import {
  SUNO_MODELS,
  SUNO_DEFAULT_MODEL,
  SUNO_ENDPOINTS,
  buildSunoGenerateBody,
  buildSunoExtendBody,
  buildSunoUploadCoverBody,
  validateSunoGenerateParams,
  validateSunoUploadCoverParams,
  submitSunoTask,
  pollSunoTask,
  type SunoTrack,
} from "../lib/suno-music-api";

declare const chrome: any;

const SUNO_MODEL_LABELS: Record<string, string> = {
  V5_5: "V5.5（最新）",
  V5: "V5",
  V4_5PLUS: "V4.5+",
  V4_5ALL: "V4.5 All",
  V4_5: "V4.5",
  V4: "V4",
};

const ACTIONS = [
  { key: "generate", label: "生成" },
  { key: "extend", label: "续写" },
  { key: "cover", label: "翻唱" },
] as const;
type ActionKey = (typeof ACTIONS)[number]["key"];

/** 解析音乐 API 配置（base url + key）：优先模型绑定的配置，其次匹配 suno/聚合 的默认配置，再退到听音默认 */
function resolveSunoApiConfig(data: any): { url: string; key: string; configId: string } {
  const configs: any[] = Array.isArray(data?.apiConfigs) ? data.apiConfigs : [];
  const usable = configs.filter((c) => c?.url && c?.key);
  const boundId = resolveModelApiBindingIdHelper(data?.audioModelApiBindings, "suno-music", "");
  const bound = boundId ? configs.find((c) => c.id === boundId) : null;
  const preferred =
    bound ||
    usable.find((c) => /sunoapi|suno|zhichuang|智创|聚合|lconai/i.test(`${c?.id || ""} ${c?.name || ""} ${c?.url || ""}`)) ||
    usable.find((c) => c?.id === "default") ||
    usable[0] ||
    null;
  return {
    url: preferred?.url || data?.audioApiUrl || "",
    key: preferred?.key || data?.audioApiKey || "",
    configId: preferred?.id || "",
  };
}

// 全部内联样式：项目的 app.css 是固定的 Tailwind 产物、不随构建重新生成，
// 新组件用的类会静默失效（间距塌陷=挤在一起），故这里不依赖 Tailwind。
const COL = {
  card: "#1c1c1c", panel: "#1a1a1a", input: "#111", border: "#333",
  btnOff: "#2a2a2a", yellow: "#eab308", blue: "#3b82f6",
  textMain: "#e5e7eb", textDim: "#9aa0aa", textFaint: "#6b7280",
};
const uiInput: CSSProperties = {
  width: "100%", boxSizing: "border-box", background: COL.input, border: `1px solid ${COL.border}`,
  borderRadius: 6, padding: "7px 9px", fontSize: 12, lineHeight: 1.4, color: COL.textMain,
  outline: "none", userSelect: "text",
};
const uiLabel: CSSProperties = { fontSize: 11, color: COL.textDim, whiteSpace: "nowrap" };
const uiBtn = (active: boolean, activeColor = COL.yellow): CSSProperties => ({
  padding: "6px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none",
  background: active ? activeColor : COL.btnOff, color: active ? "#fff" : "#d1d5db", whiteSpace: "nowrap",
});
const uiPanel: CSSProperties = {
  display: "flex", flexDirection: "column", gap: 6, border: `1px solid ${COL.border}`, borderRadius: 6, padding: 8,
};

export const WanJuanSunoMusicNode = reactMemo(({ id: nodeId, data: nodeData }: any) => {
  const { updateNodeData } = useReactFlow();
  const data = nodeData || {};

  const [action, setAction] = useState<ActionKey>(data.sunoAction || "generate");
  const [customMode, setCustomMode] = useState<boolean>(data.customMode ?? true);
  const [instrumental, setInstrumental] = useState<boolean>(!!data.instrumental);
  const [model, setModel] = useState<string>(data.sunoModelVersion || SUNO_DEFAULT_MODEL);
  const [prompt, setPrompt] = useState<string>(data.prompt || "");
  const [style, setStyle] = useState<string>(data.style || "");
  const [title, setTitle] = useState<string>(data.title || "");
  const [negativeTags, setNegativeTags] = useState<string>(data.negativeTags || "");
  const [vocalGender, setVocalGender] = useState<string>(data.vocalGender || "");
  const [styleWeight, setStyleWeight] = useState<string>(data.styleWeight ?? "");
  const [weirdness, setWeirdness] = useState<string>(data.weirdnessConstraint ?? "");
  const [audioWeight, setAudioWeight] = useState<string>(data.audioWeight ?? "");
  const [audioId, setAudioId] = useState<string>(data.extendAudioId || "");
  const [continueAt, setContinueAt] = useState<string>(data.continueAt ?? "");
  const [defaultParamFlag, setDefaultParamFlag] = useState<boolean>(data.extendCustom ?? false);
  const [uploadUrl, setUploadUrl] = useState<string>(data.coverUploadUrl || "");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const runningRef = useRef(false);

  // 上游文本节点内容（作为歌词/描述来源）
  const connections = useNodeConnections({ handleType: "target" });
  const upstream: any[] = useNodesData(connections?.map((c: any) => c.source) || []) || [];
  const upstreamText = upstream
    .map((n: any) => (typeof (n?.data?.text || n?.data?.resultData || n?.data?.prompt) === "string" ? n?.data?.text || n?.data?.resultData || n?.data?.prompt : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
  const effectivePrompt = (prompt || upstreamText || "").trim();
  // 上游音频节点的 audioUrl 作为翻唱参考音频
  const upstreamAudioUrl = String(
    upstream.map((n: any) => n?.data?.audioUrl).filter((u: any) => typeof u === "string" && u)[0] || "",
  );
  const effectiveUploadUrl = (uploadUrl || upstreamAudioUrl || "").trim();

  // 把可编辑参数回写节点 data（持久化）
  useEffect(() => {
    updateNodeData(nodeId, {
      sunoAction: action,
      customMode,
      instrumental,
      sunoModelVersion: model,
      prompt,
      style,
      title,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint: weirdness,
      audioWeight,
      extendAudioId: audioId,
      continueAt,
      extendCustom: defaultParamFlag,
      coverUploadUrl: uploadUrl,
      nodeKind: "music",
    });
  }, [
    nodeId, updateNodeData, action, customMode, instrumental, model, prompt, style, title,
    negativeTags, vocalGender, styleWeight, weirdness, audioWeight, audioId, continueAt, defaultParamFlag, uploadUrl,
  ]);

  const tracks: SunoTrack[] = Array.isArray(data.sunoTracks) ? data.sunoTracks : [];

  const run = async () => {
    if (runningRef.current || data.loading) return;
    const { url, key, configId } = resolveSunoApiConfig(data);
    if (!url || !key) {
      updateNodeData(nodeId, { errorMessage: "请先在设置里配置听音 API（base 指向 https://api.sunoapi.org）并绑定 Suno 模型" });
      data.onShowToast?.("请先配置 Suno（听音）API");
      return;
    }

    let body: Record<string, any>;
    let path: string;
    if (action === "generate") {
      const params = {
        customMode, instrumental, model, prompt: effectivePrompt, style, title, negativeTags,
        vocalGender: (vocalGender as "m" | "f" | ""),
        styleWeight: styleWeight === "" ? null : Number(styleWeight),
        weirdnessConstraint: weirdness === "" ? null : Number(weirdness),
        audioWeight: audioWeight === "" ? null : Number(audioWeight),
      };
      const err = validateSunoGenerateParams(params);
      if (err) {
        updateNodeData(nodeId, { errorMessage: err });
        data.onShowToast?.(err);
        return;
      }
      body = buildSunoGenerateBody(params);
      path = SUNO_ENDPOINTS.generate;
    } else if (action === "cover") {
      const params = {
        uploadUrl: effectiveUploadUrl,
        customMode, instrumental, model, prompt: effectivePrompt, style, title, negativeTags,
        vocalGender: (vocalGender as "m" | "f" | ""),
        styleWeight: styleWeight === "" ? null : Number(styleWeight),
        weirdnessConstraint: weirdness === "" ? null : Number(weirdness),
        audioWeight: audioWeight === "" ? null : Number(audioWeight),
      };
      const err = validateSunoUploadCoverParams(params);
      if (err) {
        updateNodeData(nodeId, { errorMessage: err });
        data.onShowToast?.(err);
        return;
      }
      body = buildSunoUploadCoverBody(params);
      path = SUNO_ENDPOINTS.uploadCover;
    } else {
      if (!audioId.trim()) {
        updateNodeData(nodeId, { errorMessage: "续写需要源音轨 audioId（从已生成结果里取，或填入）" });
        return;
      }
      body = buildSunoExtendBody({
        audioId: audioId.trim(), defaultParamFlag, model, prompt: effectivePrompt, style, title,
        continueAt: continueAt === "" ? null : Number(continueAt),
        negativeTags, vocalGender: (vocalGender as "m" | "f" | ""),
        styleWeight: styleWeight === "" ? null : Number(styleWeight),
        weirdnessConstraint: weirdness === "" ? null : Number(weirdness),
        audioWeight: audioWeight === "" ? null : Number(audioWeight),
      });
      path = SUNO_ENDPOINTS.extend;
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
        modelName: model, apiConfigId: configId, apiBaseUrl: url,
        requestProfile: { requestType: "suno-music", submitPath: path, pollPath: SUNO_ENDPOINTS.recordInfo, action },
      },
    ]);

    try {
      const taskId = await submitSunoTask(url, key, path, body);
      updateNodeData(nodeId, { remoteTaskId: taskId });
      data.updateGlobalTasks?.((items: any[]) =>
        items.map((t) => (t.id === itemId ? { ...t, remoteTaskId: taskId } : t)),
      );
      const { tracks: resultTracks } = await pollSunoTask(url, key, taskId, {
        onTick: (status) => {
          updateNodeData(nodeId, { statusText: status });
          data.updateGlobalTasks?.((items: any[]) =>
            items.map((t) => (t.id === itemId ? { ...t, statusText: status } : t)),
          );
        },
      });
      const first = resultTracks[0];
      const audioUrl = first?.audioUrl || "";
      updateNodeData(nodeId, {
        loading: false, errorMessage: undefined, sunoTracks: resultTracks,
        audioUrl, audioName: `${first?.title || title || "Suno"}.mp3`,
        text: audioUrl, resultData: resultTracks, statusText: undefined,
      });
      audioUrl && data.addTransitResource?.(audioUrl, "audio", `${first?.title || title || "Suno"}.mp3`);
      data.updateGlobalTasks?.((items: any[]) =>
        items.map((t) => (t.id === itemId ? { ...t, status: "succeeded", progress: 100, resultUrl: audioUrl } : t)),
      );
    } catch (error: any) {
      const msg = error?.message || "Suno 生成失败";
      updateNodeData(nodeId, { loading: false, errorMessage: msg, statusText: undefined });
      data.onShowToast?.(msg);
      data.updateGlobalTasks?.((items: any[]) =>
        items.map((t) => (t.id === itemId ? { ...t, status: "failed", errorMsg: msg } : t)),
      );
    } finally {
      runningRef.current = false;
    }
  };

  const useAsExtendSource = (id: string) => {
    setAction("extend");
    setAudioId(id);
  };

  const textareaPlaceholder = upstreamText
    ? "已连接文本节点作为输入；也可在此覆盖"
    : customMode
      ? (instrumental ? "纯伴奏自定义模式可留空歌词" : "输入歌词，或连接文本节点")
      : "输入歌曲描述（AI 自动写词），或连接文本节点";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: 400 }}>
      <div style={{ position: "relative", background: COL.card, borderRadius: 12, border: `1px solid ${data.selected ? COL.yellow : COL.border}`, boxShadow: "0 10px 25px rgba(0,0,0,0.4)" }}>
        <WanJuanNodeHandle type="target" position={Position.Left} />
        <WanJuanNodeHandle type="source" position={Position.Right} />

        {/* 头部 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#222", borderBottom: "1px solid #2a2a2a", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: COL.textMain }}>
            <span style={{ color: COL.yellow }}>♫</span> 音乐节点 · Suno
          </div>
          {data.loading && <RefreshCw size={14} className="animate-spin" style={{ color: "#60a5fa" }} />}
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
              <span style={uiLabel}>源音轨 audioId（从已生成结果「续写」按钮自动带入）</span>
              <input className="nodrag" style={uiInput} value={audioId} onChange={(e) => setAudioId(e.target.value)} placeholder="audioId" />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#d1d5db" }}>
                <input type="checkbox" className="nodrag" checked={defaultParamFlag} onChange={(e) => setDefaultParamFlag(e.target.checked)} />
                自定义续写参数（否则沿用原曲）
              </label>
              {defaultParamFlag && (
                <input className="nodrag" style={uiInput} value={continueAt} onChange={(e) => setContinueAt(e.target.value)} placeholder="从第几秒开始续写 continueAt（秒）" />
              )}
            </div>
          )}

          {action === "cover" && (
            <div style={uiPanel}>
              <span style={uiLabel}>参考音频（公网 URL，≤8 分钟；可连上游音频节点自动带入）</span>
              <input className="nodrag" style={uiInput} value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder={upstreamAudioUrl ? "已从上游音频节点带入；也可在此覆盖" : "https://.../reference.mp3"} />
              {!uploadUrl && upstreamAudioUrl && (
                <span style={{ fontSize: 10, color: COL.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>将使用上游音频：{upstreamAudioUrl}</span>
              )}
              {effectiveUploadUrl && /^file:|^blob:|localhost|127\.0\.0\.1|wanjuan-media:/i.test(effectiveUploadUrl) && (
                <span style={{ fontSize: 10, color: "#fbbf24" }}>⚠ 这看起来是本地/私有地址，Suno 取不到——参考音频必须是公网可访问的 http(s) URL</span>
              )}
            </div>
          )}

          {/* 模式 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button className="nodrag" onClick={() => setCustomMode(false)} style={uiBtn(!customMode, COL.blue)}>灵感模式</button>
            <button className="nodrag" onClick={() => setCustomMode(true)} style={uiBtn(customMode, COL.blue)}>自定义</button>
          </div>

          {/* 模型 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={uiLabel}>模型</span>
            <select className="nodrag" style={{ ...uiInput, flex: 1, width: "auto" }} value={model} onChange={(e) => setModel(e.target.value)}>
              {SUNO_MODELS.map((m) => (<option key={m} value={m}>{SUNO_MODEL_LABELS[m] || m}</option>))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#d1d5db", whiteSpace: "nowrap" }}>
              <input type="checkbox" className="nodrag" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} /> 纯伴奏
            </label>
          </div>

          {/* 歌词/描述 */}
          <textarea className="nodrag" style={{ ...uiInput, height: 92, resize: "none" }} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={textareaPlaceholder} />

          {/* 自定义模式：风格 + 标题 */}
          {customMode && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="nodrag" style={uiInput} value={style} onChange={(e) => setStyle(e.target.value)} placeholder="风格/曲风 style，如 citypop, jazz（必填）" />
              <input className="nodrag" style={uiInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题 title（必填）" />
            </div>
          )}

          {/* 高级参数 */}
          <button className="nodrag" onClick={() => setShowAdvanced((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COL.textDim, background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", padding: 0 }}>
            <Settings2 size={12} /> 高级参数 {showAdvanced ? "▲" : "▼"}
          </button>
          {showAdvanced && (
            <div style={{ ...uiPanel, gap: 8 }}>
              <input className="nodrag" style={uiInput} value={negativeTags} onChange={(e) => setNegativeTags(e.target.value)} placeholder="负向标签 negativeTags（要排除的风格）" />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={uiLabel}>人声</span>
                <select className="nodrag" style={{ ...uiInput, flex: 1, width: "auto" }} value={vocalGender} onChange={(e) => setVocalGender(e.target.value)}>
                  <option value="">默认</option><option value="m">男声</option><option value="f">女声</option>
                </select>
              </div>
              <WeightSlider label="风格权重" value={styleWeight} onChange={setStyleWeight} />
              <WeightSlider label="怪异度" value={weirdness} onChange={setWeirdness} />
              <WeightSlider label="音频权重" value={audioWeight} onChange={setAudioWeight} />
            </div>
          )}

          {/* 生成按钮 */}
          <button className="nodrag" onClick={run} disabled={!!data.loading} style={{ padding: "9px 12px", borderRadius: 6, fontSize: 14, fontWeight: 600, border: "none", cursor: data.loading ? "default" : "pointer", background: data.loading ? "#333" : COL.yellow, color: data.loading ? COL.textFaint : "#fff" }}>
            {data.loading ? (data.statusText ? `生成中… ${data.statusText}` : "生成中…") : action === "extend" ? "续写" : action === "cover" ? "翻唱生成" : "生成音乐"}
          </button>

          {/* 错误 */}
          {data.errorMessage && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#f87171" }}>
              <CircleAlert size={13} style={{ marginTop: 2, flexShrink: 0 }} /> <span>{data.errorMessage}</span>
            </div>
          )}

          {/* 结果 */}
          {tracks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tracks.map((t, i) => (
                <div key={t.id || i} style={{ border: `1px solid ${COL.border}`, borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 6, background: "#151515" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12, color: COL.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title || `曲目 ${i + 1}`}{t.duration ? ` · ${Math.round(t.duration)}s` : ""}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button className="nodrag" title="用作续写源" onClick={() => useAsExtendSource(t.id)} style={{ fontSize: 10, color: COL.yellow, background: "none", border: "none", cursor: "pointer" }}>续写</button>
                      {t.audioUrl && (<a title="下载" href={t.audioUrl} download style={{ color: COL.textDim, display: "flex" }}><Download size={13} /></a>)}
                    </div>
                  </div>
                  {t.audioUrl && <audio controls src={t.audioUrl} className="nodrag" style={{ width: "100%", height: 32 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function WeightSlider({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ ...uiLabel, width: 56, flexShrink: 0 }}>{label}</span>
      <input
        type="range" min={0} max={1} step={0.05}
        value={value === "" ? 0.5 : Number(value)}
        onChange={(e) => onChange(e.target.value)}
        className="nodrag"
        style={{ flex: 1, minWidth: 0 }}
      />
      <span style={{ fontSize: 11, color: COL.textDim, width: 40, textAlign: "right" }}>{value === "" ? "默认" : Number(value).toFixed(2)}</span>
      {value !== "" && (
        <button className="nodrag" onClick={() => onChange("")} style={{ fontSize: 10, color: COL.textFaint, background: "none", border: "none", cursor: "pointer" }}>清</button>
      )}
    </div>
  );
}
