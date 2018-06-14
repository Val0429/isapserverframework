import { DynamicLoader } from './../../../helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from './../../../helpers/parse-server/parse-helper';
import { ScheduleTemplateBase, IScheduleTemplateBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

import { InputDataSMS } from './../actions/sms';

@DynamicLoader.set("ScheduleTemplate.SMS")
export class ScheduleTemplateSMS extends ScheduleTemplateBase implements IScheduleTemplateBase {
    async do(data: ISchedulersHandle<InputDataSMS>) {
        return '';
    }
}
