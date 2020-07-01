/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { bodyParserJson, bodyParser } from './../../middlewares/body-parser';


/// mergeParams --> + parameters ///////////////////////////
export function mergeParams(req: Request, res: Response, next: NextFunction) {
    var params = {};
    for (var key in req.params) {
        var value = req.params[key];
        if (+key == <any>key) continue;
        params[key] = value;
    }
    req.parameters = { ...params, ...req.parameters };
    next();
}
////////////////////////////////////////////////////////////
