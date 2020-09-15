import * as fs from "fs";
import * as path from 'path';
import { Config, IConfig } from "core/config.gen";
import { DBConfigFactory } from "helpers/config/db-config";
import { BehaviorSubject, Observable } from 'rxjs';
import { Log } from "helpers/utility/log";

/// utilize config
const checkTable = {
    mongodb: "db"
}
const makeFileName = (key) => {
    key = checkTable[key] || key;
    return `.setting_${key}.json`;
}

export class ConfigManager {
    private static _instance;
    private sjReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private cbValidate: { [P in keyof IConfig]?: any } = {};
    public static getInstance(): ConfigManager {
        return this._instance || (this._instance = new ConfigManager);
    }

    public setValidate<T extends keyof IConfig>(key: T, callback: (value: IConfig[T]) => Promise<void>) {
        this.cbValidate[key] = callback;
    }

    public ready(key?: keyof IConfig): Promise<boolean> {
        if (!key) return this.sjReady.filter(v=>v).first().toPromise();
        if ((Config[key] as any).isDBConfigFactory) {
            return (Config[key] as any).obReady.filter(v=>v).first().toPromise();

        } else {
            Promise.resolve(true);
        }
    }

    public observe<T extends keyof IConfig>(key?: T): Observable<IConfig[T]> {
        if ((Config[key] as any).isDBConfigFactory) {
            return (Config[key] as any).obChange;
        }
        throw `${key} is not DBConfig to observe`;
    }

    private envpath: string;
    private constructor() {
        /// 1) check /env exists
        this.envpath = path.resolve(__dirname, "../../");
        let exists = fs.existsSync(this.envpath);
        if (!exists) fs.mkdirSync(this.envpath, "0766");

        /// 2) write to /env if not exists
        let keys = Object.keys(Config);
        let promises = [];
        for (let key of keys) {
            /// if not save in DB
            if (!((Config[key] as any).isDBConfigFactory)) {
                if (!this.writeConfig(key as any, false)) {
                    /// if already exists, read from file config
                    Config[key] = { ...Config[key], ...this.readConfig(key as any) };
                }
            } else {
                /// if save in DB, let DBConfigFactory do the rest
                promises.push( this.ready(key as any) );
            }
        }
        Promise.all(promises).then(() => {
            this.sjReady.next(true);
        });
    }

    public async update<T extends keyof IConfig, U extends IConfig[T]>(key: T, value: U) {
        if ((Config[key] as any).isDBConfigFactory) {
            let callback = this.cbValidate[key];
            callback && await callback(value);
            return (Config[key] as any).save(value);
        } else {
            let rtn = this.updateConfig(key, value);
            setTimeout(() => {
                Log.Info("ConfigChanged", "Server restarting...");
                process.exit(1);
            }, 200);
            return rtn;
        }
    }

    /// general way to write / update config //////////////
    private updateConfig<T extends keyof IConfig>(key: keyof IConfig, data: any) {
        /// update memory
        Config[key] = { ...Config[key], ...data };
        this.writeConfig(key);
    }
    private writeConfig(key: keyof IConfig, force: boolean = true): boolean {
        let filename = makeFileName(key);
        let fullpath = path.resolve(this.envpath, filename);
        let exists = fs.existsSync(fullpath);
        if (exists && !force) return false;
        let value = Config[key];
        fs.writeFileSync(fullpath, JSON.stringify(value), "UTF-8");
        return true;
    }
    private readConfig(key: keyof IConfig) {
        let filename = makeFileName(key);
        let fullpath = path.resolve(this.envpath, filename);
        return JSON.parse(fs.readFileSync(fullpath, "UTF-8"));
    }
    ///////////////////////////////////////////////////////
}

export default ConfigManager.getInstance();
