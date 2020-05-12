import { BehaviorSubject, Observable } from 'rxjs';
import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper-core';
import * as path from "path";
import { serverReady } from 'core/pending-tasks';
import { Mutex } from 'helpers/utility';
const caller = require('caller');

export class DBConfigFactory<T> {
    private sjReady: BehaviorSubject<boolean>;
    public obReady: Observable<boolean>;

    public async save() {}
    public isDBConfigFactory(): boolean { return true; }

    constructor(config: T, critical: boolean, callername: string) {

        let sjReady = new BehaviorSubject<boolean>(false);
        let innateValue: T = {} as any;
        /// 1) get caller name
        let classname = `config_${callername}`;

        Object.defineProperty(this, "sjReady", { enumerable: false,
            get: () => sjReady
        });

        Object.defineProperty(this, "obReady", { enumerable: false,
            get: () => sjReady.asObservable()
        });

        let dbObject = null;
        const mutex: Mutex = new Mutex();
        const save = async (value?) => {
            await mutex.acquire();
            if (!dbObject) dbObject = new Parse.Object(classname);
            if (value) innateValue = { ...innateValue as any, ...value };
            await dbObject.save(innateValue);
            mutex.release();
            if (critical) setTimeout(() => process.exit(1), 200);
        }
        Object.defineProperty(this, "save", { enumerable: false,
            value: save
        });

        Object.defineProperty(this, "isDBConfigFactory", { enumerable: false , get: () => true });

        const get = (key) => {
            return innateValue[key];
        }
        const set = (key, value) => innateValue[key] = value;

        /// define Proxy
        let definedTable: any = {};
        (this as any).__proto__ = new Proxy({}, {
            set: (target, key, value) => {
                if (!definedTable[key] && value !== undefined) {
                    Object.defineProperty(this, key, { enumerable: true,
                        get: () => get(key),
                        set: (value) => set(key, value)
                    });
                    definedTable[key] = true;
                }
                set(key, value);
                return true;
            },
            get: (target, key) => get(key)
        });

        (async () => {
            await serverReady;

            /// 2) find default value
            let value = dbObject = await new Parse.Query(classname).first();
            let todoset = value ? { ...value.attributes, createdAt: undefined, updatedAt: undefined } : config;
            Object.keys(todoset).forEach(key => this[key] = todoset[key]);
            if (!value) {
                /// 3) Write default if not exists
                await save();
            }

            sjReady.next(true);
        })();
    }
}

export function DBConfig<T>(config: T, critical: boolean = false) {
    let callername = path.basename(caller(), ".ts").replace(/\-/g, "_");
    return new DBConfigFactory(config, critical, callername) as any as (T & InstanceType<typeof DBConfigFactory>);
}
