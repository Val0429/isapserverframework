import * as Parse from 'parse/node';

/// decorators //////////////
var primaryClassMap = {};
export function registerSubclass(collectionName?: string) {
    return (targetClass) => {
        var name = collectionName || targetClass.name;
        Parse.Object.registerSubclass(name, targetClass);
        primaryClassMap[name] = targetClass;
    }
}
export function retrievePrimaryClass<T>(target: T): new () => T extends 'string' ? any : T {
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
                    for (var key in this.attributes)
                        obj.set(key, this.get(key));
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

    static toOutputJSON(this: Parse.Object | Parse.Object[], rules?: ParseObjectJSONRule, seen = null) {
        if (Array.isArray(this)) {
            return this.map( (value) => ParseObject.toOutputJSON.call(value, rules, seen) );
        }

        var seenEntry = this.id ? `${this.className}:${this.id}` : this;
        var seen = seen || [seenEntry];
        var rules = rules || {};
        var json = {};
        var attrs = this.attributes;
        for (var attr in attrs) {
            if (attr === 'ACL') {
                /// do nothing
            }
            else if ((attr === 'createdAt' || attr === 'updatedAt') && attrs[attr].toJSON) {
                json[attr] = attrs[attr].toJSON();
            } else {
                var inst = attrs[attr];
                var rule = rules[attr];
                if (rule !== undefined) {
                    if (typeof rule === 'function') json[attr] = rule(inst);
                    else if (rule === null) { /* do nothing */ }
                    else json[attr] = ParseObject.toOutputJSON.call(inst, rule, seen);
                }
                else if (inst instanceof Parse.Object) json[attr] = ParseObject.toOutputJSON.call(inst, rules, seen);
                else json[attr] = (<any>0, (<any>Parse)._encode)(inst, false, false, seen);
            }
        }

        if (this instanceof Parse.Object) {
            var pending = (<any>this)._getPendingOps();
            for (var attr in pending[0]) {
                json[attr] = pending[0][attr].toJSON();
            }
        }

        if (this.id) {
            json["objectId"] = this.id;
        }
        return json;
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
import { Config } from './../../core/config.gen';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';

export async function createIndex(collectionName: string, indexName: string, fieldOrSpec: any, options: IndexOptions) {
    let { ip, port, collection } = Config.mongodb;
    const url = `mongodb://${ip}:${port}`;

    let client = await MongoClient.connect(url);
    let db = client.db(collection);

    var instance = db.collection(collectionName);
    try {
        if (!await instance.indexExists(indexName)) throw null;
    } catch(reason) {
        var showname = collectionName.replace(/^\_/, '');
        console.log(`Make index on <${showname}.${indexName}>.`);
        instance.createIndex(fieldOrSpec, {background: true, name: indexName, ...options});
    }
}
