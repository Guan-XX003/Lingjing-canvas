import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import {
  FileUp,
  ImageIcon,
  LayoutGrid,
  Link2,
  ListPlus,
  Mic,
  MonitorPlay,
  Music,
  Puzzle,
  Sparkles,
  Type,
  Upload,
  WandSparkles,
  Wrench,
} from "lucide-react";
import { WanJuanResourcePicker } from "./resource-picker";
import { wanjuanResourceKind } from "../lib/resource";

const PRIMARY_ITEMS = [
  { type: "textNode", label: "文本", icon: Type, color: "text-green-400", data: { text: "" } },
  { type: "promptNode", label: "生图", icon: ImageIcon, color: "text-blue-400", data: { prompt: "" } },
  { type: "videoNode", label: "视频", icon: MonitorPlay, color: "text-purple-400", data: { prompt: "" } },
  { type: "seedanceNode", label: "即梦", icon: Sparkles, color: "text-blue-500", data: { prompt: "" } },
  { type: "audioNode", label: "音频", icon: Mic, color: "text-yellow-400", data: {} },
  { type: "musicNode", label: "音乐", icon: Music, color: "text-orange-400", data: { mode: "suno", nodeKind: "music", prompt: "" } },
  { type: "customNode", label: "万能", icon: Puzzle, color: "text-pink-400", data: {} },
];

const TOOL_GROUPS = [
  {
    id: "format",
    label: "格式转换",
    icon: ListPlus,
    color: "text-orange-400",
    items: [
      { type: "textConcatNode", label: "文本拼接", icon: ListPlus },
      { type: "urlToImageNode", label: "网址转图片", icon: Link2 },
      { type: "fileToLinkNode", label: "文件转网址", icon: FileUp },
    ],
  },
  {
    id: "tools",
    label: "常用工具",
    icon: Wrench,
    color: "text-green-400",
    items: [
      { type: "gridMergeNode", label: "九宫格拼图", icon: Puzzle },
      { type: "gridSplitNode", label: "九宫格切分", icon: LayoutGrid },
      { type: "videoExtractNode", label: "视频抽帧", icon: MonitorPlay },
    ],
  },
  {
    id: "extensions",
    label: "拓展功能",
    icon: WandSparkles,
    color: "text-pink-400",
    items: [
      { type: "videoFaceBlurNode", label: "视频人脸打码", icon: MonitorPlay },
      { type: "qwenTtsCloneNode", label: "Qwen-TTS 语音生成", icon: Mic },
      { type: "realEsrganVideoNode", label: "本地视频超分", icon: Sparkles },
    ],
  },
];

const i18nRuntime = () => (globalThis as any).wanjuanI18nRuntime;
const subscribeI18n = (listener: () => void) => i18nRuntime()?.subscribe?.(listener) || (() => {});
const i18nLanguage = () => i18nRuntime()?.getLanguage?.() || "zh-CN";

export function WanJuanCanvasBottomDock({
  createNodeAt,
  fileInputRef,
  nodes,
  resources,
  screenToFlowPosition,
  wrapperRef,
}: any) {
  useSyncExternalStore(subscribeI18n, i18nLanguage, () => "zh-CN");
  const runtime = i18nRuntime();
  const t = (text: string) => runtime?.t?.(text) || text;
  const tf = (text: string, values: Record<string, unknown>) =>
    runtime?.format?.(text, values) ||
    text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => values[key] == null ? match : String(values[key]));
  const [openPanel, setOpenPanel] = useState<"tools" | "resources" | null>(null);
  const [activeToolGroup, setActiveToolGroup] = useState("format");
  const dockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) setOpenPanel(null);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, []);

  const centerPosition = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const stagger = (Number(nodes?.length || 0) % 5) * 18;
    return screenToFlowPosition({
      x: (rect?.left || 0) + (rect?.width || window.innerWidth) / 2 + stagger,
      y: (rect?.top || 0) + (rect?.height || window.innerHeight) / 2 + stagger,
    });
  };
  const create = (type: string, data: any = {}) => {
    createNodeAt(type, centerPosition(), data);
    setOpenPanel(null);
  };
  const beginDrag = (event: React.DragEvent, item: any) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-wanjuan-node", JSON.stringify({ type: item.type, data: item.data || {} }));
  };
  const selectResource = (resource: any) => {
    const kind = wanjuanResourceKind(resource);
    const url = resource.url || resource.localPath || resource.path || "";
    const label = resource.pageTitle || resource.originalName || resource.filename || "素材";
    if (kind === "text") create("textNode", { text: url, label });
    else if (kind === "video") create("imageNode", { imageUrl: url, label, originalName: label, sourceOrigin: "external-upload", mediaKind: "video" });
    else if (kind === "audio") create("audioNode", { audioUrl: url, label, originalName: label, sourceOrigin: "external-upload" });
    else create("imageNode", { imageUrl: url, label, originalName: label, sourceOrigin: "external-upload", mediaKind: "image" });
  };
  const activeGroup = TOOL_GROUPS.find((group) => group.id === activeToolGroup) || TOOL_GROUPS[0];

  const dockButton = (item: any, options: any = {}) => {
    const Icon = item.icon;
    return jsxs("button", {
      type: "button",
      draggable: options.draggable !== false,
      onDragStart: options.draggable === false ? undefined : (event: any) => beginDrag(event, item),
      onClick: options.onClick || (() => create(item.type, item.data)),
      className: `wanjuan-canvas-dock-button ${options.active ? "is-active" : ""}`,
      title: options.title ? t(options.title) : tf("{label}（点击创建，拖动可指定位置）", { label: t(item.label) }),
      children: [jsx(Icon, { size: 19, className: item.color || "text-gray-300" }), jsx("span", { children: t(item.label) })],
    }, item.type || item.label);
  };

  return jsxs("div", {
    ref: dockRef,
    className: "wanjuan-canvas-bottom-dock-wrap nodrag nopan",
    onClick: (event: any) => event.stopPropagation(),
    children: [
      openPanel === "tools" && jsxs("div", {
        className: "wanjuan-canvas-dock-popover wanjuan-canvas-dock-tools",
        children: [
          jsx("div", {
            className: "wanjuan-canvas-dock-tool-tabs",
            children: TOOL_GROUPS.map((group) => {
              const Icon = group.icon;
              return jsxs("button", {
                type: "button",
                onClick: () => setActiveToolGroup(group.id),
                className: `wanjuan-canvas-dock-tool-tab ${activeToolGroup === group.id ? "is-active" : ""}`,
                children: [jsx(Icon, { size: 15, className: group.color }), jsx("span", { children: t(group.label) })],
              }, group.id);
            }),
          }),
          jsx("div", {
            className: "wanjuan-canvas-dock-tool-items",
            children: activeGroup.items.map((item: any) => dockButton({ ...item, data: {} })),
          }),
        ],
      }),
      openPanel === "resources" && jsx("div", {
        className: "wanjuan-canvas-dock-popover wanjuan-canvas-dock-resources",
        children: jsx(WanJuanResourcePicker, { resources: resources || [], onSelect: selectResource, onClose: () => setOpenPanel(null) }),
      }),
      jsxs("div", {
        className: "wanjuan-canvas-bottom-dock",
        children: [
          ...PRIMARY_ITEMS.map((item) => dockButton(item)),
          jsx("span", { className: "wanjuan-canvas-dock-divider", "aria-hidden": true }),
          dockButton({ label: "工具", icon: Wrench, color: "text-cyan-400" }, { draggable: false, active: openPanel === "tools", onClick: () => setOpenPanel(openPanel === "tools" ? null : "tools"), title: "打开工具" }),
          dockButton({ label: "上传", icon: Upload, color: "text-green-400" }, { draggable: false, onClick: () => fileInputRef.current?.click(), title: "上传文件" }),
          dockButton({ label: "素材", icon: ImageIcon, color: "text-blue-400" }, { draggable: false, active: openPanel === "resources", onClick: () => setOpenPanel(openPanel === "resources" ? null : "resources"), title: "选择素材" }),
        ],
      }),
    ],
  });
}
