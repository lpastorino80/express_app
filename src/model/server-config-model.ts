import {PrinterModel} from "./printer-model";

export class ServerConfigModel {
  socketUrl: string;
  uri: string;
  printers: PrinterModel[];
}
