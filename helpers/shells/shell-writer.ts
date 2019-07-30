/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as fs from 'fs';

/**
 * Check for detects[] update time, chance to gen data, write to target.
 */
export function shellWriter(detects: string[], target: string, ready: () => void) {
    var dts: fs.Stats[] = [];
    for (var detect of detects) dts.push( fs.statSync(detect) );
    var tar: fs.Stats;
    try { tar = fs.statSync(target); }
    catch (e) { tar = <any>{ mtime: new Date(0) } }
    for (var dt of dts) {
        if (dt.mtime > tar.mtime) {
            ready();
            break;
        }
    }
}

export async function shellWriter2(path: string, data: string, ready: () => void) {
     var origin = fs.existsSync(path) ? fs.readFileSync(path, "UTF-8") : "";
     if (origin !== data) {
         fs.writeFileSync(path, data);
         ready();
     }
}


/**
 * Replace input, padding number of <value>'s spaces at front.
 */
export function autoPad(input: string, value: number) {
    return input.replace(
        new RegExp(`^ {0,}`, "gm"),
        Array(value+1).join(" ")
    );
}