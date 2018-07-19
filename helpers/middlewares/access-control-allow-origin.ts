import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { Errors } from 'core/errors.gen';

/// accessControlAllowOrigin ///////////////////////////////
export function accessControlAllowOrigin(req: Request, res: Response, next: NextFunction) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if ('OPTIONS' === req.method) return res.sendStatus(200);
    next();
}
////////////////////////////////////////////////////////////

