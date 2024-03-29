/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Config,
    Restful, EventSubjects
} from 'core/cgi-package';

import { ScheduleActionSMS, ScheduleActionSMSResult } from 'models/schedulers/actions';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.SystemAdministrator]
});

export interface Input {
    phone: string;
}

action.post<Input>({
    inputType: "Input"
}, async (data) => {
    let result = await new ScheduleActionSMS().do({
        phone: data.inputType.phone,
        message: "test message",
        comPort: Config.sms.comPort,
        timeout: Config.sms.timeout
    });

    return "";
});
/////////////////////////////////////////////////////

export default action;