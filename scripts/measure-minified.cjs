// 统计行号区间内「压缩局部绑定」的规模：不同名字个数 + 总声明处数。
// 压缩 = 名字 ≤2 字符（或单大写+可选小写）。用法：node measure-minified.cjs <min> <max>
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2]), max = Number(process.argv[3]);
const isMin = (n) => /^[a-z_$]$/.test(n) || /^[A-Z][a-z]?$/.test(n) || /^[a-z]{2}$/.test(n) || /^[A-Z]{1,2}[a-z]?$/.test(n);
const names = new Map();
function rec(id) {
  if (!id || !ts.isIdentifier(id)) return;
  const line = ln(id.getStart(sf));
  if (line < min || line > max) return;
  if (isMin(id.text)) names.set(id.text, (names.get(id.text) || 0) + 1);
}
function bind(name) {
  if (!name) return;
  if (ts.isIdentifier(name)) rec(name);
  else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
    for (const el of name.elements) if (ts.isBindingElement(el)) bind(el.name);
}
(function walk(n) {
  if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
    if (n.name) rec(n.name);
    for (const p of n.parameters) bind(p.name);
  } else if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) bind(n.name);
  else if (ts.isCatchClause(n) && n.variableDeclaration) bind(n.variableDeclaration.name);
  ts.forEachChild(n, walk);
})(sf);
const arr = [...names.entries()].sort((a, b) => b[1] - a[1]);
fs.writeFileSync('/tmp/measure.txt', `range [${min},${max}]: ${arr.length} distinct minified local names, ${arr.reduce((s, x) => s + x[1], 0)} binding sites\n` + arr.slice(0, 40).map(([n, c]) => `${n}: ${c}`).join('  ') + '\n');
