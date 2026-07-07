// 把 WanJuanAppRoot return 里某个「cond && jsx(...)」块的 jsx 部分抽成子组件。
// 保留 cond && 守卫，替换 jsx(...) 为 jsx(Comp, {props})。
// 配置 /tmp/block-config.json: { startLine, compName, outFile }  可加 "dry":true 只打印 props/imports。
const ts = require('typescript');
const fs = require('node:fs');
const cfg = JSON.parse(fs.readFileSync('/tmp/block-config.json', 'utf8'));
const FILE = 'src/renderer/bundle/index.js';
const src = fs.readFileSync(FILE, 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
let comp = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === 'WanJuanAppRoot') comp = n; ts.forEachChild(n, f); })(sf);

// 顶层符号表（含解构）
const top = new Map();
for (const st of sf.statements) {
  if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
    const m = st.moduleSpecifier.getText(sf).replace(/['"]/g, '');
    for (const e of st.importClause.namedBindings.elements) top.set(e.name.text, m);
  } else if (ts.isFunctionDeclaration(st) && st.name) top.set(st.name.text, 'LOCAL-TOP');
  else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) {
    const addTop = (nm) => { if (!nm) return; if (ts.isIdentifier(nm)) top.set(nm.text, 'LOCAL-TOP'); else if (ts.isObjectBindingPattern(nm) || ts.isArrayBindingPattern(nm)) for (const e of nm.elements) if (ts.isBindingElement(e)) addTop(e.name); };
    addTop(d.name);
  }
}
const JSX_RUNTIME = new Set(['jsx', 'jsxs', 'Fragment']);
const scope = new Set();
const addN = (nm, set) => { if (!nm) return; if (ts.isIdentifier(nm)) set.add(nm.text); else if (ts.isObjectBindingPattern(nm) || ts.isArrayBindingPattern(nm)) for (const e of nm.elements) if (ts.isBindingElement(e)) addN(e.name, set); };
for (const p of comp.parameters) addN(p.name, scope);
for (const st of comp.body.statements) { if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) addN(d.name, scope); else if (ts.isFunctionDeclaration(st) && st.name) scope.add(st.name.text); }

// 找 start 行的 BinaryExpression &&
let block = null;
(function w(n) {
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && ln(n.getStart(sf)) === cfg.startLine) {
    const r = n.right;
    if (ts.isCallExpression(r) && ts.isIdentifier(r.expression) && /^jsxs?$/.test(r.expression.text)) block = n;
  }
  if (!block) ts.forEachChild(n, w);
})(comp);
if (!block) throw new Error('block not found at line ' + cfg.startLine);
const jsxNode = block.right;

const locals = new Set();
(function cl(n) {
  if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) addN(n.name, locals);
  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) for (const p of n.parameters) addN(p.name, locals);
  ts.forEachChild(n, cl);
})(jsxNode);
const props = new Set(), imports = new Map(), bundleInternal = new Set();
(function w(n) {
  if (ts.isIdentifier(n) && !locals.has(n.text)) {
    if (scope.has(n.text)) props.add(n.text);
    else if (JSX_RUNTIME.has(n.text)) { if (!imports.has('react/jsx-runtime')) imports.set('react/jsx-runtime', new Set()); imports.get('react/jsx-runtime').add(n.text); }
    else if (top.has(n.text)) { const m = top.get(n.text); if (m === 'LOCAL-TOP') bundleInternal.add(n.text); else { if (!imports.has(m)) imports.set(m, new Set()); imports.get(m).add(n.text); } }
  }
  ts.forEachChild(n, w);
})(jsxNode);

const propList = [...props].sort(), importObj = Object.fromEntries([...imports].map(([k, v]) => [k, [...v].sort()]));
console.log('props(' + propList.length + '):', propList.join(','));
console.log('imports:', JSON.stringify(importObj));
console.log('BUNDLE-INTERNAL (需处理!):', [...bundleInternal].join(',') || 'none');
if (cfg.dry) { fs.writeFileSync('/tmp/block-analysis.json', JSON.stringify({ props: propList, imports: importObj, bundleInternal: [...bundleInternal] }, null, 2)); return; }
if (bundleInternal.size) throw new Error('block references bundle-internal top-level: ' + [...bundleInternal].join(','));

// 组件文件
const importLines = Object.entries(importObj).map(([m, names]) => {
  // 依赖路径原相对 bundle/；组件在 components/（与 lib/、bundle/ 同级于 renderer/）
  let path = m;
  if (m === './vendor.js') path = '../bundle/vendor.js';
  else if (m.startsWith('../components/')) path = './' + m.slice('../components/'.length);
  // ../lib/X 从 components/ 同样有效，保持不变
  return `import { ${names.join(', ')} } from "${path}";`;
}).join('\n');
const bodyText = jsxNode.getText(sf);
const moduleSrc = `${cfg.docComment || '/** 自 WanJuanAppRoot return 抽出的子组件，props 传入依赖，行为不变。 */'}
${importLines}
declare const chrome: any;

export function ${cfg.compName}({\n  ${propList.join(',\n  ')},\n}: any) {
  return ${bodyText};
}
`;
fs.writeFileSync(cfg.outFile, moduleSrc);

// 替换 jsxNode 文本为 jsx(Comp, {props})
const propsPass = '{\n  ' + propList.join(',\n  ') + ',\n}';
const replacement = `jsx(${cfg.compName}, ${propsPass})`;
let out = src.slice(0, jsxNode.getStart(sf)) + replacement + src.slice(jsxNode.getEnd());
const anchor = 'import { agentThemePalettes } from "../lib/agent-theme-palettes";';
const rel = cfg.outFile.replace('src/renderer/', '../').replace('.tsx', '').replace('.ts', '');
out = out.replace(anchor, anchor + `\nimport { ${cfg.compName} } from "${rel}";`);
fs.writeFileSync(FILE, out);
console.log('EXTRACTED', cfg.compName, '| props', propList.length);
