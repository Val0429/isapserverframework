import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from 'helpers/parse-server/parse-helper';
import { ScheduleActionBase, IScheduleActionBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

/**
 * Array of sms recipes.
 */
export type InputDataSMS = string[];

@DynamicLoader.set("ScheduleAction.SMS")
export class ScheduleActionSMS extends ScheduleActionBase implements IScheduleActionBase {
    do(data: ISchedulersHandle<InputDataSMS>): void {
        console.log("todo send SMS", data.actions.data);
    }
}
