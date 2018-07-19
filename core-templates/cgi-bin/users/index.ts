import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
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

    return Restful.Pagination(query, data.inputType);
});
///////////////////////////////////////////


/// U: modify users ///////////////////////
type InputU = Restful.InputU<IUser>;
type OutputU = Restful.OutputU<IUser>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    var { username } = data.inputType;

    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .equalTo("username", data.inputType.username)
        .first();
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${username}> not exists.`]);

    /// 2) Modify
    await user.save({
        ...data.inputType,
        /// ignore update of username, roles
        username: undefined, roles: undefined
    });

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


// var action = new Action({
//     loginRequired: true,
//     permission: [RoleList.SystemAdministrator]
// });

// /// get users //////////////////////
// export interface InputGet extends IInputPaging {
//     sessionId: string;
//     username?: string;
// }

// export type OutputGet = IOutputPaging<Parse.User[]> | Parse.User;

// action.get<InputGet, OutputGet>(funcGet(false));

// export function funcGet(kiosk: boolean) {
//     return async (data) => {
//         var kioskRole = await new Parse.Query(Parse.Role)
//             .equalTo("name", RoleList.Kiosk)
//             .first();

//         var query = new Parse.Query(Parse.User).include("roles");
//         if (kiosk) query.equalTo("roles", kioskRole);
//         else query.notEqualTo("roles", kioskRole);
//         if (data.parameters.username) {
//             /// get users
//             if (data.parameters.username) query.equalTo("username", data.parameters.username);
//             var user = await query.first();
//             if (!user) throw Errors.throw(Errors.CustomNotExists, [`User not exists <${data.parameters.username}>.`]);
//             return ParseObject.toOutputJSON.call(user, UserHelper.ruleUserRole);
//         }

//         return Restful.SingleOrPagination<Parse.User>( query, data.parameters, UserHelper.ruleUserRole );
//     }
// }

// ////////////////////////////////////

// /// create users ///////////////////
// export interface InputPost extends IUser {
//     sessionId: string;
// }
// export type OutputPost = Parse.User;
// var userfields = ["username", "password", "email", "data"];

// action.post<InputPost, OutputPost>({
//     requiredParameters: ["username", "password", "roles"],
// }, funcPost(false));

// export function funcPost(kiosk: boolean) {
//     return async (data) => {
//         /// 1) Create Users
//         let { sessionId, roles, ...remain } = data.parameters;
//         let userdata = omitObject(remain, userfields);
//         var user = new Parse.User();

//         /// 2) Check Role
//         var roleNames: string[] = [];
//         for (var r of <any>roles) {
//             var name: string = RoleList[r];
//             if (!name) throw Errors.throw(Errors.CustomNotExists, [`Role <${r}> not found.`]);
//             /// available role check
//             if (
//                 (!kiosk && name === RoleList.Kiosk) ||
//                 (kiosk && name !== RoleList.Kiosk)
//             ) throw Errors.throw(Errors.CustomInvalid, [`Role <${r}> not available.`]);

//             roleNames.push(name);
//         }

//         /// 3) Signup Users
//         user = await user.signUp(userdata, {useMasterKey: true});

//         /// 4) Add to Role
//         var roleAry = [];
//         for (var name of roleNames) {
//             var role = await new Parse.Query(Parse.Role)
//                 .equalTo("name", name)
//                 .first();
//             role.getUsers().add(user);
//             role.save(null, {useMasterKey: true});
//             roleAry.push(role);
//         }

//         /// 5) Add Role to User
//         user.set("roles", roleAry);
//         await user.save(null, { useMasterKey: true });

//         return ParseObject.toOutputJSON.call(user, UserHelper.ruleUserRole);
//     }
// }
// ////////////////////////////////////

// /// modify users ///////////////////
// var usermfields = ["password", "email", "data"];
// export interface InputPut extends IUser {
//     sessionId: string;
// }
// export type OutputPut = Parse.User;

// action.put<InputPut, OutputPut>({
//     requiredParameters: ["username"],
// }, funcPut);
// export async function funcPut(data) {
    
//     var { username } = data.parameters;
//     /// 1) Get User
//     var user = await new Parse.Query(Parse.User)
//         .equalTo("username", username)
//         .first();
//     if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${username}> not exists.`]);

//     /// 2) Modify
//     let userdata = omitObject(data.parameters, usermfields);
//     await user.save(userdata, { useMasterKey: true });

//     return ParseObject.toOutputJSON.call(user, UserHelper.ruleUserRole);
// }
// ////////////////////////////////////

// /// delete users ///////////////////
// export interface InputDelete extends IUser {
//     sessionId: string;

//     username: string;
// }
// export type OutputDelete = Parse.User;

// action.delete<InputDelete, OutputDelete>({
//     requiredParameters: ["username"]
// }, funcDelete);
// export async function funcDelete(data) {

//     /// 1) Get User
//     var { username } = data.parameters;
//     var user = await new Parse.Query(Parse.User)
//         .equalTo("username", data.parameters.username)
//         .first();
//     if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${username}> not exists.`]);

//     user.destroy({ useMasterKey: true });

//     return ParseObject.toOutputJSON.call(user, UserHelper.ruleUserRole);
// }
// ////////////////////////////////////

// export default action;