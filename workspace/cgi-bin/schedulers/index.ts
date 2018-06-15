import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects, InputRestfulR, OutputRestfulR
} from './../../../core/cgi-package';

import { IScheduleTimes, IScheduleActions, ISchedulers, Schedulers, ScheduleTimes, ScheduleActions } from './../../../models/schedulers/schedulers.base';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.SystemAdministrator]
});

/// C: create ///////////////////////////////////////
export interface InputPost {
    event: string;
    time?: IScheduleTimes;
    actions: IScheduleActions<any>[];
}
export type OutputPost = Schedulers;

action.post<InputPost, OutputPost>({
    requiredParameters: ["event", "actions", "actions.action", "actions.template", "actions.data"]
}, async (data) => {
    var { event, time, actions } = data.parameters;

    /// check event exists
    if (!EventSubjects[event]) throw Errors.throw(Errors.CustomNotExists, [`Event <${event}> not exists.`]);

    /// check action valid
    if (!Array.isArray(actions)) throw Errors.throw(Errors.CustomInvalid, [`<actions> should be array type.`]);

    var st = undefined;
    if (time) {
        if (time.start===undefined || time.end===undefined || time.type===undefined || time.unitsOfType===undefined)
            throw Errors.throw(Errors.CustomInvalid, [`Time object should contain <start, end, type, unitsOfType>.`]);

        time.start = new Date(time.start);
        time.end = new Date(time.end);
        st = new ScheduleTimes(time);
        await st.save();
    }

    var ars = [];
    for (var action of actions) {
        var sa = new ScheduleActions(action);
        ars.push(sa);
        await sa.save();
    }

    var ss = new Schedulers({
        event, actions: ars, time: st
    });
    await ss.save();

    return ss;
});
/////////////////////////////////////////////////////

/// R: get //////////////////////////////////////////
export type InputGet = InputRestfulR<{
    event?: string;
}>;
export type OutputGet = OutputRestfulR<ISchedulers>;

action.get<InputGet, OutputGet>(async (data) => {
    var params = data.parameters;
    var query = new Parse.Query(Schedulers).include("actions").include("time");
    params.event && query.equalTo("event", params.event);

    return await Restful.SingleOrPagination( query, params, null );
});
/////////////////////////////////////////////////////

export default action;