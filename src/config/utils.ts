import {getValue, setValue} from "./store";

class Utils {

  public splitArray = function (arr: Uint8Array, size: number) {
    const arrays = [];
    let index = 0;
    const total = arr.length;
    while (index < total) {
      const sliced = arr.slice(index, index + size);
      arrays.push(sliced);
      index += size;
    }
    return arrays;
  };

  public hex2bin(hex: string): Uint8Array {
    return  new Uint8Array(atob(hex).split("").map(function (c) {
      return c.charCodeAt(0);
    }));
  }

  public hexToUint8Array = function(hex) {
    const result = [];
    for (let i = 0; i < hex.length; i += 2) {
      result.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(result);
  };

  public generateUUID(): string {
    let d = new Date().getTime();
    return  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  public getUUID(): string {
    let clientDeviceId: string = <string>getValue("clientDeviceId")
    if (!clientDeviceId) {
      clientDeviceId = this.generateUUID();
      setValue("clientDeviceId", clientDeviceId);
    }
    return <string>clientDeviceId;
  }
}

export { Utils };
