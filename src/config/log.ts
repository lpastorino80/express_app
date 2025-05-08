import fs from 'fs';
import path from 'path';
import {app} from 'electron';

class Log {
    constructor() {
        this.init()
    }

    public init(): void {
        const logDir = app.getPath('userData');
        const logFile = path.join(logDir, 'express.log');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const logStream = fs.createWriteStream(logFile, { flags: 'a' });
        console.log = (...args: any[]) => {
            logStream.write(`[INFO] ${new Date().toISOString()} - ${args.join(' ')}\n`);
        };
        console.error = (...args: any[]) => {
            logStream.write(`[ERROR] ${new Date().toISOString()} - ${args.join(' ')}\n`);
        };
    }

}

export { Log };
