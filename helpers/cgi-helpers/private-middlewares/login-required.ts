import { RoleList, IRole } from 'core/userRoles.gen';
import { Errors } from 'core/errors.gen';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';


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

const keyOfSessionId: string = "sessionId";
export async function loginRequired(req: Request, res: Response, next: NextFunction) {
    var sessionKey: string = keyOfSessionId;

    /// should contain sessionId
    var sessionId: string = req.parameters[sessionKey];
    if (!sessionId) return next( Errors.throw(Errors.ParametersRequired, [sessionKey]) );

    var session: Parse.Session;
    var user: Parse.User;
    var role: Parse.Role[];

    try {
        /// get session instance
        session = await new Parse.Query("_Session")
                .descending("createdAt")
                .include("user")
                .include("user.roles")
                .first({sessionToken: sessionId}) as Parse.Session;
            
        /// session not match
        if (!session || session.getSessionToken() != sessionId) return next( Errors.throw(Errors.LoginRequired) );

        /// get user instance
        user = session.get("user");

        /// get user roles
        role = user.get("roles");

    } catch(reason) {
        return next( Errors.throw(Errors.SessionNotExists) );
    }

    /// final
    req.session = session;
    req.user = user;
    req.role = role;
    
    next();
}
////////////////////////////////////////////////////////////



