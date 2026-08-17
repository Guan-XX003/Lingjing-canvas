const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const deepLanguagePacks = JSON.parse(fs.readFileSync(path.join(root, "src/renderer/lib/i18n-deep-packs.json"), "utf8"));
const runtimeSource = fs.readFileSync(path.join(root, "src/renderer/lib/i18n-runtime.js"), "utf8")
  .replace('import DEEP_LANGUAGE_PACKS from "./i18n-deep-packs.json";', `const DEEP_LANGUAGE_PACKS = ${JSON.stringify(deepLanguagePacks)};`);
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
assert.equal(
  context.wanjuanI18nRuntime.t("最近更新 2026-08-16", "en-US"),
  "Last updated 2026-08-16",
  "registered placeholder patterns should translate their static wrapper",
);
assert.equal(
  context.wanjuanI18nRuntime.t("组 ID 已同步：group-local-42", "en-US"),
  "Group ID synced: group-local-42",
  "Tianji identifiers must remain unchanged while their wrapper is translated",
);
assert.equal(
  context.wanjuanI18nRuntime.t("JSON 导入失败：UPSTREAM 原始错误 /tmp/raw.json", "en-US"),
  "JSON import failed: UPSTREAM 原始错误 /tmp/raw.json",
  "captured API details and paths must remain byte-for-byte unchanged",
);

const primarySurfaceKeys = [
  "画布",
  "资源",
  "智能体",
  "工作空间",
  "设置",
  "我的账号",
  "模型服务",
  "运行",
  "数据",
  "基础",
  "会员状态",
  "会员权益",
  "登录 / 注册",
  "本地模式",
  "工具",
  "上传",
  "素材",
  "格式转换",
  "文本拼接",
  "网址转图片",
  "文件转网址",
  "常用工具",
  "九宫格拼图",
  "九宫格切分",
  "视频抽帧",
  "今日生图:",
  "个人本地版",
  "灵感",
  "机器人",
  "火花",
  "创作",
  "视觉",
];
for (const key of primarySurfaceKeys) {
  for (const language of ["zh-TW", "en-US"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(packs[language] || {}, key), true, `${language} is missing primary UI translation: ${key}`);
    assert.ok(packs[language][key], `${language} has an empty primary UI translation: ${key}`);
  }
  assert.equal(/[\u4e00-\u9fff]/.test(packs["en-US"][key]), false, `English primary UI translation contains Chinese text: ${key}`);
}

class FakeText {
  constructor(value) {
    this.nodeType = 3;
    this.nodeValue = value;
    this.parentElement = null;
  }
}

class FakeElement {
  constructor(className = "") {
    this.nodeType = 1;
    this.className = className;
    this.parentElement = null;
    this.children = [];
    this.attributes = new Map();
  }

  append(...nodes) {
    for (const node of nodes) {
      node.parentElement = this;
      this.children.push(node);
    }
    return this;
  }

  contains(node) {
    if (node === this) return true;
    return this.children.some((child) => child === node || (child.nodeType === 1 && child.contains(node)));
  }

  matches(selector) {
    return selector.split(",").some((part) => {
      const value = part.trim();
      if (!value) return false;
      if (value === "[data-wanjuan-i18n-root]") return this.attributes.has("data-wanjuan-i18n-root");
      if (value === "[data-wanjuan-i18n-skip]") return this.attributes.has("data-wanjuan-i18n-skip");
      if (value.startsWith(".")) return this.className.split(/\s+/).includes(value.slice(1));
      if (/^\[(title|aria-label|placeholder)\]$/.test(value)) return this.attributes.has(value.slice(1, -1));
      return false;
    });
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (element) => {
      for (const child of element.children) {
        if (child.nodeType !== 1) continue;
        if (child.matches(selector)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

const settingsRoot = new FakeElement("wanjuan-settings-page").append(new FakeText("设置"));
settingsRoot.setAttribute("title", "设置");
const latestUpdateText = new FakeText("最近更新 2026-08-16");
settingsRoot.append(latestUpdateText);
const dockRoot = new FakeElement("wanjuan-canvas-bottom-dock-wrap").append(new FakeText("工具"));
const agentUserContent = new FakeElement().append(new FakeText("用户自定义智能体与提示词正文"));
agentUserContent.setAttribute("data-wanjuan-i18n-skip", "true");
const agentRoot = new FakeElement("wanjuan-agent-page").append(new FakeText("新建智能体"), agentUserContent);
const canvasToolbarRoot = new FakeElement("wanjuan-canvas-top-tools").append(new FakeText("一键自动排版"));
const canvasProjectToolbarRoot = new FakeElement("wanjuan-canvas-project-toolbar").append(new FakeText("分组"));
const emptyCanvasRoot = new FakeElement("wanjuan-empty-canvas-placeholder").append(new FakeText("创建节点，展开你的想象"));
const projectGroupRoot = new FakeElement("wanjuan-project-group-dialog").append(new FakeText("项目分组"));
const taskDrawerRoot = new FakeElement("wanjuan-task-drawer").append(new FakeText("全局任务清单"), new FakeText("清空已结束"));
const unrelatedRoot = new FakeElement("unrelated").append(new FakeText("设置"));
const body = new FakeElement("body").append(settingsRoot, dockRoot, agentRoot, canvasToolbarRoot, canvasProjectToolbarRoot, emptyCanvasRoot, projectGroupRoot, taskDrawerRoot, unrelatedRoot);
const rafQueue = [];
const walkedRoots = [];
let observerCallback = null;
const domContext = {
  console,
  localStorage: { getItem: (key) => key === "appLanguage" ? "en-US" : "" },
  document: {
    readyState: "complete",
    addEventListener: () => {},
    documentElement: { dataset: {} },
    body,
    querySelectorAll: (selector) => {
      const matches = [];
      if (body.matches(selector)) matches.push(body);
      return matches.concat(body.querySelectorAll(selector));
    },
    createTreeWalker: (root) => {
      walkedRoots.push(root);
      const textNodes = [];
      const visit = (element) => {
        for (const child of element.children || []) {
          if (child.nodeType === 3) textNodes.push(child);
          else visit(child);
        }
      };
      visit(root);
      let index = 0;
      return { nextNode: () => textNodes[index++] || null };
    },
  },
  Node: { ELEMENT_NODE: 1 },
  NodeFilter: { SHOW_TEXT: 4 },
  MutationObserver: class MutationObserver {
    constructor(callback) { observerCallback = callback; }
    observe() {}
  },
  requestAnimationFrame: (callback) => {
    rafQueue.push(callback);
    return rafQueue.length;
  },
  setTimeout,
};
domContext.globalThis = domContext;
vm.createContext(domContext);
vm.runInContext(runtimeSource, domContext, { filename: "i18n-runtime-dom-test.js" });

assert.equal(rafQueue.length, 1, "initial language application should schedule one frame");
rafQueue.shift()();
assert.deepEqual(walkedRoots, [settingsRoot, dockRoot, agentRoot, canvasToolbarRoot, canvasProjectToolbarRoot, emptyCanvasRoot, projectGroupRoot, taskDrawerRoot], "full refresh should scan registered UI roots, not document.body");
assert.equal(settingsRoot.children[0].nodeValue, "Settings");
assert.equal(latestUpdateText.nodeValue, "Last updated 2026-08-16");
assert.equal(dockRoot.children[0].nodeValue, "Tools");
assert.equal(agentRoot.children[0].nodeValue, "New Agent");
assert.equal(agentUserContent.children[0].nodeValue, "用户自定义智能体与提示词正文", "agent user content must never be translated");
assert.equal(canvasToolbarRoot.children[0].nodeValue, "Auto Layout");
assert.equal(canvasProjectToolbarRoot.children[0].nodeValue, "Group");
assert.equal(emptyCanvasRoot.children[0].nodeValue, "Create a node and expand your imagination");
assert.equal(projectGroupRoot.children[0].nodeValue, "Project Groups");
assert.equal(taskDrawerRoot.children[0].nodeValue, "Global Task List");
assert.equal(taskDrawerRoot.children[1].nodeValue, "Clear Finished");
assert.equal(unrelatedRoot.children[0].nodeValue, "设置", "unregistered local/user content must remain unchanged");

observerCallback([{ type: "characterData", addedNodes: [], target: agentRoot.children[0] }]);
assert.equal(rafQueue.length, 0, "runtime-authored text changes should not schedule another frame");
agentRoot.children[0].nodeValue = "新建智能体";
observerCallback([{ type: "characterData", addedNodes: [], target: agentRoot.children[0] }]);
assert.equal(rafQueue.length, 1, "React text-node updates inside registered roots should be retranslated");
rafQueue.shift()();
assert.equal(agentRoot.children[0].nodeValue, "New Agent", "React rerenders must not restore stale Simplified Chinese UI");

walkedRoots.length = 0;
const addedBenefit = new FakeElement().append(new FakeText("会员权益"));
const addedUpload = new FakeElement().append(new FakeText("上传"));
settingsRoot.append(addedBenefit, addedUpload);
observerCallback([
  { type: "childList", addedNodes: [addedBenefit], target: settingsRoot },
  { type: "childList", addedNodes: [addedUpload], target: settingsRoot },
]);
assert.equal(rafQueue.length, 1, "multiple mutations in one delivery should schedule one frame");
rafQueue.shift()();
assert.deepEqual(walkedRoots, [addedBenefit, addedUpload], "mutation refresh should scan only dirty subtrees");
assert.equal(addedBenefit.children[0].nodeValue, "Member Benefits");
assert.equal(addedUpload.children[0].nodeValue, "Upload");

walkedRoots.length = 0;
observerCallback([{ type: "attributes", addedNodes: [], target: settingsRoot }]);
assert.equal(rafQueue.length, 0, "runtime-authored attribute changes should not schedule another frame");

const addedAccount = new FakeElement().append(new FakeText("我的账号"));
settingsRoot.append(addedAccount);
observerCallback([{ type: "childList", addedNodes: [addedAccount], target: settingsRoot }]);
let languageNotifications = 0;
const unsubscribeLanguage = domContext.wanjuanI18nRuntime.subscribe(() => languageNotifications++);
domContext.wanjuanI18nRuntime.setLanguage("zh-TW");
assert.equal(languageNotifications, 1, "direct i18n consumers should receive one language-change notification");
assert.equal(rafQueue.length, 1, "language change should coalesce with pending mutation work");
rafQueue.shift()();
assert.deepEqual(walkedRoots, [settingsRoot, dockRoot, agentRoot, canvasToolbarRoot, canvasProjectToolbarRoot, emptyCanvasRoot, projectGroupRoot, taskDrawerRoot], "language change should perform one registered-root refresh");
assert.equal(settingsRoot.children[0].nodeValue, "設定");
assert.equal(latestUpdateText.nodeValue, "最近更新 2026-08-16", "English placeholder output should restore to the canonical source before translating to Traditional Chinese");
assert.equal(dockRoot.children[0].nodeValue, "工具");
assert.equal(addedAccount.children[0].nodeValue, "我的帳號");
assert.equal(canvasProjectToolbarRoot.children[0].nodeValue, "分組");
assert.equal(emptyCanvasRoot.children[0].nodeValue, "建立節點，展開你的想像");
assert.equal(projectGroupRoot.children[0].nodeValue, "專案分組");
assert.equal(taskDrawerRoot.children[0].nodeValue, "全域任務清單");

walkedRoots.length = 0;
domContext.wanjuanI18nRuntime.setLanguage("zh-CN");
assert.equal(languageNotifications, 2, "switching back from English or Traditional Chinese should notify direct consumers");
assert.equal(rafQueue.length, 1, "switching back to Simplified Chinese should schedule one refresh");
rafQueue.shift()();
assert.equal(settingsRoot.children[0].nodeValue, "设置", "settings navigation should restore Simplified Chinese after English");
assert.equal(agentRoot.children[0].nodeValue, "新建智能体");
assert.equal(agentUserContent.children[0].nodeValue, "用户自定义智能体与提示词正文");
unsubscribeLanguage();

const dockSource = fs.readFileSync(path.join(root, "src/renderer/components/canvas-bottom-dock.tsx"), "utf8");
assert.match(dockSource, /runtime\?\.t\?\.\(text\)/, "canvas dock should translate high-frequency labels directly");
assert.match(dockSource, /runtime\?\.format\?\.\(text, values\)/, "canvas dock should format localized control titles directly");
const settingsSource = fs.readFileSync(path.join(root, "src/renderer/components/WanJuanSettingsSectionB.tsx"), "utf8");
assert.match(settingsSource, /settingsT\(`模型服务`\)/, "settings navigation groups should render directly from appLanguage");
assert.match(settingsSource, /settingsT\(`外观与通用`\)/, "settings navigation items should not depend on DOM mutation for language changes");
const projectGroupSource = fs.readFileSync(path.join(root, "src/renderer/components/project-group-panel.tsx"), "utf8");
assert.match(projectGroupSource, /position: `fixed`/, "project group modal should remain above the canvas toolbar at narrow heights and high zoom");
assert.match(projectGroupSource, /flex-1 min-h-0 overflow-y-auto overscroll-contain/, "project group contents should scroll inside the viewport-bounded modal");
assert.match(projectGroupSource, /aria-label": projectGroupT\(`关闭`\)/, "project group modal should expose a translated close action");
assert.match(projectGroupSource, /children: projectGroupT\(`项目分组`\)/, "project group UI should render directly in the selected language");
const taskDrawerSource = fs.readFileSync(path.join(root, "src/renderer/components/global-tasks-panel.tsx"), "utf8");
assert.match(taskDrawerSource, /children: taskT\(`全局任务清单`\)/, "task drawer heading should render directly in the selected language");
assert.match(taskDrawerSource, /children: taskT\(`清空已结束`\)/, "task drawer actions should render directly in the selected language");
const uiOverridesSource = fs.readFileSync(path.join(root, "electron/main/ui-overrides.css"), "utf8");
assert.match(uiOverridesSource, /\.wanjuan-system-notification-list\s*\{[\s\S]*?min-height:\s*0\s*!important;[\s\S]*?overflow-y:\s*auto\s*!important;[\s\S]*?overscroll-behavior:\s*contain\s*!important;/, "system notification list should scroll inside the viewport-bounded panel");
assert.match(uiOverridesSource, /\.wanjuan-system-notification-dialog-content\s*\{[\s\S]*?min-height:\s*0\s*!important;[\s\S]*?overflow-y:\s*auto\s*!important;/, "long notification details should scroll without pushing the close button or actions off screen");

const bundleSource = fs.readFileSync(path.join(root, "src/renderer/bundle/index.js"), "utf8");
const bundleCanvasKeys = [
  "一键自动排版",
  "撤销 (Ctrl+Z)",
  "重做 (Ctrl+Y)",
  "隐藏缩略图",
  "显示缩略图",
  "项目加载中...",
];
for (const key of bundleCanvasKeys) {
  assert.ok(bundleSource.includes(key), `bundle canvas source is missing audited literal: ${key}`);
  for (const language of ["zh-TW", "en-US"]) {
    assert.ok(packs[language]?.[key], `${language} is missing bundle canvas translation: ${key}`);
  }
}
assert.match(bundleSource, /ariaLabelConfig:\s*\{[\s\S]*?`控制面板`[\s\S]*?`缩略图`/, "React Flow controls should receive language-aware aria labels");
assert.match(bundleSource, /title: wanjuanCanvasT\(`一键自动排版`\)/, "canvas toolbar titles should render directly from appLanguage");
assert.match(bundleSource, /children: wanjuanCanvasT\(`项目加载中\.\.\.`\)/, "canvas loading text should render directly from appLanguage");
assert.match(bundleSource, /children: wanjuanT\(`工作空间`\)/, "workspace navigation should render directly from appLanguage");
const agentSource = fs.readFileSync(path.join(root, "src/renderer/components/WanJuanSettingsSectionA.tsx"), "utf8");
assert.match(agentSource, /"data-wanjuan-i18n-skip": true,[\s\S]*?children: message\.content/, "agent message text must be excluded from DOM translation");
assert.match(agentSource, /"data-message-id": message\.id/, "agent message wrappers should expose stable message identity");
assert.match(agentSource, /useLayoutEffect\(\(\) => \{[\s\S]*?translateTree\?\.\(agentPageRef\.current\)/, "agent UI should be translated after React navigation and config rerenders");

console.log(`workspace and primary UI i18n passed (${literalKeys.size + dynamicKeys.length + primarySurfaceKeys.length + bundleCanvasKeys.length} checked keys)`);
