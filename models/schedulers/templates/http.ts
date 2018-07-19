import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from 'helpers/parse-server/parse-helper';
import { ScheduleTemplateBase, IScheduleTemplateBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

import { InputDataHttp } from './../actions/http';

@DynamicLoader.set("ScheduleTemplate.Http")
export class ScheduleTemplateHttp extends ScheduleTemplateBase implements IScheduleTemplateBase {
    async do(data: ISchedulersHandle<InputDataHttp>) {
        return '';
    }
}
