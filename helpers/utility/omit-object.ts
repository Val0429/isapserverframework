/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

export function omitObject(value: object, keys: string[]) {
     return keys.reduce( (final, key) => (final[key] = value[key], final), {});
}