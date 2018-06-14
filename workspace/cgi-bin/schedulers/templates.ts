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
    var list = DynamicLoader.all();
    for (var o in list) {
         list[o].prototype instanceof ScheduleTemplateBase && results.push(o);
    }
    return results;
});
/////////////////////////////////////////////////////

export default action;