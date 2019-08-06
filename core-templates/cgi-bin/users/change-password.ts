import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Restful,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter, sharedMongoDB
} from 'core/cgi-package';

const bcrypt = require('bcryptjs');

export interface Input {
    oldPassword: string;
    newPassword: string;
}

export interface Output {
    sessionId: string;
    serverTime: Date;
    user: Parse.User;
}

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
})
.all( async (data) => {
    let { oldPassword, newPassword } = data.inputType;
    /// check old password
    let db = await sharedMongoDB();
    let col = db.collection("_User");
    let user = await col.findOne({
        username: data.user.get("username")
    });
    let same = await bcrypt.compare(oldPassword, user._hashed_password);

    /// 1.1) if failed, throw Errors
    if (!same) throw Errors.throw(Errors.CustomBadRequest, ["Old password not correct."]);

    /// 1.2) if success, change password
    data.user.setPassword(newPassword);
    await data.user.save(null, {useMasterKey: true});

    /// 2) output user
    return ParseObject.toOutputJSON({
        serverTime: new Date(),
        user: data.user
    });
});
