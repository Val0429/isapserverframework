import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects
} from 'core/cgi-package';

import { ScheduleActionEmail, ScheduleActionEmailResult } from 'models/schedulers/actions';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.SystemAdministrator]
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