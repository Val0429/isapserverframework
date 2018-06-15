import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects
} from './../../../core/cgi-package';
import { DynamicLoader } from './../../../helpers/dynamic-loader/dynamic-loader';
import { ScheduleActionBase, ScheduleTemplateBase } from './../../../models/schedulers/schedulers.base';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.SystemAdministrator]
});

export interface Input {
    sessionId: string;
}
export type Output = string[];

action.get<Input, Output>( async (data) => {
    var results = [];
    for (var event in EventSubjects) results.push(event);
    return results;
});
/////////////////////////////////////////////////////

export default action;