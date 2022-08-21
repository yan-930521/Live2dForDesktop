const path = require("path");
const { screen, BrowserWindow } = require("electron");
const Einfach = require("../json/data.json");

module.exports.createMainWindow = () => {
    let winX = screen.getPrimaryDisplay().workAreaSize.width - Einfach.Setting.MainWindow.Width - Einfach.Setting.MoveImg.Width;
    let winY = screen.getPrimaryDisplay().workAreaSize.height - Einfach.Setting.MainWindow.Height - Einfach.Setting.MoveImg.Height;
    const win = new BrowserWindow({
        x: winX,
        y: winY,
        width: Einfach.Setting.MainWindow.Width,
        height: Einfach.Setting.MainWindow.Height,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        // resizable: false,
        fullscreenable: false,
        webPreferences: {
            // preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, "../html/index.html"));

    // win.webContents.openDevTools();

    // win.setIgnoreMouseEvents(true);

    return win;
}
module.exports.createMusicWindow = () => {
    const win = new BrowserWindow({
        width: (Einfach.Setting.MusicWindow.Width * 2),
        height: (Einfach.Setting.MusicWindow.Height * 2),
        frame: false,
        transparent: true,
        //alwaysOnTop: true,
        // resizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, "../html/music.html"));

    // win.webContents.openDevTools();

    // win.setIgnoreMouseEvents(true);
    return win;
}
module.exports.createSettingWindow = () => {
    const win = new BrowserWindow({
        width: Einfach.Setting.SettingWindow.Width,
        height: Einfach.Setting.SettingWindow.Height,
        frame: false,
        transparent: true,
        alwaysOnTop: false,
        // resizable: false,
        fullscreenable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, "../html/setting.html"));

    // win.webContents.openDevTools();

    // win.setIgnoreMouseEvents(true);

    return win;
}