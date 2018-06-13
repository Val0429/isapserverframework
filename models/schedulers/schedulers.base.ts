import { IEvent } from './../events/events.base';
import { ParseObject } from './../../helpers/parse-server/parse-helper';

export class Schedulers {
    event: ScheduleEvent;
    time: IScheduleTime;
    action: any;
}

// Schedulers.hook({
//     start: new Date(0,0,1,0,0,0),
//     end: new Date(0,0,1,1,0,0),
//     type: "day",
//     interval: 1
// });

export type ScheduleEvent = ParseObject<IEvent>;

export enum ScheduleTimeType {
    Hour = 0, Day = 1, Week = 2
}

export interface IScheduleTime {
    start: Date;
    end: Date;
    type: ScheduleTimeType;
    unitsOfType: number;
    triggerInterval?: number;
}

export interface ScheduleActionCallback { (event: ScheduleEvent, time: IScheduleTime, template: string): Promise<void>; }

export interface IScheduleActionOptions {

}

export interface IScheduleAction {
    type: ScheduleActionCallback;
    template: string;
}

export namespace ScheduleAction {

    export var SMS: ScheduleActionCallback = async (event, time, template) => {

    }

    export var Email: ScheduleActionCallback = async (event, time, template) => {

    }

    export var Http: ScheduleActionCallback = async (event, time, template) => {

    }

    export function Custom( func: ScheduleActionCallback ): ScheduleActionCallback {
        return func;
    }
}

var scheduleEvent = (event: ScheduleEvent, time: IScheduleTime, action: IScheduleAction) => {

}

scheduleEvent(null, {
    start: new Date(0,0,1,0,0,0),
    end: new Date(0,0,1,1,0,0),
    type: ScheduleTimeType.Day,
    unitsOfType: 1
}, {
    type: ScheduleAction.Custom( async (event, time) => {
        
    }),
    template: "123"
});


import { Observable, Subject, BehaviorSubject } from 'rxjs';

/// published ob, share same timer
// var obTimer = Observable.timer(0, 1000)
//     .map( value => new Date() )
//     .publish();
var sjTimer = new BehaviorSubject<Date>(new Date());
// Observable.timer(0, 1000)
//     .map( value => new Date() )
//     .subscribe(sjTimer);

Observable.timer(0, 1000)
    .map( value => getUTCDateKeepHours(new Date()) )
    .subscribe(sjTimer);


var min = 38;
var start = new Date();
// start.setMinutes(min);
// start.setSeconds(0);
start.setMinutes(0);
start.setSeconds(0);
var end = new Date();
// end.setMinutes(min);
// end.setSeconds(10);
end.setMinutes(59);
end.setSeconds(59);

/// emit every time timer occurs
var scheduleCheck = (value: Date): Observable<boolean> => {
    if (value <= end && value >= start) return Observable.of(true);
    return Observable.of(false);
}

function getUTCDateKeepHours(date: Date): Date {
    return new Date(date.getTime() - date.getTimezoneOffset());
}

var obSchedule = Observable.from(sjTimer)
    .switchMap<Date, boolean>( value => {
        return scheduleCheck(value);
    } )
    .do(value => console.log("obSchedule log: ", value));
// obSchedule.subscribe();

/// fake event every 2 seconds
var obEvent = Observable.interval(2000);

/// important: Event triggered schedule
// obEvent.withLatestFrom(obSchedule, (v1, v2) => {
//     console.log("Event+Schedule", v1, v2);
// })
// .subscribe();

/// important2: emit only if event triggers
obEvent.switchMap( (event) => {
    return scheduleCheck(sjTimer.getValue());
})
.do( (value) => console.log("important2", value) )
// .subscribe();

/// important3: 

// Observable.from([obTimer, obEvent])
//     .mergeMap((value) => {
//         return Observable.of(value);
//     })
//     .do( value => console.log(value) )
//     .subscribe();

/// important: Date must be UTC
function checkSchedule(options: IScheduleTime, date: Date): boolean {
    /// 1) prepare timestamp
    var dt = date.getTime(), st = options.start.getTime(), et = options.end.getTime();
    var dateDiffer = dt - st;
    var stedDiffer = et - st;

    /// 2) calculate magic number, by options.type + interval
    var magic = 0;
    const oneminute = 60*1000;
    const onehour = 60*oneminute;
    const oneday = 24*onehour;
    switch (options.type) {
        case ScheduleTimeType.Hour:
            magic = onehour; break;
        case ScheduleTimeType.Day:
            magic = oneday; break;
        case ScheduleTimeType.Week:
            magic = oneday*7; break;
        default:
            throw `${options.type} is not a valid schedule type`;
    }
    magic *= options.unitsOfType;
    
    /// 3) if not after beginning
    if (st > dt) return false;

    /// 4) normal calculation
    var padding = Math.floor((dt - st) / magic) * magic;
    if ( dt >= st + padding && dt <= et + padding ) return true;
    return false;
}

console.time("123");
var result;
for (var i=0; i<1000; ++i) {
    // result = checkSchedule({
    //     start: new Date(2018,5,13,0,30,0),
    //     end: new Date(2018,5,13,0,40,0),
    //     type: "hour",
    //     interval: 1
    // }, new Date());

    result = checkSchedule({
        start: getUTCDateKeepHours( new Date(2018,5,10,15,30,0) ),
        end: getUTCDateKeepHours( new Date(2018,5,10,15,58,0) ),
        type: ScheduleTimeType.Day,
        unitsOfType: 1
    }, new Date());

    // result = checkSchedule({
    //     start: new Date(2018,5,6,15,30,0),
    //     end: new Date(2018,5,6,15,40,0),
    //     type: "week",
    //     interval: 1
    // }, new Date());

}
console.timeEnd("123");
console.log(result);