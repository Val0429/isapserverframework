/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

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

interface IAttachment {
    file: Parse.File;
    cid: string;
}

export interface IInputScheduleActionEmail_FromController {
    to: string[];
    CC?: string[];
    BCC?: string[];
    attachments?: (Parse.File | IAttachment)[];
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
                    let file = attachment instanceof Parse.File ? attachment : attachment.file;
                    let cid = attachment instanceof Parse.File ? undefined : attachment.cid;

                    let content = await FileHelper.downloadParseFile(file);
                    attachments.push({
                        filename: file.name(),
                        cid,
                        content
                    });
                }
            }

            let mailOptions = {
                from: Config.smtp.name ? `${Config.smtp.name} <${Config.smtp.email}>` : `${Config.smtp.email}`,
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
