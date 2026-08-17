const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tools = require("../electron/main/tools/external-tools.cjs");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starcanvas-deface-staging-"));
const asciiTempRoot = path.join(tempRoot, "ascii-temp");
const unicodeUserData = path.join(tempRoot, "中文 用户数据");

function testVideoBytes() {
  const bytes = Buffer.alloc(4096, 0);
  bytes.writeUInt32BE(24, 0);
  bytes.write("ftyp", 4, "ascii");
  bytes.write("isom", 8, "ascii");
  return bytes;
}

function testPayload(outputFilename = "中文 输出.mp4") {
  return {
    bytes: testVideoBytes(),
    mime: "video/mp4",
    filename: "中文 输入.mp4",
    outputFilename,
    keepAudio: true
  };
}

function stagingEntries(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).filter((name) => name.startsWith("starcanvas-deface-"));
}

function windowsRuntime(runCommand, candidates = [asciiTempRoot]) {
  return {
    isWindows: true,
    userDataPath: unicodeUserData,
    asciiTempCandidates: candidates,
    resolveCommand: () => path.join(tempRoot, "deface.exe"),
    isBundledCommand: () => true,
    runCommand
  };
}

(async () => {
  try {
    fs.mkdirSync(asciiTempRoot, { recursive: true });
    fs.mkdirSync(unicodeUserData, { recursive: true });

    let successInputPath = "";
    let successOutputPath = "";
    const successResult = await tools.blurVideoFaces(testPayload("../../中文 输出.mp4"), windowsRuntime(async (_command, args) => {
      successInputPath = args[0];
      successOutputPath = args[args.indexOf("--output") + 1];
      assert.equal(tools.isAsciiFilesystemPath(successInputPath), true);
      assert.equal(tools.isAsciiFilesystemPath(successOutputPath), true);
      const realAsciiTempRoot = fs.realpathSync(asciiTempRoot);
      assert.equal(path.relative(realAsciiTempRoot, successInputPath).startsWith(".."), false);
      assert.equal(path.relative(realAsciiTempRoot, successOutputPath).startsWith(".."), false);
      assert.equal(args.includes("--backend"), true);
      assert.equal(args[args.indexOf("--backend") + 1], "opencv");
      fs.writeFileSync(successOutputPath, testVideoBytes());
    }));

    assert.equal(successResult.ok, true);
    assert.equal(successResult.localPath.includes("中文 用户数据"), true);
    assert.equal(path.dirname(successResult.localPath), path.join(unicodeUserData, "video-face-blur"));
    assert.equal(fs.existsSync(successResult.localPath), true);
    assert.equal(fs.statSync(successResult.localPath).size, testVideoBytes().length);
    assert.equal(fs.existsSync(successInputPath), false);
    assert.equal(fs.existsSync(successOutputPath), false);
    assert.deepEqual(stagingEntries(asciiTempRoot), []);

    const existingResult = path.join(unicodeUserData, "video-face-blur", "existing-result.mp4");
    fs.writeFileSync(existingResult, testVideoBytes());
    let failedStagingRoot = "";
    await assert.rejects(
      () => tools.blurVideoFaces(testPayload("失败 输出.mp4"), windowsRuntime(async (_command, args) => {
        failedStagingRoot = path.dirname(args[0]);
        throw new Error(`${args[0]} could not open ${args[args.indexOf("--output") + 1]}`);
      })),
      (error) => {
        assert.equal(error.code, "DEFACE_RUNTIME_FAILED");
        assert.equal(/starcanvas-deface|中文 用户数据|input\.mp4|output\.mp4/.test(String(error.message)), false);
        return true;
      }
    );
    assert.equal(fs.existsSync(failedStagingRoot), false);
    assert.equal(fs.existsSync(existingResult), true);
    assert.equal(fs.statSync(existingResult).size, testVideoBytes().length);
    assert.deepEqual(stagingEntries(asciiTempRoot), []);

    const unicodeTempRoot = path.join(tempRoot, "中文 临时目录");
    fs.mkdirSync(unicodeTempRoot, { recursive: true });
    let unavailableRanCommand = false;
    await assert.rejects(
      () => tools.blurVideoFaces(testPayload(), windowsRuntime(async () => {
        unavailableRanCommand = true;
      }, [unicodeTempRoot])),
      (error) => {
        assert.equal(error.code, "ASCII_TEMP_UNAVAILABLE");
        assert.equal(String(error.message).includes(unicodeTempRoot), false);
        return true;
      }
    );
    assert.equal(unavailableRanCommand, false);

    const asciiSymlink = path.join(tempRoot, "ascii-symlink");
    fs.symlinkSync(unicodeTempRoot, asciiSymlink, "dir");
    assert.throws(
      () => tools.createWindowsDefaceStaging([asciiSymlink]),
      (error) => error?.code === "ASCII_TEMP_UNAVAILABLE"
    );

    let macInputPath = "";
    let macOutputPath = "";
    const macResult = await tools.blurVideoFaces(testPayload("mac 输出.mp4"), {
      isWindows: false,
      userDataPath: unicodeUserData,
      resolveCommand: () => "/usr/local/bin/deface",
      isBundledCommand: () => false,
      runCommand: async (_command, args) => {
        macInputPath = args[0];
        macOutputPath = args[args.indexOf("--output") + 1];
        fs.writeFileSync(macOutputPath, testVideoBytes());
      }
    });
    assert.equal(macResult.ok, true);
    assert.equal(tools.isAsciiFilesystemPath(macInputPath), false);
    assert.equal(tools.isAsciiFilesystemPath(macOutputPath), false);
    assert.equal(fs.existsSync(macInputPath), true);
    assert.equal(fs.existsSync(macOutputPath), true);

    console.log("Windows Deface ASCII staging and Unicode result contract passed");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
