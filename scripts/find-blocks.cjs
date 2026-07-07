// 列出 WanJuanAppRoot return 里的「cond && jsx(...)」大块，并算每块的 props 数（组件作用域自由变量）。
// 用于挑「低 props、可无痛抽成子组件」的块。写 /tmp/blocks.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
let comp = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === 'WanJuanAppRoot') comp = n; ts.forEachChild(n, f); })(sf);

const scope = new Set();
const addN = (nm, set) => { if (!nm) return; if (ts.isIdentifier(nm)) set.add(nm.text); else if (ts.isObjectBindingPattern(nm) || ts.isArrayBindingPattern(nm)) for (const e of nm.elements) if (ts.isBindingElement(e)) addN(e.name, set); };
for (const p of comp.parameters) addN(p.name, scope);
for (const st of comp.body.statements) { if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) addN(d.name, scope); else if (ts.isFunctionDeclaration(st) && st.name) scope.add(st.name.text); }

function propsOf(node) {
  const locals = new Set();
  (function cl(n) {
    if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) addN(n.name, locals);
    if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) for (const p of n.parameters) addN(p.name, locals);
    ts.forEachChild(n, cl);
  })(node);
  const props = new Set();
  (function w(n) { if (ts.isIdentifier(n) && !locals.has(n.text) && scope.has(n.text)) props.add(n.text); ts.forEachChild(n, w); })(node);
  return props;
}

const blocks = [];
(function w(n) {
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    const r = n.right;
    if (ts.isCallExpression(r) && ts.isIdentifier(r.expression) && /^jsxs?$/.test(r.expression.text)) {
      const a = ln(n.getStart(sf)), b = ln(n.getEnd());
      if (b - a >= 25) { blocks.push({ lines: b - a + 1, a, b, cond: n.left.getText(sf).slice(0, 40).replace(/\n/g, ' '), props: propsOf(n).size }); return; }
    }
  }
  ts.forEachChild(n, w);
})(comp);
blocks.sort((x, y) => x.props - y.props);
fs.writeFileSync('/tmp/blocks.txt', blocks.map((x) => `props=${x.props}  ${x.a}-${x.b} (${x.lines}行)  ${x.cond}`).join('\n') + '\n');
console.log('blocks:', blocks.length, '| lowest props:', blocks.slice(0, 8).map((x) => x.props).join(','));
