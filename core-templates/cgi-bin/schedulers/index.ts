import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects, ParseObject, getEnumKey, EventList
} from 'core/cgi-package';

import { IScheduleTimes, IScheduleActions, ISchedulers, Schedulers } from 'models/schedulers/schedulers.base';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

const filter = { event: (value) => getEnumKey(EventList, value) };

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ISchedulers>;
type OutputC = Restful.OutputC<ISchedulers>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Schedulers(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj, filter);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ISchedulers>;
type OutputR = Restful.OutputR<ISchedulers>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Schedulers)
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters, filter);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<ISchedulers>;
type OutputD = Restful.OutputD<ISchedulers>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Schedulers).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Schedulers <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj, filter);
});
/// CRUD end ///////////////////////////////////

export default action;
