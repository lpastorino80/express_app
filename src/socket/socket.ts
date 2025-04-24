import Stomp from 'stompjs';
import {PrinterManager} from "../printer/printer-manager";
import {Config} from "../config/config";

class Socket {
    private configModel: Config;
    private stompClient: Stomp.Client;
    private printerManager: PrinterManager;

    public constructor(configModel: Config, printerManager: PrinterManager) {
        this.configModel = configModel;
        this.printerManager = printerManager;
        this.connectSocket()
    }

    public connectSocket(): void {
        console.log("Connecting socket with url: " + this.configModel.serverConfig.socketUrl)
        this.stompClient = Stomp.overWS(this.configModel.serverConfig.socketUrl);
        const decodedString = Buffer.from(this.configModel.serverConfig.uri, 'base64').toString('utf-8');
        console.log("Connecting socket with credentials: " + decodedString);
        const credentials = decodedString.split(':');
        this.stompClient.connect(credentials[0], credentials[1],
            this.connectSocketSuccess.bind(this),
            this.connectSocketError.bind(this));
    }
    public connectSocketSuccess(frame): void {
        console.log("Websocket Connected!");
        this.stompClient.subscribe('/topic/printing.job.' + this.configModel.config.clientDeviceId, this.onGetData.bind(this));
    }

    public onGetData(data): void {
        var body = JSON.parse(data.body);
        if (body.deviceName != null) {
            //OTHER JOBS
        } else {
            this.printerManager.printCommandsLines(body.printer.deviceId, body.commands)
        }
    }
    public connectSocketError(error): void {
        console.log(error);
    }
}

export default Socket;
