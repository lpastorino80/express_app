export class PrinterModel {
  id: string;
  type: string;
  vendorId: number;
  productId: number;
  drawerCommand: any;
  ignoreStatus?: boolean;
  name?: string;
  interfaceIndex?: number;
  bufferSize?: number;
  pageSize: number;
}
