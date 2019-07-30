/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from 'core/userRoles.gen';
import { Errors } from 'core/errors.gen';
import { APIPermissions, APIRoles, APITokens } from 'models/customRoles';
import { Log } from 'helpers/utility';

/// permissionCheck ////////////////////////////////////////
declare module "helpers/cgi-helpers/core" {
    export interface ActionConfig {
        /**
         * Is this action limit to specific api role?
         * Default = none.
         */
        apiToken?: string;
    }
}

const LogTitle = "API Permission Check";
enum EMethods {
    GET = 'R',
    POST = 'C',
    PUT = 'U',
    DELETE = 'D'
}

export function apiPermissionCheck(permission: string): RequestHandler {
    return <any>(async (req: Request, res: Response, next: NextFunction) => {
        let method = EMethods[req.method];
        let user = req.user;
        if (!method || !user) return next();

        /// 1) get API Token
        let token = await new Parse.Query(APITokens).equalTo("identifier", permission).first();
        if (!token) {
            Log.Error(LogTitle, `Token <${permission}> not exists.`);
            return next();
        }

        let roles = user.attributes.apiRoles || [];
        if (roles.length === 0) return next( Errors.throw(Errors.PermissionDenied) );

        /// 2) fetch api permissions
        let promises = [];
        for (let role of roles) {
            promises.push( APIPermissions.verify(token, role, method) );
        }
        let result = await Promise.all(promises);
        let final = result.reduce((final, value) => {
            return { ...final, ...value };
        }, {});

        if (!final[method]) return next( Errors.throw(Errors.PermissionDenied) );

        next();
    });
}
////////////////////////////////////////////////////////////

