import { DynamicLoader } from './../../../../helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from './../../../../helpers/parse-server/parse-helper';
import { ScheduleTemplateBase, IScheduleTemplateBase, ISchedulersHandle } from './../../../../models/schedulers/schedulers.base';

import { InputDataJustForDemo } from './../actions/demo';

@DynamicLoader.set("ScheduleTemplate.InputDataJustForDemo")
export class ScheduleTemplateJustForDemo extends ScheduleTemplateBase implements IScheduleTemplateBase {
    async do(data: ISchedulersHandle<InputDataJustForDemo>) {
        return '';
    }
}
