// 列出行号区间内每个压缩局部绑定的：声明行号、名字、该声明行源码片段（供人工判断语义命名）。
// 用法：node scripts/list-minified-sites.cjs <min> <max> → 写 /tmp/sites.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const lines = src.split('\n');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2]), max = Number(process.argv[3]);
const isMin = (n) => /^[a-z_$]$/.test(n) || /^[A-Z][a-z]?$/.test(n) || /^[a-z]{2}$/.test(n) || /^[A-Z]{1,2}[a-z]?$/.test(n);
const out = [];
function rec(id, kind) {
  if (!id || !ts.isIdentifier(id)) return;
  const line = ln(id.getStart(sf));
  if (line < min || line > max || !isMin(id.text)) return;
  out.push(`${line}:${id.text}\t[${kind}] ${lines[line - 1].trim().slice(0, 90)}`);
}
function bind(name, kind) {
  if (!name) return;
  if (ts.isIdentifier(name)) rec(name, kind);
  else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
    for (const el of name.elements) if (ts.isBindingElement(el)) bind(el.name, kind);
}
(function walk(n) {
  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) { for (const p of n.parameters) bind(p.name, 'param'); }
  else if (ts.isFunctionDeclaration(n)) { if (n.name) rec(n.name, 'fn'); for (const p of n.parameters) bind(p.name, 'param'); }
  else if (ts.isVariableDeclaration(n)) bind(n.name, 'let');
  else if (ts.isCatchClause(n) && n.variableDeclaration) bind(n.variableDeclaration.name, 'catch');
  ts.forEachChild(n, walk);
})(sf);
fs.writeFileSync('/tmp/sites.txt', out.join('\n') + '\n');
