// useState 解构对 [state, setter] 里，一侧已可读时，从它推出另一侧的语义名。
//   [压缩, setXxx]  → 压缩 = xxx (setter 去 set + 首字母小写)
//   [xxx, 压缩]     → 压缩 = setXxx
// 用法：node scripts/usestate-pair-renames.cjs <min> <max> → 写 /tmp/alias-specs.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2]), max = Number(process.argv[3]);
const isMin = (n) => /^[a-z_$]$/.test(n) || /^[A-Z][a-z]?$/.test(n) || /^[a-z]{2}$/.test(n) || /^[A-Z]{1,2}[a-z]?$/.test(n);
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const uc = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const specs = [];
(function walk(n) {
  if (ts.isVariableDeclaration(n) && n.name && ts.isArrayBindingPattern(n.name) && n.name.elements.length === 2 &&
      n.initializer && ts.isCallExpression(n.initializer) && ts.isIdentifier(n.initializer.expression) && n.initializer.expression.text === 'useState') {
    const [a, b] = n.name.elements;
    if (!ts.isBindingElement(a) || !ts.isBindingElement(b) || !ts.isIdentifier(a.name) || !ts.isIdentifier(b.name)) { ts.forEachChild(n, walk); return; }
    const state = a.name.text, setter = b.name.text;
    const line = (id) => ln(id.getStart(sf));
    const m = setter.match(/^set([A-Z]\w+)$/);
    if (isMin(state) && m && line(a.name) >= min && line(a.name) <= max) specs.push(`${line(a.name)}:${state}:${lc(m[1])}`);
    else if (isMin(setter) && /^[a-z][\w$]{2,}$/.test(state) && !isMin(state) && line(b.name) >= min && line(b.name) <= max) specs.push(`${line(b.name)}:${setter}:set${uc(state)}`);
  }
  ts.forEachChild(n, walk);
})(sf);
fs.writeFileSync('/tmp/alias-specs.txt', specs.join('\n') + '\n');
fs.writeFileSync('/tmp/usestate-report.txt', `${specs.length} derivable useState halves in [${min},${max}]\n` + specs.join('\n') + '\n');
