import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';

import './../core';

/// requiredParameters /////////////////////////////////////
declare module "helpers/cgi-helpers/core" {
    export interface ActionConfig {
        /**
         * Which parameter(s) are required?
         * Default = null.
         */
        requiredParameters?: string[];
    }
}

export function requiredParameters(parameters: string[]): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction) => {
        for (var parameter of parameters) {
            if (!req.parameters[parameter]) return Errors.throw(Errors.ParametersRequired, [parameter]).resolve(res);
        }

        next();
    });
}
////////////////////////////////////////////////////////////

