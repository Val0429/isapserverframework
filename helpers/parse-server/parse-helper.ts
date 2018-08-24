import * as Parse from 'parse/node';
import { FileHelper } from './file-helper';
import { EnumConverter } from './../utility/get-enum-key';
import { RoleList } from 'core/userRoles.gen';

/// decorators //////////////
var primaryClassMap = {};
export function registerSubclass(collectionName?: string) {
    return (targetClass) => {
        var name = collectionName || targetClass.name;
        Parse.Object.registerSubclass(name, targetClass);
        primaryClassMap[name] = targetClass;
    }
}
export function retrievePrimaryClass<T>(target: T): new () => (T extends string ? any : T) {
    var name: string = typeof target === 'string' ? target : target.constructor.name;
    return primaryClassMap[name];
}

var primaryKeyMap = {};
export const registerPrimaryKey = (primaryKey: string) => {
    return <T>(target: new () => T) => {
        var name = (new target).constructor.name;
        if (primaryKeyMap[name]) console.error(`<registerPrimaryKey> conflicts with key "${name}".`);
        primaryKeyMap[name] = primaryKey;
    }
}
export const retrievePrimaryKey = (target: (new () => typeof target) | object): string => {
    var name = typeof target == 'object' ? target.constructor.name : (new target).constructor.name;
    return primaryKeyMap[name];
}
/////////////////////////////



export type SaveStatus = "update" | "insert" | "fetch";
export class ParseObject<T> extends Parse.Object {
    attributes: T;
    constructor(data?: Partial<T>) {
        super();
        Parse.Object.call(this, this.constructor.name);
        data && super.set(data);
    }
    getValue<U extends keyof T>(key: U): T[U] {
        return super.get(key);
    }
    setValue<U extends keyof T>(key: U, value: T[U], options?: Parse.Object.SetOptions): boolean {
        return super.set(key, <any>value, options);
    }
    /**
     * important: decorator <registerPrimaryKey> required.
     * If not exists, insert. else fetch.
     */
    async fetchOrInsert<U extends ParseObject<T>>(this: U): Promise<{object: U, status: SaveStatus}> {
        var rtn = await this.updateOrInsert(true);
        return {
            ...rtn,
            status: rtn.status === "update" ? "fetch" : rtn.status
        };
    }
    /**
     * important: decorator <registerPrimaryKey> required.
     * If not exists, insert. else update.
     */
    async updateOrInsert<U extends ParseObject<T>>(this: U, dontUpdate: boolean = false): Promise<{object: U, status: SaveStatus}> {
        var key = retrievePrimaryKey(this);
        var thisclass = retrievePrimaryClass(this);

        do {
            /// Check Object existance
            var obj = await new Parse.Query(thisclass)
                .equalTo(key, this.get(key))
                .first();
            
            /// update
            if (obj) {
                do {
                    if (dontUpdate) break;
                    /// do update
                    for (var key2 in this.attributes)
                        obj.set(key2, this.get(key2));
                    await obj.save();
                } while(0);

                return Promise.resolve({object: <any>obj, status: "update" as SaveStatus});
            }

            /// insert
            await this.save();

        } while(0);
        return Promise.resolve({object: this, status: "insert" as SaveStatus});
    }

    toJSON(): any {
        return ParseObject.toOutputJSON.call(this, ...arguments);
    }

    static toOutputJSON(data: object, filter: any = null): any {
        /**
         * Allow input types:
         * 1) boolean
         * 2) string
         * 3) number
         * 4) Date --- string | number. todo: now only convert to string
         * 5) Enum --- string | number
         * 6) ParseObject --- Object. todo: add createtime & modifytime
         * 7) Object --- Object
         * 8) Array --- Array
         * 10) Parse.File --- uri
         * 16) Parse.User
         */

        var filterRules = {
            "Parse.User": {
                ACL: false,
                sessionToken: false,
            },
            "Parse.Role": {
                ACL: false,
                name: EnumConverter(RoleList)
            }
        }

        var NeutualizeType = (data: any, filter: any, refDetect = {}): any => {
            var type = typeof data;

            if (type === 'boolean') return data;
            else if (type === 'string') return data;
            else if (type === 'number') return data;
            else if (type === 'undefined') return data;
            else if (data instanceof Date) return data.toISOString();
            else if (data instanceof Parse.File) return data.url();
            else if (data instanceof Parse.Relation) return undefined;
            else if (data instanceof Parse.Object) {
                if (data.id && refDetect[data.id]) return undefined;
                /// ignore deleted, or non-fetched parse object
                if (data.createdAt === undefined) return undefined;
                if (data instanceof Parse.User) filter = filter || filterRules["Parse.User"];
                if (data.className === '_Role') filter = filter || filterRules["Parse.Role"];
                var newref = { ...refDetect };
                newref[data.id] = true;
                return ({
                    ...NeutualizeType({objectId: data.id, ...data.attributes}, filter, newref)
                });
            }
            else if (type === 'object') {
                var isArray = Array.isArray(data);
                var result = isArray ? [] : {};

                for (var key in data) {
                    var cfilter = Array.isArray(data) ? filter : (filter ? filter[key] : undefined);
                    if (cfilter === false) result[key] = undefined;
                    else if (typeof cfilter === 'function') result[key] = cfilter(data[key]);
                    else {
                        let rtn = NeutualizeType(data[key], cfilter, refDetect);
                        !isArray && (result[key] = rtn);
                        isArray && (rtn !== undefined) && (<any>result).push(rtn);
                    }
                    /// todo: function transfer
                } return result;
            } else {
                throw `Inner Error: ${type} is not accepted output type.`;
            }
        };

        return NeutualizeType(data, filter);
    }

}

/**
 * Apply to Parse.Object that not extendable, ex: User, Role.
 */
export interface ParseTypedGetterSetter<T> {
    get<U extends keyof T>(key: U): T[U];
    set<U extends keyof T>(key: U, value: T[U], options?: Parse.Object.SetOptions): boolean;
}

export type StringLiteralDiff<T, U extends string> = ({[P in keyof T]: P } & {[P in U]: never } & { [x: string]: never })[keyof T];
export type Omit<T, K extends keyof T> = Pick<T, StringLiteralDiff<T, K>>;

export interface ParseObjectJSONRule {
    [index: string]: ParseObjectJSONRule | null | ((any) => any);
}

/**
 * Create index helper.
 */
import { Config } from 'core/config.gen';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';

export async function createMongoDB(): Promise<{ client: MongoClient, db: Db }> {
    let { ip, port, collection } = Config.mongodb;
    const url = `mongodb://${ip}:${port}`;
    let client = await MongoClient.connect(url);
    let db = client.db(collection);
    return { client, db };
}

let sharedClient: MongoClient = null;
let sharedDb: Db = null;
export async function sharedMongoDB(): Promise<Db> {
    if (sharedDb !== null) return sharedDb;
    let { client, db } = await createMongoDB();
    sharedClient = client;
    sharedDb = db;
    return sharedDb;
}

export async function createIndex(collectionName: string, indexName: string, fieldOrSpec: any, options: IndexOptions = {}) {
    let db = await sharedMongoDB();

    var instance = db.collection(collectionName);
    try {
        if (!await instance.indexExists(indexName)) throw null;
    } catch(reason) {
        var showname = collectionName.replace(/^\_/, '');
        console.log(`Make index on <${showname}.${indexName}>.`);
        instance.createIndex(fieldOrSpec, {background: true, name: indexName, ...options});
    }
}
