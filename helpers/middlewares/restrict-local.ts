/*
 * Created on Tue Dec 30 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { Errors } from 'core/errors.gen';

/// restrictLocal ///////////////////////////////
const IPCheck = require("ipcheck");
let ipchecker = new IPCheck("127.0.0.1");
let localchecker = new IPCheck("::1");
export function restrictLocal(req: Request, res: Response, next: NextFunction) {
    let ip = req.connection.remoteAddress;
    if (!ipchecker.match(ip) && !localchecker.match(ip)) {
        return next( Errors.throw(Errors.PermissionDenied) );
    }
    next();
}
////////////////////////////////////////////////////////////

