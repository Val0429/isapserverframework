import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

/// R: get roles //////////////////////////
action.get( async (data) => {
    var roles = [];
    for (var key in RoleList) {
        roles.push(key);
    }
    return roles;
});
///////////////////////////////////////////

export default action;
