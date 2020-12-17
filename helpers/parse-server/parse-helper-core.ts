/*
 * Created on Tue May 11 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import { EnumConverter } from './../utility/get-enum-key';
import { RoleList } from 'core/userRoles.gen';
import { Meta } from 'helpers/utility/meta';
import { Log } from 'helpers/utility/log';
import { ObjectId, Binary } from 'mongodb';

/// decorators //////////////
var primaryClassMap = {};
interface IRegisterSubclassMeta {
    memoryCache?: boolean;
    /**
     * required for Tree<T> structure.
     * True means this Tree Structure is a container: Permission of parent grant permission of child.
     * e.g. Your boss has permission of door doesn't mean you have too. So this User Tree is not a container.
     */
    container?: boolean;
}
export function registerSubclass(collectionNameOrMeta?: string | IRegisterSubclassMeta);
export function registerSubclass(collectionName?: string, meta?: IRegisterSubclassMeta);
export function registerSubclass(collectionNameOrMeta?: string | IRegisterSubclassMeta, meta?: IRegisterSubclassMeta) {
    let collectionName;
    if (typeof collectionNameOrMeta === 'string') {
        collectionName = collectionNameOrMeta;
    } else if (collectionNameOrMeta) {
        meta = collectionNameOrMeta;
    }

    return (targetClass) => {
        var name = collectionName || targetClass.name;
        Parse.Object.registerSubclass(name, targetClass);
        primaryClassMap[name] = targetClass;
        // targetClass.className = name;
        /// save meta
        if (meta) {
            let metaObject = Meta.get(targetClass);
            Object.keys(meta).forEach( (key) =>  metaObject[key] = meta[key] );
        }
        return targetClass;
    }
}
export function registerCoreClassMeta(collectionName: string, targetClass: any, meta: IRegisterSubclassMeta) {
    primaryClassMap[collectionName] = targetClass;
    /// save meta
    let metaObject = Meta.get(targetClass);
    Object.keys(meta).forEach( (key) => metaObject[key] = meta[key] );
}
export function retrievePrimaryClass<T>(target: T): new () => (T extends string ? any : T) {
    var name: string = typeof target === 'string' ? target : target.constructor.name;
    return primaryClassMap[name];
}
export function retrievePrimaryClassMeta<T extends ParseObject<any> | string>(target: T): IRegisterSubclassMeta {
    let classType = typeof target === 'string' ? retrievePrimaryClass(target) : target;
    return Meta.get(classType as any);
}

var primaryKeyMap = {};
export const registerPrimaryKey = (primaryKey: string) => {
    return <T>(target: new () => T) => {
        var name = target.name;
        if (primaryKeyMap[name]) Log.Error("registerPrimaryKey", `conflicts with key "${name}`);
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
        this.className = this.constructor.name;
        data && super.set(data);
    }
    getValue<U extends keyof T>(key: U): T[U] {
        return super.get(key as string);
    }
    setValue<U extends keyof T>(key: U, value: T[U], options?: Parse.Object.SetOptions): false | this {
        return super.set(key as string, <any>value, options);
    }

    async fetchOrNull<U extends ParseObject<T>>(this: U): Promise<U | null> {
        try {
            return await this.fetch();
        } catch(e) {
            return null;
        }
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
         * 4) Date --- string | number
         * 5) Enum --- string | number
         * 6) ParseObject --- Object
         * 7) Object --- Object
         * 8) Array --- Array
         * 10) Parse.File --- uri
         * 16) Parse.User
         * 17) Buffer
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

        var NeutualizeType = (data: any, filter: any, refDetect = {}, hintKey?): any => {
            var type = typeof data;
            if (type === 'boolean') return data;
            else if (type === 'string') return data;
            else if (type === 'number') return data;
            else if (type === 'undefined') return data;
            else if (data === null) return data;
            else if (data instanceof Date) return data.toISOString();
            else if (data instanceof Parse.File) return data.url();
            else if (data instanceof Parse.Relation) return undefined;
            else if (data instanceof ObjectId) return data.toString();
            else if (data instanceof Binary) return data.buffer.toString("base64");
            else if (data instanceof Parse.Object) {
                if (data.id && refDetect[data.id]) return undefined;
                if (data instanceof Parse.User) filter = filter || filterRules["Parse.User"];
                if (data.className === '_Role') filter = filter || filterRules["Parse.Role"];
                var newref = { ...refDetect };
                newref[data.id] = true;
                return ({
                    ...NeutualizeType({objectId: data.id, ...data.attributes}, filter, newref)
                });
            }
            /// 17)
            else if (data instanceof Buffer) return data.toString("base64");
            else if (type === 'object') {
                var isArray = Array.isArray(data);
                var result = isArray ? [] : {};

                for (var key in data) {
                    var cfilter = Array.isArray(data) ? filter : (filter ? filter[key] : undefined);
                    if (cfilter === false) result[key] = undefined;
                    else if (typeof cfilter === 'function') {
                        result[key] = cfilter(data[key], data);
                    } else {
                        let rtn = NeutualizeType(data[key], cfilter, refDetect, key);
                        !isArray && (result[key] = rtn);
                        isArray && (rtn !== undefined) && (<any>result).push(rtn);
                    }
                } return result;
            } else {
                throw `Inner Error: ${type} is not accepted output type. key: ${hintKey}`;
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

export type StringLiteralDiff<T, U extends string | number | symbol> = ({[P in keyof T]: P } & {[P in U]: never } & { [x: string]: never })[keyof T];
export type Omit<T, K extends keyof T> = Pick<T, StringLiteralDiff<T, K>>;
export type ObjectDiff<T, U> = Pick<T, StringLiteralDiff<T, keyof U>>;

export interface ParseObjectJSONRule {
    [index: string]: ParseObjectJSONRule | null | ((any) => any);
}