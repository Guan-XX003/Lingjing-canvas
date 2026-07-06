// 列出 bundle 某个顶层函数引用了哪些「顶层符号」（import 名 + 顶层 var/function + 解构名）。
// 用于把巨型组件整体搬迁时生成精确的 import 头。
// 用法：node scripts/toplevel-refs.cjs <functionName>  → 写 /tmp/toplevel-refs.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const target = process.argv[2];

// 1) 收集顶层符号名（import specifiers、顶层 var/function、解构 { } = q）
const topNames = new Map(); // name -> kind
for (const st of sf.statements) {
  if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
    const from = st.moduleSpecifier.getText(sf).replace(/['"]/g, '');
    for (const el of st.importClause.namedBindings.elements) topNames.set(el.name.text, 'import:' + from);
  } else if (ts.isFunctionDeclaration(st) && st.name) {
    topNames.set(st.name.text, 'func');
  } else if (ts.isVariableStatement(st)) {
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name)) topNames.set(d.name.text, 'var');
      else if (ts.isObjectBindingPattern(d.name)) {
        for (const e of d.name.elements) if (ts.isIdentifier(e.name)) topNames.set(e.name.text, 'destructure');
      }
    }
  }
}

// 2) 找目标函数节点，收集其内部引用的所有标识符
let fnNode = null;
for (const st of sf.statements) {
  if (ts.isFunctionDeclaration(st) && st.name?.text === target) fnNode = st;
  if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations)
    if (ts.isIdentifier(d.name) && d.name.text === target) fnNode = d.initializer || fnNode;
}
if (!fnNode) { fs.writeFileSync('/tmp/toplevel-refs.txt', 'FUNCTION NOT FOUND: ' + target + '\n'); process.exit(1); }

const used = new Set();
(function walk(n) {
  if (ts.isIdentifier(n)) used.add(n.text);
  ts.forEachChild(n, walk);
})(fnNode);

// 3) 交集：目标函数用到的顶层符号
const refs = [...used].filter((x) => topNames.has(x) && x !== target).sort();
const byMod = {};
for (const r of refs) { const k = topNames.get(r); (byMod[k] = byMod[k] || []).push(r); }
const out = [`# ${target} references ${refs.length} top-level symbols`];
for (const [mod, names] of Object.entries(byMod).sort()) out.push(`${mod}: ${names.join(', ')}`);
fs.writeFileSync('/tmp/toplevel-refs.txt', out.join('\n') + '\n');
