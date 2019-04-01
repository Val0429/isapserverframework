import { ScheduleActionBase } from './core';

import { Config } from 'core/config.gen';
import * as nodemailer from 'nodemailer';
import { FileHelper } from 'core/cgi-package';

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

            let attachments;
            if (input.attachments) {
                attachments = [];
                for (let attachment of input.attachments) {
                    let content = await FileHelper.downloadParseFile(attachment);
                    attachments.push({
                        filename: attachment.name(),
                        content
                    });
                }
            }

            let mailOptions = {
                from: Config.smtp.email,
                to: input.to.join(", "),
                subject: input.subject,
                html: input.body,
                attachments
            }
            await transporter.sendMail(mailOptions);

            return ScheduleActionEmailResult.Success;
        });
    }

}
