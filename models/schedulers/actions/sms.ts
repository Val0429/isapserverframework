import { ScheduleActionBase } from './core';
import { sendSMS, SMSCommand } from 'helpers/sms';

/// sms core /////////////////////////
export enum ScheduleActionSMSResult {
    Success = 0,
    Failed = 1
}

export type IInputScheduleActionSMS = SMSCommand;
////////////////////////////////////////

export class ScheduleActionSMS extends ScheduleActionBase<IInputScheduleActionSMS, ScheduleActionSMSResult> {

    constructor() {
        super();
        this.register( async (input) => {
            await sendSMS(input);

            return ScheduleActionSMSResult.Success;
        });
    }

}
