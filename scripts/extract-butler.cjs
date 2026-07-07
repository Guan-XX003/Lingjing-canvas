// 把 WanJuanAppRoot 里 48 个纯 config-butler 函数整体抽到 lib/config-butler.ts。
// 稳健做法：按 VariableStatement 重建——保留非目标声明、移除目标声明（用存活声明重新拼语句，
// 自动处理逗号），绝不手工删逗号。目标声明→模块里的 export const。
const ts = require('typescript');
const fs = require('node:fs');
const FILE = 'src/renderer/bundle/index.js';
const src = fs.readFileSync(FILE, 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);

const PURE = new Set('applyButlerLearnedProtocolRules,buildButlerFallbackProtocol,buildConfigButlerToolContext,buildLocalConfigButlerErrorDiagnosis,buildXSeeVeoReferenceVideoProtocol,butlerCloneObject,butlerNormalizeTaskPath,butlerUniquePaths,coerceProtocolFieldValue,compareButlerModelSnapshots,configButlerAdvancedToolsExposed,configButlerCategoryOptions,configButlerToolsExposed,dryRunButlerProtocolConfig,extractButlerCurlExamples,extractButlerJsonKeys,extractButlerModelsFromPayload,extractButlerOpenApiSummary,filterButlerLatestTwoGenerations,finalizeButlerProtocolConfig,formatConfigButlerToolContext,getButlerDocFieldsForPath,getButlerModelFamilyKey,getButlerModelGenerationRank,getButlerModelNameFromItem,getConfigButlerTaskFailureSignature,getProtocolCategoryLabel,inferButlerCategoryFromModelName,inferButlerProtocolFromTools,inferConfigButlerProblemPart,inferProtocolDisplayName,matchWanJuanProviderProtocolPackage,normalizeButlerBaseUrl,normalizeButlerBatchItems,normalizeButlerModelName,normalizeConfigButlerDiagnosis,normalizeModelCategory,normalizeProtocolConfig,normalizeProtocolName,parseButlerLooseJson,probeButlerProtocol,scanButlerTargetModels,stableConfigButlerTaskStringify,validateAndRepairConfigButlerResult,validateButlerProtocolConfig,wanjuanButlerBuildProviderProtocol,wanjuanButlerProviderProtocolPackages,wanjuanButlerProviderToolsExposed'.split(','));

let comp = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === 'WanJuanAppRoot') comp = n; ts.forEachChild(n, f); })(sf);

const moduleParts = []; // 按源码顺序收集 export const
const edits = []; // {start,end,text}
const kw = (st) => (st.declarationList.flags & ts.NodeFlags.Const ? 'const' : st.declarationList.flags & ts.NodeFlags.Let ? 'let' : 'var');

for (const st of comp.body.statements) {
  if (!ts.isVariableStatement(st)) continue;
  const decls = st.declarationList.declarations;
  const targets = decls.filter((d) => ts.isIdentifier(d.name) && PURE.has(d.name.text));
  if (targets.length === 0) continue;
  for (const d of targets) moduleParts.push({ pos: d.getStart(sf), text: 'export const ' + d.getText(sf) + ';' });
  const survivors = decls.filter((d) => !(ts.isIdentifier(d.name) && PURE.has(d.name.text)));
  if (survivors.length === 0) {
    // 删除整条语句（含前导空白到语句末，含末尾分号）
    edits.push({ start: st.getStart(sf), end: st.getEnd(), text: '' });
  } else {
    const rebuilt = kw(st) + ' ' + survivors.map((d) => d.getText(sf)).join(',\n  ') + ';';
    edits.push({ start: st.getStart(sf), end: st.getEnd(), text: rebuilt });
  }
}

moduleParts.sort((a, b) => a.pos - b.pos);
const header = `/**
 * 配置管家（Config Butler）纯函数域：模型分类/协议推断、OpenAPI/curl 解析、
 * 协议配置规范化与校验、模型清单抽取与过滤、错误诊断签名与本地规则诊断等。
 * 全部为纯数据变换（不依赖 React state），自 WanJuanAppRoot 组件体抽出，行为不变。
 */
import { buildApiUrl } from "./model-binding";

`;
fs.writeFileSync('src/renderer/lib/config-butler.ts', header + moduleParts.map((p) => p.text).join('\n\n') + '\n');

// 应用删除/重建（自后向前）
let out = src;
edits.sort((a, b) => b.start - a.start);
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

// 组件顶部加 import（48 名字导回）
const names = moduleParts.map((p) => p.text.match(/export const (\w+)/)[1]);
const anchor = 'import { agentThemePalettes } from "../lib/agent-theme-palettes";';
if (!out.includes(anchor)) throw new Error('anchor not found');
const imp = anchor + '\nimport {\n  ' + names.join(',\n  ') + ',\n} from "../lib/config-butler";';
out = out.replace(anchor, imp);
fs.writeFileSync(FILE, out);
fs.writeFileSync('/tmp/extract-butler-report.txt', `extracted ${moduleParts.length} functions, rebuilt/removed ${edits.length} statements\n`);
