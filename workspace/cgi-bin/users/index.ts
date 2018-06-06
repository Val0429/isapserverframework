import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject,
} from './../../../core/cgi-package';

import { Floors } from './../../custom/models/floors';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator]
});

/// get users //////////////////////
export interface InputGet {
    sessionId: string;
    username?: string;
}

export type OutputGet = Parse.User[];

action.get<InputGet, OutputGet>(async (data) => {
    /// get users
    var query = new Parse.Query(Parse.User);
    if (data.parameters.username) query.equalTo("username", data.parameters.username);
    var users = await query.find();
    if (users.length == 0) throw Errors.throw(Errors.RequestFailed);

    /// get roles
    for (var user of users) {
        /// get user role
        var roles = (await new Parse.Query(Parse.Role)
                .equalTo("users", user)
                .find())
                .map( (value) => {
                    return { name: getEnumKey(RoleList, value.get("name")) }
                });
        user.set("roles", roles);
    }

    return users;
});
////////////////////////////////////

/// create users ///////////////////
export interface InputPost extends IUser {
    sessionId: string;

    roles: RoleList[];
}
var userfields = ["username", "password", "email", "data"];

action.post<InputPost>({
    requiredParameters: ["username", "password", "roles"],
    },async (data) => {
    
    /// 1) Create Users
    let { sessionId, roles, ...remain } = data.parameters;
    let userdata = omitObject(remain, userfields);
    var user = new Parse.User();

    /// 2) Check Role
    var roleNames: string[] = [];
    for (var r of roles) {
        var name: string = RoleList[r];
        if (!name) throw Errors.throw(Errors.Custom, [`Role <${r}> not found.`]);
        roleNames.push(name);
    }

    /// 3) Signup Users
    user = await user.signUp(userdata, {useMasterKey: true});

    /// 4) Add to Role
    for (var name of roleNames) {
        var role = await new Parse.Query(Parse.Role)
            .equalTo("name", name)
            .first();
        role.getUsers().add(user);
        role.save(null, {useMasterKey: true});
    }
    
    return;
});
////////////////////////////////////

/// modify users ///////////////////
var usermfields = ["password", "email", "data"];
export interface InputPut extends IUser {
    sessionId: string;
}

action.put<InputPost>({
    requiredParameters: ["username"],
    },async (data) => {
    
    var { username } = data.parameters;
    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .equalTo("username", username)
        .first();
    if (!user) throw Errors.throw(Errors.Custom, [`User <${username}> not exists.`]);

    /// 2) Modify
    let userdata = omitObject(data.parameters, usermfields);
    await user.save(userdata, { useMasterKey: true });
    
    return;
});
////////////////////////////////////

/// delete users ///////////////////
export interface InputDelete extends IUser {
    sessionId: string;

    username: string;
}

action.delete<InputDelete>({
    requiredParameters: ["username"]
}, async (data) => {

    /// 1) Get User
    var { username } = data.parameters;
    var user = await new Parse.Query(Parse.User)
        .equalTo("username", data.parameters.username)
        .first();
    if (!user) throw Errors.throw(Errors.Custom, [`User <${username}> not exists.`]);

    user.destroy({ useMasterKey: true });

    return;
});
////////////////////////////////////

export default action;