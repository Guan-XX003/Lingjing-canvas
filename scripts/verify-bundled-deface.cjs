const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const platformKey = process.platform === "win32" ? "win32" : process.platform === "darwin" ? "darwin" : process.platform;
const archKey = process.arch === "x64" ? "x64" : process.arch === "ia32" ? "ia32" : process.arch === "arm64" ? "arm64" : process.arch;
const isWindows = process.platform === "win32";
const runtimeRoot = path.join(repoRoot, "tool-runtime", `${platformKey}-${archKey}`);
const candidates = isWindows
  ? [path.join(runtimeRoot, "bin", "deface.exe")]
  : [
      path.join(runtimeRoot, "bin", "deface"),
      path.join(runtimeRoot, "deface", "venv", "bin", "deface")
    ];
const manifestPath = path.join(runtimeRoot, "deface", "wanjuan-bundled-deface.json");
const licensePath = path.join(runtimeRoot, "deface", "LICENSES.md");

function commandWorks(command, args) {
  try {
    const output = execFileSync(command, args, {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });
    return String(output || "").trim() || "ok";
  } catch {
    return "";
  }
}

const existing = candidates.filter((candidate) => fs.existsSync(candidate));
if (!existing.length) {
  throw new Error(`Bundled Deface not found for ${platformKey}-${archKey}. Run npm run prepare:bundled-deface on this platform first.`);
}

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Bundled Deface manifest is missing for ${platformKey}-${archKey}: ${manifestPath}`);
}
if (!fs.existsSync(licensePath)) {
  throw new Error(`Bundled Deface license notice is missing for ${platformKey}-${archKey}: ${licensePath}`);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.platform !== platformKey || manifest.arch !== archKey || manifest.requiresSystemPython !== false) {
  throw new Error(`Bundled Deface manifest does not match ${platformKey}-${archKey}`);
}
if (isWindows) {
  const executable = existing[0];
  const header = fs.readFileSync(executable).subarray(0, 2).toString("ascii");
  if (manifest.runtime !== "pyinstaller-onefile" || manifest.backend !== "opencv-cpu" ||
      String(manifest.command || "").replace(/\\/g, "/") !== "bin/deface.exe" ||
      header !== "MZ" || fs.statSync(executable).size < 1024 * 1024) {
    throw new Error("Windows bundled Deface must be a non-placeholder PyInstaller executable");
  }
}

for (const command of existing) {
  const version = commandWorks(command, ["--version"]);
  if (version) {
    console.log(`Bundled Deface verified for ${platformKey}-${archKey}: ${command}`);
    console.log(version);
    process.exit(0);
  }
  const help = commandWorks(command, ["--help"]);
  if (help) {
    console.log(`Bundled Deface verified for ${platformKey}-${archKey}: ${command}`);
    console.log(help.split("\n")[0]);
    process.exit(0);
  }
}

throw new Error(`Bundled Deface exists but is not runnable for ${platformKey}-${archKey}: ${existing.join(", ")}`);
