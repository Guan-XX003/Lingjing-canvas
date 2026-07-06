// 从对象解构 `key: localName` 里，找出 localName 仍是压缩名（≤2 字符或单大写等）的绑定，
// 生成把 localName 改成 key（语义名）的重命名 specs。可选限定行号区间（只处理某函数）。
// 用法：node scripts/destructure-renames.cjs [minLine] [maxLine] → 写 /tmp/alias-specs.txt
const ts = require('typescript');
const fs = require('node:fs');
const src = fs.readFileSync('src/renderer/bundle/index.js', 'utf8');
const sf = ts.createSourceFile('i.js', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ln = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
const min = Number(process.argv[2] || 0), max = Number(process.argv[3] || 1e9);

const isMinified = (name) => /^[a-z_]$/.test(name) || /^[A-Z][a-z]?$/.test(name) || /^[A-Za-z]{2}$/.test(name);
const isGoodKey = (k) => /^[A-Za-z_][\w$]{2,}$/.test(k) && !/^(default)$/.test(k);

const specs = [];
const seenTargets = new Set();
(function walk(n) {
  if (ts.isBindingElement(n) && n.propertyName && ts.isIdentifier(n.name)) {
    const key = n.propertyName.getText(sf);
    const local = n.name.text;
    const line = ln(n.name.getStart(sf));
    if (line >= min && line <= max && local !== key && isMinified(local) && isGoodKey(key) && !seenTargets.has(key)) {
      specs.push(`${line}:${local}:${key}`);
      seenTargets.add(key);
    }
  }
  ts.forEachChild(n, walk);
})(sf);

fs.writeFileSync('/tmp/alias-specs.txt', specs.join('\n') + '\n');
fs.writeFileSync('/tmp/destructure-report.txt', `${specs.length} minified destructure locals in [${min},${max}]\n` + specs.join('\n') + '\n');
