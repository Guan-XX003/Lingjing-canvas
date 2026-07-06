#!/usr/bin/env node
// 抽取后的原子验证 + 提交闸门。
//
// 目的：把「我读一堆 stdout 再判断对不对」这个易出错（甚至会幻觉）的环节，
// 换成一个我无法臆造的机器判决：脚本跑 tsc + build + test，把唯一的结论写进
// /tmp/verdict.json，只有全绿才 git commit，否则保留工作区供检查（不回滚，便于修）。
//
// 反幻觉闸门（最重要）：先查 `git diff` 是否为空。若为空，说明我以为改了盘但其实没改，
// 立即以 code=2 退出并在 verdict 里标 emptyDiff=true —— 正是上一轮踩的坑。
//
// 用法：node scripts/verify-and-commit.cjs "<commit message>"
//       node scripts/verify-and-commit.cjs --dry "<msg>"   # 只验证不提交
const { execSync } = require('node:child_process');
const fs = require('node:fs');

const args = process.argv.slice(2);
const dry = args[0] === '--dry';
const msg = dry ? args[1] : args[0];
const VERDICT = '/tmp/verdict.json';

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function bundleLines() {
  return fs.readFileSync('src/renderer/bundle/index.js', 'utf8').split('\n').length;
}

const verdict = { ok: false, steps: {}, bundleLines: bundleLines(), headBefore: run('git rev-parse --short HEAD').out.trim() };

// 反幻觉闸门：工作区必须有改动
const diff = run('git status --porcelain').out.trim();
if (!diff) {
  verdict.emptyDiff = true;
  verdict.reason = 'NO CHANGES on disk — extraction did not actually happen (probable hallucination).';
  fs.writeFileSync(VERDICT, JSON.stringify(verdict, null, 2));
  console.log('VERDICT: EMPTY_DIFF');
  process.exit(2);
}
verdict.changedFiles = diff.split('\n').length;

// 三道机器闸门
const tc = run('npx tsc --noEmit');
verdict.steps.typecheck = { code: tc.code, errors: (tc.out.match(/error TS\d+/g) || []).length };
const build = run('npm run build:web');
verdict.steps.build = { code: build.code };
const test = run('npm run test:lib');
verdict.steps.test = { code: test.code, tail: test.out.trim().split('\n').slice(-1)[0] };

verdict.ok = tc.code === 0 && build.code === 0 && test.code === 0;

if (verdict.ok && !dry) {
  run('git add -A');
  const c = run(`git commit -m ${JSON.stringify(msg)}`);
  verdict.committed = c.code === 0;
  verdict.headAfter = run('git rev-parse --short HEAD').out.trim();
  verdict.headMoved = verdict.headAfter !== verdict.headBefore;
} else {
  verdict.committed = false;
}
verdict.bundleLinesAfter = bundleLines();

fs.writeFileSync(VERDICT, JSON.stringify(verdict, null, 2));
console.log('VERDICT:', verdict.ok ? 'PASS' : 'FAIL', dry ? '(dry)' : (verdict.headMoved ? `committed ${verdict.headAfter}` : 'NOT committed'));
process.exit(verdict.ok ? 0 : 1);
