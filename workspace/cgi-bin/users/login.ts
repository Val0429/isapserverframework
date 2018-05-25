import {
    express, Request, Response, Router, WebSocket,
    IRole, IUser, RoleList, config,
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
    user: IUser;
    role: IRole;
}

export default new Action<Input, Output>({
    loginRequired: false,
    middlewares: []
})
.all(async (data) => {
    /// Check param requirement
    if (!data.parameters.username) return Errors.throw(Errors.ParametersRequired, ["username"]);

    /// Try login
    var obj = await UserHelper.login({ ...data.parameters });

    if (obj instanceof Errors) {
        return <Errors>obj;
    } else {
        return {
            sessionId: obj.sessionId,
            serverTime: new Date().valueOf(),
            role: { name: obj.role.get("name") },
            user: obj.user.attributes
        }
    }
});
