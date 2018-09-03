import { ScheduleActionBase } from './core';

import * as nodemailer from 'nodemailer';

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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export class ScheduleActionEmail extends ScheduleActionBase<IInputScheduleActionEmail, ScheduleActionEmailResult> {

    constructor() {
        super();
        this.register( async (input) => {
            let transporter = nodemailer.createTransport({
                host: 'mail.isapsolution.com',
                port: 25,
                secure: false,
                auth: {
                    user: "val.liu",
                    pass: "Aa123456"
                }
            });

            let mailOptions = {
                from: "val.liu@isapsolution.com",
                to: input.to.join(", "),
                subject: input.subject,
                html: input.body
            }
            await transporter.sendMail(mailOptions);

            return ScheduleActionEmailResult.Success;
        });
    }

}
