import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper
} from './../../../core/cgi-package';

import { Floors } from './../../custom/models/floors';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator]
});

/// get users //////////////////////
export interface InputGet extends IInputPaging {
    sessionId: string;
    username?: string;
}

export type OutputGet = IOutputPaging<Parse.User[]> | Parse.User;

action.get<InputGet, OutputGet>(funcGet(false));

export function funcGet(kiosk: boolean) {
    return async (data) => {
        var kioskRole = await new Parse.Query(Parse.Role)
            .equalTo("name", RoleList.Kiosk)
            .first();

        var query = new Parse.Query(Parse.User).include("roles");
        if (kiosk) query.equalTo("roles", kioskRole);
        else query.notEqualTo("roles", kioskRole);
        if (data.parameters.username) {
            /// get users
            if (data.parameters.username) query.equalTo("username", data.parameters.username);
            var user = await query.first();
            if (!user) throw Errors.throw(Errors.Custom, [`User not exists <${data.parameters.username}>.`]);
            //await UserHelper.transformHumanRoles(user);
            return user;
        }

        //return Restful.SingleOrPagination<Parse.User>( query, data.parameters, async (data) => await UserHelper.transformHumanRoles(data) );
        return Restful.SingleOrPagination<Parse.User>( query, data.parameters );
    }
}

////////////////////////////////////

/// create users ///////////////////
export interface InputPost extends IUser {
    sessionId: string;
}
export type OutputPost = Parse.User;
var userfields = ["username", "password", "email", "data"];

action.post<InputPost, OutputPost>({
    requiredParameters: ["username", "password", "roles"],
}, funcPost(false));

export function funcPost(kiosk: boolean) {
    return async (data) => {
        /// 1) Create Users
        let { sessionId, roles, ...remain } = data.parameters;
        let userdata = omitObject(remain, userfields);
        var user = new Parse.User();

        /// 2) Check Role
        var roleNames: string[] = [];
        for (var r of <any>roles) {
            var name: string = RoleList[r];
            if (!name) throw Errors.throw(Errors.Custom, [`Role <${r}> not found.`]);
            /// available role check
            if (
                (!kiosk && name === RoleList.Kiosk) ||
                (kiosk && name !== RoleList.Kiosk)
            ) throw Errors.throw(Errors.Custom, [`Role <${r}> not available.`]);

            roleNames.push(name);
        }

        /// 3) Signup Users
        user = await user.signUp(userdata, {useMasterKey: true});

        /// 4) Add to Role
        var roleAry = [];
        for (var name of roleNames) {
            var role = await new Parse.Query(Parse.Role)
                .equalTo("name", name)
                .first();
            role.getUsers().add(user);
            role.save(null, {useMasterKey: true});
            roleAry.push(role);
        }

        /// 5) Add Role to User
        user.set("roles", roleAry);
        await user.save(null, { useMasterKey: true });

        /// 6) human roles
        //UserHelper.transformHumanRoles(user);

        return user;
    }
}
////////////////////////////////////

/// modify users ///////////////////
var usermfields = ["password", "email", "data"];
export interface InputPut extends IUser {
    sessionId: string;
}
export type OutputPut = Parse.User;

action.put<InputPut, OutputPut>({
    requiredParameters: ["username"],
}, funcPut);
export async function funcPut(data) {
    
    var { username } = data.parameters;
    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .equalTo("username", username)
        .first();
    if (!user) throw Errors.throw(Errors.Custom, [`User <${username}> not exists.`]);

    /// 2) Modify
    let userdata = omitObject(data.parameters, usermfields);
    await user.save(userdata, { useMasterKey: true });

    /// 3) human roles
    //UserHelper.transformHumanRoles(user);
    
    return user;
}
////////////////////////////////////

/// delete users ///////////////////
export interface InputDelete extends IUser {
    sessionId: string;

    username: string;
}
export type OutputDelete = Parse.User;

action.delete<InputDelete, OutputDelete>({
    requiredParameters: ["username"]
}, funcDelete);
export async function funcDelete(data) {

    /// 1) Get User
    var { username } = data.parameters;
    var user = await new Parse.Query(Parse.User)
        .equalTo("username", data.parameters.username)
        .first();
    if (!user) throw Errors.throw(Errors.Custom, [`User <${username}> not exists.`]);

    user.destroy({ useMasterKey: true });

    /// 2) human roles
    //UserHelper.transformHumanRoles(user);

    return user;
}
////////////////////////////////////

export default action;