/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

export namespace DynamicLoader {
    var classMap = {};

    export function set(name: string) {
        return (ctor) => {
            classMap[name] = ctor;
        }
    }

    export function get(name: string) {
        return classMap[name];
    }

    export function all() {
        return { ...classMap };
    }
}
