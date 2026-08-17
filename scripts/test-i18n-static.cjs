const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const allowlist = require("./i18n-static-allowlist.cjs");

const root = path.resolve(__dirname, "..");
const deepLanguagePacks = JSON.parse(fs.readFileSync(path.join(root, "src/renderer/lib/i18n-deep-packs.json"), "utf8"));
const runtimeSource = fs.readFileSync(path.join(root, "src/renderer/lib/i18n-runtime.js"), "utf8")
  .replace('import DEEP_LANGUAGE_PACKS from "./i18n-deep-packs.json";', `const DEEP_LANGUAGE_PACKS = ${JSON.stringify(deepLanguagePacks)};`);
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
  requestAnimationFrame: () => {},
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(runtimeSource, context, { filename: "i18n-runtime.js" });

const sourceFilesIn = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  if (entry.isDirectory()) return sourceFilesIn(file);
  return entry.name.endsWith(".tsx") ? [file] : [];
});

let componentFiles = sourceFilesIn(path.join(root, "src/renderer/components")).sort();
const fileFilter = String(process.env.WANJUAN_I18N_AUDIT_FILE || "").trim();
if (fileFilter) componentFiles = componentFiles.filter((file) => path.basename(file).includes(fileFilter));

const UI_PROPERTY_NAMES = new Set([
  "aria-label",
  "description",
  "emptyText",
  "helpText",
  "label",
  "placeholder",
  "subtitle",
  "title",
  "tooltip",
]);
const UI_CALL_NAMES = new Set([
  "alert",
  "confirm",
  "prompt",
  "showToast",
  "showToast2",
  "wanjuanT",
  "workspaceT",
  "workspaceTf",
]);

const chinese = /[\u3400-\u9fff]/;
const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
const propertyName = (node) => {
  const name = node?.name;
  if (!name) return "";
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return "";
};

const isUiLiteral = (node) => {
  if (ts.isJsxText(node)) return true;
  if (ts.isJsxAttribute(node.parent)) {
    const name = node.parent.name?.text || "";
    return UI_PROPERTY_NAMES.has(name);
  }
  let current = node.parent;
  for (let depth = 0; current && depth < 8; depth++, current = current.parent) {
    if (ts.isPropertyAssignment(current)) {
      const name = propertyName(current);
      if (name === "children" || UI_PROPERTY_NAMES.has(name)) return true;
      if (["className", "id", "type", "value", "model", "protocol", "path", "url"].includes(name)) return false;
    }
    if (ts.isCallExpression(current)) {
      const expression = current.expression;
      const name = ts.isIdentifier(expression) ? expression.text : ts.isPropertyAccessExpression(expression) ? expression.name.text : "";
      if (UI_CALL_NAMES.has(name)) return true;
    }
  }
  return false;
};

const literals = new Map();
for (const file of componentFiles) {
  assert.equal(fs.existsSync(file), true, `i18n audit file is missing: ${path.relative(root, file)}`);
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) && isUiLiteral(node)) {
      const value = normalize(node.text);
      if (value && chinese.test(value)) {
        const entries = literals.get(value) || [];
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        entries.push(`${path.relative(root, file)}:${position.line + 1}`);
        literals.set(value, entries);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const packs = context.wanjuanI18nRuntime.languagePacks;
const placeholders = (value) => [...String(value || "").matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
  .map((match) => match[1])
  .sort();
for (const [language, pack] of Object.entries(packs)) {
  if (language === "zh-CN") continue;
  for (const [source, translated] of Object.entries(pack || {})) {
    assert.deepEqual(
      placeholders(translated),
      placeholders(source),
      `${language} translation changed placeholders: ${source}`,
    );
  }
}
const missing = [];
for (const [literal, locations] of [...literals.entries()].sort(([a], [b]) => a.localeCompare(b, "zh-CN"))) {
  if (allowlist[literal]) continue;
  const traditional = packs["zh-TW"]?.[literal];
  const english = packs["en-US"]?.[literal];
  if (!traditional || !english || chinese.test(english)) {
    missing.push({ literal, locations, traditional: Boolean(traditional), english: Boolean(english) && !chinese.test(english) });
  }
}

if (missing.length) {
  console.error(`i18n static audit found ${missing.length} unregistered UI literals:`);
  for (const item of missing) {
    console.error(`- ${item.literal}`);
    console.error(`  zh-TW=${item.traditional ? "ok" : "missing"}, en-US=${item.english ? "ok" : "missing"}`);
    console.error(`  ${item.locations.join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`i18n static audit passed (${literals.size} UI literals, ${Object.keys(allowlist).length} domain values allowed)`);
}
