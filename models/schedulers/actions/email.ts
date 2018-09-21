import { ScheduleActionBase } from './core';

import { Config } from 'core/config.gen';
import * as nodemailer from 'nodemailer';

/// email core /////////////////////////
export enum ScheduleActionEmailResult {
    Success = 0,
    Failed = 1,
    Disabled = -1
}

export interface IInputScheduleActionEmail_FromTemplate {
    subject: string;
    body: string;
}

export interface IInputScheduleActionEmail_FromController {
    to: string[];
    CC?: string[];
    BCC?: string[];
    attachments?: Parse.File[];
}
////////////////////////////////////////

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export class ScheduleActionEmail extends ScheduleActionBase<
    IInputScheduleActionEmail_FromTemplate,
    IInputScheduleActionEmail_FromController,
    ScheduleActionEmailResult> {

    constructor() {
        super();

        this.register( async (input) => {
            if (!Config.smtp.enable) return ScheduleActionEmailResult.Disabled;

            let transporter = nodemailer.createTransport({
                host: Config.smtp.host,
                port: Config.smtp.port,
                secure: false,
                auth: {
                    user: Config.smtp.email,
                    pass: Config.smtp.password
                }
            });

            let mailOptions = {
                from: Config.smtp.email,
                to: input.to.join(", "),
                subject: input.subject,
                html: input.body
            }
            await transporter.sendMail(mailOptions);

            return ScheduleActionEmailResult.Success;
        });
    }

}
