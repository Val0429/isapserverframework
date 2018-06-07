import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson,
    UserHelper, getEnumKey
} from './../../../core/cgi-package';


export interface Input {
    username: string;
    password: string;
}

export interface Output {
    sessionId: string;
    serverTime: number;
    user: Parse.User;
}

export default new Action<Input, Output>({
    loginRequired: false,
    requiredParameters: ["username"],
    middlewares: []
})
.all(async (data) => {
    /// Try login
    var obj = await UserHelper.login({ ...data.parameters });

    /// Map role name back to human form
    var roles = obj.user.get("roles")
        .map( (role: Parse.Role) => {
            return { name: getEnumKey(RoleList, role.get("name")) }
        });
    obj.user.set("roles", roles);

    return {
        sessionId: obj.sessionId,
        serverTime: new Date().valueOf(),
        user: obj.user,
    }
});
