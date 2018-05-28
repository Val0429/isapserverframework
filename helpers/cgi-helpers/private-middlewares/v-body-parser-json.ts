import { Request } from 'express/lib/request';
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
export function VBodyParserJson(req: Request, res: Response, next) {
    return bodyParserJson(req, res, () => {
        req.parameters = { ...req.params, ...req.body };
        next();
    });
}
////////////////////////////////////////////////////////////
