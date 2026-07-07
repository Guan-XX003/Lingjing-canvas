// 约定俗成的安全重命名：catch(压缩) → error；.sort/.reduce 等比较回调的两个压缩参数 → itemA/itemB。
// 用法：node scripts/conventional-renames.cjs <min> <max> → 写 /tmp/alias-specs.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2]), max = Number(process.argv[3]);
const isMin = (n) => /^[a-z_$]$/.test(n) || /^[a-z]{2}$/.test(n);
const inRange = (id) => { const l = ln(id.getStart(sf)); return l >= min && l <= max; };
const specs = [];
const seen = new Set();
const push = (id, name) => { const l = ln(id.getStart(sf)); const k = `${l}:${id.text}`; if (!seen.has(k)) { specs.push(`${l}:${id.text}:${name}`); seen.add(k); } };
(function walk(n) {
  // catch (x) → error
  if (ts.isCatchClause(n) && n.variableDeclaration && ts.isIdentifier(n.variableDeclaration.name) && isMin(n.variableDeclaration.name.text) && inRange(n.variableDeclaration.name)) {
    if (!/\berror\b/.test(n.block.getText(sf).slice(0, 200)) || true) push(n.variableDeclaration.name, 'error');
  }
  // .sort((a,b)=>) / comparator with 2 minified params → itemA/itemB
  if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'sort' && n.arguments[0] &&
      (ts.isArrowFunction(n.arguments[0]) || ts.isFunctionExpression(n.arguments[0]))) {
    const ps = n.arguments[0].parameters;
    if (ps.length === 2 && ps.every((p) => ts.isIdentifier(p.name) && isMin(p.name.text))) {
      if (inRange(ps[0].name)) push(ps[0].name, 'itemA');
      if (inRange(ps[1].name)) push(ps[1].name, 'itemB');
    }
  }
  ts.forEachChild(n, walk);
})(sf);
fs.writeFileSync('/tmp/alias-specs.txt', specs.join('\n') + '\n');
fs.writeFileSync('/tmp/conv-report.txt', `${specs.length} conventional renames in [${min},${max}]\n` + specs.join('\n') + '\n');
