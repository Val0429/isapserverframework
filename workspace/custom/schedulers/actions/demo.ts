import { DynamicLoader } from './../../../../helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from './../../../../helpers/parse-server/parse-helper';
import { ScheduleActionBase, IScheduleActionBase, ISchedulersHandle } from './../../../../models/schedulers/schedulers.base';

export type InputDataJustForDemo = string[];

@DynamicLoader.set("ScheduleAction.JustForDemo")
export class ScheduleActionJustForDemo extends ScheduleActionBase implements IScheduleActionBase {
    do(data: ISchedulersHandle<InputDataJustForDemo>): void {
        console.log("todo send email", data.actions.data);
    }
}
