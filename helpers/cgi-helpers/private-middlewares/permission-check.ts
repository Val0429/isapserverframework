import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from 'core/userRoles.gen';
import { Errors } from 'core/errors.gen';

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
        /// if permission is empty, pass.
        /// if login not required, pass.
        if (permissions.length === 0 || !req.role) return next();

        var roles = req.role.filter( (element) => permissions.indexOf(element.get("name")) >= 0 );

        if (roles.length == 0) return next( Errors.throw(Errors.PermissionDenied) );

        next();
    });
}
////////////////////////////////////////////////////////////

