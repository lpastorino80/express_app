import {ipcMain, session, app} from 'electron';
import { Config } from './config/config';
import {UsbManager} from "./printer/usb-manager";
import {Log} from "./config/log";
import {PrinterManager} from "./printer/printer-manager";
import {Utils} from "./config/utils";
import Socket from "./socket/socket";
import WindowManager from "./windowManager";
import { autoUpdater } from 'electron-updater';

new Log();
const utils = new Utils();
const config = new Config(utils);
const windowManager = new WindowManager(config, utils);

async function main() {
  if (config.config === null) {
    await app.whenReady();
    windowManager.openConfigWindows();

    ipcMain.on('set-config-url', (event, args) => {
      config.setConfigUrl(args);
      console.log("Restarting app with configUrl: " + JSON.stringify(args));
      main().catch((error) => {
        console.error("Error in initialization:", error);
      });
    });

    ipcMain.on('close-app', () => {
      windowManager.closeWindow();
      app.quit();
    });

  } else {
    await config.getServerConfig();
    windowManager.setConfig(config);
    const printerManager = new PrinterManager(config.serverConfig, windowManager, config.config, utils);
    console.log("Config:" + JSON.stringify(config));
    const usbManager = new UsbManager(printerManager);
    new Socket(config, printerManager);
    usbManager.startUsbListener();
    printerManager.startCheckPrinter();

    if (require('electron-squirrel-startup')) {
      app.quit();
    }

    ipcMain.on("EXPRESS", async (event, args) => {
      if (args === "socket_connected") {
        console.log("Event with name : " + JSON.stringify(args));
        setTimeout(() => {
          usbManager.checkPrinterStatus()
        }, 1000, this)
      } else if (args.event) {
        if (args.event === "print_ticket") {
          console.log("Event with name : " + JSON.stringify(args));
          await printerManager.printCommandsLines(args.data.deviceId, args.data.commands);
        }
        if (args.event === "close_app") {
          windowManager.closeWindow()
          app.quit();
        }
        if (args.event === "open_drawer") {
          await printerManager.openDrawer();
        }
        if (args.event === "ticket_changed") {
          windowManager.sendToMainClientWindows(args);
        }
      } else {
        console.log("Event: " + JSON.stringify(args));
      }
    });

    app.on('before-quit', () => {
      usbManager.stopUsbListener();
      windowManager.closeWindow()
    });

    app.on('window-all-closed', () => {
      app.quit();
    });

    await app.whenReady();
    await session.defaultSession.clearCache();
    process.env.ELECTRON_BUILDER_HTTP_TIMEOUT = "180000";
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error("Error al buscar updates:", err);
    });
    windowManager.openWindows();
    windowManager.closeConfigWindow();

    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error("Error al buscar updates:", err);
      });
    }, 1000 * 60 * 60);

    /*app.on('ready', () => {

    });*/

    ipcMain.on('close-app', () => {
      windowManager.closeWindow()
      app.quit();
    });

    ipcMain.on('set-config-url', (url) => {
      console.log("Url:" + url);
      this.config.setConfigUrl(url);
      windowManager.closeWindow();
      main().catch((error) => {
        console.error("Error in initialization:", error);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, closing app...');
      windowManager.closeWindow()
      app.quit();
    });

    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
    })
    autoUpdater.on('update-available', (info) => {
      console.log('Update available.');
    })
    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available.');
    })
    autoUpdater.on('error', (err) => {
      console.log('Error in auto-updater. ' + err);
    })
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      console.log(log_message);
    })
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded');
    });
  }
}

main().catch((error) => {
  console.error("Error in initialization:", error);
});


