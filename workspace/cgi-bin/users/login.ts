import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson,
    UserHelper
} from './../../../core/cgi-package';


export interface Input {
    username: string;
    password: string;
}

export interface Output {
    sessionId: string;
    serverTime: number;
    user: Parse.User;
    role: Parse.Role;
}

export default new Action<Input, Output>({
    loginRequired: false,
    middlewares: []
})
.all(async (data) => {
    /// Check param requirement
    if (!data.parameters.username) throw Errors.throw(Errors.ParametersRequired, ["username"]);

    /// Try login
    var obj = await UserHelper.login({ ...data.parameters });

    return {
        sessionId: obj.sessionId,
        serverTime: new Date().valueOf(),
        role: obj.role,
        user: obj.user,
    }
});
