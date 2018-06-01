import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';


import './../core.define';
import './../core';

/// permissionCheck ////////////////////////////////////////
export function permissionCheck(permissions: RoleList[]): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction) => {
        var roles = req.role.filter( (element) => permissions.indexOf(element.get("name")) >= 0 );

        if (roles.length == 0) return Errors.throw(Errors.PermissionDenined).resolve(res);
        next();
    });
}
////////////////////////////////////////////////////////////

