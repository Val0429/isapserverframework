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
                    debug && Log.Info("ScheduleHelper", `${name ? `${name}: `:''}wait for ${period/1000} seconds.`);
                }
            }
            doOnce();

            return () => { clearTimeout(timer); timer = null; }
        }).share();
    }
}
