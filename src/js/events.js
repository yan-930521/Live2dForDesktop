const Einfach = require("../json/data.json");
const Win = require("../../index.js");
const { ipcMain } = require("electron");

module.exports[Einfach.IpcEvent.Close] = (e, data) => {
    switch (data) {
        case Einfach.Setting.List["SettingWindow"]:
            if (Win.settingWindow) {
                Win.settingWindow.close()
                Win.settingWindow = null;
            }
            break;
        case Einfach.Setting.List["MainWindow"]:
            if (Win.mainWindow) {
                Win.mainWindow.close()
                Win.mainWindow = null;
            }
            break;
        case Einfach.Setting.List["MusicWindow"]:
            if (Win.musicWindow) {
                Win.musicWindow.close()
                Win.musicWindow = null;
            }
            break;
    }
}

module.exports[Einfach.IpcEvent.Hidden] = (e, data) => {
    switch (data) {
        case Einfach.Setting.List["SettingWindow"]:
            if (Win.settingWindow) {
                Win.settingWindow.minimize();
            }
            break;
        case Einfach.Setting.List["MainWindow"]:
            if (Win.mainWindow) {
                Win.mainWindow.minimize();
            }
            break;
    }
}

module.exports[Einfach.IpcEvent.MusicStart] = (e, data) => {

    if (Win.musicWindow) {
        Win.musicWindow.close();
        Win.musicWindow = null;
    }
    Win.musicWindow = Win.createMusicWindow();
    let timer = setInterval(() => {
        if (Win.musicWindow) {
            Win.musicWindow.webContents.send(Einfach.IpcEvent.MusicData, data);
        }
        if (!Win.musicWindow) {
            clearInterval(timer);
        }
    }, 3000);

    ipcMain.on(Einfach.IpcEvent.MusicDataGot, () => {
        clearInterval(timer);
    });
}


module.exports[Einfach.IpcEvent.Append] = (e, data) => {
    switch (data) {
        case Einfach.Setting.List["SettingWindow"]:
            if (!Win.settingWindow) Win.settingWindow = Win.createSettingWindow();
            break;
    }
}