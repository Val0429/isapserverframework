import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';
import ast from './../../../services/ast-services/ast-client';

import './../core';

/// requiredParameters /////////////////////////////////////
declare module "helpers/cgi-helpers/core" {
    export interface ActionParam<T> {
        inputType: T;
    }

    export interface ActionConfig {
        /**
         * Replacement of `requiredParameters`.
         * `interface` of input type.
         * Default = null.
         */
        inputType?: string;
    }
}

declare module 'express/lib/request' {
    interface Request {
        inputType: any;
    }
}

export function inputType(caller: string, type: string): RequestHandler {
    return <any>(async (req: Request, res: Response, next: NextFunction) => {
        try {
            var rtn = await ast.requestValidation({
                path: caller,
                type
            }, req.parameters);

            req.inputType = rtn;
            /// replace after validation
            // req.parameters = {...req.parameters, ...rtn};

        } catch(reason) {
            return next( reason );
        }
        
        next();
    });
}

////////////////////////////////////////////////////////////
