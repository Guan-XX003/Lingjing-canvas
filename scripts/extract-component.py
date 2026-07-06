#!/usr/bin/env python3
"""bundle 组件抽取器：把 bundle/index.js 的顶层单元迁成可读组件/模块文件。

用法（作为库被驱动脚本 import，或直接编辑 SPECS 后运行）：
  transform(block)      —— vendor 别名→npm 名（jsx 组件、xyflow hooks、Position、localforage、createPortal）
  build_imports(block)  —— 依据符号索引自动生成 import 头
详见 memory 中的成熟抽取流程；边界必须先用 tsc API 测绘（scripts/map-bundle.js）。
"""
import re, json, glob

AMAP = json.load(open('scripts/vendor-alias-map.json'))
LUCIDE = {'ArrowUp','Palette','Inbox','Redo2','Pencil','Pipette','Maximize2','FileText','Hash','ListPlus','Copy','Download','Link','MonitorPlay','Minimize2','Pen','Mic','Check','Link2','RefreshCw','Play','FolderOpen','Image','Film','CirclePlay','Circle','CircleAlert','Sparkles','Send','X','Undo2','Type','Square','Star','Music','PenLine','Upload','Trash2','ZoomIn','Trash','Crop','Zap','Undo','Settings','Puzzle','Save','Settings2','LayoutGrid'}
XYFLOW_COMP = {'Handle','NodeResizer','Panel','Background','MiniMap','Controls','ReactFlow','NodeToolbar','BaseEdge','ReactFlowProvider'}
XY_HOOKS = {'ae':'useReactFlow','pe':'useNodesData','z':'useNodeConnections','te':'useNodesState','le':'useEdgesState','B':'useUpdateNodeInternals'}
REACT_HOOKS = {'useState','useEffect','useRef','useMemo','useCallback'}
# lucide X 与本地变量 X(localforage) 冲突时用别名导入
LUCIDE_RENAME = {'X': 'X as CloseX'}

def symbol_index():
    idx = {}
    for f in glob.glob('src/renderer/lib/*.ts') + glob.glob('src/renderer/lib/*.tsx') + glob.glob('src/renderer/components/*.tsx'):
        mod = './' + f.split('/')[-1].rsplit('.',1)[0]
        base = '../lib/' if '/lib/' in f else './'
        mod = base + f.split('/')[-1].rsplit('.',1)[0]
        for name in re.findall(r'^export (?:const|function|async function|let|class) ([\w$]+)', open(f).read(), re.M):
            idx[name] = mod
    return idx

def transform(block):
    lucide, xyflow, extras = set(), set(), set()
    def sub_jsx(m):
        alias = m.group(2)
        if alias == 'Y':
            extras.add('WanJuanNodeHandle')
            return m.group(1) + 'WanJuanNodeHandle, {'
        npm = AMAP.get(alias)
        if npm in LUCIDE:
            lucide.add(npm)
            return m.group(1) + ('CloseX' if npm == 'X' else npm) + ', {'
        if npm in XYFLOW_COMP:
            xyflow.add(npm)
            return m.group(1) + npm + ', {'
        return m.group(0)
    block = re.sub(r'(jsx[s]?\()([\w$]{1,3}), \{', sub_jsx, block)
    for al, hk in XY_HOOKS.items():
        if re.search(rf'\b{al}\(', block):
            xyflow.add(hk)
            block = re.sub(rf'\b{al}\(', hk + '(', block)
    if re.search(r'\bA\.(Left|Right|Top|Bottom)', block):
        xyflow.add('Position')
        block = re.sub(r'\bA\.(Left|Right|Top|Bottom)\b', r'Position.\1', block)
    if 'ze.createPortal' in block:
        extras.add('createPortal')
        block = block.replace('ze.createPortal', 'createPortal')
    if 'X.default' in block:
        extras.add('localforage')
        block = block.replace('X.default', 'localforage')
    return block, lucide, xyflow, extras

def build_imports(block, lucide, xyflow, extras, sym_idx):
    hooks = sorted(set(re.findall(r'\b(use[A-Z]\w+)\b', block)) & REACT_HOOKS)
    reacts = ['memo as reactMemo'] if 'reactMemo(' in block else []
    reacts += hooks
    imps = []
    if reacts: imps.append(f'import {{ {", ".join(reacts)} }} from "react";')
    if 'createPortal' in extras: imps.append('import { createPortal } from "react-dom";')
    frag = ', Fragment' if re.search(r'\bFragment\b', block) else ''
    imps.append(f'import {{ jsx, jsxs{frag} }} from "react/jsx-runtime";')
    if xyflow: imps.append(f'import {{ {", ".join(sorted(xyflow))} }} from "@xyflow/react";')
    if lucide:
        names = [LUCIDE_RENAME.get(x, x) for x in sorted(lucide)]
        imps.append(f'import {{ {", ".join(names)} }} from "lucide-react";')
    if 'localforage' in extras: imps.append('import localforage from "localforage";')
    used = set(re.findall(r'\b(wanjuan[A-Z][\w$]+|WanJuan[\w$]+|buildProjectMediaFileUrl|reviveProjectMediaBindingValue|normalizeVideoAspectRatioValue|snapVideoAspectRatioToSupported|localPathFromProjectFileUrl|parseSeedanceList|buildApiUrl|extractVideoTaskErrorHelper|resolveModelApiBindingIdHelper|resolveModelProtocolBindingHelper|normalizeModelBindingKeyHelper|getModelBindingCandidatesHelper|videoEditorModal|WjImageZoomModal|serializeErrorPreview|safeStringifyRequestForLog)\b', block))
    defined = set(re.findall(r'^\s*(?:export )?(?:const|function|async function|let|var|class) ([\w$]+)', block, re.M))
    bymod = {}
    for u in sorted(used - defined):
        if u in sym_idx: bymod.setdefault(sym_idx[u], []).append(u)
    if 'WanJuanNodeHandle' in extras and 'WanJuanNodeHandle' not in (bymod.get('./render-mode') or []):
        bymod.setdefault('./render-mode', []).insert(0, 'WanJuanNodeHandle')
    for mod, names in sorted(bymod.items()):
        imps.append(f'import {{ {", ".join(sorted(set(names)))} }} from "{mod}";')
    if re.search(r'\bchrome\b', block):
        imps.append('\n/** chrome 扩展运行时（仅在浏览器扩展环境存在）。 */\ndeclare const chrome: any;')
    return '\n'.join(imps)
