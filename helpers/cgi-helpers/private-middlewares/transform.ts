import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';

/// requiredParameters /////////////////////////////////////
export interface Transformer {
    (body: Buffer, mimeType?: string): any;
}

declare module "helpers/cgi-helpers/core" {
    export interface ActionConfig {
        /**
         * transform body by self.
         * Default = null.
         */
        transform?: Transformer;
    }
}

const keyOfHelp: string = "help";

export function transform(func: Transformer): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.parameters = { ...req.parameters, ...await func(req.body, req.headers['content-type']) };
        } catch(reason) {
            return next(reason);
        }
        next();
    }
}
////////////////////////////////////////////////////////////
