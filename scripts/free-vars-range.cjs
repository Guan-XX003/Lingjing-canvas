// 给一个行范围（JSX 子树），算它引用的「组件体作用域」自由变量（= 抽成子组件时要传的 props），
// 以及它用到的模块顶层符号（= 新组件文件要 import 的）。
// 用法：node scripts/free-vars-range.cjs <component> <startLine> <endLine> → 写 /tmp/freevars.json
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const compName = process.argv[2];
const startLine = +process.argv[3], endLine = +process.argv[4];
const startPos = sf.getPositionOfLineAndCharacter(startLine - 1, 0);
const endPos = sf.getPositionOfLineAndCharacter(endLine, 0);

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
let comp = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === compName) comp = n; ts.forEachChild(n, f); })(sf);
const scope = new Set();
const addN = (nm, set) => { if (!nm) return; if (ts.isIdentifier(nm)) set.add(nm.text); else if (ts.isObjectBindingPattern(nm) || ts.isArrayBindingPattern(nm)) for (const e of nm.elements) if (ts.isBindingElement(e)) addN(e.name, set); };
for (const p of comp.parameters) addN(p.name, scope);
for (const st of comp.body.statements) { if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) addN(d.name, scope); else if (ts.isFunctionDeclaration(st) && st.name) scope.add(st.name.text); }

// 找覆盖范围的最小节点
let target = null;
(function find(n) {
  if (n.getStart(sf) <= startPos && n.getEnd() >= endPos - 1) { target = n; ts.forEachChild(n, find); }
})(comp);

// 收集：范围内声明的局部名 + 引用的自由标识符
const locals = new Set();
(function cl(n) {
  if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) addN(n.name, locals);
  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) for (const p of n.parameters) addN(p.name, locals);
  ts.forEachChild(n, cl);
})(target);
const props = new Set(), imports = new Map();
(function w(n) {
  if (ts.isIdentifier(n) && !locals.has(n.text)) {
    if (scope.has(n.text)) props.add(n.text);
    else if (top.has(n.text)) { const m = top.get(n.text); if (!imports.has(m)) imports.set(m, new Set()); imports.get(m).add(n.text); }
  }
  ts.forEachChild(n, w);
})(target);
const out = { props: [...props].sort(), imports: Object.fromEntries([...imports].map(([k, v]) => [k, [...v].sort()])), nodeStart: sf.getLineAndCharacterOfPosition(target.getStart(sf)).line + 1, nodeEnd: sf.getLineAndCharacterOfPosition(target.getEnd()).line + 1, kind: ts.SyntaxKind[target.kind] };
fs.writeFileSync('/tmp/freevars.json', JSON.stringify(out, null, 2));
console.log('props:', out.props.length, '| imports:', JSON.stringify(out.imports), '| node:', out.kind, out.nodeStart + '-' + out.nodeEnd);
