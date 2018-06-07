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
        var paramExists = (params, keys: string[]): boolean => {
            if (keys.length === 0) return true;
            var key = keys.shift();
            var value = params[key];
            if (value) return paramExists(value, keys);
            return false;
        }

        var params = req.parameters;
        for (var keys of parameters) {
            var key: string[] = keys.split(".");
            if (!paramExists(params, key)) return Errors.throw(Errors.ParametersRequired, [keys]).resolve(res);
        }

        next();
    });
}
////////////////////////////////////////////////////////////

