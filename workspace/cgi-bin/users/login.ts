import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson,
    UserHelper, getEnumKey, ParseObject,
} from './../../../core/cgi-package';


export interface Input {
    username: string;
    password: string;
}

export interface Output {
    sessionId: string;
    serverTime: Date;
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

    return {
        sessionId: obj.sessionId,
        serverTime: new Date(),
        user: ParseObject.toOutputJSON.call(obj.user, {
            roles: {
                name: UserHelper.transformHumanRoleName,
                users: null, roles: null, ACL: null,
            }
        })
    }
});

