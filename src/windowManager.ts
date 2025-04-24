import electron, {app, BrowserWindow, ipcMain} from "electron";
import {Utils} from "./config/utils";
import {ConfigModel} from "./model/config-model";
import path from "path";
import fs from "fs";
import {EventModel} from "./model/event-model";
import Display = Electron.Display;

class WindowManager {
  private readonly config: ConfigModel;
  private readonly utils: Utils;
  private mainWindow: BrowserWindow;
  private secondaryWindow: BrowserWindow;

  public constructor(config: ConfigModel, utils: Utils) {
    this.config = config;
    this.utils = utils;
  }

  openWindows() {
    const displays = electron.screen.getAllDisplays();
    const primaryDisplay = displays[0];
    const secondaryDisplay = displays.length > 1 ? displays[1] : null;
    if (secondaryDisplay) {
      if (this.config.invertDisplay) {
        this.createWindow(secondaryDisplay, this.config, this.utils)
        this.createSecondaryWindow(primaryDisplay)
      } else {
        this.createWindow(primaryDisplay, this.config, this.utils)
        this.createSecondaryWindow(secondaryDisplay)
      }

    } else {
      this.createWindow(primaryDisplay, this.config, this.utils)
    }
  }


  closeWindow = () => {
    console.log("Closing application");
    BrowserWindow.getAllWindows().forEach(win => win.destroy()); // mata todas las ventanas
    app.exit();
    /*if (this.mainWindow) {
      this.mainWindow.close();
      this.mainWindow = null;
    }
    if (this.secondaryWindow) {
      this.secondaryWindow.close();
      this.secondaryWindow = null;
    }*/
  }

  createWindow = (display: Display, config: ConfigModel, utils: Utils): BrowserWindow => {
    if (this.mainWindow) {
      return this.mainWindow;
    }
    this.mainWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      fullscreen: true,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        partition: 'persist:no-cache'  // Add this line to disable caching
      },
    });
    this.mainWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(`
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #fff; }
            #loading-spinner { font-size: 24px; color: #333; }
          </style>
        </head>
        <body>
          <div id="loading-spinner">Cargando...</div>
        </body>
      </html>
    `));

    this.mainWindow.loadURL(config.url);
    //this.mainWindow.webContents.openDevTools()
    const cache = true;
    if (cache) {
      const cacheBuster = new Date().getTime();
      const urlWithCacheBuster = `${config.url}?cb=${cacheBuster}`;
      this.mainWindow.loadURL(urlWithCacheBuster);
      this.mainWindow.webContents.session.clearStorageData();
      this.mainWindow.webContents.session.clearCache().then(() => {
        console.log('Cache cleared');
      }).catch(err => {
        console.error('Failed to clear cache:', err);
      });
    }
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });
    const appVersion = app.getVersion();
    let videoPath = path.join((process as any).resourcesPath, 'public', 'assets', 'video.mp4');
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      videoPath = path.join(__dirname, 'assets', 'video.mp4');
    } 
    console.log('Version: ' + appVersion)
    this.mainWindow.webContents.executeJavaScript(`
        const versionDiv = document.createElement('div');
        versionDiv.textContent = 'Version: ${appVersion}';
        versionDiv.style.position = 'fixed';
        versionDiv.style.bottom = '10px';
        versionDiv.style.left = '10px';
        versionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        versionDiv.style.color = 'white';
        versionDiv.style.padding = '5px 10px';
        versionDiv.style.borderRadius = '5px';
        versionDiv.style.zIndex = '1000';
        versionDiv.style.fontSize = '12px';
        document.body.appendChild(versionDiv);
      `); 
    ipcMain.handle('get-local-storage', async (event, key) => {
      const result = await this.mainWindow.webContents.executeJavaScript(`
        localStorage.getItem('${key}');
      `);
      return result;
    });
    ipcMain.handle('get-server-url', () => {
      return config.url;
    });
    ipcMain.handle('check-video', async () => {
      try {      
        await fs.promises.access(videoPath, fs.constants.F_OK);
        return videoPath;
      } catch (error) {
        return null;
      }
    });
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('Window content has finished loading');
      this.sendToMainWindows({
        event: "initial message"
      })

      console.log('Window content has finished loading');
      this.sendToMainWindows({
        event: "express_app_initialized"
      })
      this.sendToMainWindows({
        event: "echo-clientDeviceId",
        data: utils.getUUID()
      })
    });
    return this.mainWindow;
  };

  createSecondaryWindow = (display: Display): BrowserWindow => {
    if (this.secondaryWindow) {
      return this.secondaryWindow;
    }
    this.secondaryWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      fullscreen: true,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: true,
        webSecurity: false
      },
    });
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.secondaryWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + "/index.html");
    } else {
      this.secondaryWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
    const appVersion = app.getVersion();
    console.log('Version: ' + appVersion)

    /*this.secondaryWindow.webContents.executeJavaScript(`
        const versionDiv = document.createElement('div');
        versionDiv.textContent = 'Version: ${appVersion}';
        versionDiv.style.position = 'fixed';
        versionDiv.style.bottom = '10px';
        versionDiv.style.left = '10px';
        versionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        versionDiv.style.color = 'white';
        versionDiv.style.padding = '5px 10px';

        versionDiv.style.borderRadius = '5px';
        versionDiv.style.zIndex = '1000';
        versionDiv.style.fontSize = '12px';
        document.body.appendChild(versionDiv);
      `);*/
    //this.secondaryWindow.webContents.openDevTools({ mode: 'detach' });
    return this.secondaryWindow;
  };

  public sendToMainWindows(data: EventModel) {
    this.mainWindow?.webContents.send("EXPRESS_TO_CLIENT", {
      status: data
    });
  }
  public sendToMainClientWindows = (data: EventModel) => {
    this.secondaryWindow?.webContents.send("EXPRESS_TO_CLIENT_ARTICLE", {
      status: data
    });
  }
}

export default WindowManager;
