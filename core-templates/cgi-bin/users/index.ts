/*
 * Created on Tue Apr 29 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';
import * as path from "path";
import ast from 'services/ast-services/ast-client';
const userRolePath = path.resolve(process.cwd(), "./core/userRoles.gen.ts");

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

    /// 2) Check Role
    var roleNames: RoleList[] = data.inputType.roles;
    data.inputType.data = (await Promise.all(
        roleNames.map((role) => ast.requestValidation({ path: userRolePath, type: `IUser${getEnumKey(RoleList, role)}Data` }, data.parameters.data))
    )).reduce((final, value) => Object.assign(final, value), {});

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

    /// 2) Check Role
    var roleNames: RoleList[] = user.get("roles").map(r => r.get("name"));
    data.inputType.data = (await Promise.all(
        roleNames.map((role) => ast.requestValidation({ path: userRolePath, type: `PartialIUser${getEnumKey(RoleList, role)}Data` }, data.parameters.data))
    )).reduce((final, value) => Object.assign(final, value), user.get("data"));

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

    /// prevent delete self
    if (data.user.id == user.id) throw Errors.throw(Errors.CustomBadRequest, [`Cannot delete yourself.`]);
    /// prevent delete `Admin`
    if (user.attributes.username === "Admin") throw Errors.throw(Errors.CustomBadRequest, [`Cannot delete default account.`]);

    user.destroy({ useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});
///////////////////////////////////////////

export default action;
