// 统计给定标识符在 bundle 里被「声明」(binding) 的次数 —— 判断全局重命名是否安全。
// binding = 函数名/参数/var/let/const/catch/解构。若某名只有 1 处 binding（顶层那处），
// 则 word-boundary 全局重命名安全（不会撞到内层局部同名）。
// 用法：node scripts/binding-count.cjs name1 name2 ... → 写 /tmp/binding-count.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const targets = process.argv.slice(2);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const counts = Object.fromEntries(targets.map((t) => [t, []]));

function record(nameNode) {
  if (nameNode && ts.isIdentifier(nameNode) && counts[nameNode.text]) counts[nameNode.text].push(ln(nameNode.getStart(sf)));
}
(function walk(n) {
  if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
    if (n.name) record(n.name);
    for (const p of n.parameters) collectBinding(p.name);
  } else if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) {
    collectBinding(n.name);
  } else if (ts.isCatchClause(n) && n.variableDeclaration) {
    collectBinding(n.variableDeclaration.name);
  }
  ts.forEachChild(n, walk);
})(sf);

function collectBinding(name) {
  if (!name) return;
  if (ts.isIdentifier(name)) record(name);
  else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
    for (const el of name.elements) if (ts.isBindingElement(el)) collectBinding(el.name);
}

const out = targets.map((t) => `${t}: ${counts[t].length} binding(s) at lines [${counts[t].join(', ')}]`);
fs.writeFileSync('/tmp/binding-count.txt', out.join('\n') + '\n');
