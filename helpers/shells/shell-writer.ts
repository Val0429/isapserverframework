import * as fs from 'fs';
export default function shellWriter(detects: string[], target: string, ready: () => void) {
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