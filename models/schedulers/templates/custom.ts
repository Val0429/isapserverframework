import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from 'helpers/parse-server/parse-helper';
import { ScheduleTemplateBase, IScheduleTemplateBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

@DynamicLoader.set("ScheduleTemplate.Custom")
export class ScheduleTemplateCustom extends ScheduleTemplateBase implements IScheduleTemplateBase {
    async do(data: ISchedulersHandle<any>) {
        return '';
    }
}
