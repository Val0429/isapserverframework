/*
 * Created on Tue Apr 9 2021
 * Author: Val Liu
 * Copyright (c) 2021, iSAP Solution
 */

export namespace DateHelper {
    export function dayStart(date?: Date): Date {
        let o = new Date(date);
        o.setHours(0,0,0,0);
        return o;
    }

    export function dayEnd(date?: Date): Date {
        let o = new Date(date);
        o.setHours(23,59,59,999);
        return o;
    }
}
