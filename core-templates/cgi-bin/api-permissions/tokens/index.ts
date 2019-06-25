import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { APIPermissions, APIRoles, APITokens, IAPIPermissions, IAPIRoles, IAPITokens } from 'models/customRoles';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IAPITokens>;
type OutputC = Restful.OutputC<IAPITokens>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new APITokens(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAPITokens>;
type OutputR = Restful.OutputR<IAPITokens>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(APITokens);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IAPITokens>;
type OutputU = Restful.OutputU<IAPITokens>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(APITokens).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`APITokens <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IAPITokens>;
type OutputD = Restful.OutputD<IAPITokens>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(APITokens).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`APITokens <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
