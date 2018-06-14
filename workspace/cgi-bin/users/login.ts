import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject,
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

    var ev = new EventLogin({
        owner: obj.user
    });
    await Events.save(ev);

    return {
        sessionId: obj.sessionId,
        serverTime: new Date().valueOf(),
        user: ParseObject.toOutputJSON.call(obj.user, UserHelper.ruleUserRole)
    }
});

