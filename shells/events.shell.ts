/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { shellWriter, shellWriter2, autoPad } from 'helpers/shells/shell-writer';
import { Config } from 'models/events/events.define';

var tHeader = `
/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { registerSubclass, ParseObject, Omit } from 'helpers/parse-server/parse-helper';
import CollectionWatcher from 'helpers/mongodb/collection-watcher';
import { Events, IEvents, IEvent } from 'models/events/events.base';
export * from 'models/events/events.base';
`;

var tHeaderSpecial = `
import { {0} } from 'workspace/custom/models/index';
export * from 'workspace/custom/models/index';
`;

// export enum EventList {
//     Login = "1",
//     Logout = "2"
// }
var tEnum = `
export enum EventList {
    {0}
}
`;

// export type EventType<T> =
//     T extends "1" ? EventLogin :
//     T extends "2" ? EventLogout :
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

var tSubjects = `
import { serverReady } from './pending-tasks';
import { Config } from './config.gen';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { Subject } from 'rxjs';
import { retrievePrimaryClass } from 'helpers/parse-server/parse-helper';
import { promisify } from 'bluebird';
import { mongoDBUrl } from 'helpers/mongodb/url-helper';

export var EventSubjects: {
{0}
} = {
{1}
};

export var EventsSubject: Subject<Events> = new Subject<Events>();

(async () => {
    await serverReady;

    let { ip, port, collection } = Config.mongodb;
    const url = mongoDBUrl();
    let client = await MongoClient.connect(url, {useNewUrlParser: true});
    let db = client.db(collection);

    let events = [{2}];
    for (let event of events) {
        (await CollectionWatcher.watch(event))
            .subscribe( (change) => {
                if (change.operationType !== 'insert') return;
                var type = retrievePrimaryClass(event);
                var rtn: any = new type();
                rtn.id = change.documentKey._id;
                EventSubjects[event].next(rtn);
            });
    }

    (await CollectionWatcher.watch("Events"))
        .subscribe( (change) => {
            if (change.operationType !== 'insert') return;
            let rtn = new Events();
            rtn.id = change.documentKey._id;
            EventsSubject.next(rtn);
        });

    // for (let event of events) {
    //     var instance = db.collection(event);
    //     var stream = instance.watch();
    //     stream.on("change", (change) => {
    //         if (change.operationType !== 'insert') return;
    //         var type = retrievePrimaryClass(event);
    //         var rtn: any = new type();
    //         rtn.id = change.documentKey._id;
    //         EventSubjects[event].next(rtn);
    //     });
    // }

    // var instance = db.collection("Events");
    // var stream = instance.watch();
    // stream.on("change", (change) => {
    //     if (change.operationType !== 'insert') return;
    //     let rtn = new Events();
    //     rtn.id = change.documentKey._id;
    //     EventsSubject.next(rtn);
    // });

})();
`;


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
        tmp.push(`Event${event[1]} = "${event[0]}"`);
    }
    tmpstr.push(
        tEnum.replace("{0}", tmp.join(",\r\n    "))
    );
    /////////////////////////////////////////////

    /// make type ///////////////////////////////
    var tmp = [], tmp2 = [];
    for (var event of events) {
        tmp.push(
            "    T extends \"{0}\" ? Event{1} :".replace("{0}", event[0].toString())
                                        .replace("{1}", event[1])
            );
        tmp2.push(
            "    T extends \"{0}\" ? Events<IEvents<IEvent{1}>> :".replace("{0}", event[0].toString())
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
                      //.replace(/\{1\}/g, event[0].toString())
                      .replace(/\{1\}/g, `EventList.Event${event[1]}`)
                      .replace(/\{2\}/g, attrs)
        );
    }
    tmpstr.push(tmp.join("\r\n"));
    /////////////////////////////////////////////

    /// make subjects ///////////////////////////
    var tmp0 = [], tmp1 = [], tmp2 = [];
    for (var event of events) {
        var name = event[1];
        tmp0.push( `Event${name}: Subject<ParseObject<IEvent${name}>>` );
        tmp1.push( `Event${name}: new Subject<ParseObject<IEvent${name}>>()` );
        tmp2.push( `'Event${name}'` );
    }
    tmpstr.push(
        tSubjects.replace(/\{0\}/g, autoPad(tmp0.join(";\n"), 4))
                 .replace(/\{1\}/g, autoPad(tmp1.join(",\n"), 4))
                 .replace(/\{2\}/g, tmp2.join(","))
    );
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
import { Log } from 'helpers/utility';

shellWriter2(
    genFilePath,
    main([...events, ...cevents] as any),
    () => {
        Log.Info("Code Generator", "Event file updated!");
    }
);