import { Request } from 'express/lib/request';
import { RoleList } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';

/// permissionCheck ////////////////////////////////////////
export function permissionCheck(permissions: RoleList[]) {
    return (req: Request, res, next) => {
        if (permissions.indexOf(<RoleList>req.role.get("name")) < 0) {
            return Errors.throw(Errors.PermissionDenined).resolve(res);
        }
        next();
    }
}
////////////////////////////////////////////////////////////