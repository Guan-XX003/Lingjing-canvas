const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

assert.equal(pkg.build.artifactName, `万卷灵境-${pkg.version}-${"${arch}"}.${"${ext}"}`);
assert.equal(pkg.build.mac.extendInfo.CFBundleShortVersionString, pkg.version);
assert.equal(pkg.build.mac.extendInfo.CFBundleVersion, pkg.version);

const bundle = read("src/renderer/bundle/index.js");
assert.equal(bundle.includes("children: `v1.3.9`"), false);
assert.equal(bundle.includes("chrome?.runtime?.getManifest?.()?.version"), true);

for (const relativePath of [
  "src/renderer/components/settings-basic-tab.tsx",
  "src/renderer/lib/app-notifications.ts",
  "src/renderer/hooks/use_buildBackupPayload.ts",
  "electron/preload/chrome-shim.cjs",
]) {
  assert.equal(read(relativePath).includes(pkg.version), true, `${relativePath} does not contain ${pkg.version}`);
}

console.log(`version consistency: package, bundle, mac metadata and renderer fallbacks use ${pkg.version}`);
