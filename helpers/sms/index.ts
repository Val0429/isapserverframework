/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

const isWindows = process.platform === "win32";

let edge, sms;

if (isWindows) {
    edge = require('edge-js');

    sms = process.platform === "win32" ? edge.func({
        assemblyFile: `${__dirname}/lib/sms-dll.dll`,
        typeName: 'sms_dll.Startup',
        methodName: 'Invoke'
    }) : null;
}

export interface SMSCommand {
    comPort: string;
    phone: string;
    message: string;
    timeout: number;
}
export async function sendSMS(input: SMSCommand) {
    if (!isWindows) throw "SMS currently not support on Linux";
    return await sms(input);
}