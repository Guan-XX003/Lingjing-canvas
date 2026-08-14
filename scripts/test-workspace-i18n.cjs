const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const runtimeSource = fs.readFileSync(path.join(root, "src/renderer/lib/i18n-runtime.js"), "utf8");
const preloadSource = fs.readFileSync(path.join(root, "electron/preload/desktop-patches.cjs"), "utf8");
const context = {
  console,
  localStorage: { getItem: () => "" },
  document: {
    readyState: "loading",
    addEventListener: () => {},
    documentElement: { dataset: {} },
    body: null,
  },
  MutationObserver: class MutationObserver { observe() {} },
  requestAnimationFrame: (callback) => callback(),
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(runtimeSource, context, { filename: "i18n-runtime.js" });

const literalKeys = new Set();
for (const pattern of [
  /workspaceT\("([^"]+)"\)/g,
  /workspaceTf\("([^"]+)"/g,
  /workspaceEscapedT\("([^"]+)"\)/g,
  /workspaceEscapedTf\("([^"]+)"/g,
]) {
  let match;
  while ((match = pattern.exec(preloadSource))) literalKeys.add(match[1]);
}

const dynamicKeys = [
  "发送到企业网关团队",
  "发布到局域网团队",
  "所有者",
  "管理员",
  "成员",
  "企业网关团队模板请求失败",
  "企业团队模板返回的组织或网关与当前会话不一致",
  "企业网关离线，正在显示上次同步缓存",
  "企业团队权限已失效，本地缓存已清理",
  "企业网关暂时不可用，正在显示缓存",
  "企业网关离线，未发送；重连后请重试",
];
const packs = context.wanjuanI18nRuntime.languagePacks;
for (const key of [...literalKeys, ...dynamicKeys]) {
  for (const language of ["zh-TW", "en-US"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(packs[language] || {}, key), true, `${language} is missing workspace translation: ${key}`);
    const translated = packs[language][key];
    assert.ok(translated, `${language} has an empty workspace translation: ${key}`);
    if (language === "en-US") {
      assert.notEqual(translated, key, `English falls back to the Simplified Chinese source: ${key}`);
      assert.equal(/[\u4e00-\u9fff]/.test(translated), false, `English translation contains Chinese text: ${key}`);
    }
  }
}

assert.equal(
  context.wanjuanI18nRuntime.format("角色：{role} · 团队模板：{count} 个", { role: "Admin", count: 3 }, "en-US"),
  "Role: Admin · Team templates: 3",
);
assert.equal(
  context.wanjuanI18nRuntime.format("角色：{role} · 团队模板：{count} 个", { role: "管理員", count: 3 }, "zh-TW"),
  "角色：管理員 · 團隊模板：3 個",
);

console.log(`workspace i18n translations passed (${literalKeys.size + dynamicKeys.length} checked keys)`);
