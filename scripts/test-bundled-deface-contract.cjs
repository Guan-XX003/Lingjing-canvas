const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const copyPlatformToolRuntime = require("./copy-platform-tool-runtime.cjs");
const tools = require("../electron/main/tools/external-tools.cjs");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starcanvas-deface-contract-"));

function writePortableWindowsRuntime(sourceRoot) {
  const runtimeRoot = path.join(sourceRoot, "win32-x64");
  const executable = path.join(runtimeRoot, "bin", "deface.exe");
  const manifestPath = path.join(runtimeRoot, "deface", "wanjuan-bundled-deface.json");
  const licensePath = path.join(runtimeRoot, "deface", "LICENSES.md");
  fs.mkdirSync(path.dirname(executable), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const executableBytes = Buffer.alloc(1024 * 1024 + 1);
  executableBytes.write("MZ", 0, "ascii");
  fs.writeFileSync(executable, executableBytes);
  fs.writeFileSync(manifestPath, JSON.stringify({
    name: "Deface",
    id: "deface",
    version: "1.5.0",
    platform: "win32",
    arch: "x64",
    command: "bin\\deface.exe",
    runtime: "pyinstaller-onefile",
    requiresSystemPython: false,
    backend: "opencv-cpu"
  }), "utf8");
  fs.writeFileSync(licensePath, "Deface MIT license notice", "utf8");
  return runtimeRoot;
}

(async () => {
  try {
    const missingSource = path.join(tempRoot, "missing-source");
    const missingOut = path.join(tempRoot, "missing-out");
    await assert.rejects(
      () => copyPlatformToolRuntime({ electronPlatformName: "win32", arch: 1, appOutDir: missingOut }, { sourceRoot: missingSource }),
      /requires Deface executable, manifest, and license notice/
    );

    const sourceRoot = path.join(tempRoot, "source with 中文");
    const sourceRuntime = writePortableWindowsRuntime(sourceRoot);
    assert.doesNotThrow(() => copyPlatformToolRuntime.assertWindowsDefaceRuntime(sourceRuntime));

    const appOutDir = path.join(tempRoot, "packaged app with 中文");
    await copyPlatformToolRuntime({ electronPlatformName: "win32", arch: 1, appOutDir }, { sourceRoot });
    const packagedRoot = path.join(appOutDir, "resources", "tool-runtime", "win32-x64");
    assert.doesNotThrow(() => copyPlatformToolRuntime.assertWindowsDefaceRuntime(packagedRoot));
    assert.equal(fs.existsSync(path.join(packagedRoot, "bin", "deface.exe")), true);

    const macOutDir = path.join(tempRoot, "mac-out");
    await assert.doesNotReject(() => copyPlatformToolRuntime(
      { electronPlatformName: "darwin", arch: 3, appOutDir: macOutDir },
      { sourceRoot: missingSource }
    ));

    const pathBearingError = new Error("C:\\Users\\Test User\\视频 工作区\\input.mp4 failed");
    pathBearingError.stderr = "File C:\\Users\\Test User\\AppData\\Local\\Temp\\deface.py";
    const safeMessage = tools.defaceFailureMessage(pathBearingError);
    assert.equal(safeMessage, "视频人脸打码失败：Deface 本地运行失败（RUNTIME_FAILED）");
    assert.equal(/Test User|AppData|input\.mp4|deface\.py/.test(safeMessage), false);

    const prepareSource = fs.readFileSync(path.join(repoRoot, "scripts", "prepare-bundled-deface.cjs"), "utf8");
    const toolsSource = fs.readFileSync(path.join(repoRoot, "electron", "main", "tools", "external-tools.cjs"), "utf8");
    assert.match(prepareSource, /"--onefile"/);
    assert.match(prepareSource, /"--collect-data", "deface"/);
    assert.match(prepareSource, /"--collect-all", "imageio_ffmpeg"/);
    assert.match(toolsSource, /args\.push\("--backend", "opencv"\)/);
    assert.match(toolsSource, /Windows 版 Deface 随 StarCanvas 安装包提供，不支持在线安装/);

    console.log("bundled Deface packaging and privacy contract passed");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
