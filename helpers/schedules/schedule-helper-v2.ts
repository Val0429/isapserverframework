/*
 * Created on Tue Aug 6 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Observable, BehaviorSubject } from 'rxjs';
import { Schedule, IScheduleUnit } from 'models/nodes';
import { Log } from 'helpers/utility';

const debug: boolean = true;

/// helper class
class ClassicSchedule extends Schedule.Of({}) {}


export namespace ScheduleHelperV2 {
    export function observe(schedule: IScheduleUnit, name?: string): Observable<any>;
    export function observe(schedule: IScheduleUnit[], name?: string): Observable<any>;
    export function observe(schedule: IScheduleUnit | IScheduleUnit[], name?: string): Observable<any> {
        if (!Array.isArray(schedule)) schedule = [schedule];
        const cschedule = schedule.map( (data) => {
            return new ClassicSchedule({ when: data });
        });

        return Observable.create( (subscriber) => {
            let timer;
            /// 1) build calendar
            let calendar, calendarUnits, nextCalendarUnits;
            let matched = false;

            let doOnce = async () => {
                let now = new Date();
                /// 1) build calendar
                if (!nextCalendarUnits || (nextCalendarUnits.length > 0 && nextCalendarUnits[0].start <= now)) {
                    calendar = await ClassicSchedule.buildCalendar(
                        cschedule
                    );
                    // console.log('rebuild calendar...', calendar);
                    calendarUnits = calendar.calendarUnits;
                    nextCalendarUnits = calendar.nextCalendarUnits;
                    matched = false;
                }

                /// 1.1) if matches, next
                if (!matched && calendar.matchTime(now).length > 0) {
                    subscriber.next(calendarUnits);
                    debug && Log.Info("ScheduleHelper", `${name ? `${name}: `:''}tick! ${JSON.stringify(calendarUnits)}`);
                    matched = true;
                }
                /// 1.2) if no next, complete
                if (nextCalendarUnits.length === 0) {
                    subscriber.complete();
                    return;
                } else {
                    /// 1.3) calculate next time
                    /// 1.3.1) if timer === null, stop
                    if (timer === null) return;
                    let period = nextCalendarUnits[0].start.valueOf() - now.valueOf();
                    /// minimum period = 1 hour or 5 seconds
                    const oneHour = 60*60*1000;
                    if (period > 5000) period = Math.min(oneHour, period / 2);
                    timer = setTimeout( () => {
                        doOnce();
                    }, period);
                    debug && Log.Info("ScheduleHelper", `${name ? `${name}: `:''}wait for: ${period}`);
                }
            }
            doOnce();

            return () => { clearTimeout(timer); timer = null; }
        }).share();

        // return Observable.create( (subscriber) => {
        //     let time = 0;
        //     let sj = new Subject<T>();
        //     let innerOb = real(sj);
        //     innerOb.subscribe((value) => {
        //         subscriber.next(value);
        //     }, err => subscriber.error(err), () => subscriber.complete());

        //     let subscription = source.subscribe( async (value: T) => {
        //         sj.next(value);

        //     }, err => subscriber.error(err), async () => {
        //         sj.complete();
        //     });
        
        //     return subscription;

        // }).share();
    }
}
    // /**
    //  * Global time object.
    //  */
    // // var sjGlobalTimer = new BehaviorSubject<Date>(getUTCNow());
    // // Observable.timer(0, 1000)
    // //     .map( value => getUTCNow() )
    // //     .subscribe(sjGlobalTimer);

    // var sjGlobalTimer = new BehaviorSubject<Date>(new Date());
    // Observable.timer(0, 1000)
    //     .map( value => new Date() )
    //     .subscribe(sjGlobalTimer);

    // /**
    //  * Schedule for Observable.
    //  */
    // export function scheduleObservable(options: IScheduleTimes, isUTC: boolean = false): Observable<boolean> {
    //     options = {...options};
    //     let last = false;
    //     let date = new Date();

    //     var rtn = Observable.from(sjGlobalTimer)
    //         .map( (date) => checkSchedule(options, date) );

    //     if (options.triggerInterval) {
    //         rtn = rtn.filter( (value) => {
    //             try {
    //                 if (value !== last) { date = new Date(); return true; }
    //                 else if (value === false) return false;
    //                 else {
    //                     let ndate = new Date();
    //                     if (ndate.getTime() - date.getTime() >= options.triggerInterval) { date = new Date(); return true; }
    //                     return false;
    //                 }
    //             } catch(e) {} finally { last = value; }
    //         });

    //     } else {
    //         rtn = rtn.distinctUntilChanged();
    //     }
    //     return rtn;

    // }

    // /// important: Date must be same reference, all UTC or all local
    // function checkSchedule(options: IScheduleTimes, date: Date): boolean {
    //     /// 1) prepare timestamp
    //     var dt = date.getTime(), st = options.start.getTime(), et = options.end.getTime();
    //     var dateDiffer = dt - st;
    //     var stedDiffer = et - st;

    //     /// 2) calculate magic number, by options.type + interval
    //     var magic = 1;
    //     if (options.type !== undefined && options.type !== null) {
    //         const oneminute = 60*1000;
    //         const onehour = 60*oneminute;
    //         const oneday = 24*onehour;
    //         switch (options.type) {
    //             case ScheduleTimeType.Minute:
    //                 magic = oneminute; break;
    //             case ScheduleTimeType.Hour:
    //                 magic = onehour; break;
    //             case ScheduleTimeType.Day:
    //                 magic = oneday; break;
    //             case ScheduleTimeType.Week:
    //                 magic = oneday*7; break;
    //             default:
    //                 throw `${options.type} is not a valid schedule type`;
    //         }
    //         magic *= options.unitsOfType || 1;
    //     }
        
    //     /// 3) if not after beginning
    //     if (st > dt) return false;

    //     /// 4) normal calculation
    //     var padding = Math.floor((dt - st) / magic) * magic;
    //     if ( dt >= st + padding && dt <= et + padding ) return true;
    //     return false;
    // }    
