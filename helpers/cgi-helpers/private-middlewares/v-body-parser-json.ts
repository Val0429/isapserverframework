import { Request } from 'express/lib/request';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { bodyParserJson } from './../../middlewares/body-parser';


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

export const VBodyParserJson: RequestHandler = <any>((req: Request, res: Response, next: NextFunction): any => {
    return bodyParserJson(req, res, () => {
        req.parameters = { ...req.query, ...req.body };
        next();
    });
});

////////////////////////////////////////////////////////////
