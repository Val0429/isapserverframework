import { Request } from 'express/lib/request';
declare module 'express/lib/request' {
    interface Request {
        parameters: any;
    }
}
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { bodyParserJson, bodyParser } from './../../middlewares/body-parser';
import { Errors } from 'core/errors.gen';


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

function parseQuery(queries: Request['query']) {
    let result = {};
    for (var query in queries) {
        var value = queries[query];
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
    return result;
}

export function VBodyParserJson(options = null): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction): any => {
        return bodyParser.json(options)(req, res, (err) => {
            if (err) return next( Errors.throw(Errors.CustomBadRequest, [`<JSON Parse Error> ${err.message}`]) );
            /// reduce down query
            req.parameters = { ...parseQuery(req.query), ...req.body };

            next();
        });
    })
}

export function VBodyParserRaw(options = null): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction): any => {
        !options && (options = {});
        !options.type && (options.type = "*/*");
        return bodyParser.raw(options)(req, res, (err) => {
            if (err) return next( Errors.throw(Errors.CustomBadRequest, [`<Raw Parse Error> ${err.message}`]) );
            /// reduce down query
            req.parameters = { ...parseQuery(req.query) };

            next();
        });
    })
}

////////////////////////////////////////////////////////////
