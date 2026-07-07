// 算某组件内一批声明整体引用了哪些「模块顶层符号」(import + 顶层 var/fn)，排除集合自身。
// 用法：node scripts/set-deps.cjs <componentName> <name1,name2,...> → 写 /tmp/deps.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const comp = process.argv[2];
const setNames = new Set((process.argv[3] || '').split(',').filter(Boolean));

const top = new Map();
for (const st of sf.statements) {
  if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
    const m = st.moduleSpecifier.getText(sf).replace(/['"]/g, '');
    for (const e of st.importClause.namedBindings.elements) top.set(e.name.text, m);
  } else if (ts.isFunctionDeclaration(st) && st.name) top.set(st.name.text, 'LOCAL-TOP');
  else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) top.set(d.name.text, 'LOCAL-TOP');
}
let fn = null;
(function f(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === comp) fn = n; ts.forEachChild(n, f); })(sf);
const used = new Map();
function scan(node) {
  (function w(n) {
    if (ts.isIdentifier(n) && top.has(n.text) && !setNames.has(n.text)) {
      const m = top.get(n.text);
      if (!used.has(m)) used.set(m, new Set());
      used.get(m).add(n.text);
    }
    ts.forEachChild(n, w);
  })(node);
}
for (const st of fn.body.statements) if (ts.isVariableStatement(st))
  for (const d of st.declarationList.declarations)
    if (ts.isIdentifier(d.name) && setNames.has(d.name.text)) scan(d.initializer || d);
const out = [];
for (const [m, names] of [...used.entries()].sort()) out.push(`${m}: ${[...names].sort().join(', ')}`);
fs.writeFileSync('/tmp/deps.txt', out.join('\n') + '\n');
