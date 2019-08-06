/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

export function O<T>(someObject: T, defaultValue: T = {} as any as T) : T {
    const type = typeof someObject;
    if (someObject === null || someObject === undefined || type !== 'object')
        return defaultValue;
    else
        return someObject;
}


/// legacy
let NF = new Proxy(() => ({}), { get(target, name) { return NF } });

export function _O<T>(someObject: T, defaultValue: T = NF as any as T) : T {
    if (typeof someObject === 'undefined' || someObject === null)
        return defaultValue;
    else
        return someObject;
}
