import { ParseObject, registerSubclass, retrievePrimaryClass } from './../../helpers/parse-server/parse-helper';
import { IEvent } from './../events/events.base';
import { EventEnumType } from './../../core/events.gen';
export * from './actions/index';
export * from './templates/index';

export enum ScheduleTimeType {
    Minute = 0, Hour = 1, Day = 2, Week = 3
}

export interface IScheduleTimes {
    start: Date;
    end: Date;
    /**
     * if no type, there are no loops.
     */
    type?: ScheduleTimeType;
    /**
     * with type, you can give multiply on it.
     */
    unitsOfType?: number;
    triggerInterval?: number;
}
@registerSubclass() export class ScheduleTimes extends ParseObject<IScheduleTimes> {}

export interface IScheduleActions {
    action: string;
    /**
     * recipes?
     */
    data: any[];
    template: string;
}
@registerSubclass() export class ScheduleActions extends ParseObject<IScheduleActions> {}

export interface ISchedulersHandle<T> {
    event: ParseObject<IEvent>;
    time: ScheduleTimes;
    actions: IScheduleActions;
}

export interface ISchedulers {
    event: EventEnumType;
    time: ScheduleTimes;
    actions: ScheduleActions[];
}
@registerSubclass() export class Schedulers extends ParseObject<ISchedulers> {}



// import { IEvent } from './../events/events.base';
// import { ParseObject } from './../../helpers/parse-server/parse-helper';

// export class Schedulers {
//     event: ScheduleEvent;
//     time: IScheduleTime;
//     action: any;
// }

// // Schedulers.hook({
// //     start: new Date(0,0,1,0,0,0),
// //     end: new Date(0,0,1,1,0,0),
// //     type: "day",
// //     interval: 1
// // });

// export type ScheduleEvent = ParseObject<IEvent>;

// export enum ScheduleTimeType {
//     Minute = 0, Hour = 1, Day = 2, Week = 3
// }

// export interface ScheduleActionCallback { (event: ScheduleEvent, time: IScheduleTime, template: string): Promise<void>; }

// export interface IScheduleActionOptions {

// }

// export interface IScheduleAction {
//     type: ScheduleActionCallback;
//     template: string;
// }

// export namespace ScheduleAction {

//     export var SMS: ScheduleActionCallback = async (event, time, template) => {

//     }

//     export var Email: ScheduleActionCallback = async (event, time, template) => {

//     }

//     export var Http: ScheduleActionCallback = async (event, time, template) => {

//     }

//     export function Custom( func: ScheduleActionCallback ): ScheduleActionCallback {
//         return func;
//     }
// }

// var scheduleEvent = (event: ScheduleEvent, time: IScheduleTime, action: IScheduleAction) => {

// }

// scheduleEvent(null, {
//     start: new Date(0,0,1,0,0,0),
//     end: new Date(0,0,1,1,0,0),
//     type: ScheduleTimeType.Day,
//     unitsOfType: 1
// }, {
//     type: ScheduleAction.Custom( async (event, time) => {
        
//     }),
//     template: "123"
// });


// import { Observable, Subject, BehaviorSubject } from 'rxjs';

// /// published ob, share same timer
// // var obTimer = Observable.timer(0, 1000)
// //     .map( value => new Date() )
// //     .publish();
// var sjTimer = new BehaviorSubject<Date>(new Date());
// // Observable.timer(0, 1000)
// //     .map( value => new Date() )
// //     .subscribe(sjTimer);

// Observable.timer(0, 1000)
//     .map( value => getUTCDateKeepHours(new Date()) )
//     .subscribe(sjTimer);


// var min = 38;
// var start = new Date();
// // start.setMinutes(min);
// // start.setSeconds(0);
// start.setMinutes(0);
// start.setSeconds(0);
// var end = new Date();
// // end.setMinutes(min);
// // end.setSeconds(10);
// end.setMinutes(59);
// end.setSeconds(59);

// /// emit every time timer occurs
// var scheduleCheck = (value: Date): Observable<boolean> => {
//     if (value <= end && value >= start) return Observable.of(true);
//     return Observable.of(false);
// }

// function getUTCDateKeepHours(date: Date): Date {
//     return new Date(date.getTime() - date.getTimezoneOffset());
// }

// var obSchedule = Observable.from(sjTimer)
//     .switchMap<Date, boolean>( value => {
//         return scheduleCheck(value);
//     } )
//     .do(value => console.log("obSchedule log: ", value));
// // obSchedule.subscribe();

// /// fake event every 2 seconds
// var obEvent = Observable.interval(2000);

// /// important: Event triggered schedule
// // obEvent.withLatestFrom(obSchedule, (v1, v2) => {
// //     console.log("Event+Schedule", v1, v2);
// // })
// // .subscribe();

// /// important2: emit only if event triggers
// obEvent.switchMap( (event) => {
//     return scheduleCheck(sjTimer.getValue());
// })
// .do( (value) => console.log("important2", value) )
// // .subscribe();

// /// important3: 

// // Observable.from([obTimer, obEvent])
// //     .mergeMap((value) => {
// //         return Observable.of(value);
// //     })
// //     .do( value => console.log(value) )
// //     .subscribe();


// var sjTestSchedule = new BehaviorSubject(false);

// console.time("123");
// var result;
// for (var i=0; i<1000; ++i) {
//     // result = checkSchedule({
//     //     start: new Date(2018,5,13,0,30,0),
//     //     end: new Date(2018,5,13,0,40,0),
//     //     type: "hour",
//     //     interval: 1
//     // }, new Date());

//     // result = checkSchedule({
//     //     start: getUTCDateKeepHours( new Date(2018,5,10,15,30,0) ),
//     //     end: getUTCDateKeepHours( new Date(2018,5,10,15,58,0) ),
//     //     type: ScheduleTimeType.Day,
//     //     unitsOfType: 1
//     // }, new Date());

//     // result = checkSchedule({
//     //     start: new Date(2018,5,6,15,30,0),
//     //     end: new Date(2018,5,6,15,40,0),
//     //     type: "week",
//     //     interval: 1
//     // }, new Date());
// }
// console.timeEnd("123");
// // console.log(result);


//     Scheduler.scheduleObservable({
//         start: new Date(2018,5,10,19,35,0),
//         end: new Date(2018,5,10,19,36,0),
//         type: ScheduleTimeType.Minute,
//         unitsOfType: 2,
//         triggerInterval: 1000
//     })
//     .subscribe( (data) => {
//         console.log("!!!", data);
//     });
