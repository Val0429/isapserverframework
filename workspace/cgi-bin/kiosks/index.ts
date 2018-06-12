import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful
} from './../../../core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator]
});

import {
    InputGet, OutputGet, funcGet,
    InputPost, OutputPost, funcPost,
    InputPut, OutputPut, funcPut,
    InputDelete, OutputDelete, funcDelete
} from './../users/index';

/// get users //////////////////////
action.get<InputGet, OutputGet>(funcGet(true));
////////////////////////////////////

/// create users ///////////////////
var userfields = ["username", "password", "email", "data"];
action.post<InputPost, OutputPost>({
    requiredParameters: ["username", "password", "roles", "data.kioskId", "data.kioskName"],
}, async (data) => {
    try {
        return await funcPost(true)(data);
    } catch(reason) {
        if (reason instanceof Parse.Error && reason.code === 203)
            throw Errors.throw(Errors.Custom, ["<data.kioskId> already exists."]);
        throw reason;
    }
});
////////////////////////////////////

/// modify users ///////////////////
var usermfields = ["password", "email", "data"];
action.put<InputPut, OutputPut>({
    requiredParameters: ["username"],
}, funcPut);
////////////////////////////////////

/// delete users ///////////////////
action.delete<InputDelete, OutputDelete>({
    requiredParameters: ["username"]
}, funcDelete);
////////////////////////////////////

export default action;