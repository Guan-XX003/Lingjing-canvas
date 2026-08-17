const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const defaultSourceRoot = path.join(repoRoot, "tool-runtime");

function archName(arch) {
  const names = {
    0: "ia32",
    1: "x64",
    2: "armv7l",
    3: "arm64",
    4: "universal"
  };
  return names[arch] || String(arch || "");
}

function resourceRoot(context) {
  if (context.electronPlatformName === "darwin") {
    return path.join(context.appOutDir, "StarCanvas.app", "Contents", "Resources");
  }
  return path.join(context.appOutDir, "resources");
}

function copyRuntimeDir(from, to) {
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
  return true;
}

function assertWindowsDefaceRuntime(root) {
  const executable = path.join(root, "bin", "deface.exe");
  const manifestPath = path.join(root, "deface", "wanjuan-bundled-deface.json");
  const licensePath = path.join(root, "deface", "LICENSES.md");
  if (!fs.existsSync(executable) || !fs.existsSync(manifestPath) || !fs.existsSync(licensePath)) {
    throw new Error("Windows x64 package requires Deface executable, manifest, and license notice");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const header = fs.readFileSync(executable).subarray(0, 2).toString("ascii");
  if (manifest.platform !== "win32" || manifest.arch !== "x64" || manifest.runtime !== "pyinstaller-onefile" ||
      manifest.requiresSystemPython !== false || manifest.backend !== "opencv-cpu" ||
      String(manifest.command || "").replace(/\\/g, "/") !== "bin/deface.exe" ||
      header !== "MZ" || fs.statSync(executable).size < 1024 * 1024) {
    throw new Error("Windows x64 bundled Deface runtime is invalid or not portable");
  }
  return { executable, manifestPath, licensePath };
}

async function copyPlatformToolRuntime(context, options = {}) {
  const platformKey = context.electronPlatformName === "win32" ? "win32" : context.electronPlatformName;
  const architecture = archName(context.arch);
  const resources = resourceRoot(context);
  const targetRoot = path.join(resources, "tool-runtime");
  const sourceRoot = options.sourceRoot || defaultSourceRoot;
  const requiresWindowsDeface = platformKey === "win32" && architecture === "x64";
  const platformSource = path.join(sourceRoot, `${platformKey}-${architecture}`);
  if (requiresWindowsDeface) assertWindowsDefaceRuntime(platformSource);
  fs.rmSync(targetRoot, { recursive: true, force: true });

  const runtimeNames = [`${platformKey}-${architecture}`, platformKey];
  const copied = runtimeNames.filter((runtimeName) =>
    copyRuntimeDir(path.join(sourceRoot, runtimeName), path.join(targetRoot, runtimeName))
  );

  if (copied.length) {
    console.log(`Copied bundled tool runtime for ${platformKey}-${architecture}: ${copied.join(", ")}`);
  } else {
    console.log(`No bundled tool runtime found for ${platformKey}-${architecture}; package will use managed/user tools.`);
  }
  if (requiresWindowsDeface) assertWindowsDefaceRuntime(path.join(targetRoot, `${platformKey}-${architecture}`));
}

module.exports = copyPlatformToolRuntime;
module.exports.assertWindowsDefaceRuntime = assertWindowsDefaceRuntime;
