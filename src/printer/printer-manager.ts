import {PrinterModel} from "../model/printer-model";
import {ServerConfigModel} from "../model/server-config-model";
import usb, {Device} from "usb";
import console from "node:console";
import {ConfigModel} from "../model/config-model";
import {Utils} from "../config/utils";
import WindowManager from "../windowManager";

class PrinterManager {

    private readonly serverConfig: ServerConfigModel;
    private readonly configModel: ConfigModel;
    private readonly windowManager: WindowManager;
    private readonly utils: Utils;
    private connectedDevices = {};
    private interval;
    private timeCheck = 30000;
    private deviceMapper = {"10032:8200": {"G3Q0DQ==": "G3QJDQ=="}, "1208:514": {"G3Q0DQ==": "G3QQDQ=="}};

    constructor(serverConfig: ServerConfigModel, windowManager: WindowManager, configModel: ConfigModel, utils: Utils) {
        this.windowManager = windowManager;
        this.serverConfig = serverConfig;
        this.configModel = configModel;
        this.utils = utils;

    }

    public startCheckPrinter() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.interval = setInterval(async () => {
            await this.getStatusDrawer();
        }, this.timeCheck, this)
    }

    public stopCheckPrinter() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    public getPrinterById(deviceId: string): PrinterModel {
        return this.serverConfig.printers.find(value => value.id === deviceId);
    }

    public getPrinterByVendorAndProduct(vendorId: number, productId: number): PrinterModel {
        if (vendorId != null && productId != null && this.serverConfig != null && this.serverConfig.printers != null) {
            return this.serverConfig.printers.find(value => value.vendorId === vendorId && value.productId === productId);
        }
    }

    public async printCommandsLines(deviceId: string, commands: string[]) {
        this.stopCheckPrinter();
        const deviceModel: PrinterModel = this.getPrinterById(deviceId);
        const map = this.deviceMapper[deviceId];

        const lines: string[] = [];
        for (const i in commands) {
            if (map != null) {
                for (const str in map) {
                    commands[i] = commands[i].replace(new RegExp(str, 'g'), map[str]);
                }
            }
            const originalArray = this.utils.hex2bin(commands[i]);
            const arrays: string[] = this.utils.splitArray(originalArray, this.getBufferSize(deviceId));
            for (const j in arrays) {
                lines.push(arrays[j]);
            }
        }
        lines.reverse();
        await this.printLines(deviceModel, lines);
        this.startCheckPrinter();
    }

    async openDrawer() {
        for (const key in this.connectedDevices) {
            if (Object.prototype.hasOwnProperty.call(this.connectedDevices, key)) {
                await this.getStatusDrawerInfo(this.connectedDevices[key], true);
            }
        }
    }

    public async printLines(deviceModel: PrinterModel, commands: string[]) {
        try {
            for (const line of commands.reverse()) {
                await this.sendBulkDataToPrinter(deviceModel, line);
            }
        } catch (error) {
            console.error("Error during printing:", error);
        }
    }

    public sendBulkDataToPrinter(deviceModel: PrinterModel, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const commandBuffer = Buffer.from(data);
            if (deviceModel) {
                const device: Device = this.findDeviceByVendorAndProduct(deviceModel.vendorId, deviceModel.productId);
                if (device) {
                    device.open();
                    const interfaceDevice = device.interfaces[0];
                    interfaceDevice.claim();
                    const outEndpoint = interfaceDevice.endpoints.find(endpoint => endpoint.direction === 'out') as usb.OutEndpoint;
                    if (!outEndpoint) {
                        device.close();
                        return reject('Device disconnected');
                    }
                    outEndpoint.transfer(commandBuffer, (error) => {
                        device.close();
                        if (error) {
                            console.error('Error send data to printer:', error);
                            return reject(error);
                        } else {
                            return resolve();
                        }
                    });
                } else {
                    return reject('Device not found');
                }
            } else {
                return reject('Device not found');
            }
        });
    }
    public async getStatusDrawer() {
        for (const key in this.connectedDevices) {
            if (Object.prototype.hasOwnProperty.call(this.connectedDevices, key)) {
                await this.getStatusDrawerInfo(this.connectedDevices[key], false)
            }
        }
    }

    public getStatusDrawerInfo(deviceModel: PrinterModel, openCode: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!deviceModel) {
                return reject('No deviceModel provided');
            }
            const device = this.findDeviceByVendorAndProduct(deviceModel.vendorId, deviceModel.productId);
            if (!device) {
                return reject('Device not found');
            }
            try {
                device.open();
                const interfaceDevice = device.interfaces[0];
                interfaceDevice.claim();

                const outEndpoint = interfaceDevice.endpoints.find(endpoint => endpoint.direction === 'out')  as usb.OutEndpoint;
                const inEndpoint = interfaceDevice.endpoints.find(endpoint => endpoint.direction === 'in') as usb.InEndpoint;

                if (!outEndpoint || !inEndpoint) {
                    device.close();
                    return reject('Endpoints not found');
                }
                let statusCommandBuffer = this.utils.hex2bin(deviceModel.drawerCommand.status).buffer;
                if (openCode) {
                    statusCommandBuffer = this.utils.hex2bin(deviceModel.drawerCommand.open).buffer;
                }
                outEndpoint.transfer(statusCommandBuffer, (error) => {
                    if (error) {
                        device.close();
                        return reject('Error sending status command');
                    }
                    if (!openCode) {
                        inEndpoint.transfer(1, (error, data) => {
                            device.close();

                            if (error) {
                                return reject('Error receiving status response');
                            }
                            if (!data || data.length === 0) {
                                return reject('No data received from the printer');
                            }
                            const drawerStatusByte = data[0];
                            const isDrawerClosed = (drawerStatusByte & 0x01) === 0x01;
                            if (isDrawerClosed) {
                                this.timeCheck = 30000;
                                this.startCheckPrinter();
                                this.windowManager.sendToMainWindows({
                                    event: "geopos3-cashDrawer-closed"
                                })
                            } else {
                                this.timeCheck = 1000;
                                this.startCheckPrinter();
                                this.windowManager.sendToMainWindows({
                                    event: "geopos3-cashDrawer-opened"
                                })
                            }

                            resolve(isDrawerClosed);
                        });
                    }
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

    public getBufferSize(deviceId: string): number {
        if (this.connectedDevices[deviceId] != null && this.connectedDevices[deviceId].bufferSize) {
            return this.connectedDevices[deviceId].bufferSize;
        }
        return 200;
    }

    public findDeviceByVendorAndProduct(vendorId: number, productId: number): Device {
        const devices = usb.getDeviceList();
        return devices.find(device =>
            device.deviceDescriptor.idVendor === vendorId && device.deviceDescriptor.idProduct === productId)
    }

    public registerPrinter(vendorId: number, productId: number, description: string): void {
        console.log("Searching printer " + vendorId + ":" + productId + "(" + description + ") for register printer");
        const printerModel: PrinterModel = this.getPrinterByVendorAndProduct(vendorId, productId);
        if (printerModel && printerModel.type === "PRINTER") {
            console.log("Found express printer with information " + JSON.stringify(printerModel));
            console.log("Found express printer with information and description " + description);
            this.registerExpressPrinter(description, printerModel);
        } else if (printerModel && printerModel.type === "PRICER_PRINTER") {
            console.log("Found pricer printer with information " + JSON.stringify(printerModel));
            this.registerPricerPrinter(description, printerModel);
        }
    }

    public unRegisterPrinter(vendorId: number, productId: number): void {
        console.log("Searching printer " + vendorId + ":" + productId + " for unregister printer");
        const printerModel: PrinterModel = this.getPrinterByVendorAndProduct(vendorId, productId);
        if (printerModel && printerModel.type === "PRINTER") {
            console.log("Found express for unregister printer with information " + JSON.stringify(printerModel));
            this.unRegisterExpressPrinter(printerModel);
        } else if (printerModel && printerModel.type === "PRICER_PRINTER") {
            console.log("Found pricer for unregister printer with information " + JSON.stringify(printerModel));
            this.unRegisterPricerPrinter(printerModel);
        }
    }

    public async registerExpressPrinter(description: string, printerModel: PrinterModel): Promise<void> {
        const data = this.configModel.clientDeviceId + ";;" + description + ";;" + printerModel.id + ";;true;;" + printerModel.pageSize;
        try {
            const result = await fetch(this.configModel.url + "/cxf/offline/printingJobService/registerPrinter", {
                method: "POST",
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8'
                },
                body: data
            });
            console.log('Register printer success:', JSON.stringify(result));
            this.connectedDevices[printerModel.id] = printerModel;
        } catch (error) {
            console.error('Register printer error:', JSON.stringify(error));
            delete this.connectedDevices[printerModel.id];
        }
    }

    public registerPricerPrinter(description: string, printerModel: PrinterModel): void {
        const data = this.configModel.clientDeviceId + ";;" + description + ";;" + printerModel.id + ";;true;;" + printerModel.pageSize;
        fetch(this.configModel.url + "/cxf/offline/printingJobService/registerPricerPrinter", {
            method: "POST",
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            },
            body: data
        }).then(result => {
            console.log('Register printer success:', result);
            this.connectedDevices[printerModel.id] = printerModel
        }).catch(error => {
            console.error('Register printer error:', error);
            delete this.connectedDevices[printerModel.id];
        });
    }

    public unRegisterPricerPrinter(printerModel: PrinterModel): void {
        const data = this.configModel.clientDeviceId + ";;" + printerModel.name + ";;" + printerModel.id + ";;true;;" + printerModel.pageSize;
        fetch(this.configModel.url + "/cxf/offline/printingJobService/unregisterPricerPrinter", {
            method: "POST",
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            },
            body: data
        }).then(result => {
            console.log('Unregister pricer printer success:', result);
            delete this.connectedDevices[printerModel.id];
        }).catch(error => {
            console.error('Unregister pricer printer error:', error);
            delete this.connectedDevices[printerModel.id];
        });
    }

    public unRegisterExpressPrinter(printerModel: PrinterModel): void {
        const data = this.configModel.clientDeviceId + ";;" + printerModel.name + ";;" + printerModel.id + ";;true;;" + printerModel.pageSize;
        fetch(this.configModel.url + "/cxf/offline/printingJobService/unregisterPrinter", {
            method: "POST",
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            },
            body: data
        }).then(result => {
            console.log('Unregister printer success:', result);
            delete this.connectedDevices[printerModel.id];
        }).catch(error => {
            console.error('Unregister printer error:', error);
            delete this.connectedDevices[printerModel.id];
        });
    }
}

export {PrinterManager};
