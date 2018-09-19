import * as Parse from 'parse/node';
import { serverReady } from './pending-tasks';
import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin, Events, IEvent } from './events.gen';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { Config } from './config.gen';
import { EventSubjects, EventList } from './events.gen';
import { ScheduleHelper } from 'helpers/schedules/schedule-helper';
import { retrievePrimaryClass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Schedulers, ScheduleTimeType, IScheduleTimes, IScheduleActions, ScheduleControllerBase } from 'models/schedulers/schedulers.base';
export * from 'models/schedulers/schedulers.base';
export { EventList } from './events.gen';
export * from 'models/schedulers/schedulers.base';
import { EnumConverter } from 'helpers/utility/get-enum-key';
import { Observable, Subscription } from 'rxjs';

const uuidv1 = require('uuid/v1');

export class Scheduler {
    hashKey: { [index: string]: Subscription } = {};

    async register(value: Schedulers) {
        /// code hook will have no id, generate one.
        if (!value.id) value.id = uuidv1();

        /// parse event
        let event = value.getValue("event");
        let eventname = EnumConverter(EventList)(event);

        /// parse time
        let time = value.getValue("time");

        /// parse action
        let actions = value.getValue("actions");
        if (actions.length === 0) return;

        var ob = time ? ScheduleHelper.scheduleObservable(time, true) : Observable.of(true);
        let subject = EventSubjects[eventname];
        if (!subject) return;

        var sj = subject.withLatestFrom(ob)
            .filter( (value) => value[1])
            .subscribe(([event, schedule]) => {
                /// resolve action
                this.resolve(value, event);
            });
        var previous = this.hashKey[value.id];
        console.log(`Schedule ${previous ? "re" : ""}loaded with <${eventname}>, do <${actions.map(data => data.controller).join(", ")}>.`);

        previous && previous.unsubscribe();
        this.hashKey[value.id] = sj;
    }

    unregister(value: Schedulers) {
        this.hashKey[value.id] && this.hashKey[value.id].unsubscribe();
        this.hashKey[value.id] = undefined;
    }

    async resolve(value: Schedulers, event: ParseObject<IEvent>) {
        /// Call Action & Template right here
        var time = value.getValue("time");
        var actions = value.getValue("actions");
        /// load event data
        await event.fetch();

        for (var a of actions) {
            /// resolve 
            let { controller, data } = a;
            let type: new () => ScheduleControllerBase<any,any,any> = DynamicLoader.get(controller);
            if (!type) continue;
            let instance = new type();
            instance.do(event, data);
        }
    }
}
var scheduler = new Scheduler();
export default scheduler;

Config.mongodb.enable &&
(async () => {
    await serverReady;

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

})();
