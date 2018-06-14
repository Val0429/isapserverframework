import { DynamicLoader } from './../../../helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from './../../../helpers/parse-server/parse-helper';
import { ScheduleActionBase, IScheduleActionBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

export type InputDataEmail = string[];

@DynamicLoader.set("ScheduleAction.Email")
export class ScheduleActionEmail extends ScheduleActionBase implements IScheduleActionBase {
    do(data: ISchedulersHandle<InputDataEmail>): void {
        console.log("todo send email", data.actions.data);
    }
}
