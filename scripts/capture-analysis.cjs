// 分析巨型组件内某些顶层声明是否「纯」（可安全外移到 lib）：
// 列出每个目标声明引用的、但属于「组件体作用域」(组件参数 + 组件体里的兄弟声明) 的标识符 = 捕获。
// 捕获集里若只含其它「同样待移」的纯函数，则该组可整体外移；若含 state/setter/ref，则是闭包，不能简单移。
// 用法：node scripts/capture-analysis.cjs <componentName> <targetName1,targetName2,...> → 写 /tmp/capture.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const comp = process.argv[2];
const targets = new Set((process.argv[3] || '').split(',').filter(Boolean));

let fn = null;
(function find(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === comp) fn = n;
  ts.forEachChild(n, find);
})(sf);
if (!fn) { fs.writeFileSync('/tmp/capture.txt', 'component not found\n'); process.exit(1); }

// 组件体作用域绑定：参数 + 函数体顶层 statement 声明的名字
const scopeBindings = new Set();
const collectName = (name) => {
  if (!name) return;
  if (ts.isIdentifier(name)) scopeBindings.add(name.text);
  else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
    for (const el of name.elements) if (ts.isBindingElement(el)) collectName(el.name);
};
for (const p of fn.parameters) collectName(p.name);
for (const st of fn.body.statements) {
  if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) collectName(d.name);
  else if (ts.isFunctionDeclaration(st) && st.name) scopeBindings.add(st.name.text);
}

// 找每个 target 声明节点，收集其内部引用的、属于 scopeBindings 的标识符
function findDecl(name) {
  let node = null;
  for (const st of fn.body.statements) {
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations)
      if (ts.isIdentifier(d.name) && d.name.text === name) node = d.initializer || d;
    if (ts.isFunctionDeclaration(st) && st.name?.text === name) node = st;
  }
  return node;
}
const out = [];
for (const t of targets) {
  const node = findDecl(t);
  if (!node) { out.push(`${t}: NOT FOUND`); continue; }
  const localDecls = new Set([t]);
  const addName = (nm) => {
    if (!nm) return;
    if (ts.isIdentifier(nm)) localDecls.add(nm.text);
    else if (ts.isObjectBindingPattern(nm) || ts.isArrayBindingPattern(nm))
      for (const e of nm.elements) if (ts.isBindingElement(e)) addName(e.name);
  };
  (function collectLocal(n) {
    if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) addName(n.name);
    if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) for (const p of n.parameters) addName(p.name);
    if ((ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n)) && n.name) localDecls.add(n.name.text);
    if (ts.isCatchClause(n) && n.variableDeclaration) addName(n.variableDeclaration.name);
    ts.forEachChild(n, collectLocal);
  })(node);
  const caps = new Set();
  (function walk(n) {
    if (ts.isIdentifier(n) && scopeBindings.has(n.text) && !localDecls.has(n.text) && !targets.has(n.text)) caps.add(n.text);
    ts.forEachChild(n, walk);
  })(node);
  out.push(`${t}:  captures(${caps.size}): ${[...caps].sort().join(', ')}`);
}
fs.writeFileSync('/tmp/capture.txt', out.join('\n') + '\n');
