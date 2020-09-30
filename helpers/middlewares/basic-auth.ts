import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { IPermissionCheck, RoleList } from 'core/userRoles.gen';
import { sharedMongoDB } from 'helpers/parse-server/parse-helper';
import * as Bcrypt from 'bcryptjs';

export function BasicAuth(permission: IPermissionCheck): RequestHandler {
    return async function BasicAuth(req: Request, res: Response, next: NextFunction) {
        try {
            let auth: string = req.get('Authorization');

            if (!auth) {
                res.set('WWW-Authenticate', 'Basic realm="User Visible Realm"');
                res.statusCode = 401;
                res.send('This action requires login.');
                return res;
            }

            auth = auth.split(' ')[1] || '';
            auth = Buffer.from(auth, 'base64').toString('ascii');

            let auths: string[] = auth.split(':');

            let account: string = auths[0] || '';
            let password: string = auths[1] || '';

            let db = await sharedMongoDB();

            let user: object = await db
                .collection('_User')
                .aggregate([{ $match: { username: account } }, { $lookup: { from: '_Role', localField: 'roles.objectId', foreignField: '_id', as: 'roles' } }])
                .next();
            if (!user) {
                res.statusCode = 401;
                res.send('Login failed.');
                return res;
            }

            let check = await Bcrypt.compare(password, user['_hashed_password']);
            if (!check) {
                res.statusCode = 401;
                res.send('Login failed.');
                return res;
            }

            let hasPermission: boolean = false;

            let roles: object[] = user['roles'];
            for (let i: number = 0; i < roles.length; i++) {
                let role = roles[i];

                if (role['name'] === RoleList.SystemAdministrator || !!permission && permission[role['name']]) {
                    hasPermission = true;
                    break;
                }
            }

            if (!hasPermission) {
                res.statusCode = 403;
                res.send('Permission denied.');
                return res;
            }

            next();
        } catch (e) {
            return next(e);
        }
    };
}
