// 作用域感知的符号重命名（TS LanguageService）。只改标识符引用，不碰字符串/注释/同名局部。
// 用法：node scripts/rename-symbol.cjs <declLine>:<oldName>:<newName> [...]
//   declLine = 该符号「声明」所在行号（用 binding-count.cjs 查）。
// 结果写回 bundle/index.js，报告写 /tmp/rename-report.txt。
const ts = require('typescript');
const fs = require('node:fs');
const FILE = require('node:path').resolve('src/renderer/bundle/index.js');
let text = fs.readFileSync(FILE, 'utf8');

let rawSpecs = process.argv.slice(2);
if (rawSpecs.length === 1 && rawSpecs[0] === '--file') rawSpecs = fs.readFileSync('/tmp/alias-specs.txt', 'utf8').split('\n').filter(Boolean);
const renames = rawSpecs.map((s) => {
  const i1 = s.indexOf(':'), i2 = s.indexOf(':', i1 + 1);
  return { line: +s.slice(0, i1), oldName: s.slice(i1 + 1, i2), newName: s.slice(i2 + 1) };
});

const host = {
  getScriptFileNames: () => [FILE],
  getScriptVersion: () => '1',
  getScriptSnapshot: (f) => (f === FILE ? ts.ScriptSnapshot.fromString(text) : (ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined)),
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => ({ allowJs: true, checkJs: false, noEmit: true, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }),
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};
const service = ts.createLanguageService(host, ts.createDocumentRegistry());
const sf = service.getProgram().getSourceFile(FILE);

function offsetAt(line, name) {
  const start = sf.getPositionOfLineAndCharacter(line - 1, 0);
  const end = line < sf.getLineStarts().length ? sf.getPositionOfLineAndCharacter(line, 0) : text.length;
  const seg = text.slice(start, end);
  const re = new RegExp('(?<![\\w$])' + name.replace(/\$/g, '\\$') + '(?![\\w$])');
  const m = seg.search(re);
  if (m < 0) throw new Error(`identifier ${name} not found on line ${line}`);
  return start + m;
}

const spans = [];
const report = [];
for (const r of renames) {
  const pos = offsetAt(r.line, r.oldName);
  const locs = service.findRenameLocations(FILE, pos, false, false, {}) || [];
  report.push(`${r.oldName} -> ${r.newName}: ${locs.length} locations`);
  for (const loc of locs) spans.push({ start: loc.textSpan.start, length: loc.textSpan.length, newName: r.newName });
}
spans.sort((a, b) => b.start - a.start);
for (const s of spans) text = text.slice(0, s.start) + s.newName + text.slice(s.start + s.length);
fs.writeFileSync(FILE, text);
fs.writeFileSync('/tmp/rename-report.txt', report.join('\n') + `\nTOTAL ${spans.length} locations applied\n`);
