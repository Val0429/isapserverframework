import { Request } from 'express/lib/request';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { bodyParserJson, bodyParser } from './../../middlewares/body-parser';

import './v-body-parser-json';

/// mergeParams --> + parameters ///////////////////////////
export function mergeParams(req: Request, res: Response, next: NextFunction) {
    req.parameters = { ...req.params, ...req.parameters };
    next();
}
////////////////////////////////////////////////////////////
