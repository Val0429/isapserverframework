import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
    bodyParserJson
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
    try {
        var user: Parse.User = await Parse.User.logIn(data.parameters.username, data.parameters.password);
        /// Success
        var role = await new Parse.Query(Parse.Role)
                                .equalTo("users", user)
                                .first();

        return {
            sessionId: user.getSessionToken(),
            serverTime: new Date().valueOf(),
            role: { name: role.get("name") },
            user: user.attributes
        }

    } catch(reason) {
        return Errors.throw(Errors.RequestFailed);
    }
});
