import usbDetect from 'usb-detection';
import {PrinterManager} from "./printer-manager";

class UsbManager {
  private printerManager: PrinterManager;
  constructor(printerManager: PrinterManager) {
    this.printerManager = printerManager;
  }
  public checkPrinterStatus(): void {
    console.log("Starting check printer status");
    usbDetect.find().then(devices => {
      devices.forEach(deviceDetect => {
        this.printerManager.registerPrinter(deviceDetect.vendorId, deviceDetect.productId, deviceDetect.deviceName);
      })
    })
  }

  public startUsbListener(): void {
    console.log("Starting usb monitoring");
    usbDetect.startMonitoring();
    usbDetect.on('add', (deviceDetect) => {
      console.log('Dispositivo USB conectado: ' + JSON.stringify(deviceDetect));
      this.printerManager.registerPrinter(deviceDetect.vendorId, deviceDetect.productId, deviceDetect.deviceName);
    });

    usbDetect.on('remove', (deviceDetect) => {
      console.log('Dispositivo USB desconectado: ' + JSON.stringify(deviceDetect));
      this.printerManager.unRegisterPrinter(deviceDetect.vendorId, deviceDetect.productId);
    });
  }

  public stopUsbListener(): void {
    console.log("Stopping usb monitoring");
    usbDetect.stopMonitoring();
  }
}

export { UsbManager };
