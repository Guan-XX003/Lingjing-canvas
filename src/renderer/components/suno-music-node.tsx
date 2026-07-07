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
import { memo as reactMemo, useEffect, useRef, useState } from "react";
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
  validateSunoGenerateParams,
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

const inputCls =
  "w-full bg-[#111] border border-[#333] rounded p-2 text-xs text-gray-200 placeholder-gray-500 focus:border-blue-500 outline-none";
const labelCls = "text-[11px] text-gray-400";

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
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const runningRef = useRef(false);

  // 上游文本节点内容（作为歌词/描述来源）
  const connections = useNodeConnections({ handleType: "target" });
  const upstream: any[] = useNodesData(connections?.map((c: any) => c.source) || []) || [];
  const upstreamText = upstream
    .map((n: any) => n?.data?.text || n?.data?.resultData || n?.data?.prompt || "")
    .filter(Boolean)
    .join("\n")
    .trim();
  const effectivePrompt = (prompt || upstreamText || "").trim();

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
      nodeKind: "music",
    });
  }, [
    nodeId, updateNodeData, action, customMode, instrumental, model, prompt, style, title,
    negativeTags, vocalGender, styleWeight, weirdness, audioWeight, audioId, continueAt, defaultParamFlag,
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

  return (
    <div className={`flex flex-col group/node transition-all w-[380px] wanjuan-suno-node ${data.selected ? "ring-2 ring-yellow-500" : ""}`}>
      <div className="relative bg-[#1c1c1c] rounded-xl overflow-visible border border-[#333] shadow-xl">
        <WanJuanNodeHandle type="target" position={Position.Left} />
        <WanJuanNodeHandle type="source" position={Position.Right} />

        {/* 头部 */}
        <div className="flex justify-between items-center px-3 py-2 bg-[#222] border-b border-[#2a2a2a] rounded-t-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
            <span className="text-yellow-400">♫</span> 音乐节点 · Suno
          </div>
          {data.loading && <RefreshCw size={14} className="animate-spin text-blue-400" />}
        </div>

        {/* 主体 */}
        <div className="p-3 bg-[#1a1a1a] flex flex-col gap-2.5 nodrag rounded-b-xl" onClick={(e) => e.stopPropagation()}>
          {/* 动作 */}
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAction(a.key)}
                className={`px-2 py-1.5 rounded text-xs ${action === a.key ? "bg-yellow-600 text-white" : "bg-[#2a2a2a] text-gray-300"}`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {action === "extend" && (
            <div className="flex flex-col gap-1.5 border border-[#333] rounded p-2">
              <span className={labelCls}>源音轨 audioId（从已生成结果「续写」按钮自动带入）</span>
              <input className={inputCls} value={audioId} onChange={(e) => setAudioId(e.target.value)} placeholder="audioId" />
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input type="checkbox" checked={defaultParamFlag} onChange={(e) => setDefaultParamFlag(e.target.checked)} />
                自定义续写参数（否则沿用原曲）
              </label>
              {defaultParamFlag && (
                <input className={inputCls} value={continueAt} onChange={(e) => setContinueAt(e.target.value)} placeholder="从第几秒开始续写 continueAt（秒）" />
              )}
            </div>
          )}

          {/* 模式 + 模型 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCustomMode(false)}
              className={`px-2 py-1.5 rounded text-xs ${!customMode ? "bg-blue-600 text-white" : "bg-[#2a2a2a] text-gray-300"}`}
            >
              灵感模式
            </button>
            <button
              onClick={() => setCustomMode(true)}
              className={`px-2 py-1.5 rounded text-xs ${customMode ? "bg-blue-600 text-white" : "bg-[#2a2a2a] text-gray-300"}`}
            >
              自定义
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className={labelCls}>模型</span>
            <select className={`${inputCls} flex-1`} value={model} onChange={(e) => setModel(e.target.value)}>
              {SUNO_MODELS.map((m) => (
                <option key={m} value={m}>{SUNO_MODEL_LABELS[m] || m}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-gray-300 whitespace-nowrap">
              <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} />
              纯伴奏
            </label>
          </div>

          {/* 歌词/描述 */}
          <textarea
            className={`${inputCls} h-24 resize-none`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              upstreamText
                ? "已连接文本节点作为输入；也可在此覆盖"
                : customMode
                  ? (instrumental ? "纯伴奏自定义模式可留空歌词" : "输入歌词，或连接文本节点")
                  : "输入歌曲描述（AI 自动写词），或连接文本节点"
            }
          />

          {/* 自定义模式：风格 + 标题 */}
          {customMode && (
            <div className="flex flex-col gap-2">
              <input className={inputCls} value={style} onChange={(e) => setStyle(e.target.value)} placeholder="风格/曲风 style，如 citypop, jazz（必填）" />
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题 title（必填）" />
            </div>
          )}

          {/* 高级参数 */}
          <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 self-start" onClick={() => setShowAdvanced((v) => !v)}>
            <Settings2 size={12} /> 高级参数 {showAdvanced ? "▲" : "▼"}
          </button>
          {showAdvanced && (
            <div className="flex flex-col gap-2 border border-[#333] rounded p-2">
              <input className={inputCls} value={negativeTags} onChange={(e) => setNegativeTags(e.target.value)} placeholder="负向标签 negativeTags（要排除的风格）" />
              <div className="flex items-center gap-2">
                <span className={labelCls}>人声</span>
                <select className={`${inputCls} flex-1`} value={vocalGender} onChange={(e) => setVocalGender(e.target.value)}>
                  <option value="">默认</option>
                  <option value="m">男声</option>
                  <option value="f">女声</option>
                </select>
              </div>
              <WeightSlider label="风格权重" value={styleWeight} onChange={setStyleWeight} />
              <WeightSlider label="怪异度" value={weirdness} onChange={setWeirdness} />
              <WeightSlider label="音频权重" value={audioWeight} onChange={setAudioWeight} />
            </div>
          )}

          {/* 生成按钮 */}
          <button
            onClick={run}
            disabled={!!data.loading}
            className={`px-3 py-2 rounded text-sm font-medium ${data.loading ? "bg-[#333] text-gray-500" : "bg-yellow-600 hover:bg-yellow-500 text-white"}`}
          >
            {data.loading ? (data.statusText ? `生成中… ${data.statusText}` : "生成中…") : action === "extend" ? "续写" : "生成音乐"}
          </button>

          {/* 错误 */}
          {data.errorMessage && (
            <div className="flex items-start gap-1.5 text-xs text-red-400">
              <CircleAlert size={13} className="mt-0.5 shrink-0" /> <span>{data.errorMessage}</span>
            </div>
          )}

          {/* 结果 */}
          {tracks.length > 0 && (
            <div className="flex flex-col gap-2">
              {tracks.map((t, i) => (
                <div key={t.id || i} className="border border-[#333] rounded p-2 flex flex-col gap-1.5 bg-[#151515]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-200 truncate">{t.title || `曲目 ${i + 1}`}{t.duration ? ` · ${Math.round(t.duration)}s` : ""}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button title="用作续写源" className="text-[10px] text-yellow-400 hover:text-yellow-300" onClick={() => useAsExtendSource(t.id)}>续写</button>
                      {t.audioUrl && (
                        <a title="下载" href={t.audioUrl} download className="text-gray-400 hover:text-gray-200"><Download size={13} /></a>
                      )}
                    </div>
                  </div>
                  {t.audioUrl && <audio controls src={t.audioUrl} className="w-full h-8" />}
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
    <div className="flex items-center gap-2">
      <span className={`${labelCls} w-14 shrink-0`}>{label}</span>
      <input
        type="range" min={0} max={1} step={0.05}
        value={value === "" ? 0.5 : Number(value)}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      <span className="text-[11px] text-gray-400 w-16 text-right">{value === "" ? "默认" : Number(value).toFixed(2)}</span>
      {value !== "" && (
        <button className="text-[10px] text-gray-500 hover:text-gray-300" onClick={() => onChange("")}>清</button>
      )}
    </div>
  );
}
