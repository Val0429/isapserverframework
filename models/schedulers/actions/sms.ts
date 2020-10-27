/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { ScheduleActionBase } from './core';
import { sendSMS } from 'helpers/sms';
import { Config } from 'core/config.gen';

/// sms core /////////////////////////
export enum ScheduleActionSMSResult {
    Success = 0,
    Failed = 1,
    Disabled = -1
}

// export type IInputScheduleActionSMS = SMSCommand;
export interface SMSCommand {
    comPort: string;
    phone: string;
    message: string;
    timeout: number;
}

export interface IInputScheduleActionSMS_FromTemplate {
    message: string;
}

export interface IInputScheduleActionSMS_FromController {
    comPort: string;
    phone: string;
    timeout: number;
}

////////////////////////////////////////

export class ScheduleActionSMS extends ScheduleActionBase<
    IInputScheduleActionSMS_FromTemplate,
    IInputScheduleActionSMS_FromController,
    ScheduleActionSMSResult> {

    constructor() {
        super();
        this.register( async (input) => {
            if (!Config.sms.enable) return ScheduleActionSMSResult.Disabled;
            
            await sendSMS(input);

            return ScheduleActionSMSResult.Success;
        });
    }

}
