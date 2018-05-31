import { Request } from 'express/lib/request';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { bodyParserJson, bodyParser } from './../../middlewares/body-parser';

import './../core.define';
import './../core';

/// BodyParser --> + parameters ////////////////////////////
declare module 'helpers/cgi-helpers/core' {
    export interface ActionParam<T> {
        parameters: T;
    }
}
declare module 'express/lib/request' {
    interface Request {
        parameters: any;
    }
}

// export const VBodyParserJson: RequestHandler = <any>((req: Request, res: Response, next: NextFunction): any => {
//     return bodyParserJson(req, res, () => {
//         req.parameters = { ...req.query, ...req.body };
//         next();
//     });
// });

export function VBodyParserJson(options = null): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction): any => {
        return bodyParser.json(options)(req, res, () => {
            req.parameters = { ...req.query, ...req.body };
            next();
        });
    })
}

////////////////////////////////////////////////////////////
