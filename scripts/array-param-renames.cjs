// 保守机械化：数组迭代方法(.map/.filter/.forEach/.find/.some/.every/.flatMap/.findIndex)
// 的单个压缩名参数 → item。作用域感知由 rename-symbol 完成，纯约定俗成、不猜语义。
// 用法：node scripts/array-param-renames.cjs <min> <max> → 写 /tmp/alias-specs.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2]), max = Number(process.argv[3]);
const isMin = (n) => /^[a-z_$]$/.test(n) || /^[a-z]{2}$/.test(n);
const ITER = new Set(['map', 'filter', 'forEach', 'find', 'findIndex', 'some', 'every', 'flatMap']);
const specs = [];
const seen = new Set();
(function walk(n) {
  if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ITER.has(n.expression.name.text) && n.arguments.length >= 1) {
    const cb = n.arguments[0];
    if ((ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) && cb.parameters.length === 1) {
      const p = cb.parameters[0];
      if (ts.isIdentifier(p.name) && isMin(p.name.text)) {
        const line = ln(p.name.getStart(sf));
        const keyRaw = `${line}:${p.name.text}`;
        if (line >= min && line <= max && !seen.has(keyRaw)) { specs.push(`${line}:${p.name.text}:item`); seen.add(keyRaw); }
      }
    }
  }
  ts.forEachChild(n, walk);
})(sf);
fs.writeFileSync('/tmp/alias-specs.txt', specs.join('\n') + '\n');
fs.writeFileSync('/tmp/array-report.txt', `${specs.length} array-iterator params in [${min},${max}]\n` + specs.slice(0, 60).join('\n') + '\n');
