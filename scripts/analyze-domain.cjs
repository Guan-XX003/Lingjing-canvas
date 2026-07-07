// 给一个域的候选声明名单，算出「可安全外移的纯子集」+ 需要的外部模块依赖。
// 正确处理：捕获组件 state/setter → 排除；捕获被排除的候选（传递依赖）→ 排除；hook(useRef/useMemo/...) → 排除。
// 用法：node scripts/analyze-domain.cjs <component> <name1,name2,...> → 打印 + 写 /tmp/domain.json
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const compName = process.argv[2];
const cands = new Set((process.argv[3] || '').split(',').filter(Boolean));

// 模块顶层符号（import + 顶层 var/fn）及其来源
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
let comp = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === compName) comp = n; ts.forEachChild(n, f); })(sf);

// 组件体作用域绑定
const scope = new Set();
const addN = (nm, set) => { if (!nm) return; if (ts.isIdentifier(nm)) set.add(nm.text); else if (ts.isObjectBindingPattern(nm) || ts.isArrayBindingPattern(nm)) for (const e of nm.elements) if (ts.isBindingElement(e)) addN(e.name, set); };
for (const p of comp.parameters) addN(p.name, scope);
for (const st of comp.body.statements) { if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) addN(d.name, scope); else if (ts.isFunctionDeclaration(st) && st.name) scope.add(st.name.text); }

// 每个候选：节点、是否 hook、捕获集（组件作用域内、非自身局部）
const info = new Map();
for (const st of comp.body.statements) {
  if (!ts.isVariableStatement(st)) continue;
  for (const d of st.declarationList.declarations) {
    if (!ts.isIdentifier(d.name) || !cands.has(d.name.text)) continue;
    const node = d.initializer || d;
    const isHook = node && (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^use[A-Z]/.test(node.expression.text));
    const locals = new Set([d.name.text]);
    (function cl(n) {
      if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) addN(n.name, locals);
      if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) for (const p of n.parameters) addN(p.name, locals);
      if ((ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n)) && n.name) locals.add(n.name.text);
      if (ts.isCatchClause(n) && n.variableDeclaration) addN(n.variableDeclaration.name, locals);
      ts.forEachChild(n, cl);
    })(node);
    const caps = new Set();
    (function w(n) { if (ts.isIdentifier(n) && scope.has(n.text) && !locals.has(n.text)) caps.add(n.text); ts.forEachChild(n, w); })(node);
    info.set(d.name.text, { isHook, caps });
  }
}

// 固定点：排除 hook；排除捕获了「非候选 或 已排除候选」的
let pure = new Set([...cands].filter((c) => info.has(c) && !info.get(c).isHook));
let changed = true;
while (changed) {
  changed = false;
  for (const c of [...pure]) {
    for (const cap of info.get(c).caps) {
      if (!pure.has(cap)) { pure.delete(c); changed = true; break; }
    }
  }
}
// 纯子集的外部模块依赖
const deps = new Map();
for (const c of pure) for (const cap of info.get(c).caps) { /* 都在 pure 内 */ }
const scanExt = (name) => {
  const d = [...comp.body.statements].flatMap((st) => ts.isVariableStatement(st) ? st.declarationList.declarations : []).find((d) => ts.isIdentifier(d.name) && d.name.text === name);
  (function w(n) { if (ts.isIdentifier(n) && top.has(n.text) && !pure.has(n.text)) { const m = top.get(n.text); if (!deps.has(m)) deps.set(m, new Set()); deps.get(m).add(n.text); } ts.forEachChild(n, w); })(d.initializer || d);
};
for (const c of pure) scanExt(c);
const excluded = [...cands].filter((c) => !pure.has(c));
const out = { pure: [...pure].sort(), excluded, deps: Object.fromEntries([...deps].map(([k, v]) => [k, [...v].sort()])) };
fs.writeFileSync('/tmp/domain.json', JSON.stringify(out, null, 2));
console.log('PURE (' + pure.size + '):', [...pure].sort().join(','));
console.log('\nEXCLUDED (' + excluded.length + '):', excluded.join(','));
console.log('\nDEPS:', JSON.stringify(out.deps));
