const path = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

const Einfach = require("./src/json/data.json");
const {
    createMainWindow,
    createSettingWindow,
    createMusicWindow
} = require("./src/js/windows");

const Win = {};
Win.mainWindow = null;
Win.settingWindow = null;
Win.musicWindow = null;
Win.createSettingWindow = createSettingWindow;
Win.createMusicWindow = createMusicWindow;

module.exports = Win;

const events = require("./src/js/events.js");

app.whenReady().then(() => {
    Win.mainWindow = createMainWindow();

    /**
     * 桌面圖示被點擊時觸發
     */
    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            Win.mainWindow = createMainWindow();
        }
    });
});

/**
 * 關閉所有視窗時觸發，除 macOS 以外
 */
app.on("window-all-closed", function () {
    // darwin 為 macOS 的作業系統
    if (process.platform !== "darwin") app.quit();
});


/**
 * 事件監聽註冊
 */
for (let event in events)
    ipcMain.on(event, events[event]);