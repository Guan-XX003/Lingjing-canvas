// bundle 顶层语句边界测绘（tsc AST）。用法：node scripts/map-bundle.js [minLine] [maxLine] > out.txt
const ts = require('typescript');
const src = require('fs').readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2] || 0), max = Number(process.argv[3] || 1e9);
const out = [];
for (const st of sf.statements) {
  const a = ln(st.getStart(sf)), b = ln(st.end);
  if (a < min || a > max) continue;
  if (ts.isImportDeclaration(st)) continue;
  let d = ts.SyntaxKind[st.kind];
  if (ts.isVariableStatement(st))
    d = 'var: ' + st.declarationList.declarations.map(x => `${x.name.getText(sf).slice(0,22)}[${ln(x.getStart(sf))}-${ln(x.end)}]`).join(', ');
  else if (ts.isFunctionDeclaration(st)) d = 'function ' + (st.name?.text || '?');
  out.push(`${a}-${b} (${b-a+1})  ${d}`);
}
require('fs').writeFileSync('/tmp/bundle-map.txt', out.join('\n') + '\n');
