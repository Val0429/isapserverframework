import { RoleList, IRole } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';

import config from './../../../workspace/config/default/core';
import './../core';

/// loginRequired //////////////////////////////////////////
declare module "helpers/cgi-helpers/core" {
    export interface ActionParam<T> {
        session: Parse.Session;
        user: Parse.User;
        role: Parse.Role[];
    }

    export interface ActionConfig {
        /**
         * Is this action require login?
         * Default = true.
         */
        loginRequired?: boolean;
    }
}

declare module 'express/lib/request' {
    interface Request {
        session: Parse.Session;
        user: Parse.User;
        role: Parse.Role[];
    }
}
export async function loginRequired(req: Request, res: Response, next: NextFunction) {
    var sessionKey: string = config.keyOfSessionId;

    /// should contain sessionId
    var sessionId: string = req.parameters[sessionKey];
    if (!sessionId) {
        return Errors.throw(Errors.ParametersRequired, [sessionKey]).resolve(res);
    }

    var session: Parse.Session;
    var user: Parse.User;
    var role: Parse.Role[];
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
                .find();

    } catch(reason) {
        return Errors.throw(Errors.SessionNotExists).resolve(res);
    }

    /// final
    req.session = session;
    req.user = user;
    req.role = role;
    next();
}
////////////////////////////////////////////////////////////



