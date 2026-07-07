// AST 精确替换压缩惯用法：!0→true, !1→false, void 0→undefined。
// 只改真实语法节点（PrefixUnary ! + 数字字面量 0/1；Void + 0），不碰字符串/注释/正则。
// 用法：node scripts/normalize-idioms.cjs → 直接改 bundle/index.js，报告写 /tmp/idioms-report.txt
const ts = require('typescript');
const fs = require('node:fs');
const FILE = 'src/renderer/bundle/index.js';
let text = fs.readFileSync(FILE, 'utf8');
const sf = ts.createSourceFile('i.js', text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const edits = [];
(function walk(n) {
  // !0 / !1
  if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken &&
      ts.isNumericLiteral(n.operand) && (n.operand.text === '0' || n.operand.text === '1')) {
    edits.push({ start: n.getStart(sf), end: n.getEnd(), text: n.operand.text === '0' ? 'true' : 'false' });
    return;
  }
  // void 0
  if (ts.isVoidExpression(n) && ts.isNumericLiteral(n.expression) && n.expression.text === '0') {
    edits.push({ start: n.getStart(sf), end: n.getEnd(), text: 'undefined' });
    return;
  }
  ts.forEachChild(n, walk);
})(sf);
edits.sort((a, b) => b.start - a.start);
let trueCount = 0, falseCount = 0, undefCount = 0;
for (const e of edits) {
  if (e.text === 'true') trueCount++; else if (e.text === 'false') falseCount++; else undefCount++;
  text = text.slice(0, e.start) + e.text + text.slice(e.end);
}
fs.writeFileSync(FILE, text);
fs.writeFileSync('/tmp/idioms-report.txt', `!0→true: ${trueCount}\n!1→false: ${falseCount}\nvoid 0→undefined: ${undefCount}\nTOTAL: ${edits.length}\n`);
