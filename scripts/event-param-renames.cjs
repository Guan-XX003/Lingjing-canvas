// 安全高吞吐反混淆：把「其函数体内以 事件属性 方式使用」的压缩单参数改名为 event。
// 判据：箭头/函数的某个压缩名参数 p，函数体内出现 p.<事件属性>（preventDefault/stopPropagation/
// target/currentTarget/key/keyCode/clientX/clientY/dataTransfer/deltaY/touches/button/nativeEvent 等）。
// 这是「有根据」而非猜测：只有真作为事件用的参数才改。作用域感知由 rename-symbol 完成。
// 用法：node scripts/event-param-renames.cjs <min> <max> → 写 /tmp/alias-specs.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2]), max = Number(process.argv[3]);
const isMin = (n) => /^[a-z_$]$/.test(n) || /^[a-z]{2}$/.test(n);
const EVENT_PROPS = new Set(['preventDefault', 'stopPropagation', 'stopImmediatePropagation', 'target', 'currentTarget', 'key', 'keyCode', 'code', 'clientX', 'clientY', 'pageX', 'pageY', 'dataTransfer', 'deltaY', 'deltaX', 'touches', 'button', 'buttons', 'nativeEvent', 'shiftKey', 'ctrlKey', 'metaKey', 'altKey', 'relatedTarget', 'clipboardData']);
const specs = [];
function usesAsEvent(fnBody, paramName) {
  let found = false;
  (function w(n) {
    if (found) return;
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === paramName && EVENT_PROPS.has(n.name.text)) { found = true; return; }
    ts.forEachChild(n, w);
  })(fnBody);
  return found;
}
(function walk(n) {
  if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n)) && n.body) {
    for (const p of n.parameters) {
      if (ts.isIdentifier(p.name) && isMin(p.name.text)) {
        const line = ln(p.name.getStart(sf));
        if (line >= min && line <= max && usesAsEvent(n.body, p.name.text)) specs.push(`${line}:${p.name.text}:event`);
      }
    }
  }
  ts.forEachChild(n, walk);
})(sf);
fs.writeFileSync('/tmp/alias-specs.txt', specs.join('\n') + '\n');
fs.writeFileSync('/tmp/event-report.txt', `${specs.length} event params in [${min},${max}]\n` + specs.join('\n') + '\n');
