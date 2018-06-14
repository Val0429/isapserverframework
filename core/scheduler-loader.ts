import * as Parse from 'parse/node';
import { waitServerReady } from './pending-tasks';
import { DynamicLoader } from './../helpers/dynamic-loader/dynamic-loader';
import { EventLogin, Events } from './events.gen';
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
                this.resolve(value);
            });
        console.log(`Schedule loaded with <${event}>, do <${actions.map(data => data.attributes.action).join(", ")}>.`);

        this.hashKey[value.id] && this.hashKey[value.id].unsubscribe();
        this.hashKey[value.id] = sj;
    }

    unregister(value: Schedulers) {
        this.hashKey[value.id] && this.hashKey[value.id].unsubscribe();
        this.hashKey[value.id] = undefined;
    }

    resolve(value: Schedulers) {
        var event = value.getValue("event");
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
    // var st = new ScheduleTimes({
    //     start: new Date(),
    //     end: new Date(),
    //     type: ScheduleTimeType.Minute,
    //     unitsOfType: 2,
    //     triggerInterval: 1000
    // });
    // await st.save();

    // var sa = new ScheduleActions({
    //     action: "ScheduleAction.SMS",
    //     data: ["0928240310"],
    //     template: "ScheduleTemplate.SMS"
    // });
    // await sa.save();
    // var sa2 = new ScheduleActions({
    //     action: "ScheduleAction.Email",
    //     data: ["val@unitedvouchers.com"],
    //     template: "ScheduleTemplate.Email"
    // });
    // await sa2.save();

    // var ss = new Schedulers({
    //     event: "EventLogin",
    //     time: st,
    //     action: [sa, sa2]
    // });
    // await ss.save();


    /// get all Schedulers
    var objs = await new Parse.Query(Schedulers)
        .include("time")
        .include("actions")
        .find();
    for (var obj of objs) {
        scheduler.register(obj);
    }

    // EventSubjects.EventLogin.subscribe( async (data) => {
    //     console.log('login!', data.attributes);
    //     await data.fetch();
    //     console.log('fetch!', data.attributes);
    // });

    // var ob = ScheduleHelper.scheduleObservable({
    //     start: new Date(2018,5,10,19,35,0),
    //     end: new Date(2018,5,10,19,36,0),
    //     type: ScheduleTimeType.Minute,
    //     unitsOfType: 2,
    //     triggerInterval: 1000
    // });
    // EventSubjects.EventLogin.withLatestFrom(ob)
    //     .filter( (value) => value[1] )
    //     .subscribe(([event, schedule]) => {
    //         console.log('triggered', event, schedule);
    //     });
        

});