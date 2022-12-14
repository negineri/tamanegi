import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import bitmapFnt from "assets/biz-udpmincho64/biz-udpmincho64.fnt";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN1_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN1_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN2_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN2_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const main1Window = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN1_WINDOW_PRELOAD_WEBPACK_ENTRY,
      // nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  main1Window.loadURL(MAIN1_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  main1Window.webContents.openDevTools();
  /*
  // Create the browser window.
  const main2Window = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN2_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  main2Window.loadURL(MAIN2_WINDOW_WEBPACK_ENTRY);
  main2Window.webContents.openDevTools();
  */
};

ipcMain.handle("open", (_) => {
  const data = JSON.parse(fs.readFileSync("./assets/sentences.json", "utf8"));
  return data;
});

ipcMain.handle("loadFnt", (_) => {
  const data = "debug";
  return data;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
