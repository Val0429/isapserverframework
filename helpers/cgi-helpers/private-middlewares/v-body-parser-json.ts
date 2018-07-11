import { Request } from 'express/lib/request';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { bodyParserJson, bodyParser } from './../../middlewares/body-parser';

import './../core';

/// BodyParser --> + parameters ////////////////////////////
declare module 'helpers/cgi-helpers/core' {
    export interface ActionParam<T> {
        parameters: T;
    }

    export interface ActionConfig {
        /**
         * How many bytes allowed for the post body?
         */
        postSizeLimit?: number;
    }
}
declare module 'express/lib/request' {
    interface Request {
        parameters: any;
    }
}

export function VBodyParserJson(options = null): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction): any => {
        return bodyParser.json(options)(req, res, () => {
            /// reduce down query
            var result = {};
            for (var query in req.query) {
                var value = req.query[query];
                var paths = query.split(".");
                var base = result;
                for (var i=0; i<paths.length; ++i) {
                    var final = (i+1) >= paths.length;
                    var path = paths[i];
                    if (final) { base[path] = value; break; }
                    if (base[path]) base = base[path];
                    else base = base[path] = {};
                }
            }
            req.parameters = { ...result, ...req.body };

            next();
        });
    })
}

////////////////////////////////////////////////////////////
