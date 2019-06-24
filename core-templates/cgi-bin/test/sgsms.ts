import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Config,
    Restful, EventSubjects
} from 'core/cgi-package';

import { ScheduleActionSGSMS, ScheduleActionSMSResult } from 'models/schedulers/actions';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.SystemAdministrator]
});

export interface Input {
    phone: string;
}

action.post<Input>({
    inputType: "Input"
}, async (data) => {
        // phone: data.inputType.phone,
        // message: "test message",
    let result = await new ScheduleActionSGSMS().do({
        from: 'iSap Corporation',
        message: "test message",
        phone: data.inputType.phone,
        username: Config.sgsms.username,
        password: Config.sgsms.password
    });

    return "";
});
/////////////////////////////////////////////////////

export default action;