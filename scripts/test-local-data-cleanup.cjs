const assert = require("node:assert/strict");
const path = require("node:path");

const {
  createCleanupHelperSpec,
  isSafeManagedUserDataRoot,
  scheduleManagedLocalDataRemoval,
} = require("../electron/main/local-data-cleanup.cjs");

const appDataPath = path.resolve("/tmp/wanjuan-cleanup-test/app-data");
const managedRoot = path.join(appDataPath, "wanjuan-ai-canvas-desktop-test");
const allowedRoots = [managedRoot];

assert.equal(isSafeManagedUserDataRoot(managedRoot, { appDataPath, homePath: "/tmp/home", allowedRoots }), true);
assert.equal(isSafeManagedUserDataRoot(appDataPath, { appDataPath, homePath: "/tmp/home", allowedRoots }), false);
assert.equal(isSafeManagedUserDataRoot("/tmp/home", { appDataPath, homePath: "/tmp/home", allowedRoots }), false);
assert.equal(isSafeManagedUserDataRoot(path.parse(managedRoot).root, { appDataPath, homePath: "/tmp/home", allowedRoots }), false);
assert.equal(isSafeManagedUserDataRoot(path.join(appDataPath, "other-app"), { appDataPath, homePath: "/tmp/home", allowedRoots }), false);

const posix = createCleanupHelperSpec(managedRoot, 1234, "darwin");
assert.equal(posix.command, "/bin/sh");
assert.equal(posix.args.includes(managedRoot), true);
assert.equal(posix.args.includes("1234"), true);

const windows = createCleanupHelperSpec("C:\\Users\\test\\AppData\\Roaming\\wanjuan-ai-canvas-desktop-test", 5678, "win32");
assert.equal(windows.command, "powershell.exe");
assert.equal(windows.args.includes("-EncodedCommand"), true);

let spawned = null;
let quitCalled = false;
const result = scheduleManagedLocalDataRemoval({
  targetPath: managedRoot,
  appDataPath,
  homePath: "/tmp/home",
  allowedRoots,
  parentPid: 4321,
  platform: "darwin",
  quit: false,
  appRef: { getPath: () => managedRoot, quit: () => { quitCalled = true; } },
  spawnImpl(command, args, options) {
    spawned = { command, args, options };
    return { unref() {} };
  },
});
assert.equal(result.ok, true);
assert.equal(result.scheduled, true);
assert.equal(spawned.command, "/bin/sh");
assert.equal(spawned.options.detached, true);
assert.equal(quitCalled, false);

assert.throws(() => scheduleManagedLocalDataRemoval({
  targetPath: "/tmp/home",
  appDataPath,
  homePath: "/tmp/home",
  allowedRoots,
  quit: false,
  spawnImpl() { throw new Error("must not spawn"); },
}), /安全校验/);

console.log("local data cleanup tests passed");
