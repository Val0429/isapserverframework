/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { ScheduleActionBase } from './core';

import { Config, IConfig } from 'core/config.gen';
import * as nodemailer from 'nodemailer';
import { FileHelper } from 'helpers/parse-server/file-helper';


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

    constructor(config?: IConfig["smtp"]) {
        super();

        this.register( async (input) => {
            config = config || Config.smtp;
            if (!config.enable) return ScheduleActionEmailResult.Disabled;

            let transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.ssl,
                auth: {
                    user: config.email,
                    pass: config.password
                },
                tls: {
                    minVersion: "TLSv1"
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
                from: config.name ? `${config.name} <${config.email}>` : `${config.email}`,
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
