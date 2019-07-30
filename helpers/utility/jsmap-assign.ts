/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

export function jsMapAssign<T, U>(map: Map<T, U>, key: T, defaultValue: Function = () => new Map()): U {
    do {
        if (map.has(key)) break;
        map.set(key, defaultValue() as any);
    } while(0);
    return map.get(key);
}
