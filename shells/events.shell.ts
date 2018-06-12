import { shellWriter, autoPad } from './../helpers/shells/shell-writer';
import { Config } from './../models/events/events.define';

// import {
//     IEventLogin, IEventLogout
// } from './events';
var tHeader = `
import * as Parse from 'parse/node';
import { registerSubclass, ParseObject, Omit } from '../helpers/parse-server/parse-helper';
import { Events, IEvents, IEvent } from './../models/events/events.base';
export * from './../models/events/events.base';
`;

var tHeaderSpecial = `
import { {0} } from './../workspace/custom/models/index';
export * from './../workspace/custom/models/index';
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

// export type EventType<T> =
//     T extends 1 ? EventLogin :
//     T extends 2 ? EventLogout :
//     never;
var tType = `
export type EventType<T> =
{0}
    never;

export type EventsType<T> =
{1}
    never;
`;

var tInterface = `
/// Event{1}: {0} //////////////////////////////////
export interface IEvent{0} extends IEvent {
    action: {1};
    {2}
}
@registerSubclass() export class Event{0} extends ParseObject<IEvent{0}> { constructor(data?: Omit<IEvent{0}, 'action'>) { super({ action: {1}, ...data }) } }
////////////////////////////////////////////////////
`;
// // Events.Login = EventLogin;

function main(events: Config): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    tmpstr.push(
        tHeader.replace(/^[\r\n]+/, '')
    );
    /////////////////////////////////////////////

    /// make header special /////////////////////
    var tmp = [];
    for (var event of events) {
        if (event[3]) {
            tmp = [...tmp, ...event[3]];
        }
    }
    tmp = tmp.filter( (a, b, c) => c.indexOf(a) === b );
    tmpstr.push(
        tHeaderSpecial.replace("{0}", tmp.join(", "))
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

    /// make type ///////////////////////////////
    var tmp = [], tmp2 = [];
    for (var event of events) {
        tmp.push(
            "    T extends {0} ? Event{1} :".replace("{0}", event[0].toString())
                                        .replace("{1}", event[1])
            );
        tmp2.push(
            "    T extends {0} ? Events<IEvents<IEvent{1}>> :".replace("{0}", event[0].toString())
                                        .replace("{1}", event[1])
        );
    }
    tmpstr.push(
        tType.replace("{0}", tmp.join("\r\n")).replace("{1}", tmp2.join("\r\n"))
    );
    /////////////////////////////////////////////

    /// make interface //////////////////////////
    var tmp = [];
    for (var event of events) {
        var attrs = <any>event[2] || '';
        attrs = autoPad(attrs, 4);
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


const genFilePath = `${__dirname}/../core/events.gen.ts`;
const tmplPath = `${__dirname}/events.shell.ts`;
const defPath = `${__dirname}/../models/events/events.define.ts`;
const customDefPath = `${__dirname}/../workspace/define/events/events.define.ts`;

var events = require(defPath).default;
var cevents = require(customDefPath).default;
import * as fs from 'fs';

shellWriter(
    [defPath, tmplPath, customDefPath],
    genFilePath,
    () => {
        var merged: Config = <any>[...events, ...cevents];
        fs.writeFileSync(genFilePath, main(merged), "UTF-8");
        console.log("<Generated> Event file updated!");        
    }
);