import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { APIPermissions, APIRoles, APITokens, IAPIPermissions, IAPIRoles, IAPITokens } from 'models/customRoles';


interface ICAPIPermissions {
    token: APITokens;
    role: APIRoles;
    data: IAPIPermissions;
}

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ICAPIPermissions>;
type OutputC = Restful.OutputC<ICAPIPermissions>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    let { token, role, data: value } = data.inputType;

    /// 1) Create Object
    let result = await APIPermissions.set(token, role, value);
    /// 2) Output
    return ParseObject.toOutputJSON(result);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAPIPermissions>;
type OutputR = Restful.OutputR<IAPIPermissions>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(APIPermissions)
        .include("of").include("a").include("b").include("c").include("d");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IAPIPermissions>;
type OutputU = Restful.OutputU<IAPIPermissions>;

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
type InputD = Restful.InputD<IAPIPermissions>;
type OutputD = Restful.OutputD<IAPIPermissions>;

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
