import { RoleList, IRole } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';
import { config } from './../../../core/config.gen';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';


/// loginRequired //////////////////////////////////////////
export interface ActionParam<T> {
    session: Parse.Session;
    user: Parse.User;
    role: IRole;
}
declare module 'express/lib/request' {
    interface Request {
        session: Parse.Session;
        user: Parse.User;
        role: IRole;
    }
}
export async function loginRequired(req: Request, res: Response, next) {
    var sessionKey: string = config.server.keyOfSessionId;

    /// should contain sessionId
    var sessionId: string = req.parameters[sessionKey];
    if (!sessionId) {
        return Errors.throw(Errors.ParametersRequired, [sessionKey]).resolve(res);
    }

    var session: Parse.Session;
    var user: Parse.User;
    var role: Parse.Role;
    try {
        /// get session instance
        session = await new Parse.Query("_Session")
                .descending("createdAt")
                .include("user")
                .first({sessionToken: sessionId}) as Parse.Session;
            
        /// session not match
        if (!session || session.getSessionToken() != sessionId) {
            return Errors.throw(Errors.LoginRequired).resolve(res);
        }

        /// get user instance
        user = session.get("user");

        /// get user role
        role = await new Parse.Query(Parse.Role)
                .equalTo("users", user)
                .first() as Parse.Role;

    } catch(reason) {
        return Errors.throw(Errors.SessionNotExists).resolve(res);
    }

    /// final
    req.session = session;
    req.user = user;
    req.role = { name: role.get("name") };
    next();
}
////////////////////////////////////////////////////////////