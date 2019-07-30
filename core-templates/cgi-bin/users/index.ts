/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator]
});


/// C: create users ///////////////////////
type InputC = Restful.InputC<IUser>;
type OutputC = Restful.OutputC<IUser>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Users
    var user = new Parse.User();
    var roles = data.inputType.roles;

    /// 2) Check Role
    var roleNames: RoleList[] = data.inputType.roles;

    /// 3) Signup Users
    user = await user.signUp({
        ...data.inputType,
        roles: undefined
    }, { useMasterKey: true });

    /// 4) Add to Role
    var roleAry = [];
    for (var name of roleNames) {
        var r = await new Parse.Query(Parse.Role)
            .equalTo("name", name)
            .first();
        r.getUsers().add(user);
        r.save(null, {useMasterKey: true});
        roleAry.push(r);
    }

    /// 5) Add Role to User
    user.set("roles", roleAry);
    await user.save(null, { useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});
///////////////////////////////////////////


/// R: get users //////////////////////////
type InputR = Restful.InputR<IUser>;
type OutputR = Restful.OutputR<IUser>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    var query = new Parse.Query(Parse.User)
        .include("roles");

    query = Restful.Filter(query, data.inputType);

    return Restful.Pagination(query, data.parameters);
});
///////////////////////////////////////////


/// U: modify users ///////////////////////
type InputU = Restful.InputU<IUser>;
type OutputU = Restful.OutputU<IUser>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    var { objectId } = data.inputType;

    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .include("roles")
        .get(objectId);
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${objectId}> not exists.`]);

    /// 2.0) Prepare params to feed in
    var input = { ...data.inputType };
    delete input.username;
    delete input.roles;
    /// 2) Modify
    await user.save(input, {useMasterKey: true});

    /// 3) Hide password
    user.set("password", undefined);

    return ParseObject.toOutputJSON(user);
});
///////////////////////////////////////////

/// D: delete users ///////////////////////
type InputD = Restful.InputD<IUser>;
type OutputD = Restful.OutputD<IUser>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .include("roles")
        .get(data.inputType.objectId);
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${data.inputType.objectId}> not exists.`]);

    user.destroy({ useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});
///////////////////////////////////////////

export default action;
