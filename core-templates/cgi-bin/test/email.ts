/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects
} from 'core/cgi-package';

import { ScheduleActionEmail, ScheduleActionEmailResult } from 'models/schedulers/actions';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.SystemAdministrator]
});

export interface Input {
    email: string;
}

action.post<Input>({
    inputType: "Input"
}, async (data) => {
    let result = await new ScheduleActionEmail().do({
        subject: "test subject",
        body: "test body",
        to: [data.inputType.email]
    });

    return "";
});
/////////////////////////////////////////////////////

export default action;