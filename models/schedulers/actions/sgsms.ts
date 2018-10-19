import { ScheduleActionBase } from './core';
import { sendSMS, SMSCommand } from 'helpers/sms';
import { Config } from 'core/config.gen';
import * as request from 'request';

import { ScheduleActionSMSResult } from './sms';
import { Log } from 'helpers/utility';

export interface IInputScheduleActionSGSMS_FromTemplate {
    message: string;
}

export interface IInputScheduleActionSGSMS_FromController {
    from: string;
    username: string;
    password: string;
    phone: string;
}

////////////////////////////////////////

export class ScheduleActionSGSMS extends ScheduleActionBase<
    IInputScheduleActionSGSMS_FromTemplate,
    IInputScheduleActionSGSMS_FromController,
    ScheduleActionSMSResult> {

    constructor() {
        super();
        this.register( async (input) => {
            if (!Config.sgsms.enable) return ScheduleActionSMSResult.Disabled;

            let url = `${Config.sgsms.url}?username=${input.username}&password=${input.password}&to=${encodeURIComponent(input.phone)}&from=${input.from}&message=${input.message}`;

            await new Promise( (resolve, reject) => {
                request({
                    url,
                    method: 'GET'
                }, (err, res, body) => {
                    /// temporarily show error
                    if (body.indexOf("ERROR") >= 0) {
                        Log.Error("SGSMS", body);
                    }
                    resolve();
                });
            });

            return ScheduleActionSMSResult.Success;
        });
    }

}
