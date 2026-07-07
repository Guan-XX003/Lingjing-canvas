// 通用域抽取器：把一批纯声明整体抽到某 lib 模块。
// 配置 /tmp/extract-config.json: { pure:[...], outFile, importHeader, docComment, anchor }
// 稳健：按 VariableStatement 重建（保留非目标、用存活声明重拼语句自动处理逗号）。
const ts = require('typescript');
const fs = require('node:fs');
const cfg = JSON.parse(fs.readFileSync('/tmp/extract-config.json', 'utf8'));
const PURE = new Set(cfg.pure);
const FILE = 'src/renderer/bundle/index.js';
const src = fs.readFileSync(FILE, 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);

let comp = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === 'WanJuanAppRoot') comp = n; ts.forEachChild(n, f); })(sf);
const kw = (st) => (st.declarationList.flags & ts.NodeFlags.Const ? 'const' : st.declarationList.flags & ts.NodeFlags.Let ? 'let' : 'var');
const moduleParts = [], edits = [];
for (const st of comp.body.statements) {
  if (!ts.isVariableStatement(st)) continue;
  const decls = st.declarationList.declarations;
  const targets = decls.filter((d) => ts.isIdentifier(d.name) && PURE.has(d.name.text));
  if (!targets.length) continue;
  for (const d of targets) moduleParts.push({ pos: d.getStart(sf), text: 'export const ' + d.getText(sf) + ';' });
  const survivors = decls.filter((d) => !(ts.isIdentifier(d.name) && PURE.has(d.name.text)));
  edits.push({ start: st.getStart(sf), end: st.getEnd(), text: survivors.length ? kw(st) + ' ' + survivors.map((d) => d.getText(sf)).join(',\n  ') + ';' : '' });
}
moduleParts.sort((a, b) => a.pos - b.pos);
fs.writeFileSync(cfg.outFile, cfg.docComment + '\n' + cfg.importHeader + '\n\n' + moduleParts.map((p) => p.text).join('\n\n') + '\n');
let out = src;
edits.sort((a, b) => b.start - a.start);
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
const names = moduleParts.map((p) => p.text.match(/export const (\w+)/)[1]);
if (!out.includes(cfg.anchor)) throw new Error('anchor not found');
const rel = cfg.outFile.replace('src/renderer/lib/', '../lib/').replace('.ts', '');
out = out.replace(cfg.anchor, cfg.anchor + '\nimport {\n  ' + names.join(',\n  ') + ',\n} from "' + rel + '";');
fs.writeFileSync(FILE, out);
console.log('extracted', moduleParts.length, 'into', cfg.outFile, '| rebuilt/removed', edits.length, 'statements');
