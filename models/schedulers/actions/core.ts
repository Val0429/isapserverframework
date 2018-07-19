import { ISchedulersHandle } from './../schedulers.base';
import { ParseObject } from 'helpers/parse-server/parse-helper';

export interface IScheduleActionBase {
    do(data: ISchedulersHandle<any>): void | Promise<void>;
}

export class ScheduleActionBase implements IScheduleActionBase {
    constructor(data: ISchedulersHandle<any>) {
        this.do = this.do.bind(this, data);
    }

    do(data: ISchedulersHandle<any>): void | Promise<void>  { throw 'ScheduleAction should define do'; }
}
