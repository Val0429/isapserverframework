// import {
//     IEventLogin, IEventLogout
// } from './events';
var tHeader = `
import * as Parse from 'parse/node';
import { registerSubclass, AsParseObject } from '../../helpers/Parse';
import { IEventEntity } from './definition/events.base';
import {{0}} from './../events';
`;

// export enum EventList {
//     Login = 1,
//     Logout = 2
// }
var tEnum = `
export enum EventList {
    {0}
}
`;

var tInterface = `
/// Event{1}: {0} //////////////////////////////////
export interface IEvent{0} extends IEventEntity {
    action: {1};
    {2}
}
@registerSubclass() export class Event{0} extends AsParseObject("Event{1}")<IEvent{0}> { constructor() { super({ action: {1} }) } }
////////////////////////////////////////////////////
`;
// // Events.Login = EventLogin;


function main(events: Array<[number, string, string] | [number, string]>): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    var tmp = [];
    // for (var event of events) {
    //     tmp.push(`IEvent${event[1]}`);
    // }
    tmpstr.push(
        tHeader.replace("{0}", tmp.join(", "))
               .replace(/^[\r\n]+/, '')
    );
    /////////////////////////////////////////////

    /// make enum ///////////////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(`${event[1]} = ${event[0]}`);
    }
    tmpstr.push(
        tEnum.replace("{0}", tmp.join(",\r\n    "))
    );
    /////////////////////////////////////////////

    /// make interface //////////////////////////
    var tmp = [];
    for (var event of events) {
        var attrs = <any>event[2] || '';
        attrs = attrs.replace(/^ {4,}/gm, '    ');
        tmp.push(
            tInterface.replace(/\{0\}/g, event[1])
                      .replace(/\{1\}/g, event[0].toString())
                      .replace(/\{2\}/g, attrs)
        );
    }
    tmpstr.push(tmp.join("\r\n"));
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../events.gen.ts`;
const tmplPath = `${__dirname}/events.template.ts`;
const defPath = `${__dirname}/events.define.ts`;
const customDefPath = `${__dirname}/../../../config/events/events.define.ts`;
import events from './events.define';
import cevents from './../../../config/events/events.define';
import * as fs from 'fs';

function writeIfChanges() {
    var st1;
    try { st1 = fs.statSync(genFilePath); }
    catch (e) { st1 = { mtime: new Date(0) } }
    var st2 = fs.statSync(defPath);
    var st3 = fs.statSync(tmplPath);
    var st4 = fs.statSync(customDefPath);
    if (st2.mtime >= st1.mtime || st3.mtime >= st1.mtime || st4.mtime >= st1.mtime) {
        var merged = [...events, ...cevents];
        fs.writeFileSync(genFilePath, main(merged), "UTF-8");
        console.log("<Generated> Event file updated!");
    }
}
writeIfChanges();