import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects, ParseObject,
} from 'core/cgi-package';

import { IScheduleTimes, IScheduleActions, ISchedulers, Schedulers, ScheduleTimes, ScheduleActions } from 'models/schedulers/schedulers.base';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ISchedulers>;
type OutputC = Restful.OutputC<ISchedulers, { parseObject: false }>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Schedulers(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ISchedulers>;
type OutputR = Restful.OutputR<ISchedulers>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Schedulers)
        .include("actions")
        .include("time");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<ISchedulers>;
type OutputD = Restful.OutputD<ISchedulers>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Schedulers)
        .include("actions")
        .include("time")
        .get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Schedulers <${objectId}> not exists.`]);
    /// 2) Delete
    obj.getValue("time").destroy();
    obj.getValue("actions").forEach( (data) => data.destroy() );
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
