import { ParseObject } from "helpers/parse-server/parse-helper";

const OneSecond = 1000;
const OneMinute = OneSecond * 60;
const OneHour = OneMinute * 60;
const OneDay = OneHour * 24;
const OneWeek = OneDay * 7;

export enum EScheduleUnitRepeatType {
    NoRepeat = 0,
    Day = 10,
    Week = 30,
    Month = 50,
    Year = 100,
}

export enum EScheduleUnitRepeatEndType {
    NoStop = 1,
    Date = 2,
    TotalTimes = 3
}

export enum EScheduleUnitRepeatMonthType {
    ByDay,
    ByWeekday
}

/// repeat starter
interface IScheduleUnitRepeatStarterBase {
    type: EScheduleUnitRepeatType;
    value: number;
    /// 重複資料
    /// Day: never;
    /// Week: number[];
    /// Month: By this Day | By this Weekday
    /// Year: By this Day | By this Weekday
    data?: any;
}
interface IScheduleUnitRepeatStarter_Day extends IScheduleUnitRepeatStarterBase {
    type: EScheduleUnitRepeatType.Day;
    data?: never;
}
interface IScheduleUnitRepeatStarter_Week extends IScheduleUnitRepeatStarterBase {
    type: EScheduleUnitRepeatType.Week;
    data: number[];
}
interface IScheduleUnitRepeatStarter_Month extends IScheduleUnitRepeatStarterBase {
    type: EScheduleUnitRepeatType.Month;
    data: EScheduleUnitRepeatMonthType;
}
interface IScheduleUnitRepeatStarter_Year extends IScheduleUnitRepeatStarterBase {
    type: EScheduleUnitRepeatType.Year;
    data: EScheduleUnitRepeatMonthType;
}
type IScheduleUnitRepeatStarter = IScheduleUnitRepeatStarter_Day | IScheduleUnitRepeatStarter_Week | IScheduleUnitRepeatStarter_Month | IScheduleUnitRepeatStarter_Year;

/// repeat end
interface IScheduleUnitRepeatEndBase {
    endType: EScheduleUnitRepeatEndType;
    endValue?: any;
}
interface IScheduleUnitRepeatEnd_NoStop extends IScheduleUnitRepeatEndBase {
    endType: EScheduleUnitRepeatEndType.NoStop;
    endValue?: never;
}
interface IScheduleUnitRepeatEnd_Date extends IScheduleUnitRepeatEndBase {
    endType: EScheduleUnitRepeatEndType.Date;
    endValue: Date;
}
interface IScheduleUnitRepeatEnd_TotalTimes extends IScheduleUnitRepeatEndBase {
    endType: EScheduleUnitRepeatEndType.TotalTimes;
    endValue: number;
}
type IScheduleUnitRepeatEnd = IScheduleUnitRepeatEnd_NoStop | IScheduleUnitRepeatEnd_Date | IScheduleUnitRepeatEnd_TotalTimes;

/// no repeat
interface IScheduleUnitRepeat_NoRepeat /* extends IScheduleUnitRepeatStarterBase, IScheduleUnitRepeatEndBase */ {
    type: EScheduleUnitRepeatType.NoRepeat;
    value?: never;
    data?: never;
    endType?: never;
    endValue?: never;
}

/// summarize
type IScheduleUnitRepeat = IScheduleUnitRepeat_NoRepeat | (IScheduleUnitRepeatStarter & IScheduleUnitRepeatEnd);

interface IScheduleUnit {
    beginDate: Date;
    endDate: Date;
    fullDay: boolean;

    repeat: IScheduleUnitRepeat;
    /// 計算出來的結束時間
    calculatedEndDate?: Date;
}

export enum EPriority {
    Low = 10,
    Normal = 50,
    Exception = 70,
    Critical = 100
}

export interface ISchedule<Who, Where, What = string, How = string, Others = never> {
    priority: EPriority | number;

    who: Who;
    when: IScheduleUnit;
    where: Where;
    what?: What;
    how?: How;

    data?: Others;
}

export interface IScheduleTimeRange {
    start: Date;
    end?: Date;
}

/// Calendar
export interface ICalendarUnit<T> {
    start: Date;
    end: Date;
    data: T;
}

type ParseObjectClass = { new(...args): ParseObject<any> };
type InstanceType<T> = T extends { new(...args): infer A } ? A : never;

export class Schedule<T extends ISchedule<any, any, any, any, any>> extends ParseObject<T> {
    protected constructor(...args) {
        super(...arguments);
    }
}

export namespace Schedule {
    export function Of<
        Who, Where, What, How, Others,
        // Who extends ParseObjectClass | object,
        // Where extends ParseObjectClass | object,
        // What extends ParseObjectClass | object,
        // How extends ParseObjectClass | object,
        // Others extends ParseObjectClass | object,
        IS extends ISchedule<WhoT, WhereT, WhatT, HowT, OthersT>,

        WhoT = Who extends { new(): infer A } ? A : never,
        WhereT = Where extends { new(): infer A } ? A : never,
        WhatT = What extends { new(): infer A } ? A : never,
        HowT = How extends { new(): infer A } ? A : never,
        OthersT = Others extends { new(): infer A } ? A : never
    >(config: {
        who?: Who, where?: Where, what?: What, how?: How, others?: Others
    }) {
        let { who, where, what, how, others } = config;

        let Schd = class ScheduleImpl extends Schedule<IS> {
            /* protected */static who: Who = who;
            /* protected */static where: Where = where;
            /* protected */static what: What = what;
            /* protected */static how: How = how;
            /* protected */static others: Others = others;
            constructor(data: Partial<IS>) {
                super(data);
                /// default priority
                if (data && this.attributes.priority === undefined) this.setValue("priority", EPriority.Normal);
            }

            /// before save, calculate endDate
            // destroy<U extends Tree<T>>(this: U, options?: Parse.Object.DestroyOptions): Parse.Promise<this> {
            save(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
            save(key: string, value: any, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
            save(attrs: object, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
            save(arg1?, arg2?, arg3?): Parse.Promise<this> {
                let options = typeof arg1 === 'string' ? arg3 : arg2;
                let attrs = typeof arg1 === 'string' ? { [arg1]: arg2 } : arg1;
                if (attrs) this.set(attrs);
                /// calculate end date
                let calculatedEndDate = this.calculateEndDate();
                if (calculatedEndDate) this.setValue("when", { ...this.attributes.when, calculatedEndDate });
                return super.save(null, options);
            }

            /// private helpers ///////////////////////////////////////////
            /// calculate accurate end date of this schedule
            /// todo: half way
            /* private */calculateEndDate(): Date {
                let calculated = Cal.buildSingleSchedule(this, { start: new Date(1900,0,1), end: new Date(2100,0,1) }, EBuildScheduleRule.LastOnly);
                if (calculated === EBuildScheduleLast.EndLess || calculated.length === 0) return;
                console.log('calculated end?', calculated);
                return calculated[calculated.length-1].end;
            }
            ///////////////////////////////////////////////////////////////

            static async buildCalendar<M extends ScheduleImpl>(this: new(...args) => M, on: M[], timeRange?: IScheduleTimeRange);
            static async buildCalendar<M extends ScheduleImpl>(this: new(...args) => M, on: Who | Where | What | How, timeRange?: IScheduleTimeRange);
            static async buildCalendar<M extends ScheduleImpl>(this: new(...args) => M, on: M[] | Who | Where | What | How, timeRange?: IScheduleTimeRange) {
                let thisClass: { new(): M } = this;
                let query = new Parse.Query(thisClass);
                
                /// filter "on"
                let result: M[];
                if (Array.isArray(on)) result = on;
                else {
                    if (typeof who === 'function' && on instanceof who) query.equalTo("who", on);
                    else if (typeof where === 'function' && on instanceof where) query.equalTo("where", on);
                    else if (typeof what === 'function' && on instanceof what) query.equalTo("what", what);
                    else if (typeof how === 'function' && on instanceof how) query.equalTo("how", how);
                    result = await query.find();
                }

                /// filter "timeRange"
                if (!timeRange) timeRange = { start: new Date() };

                return new Cal(result, timeRange);
            }
        }

        let Cal = class Calendar<T extends InstanceType<typeof Schd>> {
            /*private */calendarUnits: ICalendarUnit<T>[];
            constructor(data: T[], timeRange: IScheduleTimeRange) {
                if (!timeRange.end) timeRange.end = timeRange.start;
                this.calendarUnits = data.reduce<ICalendarUnit<T>[]>( (final, schedule) => {
                    final.splice(0, 0, ...Cal.buildSingleSchedule(schedule, timeRange));
                    return final;
                }, []).sort( (a, b) => {
                    let astart = a.start.valueOf(), bstart = b.start.valueOf();
                    let aprio = a.data.attributes.priority, bprio = b.data.attributes.priority;
                    if (astart < bstart) return -1; if (astart > bstart) return 1;
                    if (aprio < bprio) return -1; if (aprio > bprio) return 1;
                    return 0;
                })
            }

            matchTime(date: Date, prioritize: boolean = true): ICalendarUnit<T>[] {
                let rtn: ICalendarUnit<T>[] = [];
                for (let unit of this.calendarUnits) {
                    if (date > unit.end) continue;
                    // console.log('comp', date, unit.start, date < unit.start);
                    if (date < unit.start) break;
                    rtn.push(unit);
                }
                if (prioritize) rtn.sort( (a, b) => b.data.attributes.priority - a.data.attributes.priority );
                return rtn;
            }

            /// find all matches calendar unit, in time range
            static buildSingleSchedule<T extends InstanceType<typeof Schd>>(schedule: T, timeRange: IScheduleTimeRange, rule?: EBuildScheduleRule.All): ICalendarUnit<T>[];
            static buildSingleSchedule<T extends InstanceType<typeof Schd>>(schedule: T, timeRange: IScheduleTimeRange, rule: EBuildScheduleRule.LastOnly): ICalendarUnit<T>[] | EBuildScheduleLast;
            static buildSingleSchedule<T extends InstanceType<typeof Schd>>(schedule: T, timeRange: IScheduleTimeRange, rule: EBuildScheduleRule.LastOnly): ICalendarUnit<T>[];
            /* private */static buildSingleSchedule<T extends InstanceType<typeof Schd>>(schedule: T, timeRange: IScheduleTimeRange, rule: EBuildScheduleRule = EBuildScheduleRule.All): ICalendarUnit<T>[] | EBuildScheduleLast {
                let rtn: ICalendarUnit<T>[] = [];
                
                let attrs = schedule.attributes;
                let when = attrs.when;

                /// this shows matches schedule: (depends on calculatedEndDate)
                /// when.calculatedEndDate > timeRange.start && when.beginDate < timeRange.end
                if ( !((!when.calculatedEndDate || when.calculatedEndDate > timeRange.start) && when.beginDate < timeRange.end) ) {
                    /// time range not match
                    return rtn;
                }
                /// rule: LastOnly
                if (rule === EBuildScheduleRule.LastOnly && when.repeat.endType === EScheduleUnitRepeatEndType.NoStop) return EBuildScheduleLast.EndLess;

                let makeOneCalendarUnit = (start: Date, end: Date, data: T) => rtn.push({ start, end, data });

                do {
                    /// shared value
                    let beginDate = new Date(when.beginDate);
                    let endDate = new Date(when.endDate);
                    if (when.fullDay === true) { beginDate.setHours(0,0,0,0); endDate.setHours(24,0,0,0); }

                    const nRefStart = timeRange.start.valueOf();
                    const nRefEnd = timeRange.end.valueOf();
                    let nStart = beginDate.valueOf();
                    let nEnd = endDate.valueOf();

                    /// 0) by repeat type - NoRepeat
                    if (when.repeat.type === EScheduleUnitRepeatType.NoRepeat) {
                        /// in range
                        if (nEnd > nRefStart && nStart < nRefEnd) {
                            makeOneCalendarUnit(new Date(nStart), new Date(nEnd), schedule);
                            break;
                        }
                    }

                    /// 1) by repeat type - By Day
                    if (when.repeat.type === EScheduleUnitRepeatType.Day) {
                        /// calculate first time range
                        let interval = when.repeat.value * OneDay;
                        let unit = Math.max( Math.floor((nRefStart - nEnd) / interval) + 1, 0 );
                        for (let i=0; ; ++unit, ++i) {
                            let start = nStart + (unit * interval);
                            let end = nEnd + (unit * interval);
                            if (start > nRefEnd) break;

                            /// end type = Date
                            if (when.repeat.endType === EScheduleUnitRepeatEndType.Date &&
                                start >= when.repeat.endValue.valueOf()) break;
                            /// end type = TotalTimes
                            if (when.repeat.endType === EScheduleUnitRepeatEndType.TotalTimes &&
                                i >= when.repeat.endValue) break;

                            makeOneCalendarUnit(new Date(start), new Date(end), schedule);

                            /// rule: FirstOnly
                            if (rule === EBuildScheduleRule.FirstOnly && rtn.length > 0) break;
                        }
                        break;
                    }

                    /// 2) by repeat type - By Week
                    if (when.repeat.type === EScheduleUnitRepeatType.Week) {
                        /// calculate first time range
                        /// 2.1) interval
                        let interval = [0];
                        const TotalWeekday = 7;
                        let total = 0;
                        let weekdays = Array.from(new Set(when.repeat.data)).sort();    /// weekdays unique & sort
                        let pairwise = (arr, func) => { for (var i=0; i < arr.length - 1; i++) func(arr[0], arr[i + 1]); }
                        pairwise(when.repeat.data, (cur, next) => { let value=next-cur; total+=value; interval.push(value); });
                        // if (total <= TotalWeekday) interval.push( (TotalWeekday-total)*OneDay + (when.repeat.value-1) * OneWeek );

                        /// 2.2) adjust nStart / nEnd to first weekday
                        let distance = (weekdays[0] - beginDate.getDay()) % 7;
                        nStart += distance * OneDay; nEnd += distance * OneDay;
                        let baseInterval = when.repeat.value * OneWeek;
                        let unit = Math.max( Math.floor((nRefStart - nEnd) / baseInterval)/* + 1*/, 0 );
                        main: for (let i=0; ; ++unit, ++i) {
                            for (let intval of interval) {
                                let start = nStart + (unit * baseInterval) + (intval * OneDay);
                                let end = nEnd + (unit * baseInterval) + (intval * OneDay);
                                if (start > nRefEnd) break main;
                                if (end <= nRefStart) continue;

                                /// end type = Date
                                if (when.repeat.endType === EScheduleUnitRepeatEndType.Date &&
                                    start >= when.repeat.endValue.valueOf()) break main;
                                /// end type = TotalTimes
                                if (when.repeat.endType === EScheduleUnitRepeatEndType.TotalTimes &&
                                    i >= when.repeat.endValue) break main;

                                makeOneCalendarUnit(new Date(start), new Date(end), schedule);

                                /// rule: FirstOnly
                                if (rule === EBuildScheduleRule.FirstOnly && rtn.length > 0) break main;
                            }
                        }
                        break;
                    }

                    /// 3) by repeat type - By Month
                    if (when.repeat.type === EScheduleUnitRepeatType.Month ||
                        when.repeat.type === EScheduleUnitRepeatType.Year) {

                        switch (when.repeat.data) {
                            case EScheduleUnitRepeatMonthType.ByDay: {
                                let specDay = beginDate.getDate();
                                let step = when.repeat.value;
                                let interval = when.endDate.valueOf() - when.beginDate.valueOf();
                                /// pick larger one for date reference
                                let refDate = timeRange.start > beginDate ? timeRange.start : beginDate;
                                
                                let tYear = refDate.getFullYear();
                                let tMonth = refDate.getMonth();
                                let tDate = refDate.getDate();
                                let tHour = beginDate.getHours();
                                let tMinute = beginDate.getMinutes();
                                let tSecond = beginDate.getSeconds();
                                let tMSecond = beginDate.getMilliseconds();
                                if (tDate > specDay) when.repeat.type === EScheduleUnitRepeatType.Month ? tMonth++ : tYear++;
                                tDate = specDay;
                                for (let i=0; ;
                                    when.repeat.type === EScheduleUnitRepeatType.Month ? tMonth+=step : tYear+=step,
                                     ++i) {
                                    let start = new Date(tYear, tMonth, tDate, tHour, tMinute, tSecond, tMSecond);
                                    let end = new Date(start.valueOf() + interval);
                                    if (start > timeRange.end) break;

                                    /// end type = Date
                                    if (when.repeat.endType === EScheduleUnitRepeatEndType.Date &&
                                        start >= when.repeat.endValue) break;
                                    /// end type = TotalTimes
                                    if (when.repeat.endType === EScheduleUnitRepeatEndType.TotalTimes &&
                                        i >= when.repeat.endValue) break;

                                    makeOneCalendarUnit(start, end, schedule);

                                    /// rule: FirstOnly
                                    if (rule === EBuildScheduleRule.FirstOnly && rtn.length > 0) break;
                                }

                            } break;
                            case EScheduleUnitRepeatMonthType.ByWeekday: {
                                const nthWeekdayOfMonth = (weekday: number, n: number, date: Date) => {
                                    date = new Date(date);
                                    date.setDate(1);
                                    let add = (weekday - date.getDay() + 7) % 7 + (n - 1) * 7;
                                    date.setDate(1 + add);
                                    return date;
                                }
                                const dateForMonthWeekdayNth = (date: Date): number => {
                                    let ref = new Date(date.getFullYear(), date.getMonth(), 1);
                                    return Math.floor( (date.getDate() + date.getDay() - ref.getDay()) / 7 ) + 1;
                                }

                                let specWeekday = beginDate.getDay();
                                let specNthWeekday = dateForMonthWeekdayNth(beginDate);
                                let step = when.repeat.value;
                                let interval = when.endDate.valueOf() - when.beginDate.valueOf();
                                /// pick larger one for date reference
                                let refDate = timeRange.start > beginDate ? timeRange.start : beginDate;

                                let tYear = refDate.getFullYear();
                                let tMonth = refDate.getMonth();
                                let tWeekday = beginDate.getDay();
                                let tNthWeekday = dateForMonthWeekdayNth(beginDate);
                                let tHour = beginDate.getHours();
                                let tMinute = beginDate.getMinutes();
                                let tSecond = beginDate.getSeconds();
                                let tMSecond = beginDate.getMilliseconds();
                                /// check weekday real date
                                if ( refDate > nthWeekdayOfMonth(tWeekday, tNthWeekday, new Date(tYear, tMonth, 1, tHour, tMinute, tSecond, tMSecond)) ) when.repeat.type === EScheduleUnitRepeatType.Month ? tMonth++ : tYear++;

                                for (let i=0; ;
                                    when.repeat.type === EScheduleUnitRepeatType.Month ? tMonth+=step : tYear+=step,
                                    ++i) {
                                    let start = nthWeekdayOfMonth(tWeekday, tNthWeekday, new Date(tYear, tMonth, 1, tHour, tMinute, tSecond, tMSecond));
                                    let end = new Date(start.valueOf() + interval);
                                    if (start > timeRange.end) break;

                                    /// end type = Date
                                    if (when.repeat.endType === EScheduleUnitRepeatEndType.Date &&
                                        start >= when.repeat.endValue) break;
                                    /// end type = TotalTimes
                                    if (when.repeat.endType === EScheduleUnitRepeatEndType.TotalTimes &&
                                        i >= when.repeat.endValue) break;

                                    makeOneCalendarUnit(start, end, schedule);

                                    /// rule: FirstOnly
                                    if (rule === EBuildScheduleRule.FirstOnly && rtn.length > 0) break;
                                }

                            } break;
                        }
                        break;

                        // /// calculate first time range
                        // let interval = when.repeat.value * OneDay;
                        // let unit = Math.max( Math.floor((nRefStart - nEnd) / interval) + 1, 0 );
                        // for (let i=0; ; ++unit, ++i) {
                        //     let start = nStart + (unit * interval);
                        //     let end = nEnd + (unit * interval);
                        //     if (start >= nRefEnd) break;

                        //     /// end type = Date
                        //     if (when.repeat.endType === EScheduleUnitRepeatEndType.Date &&
                        //         start >= when.repeat.endValue.valueOf()) break;
                        //     /// end type = TotalTimes
                        //     if (when.repeat.endType === EScheduleUnitRepeatEndType.TotalTimes &&
                        //         i >= when.repeat.endValue) break;

                        //     makeOneCalendarUnit(new Date(start), new Date(end), schedule);

                        //     /// rule: FirstOnly
                        //     if (rule === EBuildScheduleRule.FirstOnly && rtn.length > 0) break;
                        // }
                        // break;
                    }

                } while(0);

                return rtn;
            }

        }
        return Schd;
    }
}

// let tt: IScheduleUnit = {
//     beginDate: new Date(),
//     endDate: new Date(),
//     fullDay: false,
//     repeat: {
//         type: EScheduleUnitRepeatType.Month,
//         value: 1,
//         data: EScheduleUnitRepeatMonthType.ByDay,
//         endType: EScheduleUnitRepeatEndType.TotalTimes,
//         endValue: 1
//     }
// }

enum EBuildScheduleRule {
    All,
    FirstOnly,
    LastOnly
}

enum EBuildScheduleLast {
    EndLess
}