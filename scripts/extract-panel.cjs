// 把 WanJuanAppRoot 里某个 renderXxx = () => jsx(...) 面板函数抽成独立子组件（props 传入捕获的依赖）。
// 配置 /tmp/panel-config.json: { fnName, compName, outFile, props:[...], importHeader, callSiteText }
const ts = require('typescript');
const fs = require('node:fs');
const cfg = JSON.parse(fs.readFileSync('/tmp/panel-config.json', 'utf8'));
const FILE = 'src/renderer/bundle/index.js';
const src = fs.readFileSync(FILE, 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);

let comp = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === 'WanJuanAppRoot') comp = n; ts.forEachChild(n, f); })(sf);
const kw = (st) => (st.declarationList.flags & ts.NodeFlags.Const ? 'const' : st.declarationList.flags & ts.NodeFlags.Let ? 'let' : 'var');

let bodyText = null, editStmt = null;
for (const st of comp.body.statements) {
  if (!ts.isVariableStatement(st)) continue;
  const decls = st.declarationList.declarations;
  const target = decls.find((d) => ts.isIdentifier(d.name) && d.name.text === cfg.fnName);
  if (!target) continue;
  const arrow = target.initializer;
  if (!ts.isArrowFunction(arrow)) throw new Error('not arrow');
  bodyText = arrow.body.getText(sf); // jsxs('div', {...}) 表达式
  const survivors = decls.filter((d) => d !== target);
  editStmt = { start: st.getStart(sf), end: st.getEnd(), text: survivors.length ? kw(st) + ' ' + survivors.map((d) => d.getText(sf)).join(',\n  ') + ';' : '' };
  break;
}
if (!bodyText) throw new Error('fn not found');

// 组件文件
const propsDestructure = '{\n  ' + cfg.props.join(',\n  ') + ',\n}: any';
const moduleSrc = `${cfg.docComment}
${cfg.importHeader}

export function ${cfg.compName}(${propsDestructure}) {
  return ${bodyText};
}
`;
fs.writeFileSync(cfg.outFile, moduleSrc);

// 应用：删函数 + 替换调用点 + 加 import
let out = src.slice(0, editStmt.start) + editStmt.text + src.slice(editStmt.end);
const propsPass = '{\n  ' + cfg.props.join(',\n  ') + ',\n}';
const callNew = `jsx(${cfg.compName}, ${propsPass})`;
if (!out.includes(cfg.callSiteText)) throw new Error('call site not found: ' + cfg.callSiteText);
out = out.replace(cfg.callSiteText, callNew);
const anchor = 'import { agentThemePalettes } from "../lib/agent-theme-palettes";';
const rel = cfg.outFile.replace('src/renderer/', '../').replace('.tsx', '').replace('.ts', '');
out = out.replace(anchor, anchor + `\nimport { ${cfg.compName} } from "${rel}";`);
fs.writeFileSync(FILE, out);
console.log('extracted panel', cfg.compName, '| props', cfg.props.length);
