import * as Parse from 'parse/node';
import { waitServerReady } from './pending-tasks';
import { DynamicLoader } from './../helpers/dynamic-loader/dynamic-loader';
import { EventLogin, Events, IEvent } from './events.gen';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { Config } from './config.gen';
import { EventSubjects } from './events.gen';
import { ScheduleHelper } from './../helpers/schedules/schedule-helper';
import { retrievePrimaryClass, ParseObject } from './../helpers/parse-server/parse-helper';
import { Schedulers, ScheduleTimeType, ScheduleTimes, ScheduleActions, ScheduleActionBase } from './../models/schedulers/schedulers.base';
import { Observable, Subscription } from 'rxjs';

class Scheduler {
    hashKey: { [index: string]: Subscription } = {};

    async register(value: Schedulers) {
        /// todo: currently only allow event + time(?)

        /// parse event
        let event = value.getValue("event");

        /// parse time
        let time = value.getValue("time");

        /// parse action
        let actions = value.getValue("actions");
        if (actions.length === 0) return;

        var ob = time ? ScheduleHelper.scheduleObservable(time.attributes, true) : Observable.of(true);
        let subject = EventSubjects[event];
        if (!subject) return;

        var sj = subject.withLatestFrom(ob)
            .filter( (value) => value[1])
            .subscribe(([event, schedule]) => {
                //console.log('???', event, schedule);
                /// resolve action
                this.resolve(value, event);
            });
        var previous = this.hashKey[value.id];
        console.log(`Schedule ${previous ? "re" : ""}loaded with <${event}>, do <${actions.map(data => data.attributes.action).join(", ")}>.`);

        previous && previous.unsubscribe();
        this.hashKey[value.id] = sj;
    }

    unregister(value: Schedulers) {
        this.hashKey[value.id] && this.hashKey[value.id].unsubscribe();
        this.hashKey[value.id] = undefined;
    }

    resolve(value: Schedulers, event: ParseObject<IEvent>) {
        //var event = value.getValue("event");
        var time = value.getValue("time");
        var actions = value.getValue("actions");

        for (var a of actions) {
            /// resolve action
            var attrs = a.attributes;
            var type: new (data) => ScheduleActionBase = DynamicLoader.get(attrs.action);
            if (!type) continue;
            var instance = new type({
                event, time,
                actions: attrs
            });
            (<any>instance.do)();
        }
    }
}
var scheduler = new Scheduler();

waitServerReady(async () => {
    /// get all Schedulers, register
    var objs = await new Parse.Query(Schedulers)
        .include("time")
        .include("actions")
        .find();
    for (var obj of objs) {
        scheduler.register(obj);
    }

    /// listen for Schedulers change
    // var instance = db.collection(event);
    // var stream = instance.watch();
    // stream.on("change", (change) => {
    //     if (change.operationType !== 'insert') return;
    //     var type = retrievePrimaryClass(event);
    //     var rtn: any = new type();
    //     rtn.id = change.documentKey._id;
    //     EventSubjects[event].next(rtn);
    // });
    
});