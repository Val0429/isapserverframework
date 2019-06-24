import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Config,
    Restful, EventSubjects
} from 'core/cgi-package';

import { ScheduleActionSMS, ScheduleActionSMSResult } from 'models/schedulers/actions';

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