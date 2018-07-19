import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ParseObject } from 'helpers/parse-server/parse-helper';
import { ScheduleActionBase, IScheduleActionBase } from './core';
import { ISchedulersHandle } from './../schedulers.base';

@DynamicLoader.set("ScheduleAction.Custom")
export class ScheduleActionCustom extends ScheduleActionBase implements IScheduleActionBase {
    do(data: ISchedulersHandle<any>): void {
        
    }
}
