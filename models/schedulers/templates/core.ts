import { ISchedulersHandle } from './../schedulers.base';
import { ParseObject } from './../../../helpers/parse-server/parse-helper';

export interface IScheduleTemplateBase {
    do(data: ISchedulersHandle<any>): string | Promise<string>;
}

export class ScheduleTemplateBase implements IScheduleTemplateBase {
    constructor(data: ISchedulersHandle<any>) {
        this.do = this.do.bind(this, data);
    }

    do(data: ISchedulersHandle<any>): string | Promise<string> { throw 'ScheduleTemplate should define do'; }
}
