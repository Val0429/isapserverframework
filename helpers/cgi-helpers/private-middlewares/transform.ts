/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';

/// requiredParameters /////////////////////////////////////
export interface Transformer<T> {
    (body: Buffer, mimeType?: string): T;
}

declare module "helpers/cgi-helpers/core" {
    export interface ActionConfig<T, U> {
        /**
         * transform body by self.
         * Default = null.
         */
        transform?: Transformer<Partial<T>>;
    }
}

const keyOfHelp: string = "help";

export function transform(func: Transformer<any>): RequestHandler {
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
