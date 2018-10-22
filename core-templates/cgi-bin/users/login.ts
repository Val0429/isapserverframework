import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter
} from 'core/cgi-package';


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
    inputType: "Input",
})
.all( async (data) => {
    /// Try login
    var obj = await UserHelper.login(data.inputType);

    var ev = new EventLogin({
        owner: obj.user
    });
    Events.save(ev);

    return ParseObject.toOutputJSON({
        sessionId: obj.sessionId,
        serverTime: new Date(),
        user: obj.user
    });
});
