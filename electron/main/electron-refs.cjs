// 集中解析 Electron 主进程对象，供各模块共享引用。
// 保留原始的 electron/main → electron 回退逻辑。
let app, BrowserWindow, shell, ipcMain, dialog, net, Menu, session, nativeImage, safeStorage;
try {
  ({ app, BrowserWindow, shell, ipcMain, dialog, net, Menu, session, nativeImage, safeStorage } = require("electron/main"));
} catch {
  ({ app, BrowserWindow, shell, ipcMain, dialog, net, Menu, session, nativeImage, safeStorage } = require("electron"));
}
if (!net) {
  try {
    ({ net } = require("electron"));
  } catch {}
}
if (!session) {
  try {
    ({ session } = require("electron"));
  } catch {}
}
if (!nativeImage) {
  try {
    ({ nativeImage } = require("electron"));
  } catch {}
}
if (!safeStorage) {
  try {
    ({ safeStorage } = require("electron"));
  } catch {}
}

module.exports = { app, BrowserWindow, shell, ipcMain, dialog, net, Menu, session, nativeImage, safeStorage };
