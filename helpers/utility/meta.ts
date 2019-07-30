/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

type IMeta = [Set<any> | object, object];
const metaCache: IMeta[] = [];

export namespace Meta {
    export function get(onObject: Set<any> | object): any;
    export function get<T>(onObject: Set<any> | object, key: string, def?: () => T): T;
    export function get<T>(onObject: Set<any> | object, key?: string, def?: () => T): any | T {
        let idx = metaCache.findIndex( (cache) => {
            let key = cache[0];
            if (!(key instanceof Set)) {
                return key === onObject;
            } else {
                if (!(onObject instanceof Set)) return false;
                /// compare Set
                return key.size === onObject.size && [...key].every( v => onObject.has(v) );
            }
        });
        let obj;
        if (idx >= 0) obj = metaCache[idx][1];
        else {
            obj = {};
            let cache: IMeta = [onObject, obj];
            metaCache.push(cache);
        }
        if (!key) return obj;

        let result = obj[key];
        if (result !== undefined) return result;
        if (!def) return;
        result = obj[key] = def();
        return result;
    }
}