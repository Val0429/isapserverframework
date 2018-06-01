import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey,
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
    /// Check param requirement

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

action.post<InputPost>(async (data) => {
    /// Check param requirement

    /// 1) Create Users
    //new Parse.User()
});
////////////////////////////////////

export default action;