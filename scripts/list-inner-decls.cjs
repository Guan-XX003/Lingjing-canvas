// 列出某个具名函数「函数体直接作用域」里的变量/函数声明（名字+行范围+首行片段）。
// 用于给巨型组件找可抽取的域（renderXxx 面板、handler 组等）。
// 用法：node scripts/list-inner-decls.cjs <functionName> → 写 /tmp/inner-decls.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const lines = src.split('\n');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const target = process.argv[2];

let fnNode = null;
(function find(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === target) fnNode = n;
  if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === target && n.initializer &&
      (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) fnNode = n.initializer;
  ts.forEachChild(n, find);
})(sf);
if (!fnNode || !fnNode.body) { fs.writeFileSync('/tmp/inner-decls.txt', 'not found: ' + target + '\n'); process.exit(1); }

const out = [];
// 只看函数体顶层 statement（不递归进嵌套函数）
for (const st of fnNode.body.statements) {
  if (ts.isVariableStatement(st)) {
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name)) {
        const a = ln(d.getStart(sf)), b = ln(d.getEnd());
        out.push(`${a}-${b} (${b - a + 1})  ${d.name.text}  | ${lines[a - 1].trim().slice(0, 70)}`);
      }
    }
  } else if (ts.isFunctionDeclaration(st) && st.name) {
    const a = ln(st.getStart(sf)), b = ln(st.getEnd());
    out.push(`${a}-${b} (${b - a + 1})  ${st.name.text} [fn]`);
  }
}
fs.writeFileSync('/tmp/inner-decls.txt', `${target} body: ${fnNode.body.statements.length} top statements\n` + out.join('\n') + '\n');
