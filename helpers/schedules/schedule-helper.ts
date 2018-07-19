import { Observable, BehaviorSubject } from 'rxjs';
import { IScheduleTimes, ScheduleTimeType } from 'models/schedulers/schedulers.base';

export namespace ScheduleHelper {
    /**
     * Global time object.
     */
    // var sjGlobalTimer = new BehaviorSubject<Date>(getUTCNow());
    // Observable.timer(0, 1000)
    //     .map( value => getUTCNow() )
    //     .subscribe(sjGlobalTimer);

    var sjGlobalTimer = new BehaviorSubject<Date>(new Date());
    Observable.timer(0, 1000)
        .map( value => new Date() )
        .subscribe(sjGlobalTimer);

    /**
     * Schedule for Observable.
     */
    export function scheduleObservable(options: IScheduleTimes, isUTC: boolean = false): Observable<boolean> {
        // options = {...options};
        // if (!isUTC) {
        //     options.start = getUTCDateKeepHours(options.start);
        //     options.end = getUTCDateKeepHours(options.end);
        // }
        // let last = false;
        // let date = getUTCNow();

        // var rtn = Observable.from(sjGlobalTimer)
        //     .map( (date) => checkSchedule(options, date) );

        // if (options.triggerInterval) {
        //     rtn = rtn.filter( (value) => {
        //         try {
        //             if (value !== last) { date = getUTCNow(); return true; }
        //             else if (value === false) return false;
        //             else {
        //                 let ndate = getUTCNow();
        //                 if (ndate.getTime() - date.getTime() >= options.triggerInterval) { date = getUTCNow(); return true; }
        //                 return false;
        //             }
        //         } catch(e) {} finally { last = value; }
        //     });

        // } else {
        //     rtn = rtn.distinctUntilChanged();
        // }
        // return rtn;

        options = {...options};
        let last = false;
        let date = new Date();

        var rtn = Observable.from(sjGlobalTimer)
            .map( (date) => checkSchedule(options, date) );

        if (options.triggerInterval) {
            rtn = rtn.filter( (value) => {
                try {
                    if (value !== last) { date = new Date(); return true; }
                    else if (value === false) return false;
                    else {
                        let ndate = new Date();
                        if (ndate.getTime() - date.getTime() >= options.triggerInterval) { date = new Date(); return true; }
                        return false;
                    }
                } catch(e) {} finally { last = value; }
            });

        } else {
            rtn = rtn.distinctUntilChanged();
        }
        return rtn;

    }

    // function getUTCDateKeepHours(date: Date): Date {
    //     return new Date(date.getTime() - date.getTimezoneOffset());
    // }
    // function getUTCNow(): Date {
    //     return getUTCDateKeepHours( new Date() );
    // }

    /// important: Date must be same reference, all UTC or all local
    function checkSchedule(options: IScheduleTimes, date: Date): boolean {
        /// 1) prepare timestamp
        var dt = date.getTime(), st = options.start.getTime(), et = options.end.getTime();
        var dateDiffer = dt - st;
        var stedDiffer = et - st;

        /// 2) calculate magic number, by options.type + interval
        var magic = 1;
        if (options.type !== undefined && options.type !== null) {
            const oneminute = 60*1000;
            const onehour = 60*oneminute;
            const oneday = 24*onehour;
            switch (options.type) {
                case ScheduleTimeType.Minute:
                    magic = oneminute; break;
                case ScheduleTimeType.Hour:
                    magic = onehour; break;
                case ScheduleTimeType.Day:
                    magic = oneday; break;
                case ScheduleTimeType.Week:
                    magic = oneday*7; break;
                default:
                    throw `${options.type} is not a valid schedule type`;
            }
            magic *= options.unitsOfType || 1;
        }
        
        /// 3) if not after beginning
        if (st > dt) return false;

        /// 4) normal calculation
        var padding = Math.floor((dt - st) / magic) * magic;
        if ( dt >= st + padding && dt <= et + padding ) return true;
        return false;
    }    
}