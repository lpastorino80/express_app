import {SerialPort} from "serialport";

const serialLists = () => {
  SerialPort.list().then(value => {
    console.log("Serial Lists: " + JSON.stringify(value));
  });
};

export { serialLists };