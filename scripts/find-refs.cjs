// 列出某符号的真实引用行（LanguageService，精确，无字符串/正则假阳性）。
// 用法：node scripts/find-refs.cjs <declLine>:<name> [...] → 写 /tmp/refs.txt
const ts = require('typescript');
const fs = require('node:fs');
const FILE = require('node:path').resolve('src/renderer/bundle/index.js');
const text = fs.readFileSync(FILE, 'utf8');
const host = {
  getScriptFileNames: () => [FILE], getScriptVersion: () => '1',
  getScriptSnapshot: (f) => (f === FILE ? ts.ScriptSnapshot.fromString(text) : (ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined)),
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => ({ allowJs: true, checkJs: false, noEmit: true }),
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists, readFile: ts.sys.readFile,
};
const service = ts.createLanguageService(host, ts.createDocumentRegistry());
const sf = service.getProgram().getSourceFile(FILE);
const lines = text.split('\n');
function offsetAt(line, name) {
  const start = sf.getPositionOfLineAndCharacter(line - 1, 0);
  const seg = text.slice(start, sf.getPositionOfLineAndCharacter(line, 0));
  const m = seg.search(new RegExp('(?<![\\w$])' + name.replace(/\$/g, '\\$') + '(?![\\w$])'));
  return start + m;
}
const out = [];
for (const spec of process.argv.slice(2)) {
  const i = spec.indexOf(':');
  const line = +spec.slice(0, i), name = spec.slice(i + 1);
  const refs = service.findReferences(FILE, offsetAt(line, name)) || [];
  const locs = [];
  for (const r of refs) for (const e of r.references) locs.push(sf.getLineAndCharacterOfPosition(e.textSpan.start).line + 1);
  out.push(`### ${name} @${line}: refs at ${[...new Set(locs)].sort((a, b) => a - b).join(', ')}`);
  for (const L of [...new Set(locs)].sort((a, b) => a - b)) out.push(`  ${L}: ${lines[L - 1].trim().slice(0, 88)}`);
}
fs.writeFileSync('/tmp/refs.txt', out.join('\n') + '\n');
