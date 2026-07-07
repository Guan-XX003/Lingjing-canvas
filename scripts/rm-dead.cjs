// 删除 return 里所有 `false && ... && jsx(...)` 死代码块（永不渲染），替换为 `false`。
const ts = require('typescript');
const fs = require('node:fs');
const FILE = 'src/renderer/bundle/index.js';
let src = fs.readFileSync(FILE, 'utf8');
function leftmost(n) { while (ts.isBinaryExpression(n)) n = n.left; return n; }
let pass = 0;
for (;;) {
  const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
  let target = null;
  (function w(n) {
    if (!target && ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
        ts.isCallExpression(n.right) && ts.isIdentifier(n.right.expression) && /^jsxs?$/.test(n.right.expression.text)) {
      const lm = leftmost(n);
      if (lm.kind === ts.SyntaxKind.FalseKeyword && (ln(n.getEnd()) - ln(n.getStart(sf))) >= 20) { target = n; return; }
    }
    if (!target) ts.forEachChild(n, w);
  })(sf);
  if (!target) break;
  console.log('dead block', ln(target.getStart(sf)), '-', ln(target.getEnd()));
  src = src.slice(0, target.getStart(sf)) + 'false' + src.slice(target.getEnd());
  pass++;
}
fs.writeFileSync(FILE, src);
console.log('removed', pass, 'dead blocks');
