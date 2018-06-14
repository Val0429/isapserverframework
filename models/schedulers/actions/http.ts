import { DynamicLoader } from './../../../helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from './../../../helpers/parse-server/parse-helper';
import { ScheduleActionBase, IScheduleActionBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

/**
 * url
 */
export type InputDataHttp = string;

@DynamicLoader.set("ScheduleAction.Http")
export class ScheduleActionHttp extends ScheduleActionBase implements IScheduleActionBase {
    do(data: ISchedulersHandle<InputDataHttp>): void {
        
    }
}
