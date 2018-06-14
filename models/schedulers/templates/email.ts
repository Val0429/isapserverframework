import { DynamicLoader } from './../../../helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from './../../../helpers/parse-server/parse-helper';
import { ScheduleTemplateBase, IScheduleTemplateBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

import { InputDataEmail } from './../actions/email';

@DynamicLoader.set("ScheduleTemplate.Email")
export class ScheduleTemplateEmail extends ScheduleTemplateBase implements IScheduleTemplateBase {
    async do(data: ISchedulersHandle<InputDataEmail>) {
        return '';
    }
}
