import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';

import config from './../../../workspace/config/default/core';
import './../core';

/// permissionCheck ////////////////////////////////////////
declare module "helpers/cgi-helpers/core" {
    export interface ActionConfig {
        /**
         * Is this action limit to specific role?
         * Default = none.
         */
        permission?: RoleList[];
    }
}

export function permissionCheck(permissions: RoleList[]): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction) => {
        /// if login not required, pass.
        if (!req.role) { next(); return; }

        var roles = req.role.filter( (element) => permissions.indexOf(element.get("name")) >= 0 );

        if (roles.length == 0) return Errors.throw(Errors.PermissionDenined).resolve(res);
        next();
    });
}
////////////////////////////////////////////////////////////

