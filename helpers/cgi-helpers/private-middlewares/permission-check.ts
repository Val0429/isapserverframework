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
        if (permissions.indexOf(<RoleList>req.role.get("name")) < 0) {
            Errors.throw(Errors.PermissionDenined).resolve(res);
        }
        next();
    });
}
////////////////////////////////////////////////////////////

