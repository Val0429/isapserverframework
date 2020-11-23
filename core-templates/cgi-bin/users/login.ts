/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter
} from 'core/cgi-package';


interface IInputNormal {
    username: string;
    password: string;
}

interface IInputExtend {
    sessionId: string;
}

export type Input = IInputNormal | IInputExtend;

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
    let sessionId: string, user: Parse.User;
    if ('username' in data.inputType) {
        /// Try login
        try {
            var obj = await UserHelper.login(data.inputType);
            sessionId = obj.sessionId;
            user = obj.user;
    
            var ev = new EventLogin({
                owner: obj.user
            });
            Events.save(ev);

        } catch(e) {
            switch (e.code) {
                case 101:
                    throw Errors.throw(Errors.CustomUnauthorized, ["Invalid username/password."]);
                default:
                    throw e;
            }
        }

    } else {
        if (!data.session) throw Errors.throw(Errors.CustomUnauthorized, ["This session is not valid or is already expired."]);
        user = data.user;
        sessionId = data.session.getSessionToken();

    }

    return ParseObject.toOutputJSON({
        sessionId,
        serverTime: new Date(),
        user
    });
});
