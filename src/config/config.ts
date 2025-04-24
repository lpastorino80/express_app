import path from "path";
import fs from "fs";
import {app} from "electron";
import {ConfigModel} from "../model/config-model";
import {ServerConfigModel} from "../model/server-config-model";
import {Utils} from "./utils";
import * as http from "node:http";
import * as https from "node:https";

class Config {
    private readonly _config: ConfigModel;
    private _serverConfig: ServerConfigModel;

    constructor(utils: Utils) {
        this._config = this.getAppConfigFromFile(utils);
    }

    get config(): ConfigModel {
        return this._config;
    }

    get serverConfig(): ServerConfigModel {
        return this._serverConfig;
    }

    private defaultConfig(utils: Utils): ConfigModel {
        let configJson: ConfigModel = {
            url: "https://qaexpress.geocom.com.uy",
            invertDisplay: false,
            clientDeviceId: utils.getUUID()
        };
        const procDir = app.getPath('userData');
        const filePath = path.resolve(procDir, 'config.json');
        fs.writeFileSync(filePath, JSON.stringify(configJson));
        return configJson;
    }

    private getAppConfigFromFile(utils: Utils): ConfigModel {
        try {
            const procDir = app.getPath('userData');
            const filePath = path.resolve(procDir, 'config.json');
            const data = fs.readFileSync(filePath, 'utf8');
            const configJson = data.trim();
            return JSON.parse(configJson);
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                console.error("Config file does not exist, using default config.");
            } else {
                console.error("Error reading config file, using default config:", readError);
            }
            return this.defaultConfig(utils);
        }
    }

    public async getServerConfig(): Promise<void> {
        try {
            const response = await this.httpGetPromise(this.config.url + "/auth/config/web-application");
            this._serverConfig = JSON.parse(response);
        } catch (error) {
            console.error('Error fetching server config:', error);
            throw error;
        }
    }

    private httpGetPromise(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const lib = url.startsWith('https') ? https : http;
            lib.get(url, (response) => {
                let data = '';

                // Acumula los datos recibidos
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // Una vez que se completa la respuesta
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`Request failed with status code ${response.statusCode}`));
                    }
                });

                // Maneja errores
                response.on('error', (err) => {
                    reject(err);
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }
}

export {Config};
