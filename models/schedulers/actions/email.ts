import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleActionBase } from './core';

/// email core /////////////////////////
export enum ScheduleActionEmailResult {
    Success = 0,
    Failed = 1
}

export interface IInputScheduleActionEmail {
    subject: string;
    body: string;
    to: string[];
    CC?: string[];
    BCC?: string[];
    attachments?: Parse.File[];
}
////////////////////////////////////////


@DynamicLoader.set("ScheduleAction.Email")
export class ScheduleActionEmail extends ScheduleActionBase<IInputScheduleActionEmail, ScheduleActionEmailResult> {

    constructor() {
        super();
        this.register( async (input) => {
            console.log('going to send email', input)
            return ScheduleActionEmailResult.Success;
        });
    }

}
